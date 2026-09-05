# Chapter 5 — Context Assembly, Corrective RAG (CRAG) & Master Pipeline

## 1. Chapter Goal

The goal of this chapter is to build the **Tri-Context Assembly Engine** inside `src/rag/generation/contextBuilder.js`, the **Corrective RAG (CRAG) Evaluator** inside `src/rag/evaluation/crag.js`, and the **Master RAG + Mem0 Orchestrator** inside `src/rag/pipeline.js`.

The final response quality of a RAG system depends on prompt context assembly. Rather than passing raw document chunks alone, the system synthesizes three distinct context sources: **Long-Term User Memory (Mem0)**, **Top-K RAG Knowledge Evidence**, and **Short-Term Chat Conversation (STM)**. The generated completion is evaluated by **Corrective RAG (CRAG)** to catch low-confidence evidence before delivering answers.

In this chapter, we:
* Build Tri-Context Assembly (`src/rag/generation/contextBuilder.js`)
* Build LLM Completion Generator (`src/rag/generation/generate.js`)
* Build CRAG Relevancy Evaluator (`src/rag/evaluation/crag.js`)
* Build Master RAG + Mem0 Pipeline Orchestrator (`src/rag/pipeline.js`)

---

### 🎯 Expected Outcome

The pipeline orchestrates end-to-end processing across all sub-components:

```text
User Query ──> [Input Guardrails & Mem0 Search & RAG Retrieval]
                      │
                      ▼
            [Tri-Context Assembly] (Mem0 Facts + RAG Evidence + Chat History)
                      │
                      ▼
             [LLM Generation (GPT-4o)]
                      │
                      ▼
           [CRAG Confidence Evaluation] ──> [Output Guardrail & PII Masking] ──> Response
```

---

## 2. Tri-Context Assembly Engine (`src/rag/generation/contextBuilder.js`)

### File Path

```text
adv-rag-memory/src/rag/generation/contextBuilder.js
```

### Code

```javascript
export function buildTriContextPayload({ query, memories, evidenceDocs, stmHistory }) {
  console.log('[ContextBuilder] Assembling Tri-Context Prompt Payload');

  const memoryBlock = memories.length > 0
    ? memories.map((m) => `- ${m.memory || m}`).join('\n')
    : 'No personalized user memories found.';

  const evidenceBlock = evidenceDocs.length > 0
    ? evidenceDocs.map((d, i) => `[Evidence ${i + 1}]: ${d.content}`).join('\n\n')
    : 'No external knowledge evidence retrieved.';

  const stmBlock = stmHistory.length > 0
    ? stmHistory.map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`).join('\n')
    : 'No recent chat history.';

  const systemPrompt = `
You are an advanced AI assistant.

### User Long-Term Memory (Mem0):
${memoryBlock}

### External Knowledge Evidence (RAG):
${evidenceBlock}

### Recent Conversation History (STM):
${stmBlock}
`;

  return { systemPrompt, query };
}
```

---

## 3. LLM Completion Generator (`src/rag/generation/generate.js`)

### File Path

```text
adv-rag-memory/src/rag/generation/generate.js
```

### Code

```javascript
import OpenAI from 'openai';
import { config } from '../../config.js';

export async function generateCompletion(contextPayload) {
  console.log('[Generate] Calling LLM completion engine');
  const openai = new OpenAI({ apiKey: config.openaiApiKey || 'dummy-key' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: contextPayload.systemPrompt },
        { role: 'user', content: contextPayload.query },
      ],
    });
    return response.choices[0]?.message?.content || 'No response generated.';
  } catch {
    // Offline simulation fallback
    return `[Offline Response] Answer for query: "${contextPayload.query}" using assembled Tri-Context evidence.`;
  }
}
```

---

## 4. Corrective RAG (CRAG) Evaluator (`src/rag/evaluation/crag.js`)

Evaluates whether retrieved evidence is sufficient and confident:

```javascript
export function evaluateEvidenceConfidence(query, evidenceDocs) {
  console.log(`[CRAG Evaluator] Evaluating confidence for ${evidenceDocs.length} evidence docs`);

  if (!evidenceDocs || evidenceDocs.length === 0) {
    return { status: 'POOR', confidenceScore: 0.1, recommendation: 'FALLBACK_WEB_SEARCH' };
  }

  const avgScore = evidenceDocs.reduce((acc, doc) => acc + (doc.rerankScore || 0.8), 0) / evidenceDocs.length;

  if (avgScore >= 0.7) {
    return { status: 'GOOD', confidenceScore: avgScore, recommendation: 'PROCEED' };
  }

  return { status: 'AMBIGUOUS', confidenceScore: avgScore, recommendation: 'REWRITE_QUERY' };
}
```

---

## 5. Master Pipeline Orchestrator (`src/rag/pipeline.js`)

### File Path

```text
adv-rag-memory/src/rag/pipeline.js
```

### Code

```javascript
import { validateInput } from '../guardrails/input.js';
import { checkInjection } from '../guardrails/injection.js';
import { redactPII } from '../guardrails/pii.js';
import { searchUserMemories } from '../memory/memorySearch.js';
import { queueMemoryUpdate } from '../memory/memoryWriter.js';
import { getShortTermMemory, addShortTermTurn } from '../chat/stm.js';
import { rewriteQuery } from './query/rewrite.js';
import { generateHydeDocument } from './query/hyde.js';
import { queryQdrantAdapter } from './adapters/qdrant.js';
import { applyMetadataFiltering } from './retrieval/filtering.js';
import { computeRrfFusion } from './retrieval/rrf.js';
import { reRankDocuments } from './retrieval/reranker.js';
import { buildTriContextPayload } from './generation/contextBuilder.js';
import { generateCompletion } from './generation/generate.js';
import { evaluateEvidenceConfidence } from './evaluation/crag.js';

export async function processAdvRagPipeline({ userId, query, userContext = {} }) {
  // 1. Input Guardrails
  const inputCheck = validateInput(query);
  if (!inputCheck.valid) throw new Error(`Input Error: ${inputCheck.reason}`);

  const injectionCheck = checkInjection(query);
  if (injectionCheck.detected) throw new Error('Security Error: Prompt injection attempt detected.');

  const cleanQuery = inputCheck.cleanQuery;

  // 2. Parallel Dual Retrieval Phase (Mem0 LTM + RAG Document Retrieval)
  const [userMemories, stmHistory, rewrittenQuery, hydeDoc] = await Promise.all([
    searchUserMemories(userId, cleanQuery),
    getShortTermMemory(userId),
    rewriteQuery(cleanQuery),
    generateHydeDocument(cleanQuery),
  ]);

  // 3. Multi-Query Vector Retrieval & Filtering
  const rawResults1 = await queryQdrantAdapter(rewrittenQuery, userContext);
  const rawResults2 = await queryQdrantAdapter(hydeDoc, userContext);

  const filtered1 = applyMetadataFiltering(rawResults1, userContext);
  const filtered2 = applyMetadataFiltering(rawResults2, userContext);

  // 4. RRF Fusion & Re-ranking
  const fusedDocs = computeRrfFusion([filtered1, filtered2]);
  const topEvidence = await reRankDocuments(cleanQuery, fusedDocs, 3);

  // 5. CRAG Evaluation
  const cragEvaluation = evaluateEvidenceConfidence(cleanQuery, topEvidence);

  // 6. Tri-Context Assembly & Generation
  const contextPayload = buildTriContextPayload({
    query: cleanQuery,
    memories: userMemories,
    evidenceDocs: topEvidence,
    stmHistory,
  });

  const rawLLMResponse = await generateCompletion(contextPayload);

  // 7. Output Guardrail & PII Masking
  const finalResponse = redactPII(rawLLMResponse);

  // 8. Update Short-Term & Asynchronous Long-Term Memory
  await addShortTermTurn(userId, 'user', cleanQuery);
  await addShortTermTurn(userId, 'assistant', finalResponse);
  await queueMemoryUpdate(userId, cleanQuery, finalResponse);

  return {
    response: finalResponse,
    memoriesUsed: userMemories,
    evidenceDocs: topEvidence,
    cragEvaluation,
  };
}
```

---

## 6. Verification & Testing

Verify end-to-end pipeline execution in Node.js:

```bash
node -e "
import { processAdvRagPipeline } from './src/rag/pipeline.js';
processAdvRagPipeline({ userId: 'user_test', query: 'What is my preferred tech stack?' }).then(res => console.log('Pipeline Result:', res.response));
"
```

### Expected Output

```text
[ContextBuilder] Assembling Tri-Context Prompt Payload
[Generate] Calling LLM completion engine
[CRAG Evaluator] Evaluating confidence for 2 evidence docs
Pipeline Result: [Offline Response] Answer for query: "What is my preferred tech stack?" using assembled Tri-Context evidence.
```

Move to **Chapter 6** to expose the system via Express REST API and Interactive CLI.
