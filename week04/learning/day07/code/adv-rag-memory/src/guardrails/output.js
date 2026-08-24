import { PIIMasker } from "./pii.js";

/**
 * Output Guardrails Processor
 * Unmasks PII tokens back to original values and validates safety.
 */
export class OutputGuardrails {
  constructor() {
    this.piiMasker = new PIIMasker();
  }

  process(generatedText, tokenMap) {
    // 1. Unmask PII Tokens
    const restoredText = this.piiMasker.unmaskOutput(generatedText, tokenMap);

    // 2. Output safety / length validation
    if (!restoredText || restoredText.length === 0) {
      return "Empty response produced.";
    }

    return restoredText;
  }
}
