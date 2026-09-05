# Chapter 01 — Database Clients & Shared LLM Client Wrapper

## 1. Chapter Goal

The goal of this chapter is to build the core connection modules in [`src/db/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/db/) and the shared LLM client abstraction in [`src/rag/llmClient.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/llmClient.js).

A robust architecture requires:
1. **Resilient Database Connections**: Dynamic Qdrant collection auto-creation, PostgreSQL relational mock query execution, and Redis queue connections.
2. **Graceful LLM Fallback Mechanism**: A unified wrapper (`generateLLM`) that attempts OpenAI API calls when an API key is present, but seamlessly switches to intent-based local mock responses if no key is configured or an API error occurs.

### 🎯 Expected Outcome

```text
src/
├── db/
│   ├── qdrant.js        # Qdrant Client & ensureCollection()
│   ├── postgres.js      # Relational DB query interface
│   └── redis.js         # Redis IORedis connection client
└── rag/
    └── llmClient.js     # Unified generateLLM() with mock fallbacks
```

---

## 2. Database Clients (`src/db/`)

### 1. Qdrant Client (`src/db/qdrant.js`)

Create [`src/db/qdrant.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/db/qdrant.js):

```javascript
import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config();

const qdrantUrl = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
export const collectionName = process.env.QDRANT_COLLECTION || 'adv_rag_1_documents';

export const qdrant = new QdrantClient({ url: qdrantUrl });

/**
 * Ensures that the required vector collection exists in Qdrant.
 * Creates it dynamically with Cosine similarity if not present.
 */
export async function ensureCollection() {
  try {
    const exists = await qdrant.collectionExists(collectionName);
    if (!exists.exists) {
      console.log(`Creating Qdrant collection "${collectionName}"...`);
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: Number(process.env.EMBEDDING_DIMENSIONS) || 1536,
          distance: 'Cosine',
        },
      });
      console.log(`✅ Collection "${collectionName}" successfully created.`);
    }
  } catch (error) {
    console.error('Error ensuring Qdrant collection:', error);
  }
}
```

---

### 2. PostgreSQL Relational Client (`src/db/postgres.js`)

Create [`src/db/postgres.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/db/postgres.js):

```javascript
/**
 * Relational DB Client (PostgreSQL Interface Mock)
 * Serves structured user account, billing status, and subscription data.
 */
export async function queryPostgres(sqlQuery, params = []) {
  console.log(`🛢️ [PostgreSQL] Query: "${sqlQuery}"`);
  
  // Return structured mock billing record for testing
  return [
    {
      userId: 'usr_default',
      accountName: 'Acme Corporation',
      plan: 'Enterprise Tier',
      billingStatus: 'Active',
      monthlyFee: '$299.00',
      lastBillingDate: '2026-08-01',
      refundEligible: true,
    }
  ];
}
```

---

### 3. Redis Client (`src/db/redis.js`)

Create [`src/db/redis.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/db/redis.js):

```javascript
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});
```

---

## 3. Shared LLM Client with Local Fallbacks (`src/rag/llmClient.js`)

Create [`src/rag/llmClient.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/src/rag/llmClient.js):

```javascript
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let openai = null;
if (apiKey && apiKey !== 'your_openai_api_key_here') {
  openai = new OpenAI({ apiKey });
}

/**
 * Unified LLM Generation Helper
 * Performs structured or text LLM completions with API key checking & graceful mock fallbacks.
 */
export async function generateLLM({ system, user }) {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.2
      });

      return {
        text: response.choices[0].message.content.trim()
      };
    } catch (err) {
      console.warn(`[LLM Client Warning] OpenAI call failed (${err.message}). Using local fallback generation logic.`);
    }
  }

  // Fallback Generation Logic based on system prompt intent
  const sysLower = system.toLowerCase();
  const userLower = user.toLowerCase();

  // Query Rewrite Fallback
  if (sysLower.includes('rewrite the user query')) {
    return {
      text: user.trim().endsWith('?') ? user.trim() : `${user.trim()} details and clarification?`
    };
  }

  // Step-Back Prompting Fallback
  if (sysLower.includes('broader conceptual question')) {
    if (userLower.includes('refund')) {
      return { text: 'What general principles and policies govern customer subscription refunds and billing?' };
    }
    return { text: `What are the core background concepts and principles related to: ${user}?` };
  }

  // Sub-Queries Fallback
  if (sysLower.includes('3-5 independent retrieval questions')) {
    return {
      text: JSON.stringify({
        queries: [
          `1. Terms and conditions regarding ${user}`,
          `2. User eligibility criteria for ${user}`,
          `3. Standard operating procedures for ${user}`
        ]
      })
    };
  }

  // HyDE Fallback
  if (sysLower.includes('hypothetical document')) {
    return {
      text: `Hypothetical document passage addressing: ${user}. Standard enterprise policies specify terms, eligibility, processing timelines, and account rules.`
    };
  }

  // Query Router Fallback
  if (sysLower.includes('query router')) {
    if (userLower.includes('balance') || userLower.includes('account')) {
      return { text: JSON.stringify({ targetStore: 'AUTH_DB' }) };
    }
    if (userLower.includes('refund') && userLower.includes('plan')) {
      return { text: JSON.stringify({ targetStore: 'MULTI_STORE' }) };
    }
    if (userLower.includes('download') || userLower.includes('file') || userLower.includes('invoice')) {
      return { text: JSON.stringify({ targetStore: 'S3' }) };
    }
    return { text: JSON.stringify({ targetStore: 'VECTOR_DB' }) };
  }

  // Grounded Generation Fallback
  if (sysLower.includes('grounded assistant')) {
    return {
      text: `Based on the provided documentation context, customer refund requests are processed according to the plan terms. Eligible accounts are entitled to a prorated refund within 30 days of subscription renewal upon verification.`
    };
  }

  // CRAG Evaluation Fallback
  if (sysLower.includes('evaluate the answer')) {
    return {
      text: JSON.stringify({
        score: 8,
        grounded: true,
        relevance: 'high',
        missing: []
      })
    };
  }

  return {
    text: `Standard response for query: ${user}`
  };
}
```

---

## 4. Summary & Next Steps

In this chapter, we implemented:
- `src/db/qdrant.js`: Qdrant REST client and collection auto-creation.
- `src/db/postgres.js`: PostgreSQL query interface mock.
- `src/db/redis.js`: IORedis connection client configured for BullMQ queues.
- `src/rag/llmClient.js`: Shared `generateLLM()` helper providing automated fallback responses when no OpenAI API key is supplied.

In [**Chapter 02 — Guardrails & Security Subsystem**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/implementation%20guide/chapter-02-guardrails-security.md), we will build the input validation, prompt injection defense, Regex PII masking/unmasking, and output verification layer.
