import { Guardrails } from "../rag/Guardrails.js";
import { QueryTranslator } from "../rag/QueryTranslator.js";
import { DocumentStore } from "../rag/DocumentStore.js";
import { HybridRanker } from "../rag/HybridRanker.js";
import { CRAG } from "../rag/CRAG.js";
import { ShortTermMemory } from "../memory/ShortTermMemory.js";
import { LongTermMemory } from "../memory/LongTermMemory.js";
import { MemoryExtractor } from "../memory/MemoryExtractor.js";
import { MemoryReflection } from "../memory/MemoryReflection.js";
import { getEmbedding } from "../utils/embeddings.js";
import { callLLM } from "../utils/llm.js";
import { config } from "../config.js";

/**
 * RAGMemoryAgent.js — Master Production Orchestrator
 * Integrates Advanced RAG (Day 05) with Agent Memory (Day 07)
 */
export class RAGMemoryAgent {
  constructor() {
    this.queryTranslator = new QueryTranslator();
    this.docStore = new DocumentStore();
    this.cragEvaluator = new CRAG();
    this.stm = new ShortTermMemory(config.memory.stmMaxTurns);
    this.ltm = new LongTermMemory();
    this.memoryExtractor = new MemoryExtractor(this.ltm);
    this.memoryReflection = new MemoryReflection(this.ltm);
  }

  /**
   * Seed the knowledge document base with sample domain technical documents
   */
  async seedKnowledgeBase() {
    await this.docStore.addDocument(
      "doc_vllm",
      "vLLM High Performance Inference Engine",
      "vLLM is a high-throughput and memory-efficient LLM serving engine developed at UC Berkeley. It utilizes PagedAttention to eliminate KV cache fragmentation by allocating memory in non-contiguous virtual blocks similar to standard operating system page tables. Key optimizations include continuous batching, chunked prefill, prefix caching, and disaggregated prefill/decode architecture."
    );

    await this.docStore.addDocument(
      "doc_agent_memory",
      "Agent Application-Level Memory Architectures",
      "Stateless LLM APIs require application-level memory management. Short-Term Memory (STM) uses sliding window buffers to persist recent turns. Long-Term Memory (LTM) maintains Semantic Memory (structured user facts and preferences) and Episodic Memory (interaction logs). Fact extraction engine extracts attributes using LLM calls. Memory dreaming and reflection background jobs deduplicate facts and evict stale records based on hit scores."
    );

    await this.docStore.addDocument(
      "doc_adv_rag",
      "Advanced RAG Production System Architecture",
      "Advanced RAG upgrades naive RAG by introducing Input Guardrails with PII masking, Query Translation (Query Rewriting, Step-Back Prompting, Sub-Queries, HyDE), Reciprocal Rank Fusion (RRF), Cross-Encoder Re-Ranking, and Corrective RAG (CRAG) self-evaluation. CRAG verifies groundedness and triggers query expansion if retrieval confidence is below threshold."
    );
  }

  /**
   * Process a user query through the complete RAG + Memory Pipeline
   */
  async handleQuery(userId, sessionId, rawUserQuery) {
    console.log(`\n=================================================================`);
    console.log(`👤 User Query: "${rawUserQuery}" [UserId: ${userId} | Session: ${sessionId}]`);
    console.log(`=================================================================`);

    // 1. Security & Guardrails — Input PII Masking
    const guardrails = new Guardrails();
    const { sanitizedQuery, maskedCount } = guardrails.processInput(rawUserQuery);
    if (maskedCount > 0) {
      console.log(`🛡️  [Guardrails] Masked ${maskedCount} PII token(s) -> "${sanitizedQuery}"`);
    }

    // 2. Extract Facts & Preferences into Long-Term Memory
    const extracted = await this.memoryExtractor.extractAndStore(userId, rawUserQuery);
    if (extracted.length > 0) {
      console.log(`🧠 [LTM Fact Extraction] Extracted ${extracted.length} new fact(s):`);
      extracted.forEach((f) => console.log(`   - [${f.category}] ${f.fact}`));
    }

    // 3. Pre-Retrieval Query Translation
    console.log(`🔍 [Query Translation] Translating raw query...`);
    const translations = await this.queryTranslator.translateQuery(sanitizedQuery);
    console.log(`   ├─ Rewritten: "${translations.rewritten}"`);
    console.log(`   ├─ Step-Back: "${translations.stepBack}"`);
    console.log(`   ├─ Sub-Queries: ${translations.subQueries.join(" | ")}`);
    console.log(`   └─ HyDE Passage Generated: YES (${translations.hydeDocument.slice(0, 45)}...)`);

    // 4. Multi-Source Knowledge Retrieval & Reciprocal Rank Fusion (RRF)
    console.log(`📚 [Knowledge RAG] Performing multi-query retrieval & RRF fusion...`);
    const searchStreams = [];

    // Dense search on original & rewritten
    const origVec = await getEmbedding(sanitizedQuery);
    const rewriteVec = await getEmbedding(translations.rewritten);
    const hydeVec = await getEmbedding(translations.hydeDocument);

    searchStreams.push(await this.docStore.searchDense(origVec, 4));
    searchStreams.push(await this.docStore.searchDense(rewriteVec, 4));
    searchStreams.push(await this.docStore.searchDense(hydeVec, 4));
    searchStreams.push(await this.docStore.searchSparse(sanitizedQuery, 4));

    for (const sq of translations.subQueries) {
      const sqVec = await getEmbedding(sq);
      searchStreams.push(await this.docStore.searchDense(sqVec, 4));
    }

    const fusedKnowledgeDocs = HybridRanker.fuseRRF(searchStreams, config.rag.rrfK, config.rag.topK);
    console.log(`   └─ Retrieved & Fused ${fusedKnowledgeDocs.length} top document chunk(s).`);

    // 5. Corrective RAG (CRAG) Evaluation
    const cragEval = await this.cragEvaluator.evaluateContext(sanitizedQuery, fusedKnowledgeDocs, config.rag.cragThreshold);
    console.log(`⚖️  [CRAG Assessment] Score: ${cragEval.score}/10 | Sufficient: ${cragEval.isSufficient} (${cragEval.reasoning})`);

    // 6. Long-Term Memory (LTM) Vector RAG Search
    const ltmRelevantFacts = await this.ltm.searchRelevantFacts(userId, sanitizedQuery, config.memory.ltmTopK);
    console.log(`🧠 [LTM Vector Search] Retrieved ${ltmRelevantFacts.length} relevant fact(s) from LTM.`);

    // 7. Short-Term Memory (STM) Sliding Window Fetch
    const stmHistory = await this.stm.getRecentWindow(sessionId, config.memory.stmMaxTurns);
    console.log(`⏳ [STM History] Current window contains ${stmHistory.length} message turn(s).`);

    // 8. Context Payload Assembly
    const systemPrompt = `You are an advanced AI assistant equipped with RAG knowledge lookup and long-term user memory.
Answer the user's question accurately, grounding your answers in the provided knowledge documents while personalizing your response based on the user's long-term memory facts.`;

    let contextPayload = `=== USER LONG-TERM MEMORY (FACTS) ===\n`;
    if (ltmRelevantFacts.length > 0) {
      ltmRelevantFacts.forEach((f) => {
        contextPayload += `- ${f.fact} (Hit count: ${f.hitCount})\n`;
      });
    } else {
      contextPayload += `(No relevant user facts found)\n`;
    }

    contextPayload += `\n=== RETRIEVED KNOWLEDGE DOCUMENTS (RAG) ===\n`;
    fusedKnowledgeDocs.forEach((doc, idx) => {
      contextPayload += `[Doc ${idx + 1}] Title: ${doc.title}\nContent: ${doc.content}\n\n`;
    });

    contextPayload += `\n=== RECENT CONVERSATION HISTORY (STM SLIDING WINDOW) ===\n`;
    stmHistory.forEach((turn) => {
      contextPayload += `${turn.role.toUpperCase()}: ${turn.content}\n`;
    });

    contextPayload += `\n=== CURRENT USER QUESTION ===\n${sanitizedQuery}`;

    // 9. LLM Answer Generation
    console.log(`🤖 [LLM Generation] Generating response...`);
    const rawResponse = await callLLM(systemPrompt, contextPayload, 0.3);

    // 10. Output Guardrails — Restore PII
    const finalResponse = guardrails.processOutput(rawResponse);

    // 11. Update Short-Term Memory (STM)
    await this.stm.addMessage(sessionId, "user", rawUserQuery);
    await this.stm.addMessage(sessionId, "assistant", finalResponse);

    return {
      query: rawUserQuery,
      response: finalResponse,
      cragScore: cragEval.score,
      ltmFactsUsed: ltmRelevantFacts.map((f) => f.fact),
      knowledgeDocsUsed: fusedKnowledgeDocs.map((d) => d.title),
    };
  }
}
