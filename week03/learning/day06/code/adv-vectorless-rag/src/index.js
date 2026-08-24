import { TreeBuilder } from "./tree/TreeBuilder.js";
import { AgenticTreeSearchEngine } from "./search/AgenticTreeSearchEngine.js";
import { LLMLibrarian } from "./wiki/LLMLibrarian.js";
import { TwoPassRetriever } from "./wiki/TwoPassRetriever.js";
import { VectorVsVectorlessBenchmark } from "./comparison/VectorVsVectorlessBenchmark.js";

async function main() {
  console.log(`==========================================================================`);
  console.log(`🚀 ADVANCED VECTORLESS RAG & LLM WIKI ENGINE (JS NODE.JS IMPLEMENTATION)`);
  console.log(`==========================================================================`);

  // -----------------------------------------------------------------
  // DEMO 1: Vectorless RAG Tree Search (PageIndex Architecture)
  // -----------------------------------------------------------------
  console.log(`\n=== 🌳 DEMO 1: Vectorless RAG Tree Search (PageIndex Architecture) ===`);
  const treeIndex = TreeBuilder.buildSampleDistributedSystemsTree();
  console.log(`--- Document Tree Structure ---`);
  treeIndex.printTree();

  const searchEngine = new AgenticTreeSearchEngine(treeIndex);
  const treeResult = await searchEngine.search(
    "How do sticky sessions handle backend server failover on an ALB?"
  );

  console.log(`\n--- Retained Section Context ---`);
  console.log(treeResult.retrievedContent);

  // -----------------------------------------------------------------
  // DEMO 2: LLM Wiki Two-Pass Retrieval (Andrej Karpathy Architecture)
  // -----------------------------------------------------------------
  console.log(`\n==========================================================================`);
  console.log(`=== 📚 DEMO 2: LLM Wiki Two-Pass Retrieval (Karpathy Model) ===`);
  console.log(`==========================================================================`);
  const wikiVault = LLMLibrarian.buildSampleWikiVault();
  const wikiRetriever = new TwoPassRetriever(wikiVault);

  const wikiResult = await wikiRetriever.searchAndRetrieve(
    "Where is the documentation for ALB sticky sessions cookies?"
  );

  console.log(`\n--- Final Retrieved Document Text ---`);
  console.log(wikiResult.retrievedFullContent);

  // -----------------------------------------------------------------
  // DEMO 3: Vector RAG vs Vectorless RAG Benchmark Comparison
  // -----------------------------------------------------------------
  console.log(`\n==========================================================================`);
  console.log(`=== ⚡ DEMO 3: Vector RAG vs Vectorless RAG Benchmark ===`);
  console.log(`==========================================================================`);
  await VectorVsVectorlessBenchmark.runBenchmark();
}

main().catch((err) => console.error("Application Execution Error:", err));
