import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Initialize MCP Server instance
const server = new Server(
  {
    name: "payment-and-weather-stdio-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
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

// Handle ListTools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle CallTool request
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

  if (name === "query_database") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            query: args.query,
            rows_returned: 2,
            results: [
              { id: 1, name: "Alice Johnson", status: "active" },
              { id: 2, name: "Bob Smith", status: "active" },
            ],
          }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Tool '${name}' not found on this MCP server.`);
});

// Connect server via STDIO Transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[STDIO MCP Server] Server connected and listening on STDIO.");
}

main().catch((err) => {
  console.error("[STDIO MCP Server Error]", err);
  process.exit(1);
});
