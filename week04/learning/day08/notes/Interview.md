# 🤖 Agent SDK — Interview Questions & Answers

### Based only on Topics 01–05

Below is an interview-focused Q&A covering the concepts we discussed: **Agent SDK, Builder Pattern, Harness Prompting, ReAct pipeline, Tool Registry, Tool Execution, Message State, Interceptors, and Safety Guards.**

---

## 01 — Agent SDK Fundamentals

### Q1. What is an Agent SDK?

**Answer:**
An Agent SDK is an abstraction layer built on top of LLM APIs that provides reusable components for building AI agents.

It typically handles:

* Agent configuration
* System instructions
* Message history
* Tool registration
* Tool execution
* Reasoning/execution loops
* Interceptors and observability
* Safety controls

**In short:**

> **Agent SDK = LLM + Instructions + State + Tools + Execution Loop**

---

### Q2. Why do we need an Agent SDK instead of directly calling an LLM API?

**Answer:**
A raw LLM API usually provides a request → response mechanism. An Agent SDK adds the runtime required for multi-step autonomous execution.

For example:

```text
User
 ↓
LLM
 ↓
Tool
 ↓
Tool Result
 ↓
LLM
 ↓
Final Answer
```

Without an SDK, the developer must manually manage this entire process.

---

### Q3. What are the three core components of an Agent?

**Answer:**

1. **LLM** — The reasoning/generation engine.
2. **Instructions/Harness** — Defines how the agent should behave and respond.
3. **Tools** — Allow the agent to interact with external systems.

```text
Agent
├── 🧠 LLM
├── 📜 Instructions + Harness
└── 🛠️ Tools
```

---

### Q4. Is an LLM itself an Agent?

**Answer:**
Not necessarily.

An LLM generates responses, while an Agent combines an LLM with **state, tools, instructions, and an execution loop**.

```text
LLM
  +
State
  +
Tools
  +
Execution Loop
  =
Agent
```

---

# 02 — Builder Pattern

### Q5. Why is the Builder Pattern useful for an Agent SDK?

**Answer:**
Agents can have many configuration options such as:

* Instructions
* Tools
* Model
* Maximum loop count
* Interceptors

Putting everything into a constructor can become difficult to read and maintain.

The Builder provides readable method chaining:

```ts
const agent = Agent.builder()
  .setInstructions("You are a coding agent")
  .tool(cliAccessTool)
  .model("gpt-4o")
  .setMaxLoop(15)
  .build();
```

---

### Q6. What is Fluent API / Method Chaining?

**Answer:**
It means each configuration method returns the builder itself using:

```ts
return this;
```

This allows:

```ts
builder
  .setInstructions(...)
  .tool(...)
  .model(...)
  .build();
```

instead of calling every method separately.

---

### Q7. What is the responsibility of `AgentBuilder`?

**Answer:**
`AgentBuilder` is responsible for **collecting configuration** needed to create an Agent.

For example:

```text
AgentBuilder
├── instructions
├── tools
├── model
├── maxLoop
└── interceptors
        ↓
      build()
        ↓
      Agent
```

---

### Q8. What does `build()` do?

**Answer:**

`build()` converts the configuration stored inside the builder into an actual `Agent`.

```ts
build() {
  return new Agent(this);
}
```

So the relationship is:

```text
AgentBuilder
     │
     │ build()
     ▼
   Agent
```

---

### Q9. Why does `Agent` receive `AgentBuilder` in its constructor?

**Answer:**
The builder already contains all the configuration.

The Agent constructor can copy that configuration into its internal runtime state.

For example:

```ts
constructor(builder: AgentBuilder) {
  this.modelName = builder.modelName;
  this.maxLoop = builder.maxLoop;
}
```

This separates **configuration** from **execution**.

---

### Q10. Why use `Agent.builder()` instead of `new AgentBuilder()`?

**Answer:**
`Agent.builder()` provides a clean public entry point.

```ts
const agent = Agent.builder()
  .setInstructions(...)
  .build();
```

Internally:

```ts
static builder() {
  return new AgentBuilder();
}
```

It also hides the direct builder construction from the developer.

---

# 03 — Harness Prompting

### Q11. What is a Harness Prompt?

**Answer:**
A Harness Prompt is a system-level instruction that defines a structured execution protocol for the Agent.

It tells the LLM:

* What execution stages exist
* When tools should be requested
* What JSON format to return
* When to produce the final output

---

### Q12. Why is a Harness Prompt useful?

**Answer:**
LLMs naturally generate flexible text. An Agent runtime needs predictable machine-readable output.

For example, instead of:

```text
I think I should check the weather.
```

the harness can require:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Kolkata"
}
```

The runtime can then parse and execute it.

---

### Q13. What is the 5-stage Harness pipeline?

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

The stages represent:

| Stage          | Purpose                         |
| -------------- | ------------------------------- |
| `INITIAL`      | Understand the user's objective |
| `THINK`        | Break the task into steps       |
| `TOOL_REQUEST` | Request an external tool        |
| `ANALYSE`      | Evaluate the result             |
| `OUTPUT`       | Produce the final answer        |

---

### Q14. What happens during `TOOL_REQUEST`?

**Answer:**
The LLM specifies which tool it wants to execute and what input should be provided.

Example:

```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Kolkata"
}
```

The Agent then finds that function in its tool registry and executes it.

---

### Q15. What happens when the Agent reaches `OUTPUT`?

**Answer:**
`OUTPUT` is the termination condition.

The Agent stops its execution loop and returns the result.

```ts
if (parsedResult.step.toLowerCase() === "output") {
  return this.messageHistory;
}
```

---

# 04 — ReAct / Reasoning Pipeline

### Q16. What is the ReAct-style execution pattern in this Agent?

**Answer:**
The Agent repeatedly cycles between reasoning, actions, and observations/results.

Conceptually:

```text
Reason
  ↓
Action
  ↓
Observation
  ↓
Reason
  ↓
Final Answer
```

In this implementation, those concepts are represented through structured steps such as `THINK`, `TOOL_REQUEST`, and `ANALYSE`.

---

### Q17. Does every Agent step require a tool?

**Answer:**
No.

For example, a simple mathematical question may only require reasoning and output:

```text
INITIAL
 ↓
THINK
 ↓
ANALYSE
 ↓
OUTPUT
```

A task requiring external information may use:

```text
THINK
 ↓
TOOL_REQUEST
 ↓
Tool
 ↓
ANALYSE
 ↓
OUTPUT
```

---

# 05 — Tool System

### Q18. What is a Tool in an Agent SDK?

**Answer:**
A Tool is an executable function that allows the Agent to interact with external systems.

Examples:

* Weather API
* CLI
* Database
* Web API
* File system

---

### Q19. What is the `ITool` interface?

**Answer:**

```ts
interface ITool {
  name: string;
  description: string;
  doc?: string;
  executor: (input: string) => Promise<string> | string;
}
```

It defines the contract every tool must follow.

The important parts are:

```text
name
 ↓
How the LLM identifies the tool

description
 ↓
What the tool does

doc
 ↓
How the tool should be called

executor
 ↓
Actual implementation
```

---

### Q20. Why does a Tool have both `description` and `executor`?

**Answer:**

They serve different purposes.

**`description`** tells the LLM what the tool does.

**`executor`** actually performs the operation.

```text
LLM
 │
 │ reads
 ▼
description
 │
 │ requests
 ▼
functionName
 │
 ▼
executor()
 │
 ▼
External System
```

---

### Q21. What is a Tool Registry?

**Answer:**
A Tool Registry is the collection of tools available to an Agent.

In this implementation, tools are ultimately stored in:

```ts
Map<string, ITool>
```

called `toolMap`.

---

### Q22. Why use a `Map` for the tool registry?

**Answer:**
Because tools are looked up by name.

```ts
this.toolMap.get(functionName);
```

A `Map` provides efficient key-based lookup, generally **O(1)** average-case lookup.

Example:

```text
"execCli"
     ↓
ToolMap
     ↓
cliAccessTool
```

---

### Q23. How does the LLM know which tools are available?

**Answer:**
The Agent takes tool metadata and includes it in the system instructions/harness context.

For example:

```json
{
  "functionName": "fetchWeatherInfo",
  "functionDescription": "Fetches realtime weather data",
  "functionDoc": "fetchWeatherInfo(cityName: string): WeatherReport"
}
```

The LLM uses this information to decide which tool to request.

---

### Q24. Does the LLM directly execute a tool?

**Answer:**
No.

The LLM only **requests** a tool.

The Agent runtime performs the actual execution.

```text
LLM
 ↓
"Call execCli"
 ↓
Agent
 ↓
ToolMap
 ↓
executor()
 ↓
CLI
```

This distinction is extremely important.

---

# 06 — Tool Execution

### Q25. Explain the complete Tool Execution lifecycle.

**Answer:**

```text
1. LLM generates TOOL_REQUEST
             ↓
2. Agent extracts functionName + input
             ↓
3. Agent searches ToolMap
             ↓
4. Tool is found
             ↓
5. executor(input) is called
             ↓
6. Tool produces result
             ↓
7. Result is added to messageHistory
             ↓
8. LLM receives updated history
             ↓
9. Agent continues
```

---

### Q26. What happens if the requested tool does not exist?

**Answer:**
The Agent does not execute anything.

It adds an error message to the history:

```ts
{
  role: "developer",
  content: `Error: Tool '${functionName}' is not registered`
}
```

Then it continues the loop so the LLM can potentially recover.

---

### Q27. Why inject tool results back into message history?

**Answer:**
Because the LLM needs the result to decide what to do next.

For example:

```text
LLM
 ↓
"Get weather"
 ↓
Tool
 ↓
"28°C, cloudy"
 ↓
Message History
 ↓
LLM
 ↓
"Today the weather is..."
```

Without injecting the result, the LLM would not know what the tool returned.

---

### Q28. Why are tool results represented as `developer` messages in this implementation?

**Answer:**
In this simplified Agent design, `developer` messages are used to inject runtime-generated information such as:

* Tool results
* Tool errors
* Execution feedback

This lets the Agent distinguish runtime feedback from the user's input and the LLM's responses.

---

# 07 — Message State

### Q29. What is `messageHistory`?

**Answer:**
`messageHistory` is the Agent's ordered execution state.

```ts
private messageHistory: IMessage[];
```

It stores:

```text
👤 User messages
🤖 Assistant responses
🔧 Developer/tool results
```

---

### Q30. Why is message history important?

**Answer:**
Because an Agent is multi-step.

Each LLM call needs access to previous events to understand the current state.

```text
Previous Context
      +
New Tool Result
      +
Current Request
      ↓
     LLM
```

---

### Q31. How does the Agent send history to the LLM?

**Answer:**

```ts
messages: [
  {
    role: "system",
    content: this.instructions
  },
  ...this.messageHistory
]
```

So each LLM call contains the system instructions plus accumulated execution history.

---

### Q32. What are the message roles in this implementation?

**Answer:**

```text
user
 ↓
Human input

assistant
 ↓
LLM-generated responses

developer
 ↓
Runtime/tool results and feedback
```

---

# 08 — Interceptor Middleware

### Q33. What is an Interceptor?

**Answer:**
An Interceptor is a callback that observes Agent messages/events.

```ts
type Interceptor =
  (message: IMessage) => void;
```

It can be used for:

* Logging
* Metrics
* Debugging
* Tracing
* Auditing

---

### Q34. How does `attachInterceptor()` work?

**Answer:**

The Agent stores the interceptor:

```ts
this.interceptors.push(interceptor);
```

Later, when an event occurs:

```ts
notifyInterceptors(message)
```

is called.

That method executes every registered interceptor.

---

### Q35. Why are Interceptors useful?

**Answer:**
They separate observability from core Agent logic.

Instead of putting logging directly everywhere:

```text
Agent
 ├── Execution
 ├── Logging
 ├── Metrics
 ├── Tracing
 └── Auditing
```

we can use:

```text
             Agent
               │
        notifyInterceptors
          /      |      \
         ↓       ↓       ↓
      Logger   Metrics  Tracing
```

This is an example of **separation of concerns**.

---

### Q36. Can an Agent have multiple interceptors?

**Answer:**
Yes.

For example:

```ts
agent.attachInterceptor(logger);
agent.attachInterceptor(metrics);
agent.attachInterceptor(tracer);
```

Each interceptor receives the event.

---

# 09 — Safety & Reliability

### Q37. Why do Agents need a maximum loop limit?

**Answer:**
Because the LLM could repeatedly produce actions without reaching `OUTPUT`.

For example:

```text
THINK
 ↓
TOOL
 ↓
ANALYSE
 ↓
THINK
 ↓
TOOL
 ↓
ANALYSE
 ↓
...
```

Without a limit, this could cause:

* Infinite execution
* Excessive API calls
* Excessive token usage
* Increased cost

---

### Q38. What is `MAX_LOOP`?

**Answer:**
`MAX_LOOP` is a hard upper bound on the number of Agent execution iterations.

Example:

```ts
private MAX_LOOP = 30;
```

The loop runs only while:

```ts
i < MAX_LOOP
```

---

### Q39. Why is JSON parsing a potential problem?

**Answer:**
The Agent expects the LLM to return structured JSON.

For example:

```json
{
  "step": "OUTPUT",
  "text": "Hello"
}
```

But the model could return:

```text
Here is the answer:

{
  "step": "OUTPUT",
  "text": "Hello"
}
```

Direct `JSON.parse()` would fail.

Therefore, defensive parsing may attempt to extract the JSON object before parsing.

---

### Q40. Is valid JSON automatically a valid Agent response?

**Answer:**
No.

This is valid JSON:

```json
{
  "hello": "world"
}
```

but it does not contain the fields expected by the Agent.

Therefore:

```text
JSON Parsing
     ↓
Schema Validation
     ↓
Agent Execution
```

is safer than parsing alone.

---

### Q41. What happens if tool execution throws an error?

**Answer:**
The Agent can catch the error and inject the failure into message history.

Conceptually:

```json
{
  "functionName": "execCli",
  "error": "Command failed"
}
```

Then the LLM receives that information and may attempt to recover.

---

### Q42. Why should tool execution have timeouts?

**Answer:**
External operations can hang indefinitely.

For example:

```text
Agent
 ↓
CLI/API
 ↓
❌ Never responds
```

A timeout prevents the Agent from waiting forever and helps control resource usage.

---

# 10 — Architecture Questions

### Q43. Explain the complete Agent execution architecture.

**Answer:**

```text
👤 User
   ↓
🏗️ AgentBuilder
   ↓
🤖 Agent
   ↓
🎯 Harness + Instructions
   ↓
🧠 LLM
   ↓
📦 Structured JSON
   ↓
   ├── OUTPUT ──────────→ ✅ Final Answer
   │
   └── TOOL_REQUEST
            ↓
       🗺️ ToolMap
            ↓
       ⚙️ Executor
            ↓
       🌐 External System
            ↓
       📄 Tool Result
            ↓
       💬 Message History
            ↓
          🧠 LLM
            ↓
           🔄 Loop
```

Meanwhile:

```text
Agent Events
     ↓
📡 Interceptors
 ├── 📝 Logger
 ├── 📊 Metrics
 └── 🔍 Tracing
```

---

### Q44. How do Builder, Agent, Harness, Tools, State, and Interceptors connect?

**Answer:**

```text
Builder
   │
   │ creates/configures
   ▼
Agent
   │
   ├── Harness → controls LLM behavior
   │
   ├── State → stores execution history
   │
   ├── Tools → provides external capabilities
   │
   ├── Loop → repeatedly executes steps
   │
   └── Interceptors → observes events
```

---

### Q45. What happens when a user asks an Agent to create a file using CLI?

**Answer:**

```text
👤 "Create hello.cpp"
        ↓
🤖 Agent
        ↓
🧠 LLM
        ↓
TOOL_REQUEST
        ↓
functionName = "execCli"
        ↓
🗺️ ToolMap.get("execCli")
        ↓
⚙️ execCli.executor(...)
        ↓
💻 Shell executes command
        ↓
📄 Result
        ↓
💬 messageHistory
        ↓
🧠 LLM
        ↓
OUTPUT
        ↓
👤 Final response
```

---

# 🔥 Most Important Interview Questions

If you have limited interview time, focus on these:

### ⭐ Q1. What is an Agent SDK?

**LLM + state + tools + execution runtime.**

### ⭐ Q2. Why Builder Pattern?

**To configure complex Agents cleanly using fluent method chaining.**

### ⭐ Q3. What is a Harness Prompt?

**A system-level protocol that forces structured Agent behavior and output.**

### ⭐ Q4. What is the Agent loop?

**LLM → structured decision → tool execution if required → result into history → LLM again.**

### ⭐ Q5. Does the LLM execute tools?

**No. The LLM requests a tool; the Agent runtime executes it.**

### ⭐ Q6. Why `Map<string, ITool>`?

**Fast lookup of a requested tool by function name.**

### ⭐ Q7. What is `messageHistory`?

**The ordered execution state containing user, assistant, and runtime/developer messages.**

### ⭐ Q8. Why inject tool results into history?

**So the LLM can see the result and decide the next action.**

### ⭐ Q9. What is an Interceptor?

**A lifecycle observer used for logging, metrics, tracing, and auditing.**

### ⭐ Q10. Why `MAX_LOOP`?

**To prevent infinite Agent execution and uncontrolled API/token costs.**

### ⭐ Q11. Why structured JSON?

**Because the Agent runtime needs predictable, machine-readable LLM output.**

### ⭐ Q12. What happens when a tool fails?

**The error is captured and fed back into Agent state so the LLM can potentially recover.**

---

# 🧠 Final Interview Mental Model

Remember this single flow:

```text
              👤 USER
                 │
                 ▼
          🏗️ BUILDER
                 │
                 ▼
             🤖 AGENT
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
    🎯 HARNESS  💬 STATE  🛠️ TOOLS
       │         │         │
       └─────────┼─────────┘
                 ▼
              🧠 LLM
                 │
                 ▼
            📦 JSON STEP
                 │
          ┌──────┴──────┐
          ▼             ▼
     TOOL_REQUEST      OUTPUT
          │             │
          ▼             ▼
      🗺️ ToolMap      ✅ DONE
          │
          ▼
      ⚙️ Executor
          │
          ▼
      🌐 External
          │
          ▼
      📄 Result
          │
          ▼
      💬 State
          │
          └──────→ 🧠 LLM

      📡 Interceptors
      ├── Logging
      ├── Metrics
      └── Tracing

      🛡️ Safety
      ├── MAX_LOOP
      ├── JSON parsing
      ├── Validation
      └── Error handling
```

> **Best one-line interview answer:**
> **“An Agent SDK wraps an LLM with state, tools, structured prompting, and a controlled execution loop; the LLM decides the next step, while the Agent runtime manages tool execution, message history, observability, and safety.”**
