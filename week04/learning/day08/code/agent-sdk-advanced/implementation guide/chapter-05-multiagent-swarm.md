

# Chapter 5 — Multi-Agent Swarm Orchestration & Handoffs

## 1. Chapter Goal

In the previous chapters, we built the core `Agent` runtime.

A single agent can:

* receive a user query
* execute guardrails
* call an LLM
* request tools
* process tool results
* produce an output
* request a handoff to another agent

But real applications often need **multiple specialized agents**.

For example:

```text
                User
                  |
                  v
           ┌─────────────┐
           │ TriageAgent │
           └──────┬──────┘
                  |
       ┌──────────┼──────────┐
       |          |          |
       v          v          v
 WeatherAgent  MathAgent  DevOpsAgent
       |          |          |
       └──────────┼──────────┘
                  |
                  v
             Final Output
```

A weather question should go to a weather specialist.

A mathematical question should go to a math specialist.

A shell/CLI question should go to a DevOps specialist.

Instead of putting every capability into one huge agent, we can create several focused agents and let them **hand off** work to each other.

This chapter introduces two important pieces:

1. `createHandoffTool()` — creates a tool that requests transfer to another agent.
2. `AgentSwarm` — coordinates agents and manages the handoff process.

---

# 2. What Is an Agent Swarm?

An **Agent Swarm** is a group of agents that collaborate to solve a task.

Each agent has its own:

* name
* instructions
* tools
* guardrails
* model configuration
* responsibilities

The swarm acts as the coordinator.

For example:

```text
User:
"What's the weather in Goa?"

        |
        v

TriageAgent
        |
        | HANDOFF
        v
WeatherAgent
        |
        | TOOL_REQUEST
        v
fetchWeatherInfo
        |
        v
WeatherAgent
        |
        | OUTPUT
        v
User
```

The important point is that the swarm does **not** need to understand the domain-specific task.

It mainly needs to answer:

> "Which agent should handle this next?"

---

# 3. Why Use Multiple Agents?

Imagine building one huge agent:

```text
MegaAgent
├── Customer Support
├── Weather
├── Mathematics
├── DevOps
├── Coding
├── Finance
├── Database
├── Email
└── Search
```

As the system grows, the prompt becomes difficult to maintain.

A multi-agent architecture separates responsibilities:

```text
TriageAgent
├── WeatherAgent
├── MathAgent
├── DevOpsAgent
└── SupportAgent
```

Each specialist can have a much smaller and more focused instruction set.

### Benefits

### 1. Specialization

Each agent can focus on one domain.

### 2. Maintainability

Changing the weather agent does not require modifying the math agent.

### 3. Security isolation

Sensitive tools can be exposed only to specific agents.

### 4. Better prompts

Each agent receives instructions relevant to its responsibility.

### 5. Scalability

New capabilities can be added as new agents.

---

# 4. Chapter Architecture

The overall system now looks like this:

```text
                     User Query
                         |
                         v
                 ┌──────────────┐
                 │ AgentSwarm   │
                 └──────┬───────┘
                        |
                        v
                 ┌──────────────┐
                 │ TriageAgent  │
                 └──────┬───────┘
                        |
                 decides next agent
                        |
          ┌─────────────┼─────────────┐
          |             |             |
          v             v             v
    WeatherAgent    MathAgent    DevOpsAgent
          |             |             |
          v             v             v
       Tools          Tools         Tools
          |             |             |
          └─────────────┼─────────────┘
                        |
                        v
                  Final OUTPUT
```

The important state maintained by the swarm is:

```text
currentAgent
messageHistory
handoffLogs
maxHandoffs
```

---

# 5. Create the Handoff Tool

Create:

```text
src/tools/handoffTool.ts
```

The purpose of this tool is simple:

> Tell the current agent that control should be transferred to another agent.

---

## Complete Code

```typescript
import { ITool } from "../types.js";

export function createHandoffTool(
  targetAgentName: string,
  description: string
): ITool {
  return {
    name: `transferTo_${targetAgentName}`,

    description: `Transfers control to the specialized agent '${targetAgentName}'. ${description}`,

    doc: `transferTo_${targetAgentName}(reason: string): HandoffResult`,

    executor(input: string): string {
      return JSON.stringify({
        status: "HANDOFF_TRIGGERED",
        targetAgent: targetAgentName,
        reason:
          input || `Transfer requested to ${targetAgentName}`,
      });
    },
  };
}
```

---

# 6. Understanding the Handoff Tool

Let's understand this code piece by piece.

## 6.1 Import `ITool`

```typescript
import { ITool } from "../types.js";
```

The handoff tool follows the same `ITool` interface used by normal tools.

That means the agent can treat a handoff tool just like any other tool.

For example:

```text
fetchWeatherInfo
evaluateMathExpression
execCli
transferTo_WeatherAgent
```

All of them follow the same tool contract.

---

# 7. `createHandoffTool()`

The function accepts two parameters:

```typescript
createHandoffTool(
  targetAgentName,
  description
)
```

For example:

```typescript
createHandoffTool(
  "WeatherAgent",
  "Use this when the user asks about weather."
);
```

The result is an `ITool`.

This is called a **tool generator** because one function can generate many different tools.

For example:

```typescript
createHandoffTool("WeatherAgent", "Handles weather queries.");

createHandoffTool("MathAgent", "Handles mathematical queries.");

createHandoffTool("DevOpsAgent", "Handles CLI and infrastructure queries.");
```

This produces:

```text
transferTo_WeatherAgent
transferTo_MathAgent
transferTo_DevOpsAgent
```

---

# 8. Dynamic Tool Name

The tool name is generated here:

```typescript
name: `transferTo_${targetAgentName}`,
```

If:

```typescript
targetAgentName = "WeatherAgent";
```

then:

```text
transferTo_WeatherAgent
```

is created.

This makes the tool name directly communicate its purpose.

---

# 9. Tool Description

The description is:

```typescript
description:
  `Transfers control to the specialized agent '${targetAgentName}'. ${description}`,
```

For example:

```text
Transfers control to the specialized agent
'WeatherAgent'.
Use this when the user asks about weather.
```

This description becomes part of the agent's tool information.

The LLM can use this description to decide when the handoff tool should be called.

---

# 10. The Handoff Executor

The most important part is:

```typescript
executor(input: string): string {
  return JSON.stringify({
    status: "HANDOFF_TRIGGERED",
    targetAgent: targetAgentName,
    reason:
      input || `Transfer requested to ${targetAgentName}`,
  });
}
```

The tool does not actually move execution itself.

Instead, it returns a structured message describing the requested transfer.

For example:

```typescript
{
  status: "HANDOFF_TRIGGERED",
  targetAgent: "WeatherAgent",
  reason: "The user is asking for current weather information."
}
```

The `Agent` runtime from Chapter 4 detects this structure.

Then it returns:

```typescript
{
  type: "HANDOFF",
  handoffPayload: ...
}
```

The `AgentSwarm` sees that result and performs the actual transfer.

So the architecture is:

```text
LLM
 |
 | TOOL_REQUEST
 v
Handoff Tool
 |
 | HANDOFF_TRIGGERED
 v
Agent
 |
 | HANDOFF
 v
AgentSwarm
 |
 v
Target Agent
```

This separation is important.

The handoff tool **requests** a transfer.

The swarm **performs** the transfer.

---

# 11. Implementing `AgentSwarm`

Now create:

```text
src/swarm.ts
```

This class is responsible for coordinating all registered agents.

---

# 12. Complete `AgentSwarm` Code

```typescript
import { Agent } from "./agent.js";
import {
  IMessage,
  SwarmRunResult,
} from "./types.js";

export class AgentSwarm {
  private agents: Map<string, Agent> = new Map();

  private defaultAgentName?: string;

  private maxHandoffs: number = 5;

  constructor() {}

  public registerAgent(agent: Agent): this {
    if (this.agents.has(agent.name)) {
      throw new Error(
        `Agent with name '${agent.name}' is already registered in Swarm.`
      );
    }

    this.agents.set(agent.name, agent);

    if (!this.defaultAgentName) {
      this.defaultAgentName = agent.name;
    }

    return this;
  }

  public setDefaultAgent(agentName: string): this {
    if (!this.agents.has(agentName)) {
      throw new Error(
        `Cannot set default agent '${agentName}': Agent is not registered.`
      );
    }

    this.defaultAgentName = agentName;

    return this;
  }

  public setMaxHandoffs(limit: number): this {
    this.maxHandoffs = limit;

    return this;
  }

  public async run(
    query: string
  ): Promise<SwarmRunResult> {
    if (
      !this.defaultAgentName ||
      !this.agents.has(this.defaultAgentName)
    ) {
      throw new Error(
        "Swarm cannot run: No valid default agent registered."
      );
    }

    let currentAgent =
      this.agents.get(this.defaultAgentName)!;

    let messageHistory: IMessage[] = [];

    const handoffLogs: Array<{
      from: string;
      to: string;
      reason: string;
    }> = [];

    console.log(
      `\n🔀 [SWARM INITIALIZED] Starting workflow with default agent '${currentAgent.name}'`
    );

    for (
      let handoffCount = 0;
      handoffCount <= this.maxHandoffs;
      handoffCount++
    ) {
      const outcome = await currentAgent.run(
        query,
        messageHistory
      );

      messageHistory = outcome.history;

      if (outcome.type === "OUTPUT") {
        console.log(
          `\x1b[32m✅ [SWARM COMPLETED] Final response delivered by '${currentAgent.name}'\x1b[0m\n`
        );

        return {
          completedBy: currentAgent.name,
          finalOutput: outcome.output || "",
          messageHistory,
          handoffLogs,
        };
      }

      if (
        outcome.type === "HANDOFF" &&
        outcome.handoffPayload
      ) {
        const {
          targetAgent,
          reason,
        } = outcome.handoffPayload;

        console.log(
          `\x1b[33m🤝 [AGENT HANDOFF] '${currentAgent.name}' ➔ '${targetAgent}' | Reason: "${reason}"\x1b[0m`
        );

        handoffLogs.push({
          from: currentAgent.name,
          to: targetAgent,
          reason,
        });

        const nextAgent =
          this.agents.get(targetAgent);

        if (!nextAgent) {
          throw new Error(
            `Handoff failed: Target agent '${targetAgent}' requested by '${currentAgent.name}' is not registered in Swarm.`
          );
        }

        messageHistory.push({
          role: "developer",
          content:
            `System Context: Conversation transferred from Agent '${currentAgent.name}' to Agent '${targetAgent}'. Reason: ${reason}`,
        });

        currentAgent = nextAgent;
      }
    }

    throw new Error(
      `AgentSwarm exceeded MAX_HANDOFFS limit of ${this.maxHandoffs}.`
    );
  }
}
```

---

# 13. Understanding the Swarm State

At the beginning of the class we have:

```typescript
private agents: Map<string, Agent> = new Map();
```

This stores every registered agent.

Conceptually:

```text
agents

"TriageAgent"  -> Agent instance
"WeatherAgent" -> Agent instance
"MathAgent"    -> Agent instance
"DevOpsAgent"  -> Agent instance
```

Using a `Map` makes lookup easy:

```typescript
this.agents.get("WeatherAgent");
```

---

# 14. Default Agent

```typescript
private defaultAgentName?: string;
```

The swarm needs to know where a new conversation should start.

Usually this is the triage/router agent.

For example:

```text
User
 |
 v
TriageAgent
```

The first registered agent automatically becomes the default agent.

This happens inside:

```typescript
if (!this.defaultAgentName) {
  this.defaultAgentName = agent.name;
}
```

---

# 15. Maximum Handoffs

```typescript
private maxHandoffs: number = 5;
```

This prevents agents from endlessly transferring control.

Imagine:

```text
Agent A
  ↓
Agent B
  ↓
Agent A
  ↓
Agent B
  ↓
Agent A
  ↓
Agent B
  ↓
...
```

Without a limit, the application could continue indefinitely.

`maxHandoffs` provides a safety boundary.

---

# 16. Registering Agents

The method:

```typescript
public registerAgent(agent: Agent): this
```

adds an agent to the swarm.

Example:

```typescript
swarm
  .registerAgent(triageAgent)
  .registerAgent(weatherAgent)
  .registerAgent(mathAgent)
  .registerAgent(devOpsAgent);
```

This creates a swarm containing four agents.

---

# 17. Preventing Duplicate Agents

Before registration:

```typescript
if (this.agents.has(agent.name)) {
  throw new Error(
    `Agent with name '${agent.name}' is already registered in Swarm.`
  );
}
```

This prevents:

```text
WeatherAgent
WeatherAgent
```

from accidentally being registered twice.

Agent names therefore act as unique identifiers.

---

# 18. Setting the Default Agent

The method:

```typescript
setDefaultAgent(agentName)
```

allows us to explicitly choose the starting agent.

Example:

```typescript
swarm.setDefaultAgent("TriageAgent");
```

Before setting it, the implementation verifies that the agent exists:

```typescript
if (!this.agents.has(agentName)) {
  throw new Error(
    `Cannot set default agent '${agentName}': Agent is not registered.`
  );
}
```

This prevents configuration mistakes.

---

# 19. Configuring Maximum Handoffs

We can customize the limit:

```typescript
swarm.setMaxHandoffs(10);
```

Now the swarm can perform up to the configured handoff budget before failing.

A practical production system should choose this value carefully.

Too low:

```text
Complex workflow
      ↓
handoff limit reached
      ↓
failure
```

Too high:

```text
Bad routing
   ↓
many unnecessary transfers
   ↓
higher cost + latency
```

---

# 20. The `run()` Method

The most important method is:

```typescript
public async run(
  query: string
): Promise<SwarmRunResult>
```

This starts the entire multi-agent workflow.

The user only provides:

```typescript
swarm.run(
  "What's the weather in Goa?"
);
```

Internally, the swarm manages everything else.

---

# 21. Validate the Default Agent

First:

```typescript
if (
  !this.defaultAgentName ||
  !this.agents.has(this.defaultAgentName)
) {
  throw new Error(
    "Swarm cannot run: No valid default agent registered."
  );
}
```

This ensures that the swarm has somewhere to start.

---

# 22. Select the Current Agent

```typescript
let currentAgent =
  this.agents.get(this.defaultAgentName)!;
```

Initially:

```text
currentAgent = TriageAgent
```

After a handoff:

```text
currentAgent = WeatherAgent
```

After another handoff:

```text
currentAgent = another specialized agent
```

The variable changes throughout the workflow.

---

# 23. Conversation History

We initialize:

```typescript
let messageHistory: IMessage[] = [];
```

This is extremely important.

The history allows agents to see what happened before them.

For example:

```text
User:
What's the weather in Goa?

Assistant:
HANDOFF -> WeatherAgent

Developer:
Conversation transferred from TriageAgent
to WeatherAgent.

WeatherAgent:
...
```

The next agent receives this history.

This is how context is preserved.

---

# 24. Handoff Logs

We also maintain:

```typescript
const handoffLogs: Array<{
  from: string;
  to: string;
  reason: string;
}> = [];
```

This is different from `messageHistory`.

### `messageHistory`

Contains the conversation/runtime trajectory.

### `handoffLogs`

Contains structured information about agent transfers.

Example:

```typescript
[
  {
    from: "TriageAgent",
    to: "WeatherAgent",
    reason: "Query requires weather specialist."
  }
]
```

This is useful for:

* debugging
* observability
* analytics
* tracing
* auditing

---

# 25. The Handoff Loop

The swarm uses:

```typescript
for (
  let handoffCount = 0;
  handoffCount <= this.maxHandoffs;
  handoffCount++
)
```

Each iteration executes the current agent.

Conceptually:

```text
while handoffs remain:

    run current agent

    if OUTPUT:
        finish

    if HANDOFF:
        switch agent

    continue
```

---

# 26. Running the Current Agent

Inside the loop:

```typescript
const outcome = await currentAgent.run(
  query,
  messageHistory
);
```

This connects Chapter 5 to Chapter 4.

The swarm does not implement the internal ReAct loop.

Instead:

```text
AgentSwarm
    |
    v
Agent.run()
    |
    ├── Input Guardrails
    ├── LLM
    ├── Tool Execution
    ├── Output Guardrails
    └── Handoff Detection
```

The swarm is the **orchestration layer** above the individual agent.

---

# 27. Updating the History

After the agent finishes:

```typescript
messageHistory = outcome.history;
```

This is important because the agent may have added:

* user messages
* assistant messages
* developer tool results
* handoff-related information

The swarm keeps that updated history for the next agent.

---

# 28. Handling Final Output

If:

```typescript
outcome.type === "OUTPUT"
```

the workflow is complete.

The swarm returns:

```typescript
return {
  completedBy: currentAgent.name,
  finalOutput: outcome.output || "",
  messageHistory,
  handoffLogs,
};
```

For example:

```typescript
{
  completedBy: "WeatherAgent",
  finalOutput: "The weather in Goa is...",
  messageHistory: [...],
  handoffLogs: [
    {
      from: "TriageAgent",
      to: "WeatherAgent",
      reason: "Query requires weather specialist."
    }
  ]
}
```

---

# 29. Handling a Handoff

If the current agent returns:

```typescript
{
  type: "HANDOFF",
  handoffPayload: {
    targetAgent: "WeatherAgent",
    reason: "Query requires weather specialist."
  }
}
```

the swarm extracts:

```typescript
const {
  targetAgent,
  reason,
} = outcome.handoffPayload;
```

Now the swarm knows:

```text
Current agent:
TriageAgent

Target agent:
WeatherAgent

Reason:
Query requires weather specialist.
```

---

# 30. Recording the Handoff

The swarm stores:

```typescript
handoffLogs.push({
  from: currentAgent.name,
  to: targetAgent,
  reason,
});
```

This creates an audit trail.

For example:

```text
TriageAgent
    |
    | "Query requires weather specialist."
    v
WeatherAgent
```

The structured log is:

```typescript
{
  from: "TriageAgent",
  to: "WeatherAgent",
  reason: "Query requires weather specialist."
}
```

---

# 31. Finding the Target Agent

The swarm looks up the target:

```typescript
const nextAgent =
  this.agents.get(targetAgent);
```

Because agents are stored in a `Map`, this is straightforward.

---

# 32. Handling Unknown Agents

What if the LLM requests:

```text
FinanceAgent
```

but the swarm only contains:

```text
TriageAgent
WeatherAgent
MathAgent
DevOpsAgent
```

Then:

```typescript
const nextAgent =
  this.agents.get("FinanceAgent");
```

returns:

```typescript
undefined
```

The swarm throws:

```typescript
throw new Error(
  `Handoff failed: Target agent '${targetAgent}' requested by '${currentAgent.name}' is not registered in Swarm.`
);
```

This is an important safety check.

The LLM cannot magically create or access arbitrary agents.

Only registered agents can receive control.

---

# 33. Preserving Context During Handoff

Once the target agent is found, the swarm adds a developer message:

```typescript
messageHistory.push({
  role: "developer",
  content:
    `System Context: Conversation transferred from Agent '${currentAgent.name}' to Agent '${targetAgent}'. Reason: ${reason}`,
});
```

For example:

```text
System Context:
Conversation transferred from Agent
'TriageAgent' to Agent 'WeatherAgent'.

Reason:
Query requires weather specialist.
```

This gives the next agent explicit information about the transition.

---

# 34. Switching the Current Agent

Finally:

```typescript
currentAgent = nextAgent;
```

Before:

```text
currentAgent = TriageAgent
```

After:

```text
currentAgent = WeatherAgent
```

The loop then starts another iteration.

```text
WeatherAgent.run(...)
```

---

# 35. Complete Handoff Flow

The entire process now looks like this:

```text
User
 |
 v
AgentSwarm
 |
 v
TriageAgent
 |
 | HANDOFF
 | target = WeatherAgent
 v
AgentSwarm
 |
 | save handoff log
 | preserve history
 | inject transition context
 v
WeatherAgent
 |
 | TOOL_REQUEST
 v
fetchWeatherInfo
 |
 v
WeatherAgent
 |
 | OUTPUT
 v
AgentSwarm
 |
 v
User
```

---

# 36. Context Preservation

Context preservation is one of the most important features of this architecture.

Suppose the user says:

```text
"What's the weather in Goa?"
```

The TriageAgent determines:

```text
HANDOFF -> WeatherAgent
```

The history might look conceptually like:

```text
1. user
   What's the weather in Goa?

2. assistant
   {
     "step": "HANDOFF",
     "targetAgent": "WeatherAgent",
     "reason": "Query requires weather specialist."
   }

3. developer
   System Context:
   Conversation transferred from Agent
   'TriageAgent' to Agent 'WeatherAgent'.
```

Then:

```typescript
WeatherAgent.run(
  query,
  messageHistory
);
```

receives that history.

The WeatherAgent therefore does not start from an empty conversation.

---

# 37. Why We Pass the Same Query Again

Notice this:

```typescript
currentAgent.run(
  query,
  messageHistory
);
```

The original query is passed to every agent.

At first this may look redundant.

But the `Agent` implementation checks whether the query is already the last user message:

```typescript
if (
  !lastMsg ||
  lastMsg.content !== query ||
  lastMsg.role !== "user"
) {
  // add user message
}
```

Therefore the query will not be duplicated unnecessarily.

This allows every agent to know the original user request while still preserving the previous trajectory.

---

# 38. Example Multi-Agent Setup

A typical application can create agents like:

```typescript
const triageAgent = Agent
  .builder("TriageAgent")
  .setInstructions(`
    You are the main routing agent.

    Route weather questions to WeatherAgent.
    Route mathematical questions to MathAgent.
    Route CLI questions to DevOpsAgent.
  `)
  .tool(
    createHandoffTool(
      "WeatherAgent",
      "Use for weather-related requests."
    )
  )
  .tool(
    createHandoffTool(
      "MathAgent",
      "Use for mathematical requests."
    )
  )
  .tool(
    createHandoffTool(
      "DevOpsAgent",
      "Use for CLI and infrastructure requests."
    )
  )
  .build();
```

Then:

```typescript
const weatherAgent = Agent
  .builder("WeatherAgent")
  .setInstructions(`
    You are a weather specialist.
    Use weather tools when required.
  `)
  .build();
```

And:

```typescript
const mathAgent = Agent
  .builder("MathAgent")
  .setInstructions(`
    You are a mathematics specialist.
    Solve mathematical problems accurately.
  `)
  .build();
```

Finally:

```typescript
const devOpsAgent = Agent
  .builder("DevOpsAgent")
  .setInstructions(`
    You are a DevOps specialist.
    Execute CLI operations safely.
  `)
  .build();
```

---

# 39. Creating the Swarm

Now register them:

```typescript
const swarm = new AgentSwarm();

swarm
  .registerAgent(triageAgent)
  .registerAgent(weatherAgent)
  .registerAgent(mathAgent)
  .registerAgent(devOpsAgent)
  .setDefaultAgent("TriageAgent")
  .setMaxHandoffs(5);
```

The architecture is now:

```text
AgentSwarm
│
├── TriageAgent
│   ├── transferTo_WeatherAgent
│   ├── transferTo_MathAgent
│   └── transferTo_DevOpsAgent
│
├── WeatherAgent
│
├── MathAgent
│
└── DevOpsAgent
```

---

# 40. Running the Swarm

Now the caller only needs:

```typescript
const result = await swarm.run(
  "What's the weather in Goa?"
);
```

The swarm handles the rest.

Expected workflow:

```text
User
 |
 v
TriageAgent
 |
 | HANDOFF
 v
WeatherAgent
 |
 | OUTPUT
 v
Result
```

---

# 41. Example Result

The returned result follows `SwarmRunResult`:

```typescript
{
  completedBy: "WeatherAgent",

  finalOutput:
    "The weather information for Goa is...",

  messageHistory: [
    // complete conversation trajectory
  ],

  handoffLogs: [
    {
      from: "TriageAgent",
      to: "WeatherAgent",
      reason: "Query requires weather specialist."
    }
  ]
}
```

This gives the application both the final answer and useful execution metadata.

---

# 42. Multi-Hop Handoffs

The architecture also supports multiple transfers.

For example:

```text
User
 |
 v
TriageAgent
 |
 v
SupportAgent
 |
 v
BillingAgent
 |
 v
PaymentAgent
 |
 v
OUTPUT
```

Every transfer updates:

```typescript
currentAgent
messageHistory
handoffLogs
```

So the swarm can support workflows more complex than a simple router → specialist pattern.

---

# 43. Handoff Limit Protection

Multi-agent systems can accidentally create loops.

For example:

```text
TriageAgent
    |
    v
MathAgent
    |
    v
TriageAgent
    |
    v
MathAgent
    |
    v
...
```

The swarm protects against this with:

```typescript
maxHandoffs
```

After the configured limit is exceeded:

```typescript
throw new Error(
  `AgentSwarm exceeded MAX_HANDOFFS limit of ${this.maxHandoffs}.`
);
```

This protects against:

* routing loops
* broken agent instructions
* incorrect LLM decisions
* unexpected workflows
* uncontrolled API usage

---

# 44. Handoff Tool vs Swarm

It is important to understand their responsibilities.

### Handoff Tool

The handoff tool says:

> "I want to transfer control to WeatherAgent."

It produces:

```json
{
  "status": "HANDOFF_TRIGGERED",
  "targetAgent": "WeatherAgent",
  "reason": "..."
}
```

### Agent

The Agent detects that result and returns:

```typescript
{
  type: "HANDOFF",
  handoffPayload: {
    targetAgent: "WeatherAgent",
    reason: "..."
  }
}
```

### AgentSwarm

The swarm performs the actual transfer:

```text
Agent A
   |
   | HANDOFF
   v
AgentSwarm
   |
   | lookup target
   | preserve history
   | record log
   v
Agent B
```

This separation keeps the architecture clean.

---

# 45. Why `AgentSwarm` Should Not Execute Tools

A common architectural mistake would be to put tool execution inside the swarm.

For example:

```text
AgentSwarm
 ├── LLM calls
 ├── Tool execution
 ├── Guardrails
 ├── Handoffs
 └── History
```

This makes the orchestrator responsible for too much.

Our architecture instead separates responsibilities:

```text
Agent
├── LLM interaction
├── Tools
├── Guardrails
├── Interceptors
└── Agent-level execution

AgentSwarm
├── Agent registration
├── Agent selection
├── Handoffs
├── Context preservation
└── Swarm-level execution tracking
```

This makes the system easier to maintain.

---

# 46. End-to-End Architecture

At this point our SDK has a layered architecture:

```text
                         USER
                           |
                           v
                    ┌─────────────┐
                    │ AgentSwarm  │
                    └──────┬──────┘
                           |
                           v
                    ┌─────────────┐
                    │ TriageAgent │
                    └──────┬──────┘
                           |
                    ┌──────┴──────┐
                    |             |
                 HANDOFF       OUTPUT
                    |
                    v
             ┌───────────────┐
             │ Specialized   │
             │ Agent         │
             └───────┬───────┘
                     |
               ┌─────┴─────┐
               |           |
             TOOL       OUTPUT
               |
               v
          Tool Executor
               |
               v
        Developer Message
               |
               v
        Agent continues
               |
               v
             OUTPUT
```

---

# 47. Important Implementation Notes

The current implementation is intentionally simple and educational. Before using it in production, several improvements should be considered.

## 47.1 Handoff Limit Semantics

The loop currently uses:

```typescript
handoffCount <= this.maxHandoffs
```

This means the number of agent execution iterations is one greater than the configured handoff count.

If you want the variable to represent **exactly** the number of allowed transfers, production code should explicitly track handoffs separately.

For example:

```typescript
let handoffCount = 0;

while (true) {
  const outcome = await currentAgent.run(
    query,
    messageHistory
  );

  if (outcome.type === "OUTPUT") {
    // finish
  }

  if (outcome.type === "HANDOFF") {
    handoffCount++;

    if (handoffCount > this.maxHandoffs) {
      throw new Error("Maximum handoffs exceeded.");
    }

    // switch agent
  }
}
```

This makes the semantics clearer.

---

## 47.2 Validate Target Agent Names

The swarm already checks whether the target exists:

```typescript
this.agents.get(targetAgent)
```

But production systems may also want to validate:

* allowed target agents
* maximum routing depth
* whether the current agent is allowed to hand off to the target
* whether circular routing is permitted

For example:

```text
MathAgent
   X
   |
   └──> DevOpsAgent
```

You might intentionally prevent certain transfers.

---

## 47.3 Handoff Authorization

A more advanced architecture could define:

```typescript
allowedHandoffs
```

For example:

```text
TriageAgent
 ├── WeatherAgent ✓
 ├── MathAgent ✓
 └── DevOpsAgent ✓

WeatherAgent
 └── MathAgent ✗
```

This prevents arbitrary agent-to-agent transfers.

---

## 47.4 Context Size

Every handoff carries conversation history.

If the conversation becomes large:

```text
Agent A
   |
   v
Agent B
   |
   v
Agent C
   |
   v
Agent D
```

the same history can become increasingly expensive to send to the LLM.

A production implementation may eventually need:

* history trimming
* summarization
* context windows
* state stores
* selective context transfer

Instead of sending everything, an agent might receive:

```text
Original User Request
+
Relevant Tool Results
+
Previous Agent Summary
+
Handoff Reason
```

---

## 47.5 Handoff Logs and Observability

The existing:

```typescript
handoffLogs
```

are a good starting point.

A production SDK could eventually track:

```text
agent
model
startTime
endTime
tokens
toolCalls
handoffs
errors
latency
cost
```

This would allow developers to inspect the entire swarm execution.

---

# 48. Important Concept: Context vs Control

One of the most useful concepts in multi-agent systems is:

> **Context can be shared while control changes.**

For example:

```text
Context:
"What's the weather in Goa?"

Control:
TriageAgent
     ↓
WeatherAgent
```

The conversation context remains available.

But the agent responsible for execution changes.

This gives us:

```text
Shared Context
      +
Specialized Control
      =
Multi-Agent Collaboration
```

---

# 49. Verification

First compile the entire project:

```bash
npm run build
```

If the build succeeds, TypeScript should produce the compiled files under:

```text
dist/
```

You should now have something similar to:

```text
agent-sdk-advanced/
├── src/
│   ├── agent.ts
│   ├── builder.ts
│   ├── config.ts
│   ├── swarm.ts
│   ├── types.ts
│   │
│   ├── guardrails/
│   │   ├── securityGuardrail.ts
│   │   ├── cliSafetyGuardrail.ts
│   │   ├── topicGuardrail.ts
│   │   ├── piiRedactionGuardrail.ts
│   │   └── contentSafetyGuardrail.ts
│   │
│   ├── interceptors/
│   │   └── loggerInterceptor.ts
│   │
│   └── tools/
│       └── handoffTool.ts
│
└── dist/
```

---

# 50. Basic Handoff Tool Test

You can test the generated tool independently:

```typescript
import { createHandoffTool } from "./src/tools/handoffTool.js";

const tool = createHandoffTool(
  "WeatherAgent",
  "Handles weather queries."
);

console.log(tool.name);

console.log(
  tool.executor(
    "The user asked for weather information."
  )
);
```

Expected tool name:

```text
transferTo_WeatherAgent
```

Expected result:

```json
{
  "status": "HANDOFF_TRIGGERED",
  "targetAgent": "WeatherAgent",
  "reason": "The user asked for weather information."
}
```

---

# 51. Basic Swarm Registration Test

A simple test can verify registration:

```typescript
const swarm = new AgentSwarm();

swarm
  .registerAgent(triageAgent)
  .registerAgent(weatherAgent)
  .registerAgent(mathAgent)
  .setDefaultAgent("TriageAgent");

console.log("Swarm configured successfully.");
```

Then run:

```bash
npm run build
```

---

# 52. Chapter 5 Mental Model

The easiest way to remember this chapter is:

```text
Agent
=
Does the work

Handoff Tool
=
Requests a transfer

AgentSwarm
=
Decides who runs next

Message History
=
Preserves context

Handoff Logs
=
Tracks transfers

Max Handoffs
=
Prevents routing loops
```

Or even more simply:

```text
          Agent
       "I need help"
             |
             v
      Handoff Tool
       "Transfer me"
             |
             v
       AgentSwarm
       "Who is next?"
             |
             v
       Target Agent
       "I'll handle it"
```

---

# 53. Final Architecture After Chapter 5

Our SDK has now evolved from a single-agent runtime into a multi-agent orchestration system:

```text
                    ┌──────────────────┐
                    │      User        │
                    └────────┬─────────┘
                             |
                             v
                    ┌──────────────────┐
                    │   AgentSwarm     │
                    └────────┬─────────┘
                             |
                             v
                    ┌──────────────────┐
                    │   TriageAgent    │
                    └────────┬─────────┘
                             |
             ┌───────────────┼───────────────┐
             |               |               |
             v               v               v
      WeatherAgent      MathAgent       DevOpsAgent
             |               |               |
             v               v               v
          Tools           Tools           Tools
             |               |               |
             └───────────────┼───────────────┘
                             |
                             v
                    ┌──────────────────┐
                    │   Final Output   │
                    └──────────────────┘
```

The complete execution model is:

```text
User Query
    ↓
AgentSwarm
    ↓
Default/Triage Agent
    ↓
Input Guardrails
    ↓
LLM Reasoning
    ↓
Tool / Handoff / Output
    ↓
If Handoff
    ↓
Preserve Context
    ↓
Switch Agent
    ↓
Repeat
    ↓
Output Guardrails
    ↓
Final Result
```

---

# 54. Chapter 5 Checklist

Before moving forward, make sure you understand:

* [x] What an Agent Swarm is
* [x] Why specialized agents are useful
* [x] How `createHandoffTool()` works
* [x] Why the handoff tool returns structured JSON
* [x] How `Agent` detects `HANDOFF_TRIGGERED`
* [x] How `AgentSwarm` registers agents
* [x] How the default agent is selected
* [x] How agent lookup works using `Map`
* [x] How handoffs are recorded
* [x] How conversation history is preserved
* [x] How transition context is injected
* [x] How the current agent changes
* [x] How unknown target agents are rejected
* [x] Why maximum handoffs are necessary
* [x] How multiple handoffs can form a workflow
* [x] The difference between context and control

---

# 55. What's Next?

At the end of Chapter 5, the SDK can now coordinate multiple specialized agents.

We have:

```text
Chapter 0
Foundation
    ↓
Chapter 1
System Prompt / Harness
    ↓
Chapter 2
Agent Builder
    ↓
Chapter 3
Guardrails + Interceptors
    ↓
Chapter 4
Core Agent Runtime
    ↓
Chapter 5
Multi-Agent Swarm + Handoffs
```

The next step is to build the **Tool Suite and Demonstration Suite**.

In Chapter 6, we can bring the architecture together with real tools such as:

```text
Weather Tool
Math Tool
CLI Tool
Knowledge/Search Tool
Handoff Tools
```

and then create a complete demonstration showing:

```text
User
 ↓
TriageAgent
 ↓
Specialized Agent
 ↓
Tool
 ↓
Result
 ↓
Guardrails
 ↓
Final Response
```

At that point, the project becomes a complete end-to-end demonstration of the Advanced Agent SDK.

