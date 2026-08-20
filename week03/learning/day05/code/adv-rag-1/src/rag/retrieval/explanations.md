# `src/rag/retrieval/` Directory Explanations

## Overview
Retrieval in production RAG systems is a multi-stage process that merges search results across multiple translated query representations and database sources.

## Pipeline Lifecycle
1. **`vectorSearch.js`**: Step 8 — Multi-Query Retrieval. Runs searches across all query representations (Original, Rewritten, Step-Back, HyDE, Sub-Queries) concurrently via `Promise.all()`.
2. **`filtering.js`**: Step 9 — Filtering. Removes candidate chunks that fail tenant isolation or role access control checks.
3. **`rrf.js`**: Step 10 — Reciprocal Rank Fusion. Combines multiple ranked candidate lists into a single consolidated ranking based on reciprocal rank scoring ($RRF(d) = \sum \frac{1}{k + r(d)}$ with $k = 60$).
4. **`reranker.js`**: Step 11 — Re-Ranking. Applies a cross-encoder / LLM relevance evaluation pass over top candidates to pick the top 5 highest-relevance context chunks.
