/**
 * Guardrails.js — Security & Quality Pipeline
 * Handles Input PII Masking, Prompt Injection Detection, and Output PII Unmasking.
 */

export class Guardrails {
  constructor() {
    this.piiMap = new Map(); // token -> original value
    this.tokenCounter = 0;
  }

  /**
   * Sanitizes input text by masking sensitive PII (emails, phone numbers, API keys)
   */
  processInput(rawQuery) {
    let sanitized = rawQuery;
    
    // 1. Email Masking
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    sanitized = sanitized.replace(emailRegex, (match) => {
      this.tokenCounter++;
      const token = `[PII_EMAIL_${this.tokenCounter}]`;
      this.piiMap.set(token, match);
      return token;
    });

    // 2. Phone Number Masking
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    sanitized = sanitized.replace(phoneRegex, (match) => {
      this.tokenCounter++;
      const token = `[PII_PHONE_${this.tokenCounter}]`;
      this.piiMap.set(token, match);
      return token;
    });

    // 3. Secret / API Key Masking
    const apiKeyRegex = /(sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{30,})/g;
    sanitized = sanitized.replace(apiKeyRegex, (match) => {
      this.tokenCounter++;
      const token = `[PII_SECRET_${this.tokenCounter}]`;
      this.piiMap.set(token, match);
      return token;
    });

    // 4. Prompt Injection Safety Check
    const injectionPatterns = [
      /ignore previous instructions/i,
      /system prompt override/i,
      /jailbreak/i,
    ];
    const isSuspicious = injectionPatterns.some((pattern) => pattern.test(sanitized));

    return {
      sanitizedQuery: sanitized,
      maskedCount: this.piiMap.size,
      isSuspicious,
    };
  }

  /**
   * Restores original PII values into final response payload
   */
  processOutput(generatedResponse) {
    let unmasked = generatedResponse;
    for (const [token, original] of this.piiMap.entries()) {
      unmasked = unmasked.replaceAll(token, original);
    }
    return unmasked;
  }
}
