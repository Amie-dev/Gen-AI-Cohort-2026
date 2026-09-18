import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function main() {
    console.log("🗄️ Starting Database MCP Client test...");
    const serverPath = path.join(__dirname, "server.ts");
    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", serverPath],
    });
    const client = new Client({ name: "db-client", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);
    console.log("✅ Connected to Database MCP Server");
    // 1. List Tables
    const tablesRes = await client.callTool({ name: "list_tables", arguments: {} });
    console.log("\n📋 Database Tables:\n", tablesRes.content?.[0]?.text);
    // 2. Get Schema
    const schemaRes = await client.callTool({
        name: "get_schema",
        arguments: { tableName: "users" },
    });
    console.log("\n📐 'users' Table Schema:\n", schemaRes.content?.[0]?.text);
    // 3. Search Records
    const searchRes = await client.callTool({
        name: "search_records",
        arguments: { tableName: "users", filterKey: "role", filterValue: "admin" },
    });
    console.log("\n🔍 Search 'users' for role='admin':\n", searchRes.content?.[0]?.text);
    // 4. Get Record by ID
    const recordRes = await client.callTool({
        name: "get_record_by_id",
        arguments: { tableName: "orders", id: 101 },
    });
    console.log("\n🆔 Get Order ID 101:\n", recordRes.content?.[0]?.text);
    await client.close();
    console.log("\n👋 Database Client test complete.");
}
main().catch((err) => {
    console.error("❌ Database client error:", err);
    process.exit(1);
});
