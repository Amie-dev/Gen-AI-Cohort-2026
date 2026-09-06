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

```javascript
/**
 * ShortTermMemory.js
 * Sliding Window Short-Term Memory (STM) Store
 * Persists recent N turns per session to maintain immediate conversation continuity.
 */
export class ShortTermMemory {
  constructor(maxTurns = 6) {
    this.maxTurns = maxTurns;
    this.sessions = new Map(); // sessionId -> Array of { role, content, timestamp }
  }

  /**
   * Append a message turn to short-term memory
   */
  async addMessage(sessionId, role, content) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    const history = this.sessions.get(sessionId);
    history.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    // Enforce sliding window size limit
    if (history.length > this.maxTurns) {
      this.sessions.set(sessionId, history.slice(-this.maxTurns));
    }
  }

  /**
   * Fetch recent sliding window messages
   */
  async getRecentWindow(sessionId, limit = null) {
    const fetchLimit = limit || this.maxTurns;
    const history = this.sessions.get(sessionId) || [];
    return history.slice(-fetchLimit);
  }

  /**
   * Clear session history
   */
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

```javascript
import { getEmbedding, cosineSimilarity } from "../utils/embeddings.js";

/**
 * LongTermMemory.js
 * Long-Term Memory (LTM) Store: Semantic Facts + Episodic Events
 * Implements Vector RAG lookup and hit-score recency tracking.
 */
export class LongTermMemory {
  constructor() {
    this.semanticMemory = []; // Array of { id, userId, fact, category, vector, createdAt, hitCount, lastAccessedAt }
    this.episodicMemory = []; // Array of { id, userId, event, timestamp, vector }
  }

  /**
   * Store a semantic fact in LTM
   */
  async addFact(userId, factText, category = "general") {
    // Check if fact already exists to prevent duplication
    const existing = this.semanticMemory.find(
      (item) => item.userId === userId && item.fact.toLowerCase() === factText.toLowerCase()
    );

    if (existing) {
      existing.hitCount += 1;
      existing.lastAccessedAt = new Date().toISOString();
      return existing;
    }

    const vector = await getEmbedding(factText);
    const newRecord = {
      id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      fact: factText,
      category,
      vector,
      createdAt: new Date().toISOString(),
      hitCount: 1,
      lastAccessedAt: new Date().toISOString(),
    };

    this.semanticMemory.push(newRecord);
    return newRecord;
  }

  /**
   * Log an episodic interaction event
   */
  async addEpisodicEvent(userId, eventText) {
    const vector = await getEmbedding(eventText);
    const eventRecord = {
      id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      event: eventText,
      timestamp: new Date().toISOString(),
      vector,
    };
    this.episodicMemory.push(eventRecord);
    return eventRecord;
  }

  /**
   * Search query-relevant facts from Semantic LTM via Vector RAG
   */
  async searchRelevantFacts(userId, query, topK = 3) {
    const queryVec = await getEmbedding(query);
    const userFacts = this.semanticMemory.filter((f) => f.userId === userId);

    if (userFacts.length === 0) return [];

    const scored = userFacts.map((item) => {
      const similarity = cosineSimilarity(queryVec, item.vector);
      return { ...item, score: similarity };
    });

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, topK);

    // Update hit score metrics for retrieved facts
    results.forEach((res) => {
      const original = this.semanticMemory.find((f) => f.id === res.id);
      if (original) {
        original.hitCount += 1;
        original.lastAccessedAt = new Date().toISOString();
      }
    });

    return results;
  }

  /**
   * Evict specific fact IDs
   */
  evictFacts(factIds) {
    const initialCount = this.semanticMemory.length;
    this.semanticMemory = this.semanticMemory.filter((f) => !factIds.includes(f.id));
    return initialCount - this.semanticMemory.length;
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
