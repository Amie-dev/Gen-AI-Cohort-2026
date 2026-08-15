import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../config.js";

export const qdrant = new QdrantClient({ url: config.qdrant.url });

export async function ensureCollection() {
  const name = config.qdrant.collection;
  try {
    const exists = await qdrant.collectionExists(name);
    if (!exists.exists) {
      await qdrant.createCollection(name, {
        vectors: {
          size: config.openai.embeddingDimensions,
          distance: "Cosine",
        },
      });
      console.log(`🗂️  Created Qdrant collection "${name}"`);
    }
  } catch (err) {
    const stillMissing = !(await qdrant.collectionExists(name)).exists;
    if (stillMissing) throw err;
  }
  return name;
}
