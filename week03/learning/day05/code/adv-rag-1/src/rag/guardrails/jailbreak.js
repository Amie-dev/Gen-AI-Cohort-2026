/**
 * Prompt Injection and Jailbreak Detector
 * Section 04: Protects system prompts against override attempts and malicious inputs.
 */

const SUSPICIOUS_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all prior instructions/i,
  /you are now DAN/i,
  /reveal system prompt/i,
  /bypass guardrails/i,
  /drop database/i,
  /system: override/i
];

export function detectJailbreak(query) {
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(query)) {
      return {
        detected: true,
        reason: `Potential prompt injection detected: matching pattern "${pattern}"`
      };
    }
  }

  return {
    detected: false,
    reason: null
  };
}
