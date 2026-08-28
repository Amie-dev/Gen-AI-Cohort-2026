import { GoogleGenerativeAI } from "@google/generative-ai";
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
  private apiKey: string;
  private genAI: GoogleGenerativeAI | null = null;

  constructor(builder: AgentBuilder) {
    this.modelName = builder.modelName || "gemini-1.5-flash";
    this.maxLoop = builder.maxLoop;
    this.interceptors = [...builder.interceptors];
    this.messageHistory = [];
    this.toolMap = new Map();
    this.apiKey = builder.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

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

    if (this.apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
      } catch {
        this.genAI = null;
      }
    }
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
    console.log("=== GEMINI AGENT SYSTEM PROMPT ===");
    console.log(this.instructions);
    console.log("==================================");
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
      throw new Error(`Failed to parse Gemini output as JSON: "${rawText}"`);
    }
  }

  private buildGeminiContents(): any[] {
    return this.messageHistory.map((m) => {
      const role = m.role === "assistant" ? "model" : "user";
      const prefix = m.role === "developer" ? "[DEVELOPER/TOOL OUTPUT]: " : "";
      return {
        role,
        parts: [{ text: `${prefix}${m.content}` }],
      };
    });
  }

  public async run(query: string): Promise<IMessage[]> {
    this.messageHistory.push({ role: "user", content: query });
    this.notifyInterceptors({ role: "user", content: query });

    for (let i = 0; i < this.maxLoop; i++) {
      let rawLLMResponse: string = "";

      if (this.genAI) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: this.modelName,
            systemInstruction: this.instructions,
          });
          const contents = this.buildGeminiContents();
          const response = await model.generateContent({
            contents: contents,
          });
          rawLLMResponse = response.response.text() || "";
        } catch (error: any) {
          rawLLMResponse = this.simulateResponseFallback(query);
        }
      } else {
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
    const lastMsg = this.messageHistory[this.messageHistory.length - 1];
    if (lastMsg.role === "user") {
      if (query.toLowerCase().includes("weather")) {
        return JSON.stringify({
          step: "TOOL_REQUEST",
          text: "Checking weather using Gemini Agent SDK tool.",
          functionName: "fetchWeatherInfo",
          input: "Goa",
        });
      }
      if (query.toLowerCase().includes("cli") || query.toLowerCase().includes("cmd") || query.toLowerCase().includes("command")) {
        return JSON.stringify({
          step: "TOOL_REQUEST",
          text: "Running CLI command via Gemini Agent SDK.",
          functionName: "execCli",
          input: "echo 'Hello from Gemini Agent SDK'",
        });
      }
      return JSON.stringify({
        step: "OUTPUT",
        text: `Processed query with Gemini Agent SDK: "${query}"`,
      });
    }

    if (lastMsg.role === "developer") {
      return JSON.stringify({
        step: "OUTPUT",
        text: `Gemini Agent received tool execution result: ${lastMsg.content}`,
      });
    }

    return JSON.stringify({
      step: "OUTPUT",
      text: "Gemini Agent processing finished.",
    });
  }
}
