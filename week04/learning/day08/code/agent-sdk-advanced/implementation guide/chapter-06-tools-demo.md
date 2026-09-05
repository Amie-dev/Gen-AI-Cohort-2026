# Chapter 6 — Custom Tool Suite & Multi-Demo Application

## 1. Chapter Goal

The goal of this chapter is to build the modular **Tool Library** inside `src/tools/` and assemble the complete SDK demonstration suite inside `src/index.ts`.

In this chapter, we:
* Implement modular `ITool` capabilities (`cliTool`, `mathTool`, `searchTool`, `weatherTool`)
* Assemble `src/index.ts` with SDK exports and 3 comprehensive interactive demos:
  * **Demo 1**: Single Agent executing multi-tool workflows
  * **Demo 2**: Per-Agent Guardrails enforcement (blocking dangerous CLI commands, prompt injections, and masking PII output)
  * **Demo 3**: Multi-Agent Swarm orchestration with seamless agent handoffs
* Run end-to-end verification

---

### 🎯 Expected Outcome

Running `npm run dev` will execute all three demonstration scenarios successfully.

```text
npm run dev
   ├── Demo 1: GeneralAssistant calls fetchWeatherInfo
   ├── Demo 2: Guardrail blocks "rm -rf /" & masks PII
   └── Demo 3: TriageAgent hands off query to WeatherAgent
```

---

## 2. Implementing the Modular Tool Suite (`src/tools/`)

### 1. Weather Tool (`src/tools/weatherTool.ts`)

```typescript
import axios from "axios";
import { ITool } from "../types.js";

export const weatherTool: ITool = {
  name: "fetchWeatherInfo",
  description: "Fetches realtime weather data by city name.",
  doc: "fetchWeatherInfo(cityName: string): WeatherReport",
  async executor(cityName: string): Promise<string> {
    try {
      const city = cityName.trim().toLowerCase();
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t`;
      const response = await axios.get(url, { responseType: "text", timeout: 5000 });
      return JSON.stringify({ cityName, weatherInfo: response.data });
    } catch {
      return JSON.stringify({ cityName, weatherInfo: "Sunny, +30°C (fallback)" });
    }
  },
};
```

### 2. Math Evaluator Tool (`src/tools/mathTool.ts`)

```typescript
import { ITool } from "../types.js";

export const mathEvaluatorTool: ITool = {
  name: "evaluateMathExpression",
  description: "Evaluates a mathematical expression string.",
  doc: "evaluateMathExpression(expression: string): MathResult",
  executor(expression: string): string {
    try {
      const cleanExpr = expression.replace(/[^0-9+\-*/().\s]/g, "");
      const result = Function(`"use strict"; return (${cleanExpr})`)();
      return JSON.stringify({ expression, result });
    } catch (err: any) {
      return JSON.stringify({ expression, error: err.message });
    }
  },
};
```

### 3. Simulated Web Search Tool (`src/tools/searchTool.ts`)

```typescript
import { ITool } from "../types.js";

export const searchTool: ITool = {
  name: "webSearch",
  description: "Performs a simulated web search query.",
  doc: "webSearch(query: string): SearchResults",
  executor(query: string): string {
    return JSON.stringify({
      query,
      results: [
        { title: `Latest updates on ${query}`, snippet: `Top web information regarding ${query}.` },
      ],
    });
  },
};
```

### 4. System CLI Tool (`src/tools/cliTool.ts`)

```typescript
import { exec } from "child_process";
import { ITool } from "../types.js";

export const cliAccessTool: ITool = {
  name: "execCli",
  description: "Executes a shell command on the host OS.",
  doc: "execCli(command: string): CLIOutput",
  executor(cmd: string): Promise<string> {
    return new Promise((resolve) => {
      exec(cmd, (err, stdout, stderr) => {
        if (err) resolve(`Error executing CLI: ${err.message}`);
        else resolve(stdout || stderr || "Command executed successfully with empty output.");
      });
    });
  },
};
```

---

## 3. Implementation of `src/index.ts`

### File Path

```text
agent-sdk-advanced/src/index.ts
```

### Code

```typescript
import dotenv from "dotenv";
import { Agent } from "./agent.js";
import { AgentBuilder } from "./builder.js";
import { cliSafetyGuardrail } from "./guardrails/cliSafetyGuardrail.js";
import { piiRedactionGuardrail } from "./guardrails/piiRedactionGuardrail.js";
import { securityGuardrail } from "./guardrails/securityGuardrail.js";
import { createTopicGuardrail } from "./guardrails/topicGuardrail.js";
import { consoleLoggerInterceptor } from "./interceptors/loggerInterceptor.js";
import { AgentSwarm } from "./swarm.js";
import { cliAccessTool } from "./tools/cliTool.js";
import { createHandoffTool } from "./tools/handoffTool.js";
import { mathEvaluatorTool } from "./tools/mathTool.js";
import { searchTool } from "./tools/searchTool.js";
import { weatherTool } from "./tools/weatherTool.js";

dotenv.config();

// Export SDK public API
export { Agent } from "./agent.js";
export { AgentBuilder } from "./builder.js";
export { AgentSwarm } from "./swarm.js";
export * from "./types.js";
export { cliAccessTool } from "./tools/cliTool.js";
export { createHandoffTool } from "./tools/handoffTool.js";
export { mathEvaluatorTool } from "./tools/mathTool.js";
export { searchTool } from "./tools/searchTool.js";
export { weatherTool } from "./tools/weatherTool.js";
export { cliSafetyGuardrail } from "./guardrails/cliSafetyGuardrail.js";
export { piiRedactionGuardrail } from "./guardrails/piiRedactionGuardrail.js";
export { securityGuardrail } from "./guardrails/securityGuardrail.js";
export { createTopicGuardrail } from "./guardrails/topicGuardrail.js";
export { consoleLoggerInterceptor } from "./interceptors/loggerInterceptor.js";

async function main() {
  console.log("=========================================================================");
  console.log("🚀 DEMONSTRATION: Advanced Custom Agent SDK (Tools, Guardrails & Handoff)");
  console.log("=========================================================================\n");

  // DEMO 1: Single Agent with Multiple Tools
  console.log("-------------------------------------------------------------------------");
  console.log("📌 DEMO 1: Single Agent Executing Multiple Functions / Tools");
  console.log("-------------------------------------------------------------------------\n");

  const multiToolAgent: Agent = Agent.builder("GeneralAssistant")
    .setInstructions("You are a helpful general assistant equipped with weather, CLI, math, and search tools.")
    .tool(weatherTool)
    .tool(cliAccessTool)
    .tool(mathEvaluatorTool)
    .tool(searchTool)
    .attachInterceptor(consoleLoggerInterceptor)
    .build();

  const demo1Result = await multiToolAgent.run("What is the current weather in Goa?");
  console.log("\nDemo 1 Result Outcome:", demo1Result.output);

  // DEMO 2: Per-Agent Guardrails
  console.log("\n-------------------------------------------------------------------------");
  console.log("📌 DEMO 2: Per-Agent Guardrails (Input Validation, Safety & PII Redaction)");
  console.log("-------------------------------------------------------------------------\n");

  const secureDevOpsAgent: Agent = Agent.builder("DevOpsAgent")
    .setInstructions("You execute shell operations safely.")
    .tool(cliAccessTool)
    .addInputGuardrail(securityGuardrail)
    .addInputGuardrail(cliSafetyGuardrail)
    .addOutputGuardrail(piiRedactionGuardrail)
    .attachInterceptor(consoleLoggerInterceptor)
    .build();

  console.log(">>> Test 2A: Attempting forbidden dangerous CLI command...");
  try {
    await secureDevOpsAgent.run("Please run rm -rf / for system cleanup");
  } catch (err: any) {
    console.log("\x1b[31m🛡️ Guardrail Intercepted & Blocked:\x1b[0m", err.message);
  }

  // DEMO 3: Multi-Agent Swarm Orchestration & Handoff
  console.log("\n-------------------------------------------------------------------------");
  console.log("📌 DEMO 3: Multi-Agent Swarm Orchestration & Seamless Agent Handoff");
  console.log("-------------------------------------------------------------------------\n");

  const specializedWeatherAgent: Agent = Agent.builder("WeatherAgent")
    .setInstructions("You are a specialized Weather Agent. Answer weather queries using fetchWeatherInfo.")
    .tool(weatherTool)
    .attachInterceptor(consoleLoggerInterceptor)
    .build();

  const specializedMathAgent: Agent = Agent.builder("MathAgent")
    .setInstructions("You are a specialized Math Agent. Answer math queries using evaluateMathExpression.")
    .tool(mathEvaluatorTool)
    .attachInterceptor(consoleLoggerInterceptor)
    .build();

  const triageAgent: Agent = Agent.builder("TriageAgent")
    .setInstructions("You are the front-desk Triage Agent. Evaluate the user query and hand off to WeatherAgent or MathAgent.")
    .tool(createHandoffTool("WeatherAgent", "Handles weather queries"))
    .tool(createHandoffTool("MathAgent", "Handles math queries"))
    .attachInterceptor(consoleLoggerInterceptor)
    .build();

  const swarm = new AgentSwarm()
    .registerAgent(triageAgent)
    .registerAgent(specializedWeatherAgent)
    .registerAgent(specializedMathAgent)
    .setDefaultAgent("TriageAgent");

  const swarmResult = await swarm.run("Can you tell me the current weather in Goa?");

  console.log("=========================================================================");
  console.log("✨ MULTI-AGENT SWARM RUN COMPLETE");
  console.log("Final Output:", swarmResult.finalOutput);
  console.log("Completed By:", swarmResult.completedBy);
  console.log("Handoff Sequence Logs:", JSON.stringify(swarmResult.handoffLogs, null, 2));
  console.log("=========================================================================");
}

if (process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts")) {
  main().catch(console.error);
}
```

---

## 4. End-to-End Execution & Verification

### 1. Build TypeScript Code

```bash
npm run build
```

### 2. Run Demonstration Suite

```bash
npm run dev
```

---

## 🎉 Conclusion

Congratulations! You have successfully built an **Advanced Multi-Agent SDK Framework** featuring multi-tool execution, per-agent safety guardrails, PII redaction, real-time interceptors, and a multi-agent **Swarm Orchestrator** supporting seamless agent handoffs!
