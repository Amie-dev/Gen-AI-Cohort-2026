import { TreeBuilder } from "./tree/TreeBuilder.js";
import { AgenticTreeSearchEngine } from "./search/AgenticTreeSearchEngine.js";
import { LLMLibrarian } from "./wiki/LLMLibrarian.js";
import { TwoPassRetriever } from "./wiki/TwoPassRetriever.js";
import { VectorVsVectorlessBenchmark } from "./comparison/VectorVsVectorlessBenchmark.js";

/**
 * Interactive Command Line Interface for Vectorless RAG & LLM Wiki Engine powered by Gemini API.
 */
async function runCLI() {
  const args = process.argv.slice(2);
  const modeArg = args.find((a) => a.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "all";

  console.log("==========================================================================");
  console.log("🚀 VECTORLESS RAG & LLM WIKI ENGINE (GEMINI API IMPLEMENTATION)");
  console.log("==========================================================================\n");

  if (mode === "tree" || mode === "all") {
    console.log("=== 🌳 DEMO 1: Vectorless RAG Tree Search (PageIndex Architecture) ===");
    const tree = TreeBuilder.buildSampleManualTree();

    console.log("\n--- Document Tree Structure ---");
    tree.printTree();

    const searchEngine = new AgenticTreeSearchEngine(tree);
    const query = "How do sticky sessions handle backend server failover on an ALB?";
    const result = await searchEngine.search(query);

    console.log("\n--- Retained Section Context ---");
    console.log(result.retrievedContent);
  }

  if (mode === "wiki" || mode === "all") {
    console.log("\n==========================================================================");
    console.log("=== 📚 DEMO 2: LLM Wiki Two-Pass Retrieval (Karpathy Model) ===");
    console.log("==========================================================================");
    
    const vault = LLMLibrarian.buildSampleVault();
    const wikiRetriever = new TwoPassRetriever(vault);

    const query = "Where is the documentation for ALB sticky sessions cookies?";
    const result = await wikiRetriever.searchAndRetrieve(query);

    console.log("\n--- Final Retrieved Document Text ---");
    console.log(result.retrievedFullContent);
  }

  if (mode === "benchmark" || mode === "all") {
    console.log("\n==========================================================================");
    console.log("=== ⚡ DEMO 3: Vector RAG vs Vectorless RAG Benchmark ===");
    console.log("==========================================================================");
    await VectorVsVectorlessBenchmark.runBenchmark();
  }
}

runCLI();
