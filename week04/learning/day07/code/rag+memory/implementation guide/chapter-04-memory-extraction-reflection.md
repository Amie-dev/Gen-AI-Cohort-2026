# Chapter 4 — Fact Extraction Engine & Offline Memory Reflection

## 1. Chapter Goal

The goal of this chapter is to build the **Fact Extraction Engine** inside `src/memory/MemoryExtractor.js` and the **Offline Memory Reflection Engine** inside `src/memory/MemoryReflection.js`.

Manually saving user facts is impractical. The **MemoryExtractor** uses LLM calls to analyze incoming user queries in real-time, automatically mining facts, preferences, and personal attributes. Over time, memory stores accumulate duplicate or obsolete entries. The **MemoryReflection** background job ("Memory Dreaming") runs offline passes to consolidate duplicate memories and evict stale facts based on hit counts.

In this chapter, we:
* Build the LLM-Driven Fact Extractor (`src/memory/MemoryExtractor.js`)
* Build the Offline Memory Reflection & Eviction Engine (`src/memory/MemoryReflection.js`)
* Implement memory deduplication logic

---

### 🎯 Expected Outcome

User facts are automatically extracted during queries and consolidated during offline dreaming passes:

```text
User Message -> MemoryExtractor (LLM Mining) -> Structured JSON Facts -> LongTermMemory
Background Job -> MemoryReflection (Dreaming Pass) -> Deduplicated & Evicted LTM Store
```

---

## 2. LLM-Driven Fact Extractor (`src/memory/MemoryExtractor.js`)

Analyzes raw user input and extracts structured facts:

### File Path

```text
rag+memory/src/memory/MemoryExtractor.js
```

### Code

```javascript
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
```

---

## 3. Memory Reflection & Dreaming Engine (`src/memory/MemoryReflection.js`)

Consolidates redundant facts and evicts low-hit-count stale memories:

### File Path

```text
rag+memory/src/memory/MemoryReflection.js
```

### Code

```javascript
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
```

---

## 4. Verification & Testing

Test Memory Extraction in Node.js REPL:

```bash
node -e "
import { LongTermMemory } from './src/memory/LongTermMemory.js';
import { MemoryExtractor } from './src/memory/MemoryExtractor.js';
const ltm = new LongTermMemory();
const extractor = new MemoryExtractor(ltm);
extractor.extractAndStore('u1', 'I am a backend developer and I love PostgreSQL').then(res => {
  console.log('Extracted Facts Count:', res.length);
});
"
```

### Expected Output

```text
Extracted Facts Count: 0 (or 1 depending on LLM execution)
```

Move to **Chapter 5** to build the Master `RAGMemoryAgent` Orchestrator.
