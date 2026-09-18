import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
async function main() {
    console.log("🌐 Starting Remote HTTP SSE MCP Client test...");
    const transport = new SSEClientTransport(new URL("http://localhost:3001/sse"));
    const client = new Client({ name: "http-mcp-client", version: "1.0.0" }, { capabilities: {} });
    console.log("Connecting to http://localhost:3001/sse...");
    await client.connect(transport);
    console.log("✅ Connected to Remote HTTP MCP Server via SSE Transport!");
    // 1. List Tools
    const tools = await client.listTools();
    console.log("\n📋 Remote Tools:");
    tools.tools.forEach((t) => console.log(` - ${t.name}: ${t.description}`));
    // 2. Call tool: remote_ping
    const pingRes = await client.callTool({
        name: "remote_ping",
        arguments: { message: "Hello Remote MCP World" },
    });
    console.log("\n🏓 Remote Ping Response:\n", pingRes.content?.[0]?.text);
    // 3. Call tool: remote_calculate_tax
    const taxRes = await client.callTool({
        name: "remote_calculate_tax",
        arguments: { amount: 1500, taxRate: 18 },
    });
    console.log("\n💰 Remote Tax Calculation:\n", taxRes.content?.[0]?.text);
    await client.close();
    console.log("\n👋 Remote HTTP Client test complete.");
}
main().catch((err) => {
    console.error("❌ Remote HTTP client error:", err);
    process.exit(1);
});
