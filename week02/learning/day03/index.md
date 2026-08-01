# 📂 Day 03: Building AI Agents & Multi-SDK Orchestration

This directory contains the study notes, code templates, assignments, and dashboard applications for **Week 02 — Day 03** of the Gen AI JS Cohort.

---

## 📋 Directory Contents

### 1. Study Notes
Located under **[notes/](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/)**:
* **[row-class.md](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/row-class.md)**: Main study notes guide and table of contents.
* **[01-ai-agent-architecture.md](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/01-ai-agent-architecture.md)**: Concept breakdown of AI Agents, system instructions, tools, guardrails, and HITL.
* **[02-context-and-token-management.md](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/02-context-and-token-management.md)**: Details on token calculation, limits, sliding memory, and model inference.
* **[03-accessing-llms-sdk-vs-api.md](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/03-accessing-llms-sdk-vs-api.md)**: SDK comparison tables, API details, and Ollama integration details.
* **[04-structured-output-and-function-calling.md](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/04-structured-output-and-function-calling.md)**: Zod object schemas, function calling loops, and AI slop/model collapse definitions.

### 2. Code Examples
Located under **[code/](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/code/)**:
* **[gemini-sdk.js](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/code/gemini-sdk.js)**: Basic text generation streaming using Google's new `@google/genai` SDK.
* **[claude-sdk.js](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/code/claude-sdk.js)**: Text streaming sample using Anthropic's Claude SDK.
* **[openai-sdk.js](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/code/openai-sdk.js)**: Zod structured output extraction example.
* **[openai-stramming.js](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/code/openai-stramming.js)**: Response stream completion example.
* **[open-ai-tools-calling.js](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/code/open-ai-tools-calling.js)**: Complete double-turn function calling/tool registration execution.

### 3. Practical Assignments
Located under **[assigenment/](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/assigenment/)**:
* **[server.js](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/assigenment/server.js)**: Integrated Node.js HTTP backend exposing parallel streaming and consensus synthesis endpoints.
* **[index.html](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/assigenment/public/index.html)**: Stunning responsive Web Dashboard with custom dark-mode, side-by-side stream grids, and key overrides.
* **[cli.js](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/assigenment/cli.js)**: Fully featured command-line console runner for both assignments.

---

## 🚀 Execution Instructions

First, ensure your API keys are defined in the workspace root **[.env](file:///home/aminul/development/gen-ai-cohort/.env)**.

### Running Code SDK Examples
```bash
# Run Gemini SDK test
node --env-file=.env week02/learning/day03/code/gemini-sdk.js

# Run Claude SDK test
node --env-file=.env week02/learning/day03/code/claude-sdk.js
```

### Running Assignments

#### Option A: Web Dashboard (Recommended)
Start the dashboard server:
```bash
node --env-file=.env week02/learning/day03/assigenment/server.js
```
Then, open the dashboard in your web browser:
👉 **[http://localhost:3000](http://localhost:3000)**

#### Option B: Terminal CLI
You can run the parallel streaming tool or consensus aggregator directly from your terminal:
```bash
# 1. Test Assignment 1: Parallel Streaming
node --env-file=.env week02/learning/day03/assigenment/cli.js --stream "Why is Javascript single-threaded?"

# 2. Test Assignment 2: AI Consensus Aggregator
node --env-file=.env week02/learning/day03/assigenment/cli.js --consensus "Explain quantum computing in one sentence."
```
