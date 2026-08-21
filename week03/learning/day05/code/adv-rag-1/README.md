# 🚀 Advanced Production RAG System (`adv-rag-1`)

A modular, production-grade Advanced RAG implementation built in Node.js, adhering strictly to **Section 37 (Recommended Production Folder Structure)** of Day 05 Advanced RAG Curriculum.

---

## 🧭 Where to Start & Learning Roadmap

If you are new to this repository, follow this step-by-step reading order to easily understand the entire codebase:

1. **Step 1 (Start Here)**: High-Level Architecture & 15-Stage Master Pseudocode — [`explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/explanations.md)
2. **Step 2**: Server Entry Point & HTTP Endpoints (`server.js`) — [`src/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/explanations.md)
3. **Step 3**: Data Access & Background Processing:
   - Database Connectors (Postgres, Qdrant, Redis): [`src/db/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/db/explanations.md)
   - BullMQ Async Background Worker & Indexing: [`src/queues/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/queues/explanations.md)
4. **Step 4**: Core RAG Pipeline Orchestrator (`ragPipeline.js`) — [`src/rag/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/explanations.md)
5. **Step 5**: Detailed RAG Stage Sub-Modules:
   - **Stages 1 & 15 (Security)**: [`src/rag/guardrails/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/guardrails/explanations.md) (Input/Output PII masking & jailbreak detection)
   - **Stages 2–5 (Translation)**: [`src/rag/query/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/explanations.md) (Query Rewrite, Step-Back, HyDE, Sub-Queries)
   - **Stages 6–8 (Routing)**: [`src/rag/routing/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/routing/explanations.md) (Intent routing to SQL/Qdrant/S3)
   - **Database Adapters**: [`src/rag/adapters/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/adapters/explanations.md) (Unified storage interface)
   - **Stages 9–11 (Retrieval)**: [`src/rag/retrieval/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/explanations.md) (Filtering, RRF fusion, Cross-Encoder reranker)
   - **Stages 12–13 (Generation)**: [`src/rag/generation/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/generation/explanations.md) (Context construction & grounded answer synthesis)
   - **Stage 14 (Evaluation)**: [`src/rag/evaluation/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/evaluation/explanations.md) (Corrective RAG - CRAG groundedness check & retry loop)

---

## 🌟 Key Architecture & Capabilities

1. **Input Guardrails (`src/rag/guardrails/`)**: PII detection & masking, prompt injection/jailbreak filtering, policy validation.
2. **Query Translation Engine (`src/rag/query/`)**: Parallel query rewriting, Step-Back conceptual prompting, Sub-Query decomposition, HyDE (Hypothetical Document Embeddings).
3. **Dynamic Query Routing (`src/rag/routing/`)**: Directs queries to PostgreSQL (Auth/Billing), Qdrant (Vector DB), S3 (Object Storage), or Multi-Store adapters.
4. **Adapter Pattern (`src/rag/adapters/`)**: Decoupled access to heterogeneous databases (`sqlAdapter`, `vectorAdapter`, `mongoAdapter`, `s3Adapter`).
5. **Multi-Stage Retrieval & Fusion (`src/rag/retrieval/`)**: Multi-query vector search, metadata filtering (tenant ID & permissions), Reciprocal Rank Fusion (RRF `k=60`), Cross-Encoder / LLM re-ranking.
6. **Context Construction & Grounded Generation (`src/rag/generation/`)**: Structured prompt building and strict anti-hallucination grounded generation.
7. **Corrective RAG - CRAG (`src/rag/evaluation/`)**: Evaluates answers for groundedness, relevance, completeness, hallucination, triggering corrective retry loops.
8. **Output Guardrails (`src/rag/guardrails/output.js`)**: Output toxicity and PII leakage verification.
9. **Async Background Indexing (`src/queues/`)**: BullMQ + Redis task queues for background PDF parsing, chunking, embedding, and Qdrant ingestion.

---

## 📁 Directory Structure

```text
src/
├── rag/
│   ├── ragPipeline.js
│   ├── query/
│   │   ├── rewrite.js
│   │   ├── stepBack.js
│   │   ├── subQueries.js
│   │   └── hyde.js
│   ├── routing/
│   │   └── queryRouter.js
│   ├── adapters/
│   │   ├── sqlAdapter.js
│   │   ├── vectorAdapter.js
│   │   ├── mongoAdapter.js
│   │   └── s3Adapter.js
│   ├── retrieval/
│   │   ├── vectorSearch.js
│   │   ├── filtering.js
│   │   ├── rrf.js
│   │   └── reranker.js
│   ├── generation/
│   │   ├── contextBuilder.js
│   │   └── generateAnswer.js
│   ├── evaluation/
│   │   └── crag.js
│   └── guardrails/
│       ├── input.js
│       ├── pii.js
│       ├── jailbreak.js
│       └── output.js
├── queues/
│   ├── indexingQueue.js
│   └── indexingWorker.js
├── db/
│   ├── postgres.js
│   ├── qdrant.js
│   └── redis.js
└── server.js
```

---

## 🛠️ Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start local services (Qdrant, Redis, Postgres)
npm run services:up

# 4. Start HTTP Server
npm run dev

# 5. Start Queue Worker (in separate terminal)
npm run worker
```
