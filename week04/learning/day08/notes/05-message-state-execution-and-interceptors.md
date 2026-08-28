# 📡 05 — Message State Execution & Interceptor Middleware

## 1. What is Message State Execution?

**Message State Execution** refers to how an Agent SDK orchestrates context evolution during autonomous multi-turn loops.

Rather than sending isolated prompts, the Agent SDK maintains a mutable message log (`messageHistory`) that continuously accumulates:
- User queries (`role: "user"`)
- Assistant intermediate thoughts, step decisions, and tool requests (`role: "assistant"`)
- Tool responses, outputs, and system feedback (`role: "developer"`)

```
                  +-----------------------------------+
                  |      MESSAGE HISTORY BUFFER       |
                  +-----------------------------------+
                  | 1. User: "Build a Node server"    |
                  | 2. Asst: {step: "THINK", ...}     |
                  | 3. Asst: {step: "TOOL_REQUEST"}   |
                  | 4. Dev:  {status: "success"}      |
                  | 5. Asst: {step: "OUTPUT", ...}    |
                  +-----------------------------------+
```

---

## 2. Interceptor Middleware Architecture

An **Interceptor** is an event handler hook attached to the agent lifecycle. Whenever a new message is added to `messageHistory`, all registered interceptors are synchronously triggered.

### Interceptor Signature

```typescript
export type Interceptor = (message: IMessage) => void;
```

---

## 3. Real-World Interceptor Implementations

### A. Terminal Logger Interceptor

```typescript
export const consoleLoggerInterceptor: Interceptor = (msg: IMessage) => {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
  console.log(`[${timestamp}] [${msg.role.toUpperCase()}] ${msg.content}`);
};
```

### B. Structured Telemetry & Metrics Interceptor

```typescript
export class MetricsInterceptor {
  private stepCount: number = 0;
  private toolCalls: number = 0;

  public getHandler(): Interceptor {
    return (msg: IMessage) => {
      this.stepCount++;
      if (msg.role === "developer" && msg.content.includes("functionName")) {
        this.toolCalls++;
      }
    };
  }

  public report() {
    return { stepCount: this.stepCount, toolCalls: this.toolCalls };
  }
}
```

---

## 4. Loop Protection & Execution Safety Guards

To prevent infinite execution loops caused by repeating tool failures or model confusion, the Agent SDK imposes two critical safety mechanisms:

1. **`MAX_LOOP` Bound**: Hard cap (e.g., 30 turns) after which execution halts with a fallback message.
2. **JSON Extraction Guard**: Defensive fallback if the LLM produces non-parseable JSON text.

```typescript
// JSON Extraction & Parsing Defensive Guard
private parseLLMResponse(rawText: string): any {
  try {
    return JSON.parse(rawText);
  } catch {
    // Attempt extracting JSON substring if raw text has leading/trailing characters
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Failed to parse LLM output as JSON: "${rawText}"`);
  }
}
```

---

## 5. Summary Key Takeaways

1. **Message State Execution** tracks every step of the agent's reasoning trajectory.
2. **Interceptors** decouple telemetry, logging, and audit tracking from core agent logic.
3. **Safety guards (`MAX_LOOP` & JSON regex extractors)** ensure production reliability and prevent unhandled crashes or infinite billing loops.
