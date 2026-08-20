# `src/rag/routing/` Directory Explanations

## Overview
In production enterprise environments, data resides across heterogenous database systems. Routing every query indiscriminately to a single vector database leads to low precision, security leaks, and query execution failures.

The `routing/` layer evaluates query intent pre-retrieval and routes requests to the exact database engine suited for that intent.

---

## Target Store Decision Matrix

| Target Store | Data Domain | Example Query Intents | Behind-the-Scenes Store |
| :--- | :--- | :--- | :--- |
| **`AUTH_DB`** | Relational user data, balances, subscriptions | *"What is my account plan and current balance?"* | PostgreSQL |
| **`VECTOR_DB`** | Unstructured knowledge base, policies, docs | *"What is the enterprise 30-day refund policy?"* | Qdrant Vector Database |
| **`S3`** | Asset files, uploaded raw PDFs, invoices | *"Get invoice PDF link for August 2026."* | AWS S3 Object Storage |
| **`MULTI_STORE`** | Hybrid queries requiring relational + unstructured data | *"Can I get a refund based on my current Enterprise Pro plan?"* | PostgreSQL + Qdrant Parallel Search |

---

## Code & Pseudocode (`queryRouter.js`)

Uses LLM classification with structured JSON output enforcing standard route targets.

```javascript
/**
 * Dynamic Multi-Store Router Pseudocode
 */
import { generateLLM } from '../llmClient.js';

export async function routeQuery(query) {
  const response = await generateLLM({
    system: `
      You are a query router. Categorize input queries to target data stores:

      AUTH_DB: account details, user balance, billing plans, subscriptions.
      VECTOR_DB: documentation, knowledge base, policies, FAQs.
      S3: file downloads, PDFs, raw invoices, asset files.
      MULTI_STORE: requires multiple data sources combined.

      Return JSON ONLY:
      { "targetStore": "AUTH_DB" | "VECTOR_DB" | "S3" | "MULTI_STORE" }
    `,
    user: query
  });

  try {
    const parsed = JSON.parse(response.text);
    if (parsed.targetStore) {
      return parsed;
    }
  } catch (err) {
    console.warn('[QueryRouter] JSON parse error, defaulting to VECTOR_DB route.');
  }

  // Safe fallback store
  return { targetStore: 'VECTOR_DB' };
}
```
