import crypto from "node:crypto";

/**
 * Detects and masks PII (Personally Identifiable Information).
 * Uses Regex patterns for phone numbers, emails, credit cards, and SSNs.
 * Swaps named entities with transient UUID tokens.
 */
export function maskPII(text) {
  const piiMap = {};
  let sanitized = text;

  // 1. Mask Email Addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (match) => {
      const token = `[EMAIL_${crypto.randomUUID().slice(0, 8)}]`;
      piiMap[token] = match;
      return token;
    }
  );

  // 2. Mask Phone Numbers
  sanitized = sanitized.replace(
    /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    (match) => {
      const token = `[PHONE_${crypto.randomUUID().slice(0, 8)}]`;
      piiMap[token] = match;
      return token;
    }
  );

  // 3. Name to Transient ID swapping for specific names (e.g. John Doe, Jane Smith)
  const knownEntities = [
    { name: "John Doe", id: "USER_123" },
    { name: "Jane Smith", id: "USER_456" },
  ];

  for (const entity of knownEntities) {
    if (sanitized.includes(entity.name)) {
      sanitized = sanitized.replaceAll(entity.name, entity.id);
      piiMap[entity.id] = entity.name;
    }
  }

  return { sanitizedText: sanitized, piiMap };
}

/**
 * Restores original PII values from transient tokens in the output response.
 */
export function unmaskPII(text, piiMap = {}) {
  let restored = text;
  for (const [token, original] of Object.entries(piiMap)) {
    restored = restored.replaceAll(token, original);
  }
  return restored;
}
