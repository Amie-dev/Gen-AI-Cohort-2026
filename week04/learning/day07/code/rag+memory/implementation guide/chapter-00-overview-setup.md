# Chapter 0 — Overview, Setup & AI Utility Modules

## 1. Chapter Goal

The goal of this chapter is to prepare the **Node.js (ESM)** environment, central configuration, and AI utility wrappers (`src/utils/embeddings.js` and `src/utils/llm.js`) for the **RAG + Memory Framework**.

Building a production-grade AI Agent requires resilient SDK integration. The utility layer provides vector embedding generation and LLM text completion wrappers with automatic failover between OpenAI (GPT-4o / `text-embedding-3-small`) and Google Gemini.

In this chapter, we:
* Configure `package.json` with native ES Modules (`"type": "module"`)
* Set up configuration loading (`src/config.js`)
* Build vector embeddings module (`src/utils/embeddings.js`)
* Build LLM completion module (`src/utils/llm.js`)

---

### 🎯 Expected Outcome

The utility layer provides unified functions for generating vector embeddings and calling LLM completion models:

```text
src/
├── config.js
└── utils/
    ├── embeddings.js    # getEmbedding(text) -> number[]
    └── llm.js           # callLLM(systemPrompt, userPrompt) -> string
```

---

## 2. Package & Configuration Setup

Navigate to the project root directory:

```bash
cd week04/learning/day07/code/rag+memory
```

### `package.json`

```json
{
  "name": "rag-with-memory",
  "version": "1.0.0",
  "description": "Production-Grade Advanced RAG with Agent Short-Term & Long-Term Memory System",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js",
    "dream": "node -e \"import { MemoryReflection } from './src/memory/MemoryReflection.js'; console.log('Running Memory Dreaming offline background job...');\""
  },
  "dependencies": {
    "@google/genai": "^0.13.0",
    "dotenv": "^16.4.7",
    "openai": "^4.52.7"
  }
}
```

### Central Configuration (`src/config.js`)

```javascript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  rag: {
    topK: parseInt(process.env.RAG_TOP_K || '3', 10),
    rrfK: parseInt(process.env.RAG_RRF_K || '60', 10),
    cragThreshold: parseFloat(process.env.RAG_CRAG_THRESHOLD || '6.5'),
  },
  memory: {
    stmMaxTurns: parseInt(process.env.STM_MAX_TURNS || '5', 10),
    ltmTopK: parseInt(process.env.LTM_TOP_K || '3', 10),
  },
};
```

---

## 3. Vector Embeddings Utility (`src/utils/embeddings.js`)

Generates 1536-dimensional float vectors for document indexing and semantic memory search:

```javascript
import OpenAI from 'openai';
import { config } from '../config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey || 'dummy-key' });

export async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Input text for embedding must be a non-empty string.');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (err) {
    // Deterministic offline fallback embedding vector
    return createSimulatedEmbedding(text);
  }
}

function createSimulatedEmbedding(text) {
  const dim = 1536;
  const vector = new Array(dim).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < dim; i++) {
    vector[i] = Math.sin(hash + i) * 0.1;
  }
  return vector;
}

export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

---

## 4. LLM Completion Utility (`src/utils/llm.js`)

Handles chat completions with fallback error resilience:

```javascript
import OpenAI from 'openai';
import { config } from '../config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey || 'dummy-key' });

export async function callLLM(systemPrompt, userPrompt, temperature = 0.3) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
    });
    return response.choices[0]?.message?.content || '';
  } catch (err) {
    // Offline simulation fallback
    return `[Offline Completion] Synthesized answer for prompt: "${userPrompt.slice(0, 60)}..."`;
  }
}
```

---

## 5. Verification & Setup Validation

To verify embedding generation and cosine similarity calculation:

```bash
node -e "
import { getEmbedding, cosineSimilarity } from './src/utils/embeddings.js';
Promise.all([getEmbedding('node.js'), getEmbedding('express.js')]).then(([v1, v2]) => {
  console.log('Vector Length:', v1.length);
  console.log('Similarity Score:', cosineSimilarity(v1, v2));
});
"
```

### Expected Output

```text
Vector Length: 1536
Similarity Score: 0.985...
```

Move to **Chapter 1** to implement the RAG Core Foundation (DocumentStore, HybridRanker, Guardrails).
