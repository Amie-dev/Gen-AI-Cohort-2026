import { maskPII } from './pii.js';
import { detectJailbreak } from './jailbreak.js';

/**
 * Step 1 — Input Guardrails Coordinator
 * Section 04: Evaluates input query for PII, prompt injection, and policy compliance.
 */
export async function inputGuardrails(userQuery, user) {
  // 1. Jailbreak & Prompt Injection Check
  const jailbreakCheck = detectJailbreak(userQuery);
  if (jailbreakCheck.detected) {
    return {
      allowed: false,
      message: `Security violation: ${jailbreakCheck.reason}`,
      sanitizedQuery: null,
      piiMap: {}
    };
  }

  // 2. PII Masking
  const { sanitizedText, piiMap } = maskPII(userQuery);

  // 3. User Authorization & Policy Check
  if (user && user.blocked) {
    return {
      allowed: false,
      message: 'Access denied: User account is restricted.',
      sanitizedQuery: null,
      piiMap: {}
    };
  }

  return {
    allowed: true,
    message: 'Allowed',
    sanitizedQuery: sanitizedText,
    piiMap
  };
}
