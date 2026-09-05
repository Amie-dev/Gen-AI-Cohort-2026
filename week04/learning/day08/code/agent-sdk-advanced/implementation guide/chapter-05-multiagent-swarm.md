# Chapter 5 — Multi-Agent Swarm Orchestration & Handoffs

## 1. Chapter Goal

The goal of this chapter is to build the **`AgentSwarm` Orchestrator** inside `src/swarm.ts` and the **Handoff Tool Generator** inside `src/tools/handoffTool.ts`.

In enterprise applications, a single prompt or system instruction cannot effectively specialize in every domain (e.g. customer support, code execution, weather reports, financial calculations). The **Swarm Architecture** routes user requests to a primary triage agent, which dynamically delegates execution to specialized domain agents while maintaining context across transfers.

In this chapter, we:
* Build `createHandoffTool` generator (`src/tools/handoffTool.ts`)
* Build `AgentSwarm` orchestrator class (`src/swarm.ts`)
* Implement context preservation across multi-agent handoffs

---

### 🎯 Expected Outcome

`AgentSwarm` orchestrates multi-agent handoffs seamlessly:

```text
User Query -> TriageAgent -> [Handoff: targetAgent="WeatherAgent"] -> WeatherAgent -> Output
```

---

## 2. Implementing Handoff Tool Generator (`src/tools/handoffTool.ts`)

### File Path

```text
agent-sdk-advanced/src/tools/handoffTool.ts
```

### Code

```typescript
import { ITool } from "../types.js";

export function createHandoffTool(targetAgentName: string, description: string): ITool {
  return {
    name: `transferTo_${targetAgentName}`,
    description: `Transfers control to the specialized agent '${targetAgentName}'. ${description}`,
    doc: `transferTo_${targetAgentName}(reason: string): HandoffResult`,
    executor(input: string): string {
      return JSON.stringify({
        status: "HANDOFF_TRIGGERED",
        targetAgent: targetAgentName,
        reason: input || `Transfer requested to ${targetAgentName}`,
      });
    },
  };
}
```

---

## 3. Implementing `AgentSwarm` Orchestrator (`src/swarm.ts`)

### File Path

```text
agent-sdk-advanced/src/swarm.ts
```

### Code

```typescript
import { Agent } from "./agent.js";
import { IMessage, SwarmRunResult } from "./types.js";

export class AgentSwarm {
  private agents: Map<string, Agent> = new Map();
  private defaultAgentName?: string;
  private maxHandoffs: number = 5;

  constructor() {}

  public registerAgent(agent: Agent): this {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent with name '${agent.name}' is already registered in Swarm.`);
    }
    this.agents.set(agent.name, agent);
    if (!this.defaultAgentName) {
      this.defaultAgentName = agent.name;
    }
    return this;
  }

  public setDefaultAgent(agentName: string): this {
    if (!this.agents.has(agentName)) {
      throw new Error(`Cannot set default agent '${agentName}': Agent is not registered.`);
    }
    this.defaultAgentName = agentName;
    return this;
  }

  public setMaxHandoffs(limit: number): this {
    this.maxHandoffs = limit;
    return this;
  }

  public async run(query: string): Promise<SwarmRunResult> {
    if (!this.defaultAgentName || !this.agents.has(this.defaultAgentName)) {
      throw new Error("Swarm cannot run: No valid default agent registered.");
    }

    let currentAgent = this.agents.get(this.defaultAgentName)!;
    let messageHistory: IMessage[] = [];
    const handoffLogs: Array<{ from: string; to: string; reason: string }> = [];

    console.log(`\n🔀 [SWARM INITIALIZED] Starting workflow with default agent '${currentAgent.name}'`);

    for (let handoffCount = 0; handoffCount <= this.maxHandoffs; handoffCount++) {
      const outcome = await currentAgent.run(query, messageHistory);
      messageHistory = outcome.history;

      if (outcome.type === "OUTPUT") {
        console.log(`\x1b[32m✅ [SWARM COMPLETED] Final response delivered by '${currentAgent.name}'\x1b[0m\n`);
        return {
          completedBy: currentAgent.name,
          finalOutput: outcome.output || "",
          messageHistory,
          handoffLogs,
        };
      }

      if (outcome.type === "HANDOFF" && outcome.handoffPayload) {
        const { targetAgent, reason } = outcome.handoffPayload;

        console.log(
          `\x1b[33m🤝 [AGENT HANDOFF] '${currentAgent.name}' ➔ '${targetAgent}' | Reason: "${reason}"\x1b[0m`
        );

        handoffLogs.push({ from: currentAgent.name, to: targetAgent, reason });

        const nextAgent = this.agents.get(targetAgent);
        if (!nextAgent) {
          throw new Error(
            `Handoff failed: Target agent '${targetAgent}' requested by '${currentAgent.name}' is not registered in Swarm.`
          );
        }

        // Add developer note to history for contextual transition
        messageHistory.push({
          role: "developer",
          content: `System Context: Conversation transferred from Agent '${currentAgent.name}' to Agent '${targetAgent}'. Reason: ${reason}`,
        });

        currentAgent = nextAgent;
      }
    }

    throw new Error(`AgentSwarm exceeded MAX_HANDOFFS limit of ${this.maxHandoffs}.`);
  }
}
```

---

## 4. Context Preservation Mechanics

When control switches from `CurrentAgent` to `TargetAgent`:
1. The full conversation trajectory `messageHistory` is passed to `nextAgent.run(query, messageHistory)`.
2. A developer role transition message is injected into `messageHistory`:
   ```typescript
   messageHistory.push({
     role: "developer",
     content: `System Context: Conversation transferred from Agent '${currentAgent.name}' to Agent '${targetAgent}'. Reason: ${reason}`,
   });
   ```
3. The new agent receives the updated trajectory with full awareness of prior reasoning steps.

---

## 5. Verification & Testing

Verify `AgentSwarm` compilation:

```bash
npm run build
```

Move to **Chapter 6** to build the Tool Suite and complete Demonstration Suite.
