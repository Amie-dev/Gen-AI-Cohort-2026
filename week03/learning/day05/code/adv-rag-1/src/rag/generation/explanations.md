# `src/rag/generation/` Directory Explanations

## Overview
The `src/rag/generation/` layer formats retrieved document chunks into clean prompt context and synthesizes grounded answers using an LLM.

Providing unformatted or raw document dumps to an LLM leads to confusion, source misattribution, and context window bloat. This layer guarantees that context is cleanly structured with indexed source identifiers (`SOURCE 1`, `SOURCE 2`) and clear system constraints prohibiting hallucination.

---

## Generation Modules Breakdown

| File | Primary Responsibility | Input Payload | Output Format |
| :--- | :--- | :--- | :--- |
| **`contextBuilder.js`** | Formats top-K document objects into indexed context strings | Array of `StandardDocument` objects | Formatted context block with source headers |
| **`generateAnswer.js`** | Synthesizes grounded answer based strictly on provided context | `query` string and `context` string | Synthesized answer string with source citations |

---

## Code & Pseudocode Implementations

### 1. Context Construction (`contextBuilder.js`)
Transforms top-K re-ranked document objects into clean, structured prompt context blocks.

```javascript
/**
 * Context Construction Pseudocode
 */
export function buildContext(documents) {
  if (!documents || documents.length === 0) {
    return 'No relevant document context found.';
  }

  // Map each document into a clear, indexed source block
  return documents
    .map((doc, index) => {
      return `SOURCE ${index + 1} [${doc.source || 'KnowledgeBase'}]
Title: ${doc.title}
Content:
${doc.text}`;
    })
    .join('\n\n---\n\n');
}
```

#### Example Output Context Block:
```text
SOURCE 1 [Qdrant_Vector]
Title: Enterprise Refund Policy
Content:
Customers are eligible for a 100% full refund within 30 days of subscription renewal.

---

SOURCE 2 [PostgreSQL]
Title: Account Record: John Doe
Content:
User Plan: Enterprise Pro. Status: Active. Balance: $250.00.
```

---

### 2. Grounded LLM Generation (`generateAnswer.js`)
Synthesizes responses under strict anti-hallucination rules.

```javascript
/**
 * Grounded Answer Generation Pseudocode
 */
import { generateLLM } from '../llmClient.js';

export async function generateAnswer(query, context) {
  const response = await generateLLM({
    system: `
      You are a grounded enterprise AI assistant.

      Rules:
      1. Answer using ONLY the provided context.
      2. Do NOT invent facts or extrapolate beyond context.
      3. If the context is insufficient to answer, explicitly state that context is missing.
      4. Prefer retrieved information and cite source titles/numbers when available.
    `,
    user: `
      Question: ${query}

      Context:
      ${context}
    `
  });

  return response.text;
}
```
