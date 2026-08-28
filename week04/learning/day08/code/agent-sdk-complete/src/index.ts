import dotenv from "dotenv";
import { Agent } from "./agent.js";
import { consoleLoggerInterceptor } from "./interceptors/loggerInterceptor.js";
import { cliAccessTool } from "./tools/cliTool.js";
import { mathEvaluatorTool } from "./tools/mathTool.js";
import { weatherTool } from "./tools/weatherTool.js";

dotenv.config();

// Export SDK public library interface
export { Agent } from "./agent.js";
export { AgentBuilder } from "./builder.js";
export * from "./types.js";
export { weatherTool } from "./tools/weatherTool.js";
export { cliAccessTool } from "./tools/cliTool.js";
export { mathEvaluatorTool } from "./tools/mathTool.js";
export { consoleLoggerInterceptor } from "./interceptors/loggerInterceptor.js";

async function main() {
  console.log("==================================================");
  console.log("🚀 Starting Custom Agent SDK Demonstration Runner");
  console.log("==================================================\n");

  const agent: Agent = Agent.builder()
    .setInstructions("You are a helpful software engineering assistant equipped with weather, math, and CLI tools.")
    .tool(weatherTool)
    .tool(cliAccessTool)
    .tool(mathEvaluatorTool)
    .model("gpt-4o")
    .setMaxLoop(10)
    .attachInterceptor(consoleLoggerInterceptor)
    .build();

  console.log("--- Executing Test 1: Weather Query ---");
  const weatherResult = await agent.run("What is the current weather in Goa?");
  console.log("\nExecution completed. History count:", weatherResult.length);
  console.log("--------------------------------------------------\n");

  console.log("--- Executing Test 2: CLI Command Query ---");
  const cliAgent: Agent = Agent.builder()
    .setInstructions("You are an expert DevOps engineer capable of running shell diagnostics.")
    .tool(cliAccessTool)
    .attachInterceptor(consoleLoggerInterceptor)
    .build();

  const cliResult = await cliAgent.run("Execute cli command to list current directory files");
  console.log("\nCLI execution completed. History count:", cliResult.length);
  console.log("==================================================");
}

// Execute demo if script run directly
if (process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts")) {
  main().catch(console.error);
}
