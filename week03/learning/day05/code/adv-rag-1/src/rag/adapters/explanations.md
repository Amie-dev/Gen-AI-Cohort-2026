# `src/rag/adapters/` Directory Explanations

## Overview
The Adapter Layer abstracts data storage implementations behind a unified interface (`search(query)`).

## Architectural Value
Without adapters, the RAG orchestration pipeline becomes tightly coupled to specific database driver code (Postgres, Qdrant, MongoDB, S3). Adding or swapping a database would require changing core pipeline code.

With the Adapter Pattern, each adapter exposes a consistent array of standard document objects (`{ id, title, text, source, metadata }`).

## Module Explanations
1. **`sqlAdapter.js`**: Fetches relational user balance & account metadata from PostgreSQL.
2. **`vectorAdapter.js`**: Executes similarity vector searches against Qdrant collection.
3. **`mongoAdapter.js`**: Queries MongoDB JSON document collections.
4. **`s3Adapter.js`**: Accesses object store metadata and file download links.
