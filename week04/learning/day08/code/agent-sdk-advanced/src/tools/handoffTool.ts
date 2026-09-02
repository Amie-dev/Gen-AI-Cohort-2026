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
