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
