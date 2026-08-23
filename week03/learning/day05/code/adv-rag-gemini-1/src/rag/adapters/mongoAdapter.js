/**
 * Step 7 — MongoDB Adapter
 * Section 13: Adapts MongoDB document store results to unified document format.
 */
export const mongoAdapter = {
  async search(query) {
    console.log(`[mongoAdapter] Searching MongoDB documents for query: "${query}"`);

    return [
      {
        id: 'mongo_doc_99',
        title: 'Customer Service Knowledge Base',
        text: 'MongoDB Knowledge Base entry detailing account management procedures and subscription policies.',
        source: 'MongoDB_Store',
        metadata: {
          tenantId: 'tenant_1',
          accessLevel: 1
        }
      }
    ];
  }
};
