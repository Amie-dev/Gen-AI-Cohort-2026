# 🚀 Advanced Production RAG System (`adv-rag-1`)

A modular, production-grade Advanced RAG implementation built in Node.js, adhering strictly to **Section 37 (Recommended Production Folder Structure)** of Day 05 Advanced RAG Curriculum.

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
