import { vectorSearch } from "../retrieval/vectorSearch.js";

/**
 * Vector DB Adapter (Qdrant)
 */
export async function searchVector(query) {
  return await vectorSearch(query);
}
