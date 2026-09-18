import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export class MCPGateway {
    clients = new Map();
    async registerServer(config) {
        console.log(`🔌 Gateway connecting to MCP Server: '${config.name}'...`);
        const transport = new StdioClientTransport({
            command: "npx",
            args: ["tsx", config.scriptPath],
        });
        const client = new Client({ name: `gateway-client-${config.name}`, version: "1.0.0" }, { capabilities: {} });
        await client.connect(transport);
        const toolsResponse = await client.listTools();
        const tools = toolsResponse.tools.map((t) => ({
            ...t,
            serverName: config.name,
        }));
        this.clients.set(config.name, { client, tools });
        console.log(`✅ Server '${config.name}' registered with ${tools.length} tools.`);
    }
    getAllTools() {
        const allTools = [];
        for (const [serverName, data] of this.clients.entries()) {
            allTools.push(...data.tools);
        }
        return allTools;
    }
    filterToolsForIntent(userIntent) {
        const intent = userIntent.toLowerCase();
        const all = this.getAllTools();
        // Contextual/Semantic filtering to prevent Tool Explosion Problem
        if (intent.includes("task") || intent.includes("todo") || intent.includes("plan")) {
            return all.filter((t) => t.serverName === "TaskServer");
        }
        if (intent.includes("weather") || intent.includes("temperature") || intent.includes("forecast")) {
            return all.filter((t) => t.serverName === "WeatherServer");
        }
        if (intent.includes("add") || intent.includes("multiply") || intent.includes("math") || intent.includes("calc")) {
            return all.filter((t) => t.serverName === "CalculatorServer");
        }
        return all; // Default return all if intent ambiguous
    }
    async routeCallTool(toolName, args) {
        for (const [serverName, data] of this.clients.entries()) {
            const match = data.tools.find((t) => t.name === toolName);
            if (match) {
                console.log(`🔀 Gateway routing '${toolName}' to '${serverName}'...`);
                return await data.client.callTool({ name: toolName, arguments: args });
            }
        }
        throw new Error(`No registered MCP server handles tool '${toolName}'.`);
    }
    async shutdown() {
        for (const [name, data] of this.clients.entries()) {
            await data.client.close();
        }
        console.log("🛑 Gateway connections closed.");
    }
}
async function main() {
    console.log("🏛️ Starting MCP Gateway Demo...\n");
    const gateway = new MCPGateway();
    // Register multiple backend MCP Servers
    await gateway.registerServer({
        name: "CalculatorServer",
        scriptPath: path.join(__dirname, "../01-calculator-mcp/server.ts"),
    });
    await gateway.registerServer({
        name: "WeatherServer",
        scriptPath: path.join(__dirname, "../02-weather-mcp/server.ts"),
    });
    await gateway.registerServer({
        name: "TaskServer",
        scriptPath: path.join(__dirname, "../05-task-manager-mcp/server.ts"),
    });
    console.log("\n📊 Gateway Aggregated Total Tools:", gateway.getAllTools().length);
    // Intent 1: Math/Calculation request
    const intent1 = "I need to calculate numbers and multiply 8 by 9";
    console.log(`\n1️⃣ Intent: "${intent1}"`);
    const tools1 = gateway.filterToolsForIntent(intent1);
    console.log("   Filtered tools:", tools1.map((t) => `${t.serverName}:${t.name}`).join(", "));
    const result1 = await gateway.routeCallTool("multiply", { a: 8, b: 9 });
    console.log("   Result:", result1.content?.[0]?.text);
    // Intent 2: Weather request
    const intent2 = "Check current weather condition in Paris";
    console.log(`\n2️⃣ Intent: "${intent2}"`);
    const tools2 = gateway.filterToolsForIntent(intent2);
    console.log("   Filtered tools:", tools2.map((t) => `${t.serverName}:${t.name}`).join(", "));
    const result2 = await gateway.routeCallTool("get_weather", { city: "Paris" });
    console.log("   Result:\n", result2.content?.[0]?.text);
    // Intent 3: Task management request
    const intent3 = "Create a high priority task for my daily goal";
    console.log(`\n3️⃣ Intent: "${intent3}"`);
    const tools3 = gateway.filterToolsForIntent(intent3);
    console.log("   Filtered tools:", tools3.map((t) => `${t.serverName}:${t.name}`).join(", "));
    const result3 = await gateway.routeCallTool("create_task", { title: "Deploy MCP Gateway to Staging", priority: "high" });
    console.log("   Result:\n", result3.content?.[0]?.text);
    await gateway.shutdown();
    console.log("\n🎉 MCP Gateway Demo complete.");
}
main().catch((err) => {
    console.error("❌ Gateway error:", err);
    process.exit(1);
});
