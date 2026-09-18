import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { EventSource } from "eventsource";

// Polyfill EventSource if not in global scope
if (typeof globalThis.EventSource === "undefined") {
  globalThis.EventSource = EventSource;
}

async function runSSEClient() {
  console.log("🌐 Connecting to Remote HTTP/SSE MCP Server at http://localhost:3001/sse...");

  const serverUrl = new URL("http://localhost:3001/sse");
  const transport = new SSEClientTransport(serverUrl);

  const client = new Client(
    {
      name: "example-http-sse-client",
      version: "1.0.0",
    },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected via HTTP/SSE Transport.");

  // 1. Discover tools over HTTP/SSE
  console.log("\n📋 Requesting tools list...");
  const toolsResponse = await client.listTools();
  console.log("Available Remote Tools:", toolsResponse.tools.map((t) => t.name));

  // 2. Call remote tool: github_create_issue
  console.log("\n🐙 Invoking 'github_create_issue' over HTTP/SSE...");
  const issueResult = await client.callTool({
    name: "github_create_issue",
    arguments: {
      repo: "Amie-dev/Gen-AI-Cohort-2026",
      title: "Fix transport connection timeout",
      body: "Investigating SSE event listener persistence.",
    },
  });
  console.log("Remote Tool Result:\n", issueResult.content[0].text);

  await client.close();
  console.log("👋 HTTP/SSE Client session closed.");
  process.exit(0);
}

runSSEClient().catch((err) => {
  console.error("❌ HTTP/SSE Client Error:", err);
  process.exit(1);
});
