# 📅 Week 02 — Day 03: Building AI Agents

Welcome to the study notes for **Week 02 — Day 03** of the **Gen AI JS Cohort**. In this day, we focused on moving from calling LLMs directly to building agentic workflows, managing context windows, working with SDKs, enforcing structured output validation, and designing multi-model orchestration.

---

## 📚 Study Modules

1. **[AI Agent Architecture](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/01-ai-agent-architecture.md)**
   - What is an AI Agent? (LLM vs Agent)
   - Why LLMs alone are not enough for production (Harnesses & Orchestrations)
   - Instructions and System Prompts
   - Tool calling and Guardrails (Input & Output)
   - Human in the Loop (HITL)

2. **[Context and Token Management](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/02-context-and-token-management.md)**
   - Understanding the Context Window
   - Large context problems (latency, cost, reasoning loss)
   - Context window management (Summarization, Sliding Windows, RAG)
   - Token charge structures and Inference vs Training

3. **[Accessing LLMs: APIs, SDKs, and Local Models](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/03-accessing-llms-sdk-vs-api.md)**
   - REST API vs SDK vs Agent SDK comparison
   - Popular SDKs (OpenAI, Claude, Gemini, Mistral, Groq)
   - Offline development with Local Models (Ollama setup and models)

4. **[Structured Output & Function Calling](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/notes/04-structured-output-and-function-calling.md)**
   - Extracting structured data from models
   - Schema validation using Zod
   - Function calling (Tool use loop)
   - LangChain introduction
   - AI Slop and Model Collapse mitigation

---

## 🔑 Key Takeaways

* **Reasoning Engines:** LLMs serve as the raw reasoning engine, while AI Agents are the complete software systems built around them to interact with the real world.
* **Production Requirements:** Production-grade AI systems require memory, retry handlers, tool proxies, and input/output validation guardrails.
* **Context Budgeting:** Context windows are finite and costly. Proactive context management (like sliding windows and summarization) keeps models fast and economical.
* **Structured Data:** Using schemas (via Zod or native JSON modes) is mandatory to reliably integrate AI outputs with traditional backend code bases.
* **Local Alternatives:** Tools like Ollama make offline, private development with open weights (e.g., Llama 3) simple and free.

---

## 📝 Practical Assignments

We built implementations for today's assignments in the **[assigenment/](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/assigenment/)** folder:

1. **[Assignment 1: Multi-Provider AI Streaming](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/assigenment/server.js)**: Stream responses from OpenAI, Gemini, Groq, and Mistral side-by-side in real-time.
2. **[Assignment 2: AI Consensus System](file:///home/aminul/development/gen-ai-cohort/week02/learning/day03/assigenment/server.js)**: Synthesize responses from four providers into a single, high-quality consolidated consensus answer.

These can be run in the browser using the interactive Web Dashboard or directly from the terminal via the CLI script.
