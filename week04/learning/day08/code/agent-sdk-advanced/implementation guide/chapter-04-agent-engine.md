

# Chapter 4 — Core Autonomous Agent Engine & Step Parsing

## 1. Chapter Goal

In the previous chapters, we built the individual pieces of our Agent SDK:

* **Chapter 0:** Shared TypeScript types
* **Chapter 1:** System prompt and ReAct-style pipeline
* **Chapter 2:** Fluent `AgentBuilder`
* **Chapter 3:** Guardrails and interceptors

Now we need something that brings all of these pieces together.

That component is the **`Agent` class**.

The `Agent` class is the runtime engine responsible for:

1. Receiving a user query
2. Running input guardrails
3. Building the agent's system prompt
4. Calling the OpenAI model
5. Parsing the model's JSON response
6. Deciding what to do next
7. Executing tools when requested
8. Returning tool results to the model
9. Handling agent handoffs
10. Running output guardrails
11. Notifying interceptors
12. Stopping when an `OUTPUT` step is produced
13. Falling back to offline simulation when the API cannot be used

### 🎯 Expected Outcome

By the end of this chapter, the following architecture will be working:

```text
                    User Query
                        │
                        ▼
              ┌───────────────────┐
              │ Input Guardrails  │
              └─────────┬─────────┘
                        │ Passed
                        ▼
              ┌───────────────────┐
              │    Agent Loop     │
              │                   │
              │      LLM Call     │
              │         │         │
              │         ▼         │
              │   Parse JSON Step │
              └─────────┬─────────┘
                        │
            ┌───────────┼────────────┐
            ▼           ▼            ▼
         TOOL       HANDOFF       OUTPUT
            │           │            │
            ▼           ▼            ▼
       Execute Tool  Return to    Output
            │        Swarm        Guardrails
            │                        │
            └───────► LLM ◄──────────┘
                                      │
                                      ▼
                                 Final Answer
```

---

# 2. How the Agent Engine Works

Before looking at the code, understand the basic idea.

The `Agent` is essentially a loop:

```text
Receive query
     │
     ▼
Validate input
     │
     ▼
Ask LLM what to do
     │
     ▼
Parse LLM JSON
     │
     ├── TOOL_REQUEST ──► Execute tool ──► Continue loop
     │
     ├── HANDOFF ───────► Return handoff
     │
     └── OUTPUT ────────► Validate output ──► Return answer
```

The important part is that the LLM does not directly execute anything.

Instead, it produces a **structured instruction** such as:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "evaluateMathExpression",
  "input": "2 + 2"
}
```

The `Agent` reads this instruction and decides what code should actually execute.

This gives us a controlled architecture:

```text
LLM
 │
 │ JSON instruction
 ▼
Agent Engine
 │
 ├── Tool
 ├── Handoff
 └── Final Output
```

---

# 3. File Structure

Create:

```text
agent-sdk-advanced/
└── src/
    ├── agent.ts
    ├── builder.ts
    ├── config.ts
    └── types.ts
```

The new file is:

```text
src/agent.ts
```

---

# 4. Complete Implementation of `src/agent.ts`

## 4.1 Imports

Start by importing everything the engine needs.

```typescript
import OpenAI from "openai";

import { AgentBuilder } from "./builder.js";

import { HARNESS_PROMPT } from "./config.js";

import {
  AgentStepOutcome,
  HandoffPayload,
  IInputGuardrail,
  IMessage,
  IOutputGuardrail,
  ITool,
  Interceptor,
  LLMStepResponse,
} from "./types.js";
```

### What are these imports doing?

### `OpenAI`

```typescript
import OpenAI from "openai";
```

This imports the OpenAI SDK.

The agent will use it to communicate with the language model.

---

### `AgentBuilder`

```typescript
import { AgentBuilder } from "./builder.js";
```

The `AgentBuilder` contains the configuration created in Chapter 2.

For example:

```typescript
const builder = new AgentBuilder("MathAgent")
  .setInstructions("You are a mathematics specialist.")
  .model("gpt-4o");
```

When `.build()` is called, the builder passes its configuration to `Agent`.

---

### `HARNESS_PROMPT`

```typescript
import { HARNESS_PROMPT } from "./config.js";
```

This is the system-level instruction we created in Chapter 1.

It tells the LLM about our pipeline:

```text
INITIAL
THINK
TOOL_REQUEST
ANALYSE
HANDOFF
OUTPUT
```

The `Agent` combines this harness with the agent-specific instructions.

---

### Shared Types

```typescript
import {
  AgentStepOutcome,
  HandoffPayload,
  IInputGuardrail,
  IMessage,
  IOutputGuardrail,
  ITool,
  Interceptor,
  LLMStepResponse,
} from "./types.js";
```

These types make the engine type-safe.

For example:

* `IMessage` → conversation messages
* `ITool` → executable tools
* `IInputGuardrail` → input validation
* `IOutputGuardrail` → output validation
* `Interceptor` → logging/monitoring
* `LLMStepResponse` → parsed LLM step
* `AgentStepOutcome` → final result from the agent
* `HandoffPayload` → information required to transfer to another agent

---

# 5. Creating the `Agent` Class

```typescript
export class Agent {
```

The `Agent` class is the actual runtime representation of an agent.

The builder configures the agent.

The `Agent` executes the agent.

A useful mental model is:

```text
AgentBuilder
     │
     │ configuration
     ▼
   Agent
     │
     │ execution
     ▼
   LLM + Tools + Guardrails
```

---

# 6. Agent Properties

## Agent Name

```typescript
public readonly name: string;
```

The agent's name identifies it.

Example:

```typescript
new AgentBuilder("MathAgent")
```

produces:

```text
MathAgent
```

### Why `readonly`?

The name should not normally change after the agent has been created.

---

## Agent Instructions

```typescript
private instructions: string;
```

This contains the final system prompt sent to the model.

It will contain both:

1. The SDK harness
2. The agent-specific instructions

For example:

```text
You are an expert AI agent...

Agent Identity: "MathAgent"

System Prompt:
You are a mathematics specialist.
```

---

## Raw Instructions

```typescript
private rawInstructions: string;
```

This stores the original instructions supplied by the builder.

For example:

```typescript
.setInstructions("You are a mathematics specialist.")
```

stores:

```text
You are a mathematics specialist.
```

The current engine keeps this separately from the final constructed `instructions`.

---

## Tool Map

```typescript
private toolMap: Map<string, ITool>;
```

The agent needs to quickly find a tool by its name.

For example:

```text
evaluateMathExpression
fetchWeatherInfo
execCli
```

A `Map` is useful because we can do:

```typescript
this.toolMap.get("evaluateMathExpression");
```

instead of searching through the entire array every time.

Conceptually:

```text
Tool Name                    Tool
────────────────────────────────────────
"fetchWeatherInfo"     ───► Weather Tool
"evaluateMathExpression" ─► Math Tool
"execCli"              ───► CLI Tool
```

---

## Guardrails

```typescript
private inputGuardrails: IInputGuardrail[];

private outputGuardrails: IOutputGuardrail[];
```

These contain the validation rules configured for this particular agent.

Input guardrails execute **before** the agent starts processing.

Output guardrails execute **before** the final answer is returned.

---

## Interceptors

```typescript
private interceptors: Interceptor[];
```

Interceptors allow us to observe agent activity.

For example:

```text
USER message
ASSISTANT message
TOOL execution
TOOL result
HANDOFF
```

The logger interceptor from Chapter 3 uses this information to print activity to the console.

---

## Loop Limit

```typescript
private maxLoop: number;
```

This prevents an agent from running forever.

For example:

```typescript
maxLoop = 30;
```

means the agent can perform at most 30 iterations.

This is an important safety mechanism.

Without a loop limit, a malfunctioning agent could potentially continue indefinitely.

---

## Model Name

```typescript
private modelName: string;
```

This stores the model configured by the builder.

For example:

```typescript
.model("gpt-4o")
```

---

## OpenAI Client

```typescript
private openai: OpenAI;
```

This stores the OpenAI SDK client used to make model requests.

---

# 7. Agent Constructor

Now we create the constructor.

```typescript
constructor(builder: AgentBuilder) {
```

The constructor receives the completed builder.

For example:

```typescript
const agent = new AgentBuilder("MathAgent")
  .setInstructions("You solve mathematical problems.")
  .model("gpt-4o")
  .build();
```

Internally:

```text
AgentBuilder
     │
     │ configuration
     ▼
 Agent constructor
     │
     ▼
Initialize runtime state
```

---

# 8. Copying Builder Configuration

```typescript
this.name = builder.name;
this.rawInstructions = builder.instructions;
this.modelName = builder.modelName;
this.maxLoop = builder.maxLoop;
```

These lines transfer configuration from the builder into the actual agent.

For example:

```typescript
builder.name
```

becomes:

```typescript
this.name
```

---

## Copying Arrays

```typescript
this.interceptors = [...builder.interceptors];

this.inputGuardrails = [...builder.inputGuardrails];

this.outputGuardrails = [...builder.outputGuardrails];
```

The spread operator creates new arrays.

Instead of directly sharing the builder's array:

```typescript
this.interceptors = builder.interceptors;
```

we create a copy:

```typescript
this.interceptors = [...builder.interceptors];
```

This helps separate the built agent's runtime state from the builder.

---

# 9. Building the Tool Map

First create an empty map:

```typescript
this.toolMap = new Map();
```

Then register every tool:

```typescript
for (const t of builder.toolList) {
  this.toolMap.set(t.name, t);
}
```

Suppose the builder contains:

```text
fetchWeatherInfo
evaluateMathExpression
execCli
```

The map becomes:

```text
Map
├── fetchWeatherInfo → Weather Tool
├── evaluateMathExpression → Math Tool
└── execCli → CLI Tool
```

Later, the LLM can request:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo"
}
```

The agent can then perform:

```typescript
this.toolMap.get("fetchWeatherInfo");
```

---

# 10. Creating the Tool Description

The LLM needs to know which tools are available.

We therefore convert the registered tools into a description.

```typescript
const toolsDescription = builder.toolList
  .map((t) =>
    JSON.stringify(
      {
        functionName: t.name,
        functionDescription: t.description,
        functionDoc:
          t.doc ?? `${t.name}(input: string): string`,
      },
      null,
      2
    )
  )
  .join("\n\n");
```

Let's understand this step-by-step.

---

## Step 1 — Iterate over tools

```typescript
builder.toolList.map((t) => ...)
```

If we have:

```text
Tool A
Tool B
Tool C
```

`.map()` processes each tool.

---

## Step 2 — Convert tool information to JSON

```typescript
JSON.stringify(
  {
    functionName: t.name,
    functionDescription: t.description,
    functionDoc: t.doc ?? `${t.name}(input: string): string`,
  },
  null,
  2
)
```

This produces readable JSON such as:

```json
{
  "functionName": "evaluateMathExpression",
  "functionDescription": "Evaluates a mathematical expression.",
  "functionDoc": "evaluateMathExpression(input: string): string"
}
```

---

## Step 3 — Join tools together

```typescript
.join("\n\n")
```

This places two newlines between each tool description.

The final prompt might look like:

```text
{
  "functionName": "evaluateMathExpression",
  ...
}

{
  "functionName": "fetchWeatherInfo",
  ...
}
```

---

# 11. Building the Final System Prompt

Now we combine everything.

```typescript
this.instructions = `
  ${HARNESS_PROMPT}

  Agent Identity: "${this.name}"

  System Prompt:

  ${builder.instructions}

  Available Tools for this Agent:

  ${toolsDescription || "No tools registered for this agent."}
`;
```

This is one of the most important parts of the entire engine.

The model receives a prompt containing:

```text
┌──────────────────────────┐
│ HARNESS PROMPT           │
├──────────────────────────┤
│ Agent Identity           │
├──────────────────────────┤
│ Agent Instructions       │
├──────────────────────────┤
│ Available Tools          │
└──────────────────────────┘
```

So the model understands both:

* **how the SDK works**
* **what this particular agent is supposed to do**

---

# 12. Creating the OpenAI Client

```typescript
this.openai = new OpenAI({
  apiKey:
    builder.apiKey ||
    process.env.OPENAI_API_KEY ||
    "dummy-key",
});
```

The API key is resolved in this order:

```text
builder.apiKey
      │
      ▼
OPENAI_API_KEY environment variable
      │
      ▼
"dummy-key"
```

Therefore, a custom key can be supplied:

```typescript
.setApiKey("...")
```

or through:

```text
OPENAI_API_KEY
```

The `"dummy-key"` exists so the application can construct the client even when no real key is configured.

The offline simulation mechanism later prevents the SDK from requiring a real API during demonstrations.

---

# 13. Static Builder Helper

The agent exposes a convenient static method:

```typescript
public static builder(name?: string): AgentBuilder {
  return new AgentBuilder(name);
}
```

This allows developers to write:

```typescript
const agent = Agent
  .builder("MathAgent")
  .setInstructions("You solve math problems.")
  .build();
```

instead of:

```typescript
const builder = new AgentBuilder("MathAgent");

builder
  .setInstructions("You solve math problems.");

const agent = builder.build();
```

This makes the public API cleaner.

---

# 14. Attaching Interceptors at Runtime

```typescript
public attachInterceptor(interceptor: Interceptor): void {
  this.interceptors.push(interceptor);
}
```

Although interceptors can already be configured through the builder, this method allows an interceptor to be added later.

Example:

```typescript
agent.attachInterceptor(consoleLoggerInterceptor);
```

---

# 15. Notifying Interceptors

```typescript
private notifyInterceptors(message: IMessage): void {
  for (const interceptor of this.interceptors) {
    interceptor(message, this.name);
  }
}
```

Whenever something interesting happens, the agent calls:

```typescript
notifyInterceptors(...)
```

For example:

```text
User message
     │
     ▼
notifyInterceptors()
     │
     ▼
Logger
```

This is useful for:

* debugging
* logging
* monitoring
* analytics
* tracing
* auditing

---

# 16. Printing the System Prompt

```typescript
public printSystemPrompt(): void {
  console.log(
    `=== SYSTEM PROMPT FOR AGENT: ${this.name} ===`
  );

  console.log(this.instructions);

  console.log(
    "================================================="
  );
}
```

This helper is useful during development.

You can call:

```typescript
agent.printSystemPrompt();
```

and inspect exactly what system instructions are being sent to the LLM.

This is extremely useful when debugging agent behavior.

---

# 17. Parsing the LLM Response

The model is instructed to return JSON.

Ideally, it returns:

```json
{
  "step": "OUTPUT",
  "text": "Hello!"
}
```

But LLMs can sometimes return:

````text
```json
{
  "step": "OUTPUT",
  "text": "Hello!"
}
```
````

Therefore, we need a parser that can handle both cases.

---

## `parseLLMOutput()`

```typescript
private parseLLMOutput(rawText: string): LLMStepResponse {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);

    if (match) {
      return JSON.parse(match[0]);
    }

    throw new Error(
      `Failed to parse LLM output as JSON in agent '${this.name}': "${rawText}"`
    );
  }
}
```

---

## First Attempt — Direct JSON Parsing

```typescript
return JSON.parse(rawText);
```

If the model returns valid JSON:

```json
{
  "step": "OUTPUT",
  "text": "Hello"
}
```

this works immediately.

---

## Fallback — Find JSON Inside Text

If direct parsing fails:

```typescript
const match = rawText.match(/\{[\s\S]*\}/);
```

The regex searches for content beginning with:

```text
{
```

and ending with:

```text
}
```

The `[\s\S]*` part allows the match to span multiple lines.

For example:

````text
Here is the result:

```json
{
  "step": "OUTPUT",
  "text": "Hello"
}
```
````

The parser can extract:

```json
{
  "step": "OUTPUT",
  "text": "Hello"
}
```

and parse it.

---

## Important Limitation

This is a useful fallback, but it is not a complete JSON parser.

For production systems, you should eventually add stronger validation using:

* JSON Schema
* Zod
* structured model outputs
* schema validation

The current parser answers:

> "Can I find something that looks like JSON?"

It does **not** fully guarantee:

> "Does this JSON exactly match `LLMStepResponse`?"

That distinction becomes important as the SDK grows.

---

# 18. The Main `run()` Method

Now we reach the heart of the engine.

```typescript
public async run(
  query: string,
  existingHistory: IMessage[] = []
): Promise<AgentStepOutcome>
```

This method executes an agent interaction.

It accepts:

### `query`

The user's current request.

Example:

```text
"What is the weather in Goa?"
```

### `existingHistory`

Previous conversation history.

This is important for multi-agent handoffs because another agent may pass existing context to this agent.

---

# 19. Step 1 — Input Guardrails

Before calling the LLM, we validate the user's input.

```typescript
for (const guardrail of this.inputGuardrails) {
  const result = await guardrail.validate(
    query,
    this.name
  );

  if (!result.passed) {
    throw new Error(
      `[GUARDRAIL REJECTED] Agent '${this.name}' input failed '${guardrail.name}': ${result.reason}`
    );
  }
}
```

The execution flow is:

```text
User Query
    │
    ▼
Input Guardrail 1
    │
    ▼
Input Guardrail 2
    │
    ▼
Input Guardrail 3
    │
    ▼
LLM
```

If any guardrail fails:

```text
Guardrail FAILED
       │
       ▼
Throw Error
       │
       ▼
Agent execution stops
```

This is called **fail-fast validation**.

---

# 20. Creating Message History

```typescript
const messageHistory: IMessage[] = [
  ...existingHistory,
];
```

We copy the existing history instead of directly modifying the caller's array.

For example:

```typescript
existingHistory = [
  {
    role: "user",
    content: "Hello"
  },
  {
    role: "assistant",
    content: "Hi!"
  }
];
```

The agent starts with a copy of that history.

---

# 21. Adding the Current User Message

We check whether the query is already the latest user message.

```typescript
const lastMsg =
  messageHistory[messageHistory.length - 1];

if (
  !lastMsg ||
  lastMsg.content !== query ||
  lastMsg.role !== "user"
) {
```

If it is not already there, we create:

```typescript
const userMsg: IMessage = {
  role: "user",
  content: query,
};
```

Then:

```typescript
messageHistory.push(userMsg);
```

And notify interceptors:

```typescript
this.notifyInterceptors(userMsg);
```

So the logger can immediately see the user request.

---

# 22. Starting the Agent Loop

```typescript
for (
  let loopCount = 0;
  loopCount < this.maxLoop;
  loopCount++
) {
```

This is the autonomous loop.

For example:

```text
Loop 1
  ↓
LLM
  ↓
TOOL_REQUEST
  ↓
Loop 2
  ↓
LLM
  ↓
OUTPUT
  ↓
Finish
```

The maximum number of iterations is controlled by:

```typescript
this.maxLoop
```

---

# 23. Calling the LLM

Inside each loop:

```typescript
let rawLLMResponse: string = "";

try {
  const response =
    await this.openai.chat.completions.create({
      model: this.modelName,

      messages: [
        {
          role: "system",
          content: this.instructions,
        },

        ...messageHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

  rawLLMResponse =
    response.choices[0]?.message?.content ?? "";
}
```

The request contains:

```text
System Prompt
     +
Conversation History
     +
Current User Query
```

Conceptually:

```text
LLM Input
────────────────────────────
System:
  Harness + Agent Instructions

User:
  What is the weather?

Developer:
  Tool result...

User:
  ...
────────────────────────────
```

---

# 24. Why `messageHistory.map()`?

Our internal message type is:

```typescript
IMessage
```

which contains:

```typescript
{
  role,
  content,
  name?,
  timestamp?
}
```

The OpenAI request only needs the fields being sent here:

```typescript
{
  role: m.role,
  content: m.content
}
```

So the history is transformed before being sent to the API.

---

# 25. Offline Fallback

If the API request fails:

```typescript
catch {
  rawLLMResponse =
    this.simulateOfflineStep(
      query,
      messageHistory
    );
}
```

This allows the SDK to continue working without a real API response.

For example:

```text
No usable API
     │
     ▼
simulateOfflineStep()
     │
     ▼
Fake JSON step
     │
     ▼
Normal Agent Loop
```

This is particularly useful for:

* demos
* local testing
* unit tests
* development environments
* CI environments

### Important Production Note

The current implementation catches **any** OpenAI error and switches to offline simulation.

That is convenient for development, but production systems should usually distinguish between:

* missing API configuration
* authentication errors
* rate limits
* network errors
* invalid requests
* actual model failures

Otherwise, a real production API failure could be silently converted into a fake response.

---

# 26. Recording the Assistant Response

After receiving the LLM response:

```typescript
const assistantMsg: IMessage = {
  role: "assistant",
  content: rawLLMResponse,
};
```

Then add it to history:

```typescript
messageHistory.push(assistantMsg);
```

And notify interceptors:

```typescript
this.notifyInterceptors(assistantMsg);
```

The logger now knows:

```text
USER
  ↓
ASSISTANT
```

---

# 27. Parsing the LLM Step

Now:

```typescript
const parsedStep =
  this.parseLLMOutput(rawLLMResponse);
```

Suppose the model returned:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "evaluateMathExpression",
  "input": "2 + 2"
}
```

The parser produces:

```typescript
{
  step: "TOOL_REQUEST",
  functionName: "evaluateMathExpression",
  input: "2 + 2"
}
```

Now the agent can decide what to do.

---

# 28. Handling `HANDOFF`

The first special case is:

```typescript
if (
  parsedStep.step.toUpperCase() === "HANDOFF" &&
  parsedStep.targetAgent
) {
```

Suppose the model returns:

```json
{
  "step": "HANDOFF",
  "targetAgent": "MathAgent",
  "reason": "This requires mathematical reasoning."
}
```

The engine converts it into:

```typescript
const payload: HandoffPayload = {
  targetAgent: parsedStep.targetAgent,
  reason:
    parsedStep.reason ||
    "Explicit handoff requested by LLM.",
};
```

Then returns:

```typescript
return {
  type: "HANDOFF",
  handoffPayload: payload,
  history: messageHistory,
};
```

The current agent stops.

The future `AgentSwarm` will use this information to transfer execution to another agent.

Architecture:

```text
RouterAgent
     │
     │ HANDOFF
     ▼
MathAgent
```

---

# 29. Handling `OUTPUT`

Next:

```typescript
if (
  parsedStep.step.toUpperCase() === "OUTPUT"
) {
```

Suppose the model returns:

```json
{
  "step": "OUTPUT",
  "text": "The answer is 42."
}
```

We extract:

```typescript
let finalOutputText =
  parsedStep.text || rawLLMResponse;
```

Now we have the candidate final response:

```text
The answer is 42.
```

But we are not finished yet.

The response must pass output guardrails.

---

# 30. Running Output Guardrails

```typescript
for (const guardrail of this.outputGuardrails) {
  const result =
    await guardrail.validate(
      finalOutputText,
      this.name
    );
```

The flow is:

```text
LLM Output
    │
    ▼
PII Guardrail
    │
    ▼
Content Safety Guardrail
    │
    ▼
Final Output
```

If a guardrail fails:

```typescript
if (!result.passed) {
  throw new Error(
    `[GUARDRAIL REJECTED] Agent '${this.name}' output failed '${guardrail.name}': ${result.reason}`
  );
}
```

The output is blocked.

---

# 31. Supporting Modified Output

A guardrail does not always need to reject an answer.

It can also modify it.

For example, our PII guardrail may transform:

```text
Contact me at test@example.com
```

into:

```text
Contact me at [REDACTED_EMAIL]
```

The agent handles that using:

```typescript
if (result.modifiedContent) {
  finalOutputText =
    result.modifiedContent;
}
```

This gives us two useful guardrail behaviors:

```text
Validation
    │
    ├── passed = false
    │       └── Block
    │
    └── passed = true
            │
            ├── modifiedContent exists
            │       └── Use sanitized content
            │
            └── no modification
                    └── Use original content
```

---

# 32. Returning the Final Output

After all output guardrails pass:

```typescript
return {
  type: "OUTPUT",
  output: finalOutputText,
  history: messageHistory,
};
```

The agent interaction is complete.

---

# 33. Handling `TOOL_REQUEST`

The third major step is:

```typescript
if (
  parsedStep.step.toUpperCase() ===
  "TOOL_REQUEST"
) {
```

The model might return:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "evaluateMathExpression",
  "input": "2 + 2"
}
```

We extract:

```typescript
const {
  functionName,
  input,
} = parsedStep;
```

---

# 34. Validating the Tool Name

First check:

```typescript
if (!functionName) {
```

If the model forgot the tool name, we don't crash the entire agent.

Instead, create a developer message:

```typescript
const errPayload =
  JSON.stringify({
    error:
      "TOOL_REQUEST missing functionName",
  });
```

Then:

```typescript
const devMsg: IMessage = {
  role: "developer",
  content: errPayload,
};
```

Add it to history:

```typescript
messageHistory.push(devMsg);
```

And notify interceptors:

```typescript
this.notifyInterceptors(devMsg);
```

Then:

```typescript
continue;
```

This sends the loop back to the LLM.

The model gets a chance to correct itself.

---

# 35. Finding the Requested Tool

Now:

```typescript
const tool =
  this.toolMap.get(functionName);
```

If the LLM requests:

```text
evaluateMathExpression
```

the engine searches:

```text
toolMap
   │
   └── evaluateMathExpression
             │
             ▼
        Math Tool
```

---

# 36. Handling Unknown Tools

If the tool doesn't exist:

```typescript
if (!tool) {
```

we generate:

```typescript
const errPayload =
  JSON.stringify({
    error:
      `Function '${functionName}' not registered on agent '${this.name}'.`,
  });
```

Then send the error back into the conversation as a developer message.

This is important because the LLM can potentially recover.

For example:

```text
LLM:
Call unknownTool

Agent:
Tool not registered.

LLM:
Okay, I'll use availableTool.
```

---

# 37. Executing the Tool

If the tool exists:

```typescript
const toolResult =
  await tool.executor(input ?? "");
```

This is where actual application code executes.

For example:

```typescript
const evaluateMathExpression: ITool = {
  name: "evaluateMathExpression",

  description:
    "Evaluates mathematical expressions.",

  executor: (input) => {
    return "42";
  },
};
```

The agent executes:

```typescript
tool.executor("2 + 2");
```

and receives:

```text
42
```

---

# 38. Recording the Tool Result

The result is converted into a developer message:

```typescript
const devMsg: IMessage = {
  role: "developer",

  content: JSON.stringify({
    functionName,
    input,
    toolResult,
  }),
};
```

For example:

```json
{
  "functionName": "evaluateMathExpression",
  "input": "2 + 2",
  "toolResult": "4"
}
```

Then:

```typescript
messageHistory.push(devMsg);
```

and:

```typescript
this.notifyInterceptors(devMsg);
```

The next LLM call now sees the tool result in its conversation history.

---

# 39. Tool-Based Handoff

A tool can also request a handoff.

The engine attempts to parse the tool result:

```typescript
try {
  const parsedToolResult =
    JSON.parse(toolResult);
```

Then checks:

```typescript
if (
  parsedToolResult.status ===
  "HANDOFF_TRIGGERED"
) {
```

For example, a router tool could return:

```json
{
  "status": "HANDOFF_TRIGGERED",
  "targetAgent": "WeatherAgent",
  "reason": "Weather specialist required."
}
```

The engine converts this into:

```typescript
return {
  type: "HANDOFF",

  handoffPayload: {
    targetAgent:
      parsedToolResult.targetAgent,

    reason:
      parsedToolResult.reason,
  },

  history: messageHistory,
};
```

This creates two possible handoff mechanisms:

```text
LLM directly
     │
     └── HANDOFF

OR

Tool
     │
     └── HANDOFF_TRIGGERED
```

This becomes especially useful when we build the multi-agent swarm.

---

# 40. Tool Execution Errors

Tool execution can fail.

For example:

```text
Database unavailable
API timeout
Invalid input
Permission denied
```

The engine catches the error:

```typescript
catch (err: any) {
```

and records:

```typescript
const failMsg: IMessage = {
  role: "developer",

  content: JSON.stringify({
    functionName,
    input,
    error: err.message,
  }),
};
```

Then the message is added to history.

This allows the LLM to see:

```json
{
  "functionName": "fetchWeatherInfo",
  "input": "Goa",
  "error": "Weather API unavailable"
}
```

and potentially choose another strategy.

---

# 41. Why `continue` Matters

When a tool completes successfully, the outer loop does not immediately return.

Instead, it naturally reaches the next iteration.

That means:

```text
LLM
 │
 ▼
TOOL_REQUEST
 │
 ▼
Execute Tool
 │
 ▼
Add Tool Result to History
 │
 ▼
Next Loop
 │
 ▼
LLM sees Tool Result
```

This is the core of the autonomous loop.

The model gets a chance to reason about the tool result.

---

# 42. Maximum Loop Protection

If the agent never produces:

```text
OUTPUT
```

or:

```text
HANDOFF
```

the loop eventually reaches:

```typescript
throw new Error(
  `Agent '${this.name}' exceeded MAX_LOOP limit of ${this.maxLoop} turns.`
);
```

For example:

```text
maxLoop = 30
```

After 30 iterations:

```text
STOP
 │
 ▼
MAX_LOOP error
```

This protects against infinite execution.

---

# 43. Offline Simulation

The final major component is:

```typescript
private simulateOfflineStep(
  query: string,
  history: IMessage[]
): string
```

This method produces fake LLM responses when the real API cannot be used.

The important thing is that it returns the **same JSON format** expected from the real LLM.

That means the rest of the agent engine does not need to know whether the response came from:

```text
Real LLM
```

or:

```text
Offline simulator
```

Both produce:

```json
{
  "step": "..."
}
```

---

# 44. Inspecting the Last Message

```typescript
const lastMsg =
  history[history.length - 1];
```

The simulator looks at the latest conversation message.

If it is a developer message:

```typescript
if (lastMsg.role === "developer") {
```

it returns:

```typescript
return JSON.stringify({
  step: "OUTPUT",

  text:
    `Processed developer payload successfully in agent ${this.name}. Result: ${lastMsg.content}`,
});
```

This simulates the LLM reading a tool result and producing a final response.

---

# 45. Simulating Handoffs

The simulator contains simple routing rules.

For example:

```typescript
if (
  this.name === "TriageAgent" ||
  this.name === "RouterAgent"
) {
```

These agents behave like routing agents in offline mode.

---

## Weather

```typescript
if (q.includes("weather")) {
```

returns:

```json
{
  "step": "HANDOFF",
  "targetAgent": "WeatherAgent",
  "reason": "Query requires weather specialist."
}
```

---

## Mathematics

```typescript
if (
  q.includes("math") ||
  q.includes("calculate") ||
  q.includes("add")
) {
```

returns a handoff to:

```text
MathAgent
```

---

## DevOps

```typescript
if (
  q.includes("cli") ||
  q.includes("command") ||
  q.includes("dir") ||
  q.includes("list")
) {
```

returns:

```text
DevOpsAgent
```

This gives us a simple offline representation of the future multi-agent swarm.

---

# 46. Simulating Tool Requests

The simulator can also generate tool requests.

For example:

```typescript
if (
  q.includes("weather") &&
  this.toolMap.has("fetchWeatherInfo")
) {
```

returns:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

The real agent engine then handles this exactly like a real LLM response.

This is important.

The simulator is not implementing a second agent engine.

It is simply producing fake LLM step responses.

---

# 47. Math Tool Simulation

For math queries:

```typescript
if (
  (
    q.includes("math") ||
    q.includes("calculate") ||
    q.includes("2 + 2")
  ) &&
  this.toolMap.has(
    "evaluateMathExpression"
  )
) {
```

the simulator requests:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "evaluateMathExpression",
  "input": "2 + 2 * 10"
}
```

The real tool is then executed by the normal engine.

---

# 48. CLI Tool Simulation

For CLI-related requests:

```typescript
if (
  (q.includes("cli") ||
   q.includes("command")) &&
  this.toolMap.has("execCli")
) {
```

the simulator requests:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "execCli",
  "input": "echo 'Agent SDK Advanced CLI Response'"
}
```

Again, the normal tool execution path handles it.

---

# 49. Knowledge Base Simulation

If a knowledge tool is registered:

```typescript
if (
  q.includes("knowledge") &&
  this.toolMap.has("searchKnowledgeBase")
) {
```

the simulator generates:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "searchKnowledgeBase",
  "input": "agent sdk"
}
```

---

# 50. Default Offline Output

If none of the special cases match:

```typescript
return JSON.stringify({
  step: "OUTPUT",

  text:
    `[${this.name}] Successfully processed query: "${query}"`,
});
```

So even without OpenAI, we can test the complete agent lifecycle.

---

# 51. Complete `src/agent.ts`

The complete implementation is:

```typescript
import OpenAI from "openai";
import { AgentBuilder } from "./builder.js";
import { HARNESS_PROMPT } from "./config.js";

import {
  AgentStepOutcome,
  HandoffPayload,
  IInputGuardrail,
  IMessage,
  IOutputGuardrail,
  ITool,
  Interceptor,
  LLMStepResponse,
} from "./types.js";

export class Agent {
  public readonly name: string;

  private instructions: string;
  private rawInstructions: string;

  private toolMap: Map<string, ITool>;

  private inputGuardrails: IInputGuardrail[];
  private outputGuardrails: IOutputGuardrail[];

  private interceptors: Interceptor[];

  private maxLoop: number;
  private modelName: string;

  private openai: OpenAI;

  constructor(builder: AgentBuilder) {
    this.name = builder.name;
    this.rawInstructions = builder.instructions;
    this.modelName = builder.modelName;
    this.maxLoop = builder.maxLoop;

    this.interceptors = [...builder.interceptors];
    this.inputGuardrails = [...builder.inputGuardrails];
    this.outputGuardrails = [...builder.outputGuardrails];

    this.toolMap = new Map();

    for (const t of builder.toolList) {
      this.toolMap.set(t.name, t);
    }

    const toolsDescription = builder.toolList
      .map((t) =>
        JSON.stringify(
          {
            functionName: t.name,
            functionDescription: t.description,
            functionDoc:
              t.doc ??
              `${t.name}(input: string): string`,
          },
          null,
          2
        )
      )
      .join("\n\n");

    this.instructions = `
      ${HARNESS_PROMPT}

      Agent Identity: "${this.name}"

      System Prompt:

      ${builder.instructions}

      Available Tools for this Agent:

      ${
        toolsDescription ||
        "No tools registered for this agent."
      }
    `;

    this.openai = new OpenAI({
      apiKey:
        builder.apiKey ||
        process.env.OPENAI_API_KEY ||
        "dummy-key",
    });
  }

  public static builder(
    name?: string
  ): AgentBuilder {
    return new AgentBuilder(name);
  }

  public attachInterceptor(
    interceptor: Interceptor
  ): void {
    this.interceptors.push(interceptor);
  }

  private notifyInterceptors(
    message: IMessage
  ): void {
    for (const interceptor of this.interceptors) {
      interceptor(message, this.name);
    }
  }

  public printSystemPrompt(): void {
    console.log(
      `=== SYSTEM PROMPT FOR AGENT: ${this.name} ===`
    );

    console.log(this.instructions);

    console.log(
      "================================================="
    );
  }

  private parseLLMOutput(
    rawText: string
  ): LLMStepResponse {
    try {
      return JSON.parse(rawText);
    } catch {
      const match =
        rawText.match(/\{[\s\S]*\}/);

      if (match) {
        return JSON.parse(match[0]);
      }

      throw new Error(
        `Failed to parse LLM output as JSON in agent '${this.name}': "${rawText}"`
      );
    }
  }

  public async run(
    query: string,
    existingHistory: IMessage[] = []
  ): Promise<AgentStepOutcome> {

    // 1. Run input guardrails
    for (const guardrail of this.inputGuardrails) {
      const result =
        await guardrail.validate(
          query,
          this.name
        );

      if (!result.passed) {
        throw new Error(
          `[GUARDRAIL REJECTED] Agent '${this.name}' input failed '${guardrail.name}': ${result.reason}`
        );
      }
    }

    const messageHistory: IMessage[] = [
      ...existingHistory,
    ];

    const lastMsg =
      messageHistory[
        messageHistory.length - 1
      ];

    if (
      !lastMsg ||
      lastMsg.content !== query ||
      lastMsg.role !== "user"
    ) {
      const userMsg: IMessage = {
        role: "user",
        content: query,
      };

      messageHistory.push(userMsg);
      this.notifyInterceptors(userMsg);
    }

    for (
      let loopCount = 0;
      loopCount < this.maxLoop;
      loopCount++
    ) {
      let rawLLMResponse = "";

      try {
        const response =
          await this.openai.chat.completions.create({
            model: this.modelName,

            messages: [
              {
                role: "system",
                content: this.instructions,
              },

              ...messageHistory.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            ],
          });

        rawLLMResponse =
          response.choices[0]
            ?.message
            ?.content ?? "";

      } catch {
        // Offline fallback
        rawLLMResponse =
          this.simulateOfflineStep(
            query,
            messageHistory
          );
      }

      const assistantMsg: IMessage = {
        role: "assistant",
        content: rawLLMResponse,
      };

      messageHistory.push(assistantMsg);
      this.notifyInterceptors(assistantMsg);

      const parsedStep =
        this.parseLLMOutput(
          rawLLMResponse
        );

      // ---------------------------
      // HANDOFF
      // ---------------------------

      if (
        parsedStep.step.toUpperCase() ===
          "HANDOFF" &&
        parsedStep.targetAgent
      ) {
        const payload: HandoffPayload = {
          targetAgent:
            parsedStep.targetAgent,

          reason:
            parsedStep.reason ||
            "Explicit handoff requested by LLM.",
        };

        return {
          type: "HANDOFF",
          handoffPayload: payload,
          history: messageHistory,
        };
      }

      // ---------------------------
      // OUTPUT
      // ---------------------------

      if (
        parsedStep.step.toUpperCase() ===
        "OUTPUT"
      ) {
        let finalOutputText =
          parsedStep.text ||
          rawLLMResponse;

        for (
          const guardrail of
          this.outputGuardrails
        ) {
          const result =
            await guardrail.validate(
              finalOutputText,
              this.name
            );

          if (!result.passed) {
            throw new Error(
              `[GUARDRAIL REJECTED] Agent '${this.name}' output failed '${guardrail.name}': ${result.reason}`
            );
          }

          if (result.modifiedContent) {
            finalOutputText =
              result.modifiedContent;
          }
        }

        return {
          type: "OUTPUT",
          output: finalOutputText,
          history: messageHistory,
        };
      }

      // ---------------------------
      // TOOL REQUEST
      // ---------------------------

      if (
        parsedStep.step.toUpperCase() ===
        "TOOL_REQUEST"
      ) {
        const {
          functionName,
          input,
        } = parsedStep;

        if (!functionName) {
          const errPayload =
            JSON.stringify({
              error:
                "TOOL_REQUEST missing functionName",
            });

          const devMsg: IMessage = {
            role: "developer",
            content: errPayload,
          };

          messageHistory.push(devMsg);
          this.notifyInterceptors(
            devMsg
          );

          continue;
        }

        const tool =
          this.toolMap.get(
            functionName
          );

        if (!tool) {
          const errPayload =
            JSON.stringify({
              error:
                `Function '${functionName}' not registered on agent '${this.name}'.`,
            });

          const devMsg: IMessage = {
            role: "developer",
            content: errPayload,
          };

          messageHistory.push(devMsg);
          this.notifyInterceptors(
            devMsg
          );

          continue;
        }

        try {
          const toolResult =
            await tool.executor(
              input ?? ""
            );

          const devMsg: IMessage = {
            role: "developer",

            content: JSON.stringify({
              functionName,
              input,
              toolResult,
            }),
          };

          messageHistory.push(devMsg);

          this.notifyInterceptors(
            devMsg
          );

          // Tool-based handoff
          try {
            const parsedToolResult =
              JSON.parse(toolResult);

            if (
              parsedToolResult.status ===
              "HANDOFF_TRIGGERED"
            ) {
              return {
                type: "HANDOFF",

                handoffPayload: {
                  targetAgent:
                    parsedToolResult.targetAgent,

                  reason:
                    parsedToolResult.reason,
                },

                history: messageHistory,
              };
            }
          } catch {
            // Normal string tool result
          }

        } catch (err: any) {
          const failMsg: IMessage = {
            role: "developer",

            content: JSON.stringify({
              functionName,
              input,
              error: err.message,
            }),
          };

          messageHistory.push(failMsg);

          this.notifyInterceptors(
            failMsg
          );
        }
      }
    }

    throw new Error(
      `Agent '${this.name}' exceeded MAX_LOOP limit of ${this.maxLoop} turns.`
    );
  }

  private simulateOfflineStep(
    query: string,
    history: IMessage[]
  ): string {

    const q = query.toLowerCase();

    const lastMsg =
      history[
        history.length - 1
      ];

    // Process previous tool/developer result
    if (
      lastMsg &&
      lastMsg.role === "developer"
    ) {
      return JSON.stringify({
        step: "OUTPUT",

        text:
          `Processed developer payload successfully in agent ${this.name}. Result: ${lastMsg.content}`,
      });
    }

    // ---------------------------
    // Simulated handoffs
    // ---------------------------

    if (
      this.name === "TriageAgent" ||
      this.name === "RouterAgent"
    ) {

      if (q.includes("weather")) {
        return JSON.stringify({
          step: "HANDOFF",
          targetAgent: "WeatherAgent",
          reason:
            "Query requires weather specialist.",
        });
      }

      if (
        q.includes("math") ||
        q.includes("calculate") ||
        q.includes("add")
      ) {
        return JSON.stringify({
          step: "HANDOFF",
          targetAgent: "MathAgent",
          reason:
            "Query requires mathematics specialist.",
        });
      }

      if (
        q.includes("cli") ||
        q.includes("command") ||
        q.includes("dir") ||
        q.includes("list")
      ) {
        return JSON.stringify({
          step: "HANDOFF",
          targetAgent: "DevOpsAgent",
          reason:
            "Query requires DevOps command execution specialist.",
        });
      }
    }

    // ---------------------------
    // Simulated tool requests
    // ---------------------------

    if (
      q.includes("weather") &&
      this.toolMap.has(
        "fetchWeatherInfo"
      )
    ) {
      return JSON.stringify({
        step: "TOOL_REQUEST",
        functionName:
          "fetchWeatherInfo",
        input: "Goa",
      });
    }

    if (
      (
        q.includes("math") ||
        q.includes("calculate") ||
        q.includes("2 + 2")
      ) &&
      this.toolMap.has(
        "evaluateMathExpression"
      )
    ) {
      return JSON.stringify({
        step: "TOOL_REQUEST",
        functionName:
          "evaluateMathExpression",
        input: "2 + 2 * 10",
      });
    }

    if (
      (
        q.includes("cli") ||
        q.includes("command")
      ) &&
      this.toolMap.has("execCli")
    ) {
      return JSON.stringify({
        step: "TOOL_REQUEST",
        functionName: "execCli",
        input:
          "echo 'Agent SDK Advanced CLI Response'",
      });
    }

    if (
      q.includes("knowledge") &&
      this.toolMap.has(
        "searchKnowledgeBase"
      )
    ) {
      return JSON.stringify({
        step: "TOOL_REQUEST",
        functionName:
          "searchKnowledgeBase",
        input: "agent sdk",
      });
    }

    // ---------------------------
    // Default output
    // ---------------------------

    return JSON.stringify({
      step: "OUTPUT",

      text:
        `[${this.name}] Successfully processed query: "${query}"`,
    });
  }
}
```

---

# 52. Complete Agent Execution Flow

At this point, the entire runtime can be visualized as:

```text
                    ┌───────────────┐
                    │  User Query   │
                    └───────┬───────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ Input Guardrails  │
                  └─────────┬─────────┘
                            │
                       Passed?
                       /     \
                     No       Yes
                     │         │
                     ▼         ▼
                   Error    Agent Loop
                               │
                               ▼
                         ┌───────────┐
                         │    LLM    │
                         └─────┬─────┘
                               │
                               ▼
                         Parse JSON
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
       TOOL_REQUEST         HANDOFF           OUTPUT
             │                 │                 │
             ▼                 ▼                 ▼
        Execute Tool      Return Payload   Output Guardrails
             │                                   │
             ▼                              ┌────┴────┐
        Tool Result                         │         │
             │                            Pass       Fail
             ▼                              │         │
       Add to History                       ▼         ▼
             │                          Final Answer Error
             │
             ▼
        Next LLM Loop
```

This is the core architecture of our Agent SDK.

---

# 53. Why the Agent Uses a Loop

A normal LLM request might look like:

```text
User → LLM → Answer
```

An autonomous agent is different:

```text
User
 │
 ▼
LLM
 │
 ├── Tool
 │    │
 │    └── Result
 │          │
 │          ▼
 │         LLM
 │          │
 │          └── Final Answer
 │
 └── Handoff
```

The loop allows the model to perform multiple actions before producing a final response.

For example:

```text
User:
"What is the weather in Goa?"

LLM:
TOOL_REQUEST

Agent:
fetchWeatherInfo("Goa")

Tool:
32°C, Sunny

LLM:
OUTPUT

Agent:
Final response
```

---

# 54. How Chapter 4 Connects Previous Chapters

The architecture we've built so far now looks like this:

```text
                    AgentBuilder
                         │
                         ▼
                       Agent
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
     Guardrails        Tools       Interceptors
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                    Agent Runtime
                         │
                         ▼
                       OpenAI
                         │
                         ▼
                    JSON Step
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
             Tool      Handoff    Output
```

Each chapter now has a clear responsibility:

| Chapter   | Responsibility                         |
| --------- | -------------------------------------- |
| Chapter 0 | Shared contracts and types             |
| Chapter 1 | LLM behavior and pipeline instructions |
| Chapter 2 | Agent configuration                    |
| Chapter 3 | Safety and observability               |
| Chapter 4 | Runtime execution                      |

---

# 55. Verification

First compile the project:

```bash
npm run build
```

If TypeScript reports no errors, the new `Agent` implementation is compiling successfully.

You should see the generated JavaScript inside:

```text
dist/
```

---

# 56. Testing the Agent Without an API Key

Because we have an offline fallback, we can create an agent without relying on a real API response.

For example:

```typescript
import { Agent } from "./src/agent.js";

const agent = Agent
  .builder("TestAgent")
  .setInstructions(
    "You are a helpful test agent."
  )
  .build();

const result = await agent.run(
  "Hello agent"
);

console.log(result);
```

The offline simulator can produce an output similar to:

```text
{
  type: "OUTPUT",
  output:
    '[TestAgent] Successfully processed query: "Hello agent"',
  history: [...]
}
```

---

# 57. Testing a Tool

You can also test the autonomous tool flow.

```typescript
import { Agent } from "./src/agent.js";

const mathTool = {
  name: "evaluateMathExpression",

  description:
    "Evaluates a mathematical expression.",

  executor: (input: string) => {
    return "42";
  },
};

const agent = Agent
  .builder("MathAgent")
  .tool(mathTool)
  .build();

const result =
  await agent.run(
    "calculate something"
  );

console.log(result);
```

The offline simulator detects the math-related query and produces a `TOOL_REQUEST`.

The agent then executes:

```typescript
mathTool.executor(...)
```

and feeds the result back into the agent loop.

---

# 58. Testing the System Prompt

You can inspect the complete prompt using:

```typescript
agent.printSystemPrompt();
```

This is useful for debugging.

You should see something conceptually like:

```text
=== SYSTEM PROMPT FOR AGENT: MathAgent ===

[Harness instructions]

Agent Identity: "MathAgent"

System Prompt:

You are a mathematics specialist.

Available Tools for this Agent:

{
  "functionName": "evaluateMathExpression",
  "functionDescription": "...",
  "functionDoc": "..."
}

=================================================
```

---

# 59. Important Design Lessons

## 1. The LLM Does Not Directly Execute Tools

The LLM only requests:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "..."
}
```

The `Agent` decides whether the tool exists and executes it.

This creates a security boundary:

```text
LLM
 │
 │ Request
 ▼
Agent
 │
 │ Validate
 ▼
Tool
```

---

## 2. History Is the Agent's Working Memory

The `messageHistory` array contains:

```text
User messages
Assistant decisions
Developer/tool results
```

This history is sent back to the model on subsequent loops.

Therefore:

```text
Tool Result
     │
     ▼
History
     │
     ▼
Next LLM Request
```

is what allows the model to reason over previous actions.

---

## 3. Guardrails Surround the Agent

Input guardrails protect the agent **before execution**.

Output guardrails protect the user **after generation**.

```text
Input
 │
 ▼
[INPUT GUARDRAILS]
 │
 ▼
[AGENT]
 │
 ▼
[OUTPUT GUARDRAILS]
 │
 ▼
User
```

This is a fundamental safety pattern for agent systems.

---

## 4. Interceptors Are Observability Hooks

Interceptors don't control the main execution flow.

Instead, they observe it.

```text
Agent
 │
 ├── Execute
 │
 └── Notify Interceptor
          │
          ├── Logger
          ├── Analytics
          └── Tracing
```

This makes the architecture extensible.

---

# 60. Common Mistakes

### Mistake 1 — Forgetting `.js` in ESM imports

Use:

```typescript
import { AgentBuilder } from "./builder.js";
```

not:

```typescript
import { AgentBuilder } from "./builder";
```

when using the NodeNext ESM configuration from Chapter 0.

---

### Mistake 2 — Forgetting the loop limit

Never build an autonomous agent without a maximum execution limit.

Use:

```typescript
maxLoop
```

as a safety mechanism.

---

### Mistake 3 — Executing arbitrary tool names

Never assume the LLM requested a valid tool.

Always check:

```typescript
const tool =
  this.toolMap.get(functionName);

if (!tool) {
  // handle unknown tool
}
```

---

### Mistake 4 — Returning tool results without storing them

The model needs to see what the tool returned.

Therefore, tool results must be added to:

```typescript
messageHistory
```

before the next LLM iteration.

---

### Mistake 5 — Assuming every LLM response is valid JSON

LLMs can sometimes produce:

````text
```json
{ ... }
```
````

or additional text around JSON.

That's why `parseLLMOutput()` provides a fallback.

For production, however, stronger structured-output validation should eventually replace this lightweight approach.

---

### Mistake 6 — Treating all API errors as offline mode

The current implementation does:

```typescript
catch {
  rawLLMResponse =
    this.simulateOfflineStep(...);
}
```

This is excellent for learning and local demonstrations.

For production, it is better to distinguish between:

```text
Missing API key
        ↓
Offline fallback

Rate limit
        ↓
Retry/backoff

Authentication failure
        ↓
Configuration error

Network failure
        ↓
Retry/fail

Invalid model request
        ↓
Application error
```

This can be improved in a future chapter.

---

# 61. Final Mental Model

The easiest way to remember the `Agent` engine is:

```text
              USER
                │
                ▼
        ┌───────────────┐
        │ Input Guards  │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │      LLM      │◄──────────────┐
        └───────┬───────┘               │
                │                       │
                ▼                       │
          Parse JSON Step               │
                │                       │
       ┌────────┼────────┐              │
       │        │        │              │
       ▼        ▼        ▼              │
     TOOL    HANDOFF   OUTPUT           │
       │        │        │              │
       │        │        ▼              │
       │        │   Output Guards       │
       │        │        │              │
       │        │        ▼              │
       │        │      RETURN           │
       │        │                       │
       ▼        ▼                       │
   Execute   Return                      │
     Tool    Handoff                     │
       │                                  │
       ▼                                  │
   Tool Result                            │
       │                                  │
       ▼                                  │
    History ──────────────────────────────┘
```

The key idea is:

> **The LLM decides what should happen next; the `Agent` controls what is actually allowed to happen.**

That distinction is what turns a simple LLM API call into an **agent runtime**.

---

# 62. Chapter 4 Checklist

Before moving forward, make sure you understand:

* [ ] Why the `Agent` class is the runtime engine
* [ ] How `AgentBuilder` configuration enters `Agent`
* [ ] Why tools are stored in a `Map`
* [ ] How the system prompt is assembled
* [ ] How the OpenAI client is initialized
* [ ] How `run()` starts the execution lifecycle
* [ ] How input guardrails run before the LLM
* [ ] How conversation history is maintained
* [ ] How the LLM produces structured steps
* [ ] How `parseLLMOutput()` works
* [ ] How `TOOL_REQUEST` works
* [ ] How tool results return to the LLM
* [ ] How `HANDOFF` works
* [ ] How output guardrails sanitize or reject responses
* [ ] Why interceptors are notified
* [ ] Why `maxLoop` is required
* [ ] How offline simulation works

---

# 63. What's Next?

We now have a complete **single-agent runtime**.

But a real autonomous system may need multiple specialized agents:

```text
                    User
                      │
                      ▼
                 RouterAgent
                /     |      \
               /      |       \
              ▼       ▼        ▼
        MathAgent  Weather   DevOps
                     Agent     Agent
```

For example:

```text
User:
"Calculate 20% of 500 and then tell me today's weather."

RouterAgent
     │
     ├──► MathAgent
     │       │
     │       └──► Math Tool
     │
     └──► WeatherAgent
             │
             └──► Weather Tool
```

The `Agent` class already knows how to produce a `HANDOFF`.

Now we need something that can **receive that handoff and route execution to another agent**.

That component will be the:

# **`AgentSwarm` — Multi-Agent Orchestrator**

In **Chapter 5**, we will build the swarm layer that manages:

* Agent registration
* Agent lookup
* Handoff routing
* Shared conversation history
* Multi-agent execution
* Handoff logging
* Maximum swarm hops
* Final response collection

Chapter 4 is now the **core runtime layer** of your SDK: Chapter 0 defines the contracts, Chapters 1–3 define behavior/configuration/safety, and Chapter 4 actually executes everything. Chapter 5 can build directly on its `HANDOFF` result.
