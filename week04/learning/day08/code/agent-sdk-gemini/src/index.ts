import dotenv from "dotenv";
import { Agent } from "./agent.js";
import { consoleLoggerInterceptor } from "./interceptors/loggerInterceptor.js";
import { cliAccessTool } from "./tools/cliTool.js";
import { mathEvaluatorTool } from "./tools/mathTool.js";
import { weatherTool } from "./tools/weatherTool.js";

dotenv.config();

// Export Gemini Agent SDK public library interface
export { Agent } from "./agent.js";
export { AgentBuilder } from "./builder.js";
export * from "./types.js";
export { weatherTool } from "./tools/weatherTool.js";
export { cliAccessTool } from "./tools/cliTool.js";
export { mathEvaluatorTool } from "./tools/mathTool.js";
export { consoleLoggerInterceptor } from "./interceptors/loggerInterceptor.js";

async function main() {
  console.log("==================================================");
  console.log("✨ Starting Gemini Agent SDK Demonstration Runner");
  console.log("==================================================\n");

  const agent: Agent = Agent.builder()
    .setInstructions("You are a helpful software engineering agent powered by Google Gemini, equipped with weather, math, and CLI tools.")
    .tool(weatherTool)
    .tool(cliAccessTool)
    .tool(mathEvaluatorTool)
    .model("gemini-2.5-flash")
    .setMaxLoop(10)
    .attachInterceptor(consoleLoggerInterceptor)
    .build();

  console.log("--- Executing Test 1: Weather Query with Gemini ---");
  const weatherResult = await agent.run("What is the current weather in Goa?");
  console.log("\nExecution completed. History count:", weatherResult.length);
  console.log("--------------------------------------------------\n");

  console.log("--- Executing Test 2: CLI Command Query with Gemini ---");
  const cliAgent: Agent = Agent.builder()
    .setInstructions("You are an expert DevOps engineer powered by Google Gemini.")
    .tool(cliAccessTool)
    .model("gemini-2.5-flash")
    .attachInterceptor(consoleLoggerInterceptor)
    .build();

  const cliResult = await cliAgent.run("Execute cli command to echo hello from Gemini");
  console.log("\nCLI execution completed. History count:", cliResult.length);
  console.log("==================================================");
}

if (process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts")) {
  main().catch(console.error);
}
