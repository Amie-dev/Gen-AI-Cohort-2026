# 🤖 Agent Architecture & Loop Engineering — Detailed Notes

An LLM by itself is **not an agent**.

A raw LLM primarily does:

```text
Input → Model → Output
```

An **agent** adds software around the model so it can:

* maintain state
* decide what to do next
* call tools
* observe tool results
* retry after errors
* continue until a stopping condition is reached

The core idea is:

> **An agent is an LLM placed inside a controlled software execution loop.**

---

# 1. What Is an Agent?

A useful simplified formula is:

```text
Agent
  =
LLM
+
State / Memory
+
Loop / Control Logic
+
Tools
+
Guardrails
```

Your original formula:

```text
Agent = LLM Engine + Loop Engineering + Tools
```

is a good foundation.

A more complete production architecture is:

```text
                    ┌──────────────┐
                    │     User     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌────────────┐
                    │    State   │
                    │   /Memory  │
                    └─────┬──────┘
                          │
                          ▼
                    ┌────────────┐
                    │    LLM     │
                    │  Decision  │
                    └─────┬──────┘
                          │
                   ┌──────┴──────┐
                   │             │
                Answer         Tool
                   │             │
                   │             ▼
                   │       ┌────────────┐
                   │       │ Tool Runner│
                   │       └─────┬──────┘
                   │             │
                   │             ▼
                   │       Tool Result
                   │             │
                   └──────┬──────┘
                          ▼
                        State
```

---

# 2. LLM vs Agent

This distinction is extremely important.

## LLM

A simple LLM interaction:

```text
User
 │
 ▼
LLM
 │
 ▼
Answer
```

Example:

```text
User:
What is Node.js?

LLM:
Node.js is a JavaScript runtime...
```

The application decides when to call the model.

---

## Agent

An agent can determine its next action.

```text
User
 │
 ▼
Agent
 │
 ▼
LLM decides
 │
 ├── Search web
 ├── Read file
 ├── Query database
 ├── Call API
 └── Answer
```

The important difference is **control flow**.

---

# 3. Agent = Decision Loop

Think of an agent as:

```text
Input
  ↓
Observe
  ↓
Decide
  ↓
Act
  ↓
Observe result
  ↓
Decide again
  ↓
Act again
  ↓
...
  ↓
Final answer
```

This repeated cycle is what gives the system agent-like behavior.

---

# 4. The Perceive → Decide → Act Loop

A classic agent loop can be simplified into three phases:

```text
┌───────────────┐
│    PERCEIVE   │
│ Observe state │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│     DECIDE    │
│ Choose action │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│      ACT      │
│ Execute tool  │
└───────┬───────┘
        │
        ▼
     New state
        │
        └───────────────► PERCEIVE
```

This is the fundamental loop.

---

# 5. Phase 1 — Perceive

**Perceive** means giving the agent information about the current state.

This could include:

```text
User question
Conversation history
Tool results
Database information
Retrieved documents
API responses
Previous errors
Environment state
```

Example:

```text
User:
What's the weather in Guwahati?
```

The agent perceives:

```text
Task = Get weather
Location = Guwahati
```

---

# 6. Phase 2 — Decide

The LLM determines what should happen next.

For example:

```json
{
  "step": "TOOL_REQUEST",
  "tool": "getWeather",
  "arguments": {
    "city": "Guwahati"
  }
}
```

The LLM isn't necessarily executing the function.

It is **requesting an action**.

This distinction is crucial:

```text
LLM
 │
 │ "Call getWeather"
 ▼
Agent Runtime
 │
 │ actually executes
 ▼
getWeather()
```

---

# 7. Phase 3 — Act

The runtime executes the requested action.

For example:

```javascript
const result = await getWeather("Guwahati");
```

The result could be:

```json
{
  "temperature": 31,
  "condition": "Sunny"
}
```

Then the result goes back into the agent's state.

```text
Tool
 ↓
Result
 ↓
Agent State
 ↓
LLM
```

---

# 8. Complete Example

Suppose the user asks:

```text
What's the weather in Guwahati?
```

The agent might execute:

```text
STEP 1
User Input
    ↓
LLM
    ↓
TOOL_REQUEST
    ↓
getWeather("Guwahati")
```

Then:

```text
STEP 2
Tool Result
    ↓
LLM
    ↓
OUTPUT
```

Final answer:

```text
It's 31°C and sunny in Guwahati.
```

---

# 9. Agent State

An agent needs some representation of the current execution state.

For example:

```javascript
const state = {
  messages: [],
  step: 0,
  status: "RUNNING",
  toolResults: [],
};
```

A more complete state might contain:

```javascript
const state = {
  messages: [],
  currentStep: 0,
  status: "RUNNING",

  lastAction: null,

  toolResults: [],

  errors: [],

  metadata: {
    userId: "123"
  }
};
```

The exact state depends on the application.

---

# 10. State Machine

An agent can be modeled as a state machine.

For example:

```text
             ┌──────────┐
             │ INITIAL  │
             └────┬─────┘
                  │
                  ▼
             ┌──────────┐
        ┌───►│  THINK   │
        │    └────┬─────┘
        │         │
        │         ▼
        │    ┌──────────┐
        │    │   ACT    │
        │    └────┬─────┘
        │         │
        │         ▼
        │    ┌──────────┐
        └────│ OBSERVE  │
             └────┬─────┘
                  │
             ┌────┴─────┐
             │          │
             ▼          ▼
          CONTINUE     OUTPUT
```

This is much safer than simply:

```javascript
while (true) {
  askLLM();
}
```

---

# 11. Why Use Structured States?

Suppose the model returns:

```text
I think we should search the web first, and then maybe...
```

Your JavaScript program has to interpret natural language.

That's unreliable.

Instead, ask for structured output:

```json
{
  "step": "TOOL_REQUEST",
  "tool": "searchWeb",
  "arguments": {
    "query": "React Native latest version"
  }
}
```

Now your runtime can reliably inspect:

```javascript
if (response.step === "TOOL_REQUEST") {
  // execute tool
}
```

---

# 12. State Bounding

This is one of the core ideas of **harness engineering**.

Don't allow the model to return arbitrary states.

Define an allowed set:

```text
INITIAL
THINK
TOOL_REQUEST
OUTPUT
ERROR
```

For example:

```json
{
  "step": "TOOL_REQUEST",
  "tool": "getWeather",
  "arguments": {}
}
```

The runtime can reject:

```json
{
  "step": "DELETE_EVERYTHING"
}
```

because it isn't a valid state.

---

# 13. Structured Output

A useful agent response schema might be:

```json
{
  "step": "THINK",
  "text": "I need weather information first."
}
```

or:

```json
{
  "step": "TOOL_REQUEST",
  "tool": "getWeather",
  "arguments": {
    "city": "Guwahati"
  }
}
```

or:

```json
{
  "step": "OUTPUT",
  "text": "The weather is 31°C and sunny."
}
```

The runtime can then route each state.

---

# 14. Basic Agent Loop in JavaScript

A simplified implementation:

```javascript
while (true) {
  const response = await callLLM(state);

  const decision = JSON.parse(response);

  if (decision.step === "OUTPUT") {
    console.log(decision.text);
    break;
  }

  if (decision.step === "TOOL_REQUEST") {
    const result = await runTool(
      decision.tool,
      decision.arguments
    );

    state.messages.push({
      role: "tool",
      content: JSON.stringify(result)
    });

    continue;
  }
}
```

The basic idea is:

```text
LLM
 ↓
Decision
 ↓
Runtime
 ↓
Tool
 ↓
Result
 ↓
LLM
```

---

# 15. Why `while (true)` Is Dangerous

A naive implementation might use:

```javascript
while (true) {
  await callLLM();
}
```

What if the model never produces:

```text
OUTPUT
```

?

You could get:

```text
LLM → Tool → LLM → Tool → LLM → Tool → ...
```

This creates:

* unnecessary API costs
* token consumption
* latency
* repeated tool calls
* possible service abuse

Therefore, agents need termination controls.

---

# 16. Maximum Step Limit

A simple solution:

```javascript
const MAX_STEPS = 10;

for (let step = 0; step < MAX_STEPS; step++) {
  const response = await callLLM(state);

  // process response

  if (response.step === "OUTPUT") {
    break;
  }
}
```

Now:

```text
Step 1
 ↓
Step 2
 ↓
Step 3
 ↓
...
 ↓
Step 10
 ↓
STOP
```

This is called **loop bounding** or **step bounding**.

---

# 17. Timeout Protection

Step limits aren't enough.

A tool might hang:

```text
Agent
 ↓
API Request
 ↓
Waiting...
 ↓
Waiting...
 ↓
Waiting...
```

Use timeouts:

```javascript
const result = await Promise.race([
  runTool(),
  timeout(5000)
]);
```

Conceptually:

```text
Tool execution
      │
      ├── Completes → Continue
      │
      └── Timeout → Error
```

---

# 18. Token and Cost Limits

Agents can make multiple LLM calls.

Suppose:

```text
One request = 2,000 tokens
```

and the agent executes:

```text
15 iterations
```

Potential usage becomes much larger than a single call.

Therefore production agents should track:

```text
Maximum steps
Maximum tokens
Maximum execution time
Maximum tool calls
Maximum cost
```

---

# 19. Dynamic Error Recovery

One of the most powerful agent capabilities is recovering from tool errors.

Suppose the model requests:

```json
{
  "tool": "readFile",
  "arguments": {
    "path": "users.json"
  }
}
```

The file doesn't exist.

Tool returns:

```json
{
  "error": "FileNotFoundException: users.json"
}
```

Instead of crashing:

```text
Agent → ERROR → STOP
```

we can feed the error back:

```text
Agent
 ↓
Tool Request
 ↓
Tool
 ↓
ERROR
 ↓
LLM
 ↓
Corrected Request
 ↓
Tool
```

---

# 20. Error Recovery Example

First attempt:

```json
{
  "tool": "readFile",
  "arguments": {
    "path": "users.json"
  }
}
```

Tool:

```json
{
  "error": "File not found"
}
```

The LLM sees the result and decides:

```json
{
  "tool": "readFile",
  "arguments": {
    "path": "data/users.json"
  }
}
```

Then:

```text
Tool
 ↓
Success
 ↓
LLM
 ↓
Final Answer
```

This is an important characteristic of agent loops.

---

# 21. Error Recovery ≠ Unlimited Retry

Be careful.

Bad:

```javascript
while (true) {
  retryTool();
}
```

Better:

```javascript
const MAX_RETRIES = 3;
```

Then:

```text
Attempt 1 → Error
Attempt 2 → Error
Attempt 3 → Error
              ↓
            STOP
```

Otherwise a broken tool can create an expensive infinite loop.

---

# 22. Tool Runner

The **tool runner** is the application layer responsible for actually executing tools.

Example:

```javascript
async function runTool(name, args) {
  switch (name) {
    case "getWeather":
      return await getWeather(args.city);

    case "searchWeb":
      return await searchWeb(args.query);

    case "readFile":
      return await readFile(args.path);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

Important:

> The LLM requests the tool. The runtime executes the tool.

---

# 23. Never Trust Tool Arguments

Suppose the model generates:

```json
{
  "tool": "deleteUser",
  "arguments": {
    "userId": "123"
  }
}
```

Don't blindly execute:

```javascript
await deleteUser(args.userId);
```

Instead:

```text
LLM
 ↓
Tool Request
 ↓
Schema Validation
 ↓
Authorization
 ↓
Business Rules
 ↓
Tool
```

This connects directly with your previous topic:

**LLM Security & Guardrails.**

---

# 24. Agent + Tools Architecture

A production agent often looks like:

```text
                     ┌──────────────┐
                     │     User     │
                     └──────┬───────┘
                            │
                            ▼
                    ┌─────────────┐
                    │ Agent State │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │     LLM     │
                    └──────┬──────┘
                           │
                   ┌───────┴────────┐
                   │                │
                OUTPUT          TOOL_REQUEST
                   │                │
                   │                ▼
                   │          ┌─────────────┐
                   │          │ Tool Runner │
                   │          └──────┬──────┘
                   │                 │
                   │                 ▼
                   │          ┌─────────────┐
                   │          │ External API│
                   │          │ DB / Files  │
                   │          └──────┬──────┘
                   │                 │
                   └────────┬────────┘
                            ▼
                         State
                            │
                            └──────► LLM
```

---

# 25. Agent Memory

LLMs themselves don't automatically maintain application memory between independent requests.

Your application can maintain state.

### Short-term memory

Current conversation:

```javascript
state.messages
```

### Long-term memory

Stored externally:

```text
PostgreSQL
Redis
Vector Database
Document Store
```

For example:

```text
User
 ↓
Agent
 ↓
Memory Retrieval
 ↓
Relevant memories
 ↓
LLM
```

---

# 26. RAG + Agent

RAG and agents are related but different.

### RAG

Primarily answers:

> **What information should I retrieve?**

```text
Question
 ↓
Retriever
 ↓
Documents
 ↓
LLM
 ↓
Answer
```

### Agent

Answers:

> **What should I do next?**

```text
Question
 ↓
LLM
 ↓
Search?
 │
 ├── Yes → Search
 │          ↓
 │        Result
 │          ↓
 │         LLM
 │
 └── No → Answer
```

An agent can use RAG as one of its tools.

---

# 27. Planning

An agent can make decisions incrementally.

For example:

```text
User:
Find the best laptop under ₹70,000 and compare three options.
```

The agent may determine:

```text
Step 1 → Search products
Step 2 → Extract specifications
Step 3 → Compare prices
Step 4 → Rank products
Step 5 → Generate answer
```

This is a plan.

But planning doesn't necessarily mean the model must produce a giant hidden chain of thought.

In production systems, it's often better to expose **structured actions and concise state** rather than requiring the model to reveal private reasoning.

---

# 28. Agent Loop vs CoT

These concepts should not be confused.

### Chain of Thought

Focuses on:

```text
Reasoning process
```

### Agent Loop

Focuses on:

```text
Execution process
```

For example:

```text
CoT:
Problem → reasoning → answer

Agent:
Problem → decision → tool → observation → decision → answer
```

An agent may use reasoning internally, but the core engineering problem is **state + actions + control flow**.

---

# 29. Harness Engineering

This is a useful evolution of prompt engineering.

### Prompt Engineering

Focus:

```text
"What should I tell the model?"
```

### Harness Engineering

Focus:

```text
"How should the entire application control the model?"
```

Harness engineering includes:

```text
State management
Tool execution
Schemas
Retries
Timeouts
Permissions
Loop limits
Error handling
Logging
Observability
```

Think:

```text
Prompt
   ↓
LLM
```

becomes:

```text
             ┌───────────────┐
             │ Application   │
             │    Harness    │
             └───────┬───────┘
                     │
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
      State         LLM          Tools
        │            │             │
        └────────────┴─────────────┘
```

---

# 30. Harness = Control Plane

The harness controls:

```text
Can the model call this tool?
       ↓
How many times?
       ↓
With which arguments?
       ↓
For how long?
       ↓
What happens if it fails?
       ↓
When should execution stop?
```

This is why production agents are not simply:

```javascript
while (true) {
  askLLM();
}
```

---

# 31. A Better Agent Loop

A simplified production-style loop:

```javascript
const MAX_STEPS = 10;

for (let step = 0; step < MAX_STEPS; step++) {
  const decision = await callLLM(state);

  if (decision.step === "OUTPUT") {
    return decision.text;
  }

  if (decision.step === "TOOL_REQUEST") {
    const result = await runValidatedTool(
      decision.tool,
      decision.arguments
    );

    state.messages.push({
      role: "tool",
      content: JSON.stringify(result)
    });

    continue;
  }

  if (decision.step === "ERROR") {
    break;
  }
}

return "Agent stopped because the execution limit was reached.";
```

This gives us:

```text
Structured State
+
Tool Execution
+
Loop Limit
+
Termination Condition
```

---

# 32. State Transition Example

Suppose the user asks:

```text
What is the weather in Guwahati?
```

State transitions:

```text
INITIAL
   │
   ▼
THINK
   │
   ▼
TOOL_REQUEST
   │
   ▼
TOOL_EXECUTION
   │
   ▼
TOOL_RESULT
   │
   ▼
THINK
   │
   ▼
OUTPUT
   │
   ▼
DONE
```

---

# 33. Agent Termination Conditions

An agent should stop when:

### Success

```text
OUTPUT
```

### Maximum steps reached

```text
step >= MAX_STEPS
```

### Tool failure cannot be recovered

```text
ERROR
```

### Timeout

```text
executionTime > MAX_TIME
```

### User cancellation

```text
cancelled === true
```

### Budget exceeded

```text
tokenUsage > MAX_TOKENS
```

---

# 34. Infinite Loop Protection

Imagine:

```text
LLM
 ↓
Search
 ↓
LLM
 ↓
Search
 ↓
LLM
 ↓
Search
 ↓
...
```

Without protection:

```text
∞ API calls
∞ tokens
∞ cost
```

With a step limit:

```text
1 → Search
2 → Search
3 → Search
4 → Search
5 → Search
6 → STOP
```

---

# 35. Observability

For production agents, log the execution trace.

Example:

```text
[01] User request
[02] LLM decision: TOOL_REQUEST
[03] Tool: searchWeb
[04] Tool result: success
[05] LLM decision: TOOL_REQUEST
[06] Tool: getProduct
[07] Tool result: success
[08] LLM decision: OUTPUT
[09] Agent completed
```

This makes debugging much easier.

---

# 36. Agent Failure Modes

Agents can fail in several ways.

### 1. Wrong tool

```text
User asks weather
       ↓
Agent calls calculator
```

### 2. Wrong arguments

```text
getWeather({
  city: "Guwahati"
})
```

becomes:

```text
getWeather({
  city: "Guwahati, USA"
})
```

### 3. Tool failure

```text
API unavailable
```

### 4. Infinite loop

```text
Tool → LLM → Tool → LLM...
```

### 5. Hallucinated tool

```text
tool: "magicSearch"
```

when no such tool exists.

### 6. Unauthorized action

```text
LLM requests deleteUser
```

without sufficient permission.

---

# 37. Defensive Architecture

A safer system:

```text
                   User
                     │
                     ▼
             Input Validation
                     │
                     ▼
                    LLM
                     │
                     ▼
             Structured Output
                     │
                     ▼
              Schema Validation
                     │
                     ▼
             Tool Authorization
                     │
                     ▼
              Tool Execution
                     │
                     ▼
              Result Validation
                     │
                     ▼
                    LLM
                     │
                     ▼
             Output Validation
                     │
                     ▼
                   User
```

---

# 38. Key Concepts to Remember

| Concept                 | Meaning                                             |
| ----------------------- | --------------------------------------------------- |
| **Agent**               | LLM + state + control loop + tools                  |
| **Perceive**            | Observe current information                         |
| **Decide**              | Select the next action                              |
| **Act**                 | Execute a tool/action                               |
| **State**               | Current execution information                       |
| **Tool Runner**         | Application code that executes tools                |
| **Tool Call**           | LLM's request to use a tool                         |
| **Loop Engineering**    | Designing agent execution cycles                    |
| **State Bounding**      | Restricting valid agent states                      |
| **Step Limit**          | Preventing infinite execution                       |
| **Timeout**             | Limiting execution duration                         |
| **Retry**               | Recovering from temporary failures                  |
| **Harness Engineering** | Building the software control system around the LLM |
| **Human-in-the-loop**   | Human approval for sensitive actions                |

---

# 🧠 Final Mental Model

The most important diagram from this topic:

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │    STATE    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
             ┌─────►│     LLM     │
             │      │   DECIDE    │
             │      └──────┬──────┘
             │             │
             │       ┌─────┴──────┐
             │       │            │
             │       ▼            ▼
             │    OUTPUT       TOOL_REQUEST
             │       │            │
             │       │            ▼
             │       │      ┌────────────┐
             │       │      │Tool Runner │
             │       │      └─────┬──────┘
             │       │            │
             │       │            ▼
             │       │       Tool Result
             │       │            │
             │       └─────┐      │
             │             │      │
             └─────────────┴──────┘
                           │
                           ▼
                         STATE
```

### ⭐ One-line definition

> **An AI agent is not just an LLM; it is an LLM operating inside a controlled loop that can observe state, decide actions, execute tools, process results, recover from errors, and eventually terminate.**

### 🔥 The progression to remember

```text
Prompt Engineering
       ↓
Structured Outputs
       ↓
Tool Calling
       ↓
State Management
       ↓
Agent Loop
       ↓
Guardrails
       ↓
Harness Engineering
       ↓
Production AI Agent
```

This connects all the Day 02 topics together: **prompting tells the model what to do, chat roles structure communication, formatting tells the model how the conversation is represented, guardrails constrain behavior, and the agent harness controls what the model is actually allowed to do.**
