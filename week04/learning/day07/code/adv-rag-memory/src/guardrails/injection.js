/**
 * Prompt Injection & Jailbreak Detection Module
 */
export class PromptInjectionDetector {
  static checkInjection(text) {
    const suspiciousPatterns = [
      /ignore all previous instructions/i,
      /disregard system prompt/i,
      /you are now DAN/i,
      /bypass security rules/i,
      /reveal system prompt/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        return { isMalicious: true, matchedPattern: pattern.toString() };
      }
    }

    return { isMalicious: false };
  }
}
