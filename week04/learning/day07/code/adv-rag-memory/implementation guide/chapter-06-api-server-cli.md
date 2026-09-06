# Chapter 6 — Express REST API Gateway & Interactive CLI Runner

## 1. Chapter Goal

The goal of this chapter is to build the **Express REST API Gateway** inside `src/api/server.js` and the **Interactive CLI Runner** inside `index.js`.

The API Gateway exposes HTTP endpoints for client applications, frontends, or webhooks to interact with the Advanced RAG + Mem0 system. The interactive CLI provides terminal-based real-time testing.

In this chapter, we:
* Build Express REST API Gateway (`src/api/server.js`) with `/chat`, `/ingest`, and `/memories` endpoints
* Build Interactive CLI Runner (`index.js`)
* Perform end-to-end API verification with `curl` commands

---

### 🎯 Expected Outcome

The server handles incoming HTTP requests cleanly:

```text
HTTP POST /chat { userId, query } ──> processAdvRagPipeline ──> HTTP 200 JSON Response
HTTP POST /ingest { document }   ──> Indexing Pipeline   ──> HTTP 200 { status: "ingested" }
HTTP GET /memories?userId=u123  ──> mem0Client           ──> HTTP 200 { memories: [...] }
```

---

## 2. Express REST API Gateway (`src/api/server.js`)

### File Path

```text
adv-rag-memory/src/api/server.js
```

### Code

## 2. Express REST API Gateway (`src/api/server.js`)

### File Path

```text
adv-rag-memory/src/api/server.js
```

### Code

```javascript
import express from "express";
import { config } from "../config.js";
import { InputGuardrails } from "../guardrails/input.js";
import { MemorySearch } from "../memory/memorySearch.js";
import { stmStore } from "../chat/stm.js";
import { RAGPipeline } from "../rag/pipeline.js";
import { ContextBuilder } from "../rag/generation/contextBuilder.js";
import { GenerationLLM } from "../rag/generation/generate.js";
import { CRAGEvaluator } from "../rag/evaluation/crag.js";
import { OutputGuardrails } from "../guardrails/output.js";
import { conversationStore } from "../chat/conversationStore.js";
import { MemoryQueue } from "../queues/memoryQueue.js";

const app = express();
app.use(express.json());

const inputGuardrails = new InputGuardrails();
const outputGuardrails = new OutputGuardrails();

/**
 * Main End-to-End Chat API Endpoint
 */
app.post("/chat", async (req, res) => {
  try {
    const { userId, sessionId, query } = req.body;
    if (!userId || !query) {
      return res.status(400).json({ error: "Missing required fields: userId and query" });
    }

    const currentSession = sessionId || `session_${Date.now()}`;
    const userContext = { userId, isInternal: true };

    // 1. Input Guardrails (PII Masking & Injection Check)
    const { cleanQuery, tokenMap } = inputGuardrails.process(query, userContext);

    // 2. Retrieve Mem0 Long-Term User Memory
    const relevantMemories = await MemorySearch.searchRelevantUserMemories(userId, cleanQuery);

    // 3. Retrieve Short-Term Memory (STM)
    const stmHistory = await stmStore.getRecentContext(currentSession);

    // 4. Execute Production RAG Pipeline
    const ragEvidence = await RAGPipeline.executeRAG(cleanQuery, userContext);

    // 5. Context Assembly
    const contextPayload = ContextBuilder.buildContextPayload(
      "You are a helpful personalized AI assistant.",
      relevantMemories,
      stmHistory,
      ragEvidence,
      cleanQuery
    );

    // 6. Generation LLM Call
    const rawAnswer = await GenerationLLM.generateAnswer(contextPayload);

    // 7. CRAG Answer Evaluation
    const cragEval = CRAGEvaluator.evaluate(cleanQuery, contextPayload, rawAnswer);

    // 8. Output Guardrails (Unmask PII)
    const finalResponse = outputGuardrails.process(rawAnswer, tokenMap);

    // 9. Store STM Turn
    await stmStore.addTurn(currentSession, "user", query);
    await stmStore.addTurn(currentSession, "assistant", finalResponse);

    // 10. Log Immutable Conversation
    await conversationStore.logInteraction(userId, currentSession, query, finalResponse);

    // 11. Queue Async Memory Processing Job
    await MemoryQueue.enqueueJob({ userId, sessionId: currentSession, userQuery: query, assistantResponse: finalResponse });

    return res.json({
      success: true,
      sessionId: currentSession,
      response: finalResponse,
      evaluation: cragEval,
      memoriesUsedCount: relevantMemories.length,
      ragEvidenceCount: ragEvidence.length,
    });
  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  app.listen(config.port, () => {
    console.log(`🚀 Production RAG + Mem0 API Gateway running at http://localhost:${config.port}`);
  });
}

export { app };
```

---

## 3. Interactive CLI Runner (`index.js`)

### File Path

```text
adv-rag-memory/index.js
```

### Code

```javascript
import { InputGuardrails } from "./src/guardrails/input.js";
import { MemorySearch } from "./src/memory/memorySearch.js";
import { stmStore } from "./src/chat/stm.js";
import { RAGPipeline } from "./src/rag/pipeline.js";
import { ContextBuilder } from "./src/rag/generation/contextBuilder.js";
import { GenerationLLM } from "./src/rag/generation/generate.js";
import { CRAGEvaluator } from "./src/rag/evaluation/crag.js";
import { OutputGuardrails } from "./src/guardrails/output.js";
import { conversationStore } from "./src/chat/conversationStore.js";
import { MemoryQueue } from "./src/queues/memoryQueue.js";
import { runMemoryWorkerPass } from "./src/memory/memoryWorker.js";
import { mem0Client } from "./src/memory/mem0.js";

async function executeTurn(userId, sessionId, rawQuery) {
  console.log(`\n=================================================================`);
  console.log(`👤 User Query: "${rawQuery}"`);
  console.log(`=================================================================`);

  const userContext = { userId, isInternal: true };
  const inputGuardrails = new InputGuardrails();
  const outputGuardrails = new OutputGuardrails();

  // Step 2: Input Guardrails & PII Masking
  const { cleanQuery, maskedCount, tokenMap } = inputGuardrails.process(rawQuery, userContext);
  if (maskedCount > 0) {
    console.log(`🛡️  [Input Guardrails] Masked ${maskedCount} PII token(s) -> "${cleanQuery}"`);
  }

  // Step 3: Mem0 Memory Search
  console.log(`🧠 [Mem0 Memory Layer] Searching user-specific facts...`);
  const relevantMemories = await MemorySearch.searchRelevantUserMemories(userId, cleanQuery);
  console.log(`   └─ Found ${relevantMemories.length} relevant long-term memory item(s).`);

  // Step 4: STM Retrieval
  const stmHistory = await stmStore.getRecentContext(sessionId);
  console.log(`💬 [STM Buffer] Current sliding window count: ${stmHistory.length} message turn(s).`);

  // Step 5: Production RAG Knowledge Retrieval
  const ragEvidence = await RAGPipeline.executeRAG(cleanQuery, userContext);

  // Step 6: Context Assembly
  const contextPayload = ContextBuilder.buildContextPayload(
    "You are a personalized AI Assistant.",
    relevantMemories,
    stmHistory,
    ragEvidence,
    cleanQuery
  );

  // Step 7: Generation LLM
  console.log(`🤖 [LLM Generation] Generating personalized answer...`);
  const rawAnswer = await GenerationLLM.generateAnswer(contextPayload);

  // Step 8: CRAG Evaluation
  const cragEval = CRAGEvaluator.evaluate(cleanQuery, contextPayload, rawAnswer);
  console.log(`⚖️  [CRAG Evaluation] Score: ${cragEval.score}/10 | Grounded: ${cragEval.isGood}`);

  // Step 9: Output Guardrails (Unmask PII)
  const finalAnswer = outputGuardrails.process(rawAnswer, tokenMap);

  // Step 10: Store Conversation Logs & STM
  await stmStore.addTurn(sessionId, "user", rawQuery);
  await stmStore.addTurn(sessionId, "assistant", finalAnswer);
  await conversationStore.logInteraction(userId, sessionId, rawQuery, finalAnswer);

  // Step 11: Queue Memory Processing
  await MemoryQueue.enqueueJob({ userId, sessionId, userQuery: rawQuery, assistantResponse: finalAnswer });

  return finalAnswer;
}

async function runDemo() {
  console.log("==========================================================");
  console.log("🚀 STARTING PRODUCTION RAG + MEM0 MEMORY DEMONSTRATION");
  console.log("==========================================================\n");

  const userId = "user_aminul_101";
  const sessionId = "session_adv_rag_mem_001";

  // Pre-seed a Mem0 preference
  await mem0Client.addMemory(userId, "User prefers TypeScript and Node.js for backend projects.", "preference");
  await mem0Client.addMemory(userId, "User works on vLLM GPU inference optimization.", "professional");

  // TURN 1: PII Masking + Technical Question
  const ans1 = await executeTurn(
    userId,
    sessionId,
    "Hi, my name is Alex and my email is alex.dev@example.com. I prefer PostgreSQL for my database projects."
  );
  console.log(`\n💬 [Assistant Response]:\n${ans1}`);

  // TURN 2: Personalization relying on Mem0 + RAG
  const ans2 = await executeTurn(
    userId,
    sessionId,
    "Which database and memory framework should I choose for my new AI backend project?"
  );
  console.log(`\n💬 [Assistant Response]:\n${ans2}`);

  // RUN BACKGROUND MEMORY WORKER
  console.log("\n==========================================================");
  console.log("🌙 EXECUTING ASYNCHRONOUS BACKGROUND MEMORY WORKER PASS");
  console.log("==========================================================");
  const workerResult = await runMemoryWorkerPass();
  console.log("✨ Worker Result:", workerResult);

  console.log("\n==========================================================");
  console.log("📊 FINAL MEM0 LONG-TERM MEMORY STORE STATE");
  console.log("==========================================================");
  const allMems = await mem0Client.getAllMemories(userId);
  console.dir(allMems, { depth: null });

  console.log("\n==========================================================");
  console.log("✅ DEMONSTRATION COMPLETE");
  console.log("==========================================================");
}

runDemo().catch((err) => console.error("Execution Error:", err));
```

---

## 4. Verification & API Testing Workflows

### 1. Start the Server

```bash
npm start
```

### 2. Test `/chat` Endpoint via `curl`

In a separate terminal window:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_demo_01",
    "message": "What is the recommended architecture for RAG memory?"
  }'
```

### Expected Response

```json
{
  "status": "success",
  "userId": "user_demo_01",
  "response": "[Offline Response] Answer for query: \"What is the recommended architecture for RAG memory?\" using assembled Tri-Context evidence.",
  "memoriesUsed": [
    { "id": "mem_1", "memory": "User prefers concise technical responses." }
  ]
}
```

### 3. Test `/memories` Endpoint via `curl`

```bash
curl -X GET "http://localhost:3000/memories?userId=user_demo_01"
```

---

## 🎉 Conclusion

Congratulations! You have successfully built a production-grade **Advanced RAG + Mem0 Long-Term Memory Architecture** featuring dual retrieval, input/output guardrails, query transformations (HyDE, Rewriting, Step-Back, Sub-queries), RRF rank fusion, cross-encoder re-ranking, Tri-Context prompt assembly, Corrective RAG evaluation, and non-blocking asynchronous memory updates!
