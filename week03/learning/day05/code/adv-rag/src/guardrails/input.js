import { maskPII } from "./pii.js";
import { detectJailbreak } from "./jailbreak.js";

/**
 * Validates, filters, and sanitizes incoming user queries before entering the RAG pipeline.
 */
export async function inputGuardrails(userQuery, user = {}) {
  // 1. Jailbreak & Prompt Injection Defense
  const jailbreakCheck = detectJailbreak(userQuery);
  if (jailbreakCheck.isJailbreak) {
    return {
      allowed: false,
      message: "⚠️ Request blocked: Potential prompt injection or security policy violation detected.",
    };
  }

  // 2. Policy & Competitor Attack Filter
  const lower = userQuery.toLowerCase();
  if (lower.includes("tell me bad things about apple") && !lower.includes("fruit")) {
    return {
      allowed: false,
      message: "⚠️ Request blocked: Competitor smear requests are not permitted by corporate policy.",
    };
  }

  // 3. PII Detection & Anonymization
  const { sanitizedText, piiMap } = maskPII(userQuery);

  return {
    allowed: true,
    sanitizedQuery: sanitizedText,
    piiMap,
  };
}
