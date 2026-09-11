# 📚 Implementation Guide Overview — Week 07 Day 13

Welcome to the **Day 13 Implementation Guide**. This guide accompanies the codebase and provides in-depth technical chapters on Inngest workflows.

---

## 📑 Chapters Index

1. 📖 **[Chapter 01 — Inngest Engine Architecture & SDK Setup](file:///home/aminul/development/gen-ai-cohort/week07/learning/day13/code/implementation%20guide/chapter-01-inngest-architecture-and-client.md)**
   - Event bus architecture, webhook middleware, and client initialization.

2. 📖 **[Chapter 02 — Procedural Code vs. Durable Execution](file:///home/aminul/development/gen-ai-cohort/week07/learning/day13/code/implementation%20guide/chapter-02-procedural-vs-durable-execution.md)**
   - Monolithic HTTP failures vs durable step resumption and state persistence.

3. 📖 **[Chapter 03 — Steps API & Memoization Mechanics](file:///home/aminul/development/gen-ai-cohort/week07/learning/day13/code/implementation%20guide/chapter-03-steps-api-and-memoization.md)**
   - `step.run`, `step.sleep`, `step.invoke`, `step.sendEvent`, and re-hydration rules.

4. 📖 **[Chapter 04 — Parallel Agents & Human-in-the-Loop Signals](file:///home/aminul/development/gen-ai-cohort/week07/learning/day13/code/implementation%20guide/chapter-04-human-in-the-loop-and-parallel-agents.md)**
   - Fan-Out / Fan-In aggregation and `step.waitForEvent` signal matching.

5. 📖 **[Chapter 05 — Concurrency, Rate Limiting & Failure Recovery](file:///home/aminul/development/gen-ai-cohort/week07/learning/day13/code/implementation%20guide/chapter-05-concurrency-and-error-resilience.md)**
   - Per-tenant concurrency limits, throttling, retries, and `onFailure` hook.
