# Build a Tiny AI Agent: a beginner's guide

This folder builds a **small agent framework** using the OpenAI package. It is a simplified agent you are building yourself, not an official SDK.

An agent is an LLM (the model) plus three useful abilities:

1. **Instructions** — tell the model how to behave.
2. **Memory** — remember the conversation so far.
3. **Tools** — let the model request real work, such as weather data or a command.

## The big picture

```text
index.ts                     app/agent.ts                    OpenAI
----------                   ------------                    ------
create tools ─────────────►  Agent stores tools
build agent ──────────────►  Agent creates prompt
agent.run(question) ──────►  sends prompt + memory ────────► model
                             ◄──────── JSON reply ─────────
                             if tool requested:
                             run local tool
                             save tool result in memory
                             send memory to model again
                             stop when model says OUTPUT
```

The key idea: **the model does not execute a tool itself.** It asks for a tool in JSON. Your `Agent` code finds and runs that tool, then sends the result back to the model.

## Files in this folder

| File | Job |
| --- | --- |
| `src/index.ts` | The starting point. Defines tools and starts agents. |
| `src/app/agent.ts` | The reusable `Agent` and `AgentBuilder` classes: the agent engine. |
| `src/app/config.ts` | `HARNESS_PROMPT`, which asks the model to follow a JSON pipeline. |
| `package.json` | Lists the packages used by the project. |

## 1. `index.ts`: define what an agent can do

`index.ts` defines tools. A tool has a name, description, and an `executor` function which does the real JavaScript work.

```ts
const weatherTool: ITool = {
  name: "fetchWeatherInfo",
  description: "Fetches realtime weather data by city name",
  async executor(cityName) {
    // The real code makes an HTTP request here.
    return "weather result";
  },
};
```

The model sees the tool name and description in its prompt. If it needs this tool, it should answer with JSON like this:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

Then an agent is created:

```ts
const agent = Agent.builder()
  .setInstructions("You are an expert coding agent")
  .tool(cliAccessTool)
  .build();
```

This is the **builder pattern**. Instead of one large constructor, we configure an `AgentBuilder` step by step, then call `.build()`.

Every builder method returns `this`, meaning “return this same builder.” This makes chaining work:

```text
Agent.builder() → builder
  .setInstructions(...) → same builder
  .tool(...)            → same builder
  .build()              → finished Agent
```

Finally, `agent.run(question)` starts the agent loop. `attachInterceptor(...)` only observes messages; in this project it logs the assistant replies and tool results.

## 2. `ITool`: the contract for every tool

In `agent.ts`, this interface says what every tool must provide:

```ts
export interface ITool {
  name: string;
  description: string;
  doc?: string;
  executor: (input: string) => Promise<string>;
}
```

Think of an interface as a TypeScript rule:

```text
name        → how the model requests the tool
description → helps the model decide when to use it
executor    → the actual TypeScript function that performs work
```

`Promise<string>` means the tool can take time, for example an HTTP request or a database call. Therefore the agent uses `await tool.executor(input)`.

## 3. `Agent` stores state

When `.build()` runs, the constructor prepares the agent:

```ts
private instructions: string;         // system prompt for the model
private toolMap: Map<string, ITool>;  // tool name → actual tool
private messageHistory: IMessage[];   // conversation memory
private openai: OpenAI;               // OpenAI client
```

### Why use a `Map` for tools?

The model returns only a name such as `"fetchWeatherInfo"`. The map quickly finds the real function:

```ts
const tool = this.toolMap.get(functionName);
```

```text
"fetchWeatherInfo" → weatherTool → weatherTool.executor("Goa")
```

## 4. Instructions give the model a protocol

`config.ts` exports `HARNESS_PROMPT`. The constructor combines it with your agent-specific instruction and descriptions of available tools.

The prompt asks the model to reply with JSON, such as:

```json
{ "step": "OUTPUT", "text": "The work is complete." }
```

or:

```json
{ "step": "TOOL_REQUEST", "functionName": "execCli", "input": "..." }
```

This matters because the code uses `JSON.parse()`. If the model replies with ordinary prose instead of valid JSON, parsing fails.

## 5. Message history is short-term memory

Every message has a role and content:

```ts
type IMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "developer"; content: string };
```

The history grows like this:

```text
1. user:      "What is the weather in Goa?"
2. assistant: { "step": "TOOL_REQUEST", ... }
3. developer: { "functionName": "fetchWeatherInfo", "toolResult": "..." }
4. assistant: { "step": "OUTPUT", "text": "..." }
```

On every loop, the full history is sent to the model. This lets it see a previous tool result and continue its answer.

## 6. The agent loop: the most important part

`run()` is the heart of the project.

### Pseudocode

```text
function run(userQuestion):
    add userQuestion to memory

    repeat at most 30 times:
        ask model using system prompt + memory
        save model reply to memory
        show reply to interceptors/loggers

        parse model reply as JSON

        if reply.step is OUTPUT:
            return memory

        if reply.step is TOOL_REQUEST:
            find tool by reply.functionName

            if tool does not exist:
                add an error to memory
                continue

            result = await tool.executor(reply.input)
            add result to memory as a developer message
            show result to interceptors/loggers
            continue
```

### Why is there a loop?

The model may need more than one turn:

1. It asks for weather data.
2. Your code runs the weather tool.
3. The model reads the weather result.
4. It creates a human-friendly final answer.

`MAX_LOOP = 30` is a safety limit. It avoids an infinite loop if the model keeps requesting tools and never sends `OUTPUT`.

## 7. Interceptors: observe without changing the agent

```ts
agent.attachInterceptor((message) => {
  console.log(message.role, message.content);
});
```

An interceptor is a callback. It runs when the agent receives an assistant message or a tool result. It is useful for logging, displaying a chat UI, debugging, or saving messages to a database.

## 8. How to write this yourself next time

Build it in this order:

1. Define message types: `user`, `assistant`, and `developer`.
2. Define a tool interface with `name`, `description`, and `executor`.
3. Make a builder that stores instructions and tools.
4. Make `build()` return an `Agent`.
5. In the agent constructor, turn the tool array into a `Map` and create a system prompt.
6. In `run()`, save the user question, call the model, parse JSON, run requested tools, save results, and repeat until `OUTPUT`.
7. Add error handling before using the agent in a real app.

## 9. Practical requirements and safety

### OpenAI API key

`agent.ts` currently has an empty API key:

```ts
this.openai = new OpenAI({ apiKey: "" });
```

The program cannot call OpenAI until it reads a valid key, usually from `process.env.OPENAI_API_KEY`. Never hard-code a secret key or commit it to Git.

### `execCli` is dangerous

The `execCli` tool can run arbitrary shell commands. A real application should allow only safe, specific operations. Do not expose it publicly as written.

### Better JSON handling

The current code calls `JSON.parse(rawLLMResponse)`. In a production version, use structured output/JSON mode and wrap parsing in `try/catch`, so one bad model response does not crash the agent.

## One-sentence mental model

> The model chooses **what** it needs; your TypeScript code controls **whether and how** that action actually happens.
