import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Mock LLM function simulating tool selection based on MCP schemas
async function mockLLMCall(userPrompt, availableTools) {
    console.log(`\n🤖 [LLM Thinking] User prompt: "${userPrompt}"`);
    console.log(`🤖 [LLM Context] Evaluated ${availableTools.length} tools provided by MCP server.`);
    // Rule-based mock LLM decision logic for demonstration
    const promptLower = userPrompt.toLowerCase();
    if (promptLower.includes("calculate") || promptLower.includes("multiply") || promptLower.includes("multiplied") || promptLower.includes("*") || promptLower.includes("+")) {
        if (userPrompt.includes("20") && userPrompt.includes("30")) {
            return {
                type: "tool_call",
                toolName: "multiply",
                arguments: { a: 20, b: 30 },
            };
        }
    }
    if (userPrompt.toLowerCase().includes("weather")) {
        return {
            type: "tool_call",
            toolName: "get_weather",
            arguments: { city: "Tokyo" },
        };
    }
    return {
        type: "text",
        content: "I can answer your prompt directly without tool calls.",
    };
}
async function runAgentLoop() {
    console.log("🤖 Starting MCP + LLM Agent Tool-Calling Loop Simulation...\n");
    // Step 1: Connect to Calculator MCP Server
    const calcServerPath = path.join(__dirname, "../01-calculator-mcp/server.ts");
    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", calcServerPath],
    });
    const client = new Client({ name: "agent-mcp-client", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);
    console.log("✅ Step 1: MCP Client connected to MCP Server.");
    // Step 2: Tool Discovery via MCP
    const toolsResponse = await client.listTools();
    const mcpTools = toolsResponse.tools;
    console.log(`✅ Step 2: Discovered ${mcpTools.length} MCP tools:`, mcpTools.map((t) => t.name).join(", "));
    // Step 3: Send User Prompt to Agent
    const userPrompt = "Calculate 20 multiplied by 30 using the available server tools.";
    console.log(`\n👤 User Request: "${userPrompt}"`);
    // Step 4: LLM Decides Tool Call
    const llmDecision = await mockLLMCall(userPrompt, mcpTools);
    if (llmDecision.type === "tool_call" && llmDecision.toolName) {
        console.log(`\n⚙️ Step 5: LLM output tool invocation request:`);
        console.log(`   Tool: ${llmDecision.toolName}`);
        console.log(`   Arguments:`, llmDecision.arguments);
        // Step 6: MCP Client Executes Tool Call on Server
        console.log("\n📡 Step 6: Executing tool call on MCP Server via JSON-RPC transport...");
        const toolResult = await client.callTool({
            name: llmDecision.toolName,
            arguments: llmDecision.arguments,
        });
        console.log("📥 MCP Server Result received:", toolResult.content);
        // Step 7: LLM Formulates Final Response
        const finalResultText = toolResult.content?.[0]?.text;
        console.log(`\n💬 Step 7: Final LLM Answer to User:`);
        console.log(`   "The result of multiplying 20 by 30 is ${finalResultText}."`);
    }
    else {
        console.log("\n💬 LLM Response:", llmDecision.content);
    }
    await client.close();
    console.log("\n👋 Agent loop simulation completed successfully.");
}
runAgentLoop().catch((err) => {
    console.error("❌ Agent loop error:", err);
    process.exit(1);
});
