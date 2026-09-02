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
