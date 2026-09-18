# Chapter 0: Protocol Architecture, JSON-RPC 2.0 & TypeScript Setup

## 1. Overview & Protocol Fundamentals

The **Model Context Protocol (MCP)** is an open standard established by Anthropic to unify how Large Language Models (LLMs) connect to external datasets, backend microservices, operating system tools, and local/remote APIs. 

Prior to MCP, every AI framework or application developer wrote custom glue code to inject functions or raw schemas into LLM system prompts. This created fragmented ecosystems, security risks, context bloat, and rigid integrations.

MCP solves this by introducing a clear **Host-Client-Server Architecture** modeled after the Language Server Protocol (LSP) used in modern IDEs.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MCP HOST APPLICATION                               │
│  (Claude Desktop, Cursor, VS Code, or Custom Autonomous Agent Loop)         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        MCP CLIENT INSTANCE                          │   │
│   │   - Manages connection lifecycle & capability negotiation          │   │
│   │   - Sends tools/list, tools/call, resources/read JSON-RPC messages  │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ Transports (STDIO / SSE HTTP)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MCP SERVER INSTANCE                                │
│   - Registers Tools (Zod validation schemas + async execution handlers)     │   │
│   - Exposes Resources (URI endpoints: docs://, tasks://all)                 │   │
│   - Exposes Prompts (reusable LLM prompt templates)                         │   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Capabilities: Tools, Resources & Prompts

An MCP Server exposes three primary primitives to connected Clients:

### A. Tools (Executable Functions)
- **Purpose**: Allow LLMs to perform actions, execute operations, query databases, or call external APIs.
- **Contract**: Defined using a unique name, human-readable description, and a **Zod** schema (converted to JSON Schema on the wire).
- **Return Type**: Structured array of content items (e.g., `{ content: [{ type: "text", text: "..." }], isError?: boolean }`).

### B. Resources (Passive Data Endpoints)
- **Purpose**: Expose contextual data or static documentation to the LLM (similar to GET endpoints in REST).
- **Contract**: Addressed by URI schemes (e.g. `docs://getting-started` or `tasks://all`).
- **Return Type**: Binary or string content mapped with a MIME type (e.g. `text/plain` or `application/json`).

### C. Prompts (Reusable Prompt Templates)
- **Purpose**: Pre-configured user/system prompt templates with parameterized arguments.
- **Contract**: Takes input parameters (e.g. `{ language: "TypeScript", code: "..." }`) and returns structured chat message arrays (`{ messages: [{ role: "user", content: { type: "text", text: "..." } }] }`).

---

## 3. JSON-RPC 2.0 Wire Specification

All communications between MCP Clients and Servers are encoded as **JSON-RPC 2.0** messages transmitted over a transport channel.

### Initial Capability Negotiation Request (`initialize`)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": { "name": "calculator-client", "version": "1.0.0" }
  }
}
```

### Server Initialization Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {}, "resources": {}, "prompts": {} },
    "serverInfo": { "name": "calculator-server", "version": "1.0.0" }
  }
}
```

### Tool Execution Request (`tools/call`)
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "add",
    "arguments": { "a": 15, "b": 25 }
  }
}
```

### Tool Execution Response
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      { "type": "text", "text": "40" }
    ]
  }
}
```

---

## 4. TypeScript NodeNext ESM Configuration

The `mcp-master` workspace is configured using Node.js ES Modules (`"type": "module"`) and TypeScript `NodeNext` module resolution to support standard ESM imports (`.js` extensions in imports).

### `package.json` Configuration
[package.json](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/package.json)

```json
{
  "name": "mcp-master-projects",
  "version": "1.0.0",
  "description": "Complete MCP Master TypeScript Implementations and Projects",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev:01-calculator": "tsx src/01-calculator-mcp/client.ts",
    "dev:02-weather": "tsx src/02-weather-mcp/client.ts",
    "dev:03-database": "tsx src/03-database-mcp/client.ts",
    "dev:04-github": "tsx src/04-github-mcp/client.ts",
    "dev:05-task-manager": "tsx src/05-task-manager-mcp/client.ts",
    "dev:06-agent-loop": "tsx src/06-llm-agent-loop/agent.ts",
    "dev:07-http-server": "tsx src/07-streamable-http-mcp/server.ts",
    "dev:07-http-client": "tsx src/07-streamable-http-mcp/client.ts",
    "dev:08-gateway": "tsx src/08-mcp-gateway/demo.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.6.0",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.7",
    "tsx": "^4.7.2",
    "typescript": "^5.4.5"
  }
}
```

### `tsconfig.json` Configuration
[tsconfig.json](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

> [!NOTE]
> When compiling TypeScript with `"moduleResolution": "NodeNext"`, relative file imports in source files must specify the target JavaScript extension (e.g. `import { WeatherService } from "./weather.service.js";`) even though the source file ends in `.ts`.

---

## 5. Introduction to High-Level `@modelcontextprotocol/sdk` API

The official `@modelcontextprotocol/sdk` provides high-level abstractions that eliminate the need to manually format JSON-RPC messages or parse raw streams:

- **`McpServer`**: High-level builder class for creating MCP servers. Allows fluid chaining of `.tool()`, `.resource()`, and `.prompt()`.
- **`Client`**: Host-side client instance for listing tools, executing calls, reading resources, and calling prompts.
- **`StdioServerTransport` & `StdioClientTransport`**: Standard I/O subprocess transport stream wrappers.
- **`SSEServerTransport` & `SSEClientTransport`**: Remote HTTP streaming transport implementation over Server-Sent Events (SSE).
