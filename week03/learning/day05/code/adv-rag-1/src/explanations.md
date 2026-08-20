# `src/` Directory Explanations

## Overview
The `src/` directory serves as the root container for all application logic in the Advanced RAG system.

## Subdirectories & Modules
1. **`server.js`**: The Express HTTP API server entry point. Exposes REST API endpoints for user queries, async document indexing requests, system status, and error handling middleware.
2. **`db/`**: Handles connections and client instances for persistent data stores (Qdrant, Redis, Postgres).
3. **`queues/`**: Contains BullMQ producer queues and background worker handlers for heavy asynchronous processing tasks like PDF text extraction, chunking, and embedding generation.
4. **`rag/`**: The heart of the Advanced RAG system, implementing input guardrails, query translation strategies, dynamic routing, database adapters, retrieval/fusion pipelines, grounded answer generation, CRAG evaluators, and output safety checks.
