# 📚 Day 15 — Model Context Protocol (MCP) Master Notes

Welcome to the chapter-wise notes for **Day 15: Model Context Protocol (MCP)**. These notes cover MCP concepts from first principles, architecture, transports, context poisoning, and gateways.

---

## 📑 Chapter Directory

| Chapter | File Link | Key Topics Covered |
| :--- | :--- | :--- |
| **Chapter 1** | [01-introduction-to-mcp.md](./01-introduction-to-mcp.md) | 2024 Agentic AI trend, Tool fragmentation, REST API analogy, Core MCP definition |
| **Chapter 2** | [02-mcp-architecture-and-providers.md](./02-mcp-architecture-and-providers.md) | Host Application, MCP Client, MCP Server/Provider, Tools, Resources, Prompts, JSON-RPC 2.0 |
| **Chapter 3** | [03-mcp-transports-stdio-and-http-sse.md](./03-mcp-transports-stdio-and-http-sse.md) | Protocol vs Transport separation, STDIO (local process pipes), HTTP Streaming / SSE, Comparison matrix |
| **Chapter 4** | [04-tool-context-poisoning-and-mcp-gateway.md](./04-tool-context-poisoning-and-mcp-gateway.md) | Tool overload, Context poisoning, MCP Gateway architecture, Dynamic tool filtering, Routing & Security |
| **Chapter 5** | [05-mcp-interview-guide-and-summary.md](./05-mcp-interview-guide-and-summary.md) | Top Technical Q&A, Ecosystem architecture diagrams, Mental models |

---

## 💻 Code Examples Directory

All runnable code implementations are located in [`../code/mcp`](../code/mcp):

* 🛠️ **STDIO Server & Client**: [`../code/mcp/01-stdio-mcp-server/`](../code/mcp/01-stdio-mcp-server/)
* 🌐 **HTTP/SSE Server & Client**: [`../code/mcp/02-http-sse-mcp-server/`](../code/mcp/02-http-sse-mcp-server/)
* 🚪 **MCP Gateway & Filtering Demo**: [`../code/mcp/03-mcp-gateway/`](../code/mcp/03-mcp-gateway/)

---

## 📄 Raw Class Transcript

* **Raw Notes**: [raw-class.md](./raw-class.md)
