# Chapter 1: Calculator Stdio MCP Server & Client

## 1. Overview & Project Goals

Module 1 demonstrates the foundation of local MCP development: building a **Calculator MCP Server** and a corresponding **MCP Client** communicating locally over standard input and output streams (**STDIO transport**).

In this chapter, we explore how to expose mathematical tools (`add`, `multiply`, `divide`), static documentation resources (`docs://getting-started`), and prompt templates (`code-review`) using Zod parameter validation and explicit error handling contracts.

---

## 2. Server Implementation (`server.ts`)

Source file: [server.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/01-calculator-mcp/server.ts)

The server utilizes the `McpServer` builder from `@modelcontextprotocol/sdk/server/mcp.js`.

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export function createCalculatorServer(): McpServer {
  const server = new McpServer({
    name: "calculator-server",
    version: "1.0.0",
  });

  // 1. Tool: add
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

  // 2. Tool: multiply
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

  // 3. Tool: divide (with Error Boundary)
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

  // 4. Resource: documentation
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

  // 5. Prompt: code-review
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
```

### Key Technical Patterns in `server.ts`:
1. **Zod Input Validation**: `a: z.number()`, `b: z.number()` enforces type safety at the protocol boundary. If an invalid type is passed, the SDK returns a JSON-RPC error automatically.
2. **Error Flag (`isError: true`)**: When dividing by zero (`b === 0`), the handler returns `{ isError: true }`. This signals to the connected LLM host that the execution failed gracefully without throwing an unhandled process exception.
3. **Resource Handlers**: Resources are read-only documents accessible via URI (`docs://getting-started`).
4. **Prompt Templates**: Structured prompt generators that help standardized user/system prompt formatting.

---

## 3. Client Implementation (`client.ts`)

Source file: [client.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/01-calculator-mcp/client.ts)

The client spawns `server.ts` in a child process using `StdioClientTransport` and `npx tsx`:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("🚀 Starting Calculator MCP Client test...");

  const serverPath = path.join(__dirname, "server.ts");

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", serverPath],
  });

  const client = new Client(
    { name: "calculator-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected to Calculator MCP Server via STDIO");

  // 1. List Available Tools
  const tools = await client.listTools();
  console.log("\n📋 Available Tools:");
  tools.tools.forEach((t) => console.log(` - ${t.name}: ${t.description}`));

  // 2. Call Tool: add (15 + 25)
  const addRes = await client.callTool({
    name: "add",
    arguments: { a: 15, b: 25 },
  });
  console.log("\n🧮 Calling 'add' (15 + 25):", addRes.content);

  // 3. Call Tool: multiply (6 * 7)
  const multRes = await client.callTool({
    name: "multiply",
    arguments: { a: 6, b: 7 },
  });
  console.log("🧮 Calling 'multiply' (6 * 7):", multRes.content);

  // 4. Call Tool: divide by 0 (Error verification)
  const divErrRes = await client.callTool({
    name: "divide",
    arguments: { a: 10, b: 0 },
  });
  console.log("⚠️ Calling 'divide' by 0:", divErrRes);

  // 5. Read Resource
  const resData = await client.readResource({ uri: "docs://getting-started" });
  const docItem = resData.contents[0];
  const docText = docItem && "text" in docItem ? docItem.text : "";
  console.log("\n📄 Reading Resource 'docs://getting-started':", docText);

  // 6. Get Prompt Template
  const promptData = await client.getPrompt({
    name: "code-review",
    arguments: { language: "TypeScript", code: "const x: number = 100;" },
  });
  console.log("\n💬 Getting Prompt 'code-review':", promptData.messages[0]?.content);

  await client.close();
  console.log("\n👋 Calculator Client test complete.");
}

main().catch((err) => {
  console.error("❌ Calculator client error:", err);
  process.exit(1);
});
```

---

## 4. Execution & Verification

Run the test client via the project NPM script:

```bash
npm run dev:01-calculator
```

### Expected Output Terminal Trace
```text
🚀 Starting Calculator MCP Client test...
✅ Connected to Calculator MCP Server via STDIO

📋 Available Tools:
 - add: Add two numbers together
 - multiply: Multiply two numbers
 - divide: Divide two numbers

🧮 Calling 'add' (15 + 25): [ { type: 'text', text: '40' } ]
🧮 Calling 'multiply' (6 * 7): [ { type: 'text', text: '42' } ]
⚠️ Calling 'divide' by 0: {
  content: [ { type: 'text', text: 'Error: Cannot divide by zero' } ],
  isError: true
}

📄 Reading Resource 'docs://getting-started': Calculator MCP Server Documentation:
Exposes add, multiply, and divide tools.

💬 Getting Prompt 'code-review': {
  type: 'text',
  text: 'Review the following TypeScript code for bugs, performance, and security:\n\nconst x: number = 100;'
}

👋 Calculator Client test complete.
```
