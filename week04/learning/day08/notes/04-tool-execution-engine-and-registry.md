# 🛠️ 04 — Tool Execution Engine & Registry

## 1. What is a Tool Engine in an Agent SDK?

An agent without tools is simply a text-generation bot. A **Tool Execution Engine** enables agents to interact with the physical and digital world by:
1. **Exposing Function Signatures**: Injecting tool definitions (name, description, doc signature) into system prompts.
2. **Tool Dispatching**: Matching LLM tool requests (`functionName`) against registered implementations.
3. **Execution Runtime**: Invoking asynchronous functions safely and managing promises/timeouts.
4. **Result Injection**: Formatting execution results or exceptions as `developer` messages and feeding them back to the message history.

---

## 2. Tool Architecture & Interface Definition

```typescript
export interface ITool {
  name: string;
  description: string;
  doc?: string; // Method signature or parameter documentation
  executor: (input: string) => Promise<string> | string;
}
```

---

## 3. Dynamic Tool Schema Serialization

When tools are registered with `AgentBuilder.tool(toolInstance)`, the agent converts the tool metadata into JSON definitions embedded directly into system instructions:

```typescript
private generateToolsPrompt(tools: ITool[]): string {
  if (tools.length === 0) return "No tools registered.";

  return tools
    .map(t => JSON.stringify({
      functionName: t.name,
      functionDescription: t.description,
      functionDoc: t.doc ?? `${t.name}(input: string): string`
    }, null, 2))
    .join("\n\n");
}
```

---

## 4. Built-In Real World Tool Examples

### A. Weather API Tool (`wttr.in`)

```typescript
import axios from "axios";

export const weatherTool: ITool = {
  name: "fetchWeatherInfo",
  description: "Fetches realtime weather data for a given city.",
  doc: "fetchWeatherInfo(cityName: string): WeatherReport",
  async executor(cityName: string) {
    try {
      const url = `https://wttr.in/${encodeURIComponent(cityName.trim())}?format=%C+%t`;
      const response = await axios.get(url, { responseType: "text", timeout: 5000 });
      return JSON.stringify({ cityName, weatherInfo: response.data.trim() });
    } catch (error: any) {
      return JSON.stringify({ error: `Failed to fetch weather: ${error.message}` });
    }
  }
};
```

### B. CLI Command Execution Tool

```typescript
import { exec } from "child_process";

export const cliAccessTool: ITool = {
  name: "execCli",
  description: "Executes shell commands on user system and returns standard output.",
  doc: "execCli(command: string): CLIResponse",
  executor(cmd: string) {
    return new Promise((resolve) => {
      exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          resolve(JSON.stringify({ status: "error", message: error.message, stderr }));
        } else {
          resolve(JSON.stringify({ status: "success", output: stdout.trim() }));
        }
      });
    });
  }
};
```

---

## 5. Tool Execution Lifecycle Inside Agent Run Loop

```typescript
// Inside agent.run loop:
if (parsedResult.step === "TOOL_REQUEST") {
  const { functionName, input } = parsedResult;
  const tool = this.toolMap.get(functionName);

  if (!tool) {
    const errorMsg = `Error: Tool '${functionName}' is not registered in ToolMap.`;
    this.messageHistory.push({ role: "developer", content: errorMsg });
    this.notifyInterceptors({ role: "developer", content: errorMsg });
    continue;
  }

  try {
    const toolResult = await tool.executor(input);
    const resultPayload = JSON.stringify({ functionName, input, toolResult });

    this.messageHistory.push({ role: "developer", content: resultPayload });
    this.notifyInterceptors({ role: "developer", content: resultPayload });
  } catch (err: any) {
    const failPayload = JSON.stringify({ functionName, input, error: err.message });
    this.messageHistory.push({ role: "developer", content: failPayload });
    this.notifyInterceptors({ role: "developer", content: failPayload });
  }
}
```

---

## 6. Summary Key Takeaways

1. **Tool Map Indexing (`Map<string, ITool>`)** guarantees $O(1)$ lookup speed during function dispatching.
2. **Schema Ingestion** auto-generates tool descriptions for system prompts.
3. **Graceful Error Catching** feeds execution errors back to the model rather than crashing the process, allowing the agent to self-correct.
