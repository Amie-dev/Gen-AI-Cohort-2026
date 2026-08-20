import { generateLLM } from '../llmClient.js';

/**
 * Step 6 — Query Router
 * Section 11 & 12: Routes queries to appropriate target stores (AUTH_DB, VECTOR_DB, S3, MULTI_STORE).
 */
export async function routeQuery(query) {
  const response = await generateLLM({
    system: `
      You are a query router.

      Available stores:

      AUTH_DB:
      account, billing, user information, balances

      VECTOR_DB:
      documentation, policies, knowledge base

      S3:
      files, PDFs, images, invoices

      MULTI_STORE:
      requires multiple sources (e.g. billing plan + refund policy)

      Return JSON only format:
      {
        "targetStore": "AUTH_DB" | "VECTOR_DB" | "S3" | "MULTI_STORE"
      }
    `,
    user: query
  });

  try {
    const parsed = JSON.parse(response.text);
    if (parsed.targetStore) {
      return parsed;
    }
  } catch (err) {
    console.warn('[QueryRouter] JSON parse error, defaulting to VECTOR_DB route.');
  }

  return { targetStore: 'VECTOR_DB' };
}
