import OpenAI from "openai";
import { config } from "../config.js";

let openaiClient = null;
if (config.openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Deterministic vector embedding fallback for offline / key-less runs
 */
function getDeterministicMockEmbedding(text, dimension = 16) {
  const normText = text.toLowerCase().trim();
  const vector = new Array(dimension).fill(0);
  
  for (let i = 0; i < normText.length; i++) {
    const charCode = normText.charCodeAt(i);
    const index = i % dimension;
    vector[index] += Math.sin(charCode * (i + 1));
  }

  // Normalize to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude === 0 ? vector : vector.map(v => v / magnitude);
}

/**
 * Get vector embedding for a given text string
 */
export async function getEmbedding(text) {
  if (!text || typeof text !== "string") {
    return new Array(16).fill(0);
  }

  if (openaiClient && config.embeddingProvider === "openai") {
    try {
      const response = await openaiClient.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (err) {
      console.warn(`[Embedding Warning] OpenAI API call failed, falling back to mock: ${err.message}`);
    }
  }

  return getDeterministicMockEmbedding(text);
}

/**
 * Compute Cosine Similarity between two vector arrays
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  return magA && magB ? dotProduct / (magA * magB) : 0;
}
