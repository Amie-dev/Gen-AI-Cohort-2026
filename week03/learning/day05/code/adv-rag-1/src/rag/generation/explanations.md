# `src/rag/generation/` Directory Explanations

## Overview
The generation layer is responsible for formatting top-ranked documents into a clean context prompt and calling the synthesis LLM to produce a grounded response.

## Module Explanations
1. **`contextBuilder.js`**: Step 12 — Context Construction. Converts top-K document objects into indexed source strings (`SOURCE 1`, `SOURCE 2`, etc.) with titles, source tags, and main contents.
2. **`generateAnswer.js`**: Step 13 — Grounded Generation. Calls the LLM with strict system instructions prohibiting hallucination and forcing reliance strictly on provided document sources.
