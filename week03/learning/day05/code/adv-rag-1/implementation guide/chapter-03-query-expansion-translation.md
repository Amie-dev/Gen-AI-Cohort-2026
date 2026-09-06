# Chapter 03 — Query Expansion & Translation Engine

## 1. Chapter Goal

The goal of this chapter is to build the query transformation module in [`src/rag/query/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/).

Human questions are often imprecise or brief. To maximize context retrieval across vector stores, we transform every incoming prompt into **4 distinct representations**:

```text
                               Raw Input Query
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│ Query Rewrite │              │   Step-Back   │              │  Sub-Queries  │
│ (rewrite.js)  │              │ (stepBack.js) │              │(subQueries.js)│
└───────┬───────┘              └───────┬───────┘              └───────┬───────┘
        │                              │                              │
        └──────────────────────────────┼──────────────────────────────┘
                                       │
                                       ▼
                               ┌───────────────┐
                               │     HyDE      │
                               │   (hyde.js)   │
                               └───────────────┘
```

---

## 2. Query Rewriting (`src/rag/query/rewrite.js`)

Create [`src/rag/query/rewrite.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/rewrite.js):

```javascript
import { generateLLM } from '../llmClient.js';

/**
 * Step 2 — Query Rewriting
 * Section 06: Rewrites the user query for optimal retrieval.
 */
export async function rewriteQuery(query) {
  const response = await generateLLM({
    system: `
      Rewrite the user query for retrieval.

      Preserve the original intent.
      Fix spelling and grammar.
      Add missing context when obvious.
      Do not answer the question.
    `,
    user: query
  });

  return response.text;
}
```

---

## 3. Step-Back Prompting (`src/rag/query/stepBack.js`)

Create [`src/rag/query/stepBack.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/stepBack.js):

```javascript
import { generateLLM } from '../llmClient.js';

/**
 * Step 3 — Step-Back Prompting
 * Section 07: Converts specific user question into broader conceptual question.
 */
export async function createStepBackQuery(query) {
  const response = await generateLLM({
    system: `
      Convert the user's specific question
      into a broader conceptual question.

      Focus on the underlying principles,
      concepts, or general knowledge required
      to answer the original question.
    `,
    user: query
  });

  return response.text;
}
```

---

## 4. Sub-Query Decomposition (`src/rag/query/subQueries.js`)

Create [`src/rag/query/subQueries.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/subQueries.js):

```javascript
import { generateLLM } from '../llmClient.js';

/**
 * Step 4 — Sub-Query Decomposition
 * Section 08: Decomposes complex user question into 3-5 independent sub-queries.
 */
export async function createSubQueries(query) {
  const response = await generateLLM({
    system: `
      Break the user's question into
      3-5 independent retrieval questions.

      Return JSON:
      {
        "queries": []
      }
    `,
    user: query
  });

  try {
    const parsed = JSON.parse(response.text);
    if (Array.isArray(parsed.queries)) {
      return parsed.queries;
    }
  } catch (err) {
    console.warn('[SubQueries] Error parsing sub-query JSON, returning query fallback list.');
  }

  return [query];
}
```

---

## 5. HyDE Generation (`src/rag/query/hyde.js`)

Create [`src/rag/query/hyde.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/hyde.js):

```javascript
import { generateLLM } from '../llmClient.js';

/**
 * Step 5 — HyDE (Hypothetical Document Embeddings)
 * Section 09: Generates hypothetical document passage that would answer the user query.
 */
export async function createHyDE(query) {
  const response = await generateLLM({
    system: `
      Generate a hypothetical document that
      would likely contain the answer to the query.

      Do not worry about factual certainty.
      Focus on terminology and semantic structure.
    `,
    user: query
  });

  return response.text;
}
```

---

## 6. Summary & Next Steps

In this chapter, we implemented:
- `rewriteQuery()`: Clarifies vague query intent.
- `createStepBackQuery()`: Generates broad background conceptual questions.
- `createSubQueries()`: Decomposes complex questions into targeted sub-questions.
- `createHyDE()`: Generates hypothetical reference document passages.

In [**Chapter 04 — Query Router & Data Source Adapters**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/implementation%20guide/chapter-04-routing-data-adapters.md), we will build the intent router and database adapters (Vector, SQL, NoSQL, S3).
