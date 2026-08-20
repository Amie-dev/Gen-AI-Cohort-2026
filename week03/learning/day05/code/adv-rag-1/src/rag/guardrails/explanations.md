# `src/rag/guardrails/` Directory Explanations

## Overview
The `src/rag/guardrails/` directory enforces security, data privacy, and compliance policies at both entry (Pre-Retrieval Input Guardrails) and exit (Post-Generation Output Guardrails) of the RAG pipeline.

Without guardrails, RAG systems are exposed to prompt injection attacks, PII data leakage to third-party LLM providers, and unauthorized output disclosure of internal secrets.

---

## Security Lifecycle & Sub-Module Matrix

```
[ Incoming Raw Query ]
          │
          ▼
   [ 1. input.js (Input Coordinator) ]
          ├──► detectJailbreak()  ──► Rejects prompt injection / DAN attacks
          ├──► maskPII()          ──► Replaces names/emails with token placeholders
          └──► User Auth Check    ──► Verifies account active status
          │
          ▼  (Sanitized Query + PII Token Map)
 [ RAG Translation, Retrieval & Generation ]
          │
          ▼  (Generated Answer String)
   [ 2. output.js (Output Coordinator) ]
          ├──► unmaskPII()        ──► Restores original user values into final answer
          └──► Leakage Check      ──► Scans for sensitive keys (e.g. AWS_SECRET_KEY)
          │
          ▼
 [ Final Safe User Answer ]
```

---

## Detailed Code & Pseudocode Implementations

### 1. PII Masking & De-Masking Module (`pii.js`)
Protects user privacy by masking PII before sending context/queries to LLM providers.

```javascript
/**
 * PII Masking & Unmasking Module Pseudocode
 */
export function maskPII(text) {
  const piiMap = {};
  let sanitizedText = text;

  // 1. Mask Names (e.g. John Doe -> USER_123)
  const nameRegex = /\b(John Doe|Jane Smith|Alice Johnson|Bob Brown)\b/gi;
  sanitizedText = sanitizedText.replace(nameRegex, (match) => {
    const placeholder = 'USER_123';
    piiMap[placeholder] = match;
    return placeholder;
  });

  // 2. Mask Emails (e.g. user@domain.com -> EMAIL_PLACEHOLDER)
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  sanitizedText = sanitizedText.replace(emailRegex, (match) => {
    const placeholder = 'EMAIL_PLACEHOLDER';
    piiMap[placeholder] = match;
    return placeholder;
  });

  return { sanitizedText, piiMap };
}

export function unmaskPII(text, piiMap = {}) {
  let unmaskedText = text;
  for (const [placeholder, originalValue] of Object.entries(piiMap)) {
    unmaskedText = unmaskedText.replaceAll(placeholder, originalValue);
  }
  return unmaskedText;
}
```

---

### 2. Jailbreak & Prompt Injection Detector (`jailbreak.js`)
Screens user queries against malicious patterns.

```javascript
/**
 * Jailbreak Pattern Detector Pseudocode
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
        reason: `Potential prompt injection detected matching pattern: "${pattern}"`
      };
    }
  }
  return { detected: false, reason: null };
}
```

---

### 3. Input Guardrails Coordinator (`input.js`)

```javascript
/**
 * Input Guardrails Coordinator Pseudocode
 */
import { maskPII } from './pii.js';
import { detectJailbreak } from './jailbreak.js';

export async function inputGuardrails(userQuery, user) {
  // 1. Prompt Injection Security Check
  const jailbreak = detectJailbreak(userQuery);
  if (jailbreak.detected) {
    return { allowed: false, message: `Security violation: ${jailbreak.reason}` };
  }

  // 2. PII Tokenization
  const { sanitizedText, piiMap } = maskPII(userQuery);

  // 3. User Restriction Check
  if (user && user.blocked) {
    return { allowed: false, message: 'Access denied: User account is restricted.' };
  }

  return { allowed: true, message: 'Allowed', sanitizedQuery: sanitizedText, piiMap };
}
```

---

### 4. Output Guardrails Coordinator (`output.js`)

```javascript
/**
 * Output Guardrails Coordinator Pseudocode
 */
import { unmaskPII } from './pii.js';

export function outputGuardrails(answer, user, piiMap = {}) {
  // 1. Unmask PII token placeholders back to original values
  const unmaskedAnswer = unmaskPII(answer, piiMap);

  // 2. Secret Leakage Verification
  const forbiddenTerms = ['INTERNAL_CONFIDENTIAL_KEY', 'AWS_SECRET_KEY'];
  for (const term of forbiddenTerms) {
    if (unmaskedAnswer.includes(term)) {
      return {
        allowed: false,
        answer: 'Output security violation: Generated response contained internal credentials.'
      };
    }
  }

  return { allowed: true, answer: unmaskedAnswer };
}
```
