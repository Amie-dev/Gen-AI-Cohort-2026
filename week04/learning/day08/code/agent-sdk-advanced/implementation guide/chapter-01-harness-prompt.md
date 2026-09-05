# Chapter 1 — System Prompt Engineering & Extended Pipeline Harness

## 1. Chapter Goal

The goal of this chapter is to implement the extended **System Harness Prompt** (`HARNESS_PROMPT`) inside `src/config.ts`.

In advanced agentic systems, agents need to perform complex reasoning, execute tools, AND recognize when a task falls outside their specific domain expertise—triggering a seamless transfer of control (**Agent Handoff**) to another specialized agent.

In this chapter, we:
* Extend the cognitive pipeline to include the `HANDOFF` step state
* Define strict JSON output rules for model compliance
* Implement `src/config.ts`

---

### 🎯 Expected Outcome

`src/config.ts` will export `HARNESS_PROMPT`, forcing all agents in the framework to respond using structured JSON objects specifying operational steps.

```text
src/config.ts
    │
    └── export const HARNESS_PROMPT = `...`
```

---

## 2. ReAct Pipeline & Handoff Extensions

```text
+-----------------------------------------------------------------------------------+
|                        EXTENDED COGNITIVE PIPELINE                                |
+-----------------------------------------------------------------------------------+
|  1. INITIAL      --> Intention analysis & goal specification                      |
|  2. THINK        --> Problem breakdown, math, or strategy reasoning               |
|  3. TOOL_REQUEST --> Dispatch execution to a registered ITool                     |
|  4. ANALYSE      --> Evaluate tool output or interim reasoning                    |
|  5. HANDOFF      --> Transfer query to specialized agent (Swarm Routing)          |
|  6. OUTPUT       --> Return final answer to user (Exit Condition)                 |
+-----------------------------------------------------------------------------------+
```

---

## 3. Implementation of `src/config.ts`

### File Path

```text
agent-sdk-advanced/src/config.ts
```

### Code

```typescript
export const HARNESS_PROMPT = `
You are an expert AI agent operating inside an Agentic SDK.

You analyze user requests step-by-step using a structured ReAct pipeline with JSON responses:
Pipeline Steps: "INITIAL", "THINK", "TOOL_REQUEST", "ANALYSE", "HANDOFF", and "OUTPUT".

Pipeline Step Specifications:
- "INITIAL": State initial understanding of user intent.
- "THINK": Reason about sub-tasks, math, or strategy.
- "TOOL_REQUEST": Request execution of a registered tool.
    JSON Schema: { "step": "TOOL_REQUEST", "functionName": "<TOOL_NAME>", "input": "<INPUT_STRING>" }
- "ANALYSE": Reflect on tool execution results or interim steps.
- "HANDOFF": Transfer conversation to a specialized agent when query is outside your expertise.
    JSON Schema: { "step": "HANDOFF", "targetAgent": "<TARGET_AGENT_NAME>", "reason": "<REASON_FOR_TRANSFER>" }
- "OUTPUT": Final answer returned to the user.
    JSON Schema: { "step": "OUTPUT", "text": "<FINAL_ANSWER>" }

Rules:
1. Always output ONLY valid single JSON object per step.
2. Maintain strict JSON schema compliance.
3. Do not include markdown code block backticks inside raw response strings if possible.
`;
```

---

## 4. Deep Dive into Step JSON Schemas

### 1. Tool Request Schema
```json
{
  "step": "TOOL_REQUEST",
  "functionName": "fetchWeatherInfo",
  "input": "Goa"
}
```

### 2. Agent Handoff Schema
```json
{
  "step": "HANDOFF",
  "targetAgent": "WeatherAgent",
  "reason": "Query requests weather information outside GeneralAssistant domain."
}
```

### 3. Output Schema
```json
{
  "step": "OUTPUT",
  "text": "The current weather in Goa is sunny with 30°C."
}
```

---

## 5. Verification & Testing

Verify that `src/config.ts` compiles cleanly:

```bash
npx tsx -e "import { HARNESS_PROMPT } from './src/config.js'; console.log('Harness Prompt Length:', HARNESS_PROMPT.length);"
```

### Expected Output

```text
Harness Prompt Length: 1161
```

Now that the system harness prompt is configured, move to **Chapter 2** to implement the fluent `AgentBuilder`.
