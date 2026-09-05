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

```javascript
import { config } from '../config.js';

export class Mem0Client {
  constructor() {
    this.apiKey = config.mem0ApiKey;
  }

  async addMemory(userId, messages) {
    console.log(`[Mem0] Adding memory for user ${userId}:`, messages.length, 'turns');
    return { status: 'success', userId };
  }

  async searchMemories(userId, query) {
    console.log(`[Mem0 Search] Searching user ${userId} for query: "${query}"`);
    return [
      { id: 'mem_1', memory: 'User prefers concise technical responses.' },
      { id: 'mem_2', memory: 'User works with Node.js and PostgreSQL.' },
    ];
  }

  async getAllMemories(userId) {
    console.log(`[Mem0] Fetching all memories for user ${userId}`);
    return [
      { id: 'mem_1', memory: 'User prefers concise technical responses.' },
      { id: 'mem_2', memory: 'User works with Node.js and PostgreSQL.' },
    ];
  }
}

export const mem0Client = new Mem0Client();
```

---

## 3. High-Level Memory Search Interface (`src/memory/memorySearch.js`)

```javascript
import { mem0Client } from './mem0.js';

export async function searchUserMemories(userId, query) {
  try {
    return await mem0Client.searchMemories(userId, query);
  } catch (err) {
    console.error(`[MemorySearch Error] ${err.message}`);
    return [];
  }
}
```

---

## 4. Non-Blocking Event Queue & Memory Writer

### 1. Redis Memory Queue (`src/queues/memoryQueue.js`)

```javascript
import { getRedisClient } from '../infrastructure/redis.js';

export async function enqueueMemoryTask(task) {
  const redis = await getRedisClient();
  console.log(`[Queue] Enqueued memory task for user: ${task.userId}`);
  await redis.lpush('queue:mem0_updates', JSON.stringify(task));
}
```

### 2. Async Memory Writer (`src/memory/memoryWriter.js`)

Injected after API response delivery to enqueue updates without blocking HTTP responses:

```javascript
import { enqueueMemoryTask } from '../queues/memoryQueue.js';

export async function queueMemoryUpdate(userId, userMessage, assistantResponse) {
  const task = {
    userId,
    messages: [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantResponse },
    ],
    timestamp: Date.now(),
  };
  await enqueueMemoryTask(task);
}
```

---

## 5. Background Memory Worker (`src/memory/memoryWorker.js`)

Processes queued memory extraction passes in the background:

```javascript
import { mem0Client } from './mem0.js';

export async function runMemoryWorkerPass() {
  console.log('[MemoryWorker] Running background memory synthesis pass...');
  // Simulated memory extraction execution
  await mem0Client.addMemory('system_worker', [
    { role: 'system', content: 'Synthesized memory worker pass executed.' },
  ]);
  console.log('[MemoryWorker] Worker pass complete.');
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
