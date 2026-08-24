/**
 * PII Masking Engine
 * Replaces sensitive identifiers (emails, phones, API keys) with tokenized placeholders.
 */
export class PIIMasker {
  constructor() {
    this.tokenMap = new Map();
    this.counter = 0;
  }

  maskInput(text) {
    let sanitized = text;

    // Emails
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => {
      this.counter++;
      const token = `[PII_EMAIL_${this.counter}]`;
      this.tokenMap.set(token, match);
      return token;
    });

    // Phone numbers
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, (match) => {
      this.counter++;
      const token = `[PII_PHONE_${this.counter}]`;
      this.tokenMap.set(token, match);
      return token;
    });

    // Secrets / API keys
    sanitized = sanitized.replace(/(sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{30,})/g, (match) => {
      this.counter++;
      const token = `[PII_KEY_${this.counter}]`;
      this.tokenMap.set(token, match);
      return token;
    });

    return { sanitizedText: sanitized, maskedCount: this.tokenMap.size, tokenMap: this.tokenMap };
  }

  unmaskOutput(text, tokenMap) {
    let restored = text;
    const mapToUse = tokenMap || this.tokenMap;
    for (const [token, original] of mapToUse.entries()) {
      restored = restored.replaceAll(token, original);
    }
    return restored;
  }
}
