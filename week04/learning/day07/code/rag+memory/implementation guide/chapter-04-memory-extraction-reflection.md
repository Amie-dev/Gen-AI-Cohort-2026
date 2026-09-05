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
import { callLLM } from "../utils/llm.js";

export class MemoryExtractor {
  constructor(longTermMemory) {
    this.ltm = longTermMemory;
  }

  async extractAndStore(userId, userMessage) {
    const systemPrompt = `You are a Memory Extraction Subsystem.
Analyze the user message and extract new personal facts, preferences, role definitions, or technical choices about the user.
Output JSON format: { "facts": [ { "fact": string, "category": "preference" | "fact" | "personal" | "technical" } ] }
If no new facts are present, output { "facts": [] }.`;

    try {
      const responseText = await callLLM(systemPrompt, userMessage, 0.1);
      const parsed = JSON.parse(responseText);

      const storedRecords = [];
      if (parsed.facts && Array.isArray(parsed.facts)) {
        for (const item of parsed.facts) {
          if (item.fact) {
            const record = await this.ltm.storeFact(userId, item.fact, item.category || "fact");
            storedRecords.push(record);
          }
        }
      }
      return storedRecords;
    } catch {
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
import { cosineSimilarity } from "../utils/embeddings.js";

export class MemoryReflection {
  constructor(longTermMemory) {
    this.ltm = longTermMemory;
  }

  async runDreamingPass(userId, similarityThreshold = 0.90) {
    console.log(`[MemoryReflection] Starting background dreaming pass for user: ${userId}`);
    const userFacts = await this.ltm.getAllUserFacts(userId);
    if (userFacts.length <= 1) return { consolidated: 0, evicted: 0 };

    let consolidatedCount = 0;
    let evictedCount = 0;
    const uniqueFacts = [];

    // Deduplication pass based on semantic vector similarity
    for (const factRecord of userFacts) {
      let isDuplicate = false;
      for (const existing of uniqueFacts) {
        const sim = cosineSimilarity(factRecord.embedding, existing.embedding);
        if (sim >= similarityThreshold) {
          existing.hitCount += factRecord.hitCount + 1;
          consolidatedCount++;
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        uniqueFacts.push(factRecord);
      }
    }

    // Eviction pass for stale entries (low hit count & old creation date)
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const finalFacts = uniqueFacts.filter((fact) => {
      const isOld = now - fact.createdAt > thirtyDays;
      if (isOld && fact.hitCount === 0) {
        evictedCount++;
        return false;
      }
      return true;
    });

    this.ltm.userMemories.set(userId, finalFacts);
    console.log(`[MemoryReflection] Pass Complete: ${consolidatedCount} consolidated, ${evictedCount} evicted.`);
    return { consolidated: consolidatedCount, evicted: evictedCount };
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
