import { mem0Client } from "./mem0.js";

/**
 * MemorySearch Module
 * Searches query-relevant long-term memories from Mem0 for context assembly.
 */
export class MemorySearch {
  static async searchRelevantUserMemories(userId, cleanQuery, topK = 3) {
    if (!userId || !cleanQuery) return [];
    
    const results = await mem0Client.searchMemories(userId, cleanQuery, topK);
    return results;
  }
}
