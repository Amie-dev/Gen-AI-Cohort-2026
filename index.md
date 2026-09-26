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

---

🗓️ **Week 05 — Enterprise Full-Stack AI Notebook & RAG Platform**
> Build an enterprise-grade full-stack AI Notebook and RAG application (Chaibook / NotebookLM) with Express, Next.js 16, PostgreSQL, Prisma, Better Auth, Pinecone Vector DB, Inngest background jobs, Mem0 memory, streaming SSE chat, and async learning artifacts.

---

📅 **Day 09 — Enterprise Full-Stack System Architecture, Database & Multi-Channel Source Ingestion**
* Full-Stack AI Application Architecture (Client/Server Separation & REST/SSE API design)
* Express TypeScript ESM Setup & Next.js 16 App Router Integration
* PostgreSQL Database Foundation & Prisma ORM Schema Design
* Better Auth Authentication (Session Management & Google OAuth Integration)
* Multi-Layer Workspaces CRUD & Access Control
* Knowledge Source Ingestion (Text, Markdown, Firecrawl Web Scraper, YouTube Transcript Extractor, Cloudinary PDF Uploads)

🔗 **Read More:**
[Day 09 Implementation Guide](./week05/implementations%20guide/README.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week05/implementations%20guide/README.md)

---

📅 **Day 10 — Asynchronous Vector Indexing Pipelines, RAG Chat Engine & Learning Artifacts**
* Asynchronous Background Processing with Inngest Engine
* Sliding Window Text Chunking & OpenAI Vector Embeddings
* Vector Store Indexing & Pinecone Vector Upserts
* Real-Time Streaming RAG Chat Engine (Server-Sent Events & Interactive Citations)
* Agentic Memory Integration (`mem0`) & Tavily Live Web Search
* Structured Learning Artifact Generation (Flashcards, Quizzes, Summaries & Audio Overviews)

🔗 **Read More:**
[Day 10 Main Index](./week05/notes.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week05/notes.md)

---

🗓️ **Week 06 — Graph Databases, Cypher & Knowledge Graph Memory Systems**
> Master graph database architecture, Cypher Query Language, Neo4j engine deployment, official Node.js driver integration, and GraphRAG for connected AI agent memory systems.

---

📅 **Day 11 — Graph Database Fundamentals & Cognitive Memory Architectures**
* Fundamentals of Graph Data Structures (Nodes, Edges, Properties, Labels)
* Human Cognitive Memory Mental Model (Key-Value vs. Connected/Relational Factual & Episodic Memory)
* In-Memory vs. Persistent Graph Storage Engines
* Paradigm Comparison: SQL (Junction Tables) vs. NoSQL (Embedded References) vs. Native Graph DB (Index-Free Adjacency)
* Graph Schema Design & Property Graph Modeling Rules

🔗 **Read More:**
[Day 11 Master Notes](./week06/learning/day12/notes/01-graph-database-fundamentals-and-memory-architecture.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week06/learning/day12/notes/01-graph-database-fundamentals-and-memory-architecture.md)

---

📅 **Day 12 — Cypher Query Language, Neo4j Integration & GraphRAG**
* Cypher Query Language ASCII-Art Syntax (`()`, `[]`, `-->`)
* Cypher CRUD Operations (`MATCH`, `CREATE`, `MERGE`, `SET`, `DELETE`, `DETACH DELETE`)
* Traversal Algorithms & Variable-Length Path Discovery (BFS vs DFS)
* Neo4j Engine Architecture, Bolt Protocol (Port 7687) & Cloud (Aura) vs Docker Deployments
* Building Node.js Applications with Official `neo4j-driver` (`driver.executeQuery()`, Transactions)
* GraphRAG: Hybrid Vector Search + Knowledge Graph Traversals & LLM Text-to-Cypher Integration

🔗 **Read More:**
[Day 12 Main Index](./week06/learning/day12/notes/completed%20notes.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week06/learning/day12/notes/completed%20notes.md)

---

🗓️ **Week 07 — Event-Driven Multi-Agent Workflows & Autonomous GitHub Agents**
> Master durable execution architectures, event-driven background job orchestration with Inngest, state checkpointing, concurrency rate-limiting, and building an autonomous AI GitHub PR reviewer bot using Octokit and OpenAI Agents SDK.

---

📅 **Day 13 — Inngest Workflows in AI & Durable Execution Architecture**
* Asynchronous vs. Synchronous AI Multi-Agent Architectures
* Fundamentals of Durable Execution & State Checkpointing Mechanics
* Solving Gateway Timeouts, Duplicate Tokens & Process Crash Failures
* Traditional Queues (RabbitMQ, Redis, BullMQ) vs. Inngest Serverless Architecture
* Inngest SDK Steps API (`step.run()`, `step.sleep()`, `step.waitForEvent()`, `step.invoke()`, `step.sendEvent()`)
* Parallel Fan-Out / Fan-In Execution (`Promise.all`), Concurrency Control & Rate Limiting

🔗 **Read More:**
[Day 13 Main Index](./week07/learning/day13/notes/completed%20notes.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week07/learning/day13/notes/completed%20notes.md)

---

📅 **Day 14 — Hands-On AI GitHub PR Reviewer Bot with Inngest & Octokit**
* Autonomous GitHub PR Review Bot Architecture & Inngest Event Pipeline
* Octokit GitHub REST API Integration & PAT Authentication
* Extracting & Parsing Paginated Pull Request Diffs (`octokit.paginate`)
* Diff Token Window Optimizations (Filtering `package-lock.json`, Minified Files & Assets)
* Structured LLM Review Output Enforcement with OpenAI Agents SDK & Zod Schemas
* Webhook Listener Routes (`/webhook/github`) & End-to-End Durable Execution Testing

🔗 **Read More:**
[Day 14 Main Index](./week07/learning/day14/notes/completed%20notes.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week07/learning/day14/notes/completed%20notes.md)

---

🗓️ **Week 08 — Model Context Protocol (MCP) & Claude Skills Ecosystem**
> Master open model-context standards, Model Context Protocol (MCP) architecture and transports, context poisoning mitigation, MCP Gateways, progressive disclosure, and production Claude Skills development.

---

📅 **Day 15 — Model Context Protocol (MCP) Architecture & Transports**
* The Model Context Protocol (MCP) Standard & Solving Tool Fragmentation
* Core MCP Triad: Host Applications, MCP Clients, and MCP Servers/Providers
* Primitive Capabilities: Tools (Function Calling), Resources (Data Context), and Prompts (Templates)
* JSON-RPC 2.0 Protocol & Transports (STDIO Local Process Pipes vs HTTP Streaming / SSE)
* Tool Context Poisoning, Gateway Architecture & Dynamic Tool Filtering/Routing

🔗 **Read More:**
[Day 15 Main Index](./week08/learning/day15/notes/README.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week08/learning/day15/notes/README.md)

---

📅 **Day 16 — Claude Skills Development & MCP Integration**
* Claude Skills Architecture vs MCP (Connectivity vs Workflow Knowledge)
* Progressive Disclosure Architecture (Level 1 Frontmatter -> Level 2 Body -> Level 3 Resources)
* `SKILL.md` Specifications: YAML Frontmatter, Description Formulas & Security Rules
* Deterministic Code Execution (Python/Bash Scripts inside `scripts/`) over Probabilistic Instructions
* Testing & Evaluation spectrum (Manual, CLI, API, `skill-creator` tool)
* Agent Skills Open Standard, Programmatic API (`/v1/skills`) & Production Distribution

🔗 **Read More:**
[Day 16 Main Index](./week08/learning/day16/notes/README.md) | [GitHub Link](https://github.com/Amie-dev/Gen-AI-Cohort-2026/blob/main/week08/learning/day16/notes/README.md)