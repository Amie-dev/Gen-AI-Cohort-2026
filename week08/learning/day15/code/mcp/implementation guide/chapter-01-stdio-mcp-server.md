# Chapter 1 — STDIO Transport Architecture & Subprocess IPC

## 1. Chapter Overview

In **Chapter 1**, we dive into the most common and lightweight transport in the Model Context Protocol: **STDIO Transport**.

STDIO transport connects an MCP Client to an MCP Server executing as a local child process on the host machine. Communication happens via standard system input and output streams (`stdin` and `stdout`), while logging output is directed exclusively to standard error (`stderr`).

In this chapter, we will examine:
1. 🔌 How standard stream IPC operates in MCP.
2. 🛠️ Step-by-step breakdown of [server.mjs](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp/01-stdio-mcp-server/server.mjs).
3. 💻 Step-by-step breakdown of [client.mjs](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp/01-stdio-mcp-server/client.mjs).
4. ⚠️ Critical rule: Why `console.log` breaks STDIO transports and how `console.error` prevents channel corruption.

---

## 2. STDIO Transport Architecture & Pipe Isolation

When an application uses STDIO transport:
- The **MCP Client** acts as the parent process. It spawns the server executable (`node server.mjs`).
- **Standard Input (`stdin`)**: Parent process writes JSON-RPC request frames to the child process's `stdin`.
- **Standard Output (`stdout`)**: Child process writes JSON-RPC response frames to its `stdout`. Parent process reads these frames.
- **Standard Error (`stderr`)**: Reserved strictly for human-readable diagnostic logging.

```text
PARENT PROCESS (MCP Client)                     CHILD PROCESS (MCP Server)
┌──────────────────────────┐                    ┌──────────────────────────┐
│  StdioClientTransport    │                    │  StdioServerTransport    │
│                          │─── stdin (pipe) ──►│                          │
│  JSON-RPC Requests       │                    │  Server Request Handlers │
│                          │◄── stdout (pipe) ──│                          │
│  JSON-RPC Responses      │                    │  Tool Executors          │
└──────────────────────────┘                    └────────────┬─────────────┘
                                                             │
                                                     stderr (pipe/terminal)
                                                             ▼
                                                    [Diagnostic Console Log]
```

> [!CAUTION]
> Never use `console.log()` inside a STDIO MCP Server! `console.log()` outputs directly to `stdout`. Any non-JSON-RPC text emitted to `stdout` will corrupt the message parser on the client side and crash the transport pipe. Always log via `console.error()`.

---

## 3. Server Walkthrough ([server.mjs](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp/01-stdio-mcp-server/server.mjs))

Let's examine how the server is instantiated and configured in `01-stdio-mcp-server/server.mjs`.

### Step 1: SDK Imports & Server Instantiation

```javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Initialize MCP Server instance with name, version & capabilities
const server = new Server(
  {
    name: "payment-and-weather-stdio-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}, // Advertises tool execution support to clients
    },
  }
);
```

### Step 2: Defining Tool JSON Schemas

Tools exposed by the server must define a valid JSON Schema for `inputSchema`:

```javascript
const TOOLS = [
  {
    name: "create_payment",
    description: "Processes a mock payment via Stripe API integration",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Payment amount in USD" },
        currency: { type: "string", description: "Currency code (default: usd)" },
        customer_email: { type: "string", description: "Customer email address" },
      },
      required: ["amount", "customer_email"],
    },
  },
  {
    name: "get_weather",
    description: "Retrieves real-time weather information for a given city",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name" },
      },
      required: ["city"],
    },
  },
  {
    name: "query_database",
    description: "Executes a SQL query against the customer database",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query string" },
      },
      required: ["query"],
    },
  },
];
```

### Step 3: Registering `ListTools` and `CallTool` Handlers

```javascript
// Respond to tools/list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Respond to tools/call requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[STDIO Server Log] Executing tool '${name}' with args:`, JSON.stringify(args));

  if (name === "create_payment") {
    const paymentId = `pay_${Math.random().toString(36).substring(2, 9)}`;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "success",
            payment_id: paymentId,
            amount: args.amount,
            currency: args.currency || "usd",
            customer_email: args.customer_email,
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  if (name === "get_weather") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            city: args.city,
            temperature: 28,
            unit: "celsius",
            condition: "Sunny with light breeze",
            humidity: "62%",
          }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Tool '${name}' not found on this MCP server.`);
});
```

### Step 4: Connecting the STDIO Transport

```javascript
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[STDIO MCP Server] Server connected and listening on STDIO.");
}

main().catch((err) => {
  console.error("[STDIO MCP Server Error]", err);
  process.exit(1);
});
```

---

## 4. Client Walkthrough ([client.mjs](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp/01-stdio-mcp-server/client.mjs))

The client spawns `server.mjs` as a child process and communicates through protocol helper methods:

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runClient() {
  console.log("🚀 Initializing STDIO MCP Client...");

  const serverPath = path.join(__dirname, "server.mjs");

  // Spawn node process executing server.mjs
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client(
    { name: "example-stdio-client", version: "1.0.0" },
    { capabilities: {} }
  );

  // Perform protocol handshake & connect transport
  await client.connect(transport);
  console.log("✅ Connected to STDIO MCP Server child process.");

  // 1. Discover available tools
  const toolsResponse = await client.listTools();
  console.log("Discovered Tools:", toolsResponse.tools.map((t) => t.name));

  // 2. Execute 'create_payment'
  const paymentResult = await client.callTool({
    name: "create_payment",
    arguments: { amount: 49.99, customer_email: "test@example.com" },
  });
  console.log("Tool Result (create_payment):\n", paymentResult.content[0].text);

  // 3. Graceful shutdown
  await client.close();
  console.log("👋 STDIO Client session completed cleanly.");
}

runClient().catch((err) => {
  console.error("❌ Client Execution Error:", err);
  process.exit(1);
});
```

---

## 5. Execution Demo

To run the STDIO demonstration:

```bash
cd week08/learning/day15/code/mcp
npm run demo:stdio
```

### Expected Console Output

```text
🚀 Initializing STDIO MCP Client...
[STDIO MCP Server] Server connected and listening on STDIO.
✅ Connected to STDIO MCP Server child process.

📋 Discovering tools via tools/list...
Discovered Tools: [ 'create_payment', 'get_weather', 'query_database' ]

💳 Invoking tool 'create_payment'...
[STDIO Server Log] Executing tool 'create_payment' with args: {"amount":49.99,"customer_email":"test@example.com"}
Tool Result (create_payment):
 {
  "status": "success",
  "payment_id": "pay_5a72x9k",
  "amount": 49.99,
  "currency": "usd",
  "customer_email": "test@example.com",
  "timestamp": "2026-09-18T15:20:00.000Z"
}

🌤️ Invoking tool 'get_weather'...
[STDIO Server Log] Executing tool 'get_weather' with args: {"city":"San Francisco"}
Tool Result (get_weather):
 {
  "city": "San Francisco",
  "temperature": 28,
  "unit": "celsius",
  "condition": "Sunny with light breeze",
  "humidity": "62%"
}

👋 STDIO Client session completed cleanly.
```

---

## 6. Summary & Next Steps

In this chapter, we learned:
- How STDIO transport relies on `stdin`/`stdout` pipes between parent and child processes.
- The vital rule: log via `console.error()`, never `console.log()`.
- How to instantiate `StdioServerTransport` and `StdioClientTransport`.

In [Chapter 2](chapter-02-http-sse-mcp-server.md), we will transition from local subprocess IPC to **remote HTTP / Server-Sent Events (SSE)** transports for cloud-based MCP deployments.
