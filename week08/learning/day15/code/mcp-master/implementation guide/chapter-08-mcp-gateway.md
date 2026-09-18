# Chapter 8: Centralized MCP Gateway & Context Poisoning Guard

## 1. Context Poisoning & The Tool Explosion Problem

As an enterprise grows its MCP ecosystem, multiple engineering teams build domain-specific MCP servers:
- **Billing Team**: 12 payment tools (`create_charge`, `refund`, `invoice_pdf`...)
- **DevOps Team**: 25 CLI & Kubernetes tools
- **Database Team**: 15 SQL query tools
- **Productivity Team**: 10 Task & Calendar tools

If a Host LLM agent connects directly to 20+ servers without a gateway, **Context Poisoning** occurs:
1. **Token Overspending**: 60+ tool JSON schemas consume 15,000+ tokens per LLM request.
2. **Hallucinations & Confused Tool Routing**: The LLM confuses argument parameters across unrelated domains.
3. **Latency**: Evaluating giant tool schemas slows down first-byte LLM completion times.

### The MCP Gateway Pattern
An **MCP Gateway** acts as a reverse-proxy and tool aggregator between the Host Agent and downstream MCP servers. It provides:
- **Multi-Server Aggregation**: Connects to $N$ backend MCP servers over STDIO or HTTP.
- **Intent-Based Dynamic Tool Filtering**: Scrapes user prompt intent and exposes only the top relevant tool schemas to the LLM context.
- **Cross-Server Tool Routing**: Dispatches tool execution requests to the correct downstream server automatically.

---

## 2. Gateway Implementation (`demo.ts`)

Source file: [demo.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/08-mcp-gateway/demo.ts)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ServerConfig {
  name: string;
  scriptPath: string;
}

export class MCPGateway {
  private clients: Map<string, { client: Client; tools: any[] }> = new Map();

  // 1. Register Downstream MCP Server
  public async registerServer(config: ServerConfig) {
    console.log(`🔌 Gateway connecting to MCP Server: '${config.name}'...`);
    const transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", config.scriptPath],
    });

    const client = new Client(
      { name: `gateway-client-${config.name}`, version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);
    const toolsResponse = await client.listTools();
    const tools = toolsResponse.tools.map((t) => ({
      ...t,
      serverName: config.name,
    }));

    this.clients.set(config.name, { client, tools });
    console.log(`✅ Server '${config.name}' registered with ${tools.length} tools.`);
  }

  // 2. Aggregate All Tools Across Servers
  public getAllTools() {
    const allTools: any[] = [];
    for (const [serverName, data] of this.clients.entries()) {
      allTools.push(...data.tools);
    }
    return allTools;
  }

  // 3. Dynamic Tool Filter based on User Intent
  public filterToolsForIntent(userIntent: string): any[] {
    const intent = userIntent.toLowerCase();
    const all = this.getAllTools();

    // Contextual filtering to eliminate Tool Poisoning
    if (intent.includes("task") || intent.includes("todo") || intent.includes("plan")) {
      return all.filter((t) => t.serverName === "TaskServer");
    }
    if (intent.includes("weather") || intent.includes("temperature") || intent.includes("forecast")) {
      return all.filter((t) => t.serverName === "WeatherServer");
    }
    if (intent.includes("add") || intent.includes("multiply") || intent.includes("math") || intent.includes("calc")) {
      return all.filter((t) => t.serverName === "CalculatorServer");
    }

    return all; // Default return all if intent ambiguous
  }

  // 4. Cross-Server Tool Call Router
  public async routeCallTool(toolName: string, args: any) {
    for (const [serverName, data] of this.clients.entries()) {
      const match = data.tools.find((t) => t.name === toolName);
      if (match) {
        console.log(`🔀 Gateway routing '${toolName}' to '${serverName}'...`);
        return await data.client.callTool({ name: toolName, arguments: args });
      }
    }
    throw new Error(`No registered MCP server handles tool '${toolName}'.`);
  }

  // 5. Shutdown All Backend Connections
  public async shutdown() {
    for (const [name, data] of this.clients.entries()) {
      await data.client.close();
    }
    console.log("🛑 Gateway connections closed.");
  }
}
```

---

## 3. Gateway Multi-Server Demonstration (`main()`)

Source file: [demo.ts](file:///home/aminul/development/gen-ai-cohort/week08/learning/day15/code/mcp-master/src/08-mcp-gateway/demo.ts)

```typescript
async function main() {
  console.log("🏛️ Starting MCP Gateway Demo...\n");

  const gateway = new MCPGateway();

  // Register multiple downstream MCP Servers
  await gateway.registerServer({
    name: "CalculatorServer",
    scriptPath: path.join(__dirname, "../01-calculator-mcp/server.ts"),
  });

  await gateway.registerServer({
    name: "WeatherServer",
    scriptPath: path.join(__dirname, "../02-weather-mcp/server.ts"),
  });

  await gateway.registerServer({
    name: "TaskServer",
    scriptPath: path.join(__dirname, "../05-task-manager-mcp/server.ts"),
  });

  console.log("\n📊 Gateway Aggregated Total Tools:", gateway.getAllTools().length);

  // Intent Test 1: Math/Calculation request
  const intent1 = "I need to calculate numbers and multiply 8 by 9";
  console.log(`\n1️⃣ Intent: "${intent1}"`);
  const tools1 = gateway.filterToolsForIntent(intent1);
  console.log("   Filtered tools:", tools1.map((t) => `${t.serverName}:${t.name}`).join(", "));
  const result1 = await gateway.routeCallTool("multiply", { a: 8, b: 9 });
  console.log("   Result:", (result1.content as any[])?.[0]?.text);

  // Intent Test 2: Weather request
  const intent2 = "Check current weather condition in Paris";
  console.log(`\n2️⃣ Intent: "${intent2}"`);
  const tools2 = gateway.filterToolsForIntent(intent2);
  console.log("   Filtered tools:", tools2.map((t) => `${t.serverName}:${t.name}`).join(", "));
  const result2 = await gateway.routeCallTool("get_weather", { city: "Paris" });
  console.log("   Result:\n", (result2.content as any[])?.[0]?.text);

  // Intent Test 3: Task management request
  const intent3 = "Create a high priority task for my daily goal";
  console.log(`\n3️⃣ Intent: "${intent3}"`);
  const tools3 = gateway.filterToolsForIntent(intent3);
  console.log("   Filtered tools:", tools3.map((t) => `${t.serverName}:${t.name}`).join(", "));
  const result3 = await gateway.routeCallTool("create_task", { title: "Deploy MCP Gateway to Staging", priority: "high" });
  console.log("   Result:\n", (result3.content as any[])?.[0]?.text);

  await gateway.shutdown();
  console.log("\n🎉 MCP Gateway Demo complete.");
}

main().catch((err) => {
  console.error("❌ Gateway error:", err);
  process.exit(1);
});
```

---

## 4. Execution & Verification

Run the Gateway demonstration script:

```bash
npm run dev:08-gateway
```

### Expected Output Terminal Trace
```text
🏛️ Starting MCP Gateway Demo...

🔌 Gateway connecting to MCP Server: 'CalculatorServer'...
✅ Server 'CalculatorServer' registered with 3 tools.
🔌 Gateway connecting to MCP Server: 'WeatherServer'...
✅ Server 'WeatherServer' registered with 2 tools.
🔌 Gateway connecting to MCP Server: 'TaskServer'...
✅ Server 'TaskServer' registered with 4 tools.

📊 Gateway Aggregated Total Tools: 9

1️⃣ Intent: "I need to calculate numbers and multiply 8 by 9"
   Filtered tools: CalculatorServer:add, CalculatorServer:multiply, CalculatorServer:divide
🔀 Gateway routing 'multiply' to 'CalculatorServer'...
   Result: 72

2️⃣ Intent: "Check current weather condition in Paris"
   Filtered tools: WeatherServer:get_weather, WeatherServer:get_forecast
🔀 Gateway routing 'get_weather' to 'WeatherServer'...
   Result:
 {
  "city": "Paris",
  "temperature": 19,
  "unit": "C",
  "condition": "Partly Cloudy",
  "humidity": 60,
  "windSpeed": "12 km/h"
}

3️⃣ Intent: "Create a high priority task for my daily goal"
   Filtered tools: TaskServer:create_task, TaskServer:update_task, TaskServer:complete_task, TaskServer:search_tasks
🔀 Gateway routing 'create_task' to 'TaskServer'...
   Result:
 {
  "id": "task-1726678700000-881",
  "title": "Deploy MCP Gateway to Staging",
  "priority": "high",
  "status": "pending",
  "createdAt": "2026-09-18T16:05:00.000Z"
}

🛑 Gateway connections closed.

🎉 MCP Gateway Demo complete.
```
