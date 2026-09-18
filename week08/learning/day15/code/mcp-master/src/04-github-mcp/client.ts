import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("🐙 Starting GitHub MCP Client test...");

  const serverPath = path.join(__dirname, "server.ts");

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", serverPath],
  });

  const client = new Client(
    { name: "github-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected to GitHub MCP Server");

  // 1. Search Repositories
  const searchRes = await client.callTool({
    name: "search_repositories",
    arguments: { query: "typescript" },
  });
  console.log("\n🔍 Search Repositories ('typescript'):\n", (searchRes.content as any[])?.[0]?.text);

  // 2. Get Issue
  const issueRes = await client.callTool({
    name: "get_issue",
    arguments: { owner: "octocat", repo: "hello-world", issueNumber: 1 },
  });
  console.log("\n📌 Get Issue #1:\n", (issueRes.content as any[])?.[0]?.text);

  // 3. Create Issue
  const newIssueRes = await client.callTool({
    name: "create_issue",
    arguments: {
      owner: "octocat",
      repo: "hello-world",
      title: "Add Automated Unit Tests",
      body: "We need unit test coverage for the MCP integration module.",
    },
  });
  console.log("\n➕ Created New Issue:\n", (newIssueRes.content as any[])?.[0]?.text);

  // 4. Create Pull Request
  const prRes = await client.callTool({
    name: "create_pull_request",
    arguments: {
      owner: "octocat",
      repo: "hello-world",
      title: "Feature: Add Unit Testing Infrastructure",
      head: "feature/unit-tests",
      base: "main",
    },
  });
  console.log("\n🔀 Created Pull Request:\n", (prRes.content as any[])?.[0]?.text);

  await client.close();
  console.log("\n👋 GitHub Client test complete.");
}

main().catch((err) => {
  console.error("❌ GitHub client error:", err);
  process.exit(1);
});
