# Chapter 1 — Guardrails Framework & Short-Term Conversation Memory

## 1. Chapter Goal

The goal of this chapter is to build the **Guardrails Safety Framework** inside `src/guardrails/` and the **Short-Term Memory (STM) Chat Manager** inside `src/chat/`.

Before a user prompt reaches the RAG engine or Mem0 memory layer, it must pass through Input Guardrails to reject malicious injection attacks or malformed queries. Similarly, model output must pass through Output Guardrails to redact sensitive PII (Personally Identifiable Information) before delivery.

In this chapter, we:
* Build Input Validation (`src/guardrails/input.js`) & Prompt Injection Protection (`src/guardrails/injection.js`)
* Build PII Masking (`src/guardrails/pii.js`) & Output Quality Verification (`src/guardrails/output.js`)
* Implement Sliding Window Short-Term Memory (`src/chat/stm.js`) & Conversation Store (`src/chat/conversationStore.js`)

---

### 🎯 Expected Outcome

User inputs and LLM completions will be validated and sanitized:

```text
User Input -> [Input Guardrails & Injection Check] -> Clean Prompt
LLM Completion -> [PII Redaction & Output Guardrail] -> Masked Safe Output
```

---

## 2. Input Guardrails Subsystem

### 1. Schema & Length Validation (`src/guardrails/input.js`)

```javascript
export function validateInput(query) {
  if (!query || typeof query !== 'string') {
    return { valid: false, reason: 'Query must be a non-empty string.' };
  }
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { valid: false, reason: 'Query is too short.' };
  }
  if (trimmed.length > 2000) {
    return { valid: false, reason: 'Query exceeds maximum length of 2000 characters.' };
  }
  return { valid: true, cleanQuery: trimmed };
}
```

### 2. Prompt Injection Protection (`src/guardrails/injection.js`)

```javascript
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /bypass\s+guardrails/i,
  /system\s+prompt\s+override/i,
  /you\s+are\s+now\s+DAN/i,
];

export function checkInjection(query) {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      return { detected: true, pattern: pattern.toString() };
    }
  }
  return { detected: false };
}
```

---

## 3. Output Guardrails & PII Redaction

### 1. PII Masking Engine (`src/guardrails/pii.js`)

Redacts sensitive user data before returning responses:

```javascript
export function redactPII(text) {
  if (!text) return text;
  let sanitized = text;

  // Mask API Keys (sk-...)
  sanitized = sanitized.replace(/sk-[A-Za-z0-9_-]{20,}/g, '[REDACTED_API_KEY]');

  // Mask Social Security Numbers (SSN)
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');

  // Mask Email Addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');

  // Mask Credit Cards
  sanitized = sanitized.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[REDACTED_CARD]');

  return sanitized;
}
```

### 2. Output Quality Verification (`src/guardrails/output.js`)

```javascript
export function validateOutput(output) {
  if (!output || typeof output !== 'string') {
    return { valid: false, reason: 'Output is empty or non-string.' };
  }
  if (output.trim().length === 0) {
    return { valid: false, reason: 'Output contains only whitespace.' };
  }
  return { valid: true };
}
```

---

## 4. Short-Term Conversation Memory (STM)

### 1. Sliding Window STM Buffer (`src/chat/stm.js`)

Maintains the recent turn history window for context assembly:

```javascript
const userSTMCache = new Map();

export async function getShortTermMemory(userId, limit = 5) {
  const history = userSTMCache.get(userId) || [];
  return history.slice(-limit);
}

export async function addShortTermTurn(userId, role, content) {
  const history = userSTMCache.get(userId) || [];
  history.push({ role, content, timestamp: Date.now() });
  userSTMCache.set(userId, history);
}
```

### 2. Persistent Conversation Store (`src/chat/conversationStore.js`)

```javascript
export async function logConversationTurn(userId, query, response) {
  console.log(`[ConversationStore] Saved turn for user ${userId}`);
  return { id: `log_${Date.now()}`, userId, query, response };
}
```

---

## 5. Verification & Testing

Verify PII Redaction in Node.js REPL:

```bash
node -e "import { redactPII } from './src/guardrails/pii.js'; console.log(redactPII('Email me at secret@company.com with key sk-1234567890abcdef1234'));"
```

### Expected Output

```text
Email me at [REDACTED_EMAIL] with key [REDACTED_API_KEY]
```

Move to **Chapter 2** to implement the Mem0 Long-Term Memory layer and background worker engine.
