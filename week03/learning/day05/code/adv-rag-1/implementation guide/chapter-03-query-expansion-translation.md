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

export async function rewriteQuery(originalQuery) {
  const result = await generateLLM({
    system: 'Rewrite the user query to be clear, explicit, and self-contained for a vector database search.',
    user: originalQuery
  });

  return result.text || originalQuery;
}
```

---

## 3. Step-Back Prompting (`src/rag/query/stepBack.js`)

Create [`src/rag/query/stepBack.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/stepBack.js):

```javascript
import { generateLLM } from '../llmClient.js';

export async function createStepBackQuery(query) {
  const result = await generateLLM({
    system: 'Generate a broader conceptual question that provides background context for the user query.',
    user: query
  });

  return result.text || query;
}
```

---

## 4. Sub-Query Decomposition (`src/rag/query/subQueries.js`)

Create [`src/rag/query/subQueries.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/subQueries.js):

```javascript
import { generateLLM } from '../llmClient.js';

export async function createSubQueries(query) {
  const result = await generateLLM({
    system: 'Decompose the question into 3-5 independent retrieval questions. Return JSON: { "queries": ["q1", "q2"] }',
    user: query
  });

  try {
    const parsed = JSON.parse(result.text);
    if (parsed.queries && Array.isArray(parsed.queries)) {
      return parsed.queries;
    }
  } catch (err) {
    // Return line fallback if JSON parsing fails
    const lines = result.text.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length > 0) return lines;
  }

  return [query];
}
```

---

## 5. HyDE Generation (`src/rag/query/hyde.js`)

Create [`src/rag/query/hyde.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/hyde.js):

```javascript
import { generateLLM } from '../llmClient.js';

export async function createHyDE(query) {
  const result = await generateLLM({
    system: 'Write a hypothetical document paragraph that answers the user question concisely.',
    user: query
  });

  return result.text || query;
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
