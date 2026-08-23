import { routeQuery } from '../routing/queryRouter.js';
import { executeAdapter } from '../adapters/s3Adapter.js';

/**
 * Step 8 — Multi-Query Parallel Vector Search Retrieval
 * Section 15 & Section 29: Executes vector/adapter search across all translated queries in parallel.
 */
export async function executeMultiQueryRetrieval(queries) {
  console.log(`[VectorSearch] Executing parallel retrieval across ${queries.length} query variants...`);

  const resultsPerQuery = await Promise.all(
    queries.map(async (searchQuery) => {
      const route = await routeQuery(searchQuery);
      return await executeAdapter(route, searchQuery);
    })
  );

  return resultsPerQuery;
}
