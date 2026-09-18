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

  // 1. List Tools
  const tools = await client.listTools();
  console.log("\n📋 Available Tools:");
  tools.tools.forEach((t) => console.log(` - ${t.name}: ${t.description}`));

  // 2. Call Tool: add
  const addRes = await client.callTool({
    name: "add",
    arguments: { a: 15, b: 25 },
  });
  console.log("\n🧮 Calling 'add' (15 + 25):", addRes.content);

  // 3. Call Tool: multiply
  const multRes = await client.callTool({
    name: "multiply",
    arguments: { a: 6, b: 7 },
  });
  console.log("🧮 Calling 'multiply' (6 * 7):", multRes.content);

  // 4. Call Tool: divide with zero (error check)
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

  // 6. Get Prompt
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
