# Chapter 0 — Overview, Setup & Infrastructure Setup

## 1. Chapter Goal

The goal of this chapter is to set up the foundation for the **Production-Grade Advanced RAG System** (`adv-rag`).

Unlike basic single-store RAG projects, an enterprise RAG system requires a heterogeneous multi-database infrastructure, strict environment configuration, and centralized application settings:

1. **Vector Store (Qdrant)**: Stores document embeddings and vector payloads.
2. **Key-Value Queue Store (Redis)**: Powers **BullMQ** job queues for async document ingestion.
3. **Relational DB (PostgreSQL)**: Serves user accounts, billing, subscription data, and structured SQL queries.
4. **Document NoSQL DB (MongoDB)**: Stores unstructured session logs, user telemetry, and document metadata.
5. **Central Config (`src/config.js`)**: Encapsulates parameters for OpenAI models, chunk sizes, Qdrant collections, and retrieval limits.

### 🎯 Expected Outcome

By the end of this chapter, your directory layout will contain:

```text
adv-rag/
├── docker-compose.yml      # Qdrant (6333), Redis (6379), Postgres (5432), Mongo (27017)
├── package.json            # ESM configuration & npm run scripts
├── .env                    # Active environment secrets
├── .env.example            # Environment template
└── src/
    └── config.js           # Central configuration module
```

The configuration data flow works as follows:

```text
.env (Secrets & Host Config)
       │
       ▼
src/config.js (dotenv loader)
       │
       ├─► Express Server Port (8000)
       ├─► Redis Host & Port (127.0.0.1:6379)
       ├─► Qdrant Collection ("adv_rag_documents")
       ├─► OpenAI Models (text-embedding-3-small, gpt-4o-mini)
       ├─► Sliding Window Chunking (1000 size, 200 overlap)
       └─► Retrieval Parameters (topK: 5, rrfK: 60, finalK: 5)
```

---

## 2. Infrastructure Setup (`docker-compose.yml`)

Create [`docker-compose.yml`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/docker-compose.yml) in the project root:

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: adv-rag-qdrant
    restart: unless-stopped
    ports:
      - "6333:6333" # REST API
      - "6334:6334" # gRPC API
    volumes:
      - qdrant_data:/qdrant/storage

  redis:
    image: redis:7-alpine
    container_name: adv-rag-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  qdrant_data:
  redis_data:
```

### Starting Services

Start Qdrant and Redis in detached mode:

```bash
docker compose up -d
```

Verify service status:

```bash
docker ps
```

---

## 3. ESM Package Configuration (`package.json`)

Create [`package.json`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/package.json):

```json
{
  "name": "adv-rag",
  "version": "1.0.0",
  "description": "Production-Grade Advanced RAG System with Guardrails, Query Translation, Multi-Source Routing, RRF, Re-ranking, CRAG, and BullMQ",
  "license": "ISC",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "worker": "node src/queues/indexingWorker.js",
    "cli": "node src/cli.js",
    "services:up": "docker compose up -d",
    "services:down": "docker compose down"
  },
  "dependencies": {
    "@qdrant/js-client-rest": "^1.13.0",
    "bullmq": "^5.34.0",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "ioredis": "^5.4.2",
    "multer": "^2.0.1",
    "openai": "^4.77.0",
    "pdf-parse": "^1.1.1"
  }
}
```

Install dependencies:

```bash
npm install
```

---

## 4. Environment Variables (`.env`)

Create [`.env.example`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/.env.example) and copy to `.env`:

```env
# Express
PORT=8000

# Redis (BullMQ backing store)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Qdrant Vector Database
QDRANT_URL=http://127.0.0.1:6333
QDRANT_COLLECTION=adv_rag_documents

# OpenAI API Settings
OPENAI_API_KEY=sk-proj-your-actual-key
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
CHAT_MODEL=gpt-4o-mini

# Chunking Strategy
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Retrieval & Fusion Parameters
RETRIEVAL_TOP_K=5
RRF_K=60
RETRIEVAL_FINAL_K=5
```

---

## 5. Central Configuration Module (`src/config.js`)

Create [`src/config.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/config.js):

```javascript
import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 8000,
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  qdrant: {
    url: process.env.QDRANT_URL || "http://127.0.0.1:6333",
    collection: process.env.QDRANT_COLLECTION || "adv_rag_documents",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS) || 1536,
    chatModel: process.env.CHAT_MODEL || "gpt-4o-mini",
  },
  chunking: {
    chunkSize: Number(process.env.CHUNK_SIZE) || 1000,
    chunkOverlap: Number(process.env.CHUNK_OVERLAP) || 200,
  },
  retrieval: {
    topK: Number(process.env.RETRIEVAL_TOP_K) || 5,
    rrfK: Number(process.env.RRF_K) || 60,
    finalK: Number(process.env.RETRIEVAL_FINAL_K) || 5,
  },
};

export const INDEXING_QUEUE = "adv-rag-indexing";
export const QUERY_QUEUE = "adv-rag-query";
```

---

## 6. Summary & Next Steps

In this chapter, we:
- Configured multi-database infrastructure containers in `docker-compose.yml`.
- Configured an ESM project setup with scripts for `cli`, `dev`, and `worker`.
- Defined environment variables and built a central configuration loader in `src/config.js`.

In [**Chapter 01 — Multi-Source Databases & Adapters**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-01-database-adapters.md), we will build database connections for Qdrant, Postgres, Mongo, and Redis, as well as unified data source adapters.
