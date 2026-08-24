/**
 * Mem0 Memory Layer
 * Long-Term User Memory Store: Remembers user-specific facts, preferences, and past decisions.
 */
export class Mem0Store {
  constructor() {
    this.memories = []; // Array of { id, userId, memory, category, timestamp }
  }

  /**
   * Add new memory record for a user
   */
  async addMemory(userId, memoryText, category = "preference") {
    // Prevent direct duplicate facts
    const existing = this.memories.find(
      (m) => m.userId === userId && m.memory.toLowerCase() === memoryText.toLowerCase()
    );
    if (existing) return existing;

    const record = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      memory: memoryText,
      category,
      timestamp: new Date().toISOString(),
    };

    this.memories.push(record);
    return record;
  }

  /**
   * Search query-relevant memories for a user
   */
  async searchMemories(userId, query, topK = 3) {
    const userMems = this.memories.filter((m) => m.userId === userId);
    if (userMems.length === 0) return [];

    const queryTokens = query.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/);

    const scored = userMems.map((item) => {
      let matches = 0;
      queryTokens.forEach((tok) => {
        if (item.memory.toLowerCase().includes(tok)) matches++;
      });
      return { ...item, score: matches / (queryTokens.length || 1) };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Retrieve all memories for a user
   */
  async getAllMemories(userId) {
    return this.memories.filter((m) => m.userId === userId);
  }
}

export const mem0Client = new Mem0Store();
