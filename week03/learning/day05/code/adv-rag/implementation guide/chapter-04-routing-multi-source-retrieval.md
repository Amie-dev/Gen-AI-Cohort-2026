# Chapter 04 — Query Router & Multi-Source Vector Search Engine

## 1. Chapter Goal

The goal of this chapter is to build the query routing, vector search, and filtering layers in [`src/routing/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/routing/) and [`src/retrieval/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/).

In enterprise environments, executing every search against every database is wasteful and slow. The **Query Router** analyzes incoming queries to determine whether the request belongs to:
- **`sql`**: Billing, invoices, refund eligibility, subscription plans.
- **`mongo`**: User session logs, login history, preferences.
- **`s3`**: Unstructured file bucket objects.
- **`vector`**: Text chunk embeddings stored in Qdrant.

```text
                                Search Query
                                     │
                                     ▼
                    ┌──────────────────────────────────┐
                    │ Query Router (queryRouter.js)    │
                    │ Rule-based + Semantic Intent     │
                    └────────────────┬─────────────────┘
                                     │
        ┌──────────────────┬─────────┴────────┬──────────────────┐
        ▼                  ▼                  ▼                  ▼
  [ SQL Router ]    [ Mongo Router ]    [ S3 Router ]    [ Vector Router ]
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
  Relational DB        NoSQL DB           S3 Bucket       Qdrant Vector DB
                                                                 │
                                                                 ▼
                                                        Metadata Permission Filter
                                                         (tenantId / accessLevel)
```

---

## 2. Dynamic Query Router (`src/routing/queryRouter.js`)

Create [`src/routing/queryRouter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/routing/queryRouter.js):

```javascript
/**
 * Smart Multi-Source Query Router
 * Classifies query intent to select the optimal data adapter (vector, sql, mongo, s3).
 */
export async function routeQuery(query) {
  const lower = query.toLowerCase();

  // 1. Relational SQL Billing / Subscription Intent Rules
  if (
    lower.includes("invoice") ||
    lower.includes("billing") ||
    lower.includes("subscription") ||
    lower.includes("payment") ||
    lower.includes("refund") ||
    lower.includes("monthly fee")
  ) {
    console.log(`🔀 [Router] Classified query intent -> "sql" (Relational DB)`);
    return "sql";
  }

  // 2. NoSQL User Sessions / Telemetry Intent Rules
  if (
    lower.includes("session") ||
    lower.includes("last login") ||
    lower.includes("telemetry") ||
    lower.includes("preferences")
  ) {
    console.log(`🔀 [Router] Classified query intent -> "mongo" (NoSQL DB)`);
    return "mongo";
  }

  // 3. S3 Bucket File Storage Intent Rules
  if (
    lower.includes("raw file") ||
    lower.includes("s3 bucket") ||
    lower.includes("attachment")
  ) {
    console.log(`🔀 [Router] Classified query intent -> "s3" (Object Storage)`);
    return "s3";
  }

  // 4. Default -> Qdrant Vector Semantic Search
  console.log(`🔀 [Router] Classified query intent -> "vector" (Qdrant Vector DB)`);
  return "vector";
}
```

---

## 3. Qdrant Vector Search Engine (`src/retrieval/vectorSearch.js`)

Create [`src/retrieval/vectorSearch.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/vectorSearch.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";
import { qdrant, ensureCollection } from "../db/qdrant.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function vectorSearch(searchQuery) {
  const collectionName = await ensureCollection();

  // 1. Embed query vector via OpenAI text-embedding-3-small
  const embeddingRes = await openai.embeddings.create({
    model: config.openai.embeddingModel,
    input: searchQuery,
  });

  const queryVector = embeddingRes.data[0].embedding;

  // 2. Execute Cosine similarity search in Qdrant
  const searchResults = await qdrant.search(collectionName, {
    vector: queryVector,
    limit: config.retrieval.topK,
    with_payload: true,
  });

  // 3. Transform Qdrant points into standardized candidate format
  return searchResults.map((hit) => ({
    id: hit.id,
    title: hit.payload?.source || "Vector Chunk",
    text: hit.payload?.text || "",
    source: hit.payload?.source || "Qdrant",
    score: hit.score,
    metadata: {
      chunkIndex: hit.payload?.chunkIndex,
      tenantId: hit.payload?.tenantId || "default",
      accessLevel: hit.payload?.accessLevel || 1,
    },
  }));
}
```

---

## 4. Permission & Tenant Filter (`src/retrieval/filtering.js`)

In multi-tenant SaaS applications, vector search results must be filtered to prevent User A (Tenant A) from viewing Tenant B's documents.

Create [`src/retrieval/filtering.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/filtering.js):

```javascript
export function filterResults(retrievalResultsLists, user) {
  const userTenant = user?.tenantId || "default";
  const userAccessLevel = user?.accessLevel || 1;

  // Flatten multi-query search result arrays
  const allDocs = retrievalResultsLists.flat();

  // Apply tenant and security access-level filters
  const filtered = allDocs.filter((doc) => {
    const docTenant = doc.metadata?.tenantId || "default";
    const docAccess = doc.metadata?.accessLevel || 1;

    const tenantMatch = docTenant === userTenant || docTenant === "default";
    const accessMatch = userAccessLevel >= docAccess;

    return tenantMatch && accessMatch;
  });

  return filtered;
}
```

---

## 5. Summary & Next Steps

In this chapter, we implemented:
- `routeQuery()`: Intelligent intent router selecting between SQL, NoSQL, S3, and Vector adapters.
- `vectorSearch()`: Converts queries to 1536-dimensional vectors and retrieves candidate chunks from Qdrant.
- `filterResults()`: Security filter enforcing tenant isolation and access control levels.

In [**Chapter 05 — Rank Fusion, Reranking & CRAG**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-05-fusion-reranking-crag.md), we will build Reciprocal Rank Fusion (RRF), the cross-encoder LLM reranker, and Corrective RAG (CRAG) evaluation loops.
