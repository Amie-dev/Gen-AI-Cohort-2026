import { RAGMemoryAgent } from "./src/agent/RAGMemoryAgent.js";

async function runDemo() {
  console.log("==========================================================");
  console.log("🚀 STARTING ADVANCED RAG + AGENT MEMORY DEMONSTRATION");
  console.log("==========================================================\n");

  const agent = new RAGMemoryAgent();
  
  // 1. Seed Knowledge Base
  console.log("📦 Seeding Knowledge Base with technical domain documents...");
  await agent.seedKnowledgeBase();
  console.log("✅ Knowledge base ready.\n");

  const userId = "user_aminul_101";
  const sessionId = "session_rag_mem_001";

  // --- TURN 1: User introduction & PII + Preferences ---
  const result1 = await agent.handleQuery(
    userId,
    sessionId,
    "Hi, my name is Alex and my email is alex.dev@example.com. I am a senior GenAI engineer working on vLLM inference."
  );
  console.log(`\n💬 [Assistant Answer]:\n${result1.response}`);

  // --- TURN 2: Deep technical question requiring Knowledge RAG ---
  const result2 = await agent.handleQuery(
    userId,
    sessionId,
    "How does vLLM handle KV cache fragmentation compared to standard operating system memory management?"
  );
  console.log(`\n💬 [Assistant Answer]:\n${result2.response}`);

  // --- TURN 3: Personal preference query requiring Long-Term Memory ---
  const result3 = await agent.handleQuery(
    userId,
    sessionId,
    "Can you summarize what technology stack and tools I am working on based on my profile?"
  );
  console.log(`\n💬 [Assistant Answer]:\n${result3.response}`);

  // --- TURN 4: Updated preference / Contradiction scenario ---
  const result4 = await agent.handleQuery(
    userId,
    sessionId,
    "Actually, I moved from Tokyo to London and now focus primarily on agent memory dreaming architectures."
  );
  console.log(`\n💬 [Assistant Answer]:\n${result4.response}`);

  // --- MEMORY DREAMING & REFLECTION PASS ---
  console.log("\n==========================================================");
  console.log("🌙 RUNNING MEMORY DREAMING & REFLECTION BACKGROUND JOB");
  console.log("==========================================================");
  const reflectionResult = await agent.memoryReflection.runReflectionPass(userId);
  console.log(`✨ Reflection Summary:`, reflectionResult);

  console.log("\n==========================================================");
  console.log("📊 CURRENT LONG-TERM SEMANTIC MEMORY STORE STATE");
  console.log("==========================================================");
  console.dir(
    agent.ltm.semanticMemory.map((f) => ({
      id: f.id,
      fact: f.fact,
      category: f.category,
      hitCount: f.hitCount,
      lastAccessedAt: f.lastAccessedAt,
    })),
    { depth: null }
  );

  console.log("\n==========================================================");
  console.log("✅ DEMONSTRATION COMPLETE");
  console.log("==========================================================");
}

runDemo().catch((err) => {
  console.error("❌ Execution Error:", err);
});
