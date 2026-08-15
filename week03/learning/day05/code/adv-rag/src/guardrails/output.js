import { unmaskPII } from "./pii.js";

/**
 * Applies safety checks and restores anonymized PII tokens on generated output responses.
 */
export function outputGuardrails(answer, piiMap = {}, user = {}) {
  if (!answer) {
    return "I am unable to provide a response at this time.";
  }

  // 1. Unmask PII Tokens back to original values
  let restoredAnswer = unmaskPII(answer, piiMap);

  // 2. Safety & Toxic Content Check
  if (restoredAnswer.includes("[BLOCKED_CONTENT]")) {
    return "The generated response contained restricted safety violations and was suppressed.";
  }

  return restoredAnswer;
}
