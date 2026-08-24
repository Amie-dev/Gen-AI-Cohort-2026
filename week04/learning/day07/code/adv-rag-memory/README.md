# 🚀 Production RAG + Mem0 Memory Architecture

> **Complete Implementation of `implementation guid.md` under `week04/learning/day07/code/adv-rag-memory/`**

This folder implements a complete, modular, production-grade **Production RAG + Mem0 Memory Architecture** in Node.js (ES Modules).

---

## 📌 One-Line Architecture

> **Guard → Understand → Retrieve Memory → Translate Query → Retrieve Knowledge → Filter → Fuse → Re-rank → Assemble Context → Generate → Evaluate → Guard → Answer → Update Mem0**

---

## 📑 Core Documentation & Guides

- 📄 **[Implementation Guide (`implementation guid.md`)](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/adv-rag-memory/implementation%20guid.md)** — Architectural specification document.
- 📄 **[Exhaustive Code Guide (`explanations of code.md`)](file:///home/aminul/development/gen-ai-cohort/week04/learning/day07/code/adv-rag-memory/explanations%20of%20code.md)** — Comprehensive line-by-line breakdown of every single file.

---

## 📁 Folder Structure

```text
week04/learning/day07/code/adv-rag-memory/
├── package.json               # Package metadata and dependencies
├── .env.example               # Configuration environment template
├── implementation guid.md    # Master architectural specification
├── explanations of code.md   # Detailed step-by-step code guide
├── README.md                  # Overview documentation
├── index.js                   # Interactive multi-turn CLI demonstration
└── src/
    ├── config.js              # Application configuration manager
    ├── api/
    │   └── server.js          # Express REST API gateway
    ├── guardrails/
    │   ├── pii.js             # PII detection & masking
    │   ├── injection.js       # Prompt injection detector
    │   ├── input.js           # Master input guardrail processor
    │   └── output.js          # Output guardrail & PII restoration
    ├── memory/
    │   ├── mem0.js            # Mem0 long-term memory store layer
    │   ├── memorySearch.js    # Query-relevant memory search
    │   ├── memoryWriter.js    # Selective memory write pipeline
    │   └── memoryWorker.js    # Offline background memory processing worker
    ├── chat/
    │   ├── stm.js             # Sliding-window STM buffer
    │   └── conversationStore.js# Immutable conversation logs
    ├── rag/
    │   ├── pipeline.js        # RAG pipeline orchestrator
    │   ├── query/             # Query Rewriter, Step-Back, Sub-Queries, HyDE
    │   ├── routing/           # Query Router
    │   ├── adapters/          # PostgreSQL, Qdrant, MongoDB, S3 adapters
    │   ├── retrieval/         # Filtering, RRF Fusion, Re-Ranker, Parallel Search
    │   ├── generation/        # Context Builder & Generation LLM
    │   └── evaluation/        # CRAG Evaluator
    ├── queues/
    │   └── memoryQueue.js     # Redis queue buffer manager
    └── infrastructure/
        ├── postgres.js        # PostgreSQL connector
        ├── redis.js           # Redis connector
        └── qdrant.js          # Qdrant connector
```

---

## 🚀 Execution Guide

### 1. Run Interactive CLI Demonstration
```bash
cd week04/learning/day07/code/adv-rag-memory
node index.js
```

### 2. Start Express REST API Server
```bash
npm start
```
Endpoint: `POST http://localhost:8000/chat`
Payload:
```json
{
  "userId": "user_aminul_101",
  "sessionId": "session_001",
  "query": "Which database should I use for my new Node.js project?"
}
```

### 3. Run Async Background Memory Worker
```bash
npm run worker
```
