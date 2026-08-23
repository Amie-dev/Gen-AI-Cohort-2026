import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config();

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
export const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'production_rag_docs';

export const qdrantClient = new QdrantClient({ url: qdrantUrl });

/**
 * Initialize Qdrant collection if it does not already exist
 */
export async function initQdrantCollection(vectorSize = 1536) {
  try {
    const result = await qdrantClient.getCollections();
    const exists = result.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      console.log(`[Qdrant DB] Creating collection "${COLLECTION_NAME}"...`);
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine'
        }
      });
      console.log(`[Qdrant DB] Collection "${COLLECTION_NAME}" created successfully.`);
    }
  } catch (error) {
    console.warn(`[Qdrant DB Warning] Could not connect to Qdrant at ${qdrantUrl}. Using fallback vector search mode. Error:`, error.message);
  }
}

/**
 * Search Qdrant vector database with vector array
 */
export async function searchQdrant(vector, limit = 5, filter = null) {
  try {
    const searchParams = {
      vector,
      limit,
      with_payload: true
    };

    if (filter) {
      searchParams.filter = filter;
    }

    return await qdrantClient.search(COLLECTION_NAME, searchParams);
  } catch (error) {
    console.warn(`[Qdrant DB] Qdrant search fallback: ${error.message}`);
    return [];
  }
}
