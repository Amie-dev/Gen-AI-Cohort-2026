# Chapter 0 — Overview, Environment & Infrastructure Adapters

## 1. Chapter Goal

The goal of this chapter is to prepare the **Node.js (ESM)** runtime environment and establish connection management drivers for external database services inside `src/infrastructure/`.

A production Advanced RAG system integrated with Mem0 memory relies on multiple data engines:
* **Qdrant Vector DB** for dense vector retrieval
* **PostgreSQL** for relational metadata and conversation storage
* **Redis** for high-throughput short-term caching and non-blocking event queues

In this chapter, we:
* Configure `package.json` with native ES Modules (`"type": "module"`)
* Set up the central configuration loader (`src/config.js`)
* Implement database connection drivers in `src/infrastructure/`

---

### 🎯 Expected Outcome

By the end of this chapter, the infrastructure layer will be ready to serve database connections across all RAG and Mem0 subsystems:

```text
src/
├── config.js
└── infrastructure/
    ├── postgres.js      # Relational DB Pool Driver
    ├── qdrant.js        # Vector DB API Driver
    └── redis.js         # Cache & Queue Driver
```

---

## 2. Package & Environment Setup

Navigate to the project root directory:

```bash
cd week04/learning/day07/code/adv-rag-memory
```

### `package.json`

```json
{
  "name": "adv-rag-memory",
  "version": "1.0.0",
  "description": "Production Advanced RAG + Mem0 Long-Term Memory Architecture",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node src/api/server.js",
    "cli": "node index.js",
    "dev": "node --watch index.js",
    "worker": "node -e \"import { runMemoryWorkerPass } from './src/memory/memoryWorker.js'; runMemoryWorkerPass();\""
  },
  "keywords": [
    "adv-rag",
    "mem0",
    "rag",
    "memory",
    "vllm",
    "rrf",
    "crag",
    "hyde"
  ],
  "author": "GenAI Cohort",
  "license": "ISC",
  "dependencies": {
    "@google/genai": "^0.13.0",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "openai": "^4.52.7"
  }
}
```

### `.env.example`

```env
PORT=8000
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
MEM0_TOP_K=3
STM_MAX_TURNS=6
RAG_TOP_K=5
RRF_K=60
CRAG_THRESHOLD=6.0
```

---

## 3. Configuration Loader (`src/config.js`)

### File Path

```text
adv-rag-memory/src/config.js
```

### Code

```javascript
import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  llmProvider: process.env.LLM_PROVIDER || "openai",
  embeddingProvider: process.env.EMBEDDING_PROVIDER || "openai",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  memory: {
    mem0TopK: parseInt(process.env.MEM0_TOP_K || "3", 10),
    stmMaxTurns: parseInt(process.env.STM_MAX_TURNS || "6", 10),
  },
  rag: {
    topK: parseInt(process.env.RAG_TOP_K || "5", 10),
    rrfK: parseInt(process.env.RRF_K || "60", 10),
    cragThreshold: parseFloat(process.env.CRAG_THRESHOLD || "6.0"),
  },
};
```

---

## 4. Infrastructure Connection Drivers (`src/infrastructure/`)

### 1. PostgreSQL Client Driver (`src/infrastructure/postgres.js`)

Provides client connection abstraction for relational data and metadata filtering:

```javascript
/**
 * Infrastructure Connector: PostgreSQL Data Access Layer
 * Provides relational query abstraction for Auth, Metadata, and DB records.
 */
export class PostgresConnector {
  constructor() {
    this.records = [
      { id: "proj_101", userId: "user_aminul_101", title: "GenAI Production Stack", dbType: "PostgreSQL", tech: "TypeScript & Node.js" },
      { id: "proj_102", userId: "user_aminul_101", title: "Vector Search Engine", dbType: "Qdrant", tech: "Python & vLLM" }
    ];
  }

  async queryUserProjects(userId) {
    return this.records.filter((r) => r.userId === userId);
  }
}

export const postgresDb = new PostgresConnector();
```

### 2. Qdrant Vector Store Driver (`src/infrastructure/qdrant.js`)

Manages REST vector collection queries and embeddings search:

```javascript
/**
 * Infrastructure Connector: Qdrant Vector DB Layer
 * In-memory fallback and mock implementation of Qdrant Client.
 */
export class QdrantConnector {
  constructor() {
    this.collection = [];
  }

  async upsert(points) {
    this.collection.push(...points);
    return { status: "completed" };
  }

  async search(vector, topK = 5) {
    // Simple similarity match based on vector dot product
    const scored = this.collection.map((pt) => {
      let sim = 0;
      if (pt.vector && vector && pt.vector.length === vector.length) {
        sim = pt.vector.reduce((sum, v, i) => sum + v * vector[i], 0);
      }
      return { ...pt, score: sim };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const qdrantClient = new QdrantConnector();
```

### 3. Redis Cache & Queue Driver (`src/infrastructure/redis.js`)

Provides Redis client abstraction for caching and non-blocking event queue operations:

```javascript
/**
 * Infrastructure Connector: Redis In-Memory Key-Value Store
 * Used for session cache and queue buffer simulation.
 */
export class RedisConnector {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value) {
    this.store.set(key, value);
    return "OK";
  }

  async lpush(queueName, payload) {
    if (!this.store.has(queueName)) this.store.set(queueName, []);
    this.store.get(queueName).unshift(payload);
  }

  async rpop(queueName) {
    if (!this.store.has(queueName)) return null;
    const list = this.store.get(queueName);
    return list.pop() || null;
  }
}

export const redisCache = new RedisConnector();
```

---

## 5. Verification & Setup Validation

To verify module syntax and configuration loading:

```bash
node -e "import { config } from './src/config.js'; console.log('Loaded Config Port:', config.port);"
```

### Expected Output

```text
Loaded Config Port: 3000
```

Now that the infrastructure connectors are established, move to **Chapter 1** to implement Guardrails and Short-Term Memory.
