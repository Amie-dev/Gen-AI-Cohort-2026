# 📚 Week 04 — Day 08 Master Notes

# Introduction to Agent SDK & Autonomous Agent Framework Architecture

> **Overview:** Day 08 focuses on building a **Custom Agent SDK / Framework from Scratch** in TypeScript/Node.js, introducing the **Agent Triad**, **Builder Pattern**, **Harness Pipeline**, **Tool Dispatch Engine**, and **Message State Execution with Interceptors**.

---

## 📑 Notes Structure & Links

### 🤖 Core Class Notes (`/notes/`)

1. 📄 **[01 — Introduction to Agent SDK & Architecture](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/notes/01-introduction-to-agent-sdk-and-architecture.md)**
   - Stateless LLM APIs vs. Stateful Agent SDKs
   - The Core Agent Triad: $\text{LLM Engine} + \text{Harness Prompt} + \text{Tools}$
   - Architecture Comparison & Message State Execution lifecycle.

2. 📄 **[02 — Builder Pattern & Agent Configuration](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/notes/02-builder-pattern-and-agent-configuration.md)**
   - `AgentBuilder` fluent interface design
   - Configuration management (instructions, tool registration, model name, max loop bounds)
   - Decoupling builder logic from agent execution engine.

3. 📄 **[03 — Harness Prompting & ReAct Pipeline](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/notes/03-harness-prompting-and-react-pipeline.md)**
   - Role of meta-system prompts (Harness Prompts)
   - 5-stage pipeline: `INITIAL` $\rightarrow$ `THINK` $\rightarrow$ `TOOL_REQUEST` $\rightarrow$ `ANALYSE` $\rightarrow$ `OUTPUT`
   - Enforcing strict JSON schema output and avoiding markdown hallucination.

4. 📄 **[04 — Tool Execution Engine & Registry](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/notes/04-tool-execution-engine-and-registry.md)**
   - `ITool` interface specification (`name`, `description`, `doc`, `executor`)
   - Schema auto-generation & dynamic prompt injection
   - Real-world tool implementations (Weather API, CLI executor) and error handling.

5. 📄 **[05 — Message State Execution & Interceptors](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/notes/05-message-state-execution-and-interceptors.md)**
   - `messageHistory` management (`user`, `assistant`, `developer`)
   - Event-driven Interceptor pattern (`attachInterceptor`, `notifyInterceptors`)
   - Safety guards (`MAX_LOOP`, JSON regex repair parser).

6. 📄 **[completed notes00.md — Single File Comprehensive Master Reference](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/notes/completed%20notes00.md)**
   - Complete unified deep-dive handbook combining concepts, diagrams, full codebase walkthrough, and interview QA.

---

## 🧪 Sample Code Directory (`/code/`)

All sample and production implementations are located in:
👉 **[day08 code directory](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/code)**

- 📁 **[agent-sdk-gemini/](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/code/agent-sdk-gemini)** — Custom Agent SDK powered by Google Gemini (`@google/generative-ai`).
- 📁 **[agent-sdk-complete/](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/code/agent-sdk-complete)** — Custom Agent SDK framework in TypeScript powered by OpenAI.
- 📁 **[agent-sdk-sir/](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/code/agent-sdk-sir)** — Instructor class reference project.
- 📁 **[agent-sdk/](file:///home/aminul/development/gen-ai-cohort/week04/learning/day08/code/agent-sdk)** — Starter agent SDK package.
