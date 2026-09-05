# Chapter 3 — Agent Memory Architecture: STM Buffer & LTM Vector Store

## 1. Chapter Goal

The goal of this chapter is to build the **Short-Term Memory (STM)** manager inside `src/memory/ShortTermMemory.js` and the **Long-Term Memory (LTM)** vector store inside `src/memory/LongTermMemory.js`.

Stateless LLM APIs treat every API call independently. An intelligent agent requires two memory systems:
1. **Short-Term Memory (STM)**: Persists recent chat turns in a sliding window buffer for local conversation coherence.
2. **Long-Term Memory (LTM)**: Stores extracted user facts, preferences, and attributes across sessions, vector-searchable with hit-count tracking.

In this chapter, we:
* Build the Sliding Window STM Buffer (`src/memory/ShortTermMemory.js`)
* Build the LTM Vector Memory Store (`src/memory/LongTermMemory.js`)
* Implement hit count tracking for memory decay and eviction mechanics

---

### 🎯 Expected Outcome

The agent retains short-term chat context while querying long-term user facts via semantic vector similarity:

```text
Session Turns ──> ShortTermMemory (Sliding Window Buffer)
User Query    ──> LongTermMemory (Cosine Similarity Search over Facts)
```

---

## 2. Short-Term Memory Buffer (`src/memory/ShortTermMemory.js`)

### File Path

```text
rag+memory/src/memory/ShortTermMemory.js
```

### Code

```typescript
export class ShortTermMemory {
  constructor(maxTurns = 5) {
    this.sessions = new Map();
    this.maxTurns = maxTurns;
  }

  async addMessage(sessionId, role, content) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    const history = this.sessions.get(sessionId);
    history.push({ role, content, timestamp: Date.now() });

    // Maintain sliding window buffer
    if (history.length > this.maxTurns * 2) {
      this.sessions.set(sessionId, history.slice(-this.maxTurns * 2));
    }
  }

  async getRecentWindow(sessionId, turnLimit = 5) {
    const history = this.sessions.get(sessionId) || [];
    return history.slice(-turnLimit * 2);
  }

  async clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}
```

---

## 3. Long-Term Memory Vector Store (`src/memory/LongTermMemory.js`)

Stores personalized facts categorized by type (`preference`, `fact`, `personal`, `technical`), tracking hit counts whenever facts are retrieved.

### File Path

```text
rag+memory/src/memory/LongTermMemory.js
```

### Code

```typescript
import { getEmbedding, cosineSimilarity } from "../utils/embeddings.js";

export class LongTermMemory {
  constructor() {
    this.userMemories = new Map();
  }

  async storeFact(userId, fact, category = "fact") {
    if (!this.userMemories.has(userId)) {
      this.userMemories.set(userId, []);
    }

    const embedding = await getEmbedding(fact);
    const memoryRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fact,
      category,
      embedding,
      createdAt: Date.now(),
      hitCount: 0,
      lastAccessed: Date.now(),
    };

    const userFacts = this.userMemories.get(userId);
    userFacts.push(memoryRecord);
    return memoryRecord;
  }

  async searchRelevantFacts(userId, queryText, topK = 3) {
    const userFacts = this.userMemories.get(userId) || [];
    if (userFacts.length === 0) return [];

    const queryVector = await getEmbedding(queryText);
    const scored = userFacts.map((mem) => {
      const sim = cosineSimilarity(queryVector, mem.embedding);
      return { ...mem, score: sim };
    });

    scored.sort((a, b) => b.score - a.score);
    const topFacts = scored.slice(0, topK);

    // Update hit count statistics
    topFacts.forEach((f) => {
      f.hitCount++;
      f.lastAccessed = Date.now();
    });

    return topFacts;
  }

  async getAllUserFacts(userId) {
    return this.userMemories.get(userId) || [];
  }
}
```

---

## 4. Verification & Testing

Verify STM and LTM storage in Node.js:

```bash
node -e "
import { ShortTermMemory } from './src/memory/ShortTermMemory.js';
import { LongTermMemory } from './src/memory/LongTermMemory.js';
const stm = new ShortTermMemory(2);
const ltm = new LongTermMemory();
stm.addMessage('s1', 'user', 'hi');
ltm.storeFact('u1', 'User prefers Python for data science', 'preference').then(async () => {
  const f = await ltm.searchRelevantFacts('u1', 'coding language');
  console.log('Retrieved LTM Fact:', f[0].fact);
});
"
```

### Expected Output

```text
Retrieved LTM Fact: User prefers Python for data science
```

Move to **Chapter 4** to build the Fact Extraction Engine and Offline Memory Reflection.
