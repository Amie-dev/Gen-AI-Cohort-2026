# Agent Architecture and Loop Engineering

Large Language Models (LLMs) are stateless text-completion systems. To build autonomous agents, we must build a system around them to enable reasoning, planning, memory, and actions.

---

## 🏛️ 1. What is an Agent?
An agent is a software architecture that delegates reasoning and decision-making to an LLM, operating inside a stateful loop with access to external tools:

$$\text{Agent} = \text{LLM Engine (Brain)} + \text{Loop Engineering (Control)} + \text{Tools (Actions)}$$

---

## 🔄 2. Loop Engineering
Loop engineering is the design of the state machine that keeps the agent active. The execution cycle relies on three phases: **Perceive**, **Decide**, and **Act**.

```
           ┌────────────── Perceive ──────────────┐
           ▼ (Receive User Query / Tool Results)   │
    ┌──────────────┐                               │
    │  LLM Engine  │                               │
    └──────┬───────┘                               │
           │ Decide (Determine Step / Action)      │
           ▼                                       │
    ┌──────────────┐                               │
    │ Tool Runner  │ ──────────────────────────────┘
    └──────────────┘ Act (Run executeCommandOnCli, getWeatherData, etc.)
```

### The State Sequence:
1. **Perceive**: The system feeds the user input (or feedback from a previous tool execution) into the LLM context.
2. **Decide**: The LLM determines the next state (e.g. `THINK`, `TOOL_REQUEST`, or `OUTPUT`).
3. **Act**: If a `TOOL_REQUEST` is decided, the runtime intercepts the JSON call, executes the tool function (e.g. fetch database, run shell command), and routes the result back to the LLM.

---

## 🛠️ 3. Harness Engineering (The GPT-4 Era)
Prompt engineering has evolved beyond writing simple paragraphs. Today, we practice **Harness Engineering**—designing full software architectures around LLMs:

1. **State Bounding**: Restricting LLM completions to structured JSON schemas so that parser logic can safely route tool execution requests.
2. **Infinite Loop Protection**: Implementing step counters inside the `while (true)` loop. If the agent fails to reach `OUTPUT` within 10-15 cycles, the runtime forces a termination to prevent runaway token costs.
3. **Dynamic Error Recovery**: Feeding runtime execution errors (e.g. `FileNotFoundException`) back to the model context. The model can then inspect the output, reformulate its plan, and retry using a corrected tool call.
