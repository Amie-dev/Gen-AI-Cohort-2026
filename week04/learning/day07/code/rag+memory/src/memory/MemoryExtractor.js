import { generateJSON } from "../utils/llm.js";

/**
 * MemoryExtractor.js
 * Fact Extraction Engine analyzing user turns to extract persistent facts and preferences.
 */
export class MemoryExtractor {
  constructor(ltmStore) {
    this.ltmStore = ltmStore;
  }

  /**
   * Extract facts from user query and save them into LTM
   */
  async extractAndStore(userId, userQuery) {
    const systemPrompt = `You are an AI Memory Extraction Engine.
Analyze the user message and extract new personal facts, preferences, or domain attributes.
Return JSON:
{
  "extractedFacts": [
    { "fact": "User is learning GenAI development", "category": "professional" },
    { "fact": "User prefers vegetarian food", "category": "preference" }
  ]
}
If no relevant persistent facts are found, return {"extractedFacts": []}.`;

    const userPrompt = `User Message: "${userQuery}"`;

    try {
      const result = await generateJSON(systemPrompt, userPrompt);
      const facts = result.extractedFacts || [];

      const savedRecords = [];
      for (const item of facts) {
        if (item.fact && typeof item.fact === "string") {
          const rec = await this.ltmStore.addFact(userId, item.fact, item.category || "general");
          savedRecords.push(rec);
        }
      }

      // Also log raw message as episodic event
      await this.ltmStore.addEpisodicEvent(userId, userQuery);

      return savedRecords;
    } catch (err) {
      console.warn(`[MemoryExtractor Warning] Extraction failed: ${err.message}`);
      return [];
    }
  }
}
