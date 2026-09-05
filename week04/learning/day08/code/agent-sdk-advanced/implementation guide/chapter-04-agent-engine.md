# Chapter 4 — Core Autonomous Agent Engine & Step Parsing

## 1. Chapter Goal

The goal of this chapter is to implement the central runtime engine—the **`Agent` Class**—inside `src/agent.ts`.

The `Agent` engine coordinates the entire life cycle of an agent interaction: validating input guardrails, constructing dynamic system prompts, calling OpenAI GPT-4o, parsing JSON step payloads (with regex fallbacks), invoking tool functions, executing output guardrails, and triggering agent handoffs.

In this chapter, we:
* Build `src/agent.ts`
* Implement robust JSON step parsing (`parseLLMOutput`)
* Support `HANDOFF`, `OUTPUT`, and `TOOL_REQUEST` step handlers
* Implement offline fallback simulation (`simulateOfflineStep`) for unconfigured API keys

---

### 🎯 Expected Outcome

`src/agent.ts` provides a complete, resilient agent execution engine.

```text
User query -> Input Guardrails -> LLM Loop -> Tool Dispatch / Handoff / Output -> Output Guardrails -> Return Outcome
```

---

## 2. Complete Implementation of `src/agent.ts`

### File Path

```text
agent-sdk-advanced/src/agent.ts
```

### Code

```typescript
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
        text: `[Offline Mode] Processed input with result: ${lastMsg.content}`,
      });
    }

    if (this.name === "TriageAgent") {
      if (q.includes("weather")) {
        return JSON.stringify({
          step: "HANDOFF",
          targetAgent: "WeatherAgent",
          reason: "Offline routing weather request to WeatherAgent.",
        });
      }
      if (q.includes("math") || q.includes("calculate") || q.includes("+")) {
        return JSON.stringify({
          step: "HANDOFF",
          targetAgent: "MathAgent",
          reason: "Offline routing math request to MathAgent.",
        });
      }
      if (q.includes("cli") || q.includes("shell") || q.includes("ls") || q.includes("mkdir")) {
        return JSON.stringify({
          step: "HANDOFF",
          targetAgent: "DevOpsAgent",
          reason: "Offline routing CLI request to DevOpsAgent.",
        });
      }
    }

    if (this.toolMap.size > 0) {
      const firstTool = Array.from(this.toolMap.values())[0];
      return JSON.stringify({
        step: "TOOL_REQUEST",
        functionName: firstTool.name,
        input: query,
      });
    }

    return JSON.stringify({
      step: "OUTPUT",
      text: `[Offline Mode] Response from agent '${this.name}' for query: "${query}"`,
    });
  }
}
```

---

## 3. Key Engine Features Breakdown

### 1. Robust JSON Step Parsing with Regex Fallback

LLM responses sometimes include markdown code fences (` ```json { ... } ``` `). `parseLLMOutput()` uses a regex match `{[\s\S]*\}` as a fallback when `JSON.parse` fails directly.

### 2. Offline Simulation Fallback (`simulateOfflineStep`)

When running in environments without a configured `OPENAI_API_KEY`, the agent automatically simulates step transitions (tool calls, handoffs, outputs) to enable unit testing and demonstrations.

---

## 4. Verification & Testing

Verify `src/agent.ts` compilation:

```bash
npm run build
```

Move to **Chapter 5** to build the Multi-Agent Swarm Orchestrator (`AgentSwarm`).
