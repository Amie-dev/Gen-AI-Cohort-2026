# Chapter 1 — RAG Core Foundation: Document Store, RRF & Guardrails

## 1. Chapter Goal

The goal of this chapter is to build the core RAG components inside `src/rag/`: the **Knowledge Document Store** (`DocumentStore.js`), **Hybrid Ranker** (`HybridRanker.js`), and **Security Guardrails** (`Guardrails.js`).

In production RAG systems, single-query retrieval is insufficient. The document store must support both **Dense Vector Search** (capturing semantic meaning) and **Sparse Keyword Search** (capturing exact technical terminology). Results from multiple search streams are combined using **Reciprocal Rank Fusion (RRF)**, while Guardrails sanitize input PII before query processing.

In this chapter, we:
* Build the In-Memory Knowledge Document Store (`src/rag/DocumentStore.js`)
* Implement Reciprocal Rank Fusion (`src/rag/HybridRanker.js`)
* Build PII Masking & Restoration Guardrails (`src/rag/Guardrails.js`)

---

### 🎯 Expected Outcome

Knowledge documents are indexed, searched via dense/sparse algorithms, fused via RRF, and sanitized by PII guardrails:

```text
Raw Query -> [Guardrails Input PII Masking] -> [Dense + Sparse Search] -> [RRF Fusion] -> Fused Top-K Docs
```

---

## 2. Knowledge Document Store (`src/rag/DocumentStore.js`)

### File Path

```text
rag+memory/src/rag/DocumentStore.js
```

### Code

```javascript
import { getEmbedding, cosineSimilarity } from "../utils/embeddings.js";

export class DocumentStore {
  constructor() {
    this.documents = new Map();
  }

  async addDocument(id, title, content, metadata = {}) {
    const embedding = await getEmbedding(content);
    this.documents.set(id, {
      id,
      title,
      content,
      metadata,
      embedding,
    });
    return id;
  }

  async searchDense(queryVector, limit = 5) {
    const results = [];
    for (const doc of this.documents.values()) {
      const sim = cosineSimilarity(queryVector, doc.embedding);
      results.push({ ...doc, score: sim });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  async searchSparse(queryText, limit = 5) {
    const terms = queryText.toLowerCase().split(/\s+/);
    const results = [];

    for (const doc of this.documents.values()) {
      const text = `${doc.title} ${doc.content}`.toLowerCase();
      let matchCount = 0;
      terms.forEach((t) => {
        if (text.includes(t)) matchCount++;
      });
      if (matchCount > 0) {
        results.push({ ...doc, score: matchCount / terms.length });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}
```

---

## 3. Hybrid Ranker & Reciprocal Rank Fusion (`src/rag/HybridRanker.js`)

Combines multiple ranked document lists using the Reciprocal Rank Fusion (RRF) algorithm:

$$\text{RRF Score}(d) = \sum_{q \in Q} \frac{1}{k + r_q(d)}$$

where $k = 60$ and $r_q(d)$ is the 1-based rank position of document $d$ in search stream $q$.

### File Path

```text
rag+memory/src/rag/HybridRanker.js
```

### Code

```javascript
export class HybridRanker {
  static fuseRRF(rankingStreams, k = 60, topK = 3) {
    const rrfScores = new Map();
    const docMap = new Map();

    for (const stream of rankingStreams) {
      stream.forEach((doc, rankIndex) => {
        docMap.set(doc.id, doc);
        const currentScore = rrfScores.get(doc.id) || 0;
        const rankScore = 1 / (k + (rankIndex + 1));
        rrfScores.set(doc.id, currentScore + rankScore);
      });
    }

    const fused = Array.from(rrfScores.entries()).map(([id, score]) => ({
      ...docMap.get(id),
      rrfScore: score,
    }));

    fused.sort((a, b) => b.rrfScore - a.rrfScore);
    return fused.slice(0, topK);
  }
}
```

---

## 4. Security & PII Guardrails (`src/rag/Guardrails.js`)

Masks PII tokens in user prompts before processing, and restores them in final output:

### File Path

```text
rag+memory/src/rag/Guardrails.js
```

### Code

```javascript
export class Guardrails {
  constructor() {
    this.piiMap = new Map();
  }

  processInput(query) {
    let sanitized = query;
    let maskedCount = 0;

    // Mask Email
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => {
      const placeholder = `[MASKED_EMAIL_${++maskedCount}]`;
      this.piiMap.set(placeholder, match);
      return placeholder;
    });

    // Mask API Keys
    sanitized = sanitized.replace(/sk-[A-Za-z0-9_-]{20,}/g, (match) => {
      const placeholder = `[MASKED_KEY_${++maskedCount}]`;
      this.piiMap.set(placeholder, match);
      return placeholder;
    });

    return { sanitizedQuery: sanitized, maskedCount };
  }

  processOutput(response) {
    let restored = response;
    for (const [placeholder, original] of this.piiMap.entries()) {
      restored = restored.replaceAll(placeholder, original);
    }
    return restored;
  }
}
```

---

## 5. Verification & Testing

Verify `DocumentStore` and `HybridRanker` execution:

```bash
node -e "
import { DocumentStore } from './src/rag/DocumentStore.js';
import { HybridRanker } from './src/rag/HybridRanker.js';
const store = new DocumentStore();
store.addDocument('d1', 'vLLM Engine', 'vLLM uses PagedAttention for fast inference.').then(async () => {
  const v = await store.searchDense(await store.documents.get('d1').embedding);
  console.log('Search Match Title:', v[0].title);
});
"
```

### Expected Output

```text
Search Match Title: vLLM Engine
```

Move to **Chapter 2** to implement Pre-Retrieval Query Transformations and Corrective RAG (CRAG).
