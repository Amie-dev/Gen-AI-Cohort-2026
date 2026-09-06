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

## 2. Implementing Query Transformations (`src/rag/query/`)

### 1. Hypothetical Document Embeddings (`src/rag/query/hyde.js`)

Generates a hypothetical ideal response document before vector embedding lookup:

```javascript
/**
 * HyDE (Hypothetical Document Embeddings) Generator
 * Generates synthetic hypothetical passage to improve dense vector retrieval matching.
 */
export class HyDEGenerator {
  static generatePassage(query) {
    return `Technical Documentation passage addressing "${query}": Key details include system design, database indexing, vector similarity, and production optimization patterns.`;
  }
}
```

### 2. Query Rewriting (`src/rag/query/rewrite.js`)

Removes conversational fluff and optimizes search keywords:

```javascript
/**
 * Query Rewriter
 * Normalizes user queries into clean, keyword-dense search strings.
 */
export class QueryRewriter {
  static rewrite(query) {
    const cleaned = query
      .replace(/(please|can you|tell me|i want to know|what is|how to)/gi, "")
      .trim();
    return cleaned.length > 0 ? `${cleaned} technical specification` : query;
  }
}
```

### 3. Step-Back Prompting (`src/rag/query/stepBack.js`)

Generates a broader, higher-level abstract query to retrieve background context:

```javascript
/**
 * Step-Back Prompting Generator
 * Abstracts specific query into high-level conceptual background question.
 */
export class StepBackGenerator {
  static generateStepBack(query) {
    return `What are the core architectural concepts, design patterns, and principles behind ${query}?`;
  }
}
```

### 4. Sub-Query Decomposition (`src/rag/query/subQueries.js`)

Splits complex multi-part questions into individual search queries:

```javascript
/**
 * Sub-Query Decomposition Module
 * Decomposes complex user queries into distinct sub-questions targeting specific domains.
 */
export class SubQueryDecomposer {
  static decompose(query) {
    return [
      `What is the primary definition and technical features of ${query.slice(0, 30)}?`,
      `What are the best practices, scalability aspects, and implementation guidelines for ${query.slice(0, 30)}?`
    ];
  }
}
```

---

## 3. Implementing Intent Router (`src/rag/routing/queryRouter.js`)

Determines which underlying database store (Vector DB, PostgreSQL, MongoDB, or Hybrid) should execute the query:

```javascript
/**
 * Query Router
 * Directs search queries to appropriate backend adapters (PostgreSQL, Qdrant Vector DB, MongoDB, S3 Object Store).
 */
export class QueryRouter {
  static routeQuery(query) {
    const qLower = query.toLowerCase();
    const targets = ["vector_db"]; // Qdrant vector db is default

    if (qLower.includes("user") || qLower.includes("account") || qLower.includes("project")) {
      targets.push("postgres");
    }
    if (qLower.includes("log") || qLower.includes("telemetry") || qLower.includes("event")) {
      targets.push("mongodb");
    }
    if (qLower.includes("pdf") || qLower.includes("document") || qLower.includes("s3")) {
      targets.push("s3_storage");
    }

    return targets;
  }
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
