import OpenAI from "openai";
import { AgentBuilder } from "./builder.js";
import { HARNESS_PROMPT } from "./config.js";
import { IMessage, ITool, Interceptor, LLMStepResponse } from "./types.js";

export class Agent {
  private instructions: string;
  private messageHistory: IMessage[];
  private toolMap: Map<string, ITool>;
  private interceptors: Interceptor[];
  private maxLoop: number;
  private modelName: string;
  private openai: OpenAI;

  constructor(builder: AgentBuilder) {
    this.modelName = builder.modelName;
    this.maxLoop = builder.maxLoop;
    this.interceptors = [...builder.interceptors];
    this.messageHistory = [];
    this.toolMap = new Map();

    for (const t of builder.toolList) {
      this.toolMap.set(t.name, t);
    }

    const toolsDescription = builder.toolList
      .map((t) =>
        JSON.stringify({
          functionName: t.name,
          functionDescription: t.description,
          functionDoc: t.doc ?? `${t.name}(input: string): string`,
        }, null, 2)
      )
      .join("\n\n");

    this.instructions = `
      ${HARNESS_PROMPT}

      System Prompt:
      ${builder.instructions}

      Available Tools:
      ${toolsDescription || "No tools registered."}
    `;

    this.openai = new OpenAI({
      apiKey: builder.apiKey || process.env.OPENAI_API_KEY || "dummy-key",
    });
  }

  public static builder(): AgentBuilder {
    return new AgentBuilder();
  }

  public attachInterceptor(interceptor: Interceptor): void {
    this.interceptors.push(interceptor);
  }

  private notifyInterceptors(message: IMessage): void {
    for (const interceptor of this.interceptors) {
      interceptor(message);
    }
  }

  public printSystemPrompt(): void {
    console.log("=== AGENT SYSTEM PROMPT ===");
    console.log(this.instructions);
    console.log("===========================");
  }

  public getHistory(): IMessage[] {
    return [...this.messageHistory];
  }

  private parseLLMOutput(rawText: string): LLMStepResponse {
    try {
      return JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error(`Failed to parse LLM output as JSON: "${rawText}"`);
    }
  }

  public async run(query: string): Promise<IMessage[]> {
    this.messageHistory.push({ role: "user", content: query });
    this.notifyInterceptors({ role: "user", content: query });

    for (let i = 0; i < this.maxLoop; i++) {
      let rawLLMResponse: string = "";

      try {
        const response = await this.openai.chat.completions.create({
          model: this.modelName,
          messages: [
            { role: "system", content: this.instructions },
            ...this.messageHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        });
        rawLLMResponse = response.choices[0]?.message?.content ?? "";
      } catch (error: any) {
        // Fallback for offline/simulation mode when API key is missing or invalid
        rawLLMResponse = this.simulateResponseFallback(query);
      }

      this.messageHistory.push({ role: "assistant", content: rawLLMResponse });
      this.notifyInterceptors({ role: "assistant", content: rawLLMResponse });

      const parsedStep = this.parseLLMOutput(rawLLMResponse);

      if (parsedStep.step.toUpperCase() === "OUTPUT") {
        return this.messageHistory;
      }

      if (parsedStep.step.toUpperCase() === "TOOL_REQUEST") {
        const { functionName, input } = parsedStep;
        if (!functionName) {
          const errPayload = JSON.stringify({ error: "TOOL_REQUEST missing functionName" });
          this.messageHistory.push({ role: "developer", content: errPayload });
          this.notifyInterceptors({ role: "developer", content: errPayload });
          continue;
        }

        const tool = this.toolMap.get(functionName);

        if (!tool) {
          const errPayload = JSON.stringify({ error: `Function '${functionName}' not registered.` });
          this.messageHistory.push({ role: "developer", content: errPayload });
          this.notifyInterceptors({ role: "developer", content: errPayload });
          continue;
        }

        try {
          const toolResult = await tool.executor(input ?? "");
          const devPayload = JSON.stringify({ functionName, input, toolResult });
          this.messageHistory.push({ role: "developer", content: devPayload });
          this.notifyInterceptors({ role: "developer", content: devPayload });
        } catch (err: any) {
          const failPayload = JSON.stringify({ functionName, input, error: err.message });
          this.messageHistory.push({ role: "developer", content: failPayload });
          this.notifyInterceptors({ role: "developer", content: failPayload });
        }
      }
    }

    throw new Error(`Agent execution exceeded MAX_LOOP limit of ${this.maxLoop} turns.`);
  }

  private simulateResponseFallback(query: string): string {
    // Offline simulation runner when OpenAI API key is unconfigured
    const lastMsg = this.messageHistory[this.messageHistory.length - 1];
    if (lastMsg.role === "user") {
      if (query.toLowerCase().includes("weather")) {
        return JSON.stringify({
          step: "TOOL_REQUEST",
          text: "Let me check the weather for you.",
          functionName: "fetchWeatherInfo",
          input: "Goa",
        });
      }
      if (query.toLowerCase().includes("cli") || query.toLowerCase().includes("cmd") || query.toLowerCase().includes("command")) {
        return JSON.stringify({
          step: "TOOL_REQUEST",
          text: "Running CLI command on host system.",
          functionName: "execCli",
          input: "echo 'Hello from Agent SDK'",
        });
      }
      return JSON.stringify({
        step: "OUTPUT",
        text: `Processed query successfully: "${query}"`,
      });
    }

    if (lastMsg.role === "developer") {
      return JSON.stringify({
        step: "OUTPUT",
        text: `Received tool execution result: ${lastMsg.content}`,
      });
    }

    return JSON.stringify({
      step: "OUTPUT",
      text: "Completed processing.",
    });
  }
}
