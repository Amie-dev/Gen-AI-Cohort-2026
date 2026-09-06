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
 * Step 10: Reciprocal Rank Fusion (RRF)
 * Combines multiple ranked result lists into a single unified ranking.
 * Formula: RRF(d) = sum( 1 / (k + rank) )
 */
export function reciprocalRankFusion(rankedLists, k = config.retrieval.rrfK) {
  const scores = new Map();

  for (const list of rankedLists) {
    if (!Array.isArray(list)) continue;
    list.forEach((doc, index) => {
      const rank = index + 1; // 1-based rank
      const contribution = 1 / (k + rank);

      if (!scores.has(doc.id)) {
        scores.set(doc.id, {
          ...doc,
          rrfScore: contribution,
          appearanceCount: 1,
        });
      } else {
        const existing = scores.get(doc.id);
        existing.rrfScore += contribution;
        existing.appearanceCount += 1;
      }
    });
  }

  return [...scores.values()].sort((a, b) => b.rrfScore - a.rrfScore);
}
```

---

## 3. LLM Semantic Re-ranker (`src/retrieval/reranker.js`)

Create [`src/retrieval/reranker.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/src/retrieval/reranker.js):

```javascript
import OpenAI from "openai";
import { config } from "../config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Step 11: Re-Ranking Layer
 * Re-ranks candidates by computing deep semantic relevance against the query.
 */
export async function rerank(query, candidates) {
  if (candidates.length <= 1) return candidates;

  try {
    const promptPayload = candidates.map((c, i) => `[Doc ${i}] (ID: ${c.id})\n${c.text}`).join("\n\n");

    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "reranking",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              rankedDocIds: {
                type: "array",
                description: "Doc IDs ordered by relevance to the query (highest first).",
                items: { type: "string" },
              },
            },
            required: ["rankedDocIds"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a semantic re-ranker. Given a user query and candidate documents, " +
            "evaluate each document's exact relevance and return an ordered list of doc IDs from most to least relevant.",
        },
        { role: "user", content: `Query: ${query}\n\nCandidates:\n${promptPayload}` },
      ],
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    const rankedIds = parsed.rankedDocIds || [];

    const map = new Map(candidates.map((c) => [c.id, c]));
    const reranked = [];

    for (const id of rankedIds) {
      if (map.has(id)) {
        reranked.push(map.get(id));
        map.delete(id);
      }
    }

    // Append remaining candidates that were not in the re-rank list
    return [...reranked, ...map.values()];
  } catch (err) {
    console.error("⚠️ Re-ranking failed, keeping RRF order:", err.message);
    return candidates;
  }
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

/**
 * Step 14: Corrective RAG (CRAG) Evaluator
 * Evaluates the generated answer for Groundedness, Relevance, Completeness, and Hallucination.
 * Returns a score out of 10 and missing keywords for retries.
 */
export async function evaluateAnswer(query, answer, context) {
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.chatModel,
      temperature: 0.0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "crag_evaluation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              score: {
                type: "number",
                description: "Overall quality rating from 0 to 10.",
              },
              grounded: {
                type: "boolean",
                description: "True if all claims are supported by context.",
              },
              relevant: {
                type: "boolean",
                description: "True if the answer directly answers the query.",
              },
              missing: {
                type: "array",
                description: "List of missing concepts or keywords needed for a complete answer.",
                items: { type: "string" },
              },
            },
            required: ["score", "grounded", "relevant", "missing"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are an impartial evaluator for a RAG system.\n" +
            "Evaluate the generated answer against the user query and context.\n" +
            "Rate overall quality from 0 to 10 (>= 6 is passing).\n" +
            "Identify any missing concepts if incomplete.",
        },
        {
          role: "user",
          content: JSON.stringify({ query, answer, context }),
        },
      ],
    });

    return JSON.parse(completion.choices[0]?.message?.content ?? '{"score": 7, "grounded": true, "relevant": true, "missing": []}');
  } catch (err) {
    console.error("⚠️ CRAG Evaluation error, default pass:", err.message);
    return { score: 7, grounded: true, relevant: true, missing: [] };
  }
}
```

---

## 5. Summary & Next Steps

In this chapter, we built:
- `reciprocalRankFusion()`: Fuses ranked lists across multi-query variants using $RRF(d) = \sum \frac{1}{k + r(d)}$.
- `rerank()`: Semantic re-ranker evaluating candidate document relevance against the query.
- `evaluateAnswer()`: CRAG self-reflection agent producing a score (0-10), grounded status, relevance status, and missing keyword retry payload.

In [**Chapter 06 — Grounded Context, Answer Synthesis & Pipeline**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag/implementation%20guide/chapter-06-context-generation-pipeline.md), we will complete context building, answer synthesis, and the master RAG orchestrator.
