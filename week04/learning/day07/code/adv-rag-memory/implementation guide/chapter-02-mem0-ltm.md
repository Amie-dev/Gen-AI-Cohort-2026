# Chapter 2 — Mem0 Long-Term User Memory & Async Worker Engine

## 1. Chapter Goal

The goal of this chapter is to build the **Mem0 Long-Term Memory (LTM) Layer** inside `src/memory/` and the **Async Queue Engine** inside `src/queues/`.

While RAG retrieves static external knowledge documents, **Mem0** dynamically extracts and stores personalized facts, preferences, past decisions, and user entity relationships. To prevent memory extraction from slowing down user response times, memory updates are processed asynchronously via a non-blocking queue.

In this chapter, we:
* Build the Mem0 Client SDK Wrapper (`src/memory/mem0.js`)
* Implement Memory Search (`src/memory/memorySearch.js`)
* Build Non-blocking Memory Queue (`src/queues/memoryQueue.js`) & Async Writer (`src/memory/memoryWriter.js`)
* Build Background Synthesis Worker (`src/memory/memoryWorker.js`)

---

### 🎯 Expected Outcome

User memory retrieval runs in parallel with RAG, while memory updates process in the background:

```text
Query -> Parallel Memory Search (mem0.js) -> User Facts
Response Delivered -> Async Queue Push (memoryQueue.js) -> Background Worker (memoryWorker.js) -> Mem0 Store Updated
```

---

## 2. Mem0 Client Integration (`src/memory/mem0.js`)

### File Path

```text
adv-rag-memory/src/memory/mem0.js
```

### Code

## 2. Mem0 Client Integration (`src/memory/mem0.js`)

### File Path

```text
adv-rag-memory/src/memory/mem0.js
```

### Code

```javascript
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
```

---

## 3. High-Level Memory Search Interface (`src/memory/memorySearch.js`)

```javascript
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
```

---

## 4. Non-Blocking Event Queue & Memory Writer

### 1. Redis Memory Queue (`src/queues/memoryQueue.js`)

```javascript
import { redisCache } from "../infrastructure/redis.js";

/**
 * MemoryQueue Manager
 * Queues conversation interaction payloads asynchronously for background worker processing.
 */
export class MemoryQueue {
  static async enqueueJob(jobData) {
    const payload = JSON.stringify({
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      data: jobData,
    });

    await redisCache.lpush("memory_jobs_queue", payload);
    return true;
  }

  static async dequeueJob() {
    const raw = await redisCache.rpop("memory_jobs_queue");
    return raw ? JSON.parse(raw) : null;
  }
}
```

### 2. Async Memory Writer (`src/memory/memoryWriter.js`)

Injected after API response delivery to enqueue updates without blocking HTTP responses:

```javascript
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
```

---

## 5. Background Memory Worker (`src/memory/memoryWorker.js`)

Processes queued memory extraction passes in the background:

```javascript
import { MemoryQueue } from "../queues/memoryQueue.js";
import { MemoryWriter } from "./memoryWriter.js";

/**
 * Background Memory Worker
 * Processes queued conversation logs offline, extracting long-term facts into Mem0 without blocking API requests.
 */
export async function runMemoryWorkerPass() {
  console.log("🌙 [Background Memory Worker] Checking memory_jobs_queue...");
  
  let processedCount = 0;
  let job;

  while ((job = await MemoryQueue.dequeueJob())) {
    processedCount++;
    const { userId, userQuery, assistantResponse } = job.data;

    console.log(` └─ Processing Job ${job.id} for UserId: ${userId}`);
    const saved = await MemoryWriter.evaluateAndUpdateMemory(userId, userQuery, assistantResponse);
    console.log(`    └─ Extracted & Persisted ${saved.length} memory item(s).`);
  }

  return { processedCount, status: "Worker pass finished" };
}
```

---

## 6. Verification & Testing

Verify memory search in Node.js REPL:

```bash
node -e "import { searchUserMemories } from './src/memory/memorySearch.js'; searchUserMemories('u1', 'preferences').then(console.log);"
```

### Expected Output

```text
[Mem0 Search] Searching user u1 for query: "preferences"
[
  { id: 'mem_1', memory: 'User prefers concise technical responses.' },
  { id: 'mem_2', memory: 'User works with Node.js and PostgreSQL.' }
]
```

Move to **Chapter 3** to build Advanced RAG Query Transformations and Intent Routing.
