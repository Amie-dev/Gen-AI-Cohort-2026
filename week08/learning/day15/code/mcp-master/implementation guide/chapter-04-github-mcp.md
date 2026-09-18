# Chapter 4: GitHub Integration MCP Server

## 1. Overview & Service Capabilities

Module 4 demonstrates building an API integration MCP server. Using `GitHubService`, this server exposes tools to search GitHub repositories, retrieve issues, open new issues, and create pull requests. It also provides a pre-engineered prompt template (`github-code-review`) for automated PR code reviews.

---

## 2. GitHub Domain Service (`github.service.ts`)

Source file: [github.service.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/04-github-mcp/github.service.ts)

```typescript
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  author: string;
}

export interface GitHubRepo {
  owner: string;
  name: string;
  stars: number;
  description: string;
}

export class GitHubService {
  private repos: GitHubRepo[] = [
    { owner: "facebook", name: "react", stars: 220000, description: "A JavaScript library for building user interfaces" },
    { owner: "vercel", name: "next.js", stars: 120000, description: "The React Framework for the Web" },
    { owner: "modelcontextprotocol", name: "typescript-sdk", stars: 8500, description: "Official TypeScript SDK for Model Context Protocol" },
  ];

  private issues: Record<string, GitHubIssue[]> = {
    "modelcontextprotocol/typescript-sdk": [
      { id: 101, number: 1, title: "Add SSE Transport support", body: "Support HTTP Server-Sent Events", state: "closed", author: "aminul" },
      { id: 102, number: 2, title: "Support resource templates", body: "Implement URI template matching", state: "open", author: "alex" },
    ],
  };

  public async searchRepositories(query: string): Promise<GitHubRepo[]> {
    const q = query.toLowerCase();
    return this.repos.filter(
      (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q)
    );
  }

  public async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const key = `${owner}/${repo}`.toLowerCase();
    const issueList = this.issues[key] || [];
    const issue = issueList.find((i) => i.number === issueNumber);
    if (!issue) {
      throw new Error(`Issue #${issueNumber} not found in repository ${owner}/${repo}`);
    }
    return issue;
  }

  public async createIssue(owner: string, repo: string, title: string, body: string): Promise<GitHubIssue> {
    const key = `${owner}/${repo}`.toLowerCase();
    if (!this.issues[key]) this.issues[key] = [];
    
    const newNumber = this.issues[key].length + 1;
    const newIssue: GitHubIssue = {
      id: Date.now(),
      number: newNumber,
      title,
      body,
      state: "open",
      author: "mcp-agent",
    };
    this.issues[key].push(newIssue);
    return newIssue;
  }

  public async createPullRequest(owner: string, repo: string, title: string, head: string, base: string) {
    return {
      id: Date.now(),
      number: 42,
      title,
      head,
      base,
      html_url: `https://github.com/${owner}/${repo}/pull/42`,
      status: "open",
    };
  }
}
```

---

## 3. GitHub MCP Server (`server.ts`)

Source file: [server.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/04-github-mcp/server.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GitHubService } from "./github.service.js";

export function createGitHubServer(): McpServer {
  const server = new McpServer({
    name: "github-mcp-server",
    version: "1.0.0",
  });

  const gh = new GitHubService();

  // Tool 1: search_repositories
  server.tool(
    "search_repositories",
    "Search GitHub repositories by keyword",
    {
      query: z.string().describe("Search term"),
    },
    async ({ query }) => {
      const repos = await gh.searchRepositories(query);
      return {
        content: [{ type: "text", text: JSON.stringify({ count: repos.length, repositories: repos }, null, 2) }],
      };
    }
  );

  // Tool 2: get_issue
  server.tool(
    "get_issue",
    "Get issue details by repository owner, name, and issue number",
    {
      owner: z.string().describe("Repository owner"),
      repo: z.string().describe("Repository name"),
      issueNumber: z.number().int().positive().describe("Issue number"),
    },
    async ({ owner, repo, issueNumber }) => {
      try {
        const issue = await gh.getIssue(owner, repo, issueNumber);
        return {
          content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `GitHub API Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 3: create_issue
  server.tool(
    "create_issue",
    "Create a new issue on a repository",
    {
      owner: z.string().describe("Repository owner"),
      repo: z.string().describe("Repository name"),
      title: z.string().min(1).describe("Issue title"),
      body: z.string().describe("Issue description / markdown body"),
    },
    async ({ owner, repo, title, body }) => {
      try {
        const issue = await gh.createIssue(owner, repo, title, body);
        return {
          content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `GitHub API Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool 4: create_pull_request
  server.tool(
    "create_pull_request",
    "Create a pull request across branches",
    {
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      head: z.string().describe("Branch with code changes"),
      base: z.string().describe("Target branch (e.g. main)"),
    },
    async ({ owner, repo, title, head, base }) => {
      const pr = await gh.createPullRequest(owner, repo, title, head, base);
      return {
        content: [{ type: "text", text: JSON.stringify(pr, null, 2) }],
      };
    }
  );

  // Prompt: github-code-review
  server.prompt(
    "github-code-review",
    {
      repo: z.string(),
      prNumber: z.number(),
    },
    ({ repo, prNumber }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Perform an automated GitHub Pull Request Review for repository '${repo}', PR #${prNumber}. Focus on breaking changes, test coverage, and documentation update requirements.`,
          },
        },
      ],
    })
  );

  return server;
}
```

---

## 4. Client Implementation (`client.ts`)

Source file: [client.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/04-github-mcp/client.ts)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("🚀 Starting GitHub MCP Client test...");

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
  console.log("✅ Connected to GitHub MCP Server via STDIO");

  // 1. Search Repositories
  const searchRes = await client.callTool({
    name: "search_repositories",
    arguments: { query: "sdk" },
  });
  console.log("\n🔍 Search Repositories ('sdk'):\n", (searchRes.content as any[])?.[0]?.text);

  // 2. Get Issue #1
  const issueRes = await client.callTool({
    name: "get_issue",
    arguments: { owner: "modelcontextprotocol", repo: "typescript-sdk", issueNumber: 1 },
  });
  console.log("\n📌 Get Issue #1:\n", (issueRes.content as any[])?.[0]?.text);

  // 3. Create Issue
  const newIssueRes = await client.callTool({
    name: "create_issue",
    arguments: {
      owner: "modelcontextprotocol",
      repo: "typescript-sdk",
      title: "Add Gateway middleware tool filtering",
      body: "Filter tools based on intent score before passing schemas to LLM.",
    },
  });
  console.log("\n➕ Created New Issue:\n", (newIssueRes.content as any[])?.[0]?.text);

  // 4. Create PR
  const prRes = await client.callTool({
    name: "create_pull_request",
    arguments: {
      owner: "modelcontextprotocol",
      repo: "typescript-sdk",
      title: "feat: add gateway tool filtering",
      head: "feature/gateway-filter",
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
```

---

## 5. Execution & Verification

Run the test suite using NPM:

```bash
npm run dev:04-github
```

### Expected Output
```text
🚀 Starting GitHub MCP Client test...
✅ Connected to GitHub MCP Server via STDIO

🔍 Search Repositories ('sdk'):
 {
  "count": 1,
  "repositories": [
    {
      "owner": "modelcontextprotocol",
      "name": "typescript-sdk",
      "stars": 8500,
      "description": "Official TypeScript SDK for Model Context Protocol"
    }
  ]
}

📌 Get Issue #1:
 {
  "id": 101,
  "number": 1,
  "title": "Add SSE Transport support",
  "body": "Support HTTP Server-Sent Events",
  "state": "closed",
  "author": "aminul"
}

➕ Created New Issue:
 {
  "id": 1726678234,
  "number": 3,
  "title": "Add Gateway middleware tool filtering",
  "body": "Filter tools based on intent score before passing schemas to LLM.",
  "state": "open",
  "author": "mcp-agent"
}

👋 GitHub Client test complete.
```
