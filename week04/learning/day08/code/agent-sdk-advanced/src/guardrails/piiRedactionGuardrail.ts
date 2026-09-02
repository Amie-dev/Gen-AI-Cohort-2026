import { GuardrailResult, IOutputGuardrail } from "../types.js";

export const piiRedactionGuardrail: IOutputGuardrail = {
  name: "PIIRedactionGuardrail",
  validate(output: string, _agentName: string): GuardrailResult {
    let sanitized = output;

    // Mask secret keys (sk-...)
    sanitized = sanitized.replace(/sk-[A-Za-z0-9_-]{20,}/g, "[REDACTED_API_KEY]");

    // Mask Email Addresses
    sanitized = sanitized.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[REDACTED_EMAIL]"
    );

    // Mask Credit Cards (16 digits)
    sanitized = sanitized.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, "[REDACTED_CARD_NUMBER]");

    if (sanitized !== output) {
      return {
        passed: true,
        modifiedContent: sanitized,
        reason: "Output contained sensitive PII or key data; masked automatically.",
      };
    }

    return { passed: true };
  },
};
