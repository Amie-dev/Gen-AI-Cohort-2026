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
  console.log("=========================================================================");
  console.log("🚀 DEMONSTRATION: Advanced RAG + Agent Memory Architecture");
  console.log("=========================================================================\n");

  const agent = new RAGMemoryAgent();

  // 1. Seed Knowledge Base with Domain Documents
  console.log("📚 Seeding RAG Knowledge Base...");
  await agent.seedKnowledgeBase();
  console.log("✅ Knowledge base seeded with technical documents.\n");

  const userId = "dev_user_99";
  const sessionId = "session_alpha_01";

  // -------------------------------------------------------------------------
  // SCENARIO 1: Personal Fact Mining & PII Masking
  // -------------------------------------------------------------------------
  console.log("-------------------------------------------------------------------------");
  console.log("📌 SCENARIO 1: User introduces facts & preferences (with PII token)");
  console.log("-------------------------------------------------------------------------\n");

  const res1 = await agent.handleQuery(
    userId,
    sessionId,
    "Hi, I am an AI Engineer specializing in vLLM deployments. Contact me at engineer@company.com."
  );

  console.log("\n✨ Final Agent Response:");
  console.log(res1.response);

  // -------------------------------------------------------------------------
  // SCENARIO 2: Technical RAG Query Personalized with Long-Term Memory Facts
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------");
  console.log("📌 SCENARIO 2: Technical RAG Query leveraging LTM user facts");
  console.log("-------------------------------------------------------------------------\n");

  const res2 = await agent.handleQuery(
    userId,
    sessionId,
    "Can you explain how vLLM optimizes memory usage during inference?"
  );

  console.log("\n✨ Final Agent Response:");
  console.log(res2.response);
  console.log("\n🧠 LTM Facts Used:", res2.ltmFactsUsed);
  console.log("📚 Knowledge Docs Used:", res2.knowledgeDocsUsed);

  // -------------------------------------------------------------------------
  // SCENARIO 3: Conversational Follow-Up using Short-Term Memory (STM)
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------");
  console.log("📌 SCENARIO 3: Conversational follow-up using STM sliding window");
  console.log("-------------------------------------------------------------------------\n");

  const res3 = await agent.handleQuery(
    userId,
    sessionId,
    "What was the main Berkeley innovation mentioned in that explanation?"
  );

  console.log("\n✨ Final Agent Response:");
  console.log(res3.response);

  // -------------------------------------------------------------------------
  // SCENARIO 4: Offline Memory Reflection & Dreaming Background Pass
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------");
  console.log("📌 SCENARIO 4: Running Offline Memory Reflection & Consolidation Pass");
  console.log("-------------------------------------------------------------------------\n");

  const reflectionResult = await agent.memoryReflection.runDreamingPass(userId);
  console.log("✨ Memory Dreaming Pass Summary:", reflectionResult);

  console.log("\n=========================================================================");
  console.log("🎉 ALL SCENARIO DEMONSTRATIONS COMPLETED SUCCESSFULLY");
  console.log("=========================================================================");
}

runDemo().catch(console.error);
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
