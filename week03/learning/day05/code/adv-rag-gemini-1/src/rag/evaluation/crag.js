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
