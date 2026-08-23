import { generateLLM } from '../llmClient.js';

/**
 * Step 2 — Query Rewriting
 * Section 06: Rewrites the user query for optimal retrieval.
 */
export async function rewriteQuery(query) {
  const response = await generateLLM({
    system: `
      Rewrite the user query for retrieval.

      Preserve the original intent.
      Fix spelling and grammar.
      Add missing context when obvious.
      Do not answer the question.
    `,
    user: query
  });

  return response.text;
}
