
# Chapter 4 — Custom Tool Implementation & End-to-End Execution

## 1. Chapter Goal

In Chapter 3, we implemented the core `Agent` runtime.

The Agent can now:

* Send messages to the LLM.
* Parse pipeline steps.
* Find registered tools.
* Execute tools.
* Inject tool results back into the conversation.
* Continue the agent loop.
* Stop when it receives an `OUTPUT` step.

However, we have not yet created real tools.

This chapter connects everything together by implementing custom `ITool` objects and running an end-to-end agent.

We will build:

1. A **weather tool** using `axios`.
2. A **CLI tool** using Node.js `child_process`.
3. An agent with the CLI tool.
4. An interceptor for observing execution.
5. A complete `agent.run()` workflow.

The architecture becomes:

```text
User
 │
 ▼
Agent
 │
 ▼
LLM
 │
 ▼
TOOL_REQUEST
 │
 ▼
Tool Lookup
 │
 ├───────────────┐
 ▼               ▼
Weather Tool    CLI Tool
 │               │
 ▼               ▼
API             Host OS
 │               │
 └───────┬───────┘
         ▼
     Tool Result
         │
         ▼
       Agent
         │
         ▼
        LLM
         │
         ▼
       OUTPUT
```

---

# 2. What Is a Custom Tool?

A tool is simply an implementation of the `ITool` interface from Chapter 2.

The contract is:

```ts
interface ITool {
  name: string;
  description: string;
  doc?: string;
  executor: (input: string) => Promise<string>;
}
```

Therefore, creating a tool means providing these properties.

For example:

```ts
const calculatorTool: ITool = {
  name: "calculator",

  description: "Performs a mathematical calculation.",

  executor: async (input) => {
    return "42";
  }
};
```

The important separation is:

```text
LLM
 │
 │ decides which tool is needed
 ▼
Agent Runtime
 │
 │ executes actual JavaScript function
 ▼
Tool
```

The LLM does not execute the function itself.

---

# 3. Tool 1 — Realtime Weather Tool

Our first tool will fetch weather information from `wttr.in`.

The flow is:

```text
Agent
  │
  │ fetchWeatherInfo("Goa")
  ↓
weatherTool
  │
  ↓
wttr.in
  │
  ↓
Weather Response
  │
  ↓
string
```

We use `axios` to make the HTTP request.

---

# 4. Implementing `weatherTool`

```ts
const weatherTool: ITool = {
  name: "fetchWeatherInfo",

  description:
    "Fetches current weather information for a city.",

  doc:
    "fetchWeatherInfo(cityName: string): WeatherReport",

  async executor(cityName) {
    const encodedCity = encodeURIComponent(
      cityName.trim().toLowerCase()
    );

    const url =
      `https://wttr.in/${encodedCity}?format=%C+%t`;

    const response = await axios.get<string>(url, {
      responseType: "text"
    });

    return JSON.stringify({
      cityName,
      weatherInfo: response.data
    });
  }
};
```

---

# 5. Understanding the Weather Tool

Let's break it down.

## `name`

```ts
name: "fetchWeatherInfo"
```

This is the identifier the LLM uses when requesting the tool.

The model may produce:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

The Agent then performs:

```ts
this.toolMap.get("fetchWeatherInfo");
```

---

## `description`

```ts
description:
  "Fetches current weather information for a city."
```

This tells the model what the tool does.

The description becomes part of the system prompt.

---

## `doc`

```ts
doc:
  "fetchWeatherInfo(cityName: string): WeatherReport"
```

This provides additional information about the expected input and output.

It is useful when constructing tool documentation for the LLM.

---

# 6. Why Use `encodeURIComponent()`?

User input should not be inserted directly into a URL.

For example:

```text
New York
```

contains a space.

We therefore transform it using:

```ts
const encodedCity = encodeURIComponent(
  cityName.trim().toLowerCase()
);
```

This makes the input safer to place inside a URL.

For example:

```text
New York
```

becomes an encoded URL component.

This is a small but important habit when constructing URLs from external input.

---

# 7. Why Return a String?

Our `ITool` contract requires:

```ts
executor: (input: string) => Promise<string>;
```

Therefore, the weather tool converts its result into a string:

```ts
return JSON.stringify({
  cityName,
  weatherInfo: response.data
});
```

For example:

```json
{
  "cityName": "Goa",
  "weatherInfo": "Sunny +32°C"
}
```

The Agent can then inject this string into the conversation.

---

# 8. Tool 2 — CLI Access Tool

The second tool demonstrates something much more powerful.

We will use Node.js:

```ts
child_process
```

to execute a command on the local machine.

The flow becomes:

```text
LLM
 │
 │ TOOL_REQUEST
 ↓
Agent
 │
 ↓
cliAccessTool
 │
 ↓
Operating System
 │
 ↓
Command Output
 │
 ↓
Agent
```

This demonstrates that an agent can interact with the environment through tools.

---

# 9. Importing `exec`

Node.js provides:

```ts
import { exec } from "node:child_process";
```

`exec()` executes a shell command.

However, `exec()` uses a callback-based API, while our `ITool` interface expects a Promise.

We therefore wrap it in a Promise.

---

# 10. Implementing `cliAccessTool`

```ts
const cliAccessTool: ITool = {
  name: "execCli",

  description:
    "Executes an allowed CLI command and returns its output.",

  doc:
    "execCli(cli: string): CLIResponse",

  executor(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              stderr || error.message
            )
          );

          return;
        }

        resolve(stdout);
      });
    });
  }
};
```

---

# 11. Why Convert the Callback to a Promise?

`exec()` normally looks like:

```ts
exec(command, (error, stdout, stderr) => {
  // result
});
```

But our tool contract expects:

```ts
Promise<string>
```

Wrapping it in:

```ts
new Promise(...)
```

allows us to use:

```ts
await tool.executor(input);
```

inside the Agent.

The transformation is:

```text
Callback API
     │
     ↓
new Promise()
     │
     ↓
Promise<string>
     │
     ↓
await
```

---

# 12. Understanding `stdout` and `stderr`

When a command executes, the operating system can produce:

```text
stdout
   ↓
Normal command output

stderr
   ↓
Error / diagnostic output
```

For example:

```bash
echo "Hello"
```

produces:

```text
stdout → Hello
```

If a command fails, `stderr` may contain useful information explaining why.

Our implementation therefore rejects when an execution error occurs.

---

# 13. ⚠️ Important Security Warning

The following code:

```ts
exec(command)
```

is **extremely powerful**.

It can potentially allow commands such as:

```bash
rm -rf ...
```

or other destructive operations.

This means an unrestricted CLI tool should **not** be treated as production-safe.

The model is not a security boundary.

A prompt such as:

```text
"You are a safe coding agent."
```

does not guarantee that the model will never request a dangerous command.

The architecture should eventually introduce restrictions such as:

```text
LLM
 ↓
Tool Request
 ↓
Permission / Policy Layer
 ↓
Command Validation
 ↓
Sandbox
 ↓
Execution
```

For example, a production system could:

* Allow only specific commands.
* Restrict accessible directories.
* Reject destructive shell operations.
* Run commands inside a sandbox/container.
* Apply timeouts.
* Apply resource limits.
* Require explicit user approval for sensitive operations.

For this chapter, the unrestricted CLI tool is useful as a **local learning/demo tool**.

---

# 14. Creating the Agent

Now we can assemble an Agent using the builder from Chapter 2.

```ts
const agent = Agent.builder()
  .setInstructions(
    "You are an expert coding agent."
  )
  .tool(cliAccessTool)
  .build();
```

Notice the fluent API:

```text
Agent.builder()
      │
      ↓
setInstructions()
      │
      ↓
tool()
      │
      ↓
build()
      │
      ↓
Agent
```

---

# 15. Creating a Weather Agent

We can create another independent Agent:

```ts
const weatherAgent = Agent.builder()
  .setInstructions(
    "You are an expert weather assistant."
  )
  .tool(weatherTool)
  .build();
```

This Agent has:

```text
Instructions
    ↓
Weather behavior

Tools
    ↓
fetchWeatherInfo
```

It does not have access to `execCli`.

This demonstrates an important property of the architecture:

> **Each Agent receives only the tools explicitly registered with it.**

---

# 16. Why Create Multiple Agents?

We could create:

```ts
const codingAgent = Agent.builder()
  .setInstructions(
    "You are an expert coding agent."
  )
  .tool(cliAccessTool)
  .build();
```

and:

```ts
const weatherAgent = Agent.builder()
  .setInstructions(
    "You are an expert weather agent."
  )
  .tool(weatherTool)
  .build();
```

The agents now have different capabilities.

```text
Coding Agent
├── Coding instructions
└── execCli

Weather Agent
├── Weather instructions
└── fetchWeatherInfo
```

This is a simple example of **capability-based agent design**.

---

# 17. Attaching an Interceptor

We can observe the Agent's trajectory using an interceptor:

```ts
agent.attachInterceptor((message) => {
  console.log(
    `Message: ${message.role}: ${message.content}`
  );
});
```

The interceptor receives messages such as:

```text
assistant → INITIAL
assistant → THINK
assistant → TOOL_REQUEST
developer → Tool Result
assistant → ANALYSE
assistant → OUTPUT
```

This is extremely useful while developing the SDK.

---

# 18. Why Interceptors Matter

Without an interceptor, we may only see:

```text
Final answer
```

With an interceptor, we can see:

```text
User request
     ↓
INITIAL
     ↓
THINK
     ↓
TOOL_REQUEST
     ↓
Tool execution
     ↓
Tool result
     ↓
ANALYSE
     ↓
OUTPUT
```

This helps us understand what the runtime is doing.

Later, interceptors can be used for:

* Logging
* Debugging
* Metrics
* Tracing
* Monitoring
* Development tools

---

# 19. Running the Agent

Now we can execute:

```ts
const result = await agent.run(
  "Can you build a simple Hello World program in C++ as hello.cpp?"
);
```

The request enters:

```text
agent.run()
```

and the autonomous loop begins.

---

# 20. Expected Agent Flow

The model may produce something similar to:

```text
INITIAL
   ↓
THINK
   ↓
TOOL_REQUEST
   ↓
execCli
   ↓
Developer Result
   ↓
ANALYSE
   ↓
OUTPUT
```

For example:

```json
{
  "step": "INITIAL",
  "text": "The user wants a C++ Hello World file named hello.cpp."
}
```

Then:

```json
{
  "step": "THINK",
  "text": "I need to create the requested file using the available CLI tool."
}
```

Then:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "execCli",
  "input": "..."
}
```

The Agent executes:

```ts
cliAccessTool.executor(command);
```

The result is added to the trajectory.

The model then receives that result and can produce:

```json
{
  "step": "ANALYSE",
  "text": "The command completed successfully."
}
```

Finally:

```json
{
  "step": "OUTPUT",
  "text": "I created hello.cpp successfully."
}
```

---

# 21. Important Detail About the CLI Command

The exact command generated by the model may vary.

For example, it could use:

```bash
printf '#include <iostream>\n...' > hello.cpp
```

or another valid approach.

Therefore, the framework should **not depend on one exact command**.

The important sequence is:

```text
TOOL_REQUEST
      ↓
execCli
      ↓
Operating System
      ↓
Result
```

---

# 22. Complete `src/index.ts`

A cleaner Chapter 4 implementation is:

```ts
import { Agent } from "./app/agent.js";
import type { ITool } from "./app/agent.js";

import axios from "axios";
import { exec } from "node:child_process";

const weatherTool: ITool = {
  name: "fetchWeatherInfo",

  description:
    "Fetches current weather information for a city.",

  doc:
    "fetchWeatherInfo(cityName: string): WeatherReport",

  async executor(cityName) {
    const encodedCity = encodeURIComponent(
      cityName.trim().toLowerCase()
    );

    const url =
      `https://wttr.in/${encodedCity}?format=%C+%t`;

    const response = await axios.get<string>(url, {
      responseType: "text"
    });

    return JSON.stringify({
      cityName,
      weatherInfo: response.data
    });
  }
};

const cliAccessTool: ITool = {
  name: "execCli",

  description:
    "Executes an allowed CLI command and returns its output.",

  doc:
    "execCli(cli: string): CLIResponse",

  executor(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              stderr || error.message
            )
          );

          return;
        }

        resolve(stdout);
      });
    });
  }
};

async function init() {
  const agent = Agent.builder()
    .setInstructions(
      "You are an expert coding agent."
    )
    .tool(cliAccessTool)
    .build();

  agent.attachInterceptor((message) => {
    console.log(
      `Message: ${message.role}: ${message.content}`
    );
  });

  const result = await agent.run(
    "Can you build a simple Hello World program " +
    "in C++ as hello.cpp?"
  );

  console.log("Final trajectory:");
  console.log(result);
}

init().catch((error) => {
  console.error("Agent execution failed:", error);
  process.exitCode = 1;
});
```

---

# 23. Why We Removed the Unused Agents

The original example created:

```ts
const weatherAgent = ...
const xyzAgent = ...
```

but never used them.

That makes the example harder to understand.

For a learning chapter, it is better to demonstrate one complete path first:

```text
index.ts
   ↓
coding Agent
   ↓
execCli
   ↓
LLM
```

Once that works, creating additional specialized Agents is straightforward.

---

# 24. End-to-End Architecture

We now have all the major pieces:

```text
                     USER
                       │
                       ↓
                ┌─────────────┐
                │    Agent    │
                └──────┬──────┘
                       │
                       ↓
                 System Prompt
                       │
                       ↓
                      LLM
                       │
                       ↓
                Structured Step
                       │
              ┌────────┴────────┐
              ↓                 ↓
        TOOL_REQUEST          OUTPUT
              │                 │
              ↓                 ↓
         Tool Lookup          Finish
              │
              ↓
         Tool Executor
              │
        ┌─────┴──────┐
        ↓            ↓
      API          OS/CLI
        │            │
        └─────┬──────┘
              ↓
         Tool Result
              │
              ↓
       Message History
              │
              ↓
             LLM
```

This is the first complete end-to-end version of our Agent SDK.

---

# 25. Understanding the Full Trajectory

For the coding example, the trajectory could look like:

```text
USER
Can you build a simple Hello World program in C++ as hello.cpp?

        ↓

ASSISTANT
{
  "step": "INITIAL",
  "text": "The user wants a C++ Hello World file."
}

        ↓

ASSISTANT
{
  "step": "THINK",
  "text": "I should create the requested file."
}

        ↓

ASSISTANT
{
  "step": "TOOL_REQUEST",
  "functionName": "execCli",
  "input": "..."
}

        ↓

DEVELOPER
{
  "functionName": "execCli",
  "input": "...",
  "toolResult": "..."
}

        ↓

ASSISTANT
{
  "step": "ANALYSE",
  "text": "The command completed successfully."
}

        ↓

ASSISTANT
{
  "step": "OUTPUT",
  "text": "hello.cpp was created."
}
```

The important thing is that the **message history acts as the shared state between iterations**.

---

# 26. Testing the Weather Tool

Before testing the complete agent, it can be useful to test the tool itself.

For example:

```ts
const result = await weatherTool.executor("Goa");

console.log(result);
```

Expected output will depend on the current weather:

```json
{
  "cityName": "Goa",
  "weatherInfo": "..."
}
```

Because weather is live information, the exact response will change over time.

---

# 27. Testing the CLI Tool

You can test the CLI tool with a harmless command.

For example:

```ts
const result = await cliAccessTool.executor(
  "echo Hello from Agent"
);

console.log(result);
```

Expected:

```text
Hello from Agent
```

This confirms that:

```text
TypeScript
   ↓
ITool
   ↓
exec()
   ↓
Operating System
   ↓
stdout
```

is working.

---

# 28. Environment Configuration

The Agent requires an OpenAI API key.

Set it as an environment variable.

Linux/macOS:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

Then run:

```bash
npx tsx src/index.ts
```

For Windows PowerShell:

```powershell
$env:OPENAI_API_KEY="your-api-key-here"
npx tsx src/index.ts
```

Do not commit API keys into Git.

---

# 29. TypeScript Verification

Before executing the Agent:

```bash
npx tsc --noEmit
```

This checks the complete project for TypeScript errors.

Then:

```bash
npx tsx src/index.ts
```

Run the application.

---

# 30. Verify the Created File

If the Agent successfully creates `hello.cpp`, inspect it:

```bash
cat hello.cpp
```

A typical file should contain something equivalent to:

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
```

You can optionally compile it:

```bash
g++ hello.cpp -o hello
```

and run:

```bash
./hello
```

Expected:

```text
Hello, World!
```

This verifies not only that the Agent created the file, but that the generated program is actually usable.

---

# 31. Sample Interceptor Output

A successful run might produce output similar to:

```text
Message: user: Can you build a simple Hello World program in C++ as hello.cpp?

Message: assistant: {
  "step": "INITIAL",
  "text": "The user wants a C++ Hello World file."
}

Message: assistant: {
  "step": "THINK",
  "text": "I should create the file using the available CLI tool."
}

Message: assistant: {
  "step": "TOOL_REQUEST",
  "functionName": "execCli",
  "input": "..."
}

Message: developer: {
  "functionName": "execCli",
  "input": "...",
  "toolResult": "..."
}

Message: assistant: {
  "step": "ANALYSE",
  "text": "The command completed successfully."
}

Message: assistant: {
  "step": "OUTPUT",
  "text": "The hello.cpp file was created successfully."
}
```

The exact model-generated wording may differ.

---

# 32. Common Problems

## Problem 1 — `OPENAI_API_KEY` is missing

If the environment variable is not configured, the OpenAI client cannot authenticate.

Check:

```bash
echo $OPENAI_API_KEY
```

on Linux/macOS.

---

## Problem 2 — `wttr.in` request fails

The weather tool depends on an external HTTP service.

Possible causes include:

```text
No internet connection
        ↓
Service unavailable
        ↓
Request fails
```

The tool should eventually have proper timeout and error handling.

---

## Problem 3 — LLM returns invalid JSON

The current Chapter 3 implementation relies on:

```ts
JSON.parse(rawLLMResponse)
```

If the model returns invalid JSON, parsing fails.

This is one reason production implementations should eventually use stronger structured-output mechanisms.

---

## Problem 4 — Requested tool does not exist

If the model requests:

```text
functionName = "searchFlights"
```

but only `execCli` is registered:

```text
toolMap
└── execCli
```

the Agent cannot execute the request.

The runtime should return a developer error message and allow the model to continue or terminate.

---

## Problem 5 — CLI command fails

A shell command can fail because of:

* Invalid syntax.
* Missing program.
* Permission problems.
* Incorrect path.
* Operating-system differences.

The executor should therefore propagate meaningful errors.

---

# 33. Important Security Considerations

The CLI tool changes the security profile of the application.

Without CLI access:

```text
Agent
 ↓
LLM
 ↓
Text Response
```

With unrestricted CLI access:

```text
Agent
 ↓
LLM
 ↓
CLI Tool
 ↓
Operating System
 ↓
Files / Processes / Network / System
```

This is a major capability increase.

Therefore:

> **Never assume an LLM prompt is sufficient authorization for arbitrary system operations.**

A more mature architecture should eventually look like:

```text
LLM
 │
 ↓
TOOL_REQUEST
 │
 ↓
Policy Engine
 │
 ├── Allowed? ─────── No ──→ Reject
 │
 ↓ Yes
Permission Check
 │
 ↓
Sandbox
 │
 ↓
Tool Execution
```

This should be considered before exposing such an agent to untrusted users.

---

# 34. What We Have Built So Far

Across Chapters 0–4, we have constructed:

```text
Chapter 0
Project Foundation
       ↓
Chapter 1
Harness + Agent Pipeline
       ↓
Chapter 2
Interfaces + Builder
       ↓
Chapter 3
Agent Runtime
       ↓
Chapter 4
Real Tools + End-to-End Execution
```

The complete system is now:

```text
                 ┌──────────────┐
                 │     User     │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    Agent     │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │     LLM      │
                 └──────┬───────┘
                        ↓
                Structured Step
                        │
             ┌──────────┴──────────┐
             ↓                     ↓
       TOOL_REQUEST              OUTPUT
             │                     │
             ↓                     ↓
        Tool Lookup             Finish
             │
       ┌─────┴──────┐
       ↓            ↓
    Weather        CLI
       │            │
       ↓            ↓
      API           OS
       │            │
       └─────┬──────┘
             ↓
        Tool Result
             │
             ↓
       Message History
             │
             ↓
            LLM
```

---

# 35. Key Concepts Learned

| Concept                | What We Learned                                              |
| ---------------------- | ------------------------------------------------------------ |
| `ITool`                | Standard contract for Agent capabilities                     |
| `executor()`           | Performs the actual tool operation                           |
| `axios`                | Makes HTTP requests from a tool                              |
| `child_process.exec()` | Executes shell commands                                      |
| Promise wrapper        | Converts callback APIs into async/await-compatible functions |
| Tool metadata          | Describes capabilities to the LLM                            |
| Tool Map               | Finds tools by name                                          |
| Interceptor            | Observes execution events                                    |
| End-to-end execution   | Connects user → LLM → tool → result → LLM                    |
| Capability isolation   | Each Agent only receives registered tools                    |
| Security boundary      | Tool execution must not rely solely on model instructions    |

---

# 36. Final Mental Model

The most important idea from this chapter is:

```text
             LLM
              │
              │ decides
              ↓
        TOOL_REQUEST
              │
              ↓
       ┌──────────────┐
       │ Agent Runtime│
       └──────┬───────┘
              │
              │ executes
              ↓
            Tool
              │
              ↓
         Real World
              │
              ↓
          Tool Result
              │
              ↓
       Agent Runtime
              │
              ↓
             LLM
              │
              ↓
           OUTPUT
```

The LLM is the **decision-making component**.

The Agent is the **orchestration/runtime component**.

The tools are the **capability layer**.

Together they form the basic architecture of a tool-using AI agent.

---

# 37. Conclusion

Congratulations! 🎉

You have now moved from a theoretical Agent pipeline to a working end-to-end prototype.

The framework can now:

* Accept user queries.
* Maintain message history.
* Send context to an LLM.
* Interpret structured agent steps.
* Discover registered tools.
* Execute custom tools.
* Inject tool results back into the trajectory.
* Continue the autonomous loop.
* Notify interceptors.
* Produce a final output.

The architecture can be summarized as:

```text
USER
  ↓
AGENT
  ↓
LLM
  ↓
DECISION
  ↓
TOOL
  ↓
OBSERVATION
  ↓
LLM
  ↓
FINAL OUTPUT
```

One important distinction remains:

> **This is a functional learning prototype, not yet a production-grade autonomous agent.**

The next improvements should focus on reliability, structured outputs, error recovery, tool safety, execution limits, and better tool interfaces.

These concerns naturally lead into the next stage of the SDK.

---

# 38. What Comes Next?

In the next chapter, we can improve the framework with **robust tool execution and error handling**.

For example:

```text
Tool Execution
      │
      ├── Success
      │
      ├── Timeout
      │
      ├── Exception
      │
      ├── Invalid Input
      │
      └── Permission Denied
```

We can then build mechanisms for:

* Tool execution errors.
* Retry handling.
* Timeouts.
* Validation.
* Tool-specific input schemas.
* Safer tool execution.
* Better Agent state management.

That will take the SDK from a basic working prototype toward a more reliable **Agent Runtime Framework**.
