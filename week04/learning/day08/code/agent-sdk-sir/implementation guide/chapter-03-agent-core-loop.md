

# Chapter 3 — Core Autonomous Agent Engine & ReAct Loop

## 1. Chapter Goal

In Chapter 2, we created the **data contracts** and the **`AgentBuilder`**.

We now have:

```text
IMessage
ITool
Interceptor
AgentBuilder
```

However, the builder only **configures** an agent. It does not actually execute anything.

This chapter implements the actual **`Agent` engine**.

The `Agent` is responsible for:

* Maintaining conversation history.
* Building the system prompt.
* Registering tools for fast lookup.
* Calling the LLM.
* Parsing structured pipeline steps.
* Executing requested tools.
* Injecting tool results back into the conversation.
* Notifying interceptors.
* Repeating the agent loop until the task is complete.

The high-level architecture becomes:

```text
User
 │
 │ query
 ▼
Agent.run()
 │
 ▼
LLM
 │
 ▼
Structured Step
 │
 ├── THINK ────────────────┐
 │                         │
 ├── TOOL_REQUEST          │
 │       │                 │
 │       ▼                 │
 │    Tool Executor        │
 │       │                 │
 │       ▼                 │
 │    Tool Result ─────────┘
 │
 └── OUTPUT
        │
        ▼
      Done
```

The key idea is:

> **The LLM decides what should happen next; the Agent runtime performs that action.**

---

# 2. What Is the Agent Runtime?

An LLM by itself is essentially a model that receives context and produces a response.

An agent runtime adds the surrounding machinery required to perform multi-step work.

```text
             ┌────────────────────┐
             │        Agent       │
             └─────────┬──────────┘
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
      Memory         Tools           LLM
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                 Agent Loop
```

The runtime repeatedly performs:

```text
1. Send context to LLM
2. Receive next step
3. Interpret the step
4. Execute required action
5. Add result to context
6. Repeat
```

This repeated process is the core of our autonomous agent.

---

# 3. ReAct-Style Execution

The implementation follows a simplified **ReAct-style loop**.

ReAct generally means combining:

```text
Reasoning / Decision
        +
Action
        +
Observation
```

In our framework, the equivalent pipeline is:

```text
THINK
  ↓
TOOL_REQUEST
  ↓
Tool Execution
  ↓
ANALYSE
  ↓
OUTPUT
```

For example, if the user asks:

```text
What is the weather in Goa?
```

the model might produce:

```json
{
  "step": "INITIAL",
  "text": "The user wants the current weather in Goa."
}
```

Then:

```json
{
  "step": "THINK",
  "text": "I need current weather data, so I should use the weather tool."
}
```

Then:

```json
{
  "step": "TOOL_REQUEST",
  "text": "Requesting weather information for Goa.",
  "functionName": "getWeatherData",
  "input": "Goa"
}
```

The **Agent**, not the model, executes the function:

```text
getWeatherData("Goa")
```

Suppose it returns:

```text
32°C, Sunny
```

The runtime adds that result to the conversation.

The model receives the updated context and can then produce:

```json
{
  "step": "OUTPUT",
  "text": "The current weather in Goa is 32°C and sunny."
}
```

---

# 4. Agent Responsibilities

Our `Agent` class has several responsibilities.

| Responsibility                | Implementation   |
| ----------------------------- | ---------------- |
| Store system instructions     | `instructions`   |
| Store conversation trajectory | `messageHistory` |
| Find tools by name            | `toolMap`        |
| Communicate with OpenAI       | `openai`         |
| Observe agent events          | `interceptors`   |
| Prevent infinite loops        | `MAX_LOOP`       |
| Execute agent workflow        | `run()`          |

Conceptually:

```text
Agent
│
├── instructions
│
├── messageHistory[]
│
├── toolMap
│
├── openai
│
├── interceptors[]
│
├── MAX_LOOP
│
└── run()
```

---

# 5. Dynamic System Prompt

The Agent needs to tell the LLM how the framework works.

We combine three pieces of information:

```text
┌─────────────────────────────────────────┐
│          SYSTEM PROMPT                  │
├─────────────────────────────────────────┤
│ 1. HARNESS_PROMPT                       │
│    Pipeline rules                       │
│                                         │
│ 2. Developer Instructions               │
│    Agent-specific behavior              │
│                                         │
│ 3. Available Tools                      │
│    Tool names + descriptions + docs     │
└─────────────────────────────────────────┘
```

For example:

```text
HARNESS_PROMPT

System Prompt:
You are an expert coding assistant.

Available Tools:
{"functionName":"getWeatherData", ...}
{"functionName":"runCommand", ...}
```

This gives the model both:

* **behavioral instructions**
* **available capabilities**

---

# 6. Why Serialize Tools?

The Agent stores actual executable functions:

```ts
executor: async (input) => {
  // execute something
}
```

We should **not** put the JavaScript function itself inside the prompt.

Instead, we expose descriptive metadata:

```ts
{
  functionName: t.name,
  functionDescription: t.description,
  functionDoc: t.doc
}
```

So the architecture is:

```text
                    Agent Runtime
                         │
             ┌───────────┴───────────┐
             │                       │
        Tool Metadata          Tool Executor
             │                       │
             ↓                       ↓
            LLM                   Runtime
```

The LLM sees the metadata.

The application owns the executable function.

This is an important security and architecture boundary.

---

# 7. Tool Lookup with `Map`

Chapter 2 stores tools in:

```ts
toolList: ITool[];
```

Inside the Agent, we convert that list into:

```ts
Map<string, ITool>
```

Example:

```text
toolList
[
  weatherTool,
  calculatorTool,
  cliTool
]
```

becomes:

```text
toolMap

"getWeatherData" → weatherTool
"calculate"      → calculatorTool
"runCommand"     → cliTool
```

Then when the LLM requests:

```json
{
  "functionName": "getWeatherData"
}
```

we can quickly perform:

```ts
this.toolMap.get("getWeatherData");
```

This is cleaner than repeatedly searching an array.

---

# 8. Agent Class Structure

The class will contain:

```ts
export class Agent {
  private instructions: string;
  private messageHistory: IMessage[];
  private toolMap: Map<string, ITool>;
  private openai: OpenAI;
  private interceptors: Interceptor[];
  private MAX_LOOP = 30;
}
```

Let's understand each property.

### `instructions`

Stores the complete system prompt.

### `messageHistory`

Stores the conversation trajectory.

### `toolMap`

Stores executable tools indexed by name.

### `openai`

Stores the OpenAI SDK client.

### `interceptors`

Stores callbacks that observe agent messages.

### `MAX_LOOP`

Prevents the agent from running forever.

---

# 9. OpenAI Client Initialization

The OpenAI client should use the API key from the environment.

For example:

```ts
import OpenAI from "openai";

this.openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

Make sure the environment variable is loaded by the application before creating the Agent.

For example, the application can load `.env` using the appropriate environment configuration used by the project.

Do **not** hard-code an API key:

```ts
apiKey: "sk-..."
```

API credentials should never be committed to source control.

---

# 10. Agent Constructor

The constructor receives the configured builder:

```ts
constructor(builder: AgentBuilder) {
```

This allows the builder to transfer its configuration into the runtime.

The relationship is:

```text
AgentBuilder
     │
     │ build()
     ↓
   Agent
     │
     ├── instructions
     ├── tools
     └── runtime state
```

---

# 11. Building the Tool Map

Inside the constructor:

```ts
this.toolMap = new Map();

for (const t of builder.toolList) {
  this.toolMap.set(t.name, t);
}
```

Suppose we have:

```ts
builder.toolList = [
  weatherTool,
  calculatorTool
];
```

The loop produces:

```text
toolMap
│
├── "getWeatherData" → weatherTool
│
└── "calculate" → calculatorTool
```

Now tool lookup is straightforward:

```ts
const tool = this.toolMap.get(functionName);
```

---

# 12. Building the System Prompt

We can construct the system prompt using a template literal:

```ts
this.instructions = `
${HARNESS_PROMPT}

System Prompt:
${builder.instructions ?? ""}

Available Tools:
${builder.toolList
  .map((t) =>
    JSON.stringify({
      functionName: t.name,
      functionDescription: t.description,
      functionDoc: t.doc
    })
  )
  .join("\n")}
`;
```

Notice the use of:

```ts
builder.instructions ?? ""
```

This protects us if no custom instructions were supplied.

The resulting prompt might look like:

```text
[Harness rules...]

System Prompt:
You are an expert coding assistant.

Available Tools:
{"functionName":"getWeatherData","functionDescription":"Gets weather information.","functionDoc":"..."}
{"functionName":"calculate","functionDescription":"Performs calculations.","functionDoc":"..."}
```

---

# 13. Message History

The Agent maintains:

```ts
private messageHistory: IMessage[];
```

This is the agent's **trajectory**.

For example:

```text
messageHistory

1. USER
   "What is the weather in Goa?"

2. ASSISTANT
   {"step":"INITIAL", ...}

3. ASSISTANT
   {"step":"THINK", ...}

4. ASSISTANT
   {"step":"TOOL_REQUEST", ...}

5. DEVELOPER
   {"functionName":"getWeatherData", ...}

6. ASSISTANT
   {"step":"OUTPUT", ...}
```

The entire history gives the model the context required to continue the task.

---

# 14. `attachInterceptor()`

The Agent exposes:

```ts
public attachInterceptor(interceptor: Interceptor) {
  this.interceptors.push(interceptor);
}
```

A developer can attach a logger:

```ts
agent.attachInterceptor((message) => {
  console.log(message);
});
```

Now whenever the Agent notifies interceptors, this callback runs.

---

# 15. `notifyInterceptors()`

The internal helper:

```ts
private notifyInterceptors(message: IMessage) {
  for (const interceptor of this.interceptors) {
    interceptor(message);
  }
}
```

Simply loops through all registered callbacks.

For example:

```text
interceptors
│
├── logger
├── metrics
└── debugger
```

A single message can therefore be observed by multiple consumers.

```text
                 Message
                    │
          ┌─────────┼─────────┐
          ↓         ↓         ↓
       Logger    Metrics   Debugger
```

---

# 16. Static `builder()`

To make the API convenient, the Agent exposes:

```ts
static builder() {
  return new AgentBuilder();
}
```

This allows:

```ts
const agent = Agent.builder()
  .setInstructions("You are an expert coding assistant")
  .tool(weatherTool)
  .build();
```

instead of:

```ts
const builder = new AgentBuilder();

builder
  .setInstructions("You are an expert coding assistant")
  .tool(weatherTool);

const agent = builder.build();
```

Both approaches are valid.

The static method simply provides a cleaner SDK API.

---

# 17. `printSystemPrompt()`

For debugging, we can expose:

```ts
public printSystemPrompt() {
  console.log(this.instructions);
}
```

This is useful when developing the SDK because prompt assembly can otherwise be difficult to inspect.

For example:

```ts
agent.printSystemPrompt();
```

allows us to verify:

```text
Harness
+
Developer Instructions
+
Tools
```

are all present.

---

# 18. The `run()` Method

The most important method is:

```ts
public async run(query: string) {
```

This is where the autonomous loop lives.

The overall algorithm is:

```text
run(query)
   │
   ↓
Add user message
   │
   ↓
┌───────────────────────┐
│       Agent Loop      │
│                       │
│ Call LLM              │
│      ↓                │
│ Parse response        │
│      ↓                │
│ Tool request?         │
│   ├── Yes → execute   │
│   │          │        │
│   │          └→ loop  │
│   │                   │
│   └── Output → return │
└───────────────────────┘
```

---

# 19. Step 1 — Add the User Query

At the beginning:

```ts
this.messageHistory.push({
  role: "user",
  content: query
});
```

If the user asks:

```text
What is the weather in Goa?
```

the trajectory becomes:

```ts
[
  {
    role: "user",
    content: "What is the weather in Goa?"
  }
]
```

This message becomes part of the context sent to the LLM.

---

# 20. Step 2 — Start the Autonomous Loop

We use:

```ts
for (let i = 0; i < this.MAX_LOOP; i++) {
```

With:

```ts
private MAX_LOOP = 30;
```

the agent can perform at most 30 iterations.

Why?

Because an agent could theoretically get stuck:

```text
THINK
 ↓
TOOL_REQUEST
 ↓
ANALYSE
 ↓
THINK
 ↓
TOOL_REQUEST
 ↓
...
```

Without a limit, this could continue indefinitely.

`MAX_LOOP` acts as a safety boundary.

---

# 21. Step 3 — Call the LLM

Inside the loop:

```ts
const llmResponse =
  await this.openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: this.instructions
      },

      ...this.messageHistory.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ]
  });
```

The LLM receives:

```text
System Prompt
     +
Message History
```

Every iteration.

This is important because after a tool executes, the next LLM call must know the result.

---

# 22. Context Evolution

Imagine the first request is:

```text
User:
What is the weather in Goa?
```

The first model call receives:

```text
SYSTEM
Harness + Instructions + Tools

USER
What is the weather in Goa?
```

The model requests the weather tool.

After execution, the history contains:

```text
USER
What is the weather in Goa?

ASSISTANT
TOOL_REQUEST...

DEVELOPER
Weather: 32°C, Sunny
```

The next model call receives all of that.

Therefore the model can continue from the previous state.

---

# 23. Step 4 — Extract the Model Response

The OpenAI response contains the model message.

We can safely extract the content:

```ts
const rawLLMResponse =
  llmResponse.choices[0]?.message.content;
```

Because the content may be missing, it is better to explicitly handle that case rather than blindly casting it to `string`.

For example:

```ts
if (!rawLLMResponse) {
  throw new Error("LLM returned an empty response.");
}
```

This prevents the runtime from passing `undefined` into `JSON.parse()`.

---

# 24. Step 5 — Store the Assistant Response

Once we have the response:

```ts
const assistantMessage: IMessage = {
  role: "assistant",
  content: rawLLMResponse
};

this.messageHistory.push(assistantMessage);
this.notifyInterceptors(assistantMessage);
```

The trajectory now contains the model's response.

This is useful for:

* debugging
* logging
* observability
* future context
* inspecting the complete trajectory

---

# 25. Step 6 — Parse the Structured Step

Chapter 1 instructed the model to return JSON.

Therefore:

```ts
const parsedResult = JSON.parse(rawLLMResponse);
```

Suppose the model returned:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "getWeatherData",
  "input": "Goa"
}
```

After parsing, we have a JavaScript object:

```ts
parsedResult.step
// "TOOL_REQUEST"

parsedResult.functionName
// "getWeatherData"

parsedResult.input
// "Goa"
```

---

# 26. Important: JSON Parsing Can Fail

The model may occasionally produce invalid JSON.

For example:

```text
Here is the JSON:
{ step: TOOL_REQUEST }
```

This is not valid JSON.

Therefore, production-quality code should protect:

```ts
JSON.parse(rawLLMResponse);
```

with error handling.

For example:

```ts
let parsedResult: {
  step?: string;
  functionName?: string;
  input?: string;
};

try {
  parsedResult = JSON.parse(rawLLMResponse);
} catch {
  throw new Error("LLM returned invalid JSON.");
}
```

Later, this can be improved with schema validation or structured model output.

---

# 27. Step 7 — Check for `OUTPUT`

The first termination condition is:

```ts
if (parsedResult.step?.toUpperCase() === "OUTPUT") {
  return this.messageHistory;
}
```

If the model produces:

```json
{
  "step": "OUTPUT",
  "text": "The weather in Goa is 32°C and sunny."
}
```

the Agent knows the task is complete.

The loop stops.

```text
OUTPUT
  │
  ↓
return messageHistory
```

---

# 28. Step 8 — Handle `TOOL_REQUEST`

If:

```ts
parsedResult.step === "TOOL_REQUEST"
```

the runtime needs to execute the requested tool.

First extract:

```ts
const { functionName, input } = parsedResult;
```

For example:

```text
functionName
     ↓
"getWeatherData"

input
     ↓
"Goa"
```

---

# 29. Step 9 — Find the Tool

The Agent uses:

```ts
const tool = this.toolMap.get(functionName);
```

Suppose:

```text
functionName = "getWeatherData"
```

The map performs:

```text
"getWeatherData"
       │
       ↓
weatherTool
```

If the tool exists, we can execute it.

---

# 30. Missing Tool Handling

The requested tool might not exist.

For example, the model could request:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "searchFlights"
}
```

but the Agent has no such tool registered.

We should handle this explicitly:

```ts
if (!tool) {
  const errorMessage: IMessage = {
    role: "developer",
    content: `Error: Function with name ${functionName} does not exist.`
  };

  this.messageHistory.push(errorMessage);
  this.notifyInterceptors(errorMessage);

  continue;
}
```

The important point is that the error is returned to the model as context.

The model can then decide what to do next.

---

# 31. Step 10 — Execute the Tool

If the tool exists:

```ts
const toolResult = await tool.executor(input);
```

For example:

```ts
await weatherTool.executor("Goa");
```

might return:

```text
Temperature: 32°C
Condition: Sunny
Humidity: 70%
```

The Agent runtime is responsible for executing this function.

The LLM does not directly execute JavaScript.

---

# 32. Step 11 — Inject the Tool Result

After execution, we add the result to the message history:

```ts
const developerMessage: IMessage = {
  role: "developer",
  content: JSON.stringify({
    functionName,
    input,
    toolResult
  })
};

this.messageHistory.push(developerMessage);
this.notifyInterceptors(developerMessage);
```

The trajectory becomes:

```text
USER
What is the weather in Goa?

        ↓

ASSISTANT
TOOL_REQUEST
getWeatherData("Goa")

        ↓

DEVELOPER
{
  "functionName": "getWeatherData",
  "input": "Goa",
  "toolResult": "32°C, Sunny"
}
```

Then the loop continues.

---

# 33. Why Inject Tool Results?

The model needs to know what happened after its action.

Without the result:

```text
LLM
 ↓
Request Tool
 ↓
Tool Executes
 ↓
???
```

The model has no observation.

With the result:

```text
LLM
 ↓
Request Tool
 ↓
Tool Executes
 ↓
Result added to context
 ↓
LLM sees result
 ↓
Decides next step
```

This creates the agent feedback loop.

---

# 34. Complete Execution Flow

The complete weather example looks like this:

```text
User
 │
 │ "What is the weather in Goa?"
 ↓
Agent.run()
 │
 ↓
messageHistory
 │
 ↓
LLM
 │
 ↓
INITIAL
 │
 ↓
THINK
 │
 ↓
TOOL_REQUEST
 │
 │ getWeatherData("Goa")
 ↓
Agent.toolMap
 │
 ↓
weatherTool.executor()
 │
 ↓
"32°C, Sunny"
 │
 ↓
developer message
 │
 ↓
LLM
 │
 ↓
ANALYSE
 │
 ↓
OUTPUT
 │
 ↓
Return trajectory
```

This is the heart of the Agent SDK.

---

# 35. Complete `src/app/agent.ts`

A cleaned-up version of the Chapter 2 + Chapter 3 implementation can look like this:

```ts
import OpenAI from "openai";
import { HARNESS_PROMPT } from "./config.js";

export interface IMessage {
  role: "user" | "assistant" | "developer";
  content: string;
}

export interface ITool {
  name: string;
  description: string;
  doc?: string;
  executor: (input: string) => Promise<string>;
}

export type Interceptor = (message: IMessage) => void;

export class AgentBuilder {
  public instructions: string | undefined;
  public toolList: ITool[];

  constructor() {
    this.toolList = [];
  }

  public setInstructions(instructions: string) {
    this.instructions = instructions;

    return this;
  }

  public tool(tool: ITool) {
    this.toolList.push(tool);

    return this;
  }

  public build() {
    return new Agent(this);
  }
}

export class Agent {
  private instructions: string;
  private messageHistory: IMessage[];
  private toolMap: Map<string, ITool>;
  private openai: OpenAI;
  private interceptors: Interceptor[];
  private MAX_LOOP = 30;

  constructor(builder: AgentBuilder) {
    this.toolMap = new Map();

    for (const tool of builder.toolList) {
      this.toolMap.set(tool.name, tool);
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.interceptors = [];

    this.instructions = `
${HARNESS_PROMPT}

System Prompt:
${builder.instructions ?? ""}

Available Tools:
${builder.toolList
  .map((tool) =>
    JSON.stringify({
      functionName: tool.name,
      functionDescription: tool.description,
      functionDoc: tool.doc
    })
  )
  .join("\n")}
`;

    this.messageHistory = [];
  }

  public attachInterceptor(interceptor: Interceptor) {
    this.interceptors.push(interceptor);
  }

  private notifyInterceptors(message: IMessage) {
    for (const interceptor of this.interceptors) {
      interceptor(message);
    }
  }

  public static builder() {
    return new AgentBuilder();
  }

  public printSystemPrompt() {
    console.log(this.instructions);
  }

  public async run(query: string) {
    const userMessage: IMessage = {
      role: "user",
      content: query
    };

    this.messageHistory.push(userMessage);
    this.notifyInterceptors(userMessage);

    for (let i = 0; i < this.MAX_LOOP; i++) {
      const llmResponse =
        await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: this.instructions
            },

            ...this.messageHistory.map((message) => ({
              role: message.role,
              content: message.content
            }))
          ]
        });

      const rawLLMResponse =
        llmResponse.choices[0]?.message.content;

      if (!rawLLMResponse) {
        throw new Error("LLM returned an empty response.");
      }

      const assistantMessage: IMessage = {
        role: "assistant",
        content: rawLLMResponse
      };

      this.messageHistory.push(assistantMessage);
      this.notifyInterceptors(assistantMessage);

      let parsedResult: {
        step?: string;
        text?: string;
        functionName?: string;
        input?: string;
      };

      try {
        parsedResult = JSON.parse(rawLLMResponse);
      } catch {
        throw new Error("LLM returned invalid JSON.");
      }

      const step = parsedResult.step?.toUpperCase();

      if (step === "OUTPUT") {
        return this.messageHistory;
      }

      if (step === "TOOL_REQUEST") {
        const { functionName, input } = parsedResult;

        if (!functionName) {
          throw new Error(
            "TOOL_REQUEST is missing functionName."
          );
        }

        const tool = this.toolMap.get(functionName);

        if (!tool) {
          const errorMessage: IMessage = {
            role: "developer",
            content:
              `Error: Function with name ${functionName} ` +
              `does not exist.`
          };

          this.messageHistory.push(errorMessage);
          this.notifyInterceptors(errorMessage);

          continue;
        }

        const toolResult = await tool.executor(input ?? "");

        const developerMessage: IMessage = {
          role: "developer",
          content: JSON.stringify({
            functionName,
            input: input ?? "",
            toolResult
          })
        };

        this.messageHistory.push(developerMessage);
        this.notifyInterceptors(developerMessage);
      }
    }

    throw new Error(
      `Agent stopped after reaching MAX_LOOP (${this.MAX_LOOP}).`
    );
  }
}
```

---

# 36. Understanding the Loop in One Diagram

The entire algorithm can be reduced to:

```text
                    ┌──────────────┐
                    │  User Query  │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ Message      │
                    │ History      │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
              ┌────→│     LLM      │
              │     └──────┬───────┘
              │            ↓
              │     ┌──────────────┐
              │     │ Parse JSON   │
              │     └──────┬───────┘
              │            ↓
              │       What step?
              │            │
              │      ┌─────┴─────┐
              │      ↓           ↓
              │ TOOL_REQUEST   OUTPUT
              │      │           │
              │      ↓           ↓
              │  Find Tool     Return
              │      │         History
              │      ↓
              │  Execute Tool
              │      │
              │      ↓
              │ Tool Result
              │      │
              │      ↓
              │ Add to History
              │      │
              └──────┘
```

This is the autonomous loop.

---

# 37. Important Architecture Boundary

There is an important distinction to remember:

```text
              LLM
               │
               │ decides
               ↓
       TOOL_REQUEST
               │
               ↓
        Agent Runtime
               │
               │ executes
               ↓
          Tool Function
               │
               ↓
          Tool Result
               │
               ↓
              LLM
```

The model does not magically execute:

```ts
tool.executor(...)
```

The **application runtime** does that.

The model only produces a structured request.

This separation is fundamental to agent architecture.

---

# 38. Why `MAX_LOOP` Matters

Imagine a faulty model repeatedly produces:

```text
TOOL_REQUEST
TOOL_REQUEST
TOOL_REQUEST
TOOL_REQUEST
...
```

The runtime could otherwise continue indefinitely.

With:

```ts
private MAX_LOOP = 30;
```

we have:

```text
Iteration 1
Iteration 2
Iteration 3
...
Iteration 30
   ↓
STOP
```

This is a basic but important runtime safety mechanism.

Later chapters can introduce more sophisticated limits such as:

* Maximum tool calls
* Token budgets
* Timeouts
* Per-tool limits
* Cancellation
* Retry policies

---

# 39. One Important Limitation of This Version

This implementation uses:

```ts
JSON.parse(rawLLMResponse)
```

to interpret model output.

That works for learning the architecture, but it relies heavily on the prompt to make the model return valid JSON.

In production, you should prefer stronger structured-output mechanisms or explicit tool/function calling mechanisms supported by the model/API you choose.

The important lesson for this chapter is the **agent runtime architecture**, not that prompt-only JSON parsing is the final production implementation.

---

# 40. Verification

First run TypeScript validation:

```bash
npx tsc --noEmit
```

If there are no errors:

```text
TypeScript compilation successful
```

Then start the application:

```bash
npm run dev
```

A simple example in `src/index.ts` can create an agent and attach an interceptor:

```ts
const agent = Agent.builder()
  .setInstructions(
    "You are a helpful assistant."
  )
  .tool(weatherTool)
  .build();

agent.attachInterceptor((message) => {
  console.log(
    `[${message.role}] ${message.content}`
  );
});

const result = await agent.run(
  "What is the weather in Goa?"
);

console.log(result);
```

---

# 41. Debugging the Agent

When something goes wrong, inspect the execution trajectory.

For example:

```text
[user] What is the weather in Goa?

[assistant]
{"step":"INITIAL", ...}

[assistant]
{"step":"THINK", ...}

[assistant]
{"step":"TOOL_REQUEST", ...}

[developer]
{"functionName":"getWeatherData", ...}

[assistant]
{"step":"OUTPUT", ...}
```

This makes it much easier to understand where the agent failed.

Possible failure points include:

```text
User Input
   ↓
LLM call              ← API/model problem
   ↓
JSON parsing          ← invalid model output
   ↓
Tool lookup            ← unknown function
   ↓
Tool execution         ← executor failure
   ↓
Next LLM call          ← context problem
   ↓
OUTPUT
```

---

# 42. Key Concepts Learned

| Concept          | Purpose                                     |
| ---------------- | ------------------------------------------- |
| Agent Runtime    | Executes the agent workflow                 |
| Message History  | Maintains trajectory/context                |
| Tool Map         | Provides fast tool lookup                   |
| System Prompt    | Defines agent behavior and capabilities     |
| Interceptor      | Observes runtime events                     |
| ReAct-style Loop | Repeated decision → action → observation    |
| Tool Dispatch    | Executes requested capabilities             |
| Result Injection | Gives tool results back to the model        |
| `MAX_LOOP`       | Prevents infinite execution                 |
| JSON Parsing     | Converts model output into structured steps |

---

# 43. Final Mental Model

At this point, the SDK has three major layers:

```text
┌───────────────────────────────────────┐
│              Chapter 1                │
│          Agent Pipeline               │
│                                       │
│ INITIAL → THINK → TOOL → ANALYSE      │
│                         ↓             │
│                       OUTPUT          │
└───────────────────┬───────────────────┘
                    │
                    ↓
┌───────────────────────────────────────┐
│              Chapter 2                │
│         Configuration Layer           │
│                                       │
│ AgentBuilder                          │
│ ├── Instructions                      │
│ └── Tools                             │
└───────────────────┬───────────────────┘
                    │
                    ↓
┌───────────────────────────────────────┐
│              Chapter 3                │
│            Runtime Layer              │
│                                       │
│ Agent                                 │
│ ├── LLM communication                 │
│ ├── Message history                   │
│ ├── Tool lookup                       │
│ ├── Tool execution                    │
│ ├── Interceptors                      │
│ └── Autonomous loop                   │
└───────────────────────────────────────┘
```

The complete architecture is now:

```text
                 USER
                   │
                   ↓
             AgentBuilder
                   │
                   │ build()
                   ↓
                 Agent
                   │
          ┌────────┼────────┐
          ↓        ↓        ↓
       History   Tools      LLM
          │        │        │
          └────────┼────────┘
                   ↓
              Agent Loop
                   │
          ┌────────┴────────┐
          ↓                 ↓
     TOOL_REQUEST         OUTPUT
          │                 │
          ↓                 ↓
      Tool Executor       Finished
          │
          ↓
      Tool Result
          │
          └──────→ LLM
```

> **Chapter 2 defined how an Agent is configured. Chapter 3 defines how that Agent thinks, acts, observes results, and continues until the task is complete.**

---

# 44. What Comes Next?

The core engine is now ready.

The next step is to create real tools and run the agent end-to-end.

In **Chapter 4**, we will build custom `ITool` implementations such as:

```text
Weather Tool
Calculator Tool
CLI Tool
```

and connect them to:

```text
src/index.ts
```

The final flow will become:

```text
User Query
    ↓
Agent
    ↓
LLM
    ↓
TOOL_REQUEST
    ↓
Custom Tool
    ↓
Tool Result
    ↓
LLM
    ↓
OUTPUT
    ↓
Final Result
```

That will turn the framework from a collection of classes into a working **tool-using autonomous agent**.
