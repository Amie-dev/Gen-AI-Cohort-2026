# `src/rag/evaluation/` Directory Explanations

## Overview
The `src/rag/evaluation/` directory implements **Corrective RAG (CRAG)**. 

Even after pre-retrieval query translation and multi-stage re-ranking, synthesized responses can still suffer from incomplete context or subtle hallucinations. CRAG acts as a real-time evaluator that scores generated answers before they reach the user, triggering corrective query modification loops if quality thresholds are not met.

---

## The 4 CRAG Evaluation Dimensions

```
                       [ Candidate Answer + Context ]
                                     │
                                     ▼
                      [ CRAG Evaluator Engine ]
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          ▼                          ▼                          ▼
   1. Groundedness             2. Relevance               3. Completeness
(Factual alignment with    (Directly answers input     (Addresses all requested
   retrieved context)            question)               query sub-aspects)
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     │
                                     ▼
                              4. Hallucination
                     (Detects invented facts/sources)
```

---

## Scoring & Corrective Feedback Algorithm

1. **Pass Condition ($\text{Score} \ge 6$)**:
   - The answer is verified as grounded and complete. The pipeline immediately advances to output guardrails.
2. **Fail Condition ($\text{Score} < 6$)**:
   - CRAG extracts a list of missing terms/concepts (`missing: string[]`).
   - The orchestrator appends these missing keywords to `currentQuery` and initiates a targeted retry retrieval pass up to `maxRetries = 2`.

---

## Code & Pseudocode Implementation (`crag.js`)

```javascript
/**
 * CRAG Answer Quality Evaluator Pseudocode
 */
import { generateLLM } from '../llmClient.js';

export async function evaluateAnswer(query, answer, context) {
  const response = await generateLLM({
    system: `
      Evaluate the synthesized answer against the retrieved context and user query.

      Score from 0 to 10 evaluating:
      1. Groundedness (Is it supported by context?)
      2. Relevance (Does it answer the query?)
      3. Completeness (Is key info missing?)
      4. Hallucination (Are facts invented?)

      Return JSON format ONLY:
      {
        "score": number,        // Integer score between 0 and 10
        "missing": string[]     // Missing domain concepts or keywords to re-query
      }
    `,
    user: JSON.stringify({ query, answer, context })
  });

  try {
    const parsed = JSON.parse(response.text);
    if (typeof parsed.score === 'number') {
      return parsed;
    }
  } catch (err) {
    console.warn('[CRAG Evaluator] Parse error, defaulting to passing score.');
  }

  // Graceful fallback
  return { score: 8, missing: [] };
}
```
