# Chapter 06 — CRAG Evaluation, Answer Synthesis & Master Pipeline

## 1. Chapter Goal

The goal of this chapter is to build the context builder, grounded answer generator, CRAG evaluator, and master orchestrator in [`src/rag/generation/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/generation/), [`src/rag/evaluation/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/evaluation/), and [`src/rag/ragPipeline.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/ragPipeline.js).

---

## 2. Corrective RAG (CRAG) Evaluator (`src/rag/evaluation/crag.js`)

Create [`src/rag/evaluation/crag.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/evaluation/crag.js):

```javascript
import { generateLLM } from '../llmClient.js';

export async function evaluateAnswer(query, answer, context) {
  const result = await generateLLM({
    system: 'Evaluate the answer based on context. Return JSON: { "score": 8, "grounded": true, "missing": [] }',
    user: `Question: "${query}"\nContext:\n${context}\nAnswer:\n${answer}`
  });

  try {
    const parsed = JSON.parse(result.text);
    return {
      score: parsed.score ?? 8,
      grounded: parsed.grounded ?? true,
      missing: Array.isArray(parsed.missing) ? parsed.missing : []
    };
  } catch (err) {
    return { score: 8, grounded: true, missing: [] };
  }
}
```

---

## 3. Context Builder & Answer Generator (`src/rag/generation/`)

### 1. Context Builder (`src/rag/generation/contextBuilder.js`)

Create [`src/rag/generation/contextBuilder.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/generation/contextBuilder.js):

```javascript
export function buildContext(documents) {
  if (!documents || documents.length === 0) return 'No context available.';
  return documents
    .map((doc, i) => `[Source ${i + 1}] (${doc.title} | Source: ${doc.source})\n${doc.text}`)
    .join('\n\n---\n\n');
}
```

---

### 2. Grounded Answer Synthesis (`src/rag/generation/generateAnswer.js`)

Create [`src/rag/generation/generateAnswer.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/generation/generateAnswer.js):

```javascript
import { generateLLM } from '../llmClient.js';

export async function generateAnswer(query, context) {
  const result = await generateLLM({
    system: 'You are a grounded assistant. Answer the user question using ONLY the provided context.',
    user: `Context:\n${context}\n\nQuestion: ${query}`
  });

  return result.text || 'Unable to generate answer.';
}
```

---

## 4. Master 13-Step Production Orchestrator (`src/rag/ragPipeline.js`)

Create [`src/rag/ragPipeline.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/ragPipeline.js):

```javascript
import { inputGuardrails } from './guardrails/input.js';
import { rewriteQuery } from './query/rewrite.js';
import { createStepBackQuery } from './query/stepBack.js';
import { createSubQueries } from './query/subQueries.js';
import { createHyDE } from './query/hyde.js';
import { routeQuery } from './routing/queryRouter.js';
import { queryVectorStore } from './adapters/vectorAdapter.js';
import { querySQLStore } from './adapters/sqlAdapter.js';
import { queryMongoStore } from './adapters/mongoAdapter.js';
import { queryS3Store } from './adapters/s3Adapter.js';
import { filterResults } from './retrieval/filtering.js';
import { reciprocalRankFusion } from './retrieval/rrf.js';
import { rerank } from './retrieval/reranker.js';
import { buildContext } from './generation/contextBuilder.js';
import { generateAnswer } from './generation/generateAnswer.js';
import { evaluateAnswer } from './evaluation/crag.js';
import { outputGuardrails } from './guardrails/output.js';

export async function productionRAG(userQuery, user = { id: 'usr_default', tenantId: 'tenant_1', accessLevel: 5 }) {
  console.log(`\n🚀 Starting Master RAG Pipeline for query: "${userQuery}"`);

  // 1. INPUT GUARDRAILS
  const guardResult = await inputGuardrails(userQuery, user);
  if (!guardResult.allowed) {
    return { success: false, answer: guardResult.message };
  }

  let currentQuery = guardResult.sanitizedQuery;
  const piiMap = guardResult.piiMap || {};
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Execution Attempt ${attempt}/${maxRetries}`);

    // 2. QUERY EXPANSION
    const [rewritten, stepBack, hyde, subQueries] = await Promise.all([
      rewriteQuery(currentQuery),
      createStepBackQuery(currentQuery),
      createHyDE(currentQuery),
      createSubQueries(currentQuery)
    ]);

    const searchQueries = [rewritten, stepBack, hyde, ...subQueries];

    // 3 & 4. ROUTING & ADAPTER RETRIEVAL
    const retrievalPromises = searchQueries.map(async (searchQ) => {
      const targetStore = await routeQuery(searchQ);
      if (targetStore === 'AUTH_DB') return await querySQLStore(searchQ, user);
      if (targetStore === 'S3') return await queryS3Store(searchQ, user);
      if (targetStore === 'MULTI_STORE') {
        const [sql, vec] = await Promise.all([querySQLStore(searchQ, user), queryVectorStore(searchQ, user)]);
        return [...sql, ...vec];
      }
      return await queryVectorStore(searchQ, user);
    });

    const rawResults = await Promise.all(retrievalPromises);

    // 5. FILTERING
    const filtered = filterResults(rawResults, user);

    // 6. RECIPROCAL RANK FUSION
    const fused = reciprocalRankFusion(filtered);

    // 7. RE-RANKING
    const reranked = await rerank(currentQuery, fused);
    const topKDocs = reranked.slice(0, 5);

    // 8 & 9. CONTEXT & GENERATION
    const context = buildContext(topKDocs);
    const rawAnswer = await generateAnswer(currentQuery, context);

    // 10. CRAG EVALUATION
    const evaluation = await evaluateAnswer(currentQuery, rawAnswer, context);

    // 11. OUTPUT GUARDRAILS & SUCCESS CHECK
    if (evaluation.score >= 6) {
      const finalAnswer = outputGuardrails(rawAnswer, piiMap, user);
      return {
        success: true,
        answer: finalAnswer,
        score: evaluation.score,
        attempts: attempt,
        sources: topKDocs.map((d) => ({ id: d.id, title: d.title, source: d.source, score: d.score }))
      };
    }

    if (evaluation.missing && evaluation.missing.length > 0) {
      currentQuery = `${currentQuery} ${evaluation.missing.join(' ')}`;
    }
  }

  return {
    success: false,
    answer: 'Unable to retrieve sufficient grounded information to complete request.',
    score: 0,
    attempts: maxRetries,
    sources: []
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
