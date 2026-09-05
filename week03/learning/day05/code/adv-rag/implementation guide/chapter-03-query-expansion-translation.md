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

export async function rewriteQuery(originalQuery) {
  try {
    const res = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a query rewriting assistant. Fix typos, expand abbreviations, and rephrase the query to be clear, explicit, and self-contained for a vector database search. Return ONLY the rewritten query text.",
        },
        { role: "user", content: originalQuery },
      ],
    });

    return res.choices[0]?.message?.content?.trim() || originalQuery;
  } catch (err) {
    console.error("⚠️ Query rewrite failed, falling back to original:", err.message);
    return originalQuery;
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

export async function createStepBackQuery(query) {
  try {
    const res = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an expert at step-back prompting. Given a specific question, generate a broader, higher-level background question that provides foundational context. Return ONLY the step-back question.",
        },
        { role: "user", content: query },
      ],
    });

    return res.choices[0]?.message?.content?.trim() || query;
  } catch (err) {
    console.error("⚠️ Step-Back creation failed:", err.message);
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

export async function createSubQueries(query) {
  try {
    const res = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Decompose the following user question into 2 or 3 distinct sub-questions focused on specific aspects. Return the sub-questions separated by newlines with no numbers or bullets.",
        },
        { role: "user", content: query },
      ],
    });

    const text = res.choices[0]?.message?.content?.trim() || "";
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

    return lines.length > 0 ? lines : [query];
  } catch (err) {
    console.error("⚠️ Sub-Query creation failed:", err.message);
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

export async function createHyDE(query) {
  try {
    const res = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Write a concise, factual reference paragraph (3-4 sentences) that directly answers the user's question, as if it were an excerpt from a official documentation document. Do not include disclaimers.",
        },
        { role: "user", content: query },
      ],
    });

    return res.choices[0]?.message?.content?.trim() || query;
  } catch (err) {
    console.error("⚠️ HyDE generation failed:", err.message);
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
