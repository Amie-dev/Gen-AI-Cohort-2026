# Chapter 0 — Overview, Environment & Infrastructure Setup

## 1. Chapter Goal

The goal of this chapter is to set up the foundation for the **Advanced RAG Pipeline** project (`advance-rag-pipeline-sir`).

Before writing document chunkers, vector store clients, background workers, or API endpoints, we need a robust infrastructure and configuration layer that connects:

1. **Docker Infrastructure**: Vector database (**Qdrant**) and job queue storage (**Redis**).
2. **Node.js ESM Runtime**: ES Module package configuration with required dependencies.
3. **Environment Management**: System and API settings via `.env`.
4. **Central Config Module**: Strongly typed JavaScript configuration object (`src/config.js`).

### 🎯 Expected Outcome

By the end of this chapter, your directory layout will contain properly configured environment and setup files:

```text
advance-rag-pipeline-sir/
├── docker-compose.yml      # Qdrant (6333) & Redis (6379)
├── package.json            # ESM package configuration & npm scripts
├── .env                    # Active environment secrets & parameters
├── .env.example            # Environment template
└── src/
    └── config.js           # Central configuration module
```

The execution flow of configuration loading works as follows:

```text
.env (Secrets & Variables)
       │
       ▼
src/config.js (dotenv parsing)
       │
       ├─► Express Server Port (8000)
       ├─► Redis Connection Host/Port (127.0.0.1:6379)
       ├─► Qdrant URL & Collection Name (http://127.0.0.1:6333 / documents)
       ├─► OpenAI Models & Vector Dimensions (text-embedding-3-small / 1536)
       ├─► Sliding Window Chunking Rules (1000 chars / 200 overlap)
       └─► Retrieval & RRF Parameters (topK: 4, rrfK: 60, finalK: 5)
```

---

## 2. Infrastructure Setup (`docker-compose.yml`)

The system relies on two background services:
- **Qdrant Vector Database**: Stores vector embeddings and document payload chunks. Runs on port `6333` (REST API) and `6334` (gRPC).
- **Redis**: Acts as the persistent key-value store powering **BullMQ** job queues. Runs on port `6379`.

Create [`docker-compose.yml`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/docker-compose.yml) in the project root:

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: advance-rag-qdrant
    restart: unless-stopped
    ports:
      - "6333:6333" # REST API
      - "6334:6334" # gRPC API
    volumes:
      - qdrant_data:/qdrant/storage

  redis:
    image: redis:7-alpine
    container_name: advance-rag-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  qdrant_data:
  redis_data:
```

### Starting Infrastructure Services

To start Qdrant and Redis in detached mode:

```bash
docker compose up -d
```

Verify that both containers are healthy:

```bash
docker ps
```

You should see `advance-rag-qdrant` listening on `0.0.0.0:6333->6333/tcp` and `advance-rag-redis` listening on `0.0.0.0:6379->6379/tcp`.

---

## 3. Package Configuration (`package.json`)

The project uses native Node.js **ECMAScript Modules (ESM)** specified by `"type": "module"`.

Create [`package.json`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/package.json):

```json
{
  "name": "advance-rag",
  "version": "1.0.0",
  "description": "Advanced RAG: PDF upload + async indexing with Qdrant & BullMQ",
  "license": "ISC",
  "author": "",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "worker": "node src/worker.js",
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

### Dependency Rationale:
- `@qdrant/js-client-rest`: Official JavaScript client for Qdrant vector database.
- `bullmq` & `ioredis`: Robust Redis-backed queue system for handling asynchronous file indexing and multi-query retrieval tasks.
- `express`: Fast REST web framework for handling HTTP requests.
- `multer`: Middleware for handling `multipart/form-data` PDF file uploads.
- `openai`: Official SDK for generating embeddings (`text-embedding-3-small`) and LLM chat completions (`gpt-4o-mini`).
- `pdf-parse`: Lightweight PDF text extraction library.
- `node --watch`: Built-in Node.js file watcher for hot-reloading development servers.

Install all dependencies:

```bash
npm install
```

---

## 4. Environment Variables (`.env`)

Create [`.env.example`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/.env.example) and copy it to `.env`:

```env
# Express
PORT=8000

# Redis (BullMQ backing store)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Qdrant
QDRANT_URL=http://127.0.0.1:6333
QDRANT_COLLECTION=documents

# OpenAI
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
CHAT_MODEL=gpt-4o-mini

# Chunking
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Retrieval
RETRIEVAL_TOP_K=4
RRF_K=60
RETRIEVAL_FINAL_K=5
```

---

## 5. Central Configuration Module (`src/config.js`)

Instead of accessing `process.env` randomly throughout the codebase, we centralize all parameters in [`src/config.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/config.js) with default fallback values and proper type conversions.

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
    collection: process.env.QDRANT_COLLECTION || "documents",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    // text-embedding-3-small -> 1536 dims, text-embedding-3-large -> 3072 dims
    embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS) || 1536,
    chatModel: process.env.CHAT_MODEL || "gpt-4o-mini",
  },
  chunking: {
    chunkSize: Number(process.env.CHUNK_SIZE) || 1000,
    chunkOverlap: Number(process.env.CHUNK_OVERLAP) || 200,
  },
  retrieval: {
    topK: Number(process.env.RETRIEVAL_TOP_K) || 4, // per-query candidates from Qdrant
    rrfK: Number(process.env.RRF_K) || 60, // Reciprocal Rank Fusion constant
    finalK: Number(process.env.RETRIEVAL_FINAL_K) || 5, // docs kept after fusion
  },
};

// Names of the BullMQ queues.
export const INDEXING_QUEUE = "file-indexing";
export const QUERY_QUEUE = "query";
```

### Detailed Code Breakdown

1. **`import "dotenv/config";`**: Automatically loads values from `.env` into `process.env` upon module import.
2. **`Number(...) || fallback`**: Ensures port numbers, vector dimensions, chunk sizes, and retrieval limits are converted from strings to numeric types with safe fallbacks.
3. **Queue Names Constants**: `INDEXING_QUEUE` ("file-indexing") and `QUERY_QUEUE` ("query") are exported as single sources of truth to prevent name mismatch typos between queue producers (`src/queue.js`) and queue consumers (`src/worker.js`).

---

## 6. Summary & Next Steps

In this chapter, we:
- Spun up **Qdrant Vector DB** and **Redis** via Docker Compose.
- Configured a native Node.js ESM environment with `package.json`.
- Defined environment variables for OpenAI models, Qdrant collections, sliding window chunking, and Reciprocal Rank Fusion constants.
- Built a central, strongly typed configuration object in `src/config.js`.

In [**Chapter 01 — Core Clients & Foundations**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-01-clients-foundation.md), we will create client initializers and helper wrappers for OpenAI embeddings and Qdrant collection provisioning.
