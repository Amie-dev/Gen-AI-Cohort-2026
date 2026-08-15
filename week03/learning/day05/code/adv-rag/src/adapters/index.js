import { searchSQL } from "./sqlAdapter.js";
import { searchVector } from "./vectorAdapter.js";
import { searchMongo } from "./mongoAdapter.js";
import { searchS3 } from "./s3Adapter.js";

/**
 * Step 7: Adapter Execution Layer
 * Executes queries against target data store(s) based on route.
 */
export async function executeAdapter(route, query, user = {}) {
  const store = route?.targetStore || "VECTOR_DB";

  switch (store) {
    case "AUTH_DB":
      return await searchSQL(query, user);

    case "VECTOR_DB":
      return await searchVector(query);

    case "S3":
      return await searchS3(query);

    case "MULTI_STORE": {
      const [sqlHits, vectorHits] = await Promise.all([
        searchSQL(query, user),
        searchVector(query),
      ]);
      return [...sqlHits, ...vectorHits];
    }

    default:
      return await searchVector(query);
  }
}
