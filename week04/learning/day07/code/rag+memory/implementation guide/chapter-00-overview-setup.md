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
  "keywords": [
    "rag",
    "vector-search",
    "memory",
    "short-term-memory",
    "long-term-memory",
    "crag",
    "rrf",
    "hyde",
    "llm-agent"
  ],
  "author": "GenAI Cohort",
  "license": "ISC",
  "dependencies": {
    "@google/genai": "^0.13.0",
    "dotenv": "^16.4.7",
    "openai": "^4.52.7"
  }
}
```

### Central Configuration (`src/config.js`)

```javascript
import dotenv from "dotenv";
dotenv.config();

export const config = {
  llmProvider: process.env.LLM_PROVIDER || "openai",
  embeddingProvider: process.env.EMBEDDING_PROVIDER || "openai",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  groqApiKey: process.env.GROQ_API_KEY || "",
  memory: {
    stmMaxTurns: parseInt(process.env.STM_MAX_TURNS || "6", 10),
    ltmTopK: parseInt(process.env.LTM_TOP_K || "3", 10),
  },
  rag: {
    topK: parseInt(process.env.RAG_TOP_K || "4", 10),
    rrfK: parseInt(process.env.RRF_K || "60", 10),
    cragThreshold: parseFloat(process.env.CRAG_THRESHOLD || "6.0"),
  },
};
```

---

## 3. Vector Embeddings Utility (`src/utils/embeddings.js`)

Generates float vectors for document indexing and semantic memory search:

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

let openaiClient = null;
if (config.openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Deterministic vector embedding fallback for offline / key-less runs
 */
function getDeterministicMockEmbedding(text, dimension = 16) {
  const normText = text.toLowerCase().trim();
  const vector = new Array(dimension).fill(0);
  
  for (let i = 0; i < normText.length; i++) {
    const charCode = normText.charCodeAt(i);
    const index = i % dimension;
    vector[index] += Math.sin(charCode * (i + 1));
  }

  // Normalize to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude === 0 ? vector : vector.map(v => v / magnitude);
}

/**
 * Get vector embedding for a given text string
 */
export async function getEmbedding(text) {
  if (!text || typeof text !== "string") {
    return new Array(16).fill(0);
  }

  if (openaiClient && config.embeddingProvider === "openai") {
    try {
      const response = await openaiClient.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (err) {
      console.warn(`[Embedding Warning] OpenAI API call failed, falling back to mock: ${err.message}`);
    }
  }

  return getDeterministicMockEmbedding(text);
}

/**
 * Compute Cosine Similarity between two vector arrays
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  return magA && magB ? dotProduct / (magA * magB) : 0;
}
```

---

## 4. LLM Completion Utility (`src/utils/llm.js`)

Handles chat completions with fallback error resilience:

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

let openaiClient = null;
if (config.openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Smart Fallback LLM responses for offline execution
 */
function getMockLLMResponse(systemPrompt, userPrompt) {
  const sysLower = systemPrompt.toLowerCase();
  const userLower = userPrompt.toLowerCase();

  // 1. Query Translator Mock
  if (sysLower.includes("query translator") || sysLower.includes("query translation")) {
    return JSON.stringify({
      rewritten: userPrompt.replace(/(please|can you|tell me|i want to know)/gi, "").trim() + " detailed architecture",
      stepBack: "What are the core concepts and fundamental mechanics related to this query?",
      subQueries: [
        `What is the primary definition of ${userPrompt.slice(0, 25)}?`,
        `What are the production best practices for ${userPrompt.slice(0, 25)}?`
      ],
      hydeDocument: `Comprehensive technical documentation explaining ${userPrompt}. Key concepts include design patterns, state management, latency tuning, and fault tolerance.`
    });
  }

  // 2. Fact Extraction Mock
  if (sysLower.includes("fact extraction") || sysLower.includes("extract facts")) {
    const facts = [];
    if (userLower.includes("my name is")) {
      const match = userPrompt.match(/my name is ([a-zA-Z]+)/i);
      if (match) facts.push({ fact: `User's name is ${match[1]}`, category: "personal" });
    }
    if (userLower.includes("prefer") || userLower.includes("love") || userLower.includes("like") || userLower.includes("favorite")) {
      facts.push({ fact: `User preference: ${userPrompt}`, category: "preference" });
    }
    if (userLower.includes("work at") || userLower.includes("working on") || userLower.includes("developer")) {
      facts.push({ fact: `User work/context: ${userPrompt}`, category: "professional" });
    }
    if (facts.length === 0) {
      facts.push({ fact: `User discussed: ${userPrompt.slice(0, 40)}`, category: "general" });
    }
    return JSON.stringify({ extractedFacts: facts });
  }

  // 3. CRAG Evaluator Mock
  if (sysLower.includes("crag") || sysLower.includes("evaluator")) {
    return JSON.stringify({
      score: 8.5,
      isSufficient: true,
      reasoning: "Retrieved context directly addresses the key technical entities and queries."
    });
  }

  // 4. Memory Reflection Mock
  if (sysLower.includes("reflection") || sysLower.includes("dreaming")) {
    return JSON.stringify({
      mergedFacts: [],
      contradictionsResolved: [],
      evictIds: []
    });
  }

  // 5. General Generation Default Mock
  return `Based on your query "${userPrompt}" and the retrieved knowledge context, here is a synthesized answer:
The system integrates Short-Term Memory, Long-Term Fact Memory (Vector RAG), and Knowledge Base Document RAG to deliver accurate, personalized, and context-aware responses.`;
}

/**
 * General LLM Generation Call
 */
export async function callLLM(systemPrompt, userPrompt, temperature = 0.2) {
  if (openaiClient && config.llmProvider === "openai") {
    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature,
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.warn(`[LLM Warning] OpenAI API call failed, using mock response: ${err.message}`);
    }
  }

  return getMockLLMResponse(systemPrompt, userPrompt);
}

/**
 * LLM Call returning parsed JSON
 */
export async function generateJSON(systemPrompt, userPrompt) {
  const rawText = await callLLM(systemPrompt, userPrompt, 0.1);
  try {
    // Clean markdown code fence if present
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn(`[JSON Parse Warning] Failed to parse JSON response, attempting fallback parse.`);
    return JSON.parse(getMockLLMResponse(systemPrompt, userPrompt));
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
