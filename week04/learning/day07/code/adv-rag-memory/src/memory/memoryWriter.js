import { mem0Client } from "./mem0.js";

/**
 * MemoryWriter Pipeline
 * Selective Memory Write Engine:
 * Analyzes conversation turns, decides if information is worth long-term persistence,
 * and updates Mem0 store.
 */
export class MemoryWriter {
  static async evaluateAndUpdateMemory(userId, userQuery, assistantResponse) {
    const qLower = userQuery.toLowerCase();

    const worthRemembering = [];

    if (qLower.includes("i prefer") || qLower.includes("i like") || qLower.includes("i love") || qLower.includes("my favorite")) {
      worthRemembering.push({ fact: `User preference: ${userQuery}`, category: "preference" });
    }

    if (qLower.includes("my name is")) {
      const match = userQuery.match(/my name is ([a-zA-Z]+)/i);
      if (match) worthRemembering.push({ fact: `User name is ${match[1]}`, category: "identity" });
    }

    if (qLower.includes("i work at") || qLower.includes("working on") || qLower.includes("my stack")) {
      worthRemembering.push({ fact: `User work/stack context: ${userQuery}`, category: "professional" });
    }

    const saved = [];
    for (const item of worthRemembering) {
      const record = await mem0Client.addMemory(userId, item.fact, item.category);
      saved.push(record);
    }

    return saved;
  }
}
