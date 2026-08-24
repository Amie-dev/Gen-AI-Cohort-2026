import { generateJSON } from "../utils/llm.js";

/**
 * MemoryReflection.js
 * Memory "Dreaming" & Reflection Engine
 * Background process for memory consolidation, deduplication, contradiction resolution, and eviction.
 */
export class MemoryReflection {
  constructor(ltmStore) {
    this.ltmStore = ltmStore;
  }

  /**
   * Run Memory Dreaming consolidation pass for a user
   */
  async runReflectionPass(userId) {
    const userFacts = this.ltmStore.semanticMemory.filter((f) => f.userId === userId);

    if (userFacts.length < 2) {
      return {
        mergedCount: 0,
        evictedCount: 0,
        status: "Skipped - insufficient facts for reflection",
      };
    }

    const factsFormatted = userFacts.map((f) => `ID: ${f.id} | Fact: "${f.fact}" | Created: ${f.createdAt} | Hits: ${f.hitCount}`).join("\n");

    const systemPrompt = `You are a Claude-style Memory Dreaming & Reflection Engine.
Inspect the user's semantic memory list for duplicates, contradictions, or outdated facts.
Return JSON:
{
  "contradictionsResolved": [
    { "keepId": "fact_1", "removeId": "fact_2", "reason": "User updated location from Tokyo to London" }
  ],
  "evictIds": ["fact_3"]
}`;

    const userPrompt = `Semantic Facts List:\n${factsFormatted}`;

    try {
      const plan = await generateJSON(systemPrompt, userPrompt);
      const evictSet = new Set(plan.evictIds || []);

      if (Array.isArray(plan.contradictionsResolved)) {
        plan.contradictionsResolved.forEach((c) => {
          if (c.removeId) evictSet.add(c.removeId);
        });
      }

      const evictedCount = this.ltmStore.evictFacts(Array.from(evictSet));

      return {
        mergedCount: (plan.contradictionsResolved || []).length,
        evictedCount,
        status: "Completed successfully",
      };
    } catch (err) {
      console.warn(`[MemoryReflection Warning] Reflection pass failed: ${err.message}`);
      return { mergedCount: 0, evictedCount: 0, status: `Failed: ${err.message}` };
    }
  }
}
