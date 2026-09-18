import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export function createCalculatorServer(): McpServer {
  const server = new McpServer({
    name: "calculator-server",
    version: "1.0.0",
  });

  // Tool: add
  server.tool(
    "add",
    "Add two numbers together",
    {
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
    async ({ a, b }) => {
      const result = a + b;
      return {
        content: [{ type: "text", text: String(result) }],
      };
    }
  );

  // Tool: multiply
  server.tool(
    "multiply",
    "Multiply two numbers",
    {
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
    async ({ a, b }) => {
      const result = a * b;
      return {
        content: [{ type: "text", text: String(result) }],
      };
    }
  );

  // Tool: divide
  server.tool(
    "divide",
    "Divide two numbers",
    {
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
    async ({ a, b }) => {
      if (b === 0) {
        return {
          content: [{ type: "text", text: "Error: Cannot divide by zero" }],
          isError: true,
        };
      }
      const result = a / b;
      return {
        content: [{ type: "text", text: String(result) }],
      };
    }
  );

  // Resource: documentation
  server.resource(
    "documentation",
    "docs://getting-started",
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: "Calculator MCP Server Documentation:\nExposes add, multiply, and divide tools.",
          mimeType: "text/plain",
        },
      ],
    })
  );

  // Prompt: code-review
  server.prompt(
    "code-review",
    {
      language: z.string().describe("Programming language"),
      code: z.string().describe("Code to review"),
    },
    ({ language, code }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Review the following ${language} code for bugs, performance, and security:\n\n${code}`,
          },
        },
      ],
    })
  );

  return server;
}

// Start server if executed directly
if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
  const server = createCalculatorServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    console.error("Fatal error starting Calculator MCP server:", err);
    process.exit(1);
  });
}
