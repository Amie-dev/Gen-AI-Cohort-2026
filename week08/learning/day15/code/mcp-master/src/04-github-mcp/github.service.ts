export interface Repository {
  owner: string;
  repo: string;
  description: string;
  stars: number;
  openIssues: number;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  author: string;
}

export class GitHubService {
  private mockRepos: Record<string, Repository> = {
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

  private mockIssues: Record<string, Issue[]> = {
    "octocat/hello-world": [
      { id: 1, number: 1, title: "Found a typo in README", body: "Please fix spelling of world.", state: "open", author: "contributor1" },
      { id: 2, number: 2, title: "Add TypeScript definitions", body: "We need index.d.ts", state: "closed", author: "dev_dude" },
    ],
    "modelcontextprotocol/typescript-sdk": [
      { id: 10, number: 101, title: "Streamable HTTP Transport support", body: "Implement v2 stream transport", state: "open", author: "mcp_fan" },
    ],
  };

  public async searchRepositories(query: string): Promise<Repository[]> {
    const q = query.toLowerCase();
    return Object.values(this.mockRepos).filter(
      (r) => r.repo.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  }

  public async getIssue(owner: string, repo: string, issueNumber: number): Promise<Issue> {
    const key = `${owner}/${repo}`.toLowerCase();
    const issues = this.mockIssues[key] || [];
    const issue = issues.find((i) => i.number === issueNumber);
    if (!issue) {
      throw new Error(`Issue #${issueNumber} not found in repository ${owner}/${repo}`);
    }
    return issue;
  }

  public async createIssue(owner: string, repo: string, title: string, body: string): Promise<Issue> {
    const key = `${owner}/${repo}`.toLowerCase();
    if (!this.mockIssues[key]) {
      this.mockIssues[key] = [];
    }
    const newIssueNumber = this.mockIssues[key].length + 100;
    const newIssue: Issue = {
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

  public async createPullRequest(owner: string, repo: string, title: string, head: string, base: string) {
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
