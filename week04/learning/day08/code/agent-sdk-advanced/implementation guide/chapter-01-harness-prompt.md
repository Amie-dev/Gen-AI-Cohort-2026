
# Chapter 1 — System Prompt Engineering & Extended Pipeline Harness

## 1. Chapter Overview

In Chapter 0, we created the **type contracts** for our Advanced Agent SDK.

We defined concepts such as:

* `PipelineStep`
* `LLMStepResponse`
* `ITool`
* `HandoffPayload`
* `AgentStepOutcome`
* `GuardrailResult`

However, defining these types does not tell the LLM **how it should behave**.

The LLM needs explicit instructions.

This is where the **System Harness Prompt** comes in.

The system harness acts like a set of operating instructions for every agent in our SDK.

It tells the model:

> "You are an agent inside this framework. You must follow this execution pipeline and return structured JSON."

---

# 2. What Is a System Harness?

A **system prompt** is a set of high-priority instructions given to an AI model before it processes the user's request.

Our **System Harness Prompt** goes one step further.

It does not simply tell the model:

```text
"You are a helpful assistant."
```

Instead, it defines an **execution protocol**.

The model must decide:

```text
What should I do next?
```

and express that decision as structured JSON.

For example:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

Our application can then read this JSON and decide what to do.

---

# 3. Why Do We Need a Harness?

Without a harness, an LLM might respond like:

```text
I think I should use the weather tool to check the weather in Goa.
```

This is understandable to a human, but difficult for a program to process reliably.

Our application would have to interpret natural language.

Instead, we want:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

Now our program can easily understand:

```text
step = TOOL_REQUEST
function = fetchWeatherInfo
input = Goa
```

The architecture becomes:

```text
                 User
                  │
                  ▼
           ┌──────────────┐
           │      LLM     │
           │              │
           │ System       │
           │ Harness      │
           └──────┬───────┘
                  │
                  ▼
            Structured JSON
                  │
          ┌───────┼────────┐
          │       │        │
          ▼       ▼        ▼
        Tool    Handoff   Output
```

This makes the LLM's decision easier for our SDK to process.

---

# 4. Chapter Goal

In this chapter, we will:

1. Create `src/config.ts`
2. Define the `HARNESS_PROMPT`
3. Define the agent execution pipeline
4. Add the `HANDOFF` step
5. Define JSON output requirements
6. Understand each pipeline step
7. Test that the configuration compiles correctly

---

# 5. Expected Project Structure

After this chapter, our project will look like:

```text
agent-sdk-advanced/
│
├── package.json
├── tsconfig.json
│
└── src/
    ├── types.ts
    └── config.ts
```

Chapter 0 gave us:

```text
src/types.ts
```

Chapter 1 adds:

```text
src/config.ts
```

---

# 6. ReAct Pipeline

Our agent uses an extended **ReAct-style execution pipeline**.

ReAct generally means the model alternates between reasoning and taking actions.

Our SDK extends that idea with explicit agent handoffs.

The pipeline is:

```text
INITIAL
   ↓
THINK
   ↓
TOOL_REQUEST
   ↓
ANALYSE
   ↓
HANDOFF
   ↓
OUTPUT
```

However, the agent does not necessarily execute every step every time.

For example, a simple question might be:

```text
INITIAL
   ↓
THINK
   ↓
OUTPUT
```

A tool-based request might be:

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

A multi-agent request might be:

```text
INITIAL
   ↓
THINK
   ↓
HANDOFF
   ↓
Another Agent
```

So the pipeline represents the **possible states**, not a fixed sequence that must always be followed.

---

# 7. Extended Cognitive Pipeline

```text
+--------------------------------------------------------------------------------+
|                         EXTENDED COGNITIVE PIPELINE                            |
+--------------------------------------------------------------------------------+
|                                                                                |
|  INITIAL       → Understand the user's request                                |
|       ↓                                                                        |
|  THINK         → Decide what needs to be done                                  |
|       ↓                                                                        |
|  TOOL_REQUEST  → Ask the application to execute a registered tool              |
|       ↓                                                                        |
|  ANALYSE       → Evaluate tool results or intermediate information              |
|       ↓                                                                        |
|  HANDOFF       → Transfer the task to another specialized agent                |
|       ↓                                                                        |
|  OUTPUT        → Return the final answer                                       |
|                                                                                |
+--------------------------------------------------------------------------------+
```

Let's understand each step.

---

# 8. `INITIAL`

### Purpose

The `INITIAL` step represents the agent's initial understanding of the user's request.

For example:

```text
User:
"What is the weather in Goa?"
```

The agent might internally determine:

```text
The user wants weather information for Goa.
```

The corresponding pipeline state is:

```json
{
  "step": "INITIAL"
}
```

The important idea is that this step establishes the initial goal.

---

# 9. `THINK`

### Purpose

`THINK` represents the reasoning or planning stage.

The agent determines what needs to happen next.

For example:

```text
User:
"What is the weather in Goa?"
```

The agent might determine:

```text
I need weather information.
I should use the weather tool.
```

This eventually leads to:

```text
THINK
   ↓
TOOL_REQUEST
```

The `THINK` stage can be used for:

* Breaking a problem into smaller tasks
* Planning
* Calculations
* Deciding which tool is required
* Determining whether another agent is needed

---

# 10. `TOOL_REQUEST`

### Purpose

This step tells the SDK:

> "I need a registered tool to perform an action."

For example:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

Our application can read this response and find the corresponding tool.

The flow becomes:

```text
LLM
 ↓
TOOL_REQUEST
 ↓
Find registered tool
 ↓
Execute tool
 ↓
Return result to Agent
```

This connects directly to the `ITool` interface we created in Chapter 0.

---

# 11. `ANALYSE`

### Purpose

After a tool executes, the agent needs to understand the result.

For example:

```text
Tool:
"Goa: 30°C, Sunny"
```

The agent needs to determine:

```text
The tool returned valid weather information.
I can now answer the user.
```

Therefore:

```text
TOOL_REQUEST
      ↓
Tool executes
      ↓
Result
      ↓
ANALYSE
      ↓
OUTPUT
```

The analysis step can also be used to determine whether another action is necessary.

For example:

```text
ANALYSE
   ↓
Need another tool?
   ↓
TOOL_REQUEST
```

or:

```text
ANALYSE
   ↓
Need another agent?
   ↓
HANDOFF
```

---

# 12. `HANDOFF`

This is one of the most important additions to our Advanced Agent SDK.

A normal single-agent system may simply produce:

```text
OUTPUT
```

But our system contains multiple specialized agents.

For example:

```text
General Agent
      │
      ├── Weather Agent
      ├── Billing Agent
      └── Technical Agent
```

If the current agent receives a request outside its expertise, it can transfer the task.

For example:

```text
User:
"What is the weather in Goa?"

General Agent
      ↓
HANDOFF
      ↓
Weather Agent
```

The handoff response could be:

```json
{
  "step": "HANDOFF",
  "targetAgent": "WeatherAgent",
  "reason": "The request requires weather-specific information."
}
```

The swarm orchestrator will later use this information to select the next agent.

---

# 13. `OUTPUT`

This is the final step.

When the agent has enough information to answer the user, it returns:

```json
{
  "step": "OUTPUT",
  "text": "The current weather in Goa is sunny with 30°C."
}
```

The orchestrator can then return the `text` to the user.

The execution ends here.

---

# 14. Creating `src/config.ts`

Create the following file:

```text
agent-sdk-advanced/src/config.ts
```

This file will contain our system harness prompt.

---

# 15. Complete `src/config.ts`

```typescript
export const HARNESS_PROMPT = `

You are an expert AI agent operating inside an Agentic SDK.

You analyze user requests step-by-step using a structured ReAct pipeline with JSON responses:

Pipeline Steps: "INITIAL", "THINK", "TOOL_REQUEST", "ANALYSE", "HANDOFF", and "OUTPUT".

Pipeline Step Specifications:

- "INITIAL": State initial understanding of user intent.

- "THINK": Reason about sub-tasks, math, or strategy.

- "TOOL_REQUEST": Request execution of a registered tool.
  JSON Schema:
  {
    "step": "TOOL_REQUEST",
    "functionName": "<TOOL_NAME>",
    "input": "<INPUT_STRING>"
  }

- "ANALYSE": Reflect on tool execution results or interim steps.

- "HANDOFF": Transfer conversation to a specialized agent when query is outside your expertise.
  JSON Schema:
  {
    "step": "HANDOFF",
    "targetAgent": "<TARGET_AGENT_NAME>",
    "reason": "<REASON_FOR_TRANSFER>"
  }

- "OUTPUT": Final answer returned to the user.
  JSON Schema:
  {
    "step": "OUTPUT",
    "text": "<FINAL_ANSWER>"
  }

Rules:

1. Always output ONLY valid single JSON object per step.

2. Maintain strict JSON schema compliance.

3. Do not include markdown code block backticks inside raw response strings if possible.

`;
```

Now let's understand this file carefully.

---

# 16. Exporting `HARNESS_PROMPT`

The first important line is:

```typescript
export const HARNESS_PROMPT = `
...
`;
```

There are three important parts here.

### `export`

```typescript
export
```

Makes the constant available to other files.

For example, another file can later use:

```typescript
import { HARNESS_PROMPT } from "./config.js";
```

---

### `const`

```typescript
const
```

Creates a variable that cannot be reassigned.

We don't want different parts of the application accidentally replacing our system prompt.

---

### Template literal

The prompt is surrounded by:

```typescript
`
...
`
```

These are JavaScript/TypeScript **template literals**.

They are useful here because our prompt contains multiple lines.

Instead of:

```typescript
const prompt = "line one\nline two\nline three";
```

we can write:

```typescript
const prompt = `
line one
line two
line three
`;
```

This makes the prompt much easier to read and maintain.

---

# 17. Agent Identity Instruction

The first instruction is:

```text
You are an expert AI agent operating inside an Agentic SDK.
```

This establishes the role of the model.

We are not asking the model to behave like a completely unrestricted chatbot.

We are telling it:

> You are an agent operating inside a specific software framework.

That distinction is important.

The model must follow the framework's protocol.

---

# 18. Structured ReAct Instruction

Next:

```text
You analyze user requests step-by-step using a structured ReAct pipeline with JSON responses.
```

This establishes two important requirements.

### First

The model should process requests using our pipeline.

### Second

The model should communicate its decisions using JSON.

So instead of producing arbitrary text such as:

```text
I think I need the weather tool.
```

it should produce something machine-readable.

For example:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

---

# 19. Declaring the Pipeline Steps

The prompt explicitly lists:

```text
"INITIAL"
"THINK"
"TOOL_REQUEST"
"ANALYSE"
"HANDOFF"
"OUTPUT"
```

This is important because the LLM needs to know the **allowed state names**.

These names correspond directly to the TypeScript type from Chapter 0:

```typescript
export type PipelineStep =
  | "INITIAL"
  | "THINK"
  | "TOOL_REQUEST"
  | "ANALYSE"
  | "HANDOFF"
  | "OUTPUT";
```

So we have two layers enforcing the same contract:

```text
System Prompt
      +
TypeScript Type
      ↓
Pipeline Contract
```

The prompt tells the **LLM** what values to produce.

TypeScript tells the **application code** what values are allowed.

---

# 20. Initial Step Instruction

```text
"INITIAL": State initial understanding of user intent.
```

This tells the LLM what `INITIAL` means.

It should identify the user's basic goal.

For example:

```text
User:
"Find the weather in Goa."
```

The model understands:

```text
The user wants weather information for Goa.
```

---

# 21. Think Step Instruction

```text
"THINK": Reason about sub-tasks, math, or strategy.
```

This tells the model that `THINK` represents planning.

It can be useful for:

```text
Complex problems
Calculations
Multi-step tasks
Tool selection
Planning
Decision making
```

The important point is that the model is identifying what action should happen next.

---

# 22. Tool Request Instruction

The prompt defines:

```text
"TOOL_REQUEST": Request execution of a registered tool.
```

Then it provides a schema:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "<TOOL_NAME>",
  "input": "<INPUT_STRING>"
}
```

This is extremely important.

The model is not directly executing the tool.

Instead, it is **requesting that our application execute it**.

The architecture is:

```text
LLM
 │
 │ TOOL_REQUEST
 ▼
SDK
 │
 │ Find tool
 ▼
ITool.executor()
 │
 ▼
Tool Result
 │
 ▼
LLM
```

This separation is important for security and control.

---

# 23. Understanding the Tool Request Schema

Consider:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

### `step`

```json
"step": "TOOL_REQUEST"
```

Tells the SDK what the model wants to do.

### `functionName`

```json
"functionName": "fetchWeatherInfo"
```

Identifies the registered tool.

### `input`

```json
"input": "Goa"
```

Provides the input that should be passed to the tool.

The application can then conceptually do:

```typescript
const tool = tools.find(
  tool => tool.name === response.functionName
);

const result = await tool.executor(response.input);
```

This actual implementation will be built in later chapters.

---

# 24. Analyse Step Instruction

```text
"ANALYSE": Reflect on tool execution results or interim steps.
```

This tells the model:

> After receiving information from a tool or another intermediate operation, evaluate it before deciding what happens next.

For example:

```text
Tool Result:
"Goa: 30°C and sunny"
```

The agent analyses the result and decides:

```text
The result contains enough information.
I can produce the final response.
```

Then:

```text
ANALYSE
   ↓
OUTPUT
```

---

# 25. Handoff Step Instruction

The prompt defines:

```text
"HANDOFF": Transfer conversation to a specialized agent when query is outside your expertise.
```

This is what makes our system **multi-agent aware**.

Suppose we have:

```text
GeneralAgent
WeatherAgent
BillingAgent
TechnicalAgent
```

The `GeneralAgent` receives:

```text
"Can you check today's weather in Goa?"
```

Instead of trying to solve something outside its specialization, it can request:

```json
{
  "step": "HANDOFF",
  "targetAgent": "WeatherAgent",
  "reason": "The request requires weather-specific information."
}
```

The swarm orchestrator can then route the conversation to:

```text
WeatherAgent
```

---

# 26. Handoff Schema

The schema is:

```json
{
  "step": "HANDOFF",
  "targetAgent": "<TARGET_AGENT_NAME>",
  "reason": "<REASON_FOR_TRANSFER>"
}
```

There are three important fields.

### `step`

```json
"step": "HANDOFF"
```

Identifies the operation.

### `targetAgent`

```json
"targetAgent": "WeatherAgent"
```

Specifies which agent should receive the task.

### `reason`

```json
"reason": "The request requires weather-specific information."
```

Explains why the handoff is necessary.

This connects directly to our Chapter 0 type:

```typescript
interface HandoffPayload {
  targetAgent: string;
  reason: string;
  context?: string;
}
```

---

# 27. Output Step Instruction

The final step is:

```text
"OUTPUT": Final answer returned to the user.
```

The schema is:

```json
{
  "step": "OUTPUT",
  "text": "<FINAL_ANSWER>"
}
```

For example:

```json
{
  "step": "OUTPUT",
  "text": "The current weather in Goa is sunny with 30°C."
}
```

The SDK sees:

```text
step = OUTPUT
```

and knows that the agent has finished.

---

# 28. Rule 1 — Valid JSON Only

The first rule is:

```text
Always output ONLY valid single JSON object per step.
```

This is critical.

We don't want:

```text
Sure! Here is the result:

{
  "step": "OUTPUT",
  "text": "Hello"
}

I hope that helps!
```

because the SDK would have to extract the JSON from surrounding text.

Instead, we want:

```json
{
  "step": "OUTPUT",
  "text": "Hello"
}
```

Nothing else.

This makes parsing much easier.

---

# 29. Rule 2 — Strict Schema Compliance

The second rule is:

```text
Maintain strict JSON schema compliance.
```

The model should use the fields expected by our application.

For example, this is correct:

```json
{
  "step": "HANDOFF",
  "targetAgent": "WeatherAgent",
  "reason": "Weather request."
}
```

But this could cause problems:

```json
{
  "action": "handoff",
  "agent": "WeatherAgent"
}
```

Why?

Because our application expects:

```text
step
targetAgent
reason
```

not:

```text
action
agent
```

The prompt therefore establishes a contract between:

```text
LLM
 ↕
SDK
```

---

# 30. Rule 3 — Avoid Markdown Code Blocks

The third rule is:

```text
Do not include markdown code block backticks inside raw response strings if possible.
```

We want the model to return raw JSON.

Good:

```json
{
  "step": "OUTPUT",
  "text": "Hello"
}
```

Not:

````text
```json
{
  "step": "OUTPUT",
  "text": "Hello"
}
````

````

The second format contains Markdown formatting around the JSON.

That makes machine parsing more complicated.

---

# 31. Complete Pipeline Example

Let's see how all of this works together.

Suppose the user asks:

```text
"What is the weather in Goa?"
````

The agent may follow this process:

### Step 1 — Initial understanding

```json
{
  "step": "INITIAL"
}
```

### Step 2 — Decide what is needed

```json
{
  "step": "THINK"
}
```

### Step 3 — Request a tool

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

### Step 4 — SDK executes the tool

The SDK might receive:

```text
Goa: Sunny, 30°C
```

### Step 5 — Analyse result

```json
{
  "step": "ANALYSE"
}
```

### Step 6 — Final answer

```json
{
  "step": "OUTPUT",
  "text": "The current weather in Goa is sunny with 30°C."
}
```

---

# 32. Handoff Example

Now imagine a general-purpose agent receives a request that belongs to a specialized agent.

```text
User:
"My invoice has an incorrect amount."
```

The current agent may decide that this should be handled by a billing specialist.

It can return:

```json
{
  "step": "HANDOFF",
  "targetAgent": "BillingAgent",
  "reason": "The request concerns an invoice and requires billing expertise."
}
```

The swarm orchestrator will later use this information.

The flow becomes:

```text
User
 ↓
GeneralAgent
 ↓
HANDOFF
 ↓
Swarm Orchestrator
 ↓
BillingAgent
 ↓
OUTPUT
```

---

# 33. Output Example

When the agent has completed the task:

```json
{
  "step": "OUTPUT",
  "text": "Your invoice has been corrected."
}
```

The orchestrator can extract:

```typescript
response.text
```

and return it to the user.

---

# 34. Connection to Chapter 0

Chapter 0 defined:

```typescript
export type PipelineStep =
  | "INITIAL"
  | "THINK"
  | "TOOL_REQUEST"
  | "ANALYSE"
  | "HANDOFF"
  | "OUTPUT";
```

Chapter 1 tells the LLM how to use those values.

So:

```text
Chapter 0
TypeScript Contract
        │
        ▼
PipelineStep
        │
        │
Chapter 1
System Harness
        │
        ▼
LLM Instructions
```

Together they create a consistent protocol.

---

# 35. Prompt vs TypeScript Type

This distinction is important.

The TypeScript type:

```typescript
type PipelineStep =
  | "INITIAL"
  | "THINK"
  | "TOOL_REQUEST"
  | "ANALYSE"
  | "HANDOFF"
  | "OUTPUT";
```

protects **our application code**.

The system prompt:

```text
Pipeline Steps:
"INITIAL",
"THINK",
"TOOL_REQUEST",
"ANALYSE",
"HANDOFF",
"OUTPUT"
```

guides **the AI model**.

So we have:

```text
                 Pipeline Contract
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       TypeScript             LLM Prompt
       Validation             Instructions
             │                   │
             ▼                   ▼
          Program             Model
```

Both sides understand the same protocol.

---

# 36. Testing the Harness

We can verify that `config.ts` compiles and exports the prompt correctly.

Run:

```bash
npx tsx -e "import { HARNESS_PROMPT } from './src/config.js'; console.log('Harness Prompt Length:', HARNESS_PROMPT.length);"
```

This command performs three things:

```text
Import HARNESS_PROMPT
        ↓
Read its length
        ↓
Print the result
```

---

# 37. Understanding the Test Command

Let's break it down.

### `npx`

```bash
npx
```

Runs a package executable without requiring us to manually locate it.

---

### `tsx`

```bash
tsx
```

Allows us to execute TypeScript directly.

Instead of:

```text
TypeScript
   ↓
Compile
   ↓
JavaScript
   ↓
Run
```

`tsx` provides a convenient way to execute TypeScript code during development.

---

### `-e`

```bash
-e
```

Means:

> Execute the following code directly.

---

### Import

```typescript
import { HARNESS_PROMPT } from './src/config.js';
```

Imports the constant we created.

Notice that with NodeNext/ESM, the import uses:

```text
.js
```

even though the source file is:

```text
config.ts
```

This is an important NodeNext/ESM convention.

---

### `.length`

```typescript
HARNESS_PROMPT.length
```

Returns the number of characters in the string.

So:

```typescript
console.log(
  'Harness Prompt Length:',
  HARNESS_PROMPT.length
);
```

prints the size of our prompt.

---

# 38. Expected Output

You may see:

```text
Harness Prompt Length: 1161
```

However, **do not treat `1161` as a universal required value**.

The exact number depends on the exact whitespace, line breaks, indentation, and wording inside your prompt.

For example, adding:

```text
one extra sentence
```

will change the length.

The important thing is that:

```text
HARNESS_PROMPT
```

can be imported successfully and your TypeScript code compiles/runs without errors.

---

# 39. Common Mistakes

## Mistake 1 — Returning Markdown Around JSON

Avoid:

````text
```json
{
  "step": "OUTPUT",
  "text": "Hello"
}
````

````

Prefer raw JSON:

```json
{
  "step": "OUTPUT",
  "text": "Hello"
}
````

---

## Mistake 2 — Using an Unsupported Step

Avoid:

```json
{
  "step": "FINISH"
}
```

because `FINISH` is not part of our pipeline.

Our allowed values are:

```text
INITIAL
THINK
TOOL_REQUEST
ANALYSE
HANDOFF
OUTPUT
```

---

## Mistake 3 — Wrong Tool Property Names

Our application expects:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "calculator",
  "input": "10 + 20"
}
```

Not:

```json
{
  "step": "TOOL_REQUEST",
  "tool": "calculator",
  "query": "10 + 20"
}
```

The names must match the protocol expected by our SDK.

---

## Mistake 4 — Treating Handoff as Final Output

A handoff means:

```text
Current Agent
      ↓
Another Agent
```

It does **not** mean:

```text
Current Agent
      ↓
User
```

`OUTPUT` is the final response.

`HANDOFF` means another agent should continue.

---

# 40. Complete Mental Model

The most important concept from this chapter is this:

```text
                    USER
                      │
                      ▼
                ┌───────────┐
                │    LLM    │
                └─────┬─────┘
                      │
                      ▼
               Harness Prompt
                      │
                      ▼
               Choose a Step
                      │
        ┌─────────────┼──────────────┐
        │             │              │
        ▼             ▼              ▼
      TOOL          HANDOFF        OUTPUT
        │             │              │
        ▼             ▼              ▼
    Execute        Another         Final
     Tool           Agent          Answer
        │             │
        └──────┬──────┘
               │
               ▼
             ANALYSE
               │
               ▼
             OUTPUT
```

The **Harness Prompt** is essentially the protocol that tells the LLM how to communicate with the SDK.

---

# 41. Why This Architecture Is Useful

A structured pipeline gives us several advantages.

### Predictable behavior

The model has a limited set of actions.

### Easier parsing

The SDK expects JSON instead of arbitrary natural language.

### Tool integration

The model can request tools using a predictable structure.

### Multi-agent routing

The model can explicitly request a handoff.

### Debugging

Each execution step can be logged:

```text
INITIAL
THINK
TOOL_REQUEST
ANALYSE
OUTPUT
```

### Extensibility

Later, we can add additional pipeline states if the architecture requires them.

---

# 42. Chapter Summary

In this chapter, we created:

```text
src/config.ts
```

and exported:

```typescript
HARNESS_PROMPT
```

The harness defines the behavior expected from agents inside our SDK.

We introduced six pipeline states:

```text
INITIAL
THINK
TOOL_REQUEST
ANALYSE
HANDOFF
OUTPUT
```

We also established a strict JSON communication protocol.

The key idea is:

```text
Natural Language LLM
        ↓
System Harness
        ↓
Structured Decision
        ↓
SDK Executes Decision
```

For example:

```text
LLM
 ↓
{
  "step": "TOOL_REQUEST",
  "functionName": "calculator",
  "input": "10 + 20"
}
 ↓
SDK
 ↓
Calculator Tool
 ↓
Result
 ↓
LLM
 ↓
{
  "step": "OUTPUT",
  "text": "The answer is 30."
}
```

For multi-agent systems:

```text
Agent A
   ↓
{
  "step": "HANDOFF",
  "targetAgent": "BillingAgent",
  "reason": "Billing expertise is required."
}
   ↓
Swarm Orchestrator
   ↓
BillingAgent
```

---

# 43. Chapter 1 Checklist

Before moving forward, make sure:

* [ ] `src/config.ts` exists
* [ ] `HARNESS_PROMPT` is exported
* [ ] The prompt defines all six pipeline steps
* [ ] `TOOL_REQUEST` has a clear JSON schema
* [ ] `HANDOFF` has a clear JSON schema
* [ ] `OUTPUT` has a clear JSON schema
* [ ] The prompt requires valid JSON
* [ ] The prompt discourages Markdown-wrapped JSON
* [ ] The prompt and `PipelineStep` type use the same step names
* [ ] `config.ts` can be imported successfully
* [ ] The test command runs without errors

---

# 44. What Comes Next?

The previous chapter created the **contracts**.

This chapter created the **behavioral protocol**.

Now we need something that can actually construct an agent.

That is the responsibility of the next chapter:

## Chapter 2 — Fluent `AgentBuilder`

We will build a builder API that allows developers to configure an agent using a fluent interface.

Conceptually:

```typescript
const agent = new AgentBuilder()
  .name("GeneralAgent")
  .instructions("You are a helpful assistant.")
  .model("...")
  .addTool(...)
  .addInputGuardrail(...)
  .addOutputGuardrail(...)
  .build();
```

The builder will bring together the pieces we created in Chapters 0 and 1:

```text
              AgentBuilder
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
    Types       Harness      Tools
       │           │           │
       └───────────┼───────────┘
                   ▼
                Agent
```

That will be the first chapter where our SDK starts behaving like an actual reusable framework.

