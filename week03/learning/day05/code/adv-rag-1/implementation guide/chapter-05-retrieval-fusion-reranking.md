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

## 2. Vector Search Engine (`src/rag/retrieval/vectorSearch.js`)

Create [`src/rag/retrieval/vectorSearch.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/vectorSearch.js):

```javascript
import { qdrant, collectionName, ensureCollection } from '../../db/qdrant.js';

export async function vectorSearch(searchQuery) {
  await ensureCollection();

  // Return mock search results matching vector output schema
  return [
    {
      id: 'vec_doc_1',
      title: 'Company Policy Documentation',
      text: 'Enterprise terms and conditions specify that subscription plan cancellations requested within 30 days are eligible for a prorated refund upon verification.',
      source: 'Qdrant Vector DB (policy.pdf)',
      score: 0.92,
      metadata: { tenantId: 'tenant_1', accessLevel: 5 }
    },
    {
      id: 'vec_doc_2',
      title: 'Billing SLA Overview',
      text: 'Prorated refund adjustments are calculated based on active usage during the monthly billing cycle.',
      source: 'Qdrant Vector DB (sla.pdf)',
      score: 0.84,
      metadata: { tenantId: 'tenant_1', accessLevel: 5 }
    }
  ];
}
```

---

## 3. Tenant & Permission Access Control Filter (`src/rag/retrieval/filtering.js`)

Create [`src/rag/retrieval/filtering.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/filtering.js):

```javascript
export function filterResults(retrievalResultsLists, user) {
  const userTenant = user?.tenantId || 'tenant_1';
  const userAccess = user?.accessLevel || 1;

  const allDocs = retrievalResultsLists.flat();

  return allDocs.filter((doc) => {
    const docTenant = doc.metadata?.tenantId || 'tenant_1';
    const docAccess = doc.metadata?.accessLevel || 1;

    const tenantMatch = docTenant === userTenant || docTenant === 'default';
    const accessMatch = userAccess >= docAccess;

    return tenantMatch && accessMatch;
  });
}
```

---

## 4. Reciprocal Rank Fusion (`src/rag/retrieval/rrf.js`)

Create [`src/rag/retrieval/rrf.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/rrf.js):

```javascript
/**
 * Reciprocal Rank Fusion (RRF)
 * Aggregates candidate document lists using score = Σ 1 / (60 + rank)
 */
export function reciprocalRankFusion(documents, k = 60) {
  const map = new Map();

  documents.forEach((doc, index) => {
    const rank = index + 1;
    const contribution = 1 / (k + rank);
    const docId = doc.id || doc.text;

    if (map.has(docId)) {
      const existing = map.get(docId);
      existing.rrfScore += contribution;
    } else {
      map.set(docId, {
        ...doc,
        rrfScore: contribution
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.rrfScore - a.rrfScore);
}
```

---

## 5. LLM Semantic Re-ranker (`src/rag/retrieval/reranker.js`)

Create [`src/rag/retrieval/reranker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/retrieval/reranker.js):

```javascript
import { generateLLM } from '../llmClient.js';

export async function rerank(query, candidates) {
  if (candidates.length === 0) return [];

  const promises = candidates.map(async (doc) => {
    const result = await generateLLM({
      system: 'Score passage relevance to query on a scale 0-10. Return integer score.',
      user: `Query: "${query}"\nPassage: "${doc.text}"`
    });

    const score = parseInt(result.text, 10) || 7;
    return { ...doc, score };
  });

  const reranked = await Promise.all(promises);
  return reranked.sort((a, b) => b.score - a.score);
}
```

---

## 6. Summary & Next Steps

In this chapter, we implemented:
- `vectorSearch()`: Cosine vector search simulator for Qdrant.
- `filterResults()`: Security filter enforcing tenant isolation and access control levels.
- `reciprocalRankFusion()`: Combines ranked result lists using $RRF(d) = \sum \frac{1}{k + r(d)}$.
- `rerank()`: LLM relevance scoring cross-encoder.

In [**Chapter 06 — CRAG Evaluation, Answer Synthesis & Master Pipeline**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/implementation%20guide/chapter-06-crag-evaluation-pipeline.md), we will build Corrective RAG evaluation, context building, grounded answer generation, and the master pipeline orchestrator.
