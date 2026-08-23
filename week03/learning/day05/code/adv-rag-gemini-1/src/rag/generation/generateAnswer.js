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
