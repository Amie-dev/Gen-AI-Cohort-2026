export class GitHubService {
    mockRepos = {
        "octocat/hello-world": {
            owner: "octocat",
            repo: "hello-world",
            description: "My first repository on GitHub!",
            stars: 1250,
            openIssues: 3,
        },
        "modelcontextprotocol/typescript-sdk": {
            owner: "modelcontextprotocol",
            repo: "typescript-sdk",
            description: "TypeScript SDK for Model Context Protocol",
            stars: 4500,
            openIssues: 12,
        },
    };
    mockIssues = {
        "octocat/hello-world": [
            { id: 1, number: 1, title: "Found a typo in README", body: "Please fix spelling of world.", state: "open", author: "contributor1" },
            { id: 2, number: 2, title: "Add TypeScript definitions", body: "We need index.d.ts", state: "closed", author: "dev_dude" },
        ],
        "modelcontextprotocol/typescript-sdk": [
            { id: 10, number: 101, title: "Streamable HTTP Transport support", body: "Implement v2 stream transport", state: "open", author: "mcp_fan" },
        ],
    };
    async searchRepositories(query) {
        const q = query.toLowerCase();
        return Object.values(this.mockRepos).filter((r) => r.repo.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    async getIssue(owner, repo, issueNumber) {
        const key = `${owner}/${repo}`.toLowerCase();
        const issues = this.mockIssues[key] || [];
        const issue = issues.find((i) => i.number === issueNumber);
        if (!issue) {
            throw new Error(`Issue #${issueNumber} not found in repository ${owner}/${repo}`);
        }
        return issue;
    }
    async createIssue(owner, repo, title, body) {
        const key = `${owner}/${repo}`.toLowerCase();
        if (!this.mockIssues[key]) {
            this.mockIssues[key] = [];
        }
        const newIssueNumber = this.mockIssues[key].length + 100;
        const newIssue = {
            id: Date.now(),
            number: newIssueNumber,
            title,
            body,
            state: "open",
            author: "mcp-agent-bot",
        };
        this.mockIssues[key].push(newIssue);
        return newIssue;
    }
    async createPullRequest(owner, repo, title, head, base) {
        return {
            prNumber: Math.floor(Math.random() * 500) + 1,
            title,
            head,
            base,
            status: "opened",
            url: `https://github.com/${owner}/${repo}/pull/new-branch`,
        };
    }
}
