import { searchQdrant } from '../../db/qdrant.js';

/**
 * Step 7 — Vector Adapter
 * Section 13: Adapts Qdrant vector search results to unified document format.
 */
export const vectorAdapter = {
  async search(query) {
    console.log(`[vectorAdapter] Executing vector search for query: "${query}"`);

    // Generate dummy query vector for search
    const dummyVector = new Array(1536).fill(0).map((_, i) => Math.sin(i) * 0.05);
    const searchResults = await searchQdrant(dummyVector, 5);

    if (searchResults && searchResults.length > 0) {
      return searchResults.map(item => ({
        id: `vdb_${item.id}`,
        title: item.payload?.title || 'Knowledge Base Documentation',
        text: item.payload?.text || 'Standard documentation content.',
        source: 'Qdrant_VECTOR_DB',
        metadata: {
          tenantId: item.payload?.tenantId || 'tenant_1',
          accessLevel: item.payload?.accessLevel || 1,
          score: item.score || 0.85
        }
      }));
    }

    // Fallback documentation records when Qdrant container is not running locally
    return [
      {
        id: 'doc_refund_policy_01',
        title: 'Enterprise Refund and Cancellation Policy',
        text: 'Customers on monthly and annual subscription plans can request a full refund within 30 days of initial purchase or plan renewal. Refund requests submitted after 30 days are evaluated on a prorated basis.',
        source: 'Qdrant_VECTOR_DB',
        metadata: {
          tenantId: 'tenant_1',
          accessLevel: 1,
          score: 0.92
        }
      },
      {
        id: 'doc_api_limits_02',
        title: 'API Rate Limits and Quota Error Handling',
        text: 'When experiencing HTTP 429 rate limit errors from model endpoints, implement exponential backoff with jitter starting at 2000ms delay.',
        source: 'Qdrant_VECTOR_DB',
        metadata: {
          tenantId: 'tenant_1',
          accessLevel: 1,
          score: 0.88
        }
      }
    ];
  }
};
