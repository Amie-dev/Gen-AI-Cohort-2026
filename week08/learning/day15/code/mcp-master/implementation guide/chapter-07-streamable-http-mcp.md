# Chapter 7: Remote Streamable Express HTTP & SSE MCP Transport

## 1. Overview & Transports: STDIO vs HTTP/SSE

While **STDIO transport** is ideal for local desktop integrations (spawning subprocesses on the same machine), it cannot support cloud deployments, microservice architectures, or remote web clients.

For remote network communication, MCP defines the **Server-Sent Events (SSE) HTTP Transport**:
- **SSE Stream (`GET /sse`)**: Long-lived HTTP stream created by the client to receive server-to-client JSON-RPC events (initialized response, tool progress notifications, tool call responses).
- **HTTP POST Messages (`POST /message?sessionId=...`)**: Short-lived HTTP POST requests sent by the client containing client-to-server JSON-RPC requests (`tools/list`, `tools/call`).

Module 7 implements an Express-backed remote streamable MCP server and remote SSE client.

---

## 2. Remote HTTP/SSE Server (`server.ts`)

Source file: [server.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/07-streamable-http-mcp/server.ts)

```typescript
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const app = express();
app.use(cors());

const PORT = 3001;

function createRemoteMcpServer(): McpServer {
  const server = new McpServer({
    name: "remote-http-mcp-server",
    version: "1.0.0",
  });

  // Tool 1: remote_ping
  server.tool(
    "remote_ping",
    "Ping remote MCP server to test latency and HTTP transport",
    { message: z.string().optional() },
    async ({ message }) => {
      return {
        content: [
          {
            type: "text",
            text: `PONG from Remote HTTP MCP Server! Echo: "${message || 'no message'}" at ${new Date().toISOString()}`,
          },
        ],
      };
    }
  );

  // Tool 2: remote_calculate_tax
  server.tool(
    "remote_calculate_tax",
    "Calculate tax for a transaction amount",
    {
      amount: z.number().positive().describe("Total amount"),
      taxRate: z.number().min(0).max(100).describe("Tax percentage rate (e.g. 18 for 18%)"),
    },
    async ({ amount, taxRate }) => {
      const taxAmount = (amount * taxRate) / 100;
      const total = amount + taxAmount;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ amount, taxRate: `${taxRate}%`, taxAmount, total }, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

// Map storing active SSE transports by sessionId
let transportMap = new Map<string, SSEServerTransport>();

// SSE Connection Endpoint
app.get("/sse", async (req, res) => {
  console.log("📡 New SSE Connection client request received");
  const server = createRemoteMcpServer();
  const transport = new SSEServerTransport("/message", res);
  transportMap.set(transport.sessionId, transport);

  server.connect(transport).catch((err) => {
    console.error("Transport error:", err);
  });
});

// HTTP POST Message Endpoint
app.post("/message", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transportMap.get(sessionId);
  if (!transport) {
    res.status(400).send("Invalid or expired session ID");
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(PORT, () => {
  console.log(`🚀 Remote HTTP MCP Server listening on http://localhost:${PORT}`);
  console.log(`   SSE Endpoint: http://localhost:${PORT}/sse`);
  console.log(`   Message Endpoint: http://localhost:${PORT}/message`);
});
```

---

## 3. Remote SSE Client (`client.ts`)

Source file: [client.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/07-streamable-http-mcp/client.ts)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
  console.log("🌐 Starting Remote HTTP SSE MCP Client test...");

  // Connect via SSEClientTransport pointing to HTTP endpoint
  const transport = new SSEClientTransport(new URL("http://localhost:3001/sse"));

  const client = new Client(
    { name: "http-mcp-client", version: "1.0.0" },
    { capabilities: {} }
  );

  console.log("Connecting to http://localhost:3001/sse...");
  await client.connect(transport);
  console.log("✅ Connected to Remote HTTP MCP Server via SSE Transport!");

  // 1. List Remote Tools
  const tools = await client.listTools();
  console.log("\n📋 Remote Tools:");
  tools.tools.forEach((t) => console.log(` - ${t.name}: ${t.description}`));

  // 2. Call Tool: remote_ping
  const pingRes = await client.callTool({
    name: "remote_ping",
    arguments: { message: "Hello Remote MCP World" },
  });
  console.log("\n🏓 Remote Ping Response:\n", (pingRes.content as any[])?.[0]?.text);

  // 3. Call Tool: remote_calculate_tax
  const taxRes = await client.callTool({
    name: "remote_calculate_tax",
    arguments: { amount: 1500, taxRate: 18 },
  });
  console.log("\n💰 Remote Tax Calculation:\n", (taxRes.content as any[])?.[0]?.text);

  await client.close();
  console.log("\n👋 Remote HTTP Client test complete.");
}

main().catch((err) => {
  console.error("❌ Remote HTTP client error:", err);
  process.exit(1);
});
```

---

## 4. Execution & Multi-Terminal Setup

To run this demonstration, open two terminal windows:

### Terminal 1: Start Express HTTP SSE Server
```bash
npm run dev:07-http-server
```
*Server Output:*
```text
🚀 Remote HTTP MCP Server listening on http://localhost:3001
   SSE Endpoint: http://localhost:3001/sse
   Message Endpoint: http://localhost:3001/message
```

### Terminal 2: Run SSE Remote Client Test
```bash
npm run dev:07-http-client
```
*Client Output:*
```text
🌐 Starting Remote HTTP SSE MCP Client test...
Connecting to http://localhost:3001/sse...
✅ Connected to Remote HTTP MCP Server via SSE Transport!

📋 Remote Tools:
 - remote_ping: Ping remote MCP server to test latency and HTTP transport
 - remote_calculate_tax: Calculate tax for a transaction amount

🏓 Remote Ping Response:
 PONG from Remote HTTP MCP Server! Echo: "Hello Remote MCP World" at 2026-09-18T16:00:00.000Z

💰 Remote Tax Calculation:
 {
  "amount": 1500,
  "taxRate": "18%",
  "taxAmount": 270,
  "total": 1770
}

👋 Remote HTTP Client test complete.
```
