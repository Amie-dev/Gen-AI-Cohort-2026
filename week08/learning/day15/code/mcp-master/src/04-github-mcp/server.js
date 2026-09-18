import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GitHubService } from "./github.service.js";
export function createGitHubServer() {
    const server = new McpServer({
        name: "github-mcp-server",
        version: "1.0.0",
    });
    const gh = new GitHubService();
    // Tool: search_repositories
    server.tool("search_repositories", "Search GitHub repositories by keyword", {
        query: z.string().describe("Search term"),
    }, async ({ query }) => {
        const repos = await gh.searchRepositories(query);
        return {
            content: [{ type: "text", text: JSON.stringify({ count: repos.length, repositories: repos }, null, 2) }],
        };
    });
    // Tool: get_issue
    server.tool("get_issue", "Get issue details by repository owner, name, and issue number", {
        owner: z.string().describe("Repository owner"),
        repo: z.string().describe("Repository name"),
        issueNumber: z.number().int().positive().describe("Issue number"),
    }, async ({ owner, repo, issueNumber }) => {
        try {
            const issue = await gh.getIssue(owner, repo, issueNumber);
            return {
                content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `GitHub API Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Tool: create_issue
    server.tool("create_issue", "Create a new issue on a repository", {
        owner: z.string().describe("Repository owner"),
        repo: z.string().describe("Repository name"),
        title: z.string().min(1).describe("Issue title"),
        body: z.string().describe("Issue description / markdown body"),
    }, async ({ owner, repo, title, body }) => {
        try {
            const issue = await gh.createIssue(owner, repo, title, body);
            return {
                content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
            };
        }
        catch (err) {
            return {
                content: [{ type: "text", text: `GitHub API Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    // Tool: create_pull_request
    server.tool("create_pull_request", "Create a pull request across branches", {
        owner: z.string(),
        repo: z.string(),
        title: z.string(),
        head: z.string().describe("Branch with code changes"),
        base: z.string().describe("Target branch (e.g. main)"),
    }, async ({ owner, repo, title, head, base }) => {
        const pr = await gh.createPullRequest(owner, repo, title, head, base);
        return {
            content: [{ type: "text", text: JSON.stringify(pr, null, 2) }],
        };
    });
    // Prompt: github-code-review
    server.prompt("github-code-review", {
        repo: z.string(),
        prNumber: z.number(),
    }, ({ repo, prNumber }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Perform an automated GitHub Pull Request Review for repository '${repo}', PR #${prNumber}. Focus on breaking changes, test coverage, and documentation update requirements.`,
                },
            },
        ],
    }));
    return server;
}
if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
    const server = createGitHubServer();
    const transport = new StdioServerTransport();
    server.connect(transport).catch((err) => {
        console.error("Fatal error starting GitHub MCP Server:", err);
        process.exit(1);
    });
}
