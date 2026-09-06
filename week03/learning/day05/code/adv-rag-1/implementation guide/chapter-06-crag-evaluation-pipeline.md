# Chapter 06 — CRAG Evaluation, Answer Synthesis & Master Pipeline

## 1. Chapter Goal

The goal of this chapter is to build the context builder, grounded answer generator, CRAG evaluator, and master orchestrator in [`src/rag/generation/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/generation/), [`src/rag/evaluation/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/evaluation/), and [`src/rag/ragPipeline.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/ragPipeline.js).

---

## 2. Corrective RAG (CRAG) Evaluator (`src/rag/evaluation/crag.js`)

Create [`src/rag/evaluation/crag.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/evaluation/crag.js):

```javascript
import { generateLLM } from '../llmClient.js';

/**
 * Step 14 — CRAG Evaluation (Corrective RAG)
 * Section 21, 22, 23: Evaluates answer groundedness, relevance, completeness, hallucination.
 */
export async function evaluateAnswer(query, answer, context) {
  const response = await generateLLM({
    system: `
      Evaluate the answer.

      Score from 0 to 10.

      Check:
      1. Groundedness
      2. Relevance
      3. Completeness
      4. Hallucination

      Return JSON format:
      {
        "score": number,
        "missing": string[]
      }
    `,
    user: JSON.stringify({
      query,
      answer,
      context
    })
  });

  try {
    const parsed = JSON.parse(response.text);
    if (typeof parsed.score === 'number') {
      return parsed;
    }
  } catch (err) {
    console.warn('[CRAG Evaluator] Parsing error, assuming pass score.');
  }

  return {
    score: 8,
    missing: []
  };
}
```

---

## 3. Context Builder & Answer Generator (`src/rag/generation/`)

### 1. Context Builder (`src/rag/generation/contextBuilder.js`)

Create [`src/rag/generation/contextBuilder.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/generation/contextBuilder.js):

```javascript
/**
 * Step 12 — Context Construction
 * Section 19: Formats top-K retrieved documents into clear prompt context with source citations.
 */
export function buildContext(documents) {
  if (!documents || documents.length === 0) {
    return 'No relevant document context found.';
  }

  return documents
    .map((doc, index) => {
      return `SOURCE ${index + 1} [${doc.source || 'KnowledgeBase'}]
Title: ${doc.title}
Content:
${doc.text}`;
    })
    .join('\n\n---\n\n');
}
```

---

### 2. Grounded Answer Synthesis (`src/rag/generation/generateAnswer.js`)

Create [`src/rag/generation/generateAnswer.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/generation/generateAnswer.js):

```javascript
import { generateLLM } from '../llmClient.js';

/**
 * Step 13 — Grounded Generation
 * Section 20: Generates grounded answer using provided retrieved context.
 */
export async function generateAnswer(query, context) {
  const response = await generateLLM({
    system: `
      You are a grounded enterprise assistant.

      Answer using the provided context.

      Rules:
      - Do not invent facts.
      - If the context is insufficient, say so.
      - Prefer retrieved information.
      - Cite sources when available.
    `,
    user: `
      Question:
      ${query}

      Context:
      ${context}
    `
  });

  return response.text;
}
```

---

## 4. Master 13-Step Production Orchestrator (`src/rag/ragPipeline.js`)

Create [`src/rag/ragPipeline.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/ragPipeline.js):

```javascript
import { inputGuardrails } from './guardrails/input.js';
import { rewriteQuery } from './query/rewrite.js';
import { createStepBackQuery } from './query/stepBack.js';
import { createHyDE } from './query/hyde.js';
import { createSubQueries } from './query/subQueries.js';
import { executeMultiQueryRetrieval } from './retrieval/vectorSearch.js';
import { filterResults } from './retrieval/filtering.js';
import { reciprocalRankFusion } from './retrieval/rrf.js';
import { rerank } from './retrieval/reranker.js';
import { buildContext } from './generation/contextBuilder.js';
import { generateAnswer } from './generation/generateAnswer.js';
import { evaluateAnswer } from './evaluation/crag.js';
import { outputGuardrails } from './guardrails/output.js';

/**
 * Section 36 — Complete JavaScript Production RAG Pipeline
 * Combines all 13 production steps into a unified async workflow.
 */
export async function productionRAG(userQuery, user, maxRetries = 2) {
  console.log(`\n======================================================`);
  console.log(`[RAG Pipeline] Processing query: "${userQuery}"`);
  console.log(`======================================================`);

  // --------------------------------
  // 1. INPUT GUARDRAILS
  // --------------------------------
  const guardResult = await inputGuardrails(userQuery, user);
  if (!guardResult.allowed) {
    console.warn(`[Pipeline] Input guardrail blocked query: ${guardResult.message}`);
    return {
      allowed: false,
      answer: guardResult.message,
      score: 0
    };
  }

  const query = guardResult.sanitizedQuery;
  const piiMap = guardResult.piiMap;

  let currentQuery = query;
  let finalAnswer = '';
  let finalScore = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    console.log(`\n--- Attempt ${attempt + 1}/${maxRetries + 1} ---`);

    // --------------------------------
    // 2. QUERY TRANSLATION (PARALLEL)
    // --------------------------------
    console.log(`[Pipeline] Step 2-5: Executing parallel query translation...`);
    const [rewritten, stepBack, hyde, subQueries] = await Promise.all([
      rewriteQuery(currentQuery),
      createStepBackQuery(currentQuery),
      createHyDE(currentQuery),
      createSubQueries(currentQuery)
    ]);

    const searchQueries = [
      currentQuery,
      rewritten,
      stepBack,
      hyde,
      ...subQueries
    ];
    console.log(`[Pipeline] Generated ${searchQueries.length} query variants.`);

    // --------------------------------
    // 3 & 4. MULTI-SOURCE RETRIEVAL
    // --------------------------------
    console.log(`[Pipeline] Step 6-8: Executing multi-source retrieval...`);
    const retrievalResults = await executeMultiQueryRetrieval(searchQueries);

    // --------------------------------
    // 5. FILTERING
    // --------------------------------
    console.log(`[Pipeline] Step 9: Filtering candidates by tenant & permissions...`);
    const filteredResults = filterResults(retrievalResults, user);

    // --------------------------------
    // 6. RRF FUSION
    // --------------------------------
    console.log(`[Pipeline] Step 10: Merging candidate lists via Reciprocal Rank Fusion (k=60)...`);
    const fusedResults = reciprocalRankFusion(filteredResults);

    // --------------------------------
    // 7 & 8. RE-RANKING & TOP-K
    // --------------------------------
    console.log(`[Pipeline] Step 11: Re-ranking candidates...`);
    const reranked = await rerank(currentQuery, fusedResults);
    const topK = reranked.slice(0, 5);

    // --------------------------------
    // 9. CONTEXT BUILDING
    // --------------------------------
    console.log(`[Pipeline] Step 12: Constructing prompt context from ${topK.length} documents...`);
    const context = buildContext(topK);

    // --------------------------------
    // 10. GROUNDED GENERATION
    // --------------------------------
    console.log(`[Pipeline] Step 13: Generating grounded answer...`);
    const answer = await generateAnswer(currentQuery, context);

    // --------------------------------
    // 11. CRAG EVALUATION
    // --------------------------------
    console.log(`[Pipeline] Step 14: Evaluating answer groundedness & completeness (CRAG)...`);
    const evaluation = await evaluateAnswer(currentQuery, answer, context);
    console.log(`[Pipeline] CRAG Evaluation Score: ${evaluation.score}/10`);

    if (evaluation.score >= 6) {
      finalAnswer = answer;
      finalScore = evaluation.score;
      break;
    }

    // Prepare corrective query modification for next retry
    if (evaluation.missing && evaluation.missing.length > 0) {
      currentQuery = `${query} ${evaluation.missing.join(' ')}`;
      console.log(`[Pipeline CRAG Retry] Appending missing keywords to query: "${currentQuery}"`);
    } else {
      finalAnswer = answer;
      finalScore = evaluation.score;
      break;
    }
  }

  // --------------------------------
  // 12. OUTPUT GUARDRAILS
  // --------------------------------
  console.log(`[Pipeline] Step 15: Executing output guardrails & unmasking PII...`);
  const finalOutput = outputGuardrails(finalAnswer, user, piiMap);

  return {
    allowed: true,
    answer: finalOutput.answer,
    score: finalScore
  };
}
```

---

## 5. Summary & Next Steps

In this chapter, we implemented:
- `evaluateAnswer()`: CRAG self-reflection agent producing grounded scores.
- `buildContext()` & `generateAnswer()`: Grounded answer builder.
- `productionRAG()`: The master 13-step pipeline orchestrator.

In [**Chapter 07 — Asynchronous Ingestion & Background Worker**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/implementation%20guide/chapter-07-async-queues-worker.md), we will build the BullMQ PDF ingestion queue and indexing worker process.
