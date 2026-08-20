# `src/rag/routing/` Directory Explanations

## Overview
Enterprise production architectures rarely rely on a single vector store for all types of queries. Different questions require distinct data sources.

## Module Explanations
1. **`queryRouter.js`**: Step 6 — Query Routing. Evaluates user query intents and outputs structured routing decisions directing retrieval to:
   - `AUTH_DB`: Account, billing, user balance, subscription details.
   - `VECTOR_DB`: Unstructured knowledge base, technical documentation, policies.
   - `S3`: Invoices, asset files, raw uploaded PDFs.
   - `MULTI_STORE`: Mixed queries requiring simultaneous cross-database searches.
