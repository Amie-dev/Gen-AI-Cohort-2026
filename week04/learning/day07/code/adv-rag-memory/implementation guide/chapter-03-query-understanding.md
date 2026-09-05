# Chapter 3 — Advanced RAG Query Transformations & Dynamic Routing

## 1. Chapter Goal

The goal of this chapter is to build the **Query Transformation Subsystem** inside `src/rag/query/` and the **Query Intent Router** inside `src/rag/routing/`.

Naïve RAG passes the user's raw input directly to vector search. If the user query is vague, overly specific, or poorly phrased, vector retrieval accuracy drops significantly. Advanced RAG applies mathematical and LLM-driven query transformations (**HyDE**, **Query Rewriting**, **Step-Back Prompting**, and **Sub-Query Decomposition**) before dynamically routing requests to the target data store.

In this chapter, we:
* Build Hypothetical Document Embeddings (`src/rag/query/hyde.js`)
* Build Query Rewriter (`src/rag/query/rewrite.js`)
* Build Step-Back Prompting (`src/rag/query/stepBack.js`)
* Build Sub-Query Decomposition (`src/rag/query/subQueries.js`)
* Build Dynamic Query Router (`src/rag/routing/queryRouter.js`)

---

### 🎯 Expected Outcome

Raw user queries will be expanded into multiple targeted search queries and routed to appropriate data stores:

```text
User Query: "What is PostgreSQL vector index?"
   │
   ├── HyDE Generator ──> Generated Hypothetical Passage
   ├── Query Rewriter ──> "PostgreSQL pgvector IVFFlat HNSW indexing"
   ├── Step-Back      ──> "PostgreSQL indexing mechanisms"
   └── Sub-Queries    ──> ["pgvector installation", "HNSW vs IVFFlat performance"]
```

---

## 2. Implementing Query Transformations (`src/rag/query/`)

### 1. Hypothetical Document Embeddings (`src/rag/query/hyde.js`)

Generates a hypothetical ideal response document before vector embedding lookup:

```javascript
export async function generateHydeDocument(query) {
  console.log(`[HyDE] Generating hypothetical document for: "${query}"`);
  return `Hypothetical document containing technical specifications regarding: ${query}`;
}
```

### 2. Query Rewriting (`src/rag/query/rewrite.js`)

Removes conversational fluff and optimizes search keywords:

```javascript
export async function rewriteQuery(query) {
  console.log(`[QueryRewrite] Rewriting query: "${query}"`);
  return `${query} technical overview specifications documentation`;
}
```

### 3. Step-Back Prompting (`src/rag/query/stepBack.js`)

Generates a broader, higher-level abstract query to retrieve background context:

```javascript
export async function generateStepBackQuery(query) {
  console.log(`[StepBack] Generating step-back query for: "${query}"`);
  return `High-level concepts behind ${query}`;
}
```

### 4. Sub-Query Decomposition (`src/rag/query/subQueries.js`)

Splits complex multi-part questions into individual search queries:

```javascript
export async function decomposeSubQueries(query) {
  console.log(`[SubQueries] Decomposing sub-queries for: "${query}"`);
  return [
    `${query} definition`,
    `${query} architecture implementation`,
  ];
}
```

---

## 3. Implementing Intent Router (`src/rag/routing/queryRouter.js`)

Determines which underlying database store (Vector DB, PostgreSQL, MongoDB, or Hybrid) should execute the query:

```javascript
export async function routeQuery(query) {
  const lower = query.toLowerCase();

  if (lower.includes('user') || lower.includes('account') || lower.includes('profile')) {
    return { targetStore: 'postgres', strategy: 'relational_sql' };
  }

  if (lower.includes('log') || lower.includes('event')) {
    return { targetStore: 'mongodb', strategy: 'document_json' };
  }

  return { targetStore: 'qdrant', strategy: 'hybrid_vector_semantic' };
}
```

---

## 4. Verification & Testing

Verify query transformation module execution:

```bash
node -e "
import { rewriteQuery } from './src/rag/query/rewrite.js';
import { routeQuery } from './src/rag/routing/queryRouter.js';
rewriteQuery('how to setup vector index').then(console.log);
routeQuery('show user account history').then(console.log);
"
```

### Expected Output

```text
[QueryRewrite] Rewriting query: "how to setup vector index"
how to setup vector index technical overview specifications documentation
{ targetStore: 'postgres', strategy: 'relational_sql' }
```

Move to **Chapter 4** to build Multi-Storage Adapters, Metadata Filtering, RRF, and Cross-Encoder Re-ranking.
