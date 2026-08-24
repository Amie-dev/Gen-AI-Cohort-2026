import { getEmbedding, cosineSimilarity } from "../utils/embeddings.js";

/**
 * LongTermMemory.js
 * Long-Term Memory (LTM) Store: Semantic Facts + Episodic Events
 * Implements Vector RAG lookup and hit-score recency tracking.
 */
export class LongTermMemory {
  constructor() {
    this.semanticMemory = []; // Array of { id, userId, fact, category, vector, createdAt, hitCount, lastAccessedAt }
    this.episodicMemory = []; // Array of { id, userId, event, timestamp, vector }
  }

  /**
   * Store a semantic fact in LTM
   */
  async addFact(userId, factText, category = "general") {
    // Check if fact already exists to prevent duplication
    const existing = this.semanticMemory.find(
      (item) => item.userId === userId && item.fact.toLowerCase() === factText.toLowerCase()
    );

    if (existing) {
      existing.hitCount += 1;
      existing.lastAccessedAt = new Date().toISOString();
      return existing;
    }

    const vector = await getEmbedding(factText);
    const newRecord = {
      id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      fact: factText,
      category,
      vector,
      createdAt: new Date().toISOString(),
      hitCount: 1,
      lastAccessedAt: new Date().toISOString(),
    };

    this.semanticMemory.push(newRecord);
    return newRecord;
  }

  /**
   * Log an episodic interaction event
   */
  async addEpisodicEvent(userId, eventText) {
    const vector = await getEmbedding(eventText);
    const eventRecord = {
      id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      event: eventText,
      timestamp: new Date().toISOString(),
      vector,
    };
    this.episodicMemory.push(eventRecord);
    return eventRecord;
  }

  /**
   * Search query-relevant facts from Semantic LTM via Vector RAG
   */
  async searchRelevantFacts(userId, query, topK = 3) {
    const queryVec = await getEmbedding(query);
    const userFacts = this.semanticMemory.filter((f) => f.userId === userId);

    if (userFacts.length === 0) return [];

    const scored = userFacts.map((item) => {
      const similarity = cosineSimilarity(queryVec, item.vector);
      return { ...item, score: similarity };
    });

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, topK);

    // Update hit score metrics for retrieved facts
    results.forEach((res) => {
      const original = this.semanticMemory.find((f) => f.id === res.id);
      if (original) {
        original.hitCount += 1;
        original.lastAccessedAt = new Date().toISOString();
      }
    });

    return results;
  }

  /**
   * Evict specific fact IDs
   */
  evictFacts(factIds) {
    const initialCount = this.semanticMemory.length;
    this.semanticMemory = this.semanticMemory.filter((f) => !factIds.includes(f.id));
    return initialCount - this.semanticMemory.length;
  }
}
