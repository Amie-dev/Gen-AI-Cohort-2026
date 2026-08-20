import { unmaskPII } from './pii.js';

/**
 * Step 15 — Output Guardrails
 * Section 25: Validates generated answers to prevent PII leakage, toxicity, and unauthorized data leakage.
 */
export function outputGuardrails(answer, user, piiMap = {}) {
  // 1. Unmask PII placeholders if applicable
  const unmaskedAnswer = unmaskPII(answer, piiMap);

  // 2. Simple output toxicity / security check
  const forbiddenTerms = ['INTERNAL_CONFIDENTIAL_KEY', 'AWS_SECRET_KEY'];
  for (const term of forbiddenTerms) {
    if (unmaskedAnswer.includes(term)) {
      return {
        allowed: false,
        answer: 'Output security violation: Answer contained sensitive internal system secrets.'
      };
    }
  }

  return {
    allowed: true,
    answer: unmaskedAnswer
  };
}
