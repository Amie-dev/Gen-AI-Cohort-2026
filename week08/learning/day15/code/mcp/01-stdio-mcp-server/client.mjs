import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runClient() {
  console.log("🚀 Initializing STDIO MCP Client...");

  // Path to local server script
  const serverPath = path.join(__dirname, "server.mjs");

  // Create StdioClientTransport spawning the server process
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client(
    {
      name: "example-stdio-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✅ Connected to STDIO MCP Server child process.");

  // 1. Discover available tools
  console.log("\n📋 Discovering tools via tools/list...");
  const toolsResponse = await client.listTools();
  console.log("Discovered Tools:", toolsResponse.tools.map((t) => t.name));

  // 2. Execute a tool: create_payment
  console.log("\n💳 Invoking tool 'create_payment'...");
  const paymentResult = await client.callTool({
    name: "create_payment",
    arguments: {
      amount: 49.99,
      customer_email: "test@example.com",
    },
  });
  console.log("Tool Result (create_payment):\n", paymentResult.content[0].text);

  // 3. Execute a tool: get_weather
  console.log("\n🌤️ Invoking tool 'get_weather'...");
  const weatherResult = await client.callTool({
    name: "get_weather",
    arguments: {
      city: "San Francisco",
    },
  });
  console.log("Tool Result (get_weather):\n", weatherResult.content[0].text);

  // Close connection
  await client.close();
  console.log("\n👋 STDIO Client session completed cleanly.");
}

runClient().catch((err) => {
  console.error("❌ Client Execution Error:", err);
  process.exit(1);
});
