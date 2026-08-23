# `src/db/` Directory Explanations

## Overview
The `src/db/` directory isolates all data storage connection drivers and client initializations. This architectural separation prevents database-specific logic from bleeding into business components or RAG pipeline orchestration.

---

## 🧭 Recommended Reading Order & Learning Path

- ⬅️ **Previous Step (Step 2)**: HTTP Server API & Endpoints — [`src/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/explanations.md)
- 📍 **Current Step (Step 3A)**: Database Connectors & Clients — [`src/db/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/db/explanations.md)
- ➡️ **Next Step (Step 3B)**: Async Ingestion & Background Queues — [`src/queues/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/queues/explanations.md)
- ➡️ **Master Pipeline (Step 4)**: Core RAG Pipeline Orchestrator — [`src/rag/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/explanations.md)

---

## Infrastructure Component Breakdown

| File | Data Store Type | Role in Advanced RAG | Key Functions |
| :--- | :--- | :--- | :--- |
| **`postgres.js`** | Relational SQL Database | User profiles, account status, balances, and billing data | `queryPostgres(sql, params)` |
| **`qdrant.js`** | Vector Database | 1536-dimensional document embedding storage and Cosine similarity search | `initQdrantCollection()`, `searchQdrant(vector, limit, filter)` |
| **`redis.js`** | In-Memory Key-Value Store | Task queue state storage and distributed locking for BullMQ workers | `createRedisClient()`, `redisConnection` configuration |

---

## Technical Implementations & Code / Pseudocode

### 1. PostgreSQL Client (`postgres.js`)
Executes relational database queries with mock fallbacks for isolated offline testing.

```javascript
/**
 * PostgreSQL Query Execution Pseudocode
 */
export async function queryPostgres(sql, params = []) {
  console.log(`[PostgreSQL DB] Executing query: ${sql}`, params);

  // Return structured mock record if SQL query targets accounts or plans
  if (sql.toLowerCase().includes('account') || sql.toLowerCase().includes('plan')) {
    return [
      {
        userId: 'usr_123',
        userName: 'John Doe',
        plan: 'Enterprise Pro',
        billingStatus: 'Active',
        accountBalance: '$250.00',
        refundEligibility: 'Eligible within 30 days of renewal'
      }
    ];
  }
  return [];
}
```

---

### 2. Qdrant Vector Client (`qdrant.js`)
Handles high-dimensional vector operations using `@qdrant/js-client-rest`.

```javascript
/**
 * Qdrant Vector Search & Collection Setup Pseudocode
 */
import { QdrantClient } from '@qdrant/js-client-rest';

export const qdrantClient = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
export const COLLECTION_NAME = 'production_rag_docs';

// Ensure 1536-dim collection exists with Cosine metric distance
export async function initQdrantCollection(vectorSize = 1536) {
  const result = await qdrantClient.getCollections();
  const exists = result.collections.some(c => c.name === COLLECTION_NAME);

  if (!exists) {
    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: { size: vectorSize, distance: 'Cosine' }
    });
  }
}

// Vector similarity search with payload filtering
export async function searchQdrant(vector, limit = 5, filter = null) {
  const searchParams = { vector, limit, with_payload: true };
  if (filter) searchParams.filter = filter;

  return await qdrantClient.search(COLLECTION_NAME, searchParams);
}
```

---

### 3. Redis Connection (`redis.js`)
Configures IORedis parameters tailored specifically for BullMQ queue stability.

```javascript
/**
 * Redis Connection Configuration Pseudocode
 */
import Redis from 'ioredis';

export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null // Required by BullMQ for blocking commands
};

export const createRedisClient = () => new Redis(redisConnection);
```
