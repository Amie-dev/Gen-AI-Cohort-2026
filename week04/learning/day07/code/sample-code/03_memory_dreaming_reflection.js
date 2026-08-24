/**
 * 03_memory_dreaming_reflection.js
 * 
 * Memory "Dreaming" (Offline Reflection & Consolidation Process)
 * Inspired by Claude's Dreaming research preview feature.
 * 
 * Problem: Agents write memories locally & incrementally over time.
 * Over many sessions, LTM accumulates duplicate facts, contradictions, and stale entries.
 * 
 * Solution: Dreaming process reads current memory store + session transcripts,
 * produces a clean, reorganized memory store where:
 *   - Duplicates are merged
 *   - Contradictions are resolved (latest value retained)
 *   - Low-relevance / stale facts are evicted or consolidated
 */

import { fileURLToPath } from "url";

export class MemoryDreamer {
  /**
   * Run Dreaming process on raw memory records
   */
  static dreamAndConsolidate(rawFacts) {
    console.log(`\n🌙 Starting Memory Dreaming Session...`);
    console.log(`[Input Store Size]: ${rawFacts.length} raw fact entries`);

    const consolidatedMap = new Map();

    for (const item of rawFacts) {
      const key = item.category || item.fact.toLowerCase().split(" ")[0];

      if (!consolidatedMap.has(key)) {
        consolidatedMap.set(key, item);
      } else {
        const existing = consolidatedMap.get(key);
        // Contradiction / Update Resolution: Keep the newest record
        if (new Date(item.createdAt) > new Date(existing.createdAt)) {
          console.log(`[Dreaming Resolution] Overwriting stale fact: "${existing.fact}" -> Newest: "${item.fact}"`);
          consolidatedMap.set(key, item);
        } else {
          console.log(`[Dreaming Duplicate] Merged duplicate entry: "${item.fact}"`);
        }
      }
    }

    const outputStore = Array.from(consolidatedMap.values());
    console.log(`✨ Dreaming Complete! Cleaned Store Size: ${outputStore.length} entries.`);
    return outputStore;
  }
}

// Execution Demo
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  const rawMemoryStore = [
    { id: "1", category: "location", fact: "User lives in New York", createdAt: "2026-01-01T10:00:00Z" },
    { id: "2", category: "diet", fact: "User prefers vegetarian food", createdAt: "2026-01-02T10:00:00Z" },
    { id: "3", category: "location", fact: "User moved to San Francisco", createdAt: "2026-02-15T12:00:00Z" }, // Contradicts #1
    { id: "4", category: "diet", fact: "User prefers vegetarian food", createdAt: "2026-02-16T10:00:00Z" }  // Duplicate #2
  ];

  const cleanedStore = MemoryDreamer.dreamAndConsolidate(rawMemoryStore);
  console.log(`\n=== Consolidated Memory Store ===`);
  console.dir(cleanedStore, { depth: null });
}
