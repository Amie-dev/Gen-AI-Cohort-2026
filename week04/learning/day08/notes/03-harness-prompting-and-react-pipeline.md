# 🎯 03 — Harness Prompting & ReAct Pipeline

## 1. What is a Harness Prompt?

A **Harness Prompt** is a meta-system prompt injected by the Agent SDK around the user's custom instructions. Its primary function is to enforce a **deterministic reasoning pipeline** and strict **JSON output formats** on the underlying LLM.

Without a harness prompt, LLMs will emit conversational Markdown text, conversational tool explanations, or inconsistent function call structures that break automated parsing.

---

## 2. The 5-Stage Harness Pipeline

The Agent SDK enforces a structured state machine with 5 distinct reasoning steps:

```
+----------+     +----------+     +--------------+     +------------+     +------------+
| INITIAL  | --> |  THINK   | --> | TOOL_REQUEST | --> |  ANALYSE   | --> |   OUTPUT   |
| (Intent) |     | (Decomp) |     | (Invocation) |     | (Evaluate) |     | (Final Ans)|
+----------+     +----------+     +--------------+     +------------+     +------------+
     ^                                                          |
     +---------------------- Iterative Loop --------------------+
```

1. **`INITIAL`**: Recognize the overall user query and define the primary objective.
2. **`THINK`**: Break down the task into step-by-step sub-problems (e.g., using chain-of-thought or BODMAS ordering).
3. **`TOOL_REQUEST`**: Request an external tool execution by specifying `functionName` and `input`.
4. **`ANALYSE`**: Evaluate tool results or intermediate thoughts to verify correctness.
5. **`OUTPUT`**: Emit the final response to the user and terminate the execution loop.

---

## 3. Harness Prompt System Template

Below is the production harness prompt template used inside the SDK:

```typescript
export const HARNESS_PROMPT = `
You are an expert AI assistant system governed by an Agent Harness.

You must analyze user input carefully and break down complex problems step-by-step before arriving at the final output.

Execution Pipeline Stages:
- INITIAL: Identify user intent and state high-level goal.
- THINK: Deconstruct the problem into logical sub-tasks.
- TOOL_REQUEST: Request tool execution. Format: { "step": "TOOL_REQUEST", "functionName": "<name>", "input": "<arg>" }
- ANALYSE: Inspect tool output or step results to verify accuracy.
- OUTPUT: Emit the final answer to the user. This terminates execution.

STRICT JSON OUTPUT FORMAT:
Every output MUST be a valid, parseable JSON object adhering to this schema:
{
  "step": "INITIAL" | "THINK" | "TOOL_REQUEST" | "ANALYSE" | "OUTPUT",
  "text": "<reasoning text>",
  "functionName": "<optional tool name>",
  "input": "<optional tool arguments string or object>"
}

Rules:
1. Output ONLY ONE JSON object per step.
2. Do NOT wrap output in markdown fences (e.g., no \`\`\`json ... \`\`\`).
3. Follow JSON formatting strictly.
`;
```

---

## 4. ReAct Reasoning Walkthrough Example

### Task: "What is 2 + 2 - 5 * 10 / 3?"

```json
// Step 1: LLM returns
{
  "step": "INITIAL",
  "text": "The user wants me to calculate the mathematical expression 2 + 2 - 5 * 10 / 3."
}

// Step 2: LLM returns
{
  "step": "THINK",
  "text": "According to operator precedence (BODMAS), multiplication and division take priority. First, calculate 5 * 10 = 50."
}

// Step 3: LLM returns
{
  "step": "ANALYSE",
  "text": "Expression simplifies to 2 + 2 - 50 / 3."
}

// Step 4: LLM returns
{
  "step": "THINK",
  "text": "Now compute division 50 / 3 = 16.666667."
}

// Step 5: LLM returns
{
  "step": "ANALYSE",
  "text": "Expression simplifies to 2 + 2 - 16.666667 = 4 - 16.666667."
}

// Step 6: LLM returns
{
  "step": "OUTPUT",
  "text": "The result of 2 + 2 - 5 * 10 / 3 is -12.666667."
}
```

---

## 5. Summary Key Takeaways

1. **Harness Prompting** converts unpredictable text generation into a **predictable state machine**.
2. **Structured JSON Output** enables accurate program parsing by the Agent SDK runtime.
3. The **5-Stage Pipeline (`INITIAL` $\rightarrow$ `THINK` $\rightarrow$ `TOOL_REQUEST` $\rightarrow$ `ANALYSE` $\rightarrow$ `OUTPUT`)** forces deep reasoning and prevents hallucinated actions.
