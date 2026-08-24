/**
 * 02_long_term_memory_rag.js
 * 
 * Long-Term Memory (LTM) & Vector RAG Pipeline for AI Agents
 * Demonstrates:
 *  1. Fact Extraction (Semantic Memory) & Event Logging (Episodic Memory)
 *  2. Vector Similarity Retrieval for Query Relevant LTM
 *  3. Context Assembly (STM + LTM Vector Search + Current Query)
 */

import { fileURLToPath } from "url";
import { ShortTermMemoryStore } from "./01_short_term_memory.js";

// Mock Embedding Function
function getEmbedding(text) {
  const hash = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Array.from({ length: 8 }, (_, i) => Math.sin(hash + i));
}

// Cosine Similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, val, idx) => sum + val * vecB[idx], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dotProduct / (magA * magB) : 0;
}

export class LongTermMemoryStore {
  constructor() {
    this.semanticMemory = []; // Facts: { id, userId, fact, vector, createdAt, hitCount }
    this.episodicMemory = []; // Time-series Events: { id, userId, event, timestamp, vector }
  }

  /**
   * Extract Facts from User Query using LLM (Simulated extraction)
   */
  async extractAndStoreFact(userId, userQuery) {
    let extractedFact = null;
    if (userQuery.toLowerCase().includes("my name is")) {
      const name = userQuery.split("my name is")[1].trim().split(" ")[0];
      extractedFact = `User name is ${name}`;
    } else if (userQuery.toLowerCase().includes("prefer") || userQuery.toLowerCase().includes("like")) {
      extractedFact = `User preference: ${userQuery}`;
    }

    if (extractedFact) {
      const record = {
        id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        userId,
        fact: extractedFact,
        vector: getEmbedding(extractedFact),
        createdAt: new Date().toISOString(),
        hitCount: 0
      };
      this.semanticMemory.push(record);
      console.log(`[LTM Extract] Saved new fact: "${extractedFact}"`);
    }

    // Always log as episodic event (immutable event log)
    this.episodicMemory.push({
      id: `ep_${Date.now()}`,
      userId,
      event: userQuery,
      timestamp: new Date().toISOString(),
      vector: getEmbedding(userQuery)
    });
  }

  /**
   * Search relevant long-term memory for a user query via Vector Search
   */
  async searchLTM(userId, query, topK = 2) {
    const queryVec = getEmbedding(query);
    const userFacts = this.semanticMemory.filter(f => f.userId === userId);

    const scored = userFacts.map(item => {
      const similarity = cosineSimilarity(queryVec, item.vector);
      return { ...item, score: similarity };
    });

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, topK);

    results.forEach(res => {
      const original = this.semanticMemory.find(f => f.id === res.id);
      if (original) original.hitCount += 1;
    });

    return results;
  }
}

// Integrated Agent Pipeline
export class MemoryAwareAgent {
  constructor() {
    this.stm = new ShortTermMemoryStore(5);
    this.ltm = new LongTermMemoryStore();
  }

  async handleUserQuery(userId, query) {
    console.log(`\n========================================`);
    console.log(`👤 User Query: "${query}"`);

    // 1. Extract & Save LTM
    await this.ltm.extractAndStoreFact(userId, query);

    // 2. Fetch Short-Term Memory
    const stmHistory = await this.stm.getRecentContext(userId);

    // 3. Fetch Query-Relevant Long-Term Memory (Vector RAG)
    const ltmRelevant = await this.ltm.searchLTM(userId, query, 2);

    // 4. Assemble Context Payload for LLM
    const systemPrompt = "You are a personalized AI Assistant with access to user memory.";
    const ltmContext = ltmRelevant.map(r => `- ${r.fact} (Hit score: ${r.hitCount})`).join("\n");
    
    console.log(`\n📦 Assembled Context Payload:`);
    console.log(`[System Prompt]: ${systemPrompt}`);
    console.log(`[Retrieved LTM Facts]:\n${ltmContext || "(None relevant retrieved)"}`);
    console.log(`[STM Window Count]: ${stmHistory.length} messages`);

    // 5. Update Short-Term Memory
    await this.stm.addMessage(userId, "user", query);
    const simulatedResponse = `[Agent Response to "${query}" using retrieved preferences]`;
    await this.stm.addMessage(userId, "assistant", simulatedResponse);

    return simulatedResponse;
  }
}

// Execution Demo
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    const agent = new MemoryAwareAgent();
    const userId = "user_42";

    await agent.handleUserQuery(userId, "Hi, my name is Sarah and I prefer gluten-free food.");
    await agent.handleUserQuery(userId, "What should I order for dinner tonight?");
  })();
}
