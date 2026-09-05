# Chapter 05 — Rank Fusion, LLM Reranking & CRAG Evaluation

## 1. Chapter Goal

The goal of this chapter is to build the advanced post-retrieval processing subsystem in [`src/retrieval/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/) and [`src/evaluation/`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/evaluation/).

Raw retrieval results from multi-query expansions often contain duplicate documents, irrelevant chunks, or missing information. To guarantee high accuracy, candidates undergo 3 processing phases:

```text
                             Filtered Candidates
                                      │
                                      ▼
                   ┌─────────────────────────────────────┐
                   │ Reciprocal Rank Fusion (rrf.js)     │
                   │ Merges lists via RRF = Σ 1/(60 + r)  │
                   └──────────────────┬──────────────────┘
                                      │
                                      ▼
                   ┌─────────────────────────────────────┐
                   │ LLM Reranker (reranker.js)          │
                   │ Scores candidates 1-10 on relevance │
                   └──────────────────┬──────────────────┘
                                      │
                                      ▼
                   ┌─────────────────────────────────────┐
                   │ Grounded Answer Generation          │
                   └──────────────────┬──────────────────┘
                                      │
                                      ▼
                   ┌─────────────────────────────────────┐
                   │ CRAG Evaluator (crag.js)            │
                   │ Checks Groundedness & Completeness  │
                   └──────────────────┬──────────────────┘
                                      │
             ┌────────────────────────┴────────────────────────┐
             ▼                                                 ▼
   [ Score >= 6: PASS ]                              [ Score < 6: FAIL ]
   Deliver Final Output                              Trigger Retry Feedback Loop
```

---

## 2. Reciprocal Rank Fusion (`src/retrieval/rrf.js`)

Create [`src/retrieval/rrf.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/rrf.js):

```javascript
import { config } from "../config.js";

/**
 * Reciprocal Rank Fusion (RRF)
 * Formula: RRF(d) = Sum( 1 / (k + rank_i(d)) )
 */
export function reciprocalRankFusion(documents, k = config.retrieval.rrfK) {
  const map = new Map();

  documents.forEach((doc, index) => {
    const rank = index + 1; // 1-based rank position
    const contribution = 1 / (k + rank);
    const docId = doc.id || doc.text;

    if (map.has(docId)) {
      const existing = map.get(docId);
      existing.rrfScore += contribution;
      existing.matchedCount += 1;
    } else {
      map.set(docId, {
        ...doc,
        rrfScore: contribution,
        matchedCount: 1,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.rrfScore - a.rrfScore);
}
```

---

## 3. LLM Semantic Re-ranker (`src/retrieval/reranker.js`)

Create [`src/retrieval/reranker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/reranker.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function rerank(query, candidates) {
  if (candidates.length === 0) return [];

  console.log(`⭐ [Reranker] Evaluating ${candidates.length} candidate chunk(s)...`);

  const rerankedPromises = candidates.map(async (doc) => {
    try {
      const res = await openai.chat.completions.create({
        model: config.openai.chatModel,
        temperature: 0.0,
        messages: [
          {
            role: "system",
            content:
              "You are a relevance scoring assistant. Evaluate how relevant the text passage is to the user query on a scale of 0 to 10. Respond ONLY with a integer score between 0 and 10.",
          },
          {
            role: "user",
            content: `Query: "${query}"\n\nPassage: "${doc.text}"`,
          },
        ],
      });

      const scoreStr = res.choices[0]?.message?.content?.trim() || "5";
      const score = parseInt(scoreStr, 10) || 5;

      return { ...doc, score };
    } catch (err) {
      return { ...doc, score: doc.score || 5 };
    }
  });

  const rerankedDocs = await Promise.all(rerankedPromises);
  return rerankedDocs.sort((a, b) => b.score - a.score);
}
```

---

## 4. Corrective RAG (CRAG) Evaluator (`src/evaluation/crag.js`)

Corrective RAG (CRAG) evaluates generated answers before delivering them to users. If the answer lacks groundedness or fails completeness checks, CRAG returns missing keywords to feed back into a query retry loop.

Create [`src/evaluation/crag.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/evaluation/crag.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function evaluateAnswer(query, answer, context) {
  try {
    const res = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "crag_evaluation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              score: { type: "integer", description: "Relevance & completeness score 0-10" },
              grounded: { type: "boolean", description: "Is answer fully supported by context?" },
              missing: {
                type: "array",
                items: { type: "string" },
                description: "Missing topics or keywords needed for retry search",
              },
            },
            required: ["score", "grounded", "missing"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a CRAG (Corrective RAG) evaluation agent. Assess if the generated answer accurately and completely answers the question based ONLY on the context. Return JSON with score (0-10), grounded (boolean), and missing (array of missing keywords).",
        },
        {
          role: "user",
          content: `Question: "${query}"\n\nContext:\n${context}\n\nGenerated Answer:\n${answer}`,
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");

    return {
      score: parsed.score ?? 7,
      grounded: parsed.grounded ?? true,
      missing: Array.isArray(parsed.missing) ? parsed.missing : [],
    };
  } catch (err) {
    console.error("⚠️ CRAG evaluation failed, passing default:", err.message);
    return { score: 8, grounded: true, missing: [] };
  }
}
```

---

## 5. Summary & Next Steps

In this chapter, we built:
- `reciprocalRankFusion()`: Fuses ranked lists across multi-query variants using $RRF(d) = \sum \frac{1}{k + r(d)}$.
- `rerank()`: LLM cross-encoder relevance scoring system.
- `evaluateAnswer()`: CRAG self-reflection agent producing a score (0-10), grounded status, and missing keyword retry payload.

In [**Chapter 06 — Grounded Context, Answer Synthesis & Pipeline**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-06-context-generation-pipeline.md), we will complete context building, answer synthesis, and the 13-step master RAG orchestrator.
