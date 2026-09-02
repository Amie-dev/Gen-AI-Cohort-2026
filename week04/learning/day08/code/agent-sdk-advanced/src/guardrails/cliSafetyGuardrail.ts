import { GuardrailResult, IInputGuardrail } from "../types.js";

const DANGEROUS_COMMAND_PATTERNS = [
  /\brm\s+-[rf]{1,2}\b/i,
  /\bsudo\b/i,
  /\bmkfs\b/i,
  /\bdd\b/i,
  /\bchmod\s+777\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /:()\{\s*:\|:&\s*\};:/, // Fork bomb
];

export const cliSafetyGuardrail: IInputGuardrail = {
  name: "CLISafetyGuardrail",
  validate(input: string, agentName: string): GuardrailResult {
    for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
      if (pattern.test(input)) {
        return {
          passed: false,
          reason: `CLI Safety Guardrail triggered for agent '${agentName}': Destructive shell command pattern detected in "${input}".`,
        };
      }
    }
    return { passed: true };
  },
};
