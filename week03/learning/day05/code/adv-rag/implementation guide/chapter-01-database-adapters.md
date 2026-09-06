# Chapter 01 — Multi-Source Databases & Data Adapters Layer

## 1. Chapter Goal

The goal of this chapter is to build the multi-database abstraction layer in [`src/db/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/db/) and [`src/adapters/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/adapters/).

Enterprise systems do not store all context in a single vector database. A complete company context might be spread across:
- **Vector DB (Qdrant)**: High-density semantic text chunk embeddings.
- **Relational DB (PostgreSQL)**: Customer billing records, subscriptions, invoice statuses.
- **NoSQL DB (MongoDB)**: Session state, telemetry, and un-embedded document metadata.
- **Object Storage (AWS S3)**: Raw un-indexed PDF files, raw text documents.

To allow the RAG orchestrator to query all four storage engines uniformly, we build a **Unified Data Adapter Layer**:

```text
                           ┌────────────────────────────┐
                           │ RAG Pipeline Orchestrator  │
                           └─────────────┬──────────────┘
                                         │
                                         ▼
                           ┌────────────────────────────┐
                           │ Adapter Dispatcher         │
                           │  (src/adapters/index.js)   │
                           └─────────────┬──────────────┘
                                         │
        ┌──────────────────┬─────────────┴────────────┬──────────────────┐
        ▼                  ▼                          ▼                  ▼
┌───────────────┐  ┌───────────────┐          ┌───────────────┐  ┌───────────────┐
│ Vector Adapter│  │  SQL Adapter  │          │ Mongo Adapter │  │  S3 Adapter   │
└───────┬───────┘  └───────┬───────┘          └───────┬───────┘  └───────┬───────┘
        │                  │                          │                  │
        ▼                  ▼                          ▼                  ▼
┌───────────────┐  ┌───────────────┐          ┌───────────────┐  ┌───────────────┐
│  src/db/      │  │  src/db/      │          │  src/db/      │  │ AWS S3 SDK /  │
│  qdrant.js    │  │  postgres.js  │          │  mongo.js     │  │ Mock Storage  │
└───────────────┘  └───────────────┘          └───────────────┘  └───────────────┘
```

---

## 2. Database Initializers (`src/db/`)

### 1. Qdrant Client (`src/db/qdrant.js`)

Create [`src/db/qdrant.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/db/qdrant.js):

```javascript
import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../config.js";

export const qdrant = new QdrantClient({ url: config.qdrant.url });

export async function ensureCollection() {
  const name = config.qdrant.collection;
  try {
    const exists = await qdrant.collectionExists(name);
    if (!exists.exists) {
      await qdrant.createCollection(name, {
        vectors: {
          size: config.openai.embeddingDimensions,
          distance: "Cosine",
        },
      });
      console.log(`🗂️  Created Qdrant collection "${name}"`);
    }
  } catch (err) {
    const stillMissing = !(await qdrant.collectionExists(name)).exists;
    if (stillMissing) throw err;
  }
  return name;
}
```

---

### 2. PostgreSQL Client (`src/db/postgres.js`)

Create [`src/db/postgres.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/db/postgres.js):

```javascript
/**
 * Relational DB Adapter Mock / Implementation (PostgreSQL)
 * Serves structured user account, subscription, and billing data.
 */
export async function queryPostgres(sqlQuery, params = []) {
  console.log(`🛢️ [PostgreSQL] Executing Query: "${sqlQuery}"`);
  
  // Mock relational records for production simulation
  const mockDatabase = [
    { id: "USER_123", name: "John Doe", plan: "Pro Tier", billingStatus: "Active", monthlyFee: "$29.99", lastInvoiceDate: "2026-08-01", refundEligible: true },
    { id: "USER_456", name: "Jane Smith", plan: "Enterprise", billingStatus: "Active", monthlyFee: "$299.00", lastInvoiceDate: "2026-08-05", refundEligible: true },
    { id: "USER_789", name: "Bob Johnson", plan: "Free Tier", billingStatus: "Inactive", monthlyFee: "$0.00", lastInvoiceDate: "N/A", refundEligible: false },
  ];

  return mockDatabase;
}
```

---

### 3. MongoDB Client (`src/db/mongo.js`)

Create [`src/db/mongo.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/db/mongo.js):

```javascript
/**
 * NoSQL DB Adapter Mock / Implementation (MongoDB)
 * Serves document metadata, session data, and application telemetry.
 */
export async function queryMongo(collectionName, filter = {}) {
  console.log(`🍃 [MongoDB] Collection "${collectionName}" filter:`, JSON.stringify(filter));

  return [
    {
      sessionId: "sess_99812",
      userId: "USER_123",
      lastLogin: new Date().toISOString(),
      preferences: { theme: "dark", notifications: true }
    }
  ];
}
```

---

### 4. Redis Client (`src/db/redis.js`)

Create [`src/db/redis.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/db/redis.js):

```javascript
import { config } from "../config.js";

// Connection parameters required by BullMQ
export const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
};
```

---

## 3. Data Source Adapters (`src/adapters/`)

The adapters transform engine-specific outputs into a **unified candidate document format**:
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

### 1. Vector Adapter (`src/adapters/vectorAdapter.js`)

Create [`src/adapters/vectorAdapter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/adapters/vectorAdapter.js):

```javascript
import { vectorSearch } from "../retrieval/vectorSearch.js";

/**
 * Vector DB Adapter (Qdrant)
 */
export async function searchVector(query) {
  return await vectorSearch(query);
}
```

---

### 2. SQL Adapter (`src/adapters/sqlAdapter.js`)

Create [`src/adapters/sqlAdapter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/adapters/sqlAdapter.js):

```javascript
import { queryPostgres } from "../db/postgres.js";

/**
 * SQL DB Adapter
 */
export async function searchSQL(query, user = {}) {
  const records = await queryPostgres(query);
  const targetUser = records.find(r => r.id === user.id || r.id === "USER_123") || records[0];

  return [
    {
      id: `sql_${targetUser.id}`,
      title: `Relational User Account Record (${targetUser.id})`,
      text: `User Account: ${targetUser.name} (${targetUser.id})\nPlan: ${targetUser.plan}\nBilling Status: ${targetUser.billingStatus}\nMonthly Fee: ${targetUser.monthlyFee}\nRefund Eligible: ${targetUser.refundEligible}`,
      source: "PostgreSQL Database",
      score: 0.98,
      metadata: { tenantId: user.tenantId || "default", accessLevel: 1 }
    }
  ];
}
```

---

### 3. Mongo Adapter (`src/adapters/mongoAdapter.js`)

Create [`src/adapters/mongoAdapter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/adapters/mongoAdapter.js):

```javascript
import { queryMongo } from "../db/mongo.js";

/**
 * MongoDB Adapter
 */
export async function searchMongo(query) {
  const docs = await queryMongo("sessions", { query });
  return docs.map(d => ({
    id: `mongo_${d.sessionId}`,
    title: "MongoDB User Session Log",
    text: `Session ${d.sessionId} for ${d.userId} active at ${d.lastLogin}. Theme: ${d.preferences.theme}`,
    source: "MongoDB Database",
    score: 0.90,
    metadata: { tenantId: "default", accessLevel: 1 }
  }));
}
```

---

### 4. S3 Storage Adapter (`src/adapters/s3Adapter.js`)

Create [`src/adapters/s3Adapter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/adapters/s3Adapter.js):

```javascript
/**
 * AWS S3 Object Storage Adapter
 */
export async function searchS3(query) {
  return [
    {
      id: "s3_invoice_2026_08.pdf",
      title: "Subscription Invoice August 2026",
      text: "PDF Invoice Document: Invoice #INV-2026-0881. Total Paid: $29.99. Download URL: https://s3.amazonaws.com/billing/INV-2026-0881.pdf",
      source: "Amazon S3 Storage",
      score: 0.95,
      metadata: { tenantId: "default", accessLevel: 1 }
    }
  ];
}
```

---

### 5. Adapter Dispatcher (`src/adapters/index.js`)

Create [`src/adapters/index.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/adapters/index.js):

```javascript
import { searchSQL } from "./sqlAdapter.js";
import { searchVector } from "./vectorAdapter.js";
import { searchMongo } from "./mongoAdapter.js";
import { searchS3 } from "./s3Adapter.js";

/**
 * Step 7: Adapter Execution Layer
 * Executes queries against target data store(s) based on route.
 */
export async function executeAdapter(route, query, user = {}) {
  const store = route?.targetStore || "VECTOR_DB";

  switch (store) {
    case "AUTH_DB":
      return await searchSQL(query, user);

    case "VECTOR_DB":
      return await searchVector(query);

    case "S3":
      return await searchS3(query);

    case "MULTI_STORE": {
      const [sqlHits, vectorHits] = await Promise.all([
        searchSQL(query, user),
        searchVector(query),
      ]);
      return [...sqlHits, ...vectorHits];
    }

    default:
      return await searchVector(query);
  }
}
```

---

## 4. Summary & Next Steps

In this chapter, we:
- Initialized client abstractions for Qdrant, PostgreSQL, MongoDB, and Redis.
- Built 4 uniform data source adapters (Vector, SQL, NoSQL, S3) that normalize engine output into standardized candidate document records.
- Implemented `executeAdapter()` to dynamically route queries to target databases.

In [**Chapter 02 — Guardrails & PII Protection**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-02-guardrails-security.md), we will build the input safety guardrails, prompt injection detection, PII masking, and output verification pipeline.
teType, searchQuery, user) {
  switch (routeType) {
    case "sql":
      return await querySqlAdapter(searchQuery, user);
    case "mongo":
      return await queryMongoAdapter(searchQuery, user);
    case "s3":
      return await queryS3Adapter(searchQuery, user);
    case "vector":
    default:
      return await queryVectorAdapter(searchQuery, user);
  }
}
```

---

## 4. Summary & Next Steps

In this chapter, we:
- Initialized client abstractions for Qdrant, PostgreSQL, MongoDB, and Redis.
- Built 4 uniform data source adapters (Vector, SQL, NoSQL, S3) that normalize engine output into standardized candidate document records.
- Implemented `executeAdapter()` to dynamically route queries to target databases.

In [**Chapter 02 — Guardrails & PII Protection**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-02-guardrails-security.md), we will build the input safety guardrails, prompt injection detection, PII masking, and output verification pipeline.
