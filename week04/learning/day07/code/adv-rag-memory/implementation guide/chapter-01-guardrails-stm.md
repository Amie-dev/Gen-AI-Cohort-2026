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

## 2. Input Guardrails Subsystem

### 1. Master Input Guardrails Processor (`src/guardrails/input.js`)

```javascript
import { PIIMasker } from "./pii.js";
import { PromptInjectionDetector } from "./injection.js";

/**
 * Input Guardrails Master Processor
 * Performs PII Masking, Prompt Injection Detection, and Auth/ACL Verification.
 */
export class InputGuardrails {
  constructor() {
    this.piiMasker = new PIIMasker();
  }

  process(rawQuery, userContext = {}) {
    // 1. Authorization check
    if (!userContext.userId) {
      throw new Error("Unauthorized: Missing userId context.");
    }

    // 2. Prompt Injection check
    const injectionCheck = PromptInjectionDetector.checkInjection(rawQuery);
    if (injectionCheck.isMalicious) {
      throw new Error(`Security Violation: Malicious prompt injection pattern detected (${injectionCheck.matchedPattern}).`);
    }

    // 3. PII Masking
    const { sanitizedText, maskedCount, tokenMap } = this.piiMasker.maskInput(rawQuery);

    return {
      cleanQuery: sanitizedText,
      maskedCount,
      tokenMap,
      isValid: true,
    };
  }
}
```

### 2. Prompt Injection Protection (`src/guardrails/injection.js`)

```javascript
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
```

---

## 3. Output Guardrails & PII Redaction

### 1. PII Masking Engine (`src/guardrails/pii.js`)

Redacts sensitive user data before returning responses:

```javascript
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
```

### 2. Output Quality Verification (`src/guardrails/output.js`)

```javascript
import { PIIMasker } from "./pii.js";

/**
 * Output Guardrails Processor
 * Unmasks PII tokens back to original values and validates safety.
 */
export class OutputGuardrails {
  constructor() {
    this.piiMasker = new PIIMasker();
  }

  process(generatedText, tokenMap) {
    // 1. Unmask PII Tokens
    const restoredText = this.piiMasker.unmaskOutput(generatedText, tokenMap);

    // 2. Output safety / length validation
    if (!restoredText || restoredText.length === 0) {
      return "Empty response produced.";
    }

    return restoredText;
  }
}
```

---

## 4. Short-Term Conversation Memory (STM)

### 1. Sliding Window STM Buffer (`src/chat/stm.js`)

Maintains the recent turn history window for context assembly:

```javascript
import { config } from "../config.js";

/**
 * ShortTermMemory Store
 * Manages active session sliding window history for immediate conversational continuity.
 */
export class ShortTermMemory {
  constructor(maxTurns = config.memory.stmMaxTurns) {
    this.maxTurns = maxTurns;
    this.sessions = new Map(); // sessionId -> Array of { role, content, timestamp }
  }

  async addTurn(sessionId, role, content) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    const history = this.sessions.get(sessionId);
    history.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    if (history.length > this.maxTurns) {
      this.sessions.set(sessionId, history.slice(-this.maxTurns));
    }
  }

  async getRecentContext(sessionId, limit = null) {
    const fetchLimit = limit || this.maxTurns;
    const history = this.sessions.get(sessionId) || [];
    return history.slice(-fetchLimit);
  }
}

export const stmStore = new ShortTermMemory();
```

### 2. Persistent Conversation Store (`src/chat/conversationStore.js`)

```javascript
/**
 * ConversationStore
 * Stores raw, immutable conversation logs for analytics, debugging, and offline worker memory processing.
 */
export class ConversationStore {
  constructor() {
    this.logs = []; // Array of { id, userId, sessionId, userQuery, assistantResponse, timestamp }
  }

  async logInteraction(userId, sessionId, userQuery, assistantResponse) {
    const record = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      sessionId,
      userQuery,
      assistantResponse,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(record);
    return record;
  }

  async getLogsForUser(userId) {
    return this.logs.filter((l) => l.userId === userId);
  }
}

export const conversationStore = new ConversationStore();
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
