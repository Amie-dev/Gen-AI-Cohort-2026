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
