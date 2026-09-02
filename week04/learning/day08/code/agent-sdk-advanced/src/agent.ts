import OpenAI from "openai";
import { AgentBuilder } from "./builder.js";
import { HARNESS_PROMPT } from "./config.js";
import {
  AgentStepOutcome,
  HandoffPayload,
  IInputGuardrail,
  IMessage,
  IOutputGuardrail,
  ITool,
  Interceptor,
  LLMStepResponse,
} from "./types.js";

export class Agent {
  public readonly name: string;
  private instructions: string;
  private rawInstructions: string;
  private toolMap: Map<string, ITool>;
  private inputGuardrails: IInputGuardrail[];
  private outputGuardrails: IOutputGuardrail[];
  private interceptors: Interceptor[];
  private maxLoop: number;
  private modelName: string;
  private openai: OpenAI;

  constructor(builder: AgentBuilder) {
    this.name = builder.name;
    this.rawInstructions = builder.instructions;
    this.modelName = builder.modelName;
    this.maxLoop = builder.maxLoop;
    this.interceptors = [...builder.interceptors];
    this.inputGuardrails = [...builder.inputGuardrails];
    this.outputGuardrails = [...builder.outputGuardrails];
    this.toolMap = new Map();

    for (const t of builder.toolList) {
      this.toolMap.set(t.name, t);
    }

    const toolsDescription = builder.toolList
      .map((t) =>
        JSON.stringify(
          {
            functionName: t.name,
            functionDescription: t.description,
            functionDoc: t.doc ?? `${t.name}(input: string): string`,
          },
          null,
          2
        )
      )
      .join("\n\n");

    this.instructions = `
      ${HARNESS_PROMPT}

      Agent Identity: "${this.name}"
      System Prompt:
      ${builder.instructions}

      Available Tools for this Agent:
      ${toolsDescription || "No tools registered for this agent."}
    `;

    this.openai = new OpenAI({
      apiKey: builder.apiKey || process.env.OPENAI_API_KEY || "dummy-key",
    });
  }

  public static builder(name?: string): AgentBuilder {
    return new AgentBuilder(name);
  }

  public attachInterceptor(interceptor: Interceptor): void {
    this.interceptors.push(interceptor);
  }

  private notifyInterceptors(message: IMessage): void {
    for (const interceptor of this.interceptors) {
      interceptor(message, this.name);
    }
  }

  public printSystemPrompt(): void {
    console.log(`=== SYSTEM PROMPT FOR AGENT: ${this.name} ===`);
    console.log(this.instructions);
    console.log("=================================================");
  }

  private parseLLMOutput(rawText: string): LLMStepResponse {
    try {
      return JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error(`Failed to parse LLM output as JSON in agent '${this.name}': "${rawText}"`);
    }
  }

  public async run(query: string, existingHistory: IMessage[] = []): Promise<AgentStepOutcome> {
    // 1. Run Input Guardrails for this Agent
    for (const guardrail of this.inputGuardrails) {
      const result = await guardrail.validate(query, this.name);
      if (!result.passed) {
        throw new Error(
          `[GUARDRAIL REJECTED] Agent '${this.name}' input failed '${guardrail.name}': ${result.reason}`
        );
      }
    }

    const messageHistory: IMessage[] = [...existingHistory];

    // Append user query if not already the last turn
    const lastMsg = messageHistory[messageHistory.length - 1];
    if (!lastMsg || lastMsg.content !== query || lastMsg.role !== "user") {
      const userMsg: IMessage = { role: "user", content: query };
      messageHistory.push(userMsg);
      this.notifyInterceptors(userMsg);
    }

    for (let loopCount = 0; loopCount < this.maxLoop; loopCount++) {
      let rawLLMResponse: string = "";

      try {
        const response = await this.openai.chat.completions.create({
          model: this.modelName,
          messages: [
            { role: "system", content: this.instructions },
            ...messageHistory.map((m) => ({ role: m.role, content: m.content })),
          ],
        });
        rawLLMResponse = response.choices[0]?.message?.content ?? "";
      } catch {
        // Fallback for offline execution when API key is unconfigured
        rawLLMResponse = this.simulateOfflineStep(query, messageHistory);
      }

      const assistantMsg: IMessage = { role: "assistant", content: rawLLMResponse };
      messageHistory.push(assistantMsg);
      this.notifyInterceptors(assistantMsg);

      const parsedStep = this.parseLLMOutput(rawLLMResponse);

      // Check for HANDOFF Step from LLM
      if (parsedStep.step.toUpperCase() === "HANDOFF" && parsedStep.targetAgent) {
        const payload: HandoffPayload = {
          targetAgent: parsedStep.targetAgent,
          reason: parsedStep.reason || "Explicit handoff requested by LLM.",
        };
        return {
          type: "HANDOFF",
          handoffPayload: payload,
          history: messageHistory,
        };
      }

      // Check for OUTPUT Step
      if (parsedStep.step.toUpperCase() === "OUTPUT") {
        let finalOutputText = parsedStep.text || rawLLMResponse;

        // 2. Run Output Guardrails for this Agent
        for (const guardrail of this.outputGuardrails) {
          const result = await guardrail.validate(finalOutputText, this.name);
          if (!result.passed) {
            throw new Error(
              `[GUARDRAIL REJECTED] Agent '${this.name}' output failed '${guardrail.name}': ${result.reason}`
            );
          }
          if (result.modifiedContent) {
            finalOutputText = result.modifiedContent;
          }
        }

        return {
          type: "OUTPUT",
          output: finalOutputText,
          history: messageHistory,
        };
      }

      // Check for TOOL_REQUEST Step
      if (parsedStep.step.toUpperCase() === "TOOL_REQUEST") {
        const { functionName, input } = parsedStep;

        if (!functionName) {
          const errPayload = JSON.stringify({ error: "TOOL_REQUEST missing functionName" });
          const devMsg: IMessage = { role: "developer", content: errPayload };
          messageHistory.push(devMsg);
          this.notifyInterceptors(devMsg);
          continue;
        }

        const tool = this.toolMap.get(functionName);
        if (!tool) {
          const errPayload = JSON.stringify({ error: `Function '${functionName}' not registered on agent '${this.name}'.` });
          const devMsg: IMessage = { role: "developer", content: errPayload };
          messageHistory.push(devMsg);
          this.notifyInterceptors(devMsg);
          continue;
        }

        try {
          const toolResult = await tool.executor(input ?? "");
          const devMsg: IMessage = {
            role: "developer",
            content: JSON.stringify({ functionName, input, toolResult }),
          };
          messageHistory.push(devMsg);
          this.notifyInterceptors(devMsg);

          // Check if tool result is a transfer tool call
          try {
            const parsedToolResult = JSON.parse(toolResult);
            if (parsedToolResult.status === "HANDOFF_TRIGGERED") {
              return {
                type: "HANDOFF",
                handoffPayload: {
                  targetAgent: parsedToolResult.targetAgent,
                  reason: parsedToolResult.reason,
                },
                history: messageHistory,
              };
            }
          } catch {
            // normal string tool result
          }
        } catch (err: any) {
          const failMsg: IMessage = {
            role: "developer",
            content: JSON.stringify({ functionName, input, error: err.message }),
          };
          messageHistory.push(failMsg);
          this.notifyInterceptors(failMsg);
        }
      }
    }

    throw new Error(`Agent '${this.name}' exceeded MAX_LOOP limit of ${this.maxLoop} turns.`);
  }

  private simulateOfflineStep(query: string, history: IMessage[]): string {
    const q = query.toLowerCase();
    const lastMsg = history[history.length - 1];

    if (lastMsg.role === "developer") {
      return JSON.stringify({
        step: "OUTPUT",
        text: `Processed developer payload successfully in agent ${this.name}. Result: ${lastMsg.content}`,
      });
    }

    // Check for Handoff intent in query for simulation
    if (this.name === "TriageAgent" || this.name === "RouterAgent") {
      if (q.includes("weather")) {
        return JSON.stringify({
          step: "HANDOFF",
          targetAgent: "WeatherAgent",
          reason: "Query requires weather specialist.",
        });
      }
      if (q.includes("math") || q.includes("calculate") || q.includes("add")) {
        return JSON.stringify({
          step: "HANDOFF",
          targetAgent: "MathAgent",
          reason: "Query requires mathematics specialist.",
        });
      }
      if (q.includes("cli") || q.includes("command") || q.includes("dir") || q.includes("list")) {
        return JSON.stringify({
          step: "HANDOFF",
          targetAgent: "DevOpsAgent",
          reason: "Query requires DevOps command execution specialist.",
        });
      }
    }

    // Check for tool execution intents
    if (q.includes("weather") && this.toolMap.has("fetchWeatherInfo")) {
      return JSON.stringify({
        step: "TOOL_REQUEST",
        functionName: "fetchWeatherInfo",
        input: "Goa",
      });
    }

    if ((q.includes("math") || q.includes("calculate") || q.includes("2 + 2")) && this.toolMap.has("evaluateMathExpression")) {
      return JSON.stringify({
        step: "TOOL_REQUEST",
        functionName: "evaluateMathExpression",
        input: "2 + 2 * 10",
      });
    }

    if ((q.includes("cli") || q.includes("command")) && this.toolMap.has("execCli")) {
      return JSON.stringify({
        step: "TOOL_REQUEST",
        functionName: "execCli",
        input: "echo 'Agent SDK Advanced CLI Response'",
      });
    }

    if (q.includes("knowledge") && this.toolMap.has("searchKnowledgeBase")) {
      return JSON.stringify({
        step: "TOOL_REQUEST",
        functionName: "searchKnowledgeBase",
        input: "agent sdk",
      });
    }

    return JSON.stringify({
      step: "OUTPUT",
      text: `[${this.name}] Successfully processed query: "${query}"`,
    });
  }
}
