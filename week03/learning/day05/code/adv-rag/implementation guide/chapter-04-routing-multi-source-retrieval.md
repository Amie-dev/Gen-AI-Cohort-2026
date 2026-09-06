# Chapter 04 — Query Router & Multi-Source Vector Search Engine

## 1. Chapter Goal

The goal of this chapter is to build the query routing, vector search, and filtering layers in [`src/routing/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/routing/) and [`src/retrieval/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/).

In enterprise environments, executing every search against every database is wasteful and slow. The **Query Router** analyzes incoming queries to determine whether the request belongs to:
- **`AUTH_DB`**: Billing, invoices, refund eligibility, subscription plans.
- **`VECTOR_DB`**: Text chunk embeddings stored in Qdrant.
- **`S3`**: Unstructured file bucket objects.
- **`MULTI_STORE`**: Requests requiring user account data AND documentation/policy details.

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
   [ AUTH_DB ]       [ VECTOR_DB ]         [ S3 ]       [ MULTI_STORE ]
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
  Relational DB       Qdrant Vector DB    S3 Bucket       Multi Data Store
                               │
                               ▼
                    Metadata Permission Filter
                     (tenantId / accessLevel)
```

---

## 2. Dynamic Query Router (`src/routing/queryRouter.js`)

Create [`src/routing/queryRouter.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/routing/queryRouter.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 6: Query Routing
 * Routes a query to the appropriate data store (AUTH_DB, VECTOR_DB, S3, MULTI_STORE).
 */
export async function routeQuery(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "query_routing",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              targetStore: {
                type: "string",
                enum: ["AUTH_DB", "VECTOR_DB", "S3", "MULTI_STORE"],
                description: "Selected data store route.",
              },
              reasoning: {
                type: "string",
                description: "Justification for route selection.",
              },
            },
            required: ["targetStore", "reasoning"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are an enterprise query router.\n" +
            "- AUTH_DB: User account, billing, current plan, status, payment.\n" +
            "- VECTOR_DB: General documentation, conceptual questions, TDZ, code, policies.\n" +
            "- S3: Invoice download, PDFs, asset files.\n" +
            "- MULTI_STORE: Requests requiring user account data AND documentation/policy details.",
        },
        { role: "user", content: query },
      ],
    });

    return JSON.parse(completion.choices[0]?.message?.content ?? '{"targetStore":"VECTOR_DB"}');
  } catch (err) {
    console.error("⚠️ Query Routing failed, default to VECTOR_DB:", err.message);
    return { targetStore: "VECTOR_DB", reasoning: "Fallback default" };
  }
}
```

---

## 3. Qdrant Vector Search Engine (`src/retrieval/vectorSearch.js`)

Create [`src/retrieval/vectorSearch.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/vectorSearch.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";
import { qdrant } from "../db/qdrant.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Embeds a text query and performs top-K cosine similarity search on Qdrant.
 */
export async function vectorSearch(queryText) {
  try {
    const res = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: queryText,
    });
    const vector = res.data[0].embedding;

    const hits = await qdrant.search(config.qdrant.collection, {
      vector,
      limit: config.retrieval.topK,
      with_payload: true,
    });

    return hits.map((h) => ({
      id: h.id,
      title: h.payload?.source || "Indexed Chunk",
      text: h.payload?.text || "",
      source: h.payload?.source || "Qdrant Vector DB",
      score: h.score,
      metadata: {
        tenantId: h.payload?.tenantId || "default",
        accessLevel: h.payload?.accessLevel || 1,
      },
    }));
  } catch (err) {
    console.error(`⚠️ Vector search failed for query "${queryText}":`, err.message);
    
    // Fallback static knowledge chunk if Qdrant isn't populated yet
    return [
      {
        id: "fallback_chunk_1",
        title: "Standard Knowledge Base",
        text: `Document Content answering: ${queryText}. Subscriptions can be refunded within 14 days of purchase under company policy.`,
        source: "Static Knowledge Fallback",
        score: 0.85,
        metadata: { tenantId: "default", accessLevel: 1 },
      },
    ];
  }
}
```

---

## 4. Permission & Tenant Filter (`src/retrieval/filtering.js`)

In multi-tenant SaaS applications, vector search results must be filtered to prevent User A (Tenant A) from viewing Tenant B's documents.

Create [`src/retrieval/filtering.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/filtering.js):

```javascript
/**
 * Step 9: Filtering
 * Removes candidate documents failing tenant permissions, metadata criteria, or security ACL.
 */
export function filterResults(retrievalLists, user = {}) {
  const userTenant = user.tenantId || "default";
  const userAccess = user.accessLevel || 1;

  return retrievalLists.map((list) => {
    if (!Array.isArray(list)) return [];
    return list.filter((doc) => {
      const docTenant = doc.metadata?.tenantId || "default";
      const docAccess = doc.metadata?.accessLevel || 1;
      return docTenant === userTenant && docAccess <= userAccess;
    });
  });
}
```

---

## 5. Summary & Next Steps

In this chapter, we implemented:
- `routeQuery()`: Intelligent intent router selecting between AUTH_DB, VECTOR_DB, S3, and MULTI_STORE routes.
- `vectorSearch()`: Converts queries to embeddings and retrieves candidate chunks from Qdrant with static fallback.
- `filterResults()`: Security filter enforcing tenant isolation and access control levels.

In [**Chapter 05 — Rank Fusion, Reranking & CRAG**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-05-fusion-reranking-crag.md), we will build Reciprocal Rank Fusion (RRF), the cross-encoder LLM reranker, and Corrective RAG (CRAG) evaluation loops.
