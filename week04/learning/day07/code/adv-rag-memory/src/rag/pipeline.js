import { QueryRewriter } from "./query/rewrite.js";
import { StepBackGenerator } from "./query/stepBack.js";
import { SubQueryDecomposer } from "./query/subQueries.js";
import { HyDEGenerator } from "./query/hyde.js";
import { ParallelSearch } from "./retrieval/search.js";

/**
 * Production RAG Pipeline Orchestrator
 */
export class RAGPipeline {
  static async executeRAG(cleanQuery, userContext = {}) {
    console.log(` └─ 🔎 [Production RAG] Translating clean query...`);
    const rewritten = QueryRewriter.rewrite(cleanQuery);
    const stepBack = StepBackGenerator.generateStepBack(cleanQuery);
    const subQueries = SubQueryDecomposer.decompose(cleanQuery);
    const hydePassage = HyDEGenerator.generatePassage(cleanQuery);

    const queryVariants = [cleanQuery, rewritten, stepBack, ...subQueries, hydePassage];

    console.log(` └─ 📚 [Production RAG] Executing parallel multi-source search across variants...`);
    const topKEvidence = await ParallelSearch.searchAll(queryVariants, userContext);

    console.log(`    └─ Retrieved & Re-Ranked ${topKEvidence.length} evidence document(s).`);
    return topKEvidence;
  }
}
