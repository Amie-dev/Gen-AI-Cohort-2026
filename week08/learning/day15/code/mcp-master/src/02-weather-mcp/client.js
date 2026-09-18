import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function main() {
    console.log("🌤️ Starting Weather MCP Client test...");
    const serverPath = path.join(__dirname, "server.ts");
    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", serverPath],
    });
    const client = new Client({ name: "weather-client", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);
    console.log("✅ Connected to Weather MCP Server");
    // 1. List Tools
    const tools = await client.listTools();
    console.log("\n📋 Available Weather Tools:");
    tools.tools.forEach((t) => console.log(` - ${t.name}: ${t.description}`));
    // 2. Query valid city
    const londonRes = await client.callTool({
        name: "get_weather",
        arguments: { city: "London" },
    });
    const londonContent = londonRes.content?.[0]?.text;
    console.log("\n🌆 Weather in London:\n", londonContent);
    // 3. Query forecast
    const tokyoForecast = await client.callTool({
        name: "get_forecast",
        arguments: { city: "Tokyo" },
    });
    const tokyoContent = tokyoForecast.content?.[0]?.text;
    console.log("\n🔮 Forecast for Tokyo:\n", tokyoContent);
    // 4. Query unknown city (Error Handling test)
    const unknownRes = await client.callTool({
        name: "get_weather",
        arguments: { city: "Atlantis" },
    });
    console.log("\n⚠️ Querying unknown city 'Atlantis':\n", unknownRes);
    await client.close();
    console.log("\n👋 Weather Client test complete.");
}
main().catch((err) => {
    console.error("❌ Weather client error:", err);
    process.exit(1);
});
