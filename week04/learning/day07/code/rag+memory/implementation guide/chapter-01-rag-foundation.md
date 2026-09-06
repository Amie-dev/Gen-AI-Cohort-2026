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

/**
 * DocumentStore.js
 * In-Memory Vector & Keyword Document Collection for Knowledge Retrieval
 */
export class DocumentStore {
  constructor() {
    this.chunks = []; // Array of { id, docId, title, content, vector, keywords }
  }

  /**
   * Add raw text content to knowledge base, chunking and embedding it
   */
  async addDocument(docId, title, content, chunkSize = 200, overlap = 50) {
    const words = content.split(/\s+/);
    let start = 0;
    let chunkIndex = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkText = words.slice(start, end).join(" ");
      const vector = await getEmbedding(chunkText);
      const keywords = new Set(chunkText.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/));

      this.chunks.push({
        id: `${docId}_chunk_${chunkIndex}`,
        docId,
        title,
        content: chunkText,
        vector,
        keywords,
      });

      chunkIndex++;
      start += chunkSize - overlap;
    }
  }

  /**
   * Perform dense vector similarity search
   */
  async searchDense(vector, topK = 5) {
    const scored = this.chunks.map((chunk) => {
      const sim = cosineSimilarity(vector, chunk.vector);
      return { ...chunk, score: sim, searchType: "dense" };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Perform sparse keyword match search
   */
  async searchSparse(query, topK = 5) {
    const queryTokens = query.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/);
    
    const scored = this.chunks.map((chunk) => {
      let matches = 0;
      queryTokens.forEach((token) => {
        if (chunk.keywords.has(token)) matches++;
      });
      const score = matches / (queryTokens.length || 1);
      return { ...chunk, score, searchType: "sparse" };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
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
/**
 * HybridRanker.js
 * Implements Reciprocal Rank Fusion (RRF) and Re-ranking over multiple search result streams.
 */
export class HybridRanker {
  /**
   * Reciprocal Rank Fusion (RRF)
   * @param {Array<Array<Object>>} searchLists - Array of ranked document lists
   * @param {number} rrfK - Rank constant (default 60)
   * @param {number} finalTopK - Number of top documents to return
   */
  static fuseRRF(searchLists, rrfK = 60, finalTopK = 4) {
    const scoresMap = new Map(); // chunkId -> { chunk, rrfScore }

    searchLists.forEach((docList) => {
      docList.forEach((doc, rankIndex) => {
        const rank = rankIndex + 1; // 1-based rank
        const contribution = 1 / (rrfK + rank);

        if (!scoresMap.has(doc.id)) {
          scoresMap.set(doc.id, {
            chunk: doc,
            rrfScore: contribution,
          });
        } else {
          const item = scoresMap.get(doc.id);
          item.rrfScore += contribution;
        }
      });
    });

    const fused = Array.from(scoresMap.values());
    fused.sort((a, b) => b.rrfScore - a.rrfScore);

    return fused.slice(0, finalTopK).map((item) => ({
      ...item.chunk,
      finalScore: item.rrfScore,
    }));
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
/**
 * Guardrails.js — Security & Quality Pipeline
 * Handles Input PII Masking, Prompt Injection Detection, and Output PII Unmasking.
 */

export class Guardrails {
  constructor() {
    this.piiMap = new Map(); // token -> original value
    this.tokenCounter = 0;
  }

  /**
   * Sanitizes input text by masking sensitive PII (emails, phone numbers, API keys)
   */
  processInput(rawQuery) {
    let sanitized = rawQuery;
    
    // 1. Email Masking
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    sanitized = sanitized.replace(emailRegex, (match) => {
      this.tokenCounter++;
      const token = `[PII_EMAIL_${this.tokenCounter}]`;
      this.piiMap.set(token, match);
      return token;
    });

    // 2. Phone Number Masking
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    sanitized = sanitized.replace(phoneRegex, (match) => {
      this.tokenCounter++;
      const token = `[PII_PHONE_${this.tokenCounter}]`;
      this.piiMap.set(token, match);
      return token;
    });

    // 3. Secret / API Key Masking
    const apiKeyRegex = /(sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{30,})/g;
    sanitized = sanitized.replace(apiKeyRegex, (match) => {
      this.tokenCounter++;
      const token = `[PII_SECRET_${this.tokenCounter}]`;
      this.piiMap.set(token, match);
      return token;
    });

    // 4. Prompt Injection Safety Check
    const injectionPatterns = [
      /ignore previous instructions/i,
      /system prompt override/i,
      /jailbreak/i,
    ];
    const isSuspicious = injectionPatterns.some((pattern) => pattern.test(sanitized));

    return {
      sanitizedQuery: sanitized,
      maskedCount: this.piiMap.size,
      isSuspicious,
    };
  }

  /**
   * Restores original PII values into final response payload
   */
  processOutput(generatedResponse) {
    let unmasked = generatedResponse;
    for (const [token, original] of this.piiMap.entries()) {
      unmasked = unmasked.replaceAll(token, original);
    }
    return unmasked;
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
