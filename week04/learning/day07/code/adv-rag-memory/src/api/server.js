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
