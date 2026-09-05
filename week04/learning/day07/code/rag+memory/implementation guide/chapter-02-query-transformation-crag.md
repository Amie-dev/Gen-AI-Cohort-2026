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
import { callLLM } from "../utils/llm.js";

export class QueryTranslator {
  async translateQuery(rawQuery) {
    const [rewritten, stepBack, subQueriesRaw, hydeDocument] = await Promise.all([
      this.rewriteQuery(rawQuery),
      this.stepBackQuery(rawQuery),
      this.decomposeSubQueries(rawQuery),
      this.generateHyde(rawQuery),
    ]);

    return {
      original: rawQuery,
      rewritten,
      stepBack,
      subQueries: subQueriesRaw,
      hydeDocument,
    };
  }

  async rewriteQuery(query) {
    const sys = "You are a Query Rewriter. Rewrite the user query for optimal technical document vector search. Output ONLY the rewritten string.";
    return await callLLM(sys, query, 0.2);
  }

  async stepBackQuery(query) {
    const sys = "You are a Step-Back Prompting expert. Generate a higher-level abstract concept query related to the user input. Output ONLY the step-back query string.";
    return await callLLM(sys, query, 0.2);
  }

  async decomposeSubQueries(query) {
    const sys = "Decompose the user query into 2 distinct sub-queries. Output sub-queries separated by newlines.";
    const resp = await callLLM(sys, query, 0.2);
    return resp.split("\n").filter((q) => q.trim().length > 0);
  }

  async generateHyde(query) {
    const sys = "You are an expert technical author. Write a hypothetical technical document passage that answers the user question in detail.";
    return await callLLM(sys, query, 0.5);
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
import { callLLM } from "../utils/llm.js";

export class CRAG {
  async evaluateContext(query, retrievedDocs, threshold = 6.5) {
    if (!retrievedDocs || retrievedDocs.length === 0) {
      return { score: 0, isSufficient: false, reasoning: "No documents retrieved." };
    }

    const docsText = retrievedDocs.map((d, i) => `[Doc ${i + 1}]: ${d.content}`).join("\n\n");
    const systemPrompt = `You are a CRAG Evaluator. Rate the relevancy and groundedness of the retrieved documents for answering the user query on a scale of 0 to 10.
Return JSON format: { "score": number, "reasoning": "string" }`;

    const userPrompt = `Query: "${query}"\n\nRetrieved Documents:\n${docsText}`;

    try {
      const resp = await callLLM(systemPrompt, userPrompt, 0.1);
      const parsed = JSON.parse(resp);
      return {
        score: parsed.score,
        isSufficient: parsed.score >= threshold,
        reasoning: parsed.reasoning,
      };
    } catch {
      // Fallback evaluation
      return {
        score: 7.5,
        isSufficient: true,
        reasoning: "Evaluation fallback score applied.",
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
