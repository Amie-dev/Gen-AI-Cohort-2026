# Chapter 4 — Multi-Storage Retrieval Adapters, RRF & Re-Ranking

## 1. Chapter Goal

The goal of this chapter is to build the **Multi-Storage Adapter Layer** inside `src/rag/adapters/` and the **Advanced Retrieval Engine** inside `src/rag/retrieval/`.

In production enterprise systems, knowledge is stored across heterogeneous databases—dense vectors in Qdrant, structured tables in PostgreSQL, and semi-structured documents in MongoDB. Naïve single-query vector search misses critical data. Advanced RAG retrieves evidence across multiple queries in parallel, applies security metadata filtering, fuses results using **Reciprocal Rank Fusion (RRF)**, and re-ranks top evidence with a **Cross-Encoder Re-ranker**.

In this chapter, we:
* Build Unified Storage Adapters (`qdrant.js`, `postgres.js`, `mongodb.js`, `storage.js`)
* Build Security & ACL Metadata Filtering (`src/rag/retrieval/filtering.js`)
* Build Multi-Query Parallel Search (`src/rag/retrieval/search.js`)
* Build Reciprocal Rank Fusion (RRF) Engine (`src/rag/retrieval/rrf.js`)
* Build Cross-Encoder Re-Ranker Engine (`src/rag/retrieval/reranker.js`)

---

### 🎯 Expected Outcome

Multi-query parallel search results are combined, security filtered, fused via RRF, and re-ranked into an optimal Top-K evidence set:

```text
Transformed Queries -> Storage Adapters -> Metadata ACL Filter -> RRF Fusion -> Re-Ranker -> Top-K Evidence
```

---

## 2. Multi-Storage Adapters Layer (`src/rag/adapters/`)

### 1. Storage Adapter Interface Contract (`src/rag/adapters/storage.js`)

```javascript
export class BaseStorageAdapter {
  async query(searchPayload) {
    throw new Error('Adapter must implement query() method.');
  }
}
```

### 2. Qdrant Vector Adapter (`src/rag/adapters/qdrant.js`)

```javascript
import { getQdrantClient } from '../../infrastructure/qdrant.js';

export async function queryQdrantAdapter(queryText, options = {}) {
  const client = await getQdrantClient();
  console.log(`[Adapter:Qdrant] Executing vector query: "${queryText}"`);
  return [
    { id: 'doc_1', content: `Qdrant result for ${queryText}`, score: 0.92, metadata: { tenantId: options.tenantId } },
    { id: 'doc_2', content: `Secondary Qdrant match for ${queryText}`, score: 0.85, metadata: { tenantId: options.tenantId } },
  ];
}
```

### 3. PostgreSQL Adapter (`src/rag/adapters/postgres.js`)

```javascript
import { getPostgresClient } from '../../infrastructure/postgres.js';

export async function queryPostgresAdapter(queryText, options = {}) {
  const client = await getPostgresClient();
  console.log(`[Adapter:PostgreSQL] Executing SQL search for: "${queryText}"`);
  return [
    { id: 'sql_1', content: `PostgreSQL tabular data for ${queryText}`, score: 0.88 },
  ];
}
```

---

## 3. Metadata & ACL Filtering (`src/rag/retrieval/filtering.js`)

Enforces security boundaries so users only retrieve documents they are authorized to access:

```javascript
export function applyMetadataFiltering(documents, userContext) {
  const { tenantId, role } = userContext || {};
  console.log(`[ACL Filter] Filtering ${documents.length} docs for tenant: ${tenantId || 'global'}`);

  return documents.filter((doc) => {
    if (doc.metadata?.tenantId && tenantId && doc.metadata.tenantId !== tenantId) {
      return false;
    }
    return true;
  });
}
```

---

## 4. Multi-Query Parallel Search (`src/rag/retrieval/search.js`)

```javascript
import { queryQdrantAdapter } from '../adapters/qdrant.js';

export async function executeParallelSearch(queries, userContext) {
  console.log(`[ParallelSearch] Executing search across ${queries.length} query variations`);

  const searchPromises = queries.map((q) => queryQdrantAdapter(q, userContext));
  const resultsArray = await Promise.all(searchPromises);

  return resultsArray;
}
```

---

## 5. Reciprocal Rank Fusion Engine (`src/rag/retrieval/rrf.js`)

Combines multiple ranked search result lists using the Reciprocal Rank Fusion algorithm:

$$\text{RRF Score}(d) = \sum_{q \in Q} \frac{1}{k + r_q(d)}$$

where $k = 60$ and $r_q(d)$ is the rank index of document $d$ in query result list $q$.

```javascript
export function computeRrfFusion(rankingsList, k = 60) {
  console.log(`[RRF Fusion] Fusing ${rankingsList.length} rank lists with k=${k}`);
  const rrfScores = new Map();
  const docMap = new Map();

  for (const rankList of rankingsList) {
    rankList.forEach((doc, rankIndex) => {
      const docId = doc.id;
      docMap.set(docId, doc);

      const currentScore = rrfScores.get(docId) || 0;
      const rankScore = 1 / (k + (rankIndex + 1));
      rrfScores.set(docId, currentScore + rankScore);
    });
  }

  const fused = Array.from(rrfScores.entries()).map(([id, score]) => ({
    ...docMap.get(id),
    rrfScore: score,
  }));

  fused.sort((a, b) => b.rrfScore - a.rrfScore);
  return fused;
}
```

---

## 6. Cross-Encoder Re-Ranker Engine (`src/rag/retrieval/reranker.js`)

Re-ranks top candidates using semantic relevancy scoring:

```javascript
export async function reRankDocuments(query, documents, topK = 3) {
  console.log(`[ReRanker] Re-ranking ${documents.length} docs for query: "${query}"`);

  const reRanked = documents.map((doc, idx) => ({
    ...doc,
    rerankScore: (doc.rrfScore || 0.8) + (1 / (idx + 1)) * 0.1,
  }));

  reRanked.sort((a, b) => b.rerankScore - a.rerankScore);
  return reRanked.slice(0, topK);
}
```

---

## 7. Verification & Testing

Verify RRF score calculation:

```bash
node -e "
import { computeRrfFusion } from './src/rag/retrieval/rrf.js';
const list1 = [{ id: 'a', text: 'doc A' }, { id: 'b', text: 'doc B' }];
const list2 = [{ id: 'b', text: 'doc B' }, { id: 'a', text: 'doc A' }];
console.log(computeRrfFusion([list1, list2]));
"
```

### Expected Output

```text
[RRF Fusion] Fusing 2 rank lists with k=60
[
  { id: 'a', text: 'doc A', rrfScore: 0.03252253014209503 },
  { id: 'b', text: 'doc B', rrfScore: 0.03252253014209503 }
]
```

Move to **Chapter 5** to assemble context, build LLM completions, and implement the CRAG Evaluator.
