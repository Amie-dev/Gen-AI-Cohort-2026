# `src/rag/evaluation/` Directory Explanations

## Overview
Corrective RAG (CRAG) evaluates generated answers before serving them to users. Even after multi-query translation and hybrid retrieval, generated answers can suffer from low groundedness or missing information.

## Module Breakdown
1. **`crag.js`**: Step 14 — Corrective RAG & CRAG Evaluator. Evaluates synthesized responses across four criteria:
   - **Groundedness**: Are claims strictly supported by retrieved context?
   - **Relevance**: Does the answer address the specific question?
   - **Completeness**: Were all sub-aspects answered?
   - **Hallucination**: Did the model invent facts?

If score is $\ge 6$, the response passes. If score $< 6$, CRAG extracts missing concept keywords and triggers a corrective retry loop up to `maxRetries = 3`.
