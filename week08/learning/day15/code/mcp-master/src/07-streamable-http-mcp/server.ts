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

  // Tool: remote_ping
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

  // Tool: remote_calculate_tax
  server.tool(
    "remote_calculate_tax",
    "Calculate tax for a transaction amount",
    {
      amount: z.number().positive().describe("Total amount"),
      taxRate: z.number().min(0).max(100).describe("Tax percentage rate (e.g. 15 for 15%)"),
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

let transportMap = new Map<string, SSEServerTransport>();

app.get("/sse", async (req, res) => {
  console.log("📡 New SSE Connection client request received");
  const server = createRemoteMcpServer();
  const transport = new SSEServerTransport("/message", res);
  transportMap.set(transport.sessionId, transport);

  server.connect(transport).catch((err) => {
    console.error("Transport error:", err);
  });
});

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
