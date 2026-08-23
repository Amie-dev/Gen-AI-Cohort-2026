import { sqlAdapter } from './sqlAdapter.js';
import { vectorAdapter } from './vectorAdapter.js';

/**
 * Step 7 — S3 Storage Adapter
 * Section 13: Adapts S3 file storage objects to unified document format.
 */
export const s3Adapter = {
  async search(query) {
    console.log(`[s3Adapter] Querying S3 object metadata for query: "${query}"`);

    return [
      {
        id: 's3_invoice_2026_08',
        title: 'Customer Invoice August 2026 PDF',
        text: 'Document S3 Path: s3://production-rag-assets/invoices/inv_2026_08.pdf. Size: 145KB. Type: PDF.',
        source: 'AWS_S3',
        metadata: {
          tenantId: 'tenant_1',
          accessLevel: 2,
          downloadUrl: 'https://s3.amazonaws.com/production-rag-assets/invoices/inv_2026_08.pdf'
        }
      }
    ];
  }
};

/**
 * Adapter Executor Dispatcher
 * Section 13: Executes appropriate search adapter based on route target store.
 */
export async function executeAdapter(route, query) {
  const store = route.targetStore || 'VECTOR_DB';

  switch (store) {
    case 'AUTH_DB':
      return await sqlAdapter.search(query);

    case 'VECTOR_DB':
      return await vectorAdapter.search(query);

    case 'S3':
      return await s3Adapter.search(query);

    case 'MULTI_STORE': {
      const [sqlResults, vectorResults] = await Promise.all([
        sqlAdapter.search(query),
        vectorAdapter.search(query)
      ]);
      return [...sqlResults, ...vectorResults];
    }

    default:
      return await vectorAdapter.search(query);
  }
}
