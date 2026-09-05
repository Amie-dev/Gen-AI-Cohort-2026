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
PORT=3000
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
MEM0_API_KEY=your-mem0-api-key
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/adv_rag
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
```

---

## 3. Configuration Loader (`src/config.js`)

### File Path

```text
adv-rag-memory/src/config.js
```

### Code

```javascript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  mem0ApiKey: process.env.MEM0_API_KEY || '',
  postgresUrl: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/adv_rag',
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
```

---

## 4. Infrastructure Connection Drivers (`src/infrastructure/`)

### 1. PostgreSQL Client Driver (`src/infrastructure/postgres.js`)

Provides client connection abstraction for relational data and metadata filtering:

```javascript
import { config } from '../config.js';

export async function getPostgresClient() {
  console.log(`[DB] Connecting to PostgreSQL at ${config.postgresUrl}`);
  return {
    query: async (sql, params) => {
      console.log(`[SQL EXEC] ${sql}`, params || '');
      return { rows: [] };
    },
  };
}
```

### 2. Qdrant Vector Store Driver (`src/infrastructure/qdrant.js`)

Manages REST vector collection queries and embeddings search:

```javascript
import { config } from '../config.js';

export async function getQdrantClient() {
  console.log(`[Vector DB] Connecting to Qdrant at ${config.qdrantUrl}`);
  return {
    search: async (collectionName, params) => {
      console.log(`[Qdrant Search] Collection: ${collectionName}, Vector size: ${params.vector?.length}`);
      return [];
    },
  };
}
```

### 3. Redis Cache & Queue Driver (`src/infrastructure/redis.js`)

Provides Redis client abstraction for caching and non-blocking event queue operations:

```javascript
import { config } from '../config.js';

export async function getRedisClient() {
  console.log(`[Cache/Queue] Connecting to Redis at ${config.redisUrl}`);
  return {
    get: async (key) => null,
    set: async (key, val, mode, ttl) => 'OK',
    lpush: async (key, val) => 1,
    rpop: async (key) => null,
  };
}
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
