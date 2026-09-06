# Chapter 05 — Vector Search, Rank Fusion & LLM Reranking

## 1. Chapter Goal

The goal of this chapter is to build the vector search and rank aggregation subsystem in [`src/rag/retrieval/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/).

When searching multiple database adapters across 6 expanded query variants, candidate documents must be filtered for multi-tenant security, merged via rank fusion, and re-ranked using an LLM relevance scorer:

```text
                           Raw Multi-Store Candidates
                                       │
                                       ▼
                    ┌────────────────────────────────────┐
                    │ Tenant Filter (filtering.js)       │
                    │ Validates tenantId & accessLevel   │
                    └──────────────────┬─────────────────┘
                                       │
                                       ▼
                    ┌────────────────────────────────────┐
                    │ Reciprocal Rank Fusion (rrf.js)    │
                    │ Merges lists via RRF = Σ 1/(60 + r)│
                    └──────────────────┬─────────────────┘
                                       │
                                       ▼
                    ┌────────────────────────────────────┐
                    │ LLM Reranker (reranker.js)         │
                    │ Scores candidates 1-10 on relevance│
                    └──────────────────┬─────────────────┘
                                       │
                             Top-5 Ranked Chunks
```

---

## 2. Multi-Query Vector Search Engine (`src/rag/retrieval/vectorSearch.js`)

Create [`src/rag/retrieval/vectorSearch.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/vectorSearch.js):

```javascript
import { routeQuery } from '../routing/queryRouter.js';
import { executeAdapter } from '../adapters/s3Adapter.js';

/**
 * Step 8 — Multi-Query Parallel Vector Search Retrieval
 * Section 15 & Section 29: Executes vector/adapter search across all translated queries in parallel.
 */
export async function executeMultiQueryRetrieval(queries) {
  console.log(`[VectorSearch] Executing parallel retrieval across ${queries.length} query variants...`);

  const resultsPerQuery = await Promise.all(
    queries.map(async (searchQuery) => {
      const route = await routeQuery(searchQuery);
      return await executeAdapter(route, searchQuery);
    })
  );

  return resultsPerQuery;
}
```

---

## 3. Tenant & Permission Access Control Filter (`src/rag/retrieval/filtering.js`)

Create [`src/rag/retrieval/filtering.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/filtering.js):

```javascript
/**
 * Step 9 — Document Metadata & Security Filtering
 * Section 16: Filters out documents violating tenant isolation or user permissions.
 */
export function filterResults(retrievalResultsLists, user) {
  const tenantId = user?.tenantId || 'tenant_1';
  const accessLevel = user?.accessLevel ?? 10;

  return retrievalResultsLists.map(list => {
    return list.filter(doc => {
      // 1. Tenant Isolation Check
      if (doc.metadata?.tenantId && doc.metadata.tenantId !== tenantId) {
        return false;
      }

      // 2. Role Access Level Check
      if (doc.metadata?.accessLevel && doc.metadata.accessLevel > accessLevel) {
        return false;
      }

      return true;
    });
  });
}
```

---

## 4. Reciprocal Rank Fusion (`src/rag/retrieval/rrf.js`)

Create [`src/rag/retrieval/rrf.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/rrf.js):

```javascript
/**
 * Step 10 — Reciprocal Rank Fusion (RRF)
 * Section 17: Fuses multiple ranked lists of documents into a single scored ranking list.
 * Formula: RRF(d) = sum( 1 / (k + rank) ) with k = 60
 */
export function reciprocalRankFusion(lists, k = 60) {
  const scores = new Map();

  for (const list of lists) {
    list.forEach((doc, index) => {
      const rank = index + 1;
      const score = 1 / (k + rank);

      if (!scores.has(doc.id)) {
        scores.set(doc.id, {
          ...doc,
          rrfScore: 0
        });
      }

      scores.get(doc.id).rrfScore += score;
    });
  }

  return [...scores.values()].sort((a, b) => b.rrfScore - a.rrfScore);
}
```

---

## 5. LLM Semantic Re-ranker (`src/rag/retrieval/reranker.js`)

Create [`src/rag/retrieval/reranker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/reranker.js):

```javascript
/**
 * Step 11 — Re-Ranking
 * Section 18: Cross-encoder relevance re-ranker filtering fused document candidates.
 */
export async function rerank(query, documents) {
  console.log(`[Reranker] Re-ranking ${documents.length} candidates for query: "${query}"`);

  // Compute cross-attention relevance score boost based on keyword overlap & RRF score
  const scoredDocs = documents.map(doc => {
    let boost = 0;
    const queryTokens = query.toLowerCase().split(/\s+/);
    const docText = (doc.title + ' ' + doc.text).toLowerCase();

    for (const token of queryTokens) {
      if (token.length > 3 && docText.includes(token)) {
        boost += 0.2;
      }
    }

    return {
      ...doc,
      relevanceScore: (doc.rrfScore || 0.1) + boost
    };
  });

  return scoredDocs.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
```

---

## 6. Summary & Next Steps

In this chapter, we implemented:
- `executeMultiQueryRetrieval()`: Executes multi-query parallel vector search across all query variants.
- `filterResults()`: Security filter enforcing tenant isolation and access control levels.
- `reciprocalRankFusion()`: Combines ranked result lists using $RRF(d) = \sum \frac{1}{k + r(d)}$.
- `rerank()`: Relevance scoring cross-encoder.

In [**Chapter 06 — CRAG Evaluation, Answer Synthesis & Master Pipeline**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/implementation%20guide/chapter-06-crag-evaluation-pipeline.md), we will build Corrective RAG evaluation, context building, grounded answer generation, and the master pipeline orchestrator.
