import { GuardrailResult, IInputGuardrail } from "../types.js";

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /bypass\s+(all\s+)?guardrails/i,
  /you\s+are\s+now\s+DAN/i,
  /system\s+prompt\s+override/i,
  /forget\s+your\s+rules/i,
];

export const securityGuardrail: IInputGuardrail = {
  name: "InputSecurityGuardrail",
  validate(input: string, agentName: string): GuardrailResult {
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return {
          passed: false,
          reason: `Security Guardrail triggered for agent '${agentName}': Potential prompt injection or rule override attempt detected.`,
        };
      }
    }
    return { passed: true };
  },
};
