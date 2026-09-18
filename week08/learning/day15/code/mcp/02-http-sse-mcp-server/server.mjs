import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const app = express();
const PORT = 3001;

// Initialize MCP Server instance
const server = new Server(
  {
    name: "http-sse-remote-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools exposed by HTTP/SSE server
const TOOLS = [
  {
    name: "github_create_issue",
    description: "Creates a new issue in a specified GitHub repository",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "Repository full name e.g. owner/repo" },
        title: { type: "string", description: "Issue title" },
        body: { type: "string", description: "Issue body content" },
      },
      required: ["repo", "title"],
    },
  },
  {
    name: "stripe_refund_payment",
    description: "Processes a refund for a transaction ID",
    inputSchema: {
      type: "object",
      properties: {
        payment_id: { type: "string", description: "Target payment transaction ID" },
        reason: { type: "string", description: "Reason for refund" },
      },
      required: ["payment_id"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.log(`[HTTP/SSE Server] Call tool '${name}':`, args);

  if (name === "github_create_issue") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            issue_id: Math.floor(Math.random() * 1000) + 1,
            repo: args.repo,
            title: args.title,
            status: "open",
            url: `https://github.com/${args.repo}/issues/101`,
          }, null, 2),
        },
      ],
    };
  }

  if (name === "stripe_refund_payment") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            refund_id: `re_${Math.random().toString(36).substring(2, 8)}`,
            payment_id: args.payment_id,
            status: "succeeded",
            amount_refunded: "$49.99",
          }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Tool '${name}' not recognized.`);
});

let transport;

// Endpoint for Client to connect and open SSE Stream
app.get("/sse", async (req, res) => {
  console.log("[HTTP/SSE Server] New client connected to SSE endpoint.");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

// Endpoint for Client to post JSON-RPC messages to Server
app.post("/messages", async (req, res) => {
  console.log("[HTTP/SSE Server] Received message on /messages endpoint.");
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active SSE connection.");
  }
});

app.listen(PORT, () => {
  console.log(`🌐 HTTP/SSE MCP Server running at http://localhost:${PORT}/sse`);
});
