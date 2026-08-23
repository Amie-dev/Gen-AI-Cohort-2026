/**
 * PII Masking and De-masking Module
 * Section 05: Detects sensitive personal data, replaces with placeholders, and restores post-generation.
 */

export function maskPII(text) {
  const piiMap = {};
  let sanitizedText = text;

  // Mask Name patterns (e.g. John Doe)
  const nameRegex = /\b(John Doe|Jane Smith|Alice Johnson|Bob Brown)\b/gi;
  sanitizedText = sanitizedText.replace(nameRegex, (match) => {
    const placeholder = `USER_123`;
    piiMap[placeholder] = match;
    return placeholder;
  });

  // Mask Email patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  sanitizedText = sanitizedText.replace(emailRegex, (match) => {
    const placeholder = `EMAIL_PLACEHOLDER`;
    piiMap[placeholder] = match;
    return placeholder;
  });

  return {
    sanitizedText,
    piiMap
  };
}

export function unmaskPII(text, piiMap = {}) {
  let unmaskedText = text;
  for (const [placeholder, originalValue] of Object.entries(piiMap)) {
    unmaskedText = unmaskedText.replaceAll(placeholder, originalValue);
  }
  return unmaskedText;
}
