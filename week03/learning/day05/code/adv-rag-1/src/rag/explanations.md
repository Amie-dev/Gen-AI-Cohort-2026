# `src/rag/` Directory Explanations

## Overview
The `src/rag/` directory implements the core Advanced RAG pipeline. It orchestrates the full lifecycle of a user query through pre-retrieval query translation, dynamic routing, database adapters, fusion retrieval, re-ranking, grounded generation, CRAG evaluation, and input/output guardrails.

## Sub-Modules
- **`guardrails/`**: Input and output security checks, PII tokenization/masking, prompt injection protection.
- **`query/`**: Pre-retrieval query translation strategies (Query Rewrite, Step-Back, Sub-Queries, HyDE).
- **`routing/`**: Structured router delegating query intents to appropriate databases.
- **`adapters/`**: Database access interface layer (`sqlAdapter`, `vectorAdapter`, `mongoAdapter`, `s3Adapter`).
- **`retrieval/`**: Vector searching, metadata filtering, RRF fusion (`k=60`), and cross-encoder re-ranking.
- **`generation/`**: Structured context formatting and grounded answer synthesis.
- **`evaluation/`**: Corrective RAG (CRAG) scoring and iterative query modification retry loops.
- **`ragPipeline.js`**: Master orchestrator integrating all 13 production RAG steps into a unified async execution flow.
- **`llmClient.js`**: Utility wrapper for OpenAI completions with resilient fallback mechanisms.
