

# Chapter 1 — System Prompt Engineering & Pipeline Harness

## 1. Chapter Overview

In Chapter 0, we prepared our **Node.js + TypeScript + NodeNext ESM** environment.

Now we can start building the actual foundation of our Agent SDK Framework.

The first component we need is the **System Harness Prompt**.

Our application needs a consistent way to tell the model:

* What role it should play
* What steps it can take
* When it should request a tool
* How it should represent its current state
* When the task is complete
* What structured format it must return

We will define these rules inside:

```text
src/app/config.ts
```

and export:

```ts
export const HARNESS_PROMPT = `...`;
```

---

# 2. What Is a System Prompt?

A **system prompt** is a set of instructions that establishes how an AI model should behave during an interaction.

For example, a simple system prompt could be:

```text
You are a helpful programming assistant.
Always explain programming concepts clearly.
```

The model then receives the user's request together with these instructions.

For an agent, however, we need more than just:

> "Be helpful."

An agent may need to:

```text
Understand request
      ↓
Plan a solution
      ↓
Decide whether a tool is required
      ↓
Call the tool
      ↓
Process the result
      ↓
Decide whether more work is needed
      ↓
Return final answer
```

Therefore, our system prompt becomes a **behavioral contract** between the model and our application.

---

# 3. What Is a Harness Prompt?

The word **harness** refers to the surrounding system that controls how the agent operates.

Think of it like this:

```text
                 AGENT SYSTEM
        ┌───────────────────────────┐
        │                           │
        │       Harness Prompt      │
        │             │             │
        │             ▼             │
        │          LLM Model        │
        │             │             │
        │             ▼             │
        │       Structured Step     │
        │             │             │
        │       ┌─────┴─────┐       │
        │       ▼           ▼       │
        │     Tool        Output    │
        │                           │
        └───────────────────────────┘
```

The harness is responsible for making the model's output useful to our application.

Instead of receiving arbitrary text such as:

```text
I think we should probably call the weather API...
```

we want the model to return structured information such as:

```json
{
  "step": "TOOL_REQUEST",
  "text": "Weather information is required.",
  "functionName": "getWeatherData",
  "input": "Goa"
}
```

Our application can then understand:

> The model wants me to call `getWeatherData` with `Goa`.

This is the core idea behind our pipeline.

---

# 4. Our Agent Pipeline

We will define five major steps:

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

The agent may move through these states multiple times.

For example:

```text
INITIAL
   ↓
THINK
   ↓
ANALYSE
   ↓
THINK
   ↓
TOOL_REQUEST
   ↓
ANALYSE
   ↓
THINK
   ↓
OUTPUT
```

Notice that the agent does **not** necessarily execute every state exactly once.

The important idea is that the model returns **one structured step at a time**, and the application decides what happens next.

---

# 5. Understanding Each Pipeline Step

## 5.1 `INITIAL`

`INITIAL` represents the beginning of the task.

The agent identifies what the user is asking for.

For example, if the user says:

```text
What is the weather in Goa?
```

the initial state might represent:

```json
{
  "step": "INITIAL",
  "text": "The user wants weather information for Goa."
}
```

The purpose of this step is to establish the task.

---

# 6. `THINK`

`THINK` represents the agent's next planning or decision step.

For example:

```json
{
  "step": "THINK",
  "text": "I need weather information, so I should determine whether an available weather tool can provide it."
}
```

The application can use this state to track the agent's progress.

### Important distinction

This does **not** mean that we should expose private chain-of-thought from the model.

Instead, the agent should provide a **short, useful action explanation or decision summary**.

For example:

```text
I need weather data, so I will use the weather tool.
```

is preferable to requiring a long hidden reasoning trace.

---

# 7. `TOOL_REQUEST`

Sometimes the model cannot complete a task using its existing knowledge.

It may need information from an external system.

For example:

```text
User
 │
 │ "What is the weather in Goa?"
 ▼
Agent
 │
 │ Needs current weather
 ▼
Weather Tool
```

In that situation, the model returns:

```json
{
  "step": "TOOL_REQUEST",
  "text": "I need current weather information for Goa.",
  "functionName": "getWeatherData",
  "input": "Goa"
}
```

Our application can read:

```text
functionName
```

and:

```text
input
```

and then execute the requested tool.

---

# 8. Tool Execution Flow

The complete process looks like this:

```text
User
 │
 ▼
Agent
 │
 ▼
TOOL_REQUEST
 │
 │ functionName = getWeatherData
 │ input = Goa
 ▼
Application
 │
 ▼
getWeatherData("Goa")
 │
 ▼
Tool Result
 │
 ▼
Agent
 │
 ▼
ANALYSE
```

The important thing is that **the model does not directly execute the function**.

The model requests the tool.

Our application executes it.

```text
LLM
 │
 │ "Please call this tool"
 ▼
Agent Runtime
 │
 │ Actually executes function
 ▼
Tool
```

This separation is extremely important when building an agent framework.

---

# 9. `ANALYSE`

After a tool returns a result, the agent needs to evaluate it.

For example, suppose the weather tool returns:

```text
Goa: Sunny, 30°C
```

The agent can receive that result and return:

```json
{
  "step": "ANALYSE",
  "text": "The weather tool returned current weather information for Goa."
}
```

The agent can then determine whether the task is complete.

If it is complete:

```text
ANALYSE
   ↓
OUTPUT
```

If more work is required:

```text
ANALYSE
   ↓
THINK
   ↓
...
```

---

# 10. `OUTPUT`

`OUTPUT` represents the completion of the task.

For example:

```json
{
  "step": "OUTPUT",
  "text": "The weather in Goa is currently sunny and around 30°C."
}
```

When the application receives:

```text
step = OUTPUT
```

the agent loop can stop.

Conceptually:

```text
while (agent is running) {

    get model response

    if step === "TOOL_REQUEST":
        execute tool

    if step === "OUTPUT":
        stop agent

}
```

We will implement the actual execution loop in a later chapter.

---

# 11. Complete Pipeline Example

Let's visualize the weather example.

### Step 1 — User Request

```text
User:

What is the weather in Goa?
```

### Step 2 — Initial State

```json
{
  "step": "INITIAL",
  "text": "The user wants current weather information for Goa."
}
```

### Step 3 — Planning

```json
{
  "step": "THINK",
  "text": "I need current weather data, so I should use the available weather tool."
}
```

### Step 4 — Tool Request

```json
{
  "step": "TOOL_REQUEST",
  "text": "I will request the weather tool for Goa.",
  "functionName": "getWeatherData",
  "input": "Goa"
}
```

### Step 5 — Application Executes Tool

Our application executes:

```ts
getWeatherData("Goa");
```

The tool returns:

```text
Goa is sunny and 30°C.
```

### Step 6 — Analyse Result

```json
{
  "step": "ANALYSE",
  "text": "The tool returned the weather information successfully."
}
```

### Step 7 — Final Output

```json
{
  "step": "OUTPUT",
  "text": "The weather in Goa is sunny and around 30°C."
}
```

The application sees:

```text
OUTPUT
```

and terminates the agent loop.

---

# 12. Why Structured Output?

Without structured output, a model might return:

```text
I think we should call the weather function with Goa.
```

Our application would have to somehow understand:

* Which step is this?
* Is the model requesting a tool?
* Which tool?
* What arguments?
* Is the task finished?

That becomes unreliable.

Instead, we define a predictable structure:

```json
{
  "step": "TOOL_REQUEST",
  "text": "I need weather information.",
  "functionName": "getWeatherData",
  "input": "Goa"
}
```

Now our application can reliably inspect:

```ts
response.step
```

and decide what to do.

This is one of the most important ideas in our framework:

> **The LLM produces structured decisions, while the application controls execution.**

---

# 13. The Output Schema

Our agent will use the following structure:

```json
{
  "step": "INITIAL | THINK | TOOL_REQUEST | ANALYSE | OUTPUT",
  "text": "Description of the current step",
  "functionName": "Tool name",
  "input": "Tool input"
}
```

Let's understand each property.

---

## `step`

```json
"step": "THINK"
```

This identifies the current stage of the pipeline.

Possible values are:

```text
INITIAL
THINK
TOOL_REQUEST
ANALYSE
OUTPUT
```

The application can use this value to decide what happens next.

---

## `text`

```json
"text": "I need weather information for Goa."
```

This contains a short explanation of the current action or decision.

It is useful for:

* Logging
* Debugging
* Observability
* Understanding the agent's state

It should be concise rather than a request for unrestricted private reasoning.

---

## `functionName`

```json
"functionName": "getWeatherData"
```

This identifies the tool that the runtime should execute.

This field is primarily relevant when:

```text
step = TOOL_REQUEST
```

For example:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "getWeatherData",
  "input": "Goa"
}
```

---

## `input`

```json
"input": "Goa"
```

This contains the input that will be passed to the requested tool.

For example:

```ts
getWeatherData("Goa");
```

---

# 14. Pipeline State Diagram

The complete architecture can be represented as:

```text
                  ┌──────────────┐
                  │    USER      │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   INITIAL    │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    THINK     │
                  └──────┬───────┘
                         │
                  ┌──────┴───────┐
                  │              │
                  ▼              ▼
           ┌─────────────┐  ┌─────────────┐
           │ TOOL_REQUEST│  │   ANALYSE   │
           └──────┬──────┘  └──────┬──────┘
                  │                │
                  ▼                │
             Execute Tool          │
                  │                │
                  ▼                │
              Tool Result ─────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    THINK     │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   ANALYSE    │
                  └──────┬───────┘
                         │
                    Complete?
                    /       \
                  No         Yes
                  │           │
                  ▼           ▼
                THINK       OUTPUT
                              │
                              ▼
                            STOP
```

This diagram represents the **control flow**, not a requirement that every task follow exactly the same path.

---

# 15. Few-Shot Prompting

We also provide examples inside our system prompt.

This technique is called **few-shot prompting**.

Instead of only telling the model:

```text
Use these five steps.
```

we also show it examples:

```text
User: What is the weather in Goa?

Expected:

INITIAL
THINK
TOOL_REQUEST
ANALYSE
OUTPUT
```

Examples help the model understand the expected structure and behavior.

Think of it as:

```text
Instructions
     +
Examples
     ↓
Better understanding of expected output
```

---

# 16. Example: Mathematical Problem

Consider:

```text
What is 2 + 2 - 5 * 10 / 3?
```

The mathematical order of operations is:

```text
2 + 2 - 5 × 10 / 3
          ↓
2 + 2 - 50 / 3
          ↓
2 + 2 - 16.6667
          ↓
4 - 16.6667
          ↓
-12.6667
```

Our structured pipeline could represent the process as:

```json
{
  "step": "INITIAL",
  "text": "The user wants the value of a mathematical expression."
}
```

Then:

```json
{
  "step": "THINK",
  "text": "I will evaluate multiplication and division before addition and subtraction."
}
```

Then:

```json
{
  "step": "ANALYSE",
  "text": "The multiplication gives 5 × 10 = 50, so the expression becomes 2 + 2 - 50 / 3."
}
```

The agent can continue until:

```json
{
  "step": "OUTPUT",
  "text": "The final result is approximately -12.6667."
}
```

The important point is that the model is producing **structured progress states**, not arbitrary prose.

---

# 17. Implementing `config.ts`

Now we can create:

```text
src/app/config.ts
```

The file will export our harness prompt.

```ts
export const HARNESS_PROMPT = `
You are an expert AI assistant operating inside an agent framework.

Your task is to understand the user's request and produce exactly one
structured pipeline step at a time.

The available pipeline steps are:

1. INITIAL
2. THINK
3. TOOL_REQUEST
4. ANALYSE
5. OUTPUT

Pipeline rules:

- INITIAL identifies the user's goal.
- THINK represents the next planning or decision step.
- TOOL_REQUEST requests execution of an available tool.
- ANALYSE evaluates information received from a tool or previous step.
- OUTPUT represents the final answer and terminates the task.

Always return exactly one step at a time.

Always return valid JSON.

When requesting a tool, use:

{
  "step": "TOOL_REQUEST",
  "text": "Brief explanation of why the tool is required.",
  "functionName": "nameOfFunction",
  "input": "tool input"
}

For non-tool steps, functionName and input should be omitted.

Example:

User:
What is the weather in Goa?

Response:

{
  "step": "INITIAL",
  "text": "The user wants current weather information for Goa."
}

Then:

{
  "step": "THINK",
  "text": "I need current weather information, so I should use the available weather tool."
}

Then:

{
  "step": "TOOL_REQUEST",
  "text": "I will request the weather tool for Goa.",
  "functionName": "getWeatherData",
  "input": "Goa"
}

After the tool returns its result, analyse it and either continue
with another step or produce the final output.

When the task is complete, return:

{
  "step": "OUTPUT",
  "text": "The final answer."
}
`;
```

---

# 18. Why Use a Template Literal?

Notice that we use:

```ts
export const HARNESS_PROMPT = `
...
`;
```

The backticks:

```text
`
```

create a JavaScript/TypeScript **template literal**.

This allows us to write a large multi-line string without manually adding:

```text
\n
```

to every line.

For example:

```ts
const message = `
Hello.

This is a
multi-line message.
`;
```

This is ideal for system prompts because prompts can contain many lines of instructions and examples.

---

# 19. Why Export the Prompt?

We use:

```ts
export const HARNESS_PROMPT = `...`;
```

The `export` keyword allows another file to import it.

For example, later our agent code can use:

```ts
import { HARNESS_PROMPT } from "./config.js";
```

Then:

```text
config.ts
    │
    │ exports HARNESS_PROMPT
    ▼
agent.ts
    │
    │ imports HARNESS_PROMPT
    ▼
OpenAI request
```

This keeps configuration separate from the agent implementation.

---

# 20. Improving the Original Output Rules

The original prompt says:

```text
Always maintain the sequence of pipeline.
```

This can be interpreted too strictly.

For example, it may suggest that every request must always execute:

```text
INITIAL
→ THINK
→ TOOL_REQUEST
→ ANALYSE
→ OUTPUT
```

But not every task requires a tool.

For example:

```text
What is 2 + 2?
```

does not necessarily require:

```text
TOOL_REQUEST
```

A better interpretation is:

> Follow the pipeline model and select the appropriate next step based on the current state of the task.

Therefore, the runtime can support flows such as:

```text
INITIAL
→ THINK
→ OUTPUT
```

or:

```text
INITIAL
→ THINK
→ TOOL_REQUEST
→ ANALYSE
→ OUTPUT
```

or:

```text
INITIAL
→ THINK
→ ANALYSE
→ THINK
→ TOOL_REQUEST
→ ANALYSE
→ OUTPUT
```

This makes the framework more flexible.

---

# 21. Why "One Step at a Time"?

Our prompt tells the model:

```text
Always return exactly one step at a time.
```

This is important.

We don't want the model to return an entire imaginary execution sequence in one response:

```text
INITIAL
THINK
TOOL_REQUEST
ANALYSE
OUTPUT
```

Instead, we want:

```text
Model
  ↓
ONE STEP
  ↓
Application
  ↓
Execute / process
  ↓
Model
  ↓
NEXT STEP
```

This creates an **agent loop**.

Conceptually:

```text
             ┌───────────────┐
             │     Model     │
             └───────┬───────┘
                     │
                     ▼
               Structured Step
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
         Tool Request     Output
              │             │
              ▼             ▼
         Execute Tool      STOP
              │
              ▼
          Tool Result
              │
              ▼
             Model
              │
              └───────► next step
```

This is the foundation for the execution loop we will build later.

---

# 22. JSON vs JavaScript Object

The prompt requires **JSON**, not a JavaScript object.

Valid JSON:

```json
{
  "step": "THINK",
  "text": "I need to determine the next action."
}
```

Notice:

```text
"step"
"text"
```

use double quotes.

This is valid JSON.

JavaScript can also represent the same data as:

```ts
const result = {
  step: "THINK",
  text: "I need to determine the next action."
};
```

But technically, that is a JavaScript object, not JSON text.

This distinction becomes important when communicating with an LLM API.

---

# 23. Recommended Output Structure

Our logical schema is:

```text
AgentStep
│
├── step
│
├── text
│
├── functionName  (only for tool requests)
│
└── input         (only for tool requests)
```

Conceptually:

```ts
type AgentStep = {
  step:
    | "INITIAL"
    | "THINK"
    | "TOOL_REQUEST"
    | "ANALYSE"
    | "OUTPUT";

  text: string;

  functionName?: string;

  input?: string;
};
```

We will formally define this interface in **Chapter 2**.

---

# 24. Why `functionName` and `input` Should Be Optional

Not every step needs a tool.

For example:

```json
{
  "step": "THINK",
  "text": "I can answer this question directly."
}
```

There is no reason to include:

```json
"functionName": ""
```

or:

```json
"input": ""
```

Instead, those properties are relevant when:

```text
step = TOOL_REQUEST
```

For example:

```json
{
  "step": "TOOL_REQUEST",
  "text": "I need weather data.",
  "functionName": "getWeatherData",
  "input": "Goa"
}
```

This produces a cleaner data model.

---

# 25. Verification

After creating:

```text
src/app/config.ts
```

we should verify that TypeScript can compile it.

Run:

```bash
npx tsc --noEmit
```

If there are no errors, our prompt module is syntactically valid.

---

# 26. Test the Export

Because `config.ts` is an ESM module, we can import it using `tsx`.

Run:

```bash
npx tsx -e "import { HARNESS_PROMPT } from './src/app/config.js'; console.log('Prompt length:', HARNESS_PROMPT.length);"
```

If everything works, you should see something similar to:

```text
Prompt length: 2500
```

The exact number is not important.

It will change whenever we modify the prompt.

What matters is that:

```text
HARNESS_PROMPT
```

was successfully imported.

---

# 27. What Are We Actually Testing?

This command:

```bash
npx tsx -e "import { HARNESS_PROMPT } from './src/app/config.js'; console.log(HARNESS_PROMPT.length);"
```

tests several things at once:

```text
config.ts exists
      ↓
TypeScript can parse it
      ↓
ESM import works
      ↓
HARNESS_PROMPT is exported
      ↓
tsx can execute the module
      ↓
Prompt is available at runtime
```

This is a small but useful module-level test.

---

# 28. Common Mistakes

## Mistake 1 — Using CommonJS

Avoid mixing:

```js
require(...)
```

with our ESM configuration.

Our project uses:

```ts
import ...
```

and:

```ts
export ...
```

---

## Mistake 2 — Forgetting `.js`

With NodeNext ESM, use:

```ts
import { HARNESS_PROMPT } from "./config.js";
```

not:

```ts
import { HARNESS_PROMPT } from "./config";
```

---

## Mistake 3 — Returning Invalid JSON

This is not valid JSON:

```text
{
  step: "THINK",
  text: "Planning"
}
```

The property names need double quotes:

```json
{
  "step": "THINK",
  "text": "Planning"
}
```

---

## Mistake 4 — Returning Multiple Steps

Avoid returning:

```json
[
  {
    "step": "THINK"
  },
  {
    "step": "TOOL_REQUEST"
  },
  {
    "step": "OUTPUT"
  }
]
```

Our framework expects **one step at a time**.

---

## Mistake 5 — Treating the Model as the Tool Executor

The model should request:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "getWeatherData",
  "input": "Goa"
}
```

The application should execute:

```ts
getWeatherData("Goa");
```

This separation gives the runtime control over tool execution.

---

# 29. The Architecture We Have Built So Far

After Chapter 1, the architecture looks like:

```text
                   USER
                     │
                     ▼
             ┌───────────────┐
             │ Agent Runtime │
             └───────┬───────┘
                     │
                     ▼
              Harness Prompt
                     │
                     ▼
                OpenAI Model
                     │
                     ▼
              Structured JSON
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
        TOOL_REQUEST      OUTPUT
              │             │
              ▼             ▼
        Execute Tool        STOP
              │
              ▼
          Tool Result
              │
              ▼
            Model
```

The important boundary is:

```text
              MODEL
                │
       decides what should happen
                │
                ▼
        ─────────────────
          AGENT RUNTIME
        ─────────────────
                │
        controls execution
                │
                ▼
              TOOLS
```

The model **decides**.

The runtime **executes**.

---

# 30. Chapter Summary

In this chapter, we created the first major component of our Agent SDK Framework:

```text
HARNESS_PROMPT
```

We learned that:

### System Prompt

Defines the model's role and behavior.

### Harness Prompt

Adds rules that allow the model to operate inside our agent runtime.

### Pipeline

Our framework uses:

```text
INITIAL
→ THINK
→ TOOL_REQUEST
→ ANALYSE
→ OUTPUT
```

### Structured Output

The model returns predictable JSON instead of arbitrary text.

### Tool Requests

The model requests tools, while our application executes them.

### One Step at a Time

The model returns one structured step, allowing the runtime to control the next iteration.

### Few-Shot Prompting

Examples demonstrate the expected behavior to the model.

### `config.ts`

Stores and exports:

```ts
export const HARNESS_PROMPT = `...`;
```

---

# 31. Final Checklist

Before moving to Chapter 2:

* [ ] `src/app/config.ts` exists
* [ ] `HARNESS_PROMPT` is exported
* [ ] Pipeline states are defined
* [ ] Tool-request format is documented
* [ ] JSON output format is documented
* [ ] Few-shot examples are included
* [ ] `.js` is used for local ESM imports
* [ ] `npx tsc --noEmit` succeeds
* [ ] `HARNESS_PROMPT` can be imported with `tsx`
* [ ] Tool execution is understood as a runtime responsibility

---

# 32. What's Next?

Our model now has a **behavioral contract**.

But we still haven't created the TypeScript structures that represent an agent step.

In **Chapter 2**, we will build those structures.

We will define:

```text
AgentStep
AgentConfig
Tool
Agent
AgentBuilder
```

and start turning our prompt-based design into an actual **TypeScript Agent Framework**.
