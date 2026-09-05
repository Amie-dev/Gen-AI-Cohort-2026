# Master Index — Advanced RAG Pipeline (Node.js + Qdrant + BullMQ)

Welcome to the **Implementation Guide** for the **Advanced RAG Pipeline** project! This guide takes software engineers step-by-step through building a production-grade, asynchronous Retrieval-Augmented Generation (RAG) backend using Node.js ESM, Express, Qdrant Vector DB, Redis, BullMQ background queues, and OpenAI API integrations.

---

## 📁 Project Folder Structure Map

All project source code is located inside [`week03/learning/day05/code/advance-rag-pipeline-sir/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/):

```text
advance-rag-pipeline-sir/
├── docker-compose.yml             # Docker infrastructure for Qdrant and Redis
├── package.json                   # NPM dependencies and run scripts ("type": "module")
├── .env.example                   # Environment variable template
├── implementation guide/          # Step-by-step implementation guide chapters
│   ├── README.md                  # Master Index (This file)
│   ├── chapter-00-overview-setup.md
│   ├── chapter-01-clients-foundation.md
│   ├── chapter-02-queue-infrastructure.md
│   ├── chapter-03-indexing-pipeline.md
│   ├── chapter-04-advanced-retrieval-rrf.md
│   ├── chapter-05-worker-process.md
│   └── chapter-06-api-server-polling.md
└── src/
    ├── config.js                  # Central configuration & environment defaults
    ├── openai.js                  # OpenAI SDK wrappers (Embeddings & Chat)
    ├── qdrant.js                  # Qdrant client connection & collection setup
    ├── queue.js                   # BullMQ Redis queues & job enqueuers
    ├── indexer.js                 # PDF parsing, sliding window chunking & vector upsertion
    ├── retriever.js               # Multi-query expansion, HyDE, RRF & grounded answer generation
    ├── worker.js                  # Background job worker handlers (indexing + query)
    └── index.js                   # Express REST API, Multer upload & polling routes
```

---

## 🏗️ System Architecture & Service Ecosystem

The system operates as a decoupled, event-driven Node.js ESM backend that separates synchronous API request handling from long-running PDF parsing, vector embedding generation, and multi-step query retrieval.

```mermaid
graph TD
    subgraph ClientTier["Client Tier"]
        Client["HTTP Client / Postman / Web UI"]
    end

    subgraph ServerApp["Express API Server (src/index.js)"]
        Multer["Multer Storage / File Handler"]
        Routes["API Routes (/index, /query, /query/:id)"]
    end

    subgraph QueueTier["Async Queue & Data Layer (BullMQ & Redis)"]
        Redis[("Redis 7 (Alpine)")]
        IndexQueue["Indexing Queue (file-indexing)"]
        QueryQueue["Query Queue (query)"]
    end

    subgraph WorkerTier["Background Engine (src/worker.js)"]
        IndexWorker["Indexing Worker (Concurrency: 2)"]
        QueryWorker["Query Worker (Concurrency: 4)"]
    end

    subgraph StorageTier["Vector Storage"]
        Qdrant[("Qdrant Vector Database (Port 6333)")]
    end

    subgraph ExternalServices["External AI Integrations"]
        OpenAIEmbed["OpenAI Embeddings API\n(text-embedding-3-small)"]
        OpenAIChat["OpenAI Chat API\n(gpt-4o-mini with Structured JSON)"]
    end

    Client -->|"1. POST /index (PDF)"| Multer
    Multer -->|"2. Disk Storage"| Routes
    Routes -->|"3. Enqueue Job"| IndexQueue
    IndexQueue --> Redis

    Client -->|"4. POST /query (Prompt)"| Routes
    Routes -->|"5. Enqueue Job"| QueryQueue
    QueryQueue --> Redis

    Client -->|"6. GET /query/:id"| Routes
    Routes -->|"7. Fetch Status"| QueryQueue

    IndexQueue -->|"Consume index-file"| IndexWorker
    QueryQueue -->|"Consume run-query"| QueryWorker

    IndexWorker -->|"Extract & Chunk PDF"| IndexWorker
    IndexWorker -->|"Generate Vectors"| OpenAIEmbed
    IndexWorker -->|"Upsert Vectors & Payload"| Qdrant

    QueryWorker -->|"Query Rewriting / HyDE"| OpenAIChat
    QueryWorker -->|"Multi-Vector Search"| Qdrant
    QueryWorker -->|"Rank Fusion (RRF)"| QueryWorker
    QueryWorker -->|"Generate Grounded Answer"| OpenAIChat
```

---

## 🔄 Dual Asynchronous Pipeline Architecture

### 1. Document Indexing Pipeline (PDF -> Chunks -> Vectors -> Qdrant)

When a document is uploaded, processing occurs completely in the background:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as Express Router (index.js)
    participant Queue as BullMQ (file-indexing)
    participant Worker as Indexing Worker (worker.js)
    participant Indexer as Indexer Module (indexer.js)
    participant OpenAI as OpenAI API
    participant Qdrant as Qdrant Vector DB

    Client->>API: POST /index (Multipart Form-Data PDF)
    API->>API: Multer stores PDF in uploads/
    API->>Queue: enqueueIndexingJob({ filePath, originalName })
    API-->>Client: HTTP 202 Accepted { jobId, file }

    Queue->>Worker: Dispatch "index-file" job
    Worker->>Indexer: indexPdf({ filePath, originalName })
    Indexer->>Indexer: readPdfText() via pdf-parse
    Indexer->>Indexer: chunkText() with sliding overlap
    Indexer->>OpenAI: embedTexts(chunks) in batches
    OpenAI-->>Indexer: Array of 1536-dim float vectors
    Indexer->>Qdrant: upsert(collection, points)
    Qdrant-->>Indexer: Confirmation
    Indexer-->>Worker: { chunks: N, collection }
    Worker-->>Queue: Mark Job Completed
```

---

### 2. Advanced Multi-Query Retrieval & Grounded RAG Pipeline

When a user submits a query, it undergoes structured query transformation, parallel vector retrieval, Reciprocal Rank Fusion, and LLM synthesis:

```mermaid
flowchart TD
    Start(["Client submits POST /query"]) --> Enqueue["Enqueue Job to queryQueue"]
    Enqueue --> HTTPResp["Return HTTP 202 Accepted { jobId, poll }"]
    
    Enqueue --> WorkerRecv["Query Worker picks up run-query job"]
    WorkerRecv --> Transcribe["src/retriever.js: retrieveChunks(query)"]
    
    subgraph QueryExpansion["Query Expansion & Translation"]
        Transcribe --> Rewriting["OpenAI JSON Schema:\n• Rewritten Query\n• Step-Back Question\n• 3 Sub-Queries"]
        Transcribe --> HyDE["OpenAI Chat:\n• HyDE Hypothetical Passage"]
    end

    QueryExpansion --> BatchEmbed["Batch Embed all 6 variants via text-embedding-3-small"]
    BatchEmbed --> ParallelSearch["Parallel Qdrant Vector Search (topK = 4 per variant)"]
    
    ParallelSearch --> RRF["Reciprocal Rank Fusion (RRF):\nCalculate RRF score = Σ 1 / (60 + rank)"]
    RRF --> TopK["Select Top-5 Fused Candidate Chunks"]
    
    TopK --> LLMContext["Build Grounded Prompt with Document Chunks"]
    LLMContext --> GroundedLLM["OpenAI gpt-4o-mini Completion"]
    GroundedLLM --> Result["Save Answer + Source Chunks to Job Result"]
    
    HTTPResp --> PollLoop["Client polls GET /query/:id"]
    Result --> PollComplete["Return { status: 'completed', result: { answer, sources } }"]
```

---

## 📚 Table of Contents & Chapter Guide

| Chapter | Title | Primary Files Covered | Key Learning Focus |
| :--- | :--- | :--- | :--- |
| [**Chapter 00**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-00-overview-setup.md) | Overview, Environment & Setup | [`docker-compose.yml`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/docker-compose.yml), [`package.json`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/package.json), [`.env.example`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/.env.example), [`src/config.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/config.js) | Infrastructure containers (Qdrant & Redis), ESM configuration, environment variables, central configuration schema. |
| [**Chapter 01**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-01-clients-foundation.md) | Core Clients & Foundations | [`src/openai.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/openai.js), [`src/qdrant.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/qdrant.js) | OpenAI client setup, batch vector embedding helpers, Qdrant REST client initialization, and auto-collection provisioning with concurrency safety. |
| [**Chapter 02**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-02-queue-infrastructure.md) | Asynchronous Queue System | [`src/queue.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/queue.js) | BullMQ queue creation, Redis connection options (`maxRetriesPerRequest: null`), retry backoffs, and job enqueuers. |
| [**Chapter 03**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-03-indexing-pipeline.md) | PDF Ingestion & Indexing | [`src/indexer.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/indexer.js) | PDF text extraction (`pdf-parse`), boundary-aware sliding-window chunking, batch vectorization, and Qdrant upsertion. |
| [**Chapter 04**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-04-advanced-retrieval-rrf.md) | Advanced Retrieval & RRF | [`src/retriever.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/retriever.js) | Multi-query expansion (Step-Back, Sub-Queries, Query Rewriting), HyDE hypothetical doc generation, Reciprocal Rank Fusion (RRF), and grounded prompt synthesis. |
| [**Chapter 05**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-05-worker-process.md) | Background Worker Process | [`src/worker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/worker.js) | BullMQ worker instances, concurrent job execution, queue event handlers (`completed`, `failed`), and task lifecycle management. |
| [**Chapter 06**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-06-api-server-polling.md) | Express REST Server & Polling | [`src/index.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/index.js) | Multer file upload security, `POST /index`, `POST /query`, `GET /query/:id` polling controller, error handling middleware, and manual verification scripts. |

---

## ⚡ Quick Start Command Cheat Sheet

To run the complete system locally:

```bash
# 1. Navigate to the project root directory
cd week03/learning/day05/code/advance-rag-pipeline-sir

# 2. Spin up Redis and Qdrant infrastructure containers
npm run services:up

# 3. Install Node.js ESM dependencies
npm install

# 4. Copy environment variables and insert your OpenAI API Key
cp .env.example .env

# 5. In Terminal 1: Start the Express REST API Server
npm run dev

# 6. In Terminal 2: Start the Background Job Worker Process
npm run worker
```
