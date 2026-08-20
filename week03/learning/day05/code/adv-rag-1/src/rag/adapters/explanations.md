# `src/rag/adapters/` Directory Explanations

## Overview
The `src/rag/adapters/` layer implements the **Adapter Pattern** to abstract diverse database drivers behind a single unified interface.

Without adapters, core RAG pipeline code becomes tightly coupled to driver-specific APIs (PostgreSQL connection strings, Qdrant REST payloads, AWS S3 SDK commands). With adapters, the RAG engine interacts strictly with standard **Document Schema** objects.

---

## Unified Document Object Schema

Every adapter guarantees returning an array of objects adhering strictly to this schema:

```typescript
interface StandardDocument {
  id: string;          // Unique document/chunk identifier
  title: string;       // Document title or header name
  text: string;        // Main text content used for context generation
  source: string;      // Source tag ("PostgreSQL", "Qdrant_Vector", "AWS_S3", "MongoDB")
  metadata: {
    tenantId: string;  // Multi-tenant organization identifier
    accessLevel: number; // Required user permission level (e.g. 1 to 10)
    [key: string]: any;  // Optional domain attributes (urls, balances, etc.)
  };
}
```

---

## Code & Pseudocode Implementations

### 1. Adapter Execution Dispatcher (`s3Adapter.js` / `executeAdapter`)
Receives the route target determined by `queryRouter.js` and dispatches search calls to appropriate database adapters.

```javascript
/**
 * Adapter Dispatcher Pseudocode
 */
import { sqlAdapter } from './sqlAdapter.js';
import { vectorAdapter } from './vectorAdapter.js';
import { s3Adapter } from './s3Adapter.js';

export async function executeAdapter(route, query) {
  const store = route.targetStore || 'VECTOR_DB';

  switch (store) {
    case 'AUTH_DB':
      return await sqlAdapter.search(query);

    case 'VECTOR_DB':
      return await vectorAdapter.search(query);

    case 'S3':
      return await s3Adapter.search(query);

    case 'MULTI_STORE': {
      // Execute parallel multi-database searches
      const [sqlResults, vectorResults] = await Promise.all([
        sqlAdapter.search(query),
        vectorAdapter.search(query)
      ]);
      return [...sqlResults, ...vectorResults];
    }

    default:
      return await vectorAdapter.search(query);
  }
}
```

---

### 2. Concrete Adapter Snippets

#### A. Vector Adapter (`vectorAdapter.js`)
Generates 1536-dimensional OpenAI embeddings and queries Qdrant Vector DB, normalizing payload vectors to standard document schema objects.

```javascript
export const vectorAdapter = {
  async search(query) {
    const vector = await generateEmbedding(query);
    const qdrantPoints = await searchQdrant(vector, 5);

    return qdrantPoints.map(point => ({
      id: String(point.id),
      title: point.payload.title || 'Vector Document',
      text: point.payload.text,
      source: 'Qdrant_Vector',
      metadata: { tenantId: point.payload.tenantId, accessLevel: point.payload.accessLevel }
    }));
  }
};
```

#### B. SQL Adapter (`sqlAdapter.js`)
Executes PostgreSQL queries for account/billing records and wraps SQL rows into standard document schema objects.

```javascript
export const sqlAdapter = {
  async search(query) {
    const rows = await queryPostgres('SELECT * FROM accounts WHERE ...', [query]);
    return rows.map(row => ({
      id: `sql_${row.userId}`,
      title: `Account Record: ${row.userName}`,
      text: `User Plan: ${row.plan}. Status: ${row.billingStatus}. Balance: ${row.accountBalance}.`,
      source: 'PostgreSQL',
      metadata: { tenantId: 'tenant_1', accessLevel: 1 }
    }));
  }
};
```

#### C. S3 Adapter (`s3Adapter.js`)
Fetches AWS S3 object metadata and returns normalized download links and file details.

```javascript
export const s3Adapter = {
  async search(query) {
    return [{
      id: 's3_inv_2026',
      title: 'August 2026 Invoice PDF',
      text: 'S3 Object Path: s3://production-rag-assets/invoices/inv_2026_08.pdf',
      source: 'AWS_S3',
      metadata: { tenantId: 'tenant_1', accessLevel: 2, downloadUrl: 'https://s3.amazonaws.com/...' }
    }];
  }
};
```
