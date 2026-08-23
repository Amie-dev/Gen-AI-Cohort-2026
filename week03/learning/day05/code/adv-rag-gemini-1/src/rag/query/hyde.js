import { generateLLM } from '../llmClient.js';

/**
 * Step 5 — HyDE (Hypothetical Document Embeddings)
 * Section 09: Generates hypothetical document passage that would answer the user query.
 */
export async function createHyDE(query) {
  const response = await generateLLM({
    system: `
      Generate a hypothetical document that
      would likely contain the answer to the query.

      Do not worry about factual certainty.
      Focus on terminology and semantic structure.
    `,
    user: query
  });

  return response.text;
}
