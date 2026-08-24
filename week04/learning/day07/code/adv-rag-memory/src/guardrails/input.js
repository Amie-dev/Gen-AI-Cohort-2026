import { PIIMasker } from "./pii.js";
import { PromptInjectionDetector } from "./injection.js";

/**
 * Input Guardrails Master Processor
 * Performs PII Masking, Prompt Injection Detection, and Auth/ACL Verification.
 */
export class InputGuardrails {
  constructor() {
    this.piiMasker = new PIIMasker();
  }

  process(rawQuery, userContext = {}) {
    // 1. Authorization check
    if (!userContext.userId) {
      throw new Error("Unauthorized: Missing userId context.");
    }

    // 2. Prompt Injection check
    const injectionCheck = PromptInjectionDetector.checkInjection(rawQuery);
    if (injectionCheck.isMalicious) {
      throw new Error(`Security Violation: Malicious prompt injection pattern detected (${injectionCheck.matchedPattern}).`);
    }

    // 3. PII Masking
    const { sanitizedText, maskedCount, tokenMap } = this.piiMasker.maskInput(rawQuery);

    return {
      cleanQuery: sanitizedText,
      maskedCount,
      tokenMap,
      isValid: true,
    };
  }
}
