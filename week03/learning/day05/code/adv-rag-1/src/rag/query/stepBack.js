import { generateLLM } from '../llmClient.js';

/**
 * Step 3 — Step-Back Prompting
 * Section 07: Converts specific user question into broader conceptual question.
 */
export async function createStepBackQuery(query) {
  const response = await generateLLM({
    system: `
      Convert the user's specific question
      into a broader conceptual question.

      Focus on the underlying principles,
      concepts, or general knowledge required
      to answer the original question.
    `,
    user: query
  });

  return response.text;
}
