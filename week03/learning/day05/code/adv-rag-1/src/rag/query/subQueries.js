import { generateLLM } from '../llmClient.js';

/**
 * Step 4 — Sub-Query Decomposition
 * Section 08: Decomposes complex user question into 3-5 independent sub-queries.
 */
export async function createSubQueries(query) {
  const response = await generateLLM({
    system: `
      Break the user's question into
      3-5 independent retrieval questions.

      Return JSON:
      {
        "queries": []
      }
    `,
    user: query
  });

  try {
    const parsed = JSON.parse(response.text);
    if (Array.isArray(parsed.queries)) {
      return parsed.queries;
    }
  } catch (err) {
    console.warn('[SubQueries] Error parsing sub-query JSON, returning query fallback list.');
  }

  return [query];
}
