🗓️ **Week 01 — Gen AI Foundations**
> Strengthen your Generative AI foundation using OpenAI, Gemini, Groq, and Mistral SDKs before diving into advanced agentic workflows.

---

📅 **Day 01 — API Platforms & Multi-SDKs**
* What is an LLM?
* Transformers & Text Processing
* Tokenization & Embedding Vectors
* Attention Mechanism
* Context Windows & Rate Limits
* Temperature & Top-p Sampling
* Setting up Node.js from Scratch
* OpenAI SDK Integration
* Gemini SDK Integration
* Groq SDK Integration
* Mistral SDK Integration
* Token Streaming End-to-End
* API Chat Roles (System, User, Assistant)

🔗 **Read More:**
[Day 01 Notes & Documentation](./week01/learning/day01/notes/notes.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day01/notes/notes.md)

---

📅 **Day 02 — Prompt Engineering & Loops**
* Zero-Shot Prompting
* Few-Shot Prompting & In-Context Learning
* Chain of Thought (CoT) Prompting
* Role-Play & Persona Prompting
* Prompt Injections (Direct & Indirect)
* Input & Output Guardrails
* Model-Specific Formats (ChatML, Alpaca, INST, FLAN-T5)
* Distillation & Extraction Attacks
* GIGO (Garbage In, Garbage Out)
* Agent Architecture (Brain + Loop + Tools)
* Loop Engineering (Perceive, Decide, Act)
* Harness Engineering

🔗 **Read More:**
[Day 02 Notes & Main Index](./week01/learning/day02/notes/row-class.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week01/learning/day02/notes/row-class.md)

---

🗓️ **Week 02 — Building AI Agents & RAG Systems**
> Master AI agent architecture, tool execution, multi-SDK orchestration, context management, vector databases, and retrieval-augmented generation.

---

📅 **Day 03 — Building AI Agents & Multi-SDK Orchestration**
* AI Agent Architecture (LLM + Memory + Tools + Guardrails + Planning)
* System Prompt & Instructions vs User Prompts
* Context Window & Token Management (Sliding Memory Window, Token Costs)
* SDK Access vs Direct REST API Inference
* Multi-SDK Integration (OpenAI, Gemini, Anthropic Claude, Ollama)
* Structured Outputs using Zod Object Schemas
* Double-Turn Tool Calling & Function Execution Loops
* Human-In-The-Loop (HITL) & Authorization Guardrails
* AI Slop & Model Collapse Definitions
* Practical Assignments: Node.js Streaming Dashboard & AI Consensus Aggregator

🔗 **Read More:**
[Day 03 Main Index](./week02/learning/day03/index.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week02/learning/day03/index.md)

---

📅 **Day 04 — Retrieval-Augmented Generation (RAG) & Vector Stores**
* What is RAG? (Retrieval + Augmentation + Generation)
* Solving LLM Knowledge Cutoffs & Corporate Private Data Privacy
* Human Brain & Library Mental Model for Search
* Vector Embeddings & High-Dimensional Semantic Search
* Similarity Metrics (Cosine Similarity, Dot Product, Euclidean Distance)
* Vector Database Landscape (Qdrant, Pinecone, Weaviate, pgvector, ChromaDB, MongoDB Vector, Milvus)
* Indexing Pipeline (Ingestion → Extraction → Chunking → Embeddings → Vector DB)
* Query Pipeline (Vector Similarity Search → Top-K Retrieval → Grounded Prompt → Citations)
* LangChain & Qdrant Docker Setup for Node.js
* Multi-Modal Data Ingestion System Design (Audio, Video, PDF, Images, Web)
* Naive RAG Failure Modes & Advanced RAG Preview (Query Rewriting, HyDE, Hybrid Search, Reranking)

🔗 **Read More:**
[Day 04 Main Index](./week02/learning/day04/index.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week02/learning/day04/index.md)

---

🗓️ **Week 03 — Production Advanced RAG & Vectorless Knowledge Engines**
> Master production-grade Advanced RAG architectures, query translation techniques, multi-source routing, Reciprocal Rank Fusion, CRAG evaluation, PII guardrails, vectorless hierarchical tree indexing (PageIndex), and Andrej Karpathy's LLM Wiki paradigm.

---

📅 **Day 05 — Production Advanced RAG Architecture & Multi-Source Pipelines**
* Naive RAG vs. Production Advanced RAG (Query Mismatch, Distance Mismatch)
* Pre-Retrieval Query Translation (Query Rewriting, Step-Back Prompting, Sub-Query Decomposition, HyDE)
* Intent-Based Query Routing & Multi-Source Database Adapters (PostgreSQL Auth DB, Qdrant Vector DB, MongoDB, AWS S3)
* Reciprocal Rank Fusion (RRF) & Cross-Encoder Semantic Re-Ranking
* Self-Reflective Evaluation via Corrective RAG (CRAG Score Evaluation & Retry Loops)
* Input & Output Security Guardrails (Bidirectional PII Masking & Jailbreak Defense)
* Latency Optimization & Asynchronous Queues (BullMQ + Redis Job Processing)
* Production System Implementations (OpenAI & Google Gemini SDK Adapters)

🔗 **Read More:**
[Day 05 Main Index](./week03/learning/day05/notes/index.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week03/learning/day05/notes/index.md)

---

📅 **Day 06 — Vectorless RAG, Hierarchical Tree Indexing & LLM Wiki Engines**
* Limitations of Standard Vector RAG & The Abrupt Token Chunking Problem
* Semantic Similarity vs. Contextual Relevance ($\text{Vector Similarity} \neq \text{Relevance}$)
* Vectorless RAG & Tree-Structured Indexing (PageIndex Architecture Model)
* Natural Structural Document Parsing & Metadata Node Summaries (`Root -> Chapter -> Section -> Page`)
* AlphaGo-Inspired Top-Down Agentic Tree Traversal & Zero-Vector Relevance Reasoning
* Andrej Karpathy's LLM Wiki Paradigm (Obsidian & Markdown Knowledge Vault Management)
* Two-Pass Retrieval Strategy (Lightweight Metadata Summary Scan + Selective Full Content Lazy Loading)
* System System Comparison: Vector RAG vs. Vectorless RAG vs. LLM Wiki vs. Enterprise Hybrid RAG
* Full Node.js JavaScript Code Implementations (`vectorless-rag01`)

🔗 **Read More:**
[Day 06 Main Index](./week03/learning/day06/notes/index.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week03/learning/day06/notes/index.md)

---

🗓️ **Week 04 — Agent Memory Systems, vLLM High-Performance Inference & Autonomous Agent SDK Frameworks**
> Master agent application-level memory architectures (Short-Term Memory sliding windows, Long-Term Memory taxonomy, vector RAG integration, Memory Dreaming reflection, mem0), high-performance LLM hardware & inference engines (Prefill vs. Decode, Berkeley vLLM, PagedAttention), and building autonomous Agent SDK frameworks from scratch using TypeScript and Node.js.

---

📅 **Day 07 — Agent Memory Systems & High-Performance LLM Inference (vLLM)**
* Stateless LLM APIs & Context Window Failure Points (Bandwidth, Latency, Token Costs, Attention Degradation)
* Short-Term Memory (STM) & Sliding Window Buffers ($N$ turns + Database Persistence)
* Long-Term Memory (LTM) Taxonomy: Semantic Memory (Facts), Episodic Memory (Events), and Graph Memory (Neo4j)
* Dynamic Context Assembly ($\text{STM} + \text{LTM\_RAG} + \text{Query}$) & LLM Fact Extraction Pipelines
* Memory Eviction, Contradiction Resolution & Claude-Style Memory Dreaming (Background Offline Reflection)
* Managed Agent Memory Frameworks (`mem0`) & Latency Pre-Fetching Optimizations
* LLM Hardware Mechanics: GPU VRAM HBM, Compute-Bound Training vs. Memory-Bandwidth-Bound Inference
* Inference Engine Architecture (The "Nginx of LLMs"): Prefill Phase (Parallel Prompt) vs. Decode Phase (Auto-Regressive Generation)
* UC Berkeley vLLM Architecture & PagedAttention (Virtual Memory Paging eliminating KV Cache Fragmentation)
* Continuous Batching, Prefix Caching, Chunked Prefill & Mixture-of-Experts (MoE) Kernels

🔗 **Read More:**
[Day 07 Main Index](./week04/learning/day07/notes/completed%20notes.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week04/learning/day07/notes/completed%20notes.md)

---

📅 **Day 08 — Autonomous Agent SDK Framework Architecture & Custom Agent Engine from Scratch**
* Stateful Agent SDKs vs. Stateless LLM APIs
* The Core Agent Triad ($\text{LLM Engine} + \text{Harness Prompt} + \text{Tools}$)
* Fluent `AgentBuilder` Design Pattern & Configuration Decoupling
* Harness Prompting & 5-Stage ReAct Execution Pipeline (`INITIAL` $\rightarrow$ `THINK` $\rightarrow$ `TOOL_REQUEST` $\rightarrow$ `ANALYSE` $\rightarrow$ `OUTPUT`)
* Structured JSON Schema Output Enforcement & Anti-Hallucination Regex Parsing
* `ITool` Interface Specification, Dynamic Tool Schema Auto-Generation & Tool Registry Engine
* Stateful `messageHistory` Execution Lifecycle (`user`, `assistant`, `developer`)
* Event-Driven Interceptor Pattern (`attachInterceptor`, `notifyInterceptors`) & Loop Bounds (`MAX_LOOP`)
* Building Production Custom Agent SDKs in TypeScript & Node.js (OpenAI & Google Gemini SDK Implementations)

🔗 **Read More:**
[Day 08 Main Index](./week04/learning/day08/notes/completed%20notes.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week04/learning/day08/notes/completed%20notes.md)