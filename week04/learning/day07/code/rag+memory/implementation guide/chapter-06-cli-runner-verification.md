# Chapter 6 — CLI Demonstration Suite & Verification Workflows

## 1. Chapter Goal

The goal of this chapter is to build the main **CLI Entry Point** inside `index.js` and verify end-to-end execution across 4 distinct scenarios: user fact mining, RAG technical retrieval, short-term conversational follow-up, and background memory dreaming.

In this chapter, we:
* Build `index.js`
* Run the interactive 4-scenario demonstration suite
* Execute the offline Memory Reflection dreaming background job (`npm run dream`)

---

### 🎯 Expected Outcome

Executing `npm start` runs the end-to-end multi-turn scenario demonstrator:

```text
npm start
   ├── Pass 1: Mine User Facts ("I am a AI engineer, email developer@company.com")
   ├── Pass 2: RAG Technical Query ("How does vLLM handle KV cache?")
   ├── Pass 3: Short-Term Memory Follow-Up ("Can you summarize our discussion?")
   └── Pass 4: Offline Memory Reflection Pass (Deduplication & Decay Eviction)
```

---

## 2. Implementation of `index.js`

### File Path

```text
rag+memory/index.js
```

### Code

```javascript
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
```

---

## 3. Execution & Verification Workflows

### 1. Run Main Demonstration Suite

```bash
npm start
```

### Expected Output Summary

```text
=========================================================================
🚀 DEMONSTRATION: Advanced RAG + Agent Memory Architecture
=========================================================================

📚 Seeding RAG Knowledge Base...
✅ Knowledge base seeded with technical documents.

🛡️  [Guardrails] Masked 1 PII token(s) -> "Hi, I am an AI Engineer specializing in vLLM deployments. Contact me at [MASKED_EMAIL_1]."
🧠 [LTM Fact Extraction] Extracted 1 new fact(s):
   - [preference] User is an AI Engineer specializing in vLLM deployments.

...

✨ Memory Dreaming Pass Summary: { consolidated: 0, evicted: 0 }
=========================================================================
🎉 ALL SCENARIO DEMONSTRATIONS COMPLETED SUCCESSFULLY
=========================================================================
```

### 2. Run Background Memory Dreaming Script

```bash
npm run dream
```

---

## 🎉 Conclusion

Congratulations! You have successfully built a production-grade **Advanced RAG + Agent Memory Architecture** featuring dual retrieval (Mem0 LTM vs Knowledge RAG), PII guardrails, query transformations (HyDE, Query Rewriting, Step-Back, Sub-Queries), Reciprocal Rank Fusion (RRF), Corrective RAG (CRAG) evaluation, STM sliding window history, LLM fact mining, and offline memory reflection dreaming!
