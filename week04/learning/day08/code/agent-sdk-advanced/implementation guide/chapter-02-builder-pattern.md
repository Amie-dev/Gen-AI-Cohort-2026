

# Chapter 2 — Fluent Agent Builder & Configuration

## 1. Chapter Goal

In the previous chapters, we prepared the foundation of our Agent SDK:

* **Chapter 0:** Created the project and defined shared TypeScript types.
* **Chapter 1:** Created the system prompt that controls how an agent behaves internally.

Now we need a convenient way to **create and configure an agent**.

An advanced agent may have many configuration options:

* Agent name
* System instructions
* LLM model
* Tools
* Input guardrails
* Output guardrails
* Interceptors/loggers
* Maximum execution loops
* API key

If we put all of these into a huge constructor, creating an agent becomes difficult to read.

For example, this would quickly become messy:

```typescript
const agent = new Agent(
  "DevOpsAgent",
  "You execute shell operations safely.",
  [cliAccessTool],
  [securityGuardrail],
  [piiRedactionGuardrail],
  [consoleLogger],
  "gpt-4o",
  30,
  process.env.OPENAI_API_KEY
);
```

Instead, we want something that reads almost like a configuration document:

```typescript
const agent = Agent.builder("DevOpsAgent")
  .setInstructions("You execute shell operations safely.")
  .tool(cliAccessTool)
  .addInputGuardrail(securityGuardrail)
  .addOutputGuardrail(piiRedactionGuardrail)
  .attachInterceptor(consoleLoggerInterceptor)
  .build();
```

This is called the **Fluent Builder Pattern**.

---

# 2. What Is the Builder Pattern?

The Builder Pattern is a design pattern used when an object has many configuration options.

Instead of constructing everything at once, we create the object step-by-step.

Think about ordering a customized burger:

```text
Start
  ↓
Choose size
  ↓
Choose bread
  ↓
Add cheese
  ↓
Add vegetables
  ↓
Add sauce
  ↓
Build
  ↓
Final Burger
```

Our agent builder works similarly:

```text
AgentBuilder
     │
     ├── name
     ├── instructions
     ├── model
     ├── tools
     ├── input guardrails
     ├── output guardrails
     ├── interceptors
     └── max loop
            │
            ▼
          build()
            │
            ▼
          Agent
```

The important idea is:

> **The builder collects configuration. `build()` creates the final Agent.**

---

# 3. Fluent API

The word **fluent** means that methods can be chained together.

For example:

```typescript
builder
  .setName("DevOpsAgent")
  .setInstructions("You are a DevOps assistant.")
  .model("gpt-4o")
  .setMaxLoop(20);
```

How does this work?

Because every method returns:

```typescript
this
```

For example:

```typescript
public setName(name: string): this {
  this.name = name;

  return this;
}
```

The `return this` allows the next method to immediately run on the same builder.

Conceptually:

```text
builder.setName(...)
       ↓
returns builder
       ↓
builder.setInstructions(...)
       ↓
returns builder
       ↓
builder.model(...)
       ↓
returns builder
```

That is the core idea behind the fluent API.

---

# 4. File Structure

We will create:

```text
agent-sdk-advanced/
├── package.json
├── tsconfig.json
└── src/
    ├── types.ts
    ├── config.ts
    ├── builder.ts
    └── agent.ts
```

For this chapter, the main file is:

```text
src/builder.ts
```

---

# 5. Importing Dependencies

At the top of `builder.ts`:

```typescript
import { Agent } from "./agent.js";

import {
  IInputGuardrail,
  IOutputGuardrail,
  ITool,
  Interceptor
} from "./types.js";
```

Let's understand these imports.

## `Agent`

```typescript
import { Agent } from "./agent.js";
```

The builder eventually needs to create an actual `Agent`.

We will do this later:

```typescript
return new Agent(this);
```

So the relationship is:

```text
AgentBuilder
     │
     │ build()
     ▼
  new Agent(...)
     │
     ▼
   Agent
```

---

## Types

We also import the interfaces defined in Chapter 0:

```typescript
IInputGuardrail
IOutputGuardrail
ITool
Interceptor
```

These provide type safety.

For example:

```typescript
public toolList: ITool[] = [];
```

means:

> `toolList` can contain only objects that follow the `ITool` structure.

Similarly:

```typescript
public inputGuardrails: IInputGuardrail[] = [];
```

means:

> This array can contain only input guardrails.

---

# 6. Creating the `AgentBuilder` Class

Now we create the builder:

```typescript
export class AgentBuilder {
```

This class will temporarily hold all the configuration needed to create an agent.

Think of it as a **configuration container**.

---

# 7. Agent Name

```typescript
public name: string = "DefaultAgent";
```

Every builder starts with a default name:

```text
DefaultAgent
```

The developer can later change it:

```typescript
builder.setName("DevOpsAgent");
```

After that:

```typescript
builder.name
```

becomes:

```text
DevOpsAgent
```

---

# 8. Agent Instructions

```typescript
public instructions: string =
  "You are a helpful AI assistant.";
```

This stores the system instructions for the agent.

For example:

```typescript
builder.setInstructions(
  "You are a DevOps assistant. Execute shell operations safely."
);
```

The builder now contains:

```text
instructions:
"You are a DevOps assistant. Execute shell operations safely."
```

Later, the `Agent` class can use this value when constructing the LLM request.

---

# 9. Tool Collection

```typescript
public toolList: ITool[] = [];
```

An agent can have multiple tools.

For example:

```text
DevOpsAgent
│
├── shellTool
├── dockerTool
├── kubernetesTool
└── logTool
```

Therefore, we store tools inside an array:

```typescript
ITool[]
```

Initially it is empty:

```typescript
[];
```

Tools can be added using:

```typescript
builder.tool(shellTool);
builder.tool(dockerTool);
```

---

# 10. Input Guardrails

```typescript
public inputGuardrails: IInputGuardrail[] = [];
```

Input guardrails validate user input **before the agent processes it**.

For example:

```text
User Input
    │
    ▼
Input Guardrails
    │
    ├── Security Check
    ├── Prompt Injection Check
    └── Content Check
    │
    ▼
Agent
```

Because multiple guardrails may be needed, we store them in an array.

---

# 11. Output Guardrails

```typescript
public outputGuardrails: IOutputGuardrail[] = [];
```

Output guardrails work after the agent generates a response.

For example:

```text
Agent Output
     │
     ▼
Output Guardrails
     │
     ├── PII Check
     ├── Safety Check
     └── Formatting Check
     │
     ▼
Final Response
```

Again, we use an array because an agent can have multiple output guardrails.

---

# 12. Interceptors

```typescript
public interceptors: Interceptor[] = [];
```

Interceptors allow us to observe what the agent is doing.

They can be used for:

* Logging
* Debugging
* Monitoring
* Tracing
* Analytics

For example:

```text
Agent
  │
  ├── Interceptor → log input
  ├── Interceptor → log tool call
  └── Interceptor → log output
```

---

# 13. Model Name

```typescript
public modelName: string = "gpt-4o";
```

This stores the model the agent should use.

Example:

```typescript
builder.model("gpt-4o");
```

The builder then stores:

```typescript
modelName = "gpt-4o";
```

You could later support other models without changing the builder architecture.

---

# 14. Maximum Loop Limit

```typescript
public maxLoop: number = 30;
```

Agentic systems often run inside loops.

For example:

```text
Think
  ↓
Tool
  ↓
Analyse
  ↓
Think
  ↓
Tool
  ↓
Analyse
  ↓
Output
```

We need a safety limit.

Without a limit, an agent could theoretically continue indefinitely because of a bug or unexpected model behavior.

The default is:

```text
30 loops
```

The developer can change it:

```typescript
builder.setMaxLoop(10);
```

---

# 15. Optional API Key

```typescript
public apiKey?: string;
```

The `?` means the property is optional.

So these are both valid states:

```typescript
apiKey = "sk-...";
```

or:

```typescript
apiKey = undefined;
```

In production applications, it is generally better to load secrets from environment variables rather than hard-code them.

For example:

```typescript
process.env.OPENAI_API_KEY
```

---

# 16. Constructor

Now we define the constructor:

```typescript
constructor(name?: string) {
  if (name) {
    this.name = name;
  }
}
```

The constructor accepts an optional name.

Therefore:

```typescript
new AgentBuilder();
```

creates:

```text
name = "DefaultAgent"
```

While:

```typescript
new AgentBuilder("DevOpsAgent");
```

creates:

```text
name = "DevOpsAgent"
```

The logic is:

```text
Was a name provided?
       │
   ┌───┴───┐
   │       │
  Yes      No
   │       │
   ▼       ▼
use name  use default
```

---

# 17. `setName()`

```typescript
public setName(name: string): this {
  this.name = name;

  return this;
}
```

This method changes the agent's name.

Example:

```typescript
const builder = new AgentBuilder();

builder.setName("ResearchAgent");
```

Now:

```typescript
builder.name
```

is:

```text
ResearchAgent
```

### Why return `this`?

Because we want:

```typescript
builder
  .setName("ResearchAgent")
  .setInstructions("You are a research assistant.");
```

Without `return this`, chaining would not work.

---

# 18. `setInstructions()`

```typescript
public setInstructions(instructions: string): this {
  this.instructions = instructions;

  return this;
}
```

This method stores the agent's system instructions.

Example:

```typescript
builder.setInstructions(
  "You are an expert software engineering assistant."
);
```

The builder now contains those instructions.

---

# 19. Adding Tools

The most interesting builder method is:

```typescript
public tool(t: ITool): this {
  if (
    this.toolList.some(
      (existing) => existing.name === t.name
    )
  ) {
    throw new Error(
      `Tool '${t.name}' is already registered in agent '${this.name}'.`
    );
  }

  this.toolList.push(t);

  return this;
}
```

Let's break this down.

---

## Step 1 — Accept an `ITool`

```typescript
public tool(t: ITool): this
```

The parameter:

```typescript
t: ITool
```

means the supplied object must follow the `ITool` interface.

For example:

```typescript
const calculatorTool: ITool = {
  name: "calculator",
  description: "Performs calculations",
  executor: (input) => "42"
};
```

Then:

```typescript
builder.tool(calculatorTool);
```

---

# 20. Why Duplicate Tools Are Dangerous

Suppose an agent has:

```text
calculator
calculator
weather
```

Now the LLM asks:

```text
Call calculator
```

Which calculator should the framework execute?

This creates ambiguity.

Therefore, our builder prevents duplicate tool names.

---

# 21. Understanding `.some()`

This code performs the duplicate check:

```typescript
this.toolList.some(
  (existing) => existing.name === t.name
)
```

`some()` checks whether **at least one item** in the array satisfies a condition.

For example:

```typescript
const numbers = [1, 2, 3];

numbers.some((number) => number === 2);
```

returns:

```typescript
true
```

Because `2` exists.

For our tools:

```typescript
this.toolList.some(
  (existing) => existing.name === t.name
)
```

means:

> "Does any already-registered tool have the same name as the new tool?"

---

# 22. Throwing the Duplicate Error

If a duplicate exists:

```typescript
throw new Error(
  `Tool '${t.name}' is already registered in agent '${this.name}'.`
);
```

For example:

```text
Tool 'calculator' is already registered in agent 'MathAgent'.
```

This is much better than silently registering the duplicate.

It immediately tells the developer what went wrong.

---

# 23. Adding the Tool

If no duplicate exists:

```typescript
this.toolList.push(t);
```

The tool is added to the array.

For example:

```text
Before:

toolList = []

After:

toolList = [
  calculatorTool
]
```

Adding another:

```text
toolList = [
  calculatorTool,
  weatherTool
]
```

---

# 24. Adding Input Guardrails

```typescript
public addInputGuardrail(
  guardrail: IInputGuardrail
): this {
  this.inputGuardrails.push(guardrail);

  return this;
}
```

This simply adds an input guardrail to the collection.

Example:

```typescript
builder
  .addInputGuardrail(securityGuardrail)
  .addInputGuardrail(promptInjectionGuardrail);
```

Now:

```text
inputGuardrails
│
├── securityGuardrail
└── promptInjectionGuardrail
```

---

# 25. Adding Output Guardrails

The output version is almost identical:

```typescript
public addOutputGuardrail(
  guardrail: IOutputGuardrail
): this {
  this.outputGuardrails.push(guardrail);

  return this;
}
```

Example:

```typescript
builder
  .addOutputGuardrail(piiRedactionGuardrail)
  .addOutputGuardrail(safetyGuardrail);
```

Now the agent has multiple output checks.

---

# 26. Selecting the Model

```typescript
public model(modelName: string): this {
  this.modelName = modelName;

  return this;
}
```

Example:

```typescript
builder.model("gpt-4o");
```

or:

```typescript
builder.model("some-other-model");
```

The builder simply stores the requested model name.

Later, the `Agent` class will use it when communicating with the LLM provider.

---

# 27. Setting the Maximum Loop

```typescript
public setMaxLoop(limit: number): this {
  this.maxLoop = limit;

  return this;
}
```

Example:

```typescript
builder.setMaxLoop(15);
```

Now:

```text
maxLoop = 15
```

This protects the agent runtime from endlessly repeating its reasoning/tool cycle.

A production implementation could later add validation such as:

```typescript
if (limit <= 0) {
  throw new Error("maxLoop must be greater than 0");
}
```

For this chapter, we keep the builder simple.

---

# 28. Setting the API Key

```typescript
public setApiKey(key: string): this {
  this.apiKey = key;

  return this;
}
```

Example:

```typescript
builder.setApiKey(process.env.OPENAI_API_KEY!);
```

The key is stored in the builder and later passed into the `Agent`.

### Important

Avoid doing this:

```typescript
builder.setApiKey("sk-real-secret-key");
```

inside source code.

Prefer environment variables or a secure secret-management system.

---

# 29. Adding Interceptors

```typescript
public attachInterceptor(
  interceptor: Interceptor
): this {
  this.interceptors.push(interceptor);

  return this;
}
```

An interceptor can observe agent activity.

For example:

```typescript
builder.attachInterceptor(consoleLoggerInterceptor);
```

Multiple interceptors are also possible:

```typescript
builder
  .attachInterceptor(consoleLoggerInterceptor)
  .attachInterceptor(metricsInterceptor)
  .attachInterceptor(tracingInterceptor);
```

---

# 30. The `build()` Method

Finally, we have:

```typescript
public build(): Agent {
  return new Agent(this);
}
```

This is the most important method in the Builder Pattern.

Until this point, we have only been collecting configuration.

When we call:

```typescript
.build()
```

the builder creates the actual agent:

```text
AgentBuilder
     │
     │ stores configuration
     │
     ▼
   build()
     │
     ▼
new Agent(this)
     │
     ▼
   Agent
```

The `this` refers to the current `AgentBuilder`.

Therefore, the `Agent` receives all of the configuration collected by the builder.

---

# 31. Complete `src/builder.ts`

Here is the complete implementation:

```typescript
import { Agent } from "./agent.js";

import {
  IInputGuardrail,
  IOutputGuardrail,
  ITool,
  Interceptor
} from "./types.js";

export class AgentBuilder {
  public name: string = "DefaultAgent";

  public instructions: string =
    "You are a helpful AI assistant.";

  public toolList: ITool[] = [];

  public inputGuardrails: IInputGuardrail[] = [];

  public outputGuardrails: IOutputGuardrail[] = [];

  public interceptors: Interceptor[] = [];

  public modelName: string = "gpt-4o";

  public maxLoop: number = 30;

  public apiKey?: string;

  constructor(name?: string) {
    if (name) {
      this.name = name;
    }
  }

  public setName(name: string): this {
    this.name = name;

    return this;
  }

  public setInstructions(instructions: string): this {
    this.instructions = instructions;

    return this;
  }

  public tool(t: ITool): this {
    if (
      this.toolList.some(
        (existing) => existing.name === t.name
      )
    ) {
      throw new Error(
        `Tool '${t.name}' is already registered in agent '${this.name}'.`
      );
    }

    this.toolList.push(t);

    return this;
  }

  public addInputGuardrail(
    guardrail: IInputGuardrail
  ): this {
    this.inputGuardrails.push(guardrail);

    return this;
  }

  public addOutputGuardrail(
    guardrail: IOutputGuardrail
  ): this {
    this.outputGuardrails.push(guardrail);

    return this;
  }

  public model(modelName: string): this {
    this.modelName = modelName;

    return this;
  }

  public setMaxLoop(limit: number): this {
    this.maxLoop = limit;

    return this;
  }

  public setApiKey(key: string): this {
    this.apiKey = key;

    return this;
  }

  public attachInterceptor(
    interceptor: Interceptor
  ): this {
    this.interceptors.push(interceptor);

    return this;
  }

  public build(): Agent {
    return new Agent(this);
  }
}
```

---

# 32. Understanding the Complete Builder Flow

Suppose we write:

```typescript
const agent = new AgentBuilder("DevOpsAgent")
  .setInstructions(
    "You execute shell operations safely."
  )
  .tool(cliAccessTool)
  .addInputGuardrail(securityGuardrail)
  .addInputGuardrail(cliSafetyGuardrail)
  .addOutputGuardrail(piiRedactionGuardrail)
  .attachInterceptor(consoleLoggerInterceptor)
  .model("gpt-4o")
  .setMaxLoop(20)
  .build();
```

Internally, the builder gradually becomes:

```text
AgentBuilder
│
├── name
│   └── "DevOpsAgent"
│
├── instructions
│   └── "You execute shell operations safely."
│
├── tools
│   └── cliAccessTool
│
├── inputGuardrails
│   ├── securityGuardrail
│   └── cliSafetyGuardrail
│
├── outputGuardrails
│   └── piiRedactionGuardrail
│
├── interceptors
│   └── consoleLoggerInterceptor
│
├── modelName
│   └── "gpt-4o"
│
└── maxLoop
    └── 20
          │
          ▼
       build()
          │
          ▼
        Agent
```

This makes the configuration process easy to read.

---

# 33. Why This Design Is Better

Without a builder:

```typescript
new Agent(
  name,
  instructions,
  tools,
  inputGuardrails,
  outputGuardrails,
  interceptors,
  model,
  maxLoop,
  apiKey
);
```

The developer has to remember:

* Parameter order
* Which parameters are optional
* Which array belongs to which feature
* What each parameter means

With the builder:

```typescript
new AgentBuilder("DevOpsAgent")
  .setInstructions(...)
  .tool(...)
  .addInputGuardrail(...)
  .addOutputGuardrail(...)
  .attachInterceptor(...)
  .model(...)
  .setMaxLoop(...)
  .build();
```

The configuration is self-documenting.

---

# 34. Builder vs Final Agent

A very important distinction:

### `AgentBuilder`

Responsible for:

```text
Configuration
```

### `Agent`

Responsible for:

```text
Actual agent execution
```

Think of it as:

```text
AgentBuilder
    │
    │ configuration
    ▼
  build()
    │
    ▼
   Agent
    │
    ├── process input
    ├── run guardrails
    ├── call LLM
    ├── execute tools
    ├── perform handoffs
    └── generate output
```

The builder should **not** become the agent runtime.

Its job is simply to construct the agent configuration.

---

# 35. Verification & Testing

Now let's verify the duplicate-tool protection.

Run:

```bash
npx tsx -e "
import { AgentBuilder } from './src/builder.js';

const builder = new AgentBuilder('TestAgent')
  .tool({
    name: 'myTool',
    description: 'desc',
    executor: () => 'ok'
  });

try {
  builder.tool({
    name: 'myTool',
    description: 'desc',
    executor: () => 'ok'
  });
} catch (e) {
  console.log(
    'Successfully caught error:',
    e instanceof Error ? e.message : e
  );
}
"
```

The expected output is:

```text
Successfully caught error: Tool 'myTool' is already registered in agent 'TestAgent'.
```

---

# 36. Understanding the Test

Let's understand the important parts.

First:

```typescript
const builder = new AgentBuilder("TestAgent");
```

Creates a builder named:

```text
TestAgent
```

Then:

```typescript
builder.tool({
  name: "myTool",
  description: "desc",
  executor: () => "ok"
});
```

Registers the first tool.

The tool list is now:

```text
[
  myTool
]
```

Then we try to register another tool with the same name:

```typescript
builder.tool({
  name: "myTool",
  description: "desc",
  executor: () => "ok"
});
```

The builder checks:

```typescript
existing.name === t.name
```

and finds:

```text
myTool === myTool
```

Therefore it throws an error.

The `try/catch` captures that error:

```typescript
try {
  // code that may throw
} catch (e) {
  // handle error
}
```

This confirms that our validation works.

---

# 37. Why `this` Is Important

One of the most important concepts in this chapter is:

```typescript
return this;
```

Consider:

```typescript
builder
  .setName("Agent")
  .model("gpt-4o")
  .setMaxLoop(20);
```

The first call:

```typescript
builder.setName("Agent")
```

returns:

```typescript
builder
```

So JavaScript can immediately execute:

```typescript
builder.model("gpt-4o")
```

which again returns:

```typescript
builder
```

Then:

```typescript
builder.setMaxLoop(20)
```

can execute.

Therefore:

```text
method()
   ↓
return this
   ↓
method()
   ↓
return this
   ↓
method()
```

This is what creates the fluent API.

---

# 38. Common Mistakes

## Mistake 1 — Forgetting `return this`

Incorrect:

```typescript
public setName(name: string): this {
  this.name = name;
}
```

Now this fails:

```typescript
builder
  .setName("Agent")
  .model("gpt-4o");
```

because `setName()` does not return the builder.

Correct:

```typescript
public setName(name: string): this {
  this.name = name;

  return this;
}
```

---

## Mistake 2 — Allowing Duplicate Tool Names

Bad:

```typescript
public tool(t: ITool): this {
  this.toolList.push(t);

  return this;
}
```

This allows:

```text
calculator
calculator
calculator
```

which can create ambiguity during tool dispatch.

Our duplicate check prevents this.

---

## Mistake 3 — Confusing Builder and Agent

Don't think:

```text
AgentBuilder = Agent
```

They have different responsibilities.

Instead:

```text
AgentBuilder = configuration/constructor helper

Agent = runtime/execution engine
```

---

## Mistake 4 — Hard-Coding Secrets

Avoid:

```typescript
builder.setApiKey("sk-...");
```

Use environment variables:

```typescript
builder.setApiKey(process.env.OPENAI_API_KEY!);
```

or, even better, design the SDK so secret management is handled securely outside the builder.

---

## Mistake 5 — Importing TypeScript Files Without `.js`

Because this project uses NodeNext ESM, source imports should use the emitted `.js` extension:

```typescript
import { Agent } from "./agent.js";
```

not:

```typescript
import { Agent } from "./agent";
```

This matches the ESM configuration established in Chapter 0.

---

# 39. Architecture After Chapter 2

At this point our SDK architecture looks like:

```text
                 ┌─────────────────┐
                 │   User Code     │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  AgentBuilder   │
                 │                 │
                 │ name            │
                 │ instructions    │
                 │ tools           │
                 │ guardrails      │
                 │ interceptors    │
                 │ model           │
                 │ maxLoop         │
                 └────────┬────────┘
                          │
                       build()
                          │
                          ▼
                 ┌─────────────────┐
                 │      Agent      │
                 └────────┬────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        Guardrails      Tools      Interceptors
             │            │            │
             └────────────┼────────────┘
                          ▼
                         LLM
```

---

# 40. Connection With Previous Chapters

Our chapters are now starting to connect.

### Chapter 0

Defined the contracts:

```typescript
ITool
IInputGuardrail
IOutputGuardrail
Interceptor
PipelineStep
```

### Chapter 1

Defined how the LLM should behave:

```text
INITIAL
THINK
TOOL_REQUEST
ANALYSE
HANDOFF
OUTPUT
```

### Chapter 2

Provides an easy way to configure everything:

```typescript
new AgentBuilder()
  .setInstructions(...)
  .tool(...)
  .addInputGuardrail(...)
  .addOutputGuardrail(...)
  .attachInterceptor(...)
  .build();
```

So the architecture is becoming:

```text
Types
  │
  ▼
System Prompt
  │
  ▼
Agent Builder
  │
  ▼
Agent Runtime
  │
  ├── Tools
  ├── Guardrails
  ├── Interceptors
  └── Handoffs
```

---

# 41. Chapter Checklist

Before moving forward, make sure you understand:

* [ ] What the Builder Pattern is
* [ ] Why fluent APIs are useful
* [ ] Why builder methods return `this`
* [ ] How `AgentBuilder` stores configuration
* [ ] How tools are registered
* [ ] Why duplicate tool names are rejected
* [ ] How input guardrails are stored
* [ ] How output guardrails are stored
* [ ] How interceptors are attached
* [ ] How the model name is configured
* [ ] Why `maxLoop` exists
* [ ] How `build()` creates the final `Agent`
* [ ] Difference between `AgentBuilder` and `Agent`

---

# 42. Final Mental Model

The simplest way to remember this chapter is:

```text
AgentBuilder = "How should my agent be configured?"

Agent       = "How does my agent actually run?"
```

The builder collects everything:

```text
Name
Instructions
Tools
Guardrails
Interceptors
Model
Loop Limit
API Key
```

Then:

```typescript
.build()
```

turns that configuration into:

```text
Agent
```

So the entire chapter can be summarized as:

```text
Configure
   ↓
Validate
   ↓
Chain
   ↓
Build
   ↓
Agent
```

---

# Next Chapter

In **Chapter 3**, we will build the **Guardrails Framework and Interceptor Logger**.

We will move from simply registering guardrails:

```typescript
.addInputGuardrail(securityGuardrail)
.addOutputGuardrail(piiRedactionGuardrail)
```

to actually executing them:

```text
User Input
    │
    ▼
Input Guardrails
    │
    ├── Security
    ├── Safety
    └── Validation
    │
    ▼
Agent
    │
    ▼
LLM
    │
    ▼
Output Guardrails
    │
    ├── PII Redaction
    ├── Safety
    └── Quality
    │
    ▼
Final Output
```

We will also implement interceptors so developers can observe and debug the agent pipeline in real time.

This version keeps your original implementation but makes the **Builder → Agent → runtime architecture** much clearer, especially the role of `return this`, duplicate-tool protection, and `build()`.
