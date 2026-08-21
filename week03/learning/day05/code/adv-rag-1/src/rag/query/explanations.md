# `src/rag/query/` Directory Explanations

## Overview
Pre-retrieval Query Translation addresses the core weakness of naive RAG: raw user questions are often ambiguous, over-specific, missing context, or multi-faceted.

By translating a single user query into **4 complementary query representations**, the system dramatically expands recall and retrieves relevant information regardless of document phrasing.

---

## 🧭 Recommended Reading Order & Learning Path

- ⬅️ **Previous Step (Step 5.1 / RAG Stage 1 & 15)**: Guardrails (PII & Security) — [`src/rag/guardrails/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/guardrails/explanations.md)
- 📍 **Current Step (Step 5.2 / RAG Stages 2–5)**: Pre-Retrieval Query Translation (Rewrite, Step-Back, HyDE, Sub-Queries) — [`src/rag/query/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/query/explanations.md)
- ➡️ **Next Step (Step 5.3 / RAG Stages 6–8)**: Dynamic Multi-Store Query Routing — [`src/rag/routing/explanations.md`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/routing/explanations.md)

---

## Pre-Retrieval Translation Techniques Matrix

| Strategy | Target Problem | Operational Mechanism | Output Format |
| :--- | :--- | :--- | :--- |
| **Query Rewriting** (`rewrite.js`) | Typos, conversational noise, poor keyword choice | Rephrases query into search-optimized vector format | Single rewritten string |
| **Step-Back Prompting** (`stepBack.js`) | Overly narrow or hyper-specific questions | Generates a high-level conceptual question | Single broad concept string |
| **Sub-Query Decomposition** (`subQueries.js`) | Multi-part or compound questions | Breaks complex query into 3-5 independent sub-questions | Array of sub-query strings |
| **HyDE** (`hyde.js`) | Query-to-document semantic mismatch | Generates a synthetic hypothetical answer passage | Single hypothetical passage string |

---

## Detailed Code & Pseudocode Implementations

### 1. Query Rewriting (`rewrite.js`)
Rephrases raw user text into clean, domain-targeted search queries.

```javascript
/**
 * Step 2 — Query Rewriting Pseudocode
 */
import { generateLLM } from '../llmClient.js';

export async function rewriteQuery(query) {
  const response = await generateLLM({
    system: `
      Rewrite the user query for retrieval.
      Preserve original intent, fix spelling/grammar, and add missing context.
      Do NOT answer the question.
    `,
    user: query
  });

  return response.text;
}
```

---

### 2. Step-Back Prompting (`stepBack.js`)
Abstracts specific questions to retrieve foundational domain principles.

```javascript
/**
 * Step 3 — Step-Back Prompting Pseudocode
 */
import { generateLLM } from '../llmClient.js';

export async function createStepBackQuery(query) {
  const response = await generateLLM({
    system: `
      Convert the user's specific question into a broader conceptual question.
      Focus on underlying principles or general knowledge required to answer.
    `,
    user: query
  });

  return response.text;
}
```

---

### 3. Sub-Query Decomposition (`subQueries.js`)
Deconstructs complex queries into structured sub-questions with JSON parsing safety.

```javascript
/**
 * Step 4 — Sub-Query Decomposition Pseudocode
 */
import { generateLLM } from '../llmClient.js';

export async function createSubQueries(query) {
  const response = await generateLLM({
    system: `
      Break the user's question into 3-5 independent retrieval sub-questions.
      Return JSON format ONLY: { "queries": ["query1", "query2", ...] }
    `,
    user: query
  });

  try {
    const parsed = JSON.parse(response.text);
    if (Array.isArray(parsed.queries)) return parsed.queries;
  } catch (err) {
    console.warn('[SubQueries] JSON parse error, returning fallback array.');
  }

  return [query];
}
```

---

### 4. HyDE — Hypothetical Document Embeddings (`hyde.js`)
Generates an artificial response passage to convert query-to-document vector search into document-to-document vector search.

```javascript
/**
 * Step 5 — HyDE (Hypothetical Document Embeddings) Pseudocode
 */
import { generateLLM } from '../llmClient.js';

export async function createHyDE(query) {
  const response = await generateLLM({
    system: `
      Generate a hypothetical document passage that would likely contain the answer.
      Do not worry about factual certainty; focus on technical terminology and structure.
    `,
    user: query
  });

  return response.text;
}
```
