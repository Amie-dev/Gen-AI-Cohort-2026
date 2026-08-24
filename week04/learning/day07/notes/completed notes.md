# 📚 Week 04 — Day 07 Master Notes

# Agent Memory Systems & High-Performance LLM Inference (vLLM)

> **Overview:** Day 07 notes are split into modular topic files covering **Agent Application-Level Memory** (from main class) and **LLM Inference Engines & vLLM** (from extra class).

---

## 📑 Notes Structure & Links

### 🧠 Main Class Notes (`/notes/`)
1. 📄 **[01 — Application-Level Memory & Context Limitations](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/notes/01-application-level-memory-and-context-limits.md)**
   - Stateless LLM APIs (`POST /chat/completions`)
   - Naive history appending & 4 core production failure points (Context limit, Bandwidth/Latency, Token Costs, Attention Degradation).

2. 📄 **[02 — Short-Term Memory (STM) & Sliding Windows](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/notes/02-short-term-memory-and-sliding-windows.md)**
   - Sliding window buffer ($N$ turns)
   - Database persistence (PostgreSQL / SQLite schemas)
   - Information loss outside the sliding window.

3. 📄 **[03 — Long-Term Memory (LTM) Taxonomy & RAG](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/notes/03-long-term-memory-taxonomy-and-rag.md)**
   - Fact Extraction Pipeline via LLM calls
   - LTM Taxonomy: **Semantic Memory (Facts)**, **Episodic Memory (Events)**, and **Graph Memory (Neo4j)**
   - Dynamic Vector RAG Context Assembly (`STM + Vector_RAG(LTM) + Query`).

4. 📄 **[04 — Memory Eviction & Memory "Dreaming" (Reflection)](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/notes/04-memory-eviction-and-dreaming-reflection.md)**
   - Memory store quality issues (Duplicates, Contradictions, Stale facts)
   - **Claude-style Memory Dreaming Architecture** (Offline background reflection)
   - Input log immutability principle & contradiction resolution.

5. 📄 **[05 — Agent Memory System Design & mem0 Framework](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/notes/05-agent-memory-system-design-and-mem0.md)**
   - System design latency bottlenecks & pre-fetching optimizations
   - Hit-score tracking (frequency + recency)
   - **`mem0` Managed Memory Framework**.

---

### ⚡ Extra Class Notes (`/notes/extra/`)
1. 📄 **[01 — LLM Hardware Mechanics: Training vs Inference](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/notes/extra/01-llm-hardware-training-vs-inference.md)**
   - GPU VRAM & High Bandwidth Memory (HBM) costs
   - Training (Compute-bound) vs Inference (Memory-bandwidth bound).

2. 📄 **[02 — Inference Engines: Prefill vs Decode Phases](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/notes/extra/02-inference-engines-prefill-vs-decode.md)**
   - What is an Inference Engine? (The "Nginx of LLMs")
   - **Prefill Phase** (Parallel prompt encoding) vs **Decode Phase** (Auto-regressive token generation)
   - Disaggregated Prefill and Decode clusters.

3. 📄 **[03 — vLLM Architecture & PagedAttention Deep Dive](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/notes/extra/03-vllm-architecture-and-paged-attention.md)**
   - UC Berkeley Sky Computing Lab origins
   - **PagedAttention** (Virtual memory paging eliminating KV cache fragmentation)
   - Continuous batching, Chunked prefill, Prefix caching, Quantization, and MoE kernels.

---

### 🧪 Sample Code Directory (`/code/sample-code/`)
All executable sample code implementations are available at:
👉 **[sample-code directory](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/sample-code)**
* **[01_short_term_memory.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/sample-code/01_short_term_memory.js)** — Sliding window STM buffer
* **[02_long_term_memory_rag.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/sample-code/02_long_term_memory_rag.js)** — Fact extraction & Vector RAG pipeline
* **[03_memory_dreaming_reflection.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/sample-code/03_memory_dreaming_reflection.js)** — Memory Dreaming process
* **[04_vllm_inference_client.js](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/sample-code/04_vllm_inference_client.js)** — vLLM client integration
