# Chapter 03 — Query Expansion & Translation Engine

## 1. Chapter Goal

The goal of this chapter is to build the modular **Query Expansion & Translation Subsystem** in [`src/query/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/query/).

Single-vector searches often fail because human questions are brief, ambiguous, or use different phrasing than factual document text. To maximize recall across disparate vector collections, we expand every user query into **4 distinct representations**:

```text
                               Raw User Input
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│ Query Rewrite│              │  Step-Back   │              │ Sub-Queries  │
│ (src/query/  │              │ (src/query/  │              │ (src/query/  │
│  rewrite.js) │              │ stepBack.js) │              │subQueries.js)│
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       └─────────────────────────────┼─────────────────────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │     HyDE     │
                              │ (src/query/  │
                              │   hyde.js)   │
                              └──────────────┘
```

---

## 2. Query Rewriting (`src/query/rewrite.js`)

Create [`src/query/rewrite.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/query/rewrite.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 2: Query Rewriting
 * Corrects typos, grammar, and expands implicit context for search retrieval.
 */
export async function rewriteQuery(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are a query rewriting assistant for a vector retrieval system. " +
            "Rewrite the user query to make it explicit, clear, self-contained, and free of typos/grammar issues. " +
            "Preserve original intent. Do NOT answer the question. Respond ONLY with the rewritten string.",
        },
        { role: "user", content: query },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || query;
  } catch (err) {
    console.error("⚠️ Query Rewriting failed, using raw query:", err.message);
    return query;
  }
}
```

---

## 3. Step-Back Prompting (`src/query/stepBack.js`)

Create [`src/query/stepBack.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/query/stepBack.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 3: Step-Back Prompting
 * Converts a specific question into a broader, higher-level conceptual background question.
 */
export async function createStepBackQuery(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an expert at Step-Back Prompting. Convert the user's specific query into a broader, " +
            "higher-level conceptual question about the underlying principles required to answer it. " +
            "Respond ONLY with the step-back question.",
        },
        { role: "user", content: query },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || query;
  } catch (err) {
    console.error("⚠️ Step-Back Query failed, returning raw query:", err.message);
    return query;
  }
}
```

---

## 4. Sub-Query Decomposition (`src/query/subQueries.js`)

Create [`src/query/subQueries.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/query/subQueries.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 4: Sub-Query Decomposition
 * Decomposes a multi-faceted query into 3-5 focused independent retrieval questions.
 */
export async function createSubQueries(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sub_query_decomposition",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              queries: {
                type: "array",
                description: "Array of 3 to 5 independent sub-queries.",
                items: { type: "string" },
              },
            },
            required: ["queries"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Decompose the user's question into 3-5 independent, focused retrieval sub-queries. Respond ONLY with structured JSON.",
        },
        { role: "user", content: query },
      ],
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return Array.isArray(parsed.queries) ? parsed.queries : [query];
  } catch (err) {
    console.error("⚠️ Sub-Query Decomposition failed:", err.message);
    return [query];
  }
}
```

---

## 5. HyDE Generation (`src/query/hyde.js`)

Create [`src/query/hyde.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/query/hyde.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 5: HyDE (Hypothetical Document Embeddings)
 * Generates a hypothetical reference document passage that would answer the query.
 */
export async function createHyDE(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Write a concise, factual passage (3-5 sentences) that directly answers the user's question, " +
            "as if it were an excerpt from an authoritative reference document. Do not add conversational filler.",
        },
        { role: "user", content: query },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || query;
  } catch (err) {
    console.error("⚠️ HyDE generation failed, fallback to query:", err.message);
    return query;
  }
}
```

---

## 6. Summary & Next Steps

In this chapter, we implemented 4 distinct query transformation strategies:
- `rewriteQuery()`: Fixes typos and clarifies vague intent.
- `createStepBackQuery()`: Generates broader background questions.
- `createSubQueries()`: Decomposes complex questions into targeted sub-questions.
- `createHyDE()`: Generates hypothetical reference document passages.

In [**Chapter 04 — Query Router & Multi-Source Search**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-04-routing-multi-source-retrieval.md), we will build the dynamic query router, vector search engine, and metadata permission filter.
