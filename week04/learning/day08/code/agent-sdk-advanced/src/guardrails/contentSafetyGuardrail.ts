import { GuardrailResult, IOutputGuardrail } from "../types.js";

const HARMFUL_PATTERNS = [/top\s+secret\s+internal\s+data/i, /malicious\s+exploit/i];

export const contentSafetyGuardrail: IOutputGuardrail = {
  name: "OutputContentSafetyGuardrail",
  validate(output: string, agentName: string): GuardrailResult {
    for (const pattern of HARMFUL_PATTERNS) {
      if (pattern.test(output)) {
        return {
          passed: false,
          reason: `Content Safety Guardrail triggered for agent '${agentName}': Generated response violated safety standards.`,
        };
      }
    }
    return { passed: true };
  },
};
