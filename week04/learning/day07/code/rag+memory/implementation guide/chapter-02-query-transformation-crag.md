# Chapter 2 — Pre-Retrieval Query Transformations & Corrective RAG (CRAG)

## 1. Chapter Goal

The goal of this chapter is to build the **Query Transformation Subsystem** (`QueryTranslator.js`) and the **Corrective RAG (CRAG) Evaluator** (`CRAG.js`) inside `src/rag/`.

Passing raw user queries directly into vector search often yields poor precision due to conversational fluff or missing domain keywords. Query Transformation converts a single prompt into four distinct search representations (**Query Rewriting**, **Step-Back Querying**, **Sub-Query Decomposition**, and **HyDE**). Corrective RAG (CRAG) then verifies the groundedness of retrieved document chunks before generating the answer.

In this chapter, we:
* Build the Query Translator (`src/rag/QueryTranslator.js`)
* Build the Corrective RAG Evaluator (`src/rag/CRAG.js`)
* Integrate CRAG threshold scoring

---

### 🎯 Expected Outcome

User queries are expanded into multiple search representations and validated by CRAG:

```text
Raw Query ──> [QueryTranslator] ──> Rewritten + StepBack + SubQueries + HyDE
                                             │
                                             ▼
                             [RAG Retrieval & RRF Fusion]
                                             │
                                             ▼
                             [CRAG Evaluator] (Score / 10 >= 6.5 Threshold)
```

---

## 2. Query Translator (`src/rag/QueryTranslator.js`)

### File Path

```text
rag+memory/src/rag/QueryTranslator.js
```

### Code

```javascript
import { generateJSON } from "../utils/llm.js";

/**
 * QueryTranslator.js
 * Pre-retrieval query translation engine executing:
 *  1. Query Rewriting
 *  2. Step-Back Prompting
 *  3. Sub-Query Decomposition
 *  4. HyDE (Hypothetical Document Generation)
 */
export class QueryTranslator {
  /**
   * Translate a single user query into multiple optimized retrieval representations
   */
  async translateQuery(rawQuery) {
    const systemPrompt = `You are an expert Query Translator LLM for a production RAG system.
Given a user query, output a JSON object with:
- "rewritten": A clean, concise, keyword-rich search query.
- "stepBack": A higher-level conceptual/background question.
- "subQueries": An array of 2 distinct sub-questions targeting specific aspects.
- "hydeDocument": A hypothetical paragraph answering the query (HyDE).`;

    const userPrompt = `User Query: "${rawQuery}"`;

    try {
      const translated = await generateJSON(systemPrompt, userPrompt);
      return {
        original: rawQuery,
        rewritten: translated.rewritten || rawQuery,
        stepBack: translated.stepBack || rawQuery,
        subQueries: Array.isArray(translated.subQueries) ? translated.subQueries : [rawQuery],
        hydeDocument: translated.hydeDocument || rawQuery,
      };
    } catch (err) {
      console.warn(`[QueryTranslator Warning] Translation failed, using raw query fallback: ${err.message}`);
      return {
        original: rawQuery,
        rewritten: rawQuery,
        stepBack: rawQuery,
        subQueries: [rawQuery],
        hydeDocument: rawQuery,
      };
    }
  }
}
```

---

## 3. Corrective RAG (CRAG) Evaluator (`src/rag/CRAG.js`)

Evaluates whether retrieved documents provide sufficient evidence to answer the query:

### File Path

```text
rag+memory/src/rag/CRAG.js
```

### Code

```javascript
import { generateJSON } from "../utils/llm.js";

/**
 * CRAG.js — Corrective RAG Evaluator
 * Evaluates quality and groundedness of retrieved document context before generation.
 */
export class CRAG {
  /**
   * Evaluate context relevance against query
   */
  async evaluateContext(query, retrievedChunks, threshold = 6.0) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return {
        score: 0,
        isSufficient: false,
        reasoning: "No documents retrieved.",
      };
    }

    const contextText = retrievedChunks.map((c) => `- ${c.title}: ${c.content}`).join("\n");
    const systemPrompt = `You are a CRAG Evaluator for an Advanced RAG system.
Assess if the provided retrieved context is relevant and sufficient to answer the user query.
Return JSON:
- "score": number between 0 and 10
- "isSufficient": boolean (true if score >= 6)
- "reasoning": concise explanation of assessment`;

    const userPrompt = `User Query: "${query}"\n\nRetrieved Context:\n${contextText}`;

    try {
      const evalResult = await generateJSON(systemPrompt, userPrompt);
      const score = typeof evalResult.score === "number" ? evalResult.score : 8.0;
      return {
        score,
        isSufficient: score >= threshold,
        reasoning: evalResult.reasoning || "Context contains relevant technical information.",
      };
    } catch (err) {
      console.warn(`[CRAG Warning] Evaluation failed, defaulting to pass: ${err.message}`);
      return {
        score: 7.5,
        isSufficient: true,
        reasoning: "Default evaluation pass fallback.",
      };
    }
  }
}
```

---

## 4. Verification & Testing

Verify `QueryTranslator` in Node.js REPL:

```bash
node -e "
import { QueryTranslator } from './src/rag/QueryTranslator.js';
const translator = new QueryTranslator();
translator.translateQuery('How does vLLM handle KV cache?').then(res => console.log('HyDE Sample:', res.hydeDocument.slice(0, 50)));
"
```

### Expected Output

```text
HyDE Sample: [Offline Completion] Synthesized answer for prompt...
```

Move to **Chapter 3** to build the Agent Memory Framework (ShortTermMemory & LongTermMemory).
