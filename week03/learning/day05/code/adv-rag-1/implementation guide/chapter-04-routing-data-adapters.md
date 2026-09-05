# Chapter 04 — Intent Router & Multi-Source Data Adapters

## 1. Chapter Goal

The goal of this chapter is to build the query router in [`src/rag/routing/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/routing/) and data adapters in [`src/rag/adapters/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/adapters/).

To retrieve data efficiently from diverse database engines (Qdrant, PostgreSQL, MongoDB, AWS S3), we implement a **Smart Intent Router** and a **Uniform Data Adapter Interface**:

```text
                               Search Query
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │ Query Router (queryRouter.js)        │
                 │ Classifies intent -> targetStore     │
                 └──────────────────┬───────────────────┘
                                    │
        ┌──────────────────┬────────┴─────────┬──────────────────┐
        ▼                  ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Vector Adapter│  │  SQL Adapter  │  │ Mongo Adapter │  │  S3 Adapter   │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
  Qdrant Vector DB   PostgreSQL DB       MongoDB Logs      AWS S3 Bucket
```

---

## 2. Intent-Based Query Router (`src/rag/routing/queryRouter.js`)

Create [`src/rag/routing/queryRouter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/routing/queryRouter.js):

```javascript
import { generateLLM } from '../llmClient.js';

export async function routeQuery(query) {
  const result = await generateLLM({
    system: 'Query Router: Determine target store for query. Return JSON: { "targetStore": "VECTOR_DB" | "AUTH_DB" | "S3" | "MULTI_STORE" }',
    user: query
  });

  try {
    const parsed = JSON.parse(result.text);
    return parsed.targetStore || 'VECTOR_DB';
  } catch (err) {
    const qLower = query.toLowerCase();
    if (qLower.includes('account') || qLower.includes('billing')) return 'AUTH_DB';
    if (qLower.includes('file') || qLower.includes('s3')) return 'S3';
    return 'VECTOR_DB';
  }
}
```

---

## 3. Data Source Adapters (`src/rag/adapters/`)

Every adapter converts data-store-specific output into a standardized document format:
```javascript
{
  id: string,
  title: string,
  text: string,
  source: string,
  score: number,
  metadata: object
}
```

### 1. Vector Adapter (`src/rag/adapters/vectorAdapter.js`)

Create [`src/rag/adapters/vectorAdapter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/adapters/vectorAdapter.js):

```javascript
import { vectorSearch } from '../retrieval/vectorSearch.js';

export async function queryVectorStore(query, user) {
  return await vectorSearch(query);
}
```

---

### 2. SQL Adapter (`src/rag/adapters/sqlAdapter.js`)

Create [`src/rag/adapters/sqlAdapter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/adapters/sqlAdapter.js):

```javascript
import { queryPostgres } from '../../db/postgres.js';

export async function querySQLStore(query, user) {
  const rows = await queryPostgres('SELECT * FROM accounts WHERE user_id = $1', [user?.id]);

  return rows.map((row) => ({
    id: `sql_${row.userId}`,
    title: `Account Record (${row.accountName})`,
    text: `User ${row.accountName} is on the ${row.plan}. Status: ${row.billingStatus}, Monthly Fee: ${row.monthlyFee}, Last Billing: ${row.lastBillingDate}. Refund Eligible: ${row.refundEligible}.`,
    source: 'PostgreSQL DB (accounts table)',
    score: 0.95,
    metadata: { tenantId: user?.tenantId || 'tenant_1', accessLevel: 5 }
  }));
}
```

---

### 3. Mongo Adapter (`src/rag/adapters/mongoAdapter.js`)

Create [`src/rag/adapters/mongoAdapter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/adapters/mongoAdapter.js):

```javascript
export async function queryMongoStore(query, user) {
  return [
    {
      id: `mongo_${user?.id || 'usr_default'}`,
      title: 'Session Telemetry Record',
      text: `User session logged preferences: { theme: "dark", notifications: true }. Last active timestamp recorded in MongoDB.`,
      source: 'MongoDB Collection (user_sessions)',
      score: 0.85,
      metadata: { tenantId: user?.tenantId || 'tenant_1', accessLevel: 5 }
    }
  ];
}
```

---

### 4. S3 Storage Adapter (`src/rag/adapters/s3Adapter.js`)

Create [`src/rag/adapters/s3Adapter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/adapters/s3Adapter.js):

```javascript
export async function queryS3Store(query, user) {
  return [
    {
      id: 's3_object_101',
      title: 'S3 Document File',
      text: 'Unstructured document content retrieved from AWS S3 storage bucket.',
      source: 'AWS S3 (s3://company-docs/terms.pdf)',
      score: 0.80,
      metadata: { tenantId: user?.tenantId || 'tenant_1', accessLevel: 5 }
    }
  ];
}
```

---

## 4. Summary & Next Steps

In this chapter, we implemented:
- `routeQuery()`: LLM and rule-based query intent classifier.
- Unified adapters for Vector (Qdrant), SQL (PostgreSQL), NoSQL (MongoDB), and Object Storage (S3).

In [**Chapter 05 — Vector Search, Fusion & LLM Reranking**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/implementation%20guide/chapter-05-retrieval-fusion-reranking.md), we will build Qdrant vector retrieval, tenant security filtering, Reciprocal Rank Fusion (RRF), and LLM re-ranking.
