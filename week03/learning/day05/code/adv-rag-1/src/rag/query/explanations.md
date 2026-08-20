# `src/rag/query/` Directory Explanations

## Overview
Pre-retrieval Query Translation addresses the fundamental limitation of naive RAG: raw user questions are frequently poorly phrased, incomplete, over-specific, or multi-faceted, leading to poor embedding search matches.

## Module Explanations
1. **`rewrite.js`**: Step 2 — Query Rewriting. Uses an LLM to rephrase the raw input into a search-optimized format while preserving intent, correcting typos, and removing conversational fluff.
2. **`stepBack.js`**: Step 3 — Step-Back Prompting. Takes a specific question and derives a higher-level conceptual query to retrieve foundational domain knowledge and principles.
3. **`subQueries.js`**: Step 4 — Sub-Query Decomposition. Deconstructs complex multi-part queries into 3-5 distinct, targeted search queries.
4. **`hyde.js`**: Step 5 — Hypothetical Document Embeddings (HyDE). Generates a synthetic hypothetical answer document to embed and search vector space, matching document-to-document semantics rather than query-to-document.
