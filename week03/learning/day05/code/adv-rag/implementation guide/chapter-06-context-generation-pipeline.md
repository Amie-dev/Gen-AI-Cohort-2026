# Chapter 06 — Grounded Context, Answer Synthesis & Master Orchestrator

## 1. Chapter Goal

The goal of this chapter is to build the context builder, LLM answer generator, and master pipeline orchestrator in [`src/generation/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/generation/) and [`src/rag/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/rag/).

This layer connects all components created in Chapters 01–05 into a single, cohesive, production-grade 13-step execution loop (`productionRAG`).

---

## 2. Context Builder (`src/generation/contextBuilder.js`)

Create [`src/generation/contextBuilder.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/generation/contextBuilder.js):

```javascript
export function buildContext(documents) {
  if (!documents || documents.length === 0) {
    return "No relevant context available.";
  }

  return documents
    .map((doc, i) => `[Source ${i + 1}] (${doc.title} | Source: ${doc.source})\n${doc.text}`)
    .join("\n\n---\n\n");
}
```

---

## 3. Grounded Answer Synthesis (`src/generation/generateAnswer.js`)

Create [`src/generation/generateAnswer.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/generation/generateAnswer.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function generateAnswer(query, context) {
  try {
    const res = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an enterprise AI assistant. Answer the user's question accurately and concisely using ONLY the provided context. " +
            "If the answer is not supported by the context, state clearly that information is missing. Cite source titles when applicable.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${query}`,
        },
      ],
    });

    return res.choices[0]?.message?.content?.trim() || "Unable to generate answer.";
  } catch (err) {
    console.error("⚠️ Answer generation failed:", err.message);
    return "An error occurred while generating the answer.";
  }
}
```

---

## 4. Master Pipeline Orchestrator (`src/rag/ragPipeline.js`)

Create [`src/rag/ragPipeline.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/rag/ragPipeline.js):

```javascript
import { inputGuardrails } from "../guardrails/input.js";
import { rewriteQuery } from "../query/rewrite.js";
import { createStepBackQuery } from "../query/stepBack.js";
import { createSubQueries } from "../query/subQueries.js";
import { createHyDE } from "../query/hyde.js";
import { routeQuery } from "../routing/queryRouter.js";
import { executeAdapter } from "../adapters/index.js";
import { filterResults } from "../retrieval/filtering.js";
import { reciprocalRankFusion } from "../retrieval/rrf.js";
import { rerank } from "../retrieval/reranker.js";
import { buildContext } from "../generation/contextBuilder.js";
import { generateAnswer } from "../generation/generateAnswer.js";
import { evaluateAnswer } from "../evaluation/crag.js";
import { outputGuardrails } from "../guardrails/output.js";

/**
 * Master Production RAG Orchestrator Pipeline
 * Runs: Guard -> Understand -> Translate -> Route -> Retrieve -> Filter -> Fuse -> Re-rank -> Generate -> Evaluate -> Output Guard -> Answer
 */
export async function productionRAG(userQuery, user = { id: "USER_123", tenantId: "default", accessLevel: 1 }) {
  console.log(`\n==================================================`);
  console.log(`🚀 Starting Production RAG Pipeline for query: "${userQuery}"`);
  console.log(`==================================================`);

  // 1. INPUT GUARDRAILS (Jailbreak, Policy, PII Masking)
  const guardResult = await inputGuardrails(userQuery, user);
  if (!guardResult.allowed) {
    console.log(`🛑 Input Guardrails Blocked Request: ${guardResult.message}`);
    return {
      success: false,
      answer: guardResult.message,
      pipelineSteps: { guardrails: "BLOCKED" },
    };
  }

  let currentQuery = guardResult.sanitizedQuery;
  const piiMap = guardResult.piiMap || {};
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\n🔄 --- RAG Execution Attempt ${attempt}/${maxRetries} ---`);

    // 2. QUERY TRANSLATION (Parallel Spawning: Rewrite, Step-Back, HyDE, Sub-Queries)
    console.log(`🧩 [Step 2] Translating query into multiple representations...`);
    const [rewritten, stepBack, hyde, subQueries] = await Promise.all([
      rewriteQuery(currentQuery),
      createStepBackQuery(currentQuery),
      createHyDE(currentQuery),
      createSubQueries(currentQuery),
    ]);

    console.log(`   ├─ Rewritten: "${rewritten}"`);
    console.log(`   ├─ Step-Back: "${stepBack}"`);
    console.log(`   ├─ HyDE: "${hyde.slice(0, 60)}..."`);
    console.log(`   └─ Sub-Queries: ${JSON.stringify(subQueries)}`);

    const searchQueries = [rewritten, stepBack, hyde, ...subQueries];

    // 3 & 4. QUERY ROUTING & MULTI-SOURCE RETRIEVAL
    console.log(`🔀 [Step 3 & 4] Routing queries & executing multi-source retrieval in parallel...`);
    const retrievalPromises = searchQueries.map(async (searchQ) => {
      const route = await routeQuery(searchQ);
      return await executeAdapter(route, searchQ, user);
    });

    const rawRetrievalResults = await Promise.all(retrievalPromises);

    // 5. FILTERING (Permissions, Tenant ID, Metadata)
    console.log(`🔍 [Step 5] Filtering candidates by tenant & permissions...`);
    const filteredResults = filterResults(rawRetrievalResults, user);

    // 6. RECIPROCAL RANK FUSION (RRF)
    console.log(`📊 [Step 6] Merging ranked lists using Reciprocal Rank Fusion (RRF)...`);
    const fusedResults = reciprocalRankFusion(filteredResults);
    console.log(`   └─ RRF identified ${fusedResults.length} unique candidate document(s).`);

    // 7. RE-RANKING
    console.log(`⭐ [Step 7] Re-ranking candidates with semantic relevance scorer...`);
    const reranked = await rerank(currentQuery, fusedResults);

    // 8. TOP-K SELECTION
    const topKDocs = reranked.slice(0, 5);
    console.log(`   └─ Selected Top-${topKDocs.length} chunks for LLM context.`);

    // 9. CONTEXT CONSTRUCTION
    const context = buildContext(topKDocs);

    // 10. GROUNDED GENERATION
    console.log(`🤖 [Step 10] Generating grounded answer from context...`);
    const rawAnswer = await generateAnswer(currentQuery, context);

    // 11. CORRECTIVE RAG (CRAG) EVALUATION
    console.log(`📋 [Step 11] Running CRAG evaluation on generated answer...`);
    const evaluation = await evaluateAnswer(currentQuery, rawAnswer, context);
    console.log(`   └─ Evaluation Score: ${evaluation.score}/10 | Grounded: ${evaluation.grounded} | Missing: ${JSON.stringify(evaluation.missing)}`);

    // 12. OUTPUT GUARDRAILS & SUCCESS CHECK
    if (evaluation.score >= 6) {
      console.log(`✅ CRAG Passed (Score ${evaluation.score} >= 6). Applying Output Guardrails...`);
      const finalAnswer = outputGuardrails(rawAnswer, piiMap, user);

      return {
        success: true,
        answer: finalAnswer,
        score: evaluation.score,
        attempts: attempt,
        sources: topKDocs.map((d) => ({ id: d.id, title: d.title, source: d.source, score: d.score })),
      };
    }

    console.log(`⚠️ CRAG Evaluation Score low (${evaluation.score}/10). Preparing retry...`);
    if (evaluation.missing && evaluation.missing.length > 0) {
      currentQuery = `${currentQuery} ${evaluation.missing.join(" ")}`;
    }
  }

  // 13. FALLBACK RESPONSE IF ALL RETRIES EXHAUSTED
  console.log(`🛑 Max retries reached without passing CRAG threshold. Returning fallback response.`);
  return {
    success: false,
    answer: "I couldn't find enough reliable or grounded information to answer your query accurately.",
    score: 0,
    attempts: maxRetries,
    sources: [],
  };
}
```

---

## 5. Summary & Next Steps

In this chapter, we implemented:
- `buildContext()`: Formats retrieved candidate documents into clean prompt context.
- `generateAnswer()`: Prompts OpenAI `gpt-4o-mini` for grounded answer synthesis.
- `productionRAG()`: The master 13-step production orchestrator supporting security guardrails, multi-query expansion, intent routing, rank fusion, re-ranking, and CRAG self-correction.

In [**Chapter 07 — Asynchronous Ingestion & Background Worker**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-07-async-queues-worker.md), we will build the BullMQ PDF ingestion queue and indexing worker.
