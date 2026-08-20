# `src/rag/` Directory Explanations

## Overview
The `src/rag/` directory is the core orchestration hub of the Advanced RAG system. It decouples complex RAG operations into specialized, isolated sub-domains, moving beyond brittle monolithic RAG patterns.

---

## Sub-Domain Architectural Breakdown

```
src/rag/
├── guardrails/    ──► Input PII masking, Jailbreak detection, Output leakage checks
├── query/         ──► Pre-retrieval Query Translation (Rewrite, Step-Back, HyDE, Sub-Queries)
├── routing/       ──► Multi-store Query Intent Router (AUTH_DB, VECTOR_DB, S3, MULTI_STORE)
├── adapters/      ──► Unified storage abstraction layer (SQL, Vector, Mongo, S3)
├── retrieval/     ──► Parallel vector search, Metadata filtering, RRF fusion, Re-ranking
├── generation/    ──► Top-K Context construction and grounded answer synthesis
├── evaluation/    ──► Corrective RAG (CRAG) score evaluation & query enhancement loops
├── llmClient.js   ──► Utility wrapper for OpenAI completions with resilient fallback logic
└── ragPipeline.js ──► Master 13-stage Advanced RAG async orchestrator pipeline
```

---

## Core Utilities & Code / Pseudocode

### 1. Resilient LLM Wrapper (`llmClient.js`)
Centralizes OpenAI API calls (`gpt-4o-mini` / `gpt-3.5-turbo`) with automated fallback handling to ensure system stability during network degradation or missing API keys.

```javascript
/**
 * Resilient OpenAI Completion Wrapper Pseudocode
 */
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateLLM({ system, user, temperature = 0.2 }) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature
    });

    return { text: response.choices[0].message.content.trim() };
  } catch (error) {
    console.warn(`[llmClient Warning] OpenAI call failed (${error.message}). Using fallback mock.`);
    return { text: getFallbackResponse(system, user) };
  }
}
```

---

### 2. Master Pipeline Orchestrator (`ragPipeline.js`)
Executes all 13 production RAG stages in sequence with a CRAG feedback loop.

```javascript
/**
 * Master Pipeline Orchestration Logic Pseudocode
 */
export async function productionRAG(userQuery, user, maxRetries = 2) {
  // Stage 1: Input Guardrails & PII Sanitization
  const guardResult = await inputGuardrails(userQuery, user);
  if (!guardResult.allowed) return { allowed: false, answer: guardResult.message };

  let currentQuery = guardResult.sanitizedQuery;
  const piiMap = guardResult.piiMap;

  // Corrective RAG Evaluation Retry Loop
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Stage 2-5: Parallel Query Translation
    const [rewritten, stepBack, hyde, subQueries] = await Promise.all([
      rewriteQuery(currentQuery),
      createStepBackQuery(currentQuery),
      createHyDE(currentQuery),
      createSubQueries(currentQuery)
    ]);
    const queries = [currentQuery, rewritten, stepBack, hyde, ...subQueries];

    // Stage 6-8: Parallel Multi-Source Vector & Storage Retrieval
    const rawResults = await executeMultiQueryRetrieval(queries);

    // Stage 9: Tenant & Access Level Metadata Filtering
    const filteredResults = filterResults(rawResults, user);

    // Stage 10: Reciprocal Rank Fusion (RRF, k=60)
    const fusedResults = reciprocalRankFusion(filteredResults);

    // Stage 11: Cross-Encoder Relevance Re-Ranking
    const reranked = await rerank(currentQuery, fusedResults);
    const topK = reranked.slice(0, 5);

    // Stage 12: Context Building & Citation Formatting
    const context = buildContext(topK);

    // Stage 13: Grounded LLM Generation
    const answer = await generateAnswer(currentQuery, context);

    // Stage 14: CRAG Groundedness & Completeness Evaluation
    const evaluation = await evaluateAnswer(currentQuery, answer, context);
    if (evaluation.score >= 6) {
      // Stage 15: Output Guardrails & PII Unmasking
      const finalOutput = outputGuardrails(answer, user, piiMap);
      return { allowed: true, answer: finalOutput.answer, score: evaluation.score };
    }

    // Prepare query keyword enhancement for next retry attempt
    currentQuery += ' ' + (evaluation.missing || []).join(' ');
  }

  return { allowed: true, answer: finalAnswer, score: finalScore };
}
```
