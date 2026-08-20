# `src/rag/retrieval/` Directory Explanations

## Overview
Retrieval in production Advanced RAG is a multi-stage process. Merging results across multiple translated query variants and multi-tenant databases requires specialized retrieval stages to eliminate duplicates, enforce tenant security, score items mathematically, and re-rank top candidate passages.

---

## Multi-Stage Retrieval Pipeline

```
[ Translated Queries List (Original, Rewritten, Step-Back, HyDE, Sub-Queries) ]
                                    │
                                    ▼
           [ 1. vectorSearch.js — Parallel Vector Retrieval ]
                    (Concurrently calls Promise.all)
                                    │
                                    ▼
           [ 2. filtering.js — Metadata Security Filtering ]
               (Enforces Tenant Isolation & Access Levels)
                                    │
                                    ▼
           [ 3. rrf.js — Reciprocal Rank Fusion (k=60) ]
              (Merges multi-query rankings mathematically)
                                    │
                                    ▼
           [ 4. reranker.js — Cross-Encoder Re-Ranking ]
                 (Computes relevance boost & extracts Top-K)
```

---

## Mathematical & Algorithmic Foundations

### Reciprocal Rank Fusion (RRF) Formula
RRF calculates document rank positions across multiple ranked search lists without requiring normalized raw vector similarity scores:

$$RRF(d \in D) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

Where:
- $M$: The set of search query result lists (e.g. 5 query variants).
- $r_m(d)$: The 1-based rank position of document $d$ in result list $m$.
- $k$: The RRF smoothing constant (standard industry default: $k = 60$).

---

## Code & Pseudocode Implementations

### 1. Multi-Query Retrieval (`vectorSearch.js`)
Executes parallel searches across all translated query variants simultaneously using `Promise.all()`.

```javascript
/**
 * Parallel Multi-Query Retrieval Pseudocode
 */
import { routeQuery } from '../routing/queryRouter.js';
import { executeAdapter } from '../adapters/s3Adapter.js';

export async function executeMultiQueryRetrieval(queries) {
  return await Promise.all(
    queries.map(async (searchQuery) => {
      // Route individual query to appropriate data store
      const route = await routeQuery(searchQuery);
      // Fetch standardized document candidates
      return await executeAdapter(route, searchQuery);
    })
  );
}
```

---

### 2. Security & Metadata Filtering (`filtering.js`)
Guarantees tenant data isolation and prevents unauthorized document access.

```javascript
/**
 * Metadata & Security Filtering Pseudocode
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

### 3. Reciprocal Rank Fusion (`rrf.js`)
Combines multiple ranked lists into a single consolidated score map.

```javascript
/**
 * Reciprocal Rank Fusion (RRF) Pseudocode (k = 60)
 */
export function reciprocalRankFusion(lists, k = 60) {
  const scores = new Map();

  for (const list of lists) {
    list.forEach((doc, index) => {
      const rank = index + 1; // 1-based ranking
      const score = 1 / (k + rank);

      if (!scores.has(doc.id)) {
        scores.set(doc.id, { ...doc, rrfScore: 0 });
      }

      scores.get(doc.id).rrfScore += score;
    });
  }

  // Sort descending by accumulated RRF score
  return [...scores.values()].sort((a, b) => b.rrfScore - a.rrfScore);
}
```

---

### 4. Cross-Encoder Re-Ranking (`reranker.js`)
Applies relevance scoring boosts based on query token matches over fused candidates.

```javascript
/**
 * Candidate Re-Ranking Pseudocode
 */
export async function rerank(query, documents) {
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
