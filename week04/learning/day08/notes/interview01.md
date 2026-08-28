# 🎯 Week 04 — Day 08: Interview Questions & Answers

Below are **only the interview questions covered by your notes** on Agent SDK architecture, Builder Pattern, Harness Prompting, ReAct, Tool Registry, Message State, Interceptors, JSON parsing, and loop safety.

---

## 1. What is an Agent SDK?

**Answer:**
An Agent SDK is a runtime framework that turns a basic stateless LLM API into a **stateful autonomous agent** by managing:

* `messageHistory`
* system/harness prompts
* tool registration and execution
* ReAct execution loops
* structured output parsing
* interceptors/middleware
* safety limits such as `MAX_LOOP`

---

## 2. What is the difference between a stateless LLM API and a stateful Agent SDK?

**Answer:**
A stateless LLM API does not automatically maintain conversation or execution state. The application must send the required context on every request.

A stateful Agent SDK maintains state internally through structures such as `messageHistory` and manages the entire agent execution lifecycle.

**In short:**

```text
LLM API
Request → LLM → Response

Agent SDK
User → State → LLM → Tool → State → LLM → Output
```

---

## 3. What problems occur when using raw LLM APIs for autonomous agents?

**Answer:**
The main problems are:

1. **State fragmentation** — developers manually manage messages and tool results.
2. **Uncontrolled tool invocation** — models may produce incorrect tool names or arguments.
3. **Infinite execution loops** — an agent can repeatedly call tools.
4. **Poor observability** — intermediate steps and tool executions are difficult to monitor.

An Agent SDK centralizes these responsibilities.

---

## 4. What are the three core components of an Agent System?

**Answer:**

```text
Agent System =
LLM Engine
+
System Instructions + Harness Prompt
+
Tools Registry
```

### The three components are:

1. **LLM Engine** — the reasoning/generation model.
2. **Instructions & Harness Prompt** — defines behavior and execution structure.
3. **Tools Registry** — stores executable capabilities available to the agent.

---

## 5. What is the purpose of the Tools Map?

**Answer:**
The Tools Map stores registered tools using their names as keys:

```typescript
Map<string, ITool>
```

When the LLM requests a tool, the agent can quickly find the implementation using:

```typescript
toolMap.get(functionName)
```

This provides efficient **O(1) average lookup**.

---

## 6. What design pattern is used in `AgentBuilder`?

**Answer:**
The **Builder Pattern**.

It separates agent configuration from agent execution.

For example:

```typescript
Agent.builder()
  .setInstructions(...)
  .tool(...)
  .attachInterceptor(...)
  .build();
```

This makes complex object construction easier and provides a fluent API.

---

## 7. Why use the Builder Pattern for an Agent SDK?

**Answer:**
It provides:

* Fluent method chaining
* Centralized configuration
* Default values
* Configuration validation
* Cleaner agent construction
* Separation between configuration and runtime

---

## 8. What is a fluent interface?

**Answer:**
A fluent interface allows methods to be chained together because configuration methods return the current builder instance.

Example:

```typescript
builder
  .setInstructions(...)
  .tool(weatherTool)
  .attachInterceptor(logger)
  .build();
```

---

## 9. What is a Harness Prompt?

**Answer:**
A Harness Prompt is a framework-controlled system prompt that tells the LLM **how to behave and how to structure its responses**.

It can enforce:

* execution steps
* tool usage format
* JSON output
* reasoning workflow
* final output behavior

It acts as an operational contract between the LLM and the Agent SDK.

---

## 10. What is the ReAct execution pipeline used in this SDK?

**Answer:**

```text
INITIAL
   ↓
THINK
   ↓
TOOL_REQUEST
   ↓
ANALYSE
   ↓
OUTPUT
```

The steps are:

* **INITIAL** — identify the user's goal.
* **THINK** — break the problem into sub-tasks.
* **TOOL_REQUEST** — request execution of a tool.
* **ANALYSE** — evaluate the tool result.
* **OUTPUT** — produce the final answer.

The process can repeat until `OUTPUT` is reached.

---

## 11. What is the purpose of the `TOOL_REQUEST` step?

**Answer:**
`TOOL_REQUEST` tells the Agent SDK that the LLM wants to execute a registered tool.

Example:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

The runtime extracts `functionName` and `input`, finds the tool in `toolMap`, and executes it.

---

## 12. Why does the SDK require structured JSON output from the LLM?

**Answer:**
Because the Agent SDK needs to programmatically determine what the model wants to do.

For example:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

The runtime can reliably inspect:

```typescript
parsed.step
parsed.functionName
parsed.input
```

Without structured output, tool dispatching becomes unreliable.

---

## 13. What happens if the LLM returns invalid JSON?

**Answer:**
The SDK first tries:

```typescript
JSON.parse(rawText)
```

If that fails, it attempts to extract a JSON object from the surrounding text using a regex.

If valid JSON still cannot be extracted, it throws an error.

So the parser provides a **defensive fallback mechanism**.

---

## 14. Why is JSON extraction useful?

**Answer:**
LLMs may return something like:

```text
Here is the tool request:

{"step":"TOOL_REQUEST","functionName":"fetchWeatherInfo","input":"Goa"}
```

Direct `JSON.parse()` fails because of the extra text.

The extraction guard searches for the JSON object, extracts it, and then parses it.

---

## 15. What is the `ITool` interface?

**Answer:**
`ITool` defines the contract that every tool must follow.

```typescript
interface ITool {
  name: string;
  description: string;
  doc?: string;
  executor: (input: string) => Promise<string> | string;
}
```

It provides:

* tool name
* tool description
* optional documentation
* executable function

---

## 16. What is the purpose of `description` and `doc` in a tool?

**Answer:**

`description` explains **what the tool does**.

`doc` explains **how the tool should be called**, such as its expected input and output.

Example:

```typescript
description: "Fetches live weather reports by city name."

doc: "fetchWeatherInfo(cityName: string): WeatherData"
```

This information is provided to the LLM through the system prompt.

---

## 17. How does the Agent SDK expose tools to the LLM?

**Answer:**
When tools are registered, their metadata is serialized into JSON and added to the system instructions.

Conceptually:

```text
Tool
 ↓
name + description + doc
 ↓
JSON serialization
 ↓
System Prompt
 ↓
LLM
```

This allows the model to know which capabilities are available.

---

## 18. How does tool dispatching work?

**Answer:**
The process is:

```text
LLM
 ↓
TOOL_REQUEST
 ↓
functionName
 ↓
toolMap.get(functionName)
 ↓
tool.executor(input)
 ↓
toolResult
 ↓
messageHistory
```

The runtime matches the requested function name with the registered tool.

---

## 19. What happens if the requested tool does not exist?

**Answer:**
The SDK does not crash immediately.

It creates an error message such as:

```text
Error: Tool 'xyz' not found.
```

Then it adds that message to `messageHistory` using the `developer` role.

The interceptor is also notified.

The agent can then continue its loop and potentially correct itself.

---

## 20. What happens after a tool successfully executes?

**Answer:**
The result is converted into a developer message and appended to `messageHistory`.

Conceptually:

```json
{
  "role": "developer",
  "content": {
    "functionName": "fetchWeatherInfo",
    "input": "Goa",
    "toolResult": "Clear +29°C"
  }
}
```

On the next LLM call, this result becomes part of the context.

---

## 21. What is Message State Execution?

**Answer:**
Message State Execution is the process of continuously updating `messageHistory` as the agent performs actions.

The history contains:

```text
User message
      ↓
Assistant response
      ↓
Tool request
      ↓
Developer tool result
      ↓
Assistant analysis
      ↓
Assistant output
```

This allows the agent to maintain execution context across multiple turns.

---

## 22. What are the three message roles used in this SDK?

**Answer:**

### `user`

Represents the human's request.

### `assistant`

Represents the LLM's intermediate or final responses.

### `developer`

Represents runtime feedback such as:

* tool results
* errors
* execution information
* environment feedback

---

## 23. Why is `messageHistory` important?

**Answer:**
It provides the agent with the context of its previous actions.

Without it, the LLM would not know:

* what the user asked
* which tools were requested
* what tools returned
* what happened in previous execution steps

Therefore, `messageHistory` is the core state of the agent execution loop.

---

## 24. What is an Interceptor?

**Answer:**
An interceptor is a lifecycle hook that receives messages whenever the Agent SDK adds relevant messages to the execution history.

Its signature is:

```typescript
type Interceptor = (message: IMessage) => void;
```

It allows external logic to observe agent execution without changing the core agent logic.

---

## 25. Which design pattern does the interceptor architecture represent?

**Answer:**
It primarily follows the **Observer / Event Listener pattern**.

The Agent SDK produces events, and registered interceptors observe those events.

```text
Agent
  │
  ├── Logger
  ├── Metrics
  ├── Audit
  └── Monitoring
```

---

## 26. What can interceptors be used for?

**Answer:**
They can be used for:

* terminal logging
* telemetry
* metrics
* auditing
* debugging
* monitoring tool calls
* tracking agent execution

The important idea is **separation of concerns**.

---

## 27. How does a logging interceptor work?

**Answer:**
The interceptor receives an `IMessage` and logs information such as:

```text
timestamp
role
message content
```

For example:

```typescript
agent.attachInterceptor((msg) => {
  console.log(msg.role, msg.content);
});
```

The core agent doesn't need to contain logging logic.

---

## 28. Why are interceptors better than putting logging directly inside the Agent class?

**Answer:**
Because they separate monitoring concerns from execution logic.

Without interceptors:

```text
Agent = execution + logging + metrics + auditing
```

With interceptors:

```text
Agent = execution

Interceptor = logging
Interceptor = metrics
Interceptor = auditing
```

This makes the system easier to maintain and extend.

---

## 29. What is `MAX_LOOP` and why is it necessary?

**Answer:**
`MAX_LOOP` is a hard limit on the number of agent execution iterations.

For example:

```typescript
maxLoop = 30;
```

If the agent does not reach:

```text
OUTPUT
```

within 30 iterations, execution is terminated.

This prevents infinite loops and uncontrolled API/token usage.

---

## 30. What could cause an agent to enter an infinite loop?

**Answer:**
Possible causes include:

* repeated tool failures
* invalid tool arguments
* model confusion
* repeatedly requesting the same tool
* failure to reach the `OUTPUT` step

`MAX_LOOP` provides a safety boundary.

---

## 31. What happens when `MAX_LOOP` is exceeded?

**Answer:**
The SDK terminates execution and throws an error such as:

```text
Agent exceeded MAX_LOOP limit of 30 turns.
```

This prevents unbounded execution and uncontrolled billing.

---

## 32. Explain the complete Agent execution lifecycle.

**Answer:**

```text
User Query
    ↓
messageHistory
    ↓
LLM Call
    ↓
Parse JSON
    ↓
Inspect step
    ↓
 ┌───────────────┐
 │ TOOL_REQUEST? │
 └───────┬───────┘
         ↓
   Find Tool
         ↓
   Execute Tool
         ↓
 Developer Result
         ↓
 messageHistory
         ↓
     LLM Again
         ↓
       OUTPUT
         ↓
   Return Result
```

The loop continues until the model produces `OUTPUT` or `MAX_LOOP` is reached.

---

## 33. What happens when the LLM produces an `OUTPUT` step?

**Answer:**
The Agent SDK stops the execution loop and returns the current `messageHistory`.

```typescript
if (parsed.step === "OUTPUT") {
  return this.messageHistory;
}
```

---

## 34. What is the purpose of the Weather Tool example?

**Answer:**
It demonstrates how an external API can be wrapped as an `ITool`.

The tool:

1. receives a city name,
2. calls `wttr.in`,
3. receives weather information,
4. returns the result as a string/JSON payload.

This demonstrates how an Agent can interact with an external service.

---

## 35. What is the purpose of the CLI Tool example?

**Answer:**
The CLI tool demonstrates how an Agent can execute shell commands through Node.js's `child_process.exec`.

Conceptually:

```text
LLM
 ↓
execCli
 ↓
Shell Command
 ↓
stdout / stderr
 ↓
Agent
```

It shows that tools can provide access to system-level capabilities.

---

## 36. What is the main difference between the Weather Tool and CLI Tool?

**Answer:**

| Tool         | Capability                    |
| ------------ | ----------------------------- |
| Weather Tool | External API interaction      |
| CLI Tool     | Host system command execution |

Both follow the same `ITool` contract but provide different capabilities.

---

## 37. How does the Agent know which tool to execute?

**Answer:**
The LLM provides the tool's `functionName` in the structured `TOOL_REQUEST`.

The Agent then performs:

```typescript
const tool = toolMap.get(functionName);
```

If found:

```typescript
await tool.executor(input);
```

---

## 38. Why should tool execution be asynchronous?

**Answer:**
Many tools perform I/O operations such as:

* API requests
* database operations
* file operations
* network calls

Therefore, the `executor` supports:

```typescript
Promise<string> | string
```

This allows both synchronous and asynchronous tools.

---

## 39. What is the role of `notifyInterceptors()`?

**Answer:**
It sends newly generated messages to every registered interceptor.

Conceptually:

```typescript
for (const fn of interceptors) {
  fn(message);
}
```

This allows logging, metrics, and monitoring to react to agent events.

---

## 40. Explain the architecture of the complete Agent SDK in one answer.

**Answer:**
The SDK consists of several cooperating components:

```text
                 ┌──────────────┐
                 │     User     │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    Agent     │
                 └──────┬───────┘
                        ↓
                messageHistory
                        ↓
                 ┌──────────────┐
                 │     LLM      │
                 └──────┬───────┘
                        ↓
                 Structured JSON
                        ↓
              ┌─────────┴─────────┐
              ↓                   ↓
        TOOL_REQUEST            OUTPUT
              ↓                   ↓
          toolMap             Final Result
              ↓
         Tool Executor
              ↓
       Developer Message
              ↓
        messageHistory
              ↓
             LLM
```

The **Builder Pattern** constructs the agent, the **Harness Prompt** controls the LLM's execution format, the **Tool Registry** provides capabilities, `messageHistory` maintains state, **Interceptors** provide observability, and `MAX_LOOP` provides execution safety.

---

# 🔥 Rapid-Fire Interview Revision

| Question                   | Short Answer                                            |
| -------------------------- | ------------------------------------------------------- |
| Stateless LLM API?         | Each request must receive its required context.         |
| Stateful Agent SDK?        | Maintains execution state and orchestrates agent loops. |
| Agent core components?     | LLM + Instructions/Harness + Tools Registry.            |
| Construction pattern?      | Builder Pattern.                                        |
| Harness Prompt?            | Controls agent behavior and output protocol.            |
| ReAct steps?               | `INITIAL → THINK → TOOL_REQUEST → ANALYSE → OUTPUT`.    |
| Tool interface?            | `ITool`.                                                |
| Tool lookup?               | `Map<string, ITool>`.                                   |
| Tool execution?            | `tool.executor(input)`.                                 |
| Agent state?               | `messageHistory`.                                       |
| User role?                 | Human input.                                            |
| Assistant role?            | Model responses/actions.                                |
| Developer role?            | Runtime/tool feedback.                                  |
| Interceptor pattern?       | Observer/Event Listener.                                |
| Interceptor purpose?       | Logging, metrics, auditing, monitoring.                 |
| JSON parser purpose?       | Reliably interpret LLM actions.                         |
| JSON fallback?             | Extract JSON from surrounding text.                     |
| Infinite-loop protection?  | `MAX_LOOP`.                                             |
| Tool not found?            | Add error to history and continue.                      |
| Tool result?               | Added as a `developer` message.                         |
| Final step?                | `OUTPUT`.                                               |
| External API example?      | Weather tool.                                           |
| System capability example? | CLI execution tool.                                     |
