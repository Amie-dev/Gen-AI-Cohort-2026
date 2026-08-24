import readline from "readline";
import { TreeBuilder } from "./tree/TreeBuilder.js";
import { AgenticTreeSearchEngine } from "./search/AgenticTreeSearchEngine.js";
import { LLMLibrarian } from "./wiki/LLMLibrarian.js";
import { TwoPassRetriever } from "./wiki/TwoPassRetriever.js";
import { VectorVsVectorlessBenchmark } from "./comparison/VectorVsVectorlessBenchmark.js";

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (const arg of args) {
    if (arg.startsWith("--mode=")) {
      flags.mode = arg.split("=")[1];
    }
  }
  return flags;
}

async function runTreeDemo() {
  console.log(`\n=== 🌳 Vectorless RAG Tree Search (PageIndex Architecture) ===`);
  const treeIndex = TreeBuilder.buildSampleDistributedSystemsTree();
  console.log(`\n--- Document Tree Structure ---`);
  treeIndex.printTree();

  const searchEngine = new AgenticTreeSearchEngine(treeIndex);
  const result = await searchEngine.search(
    "How do sticky sessions handle backend server failover on an ALB?"
  );

  console.log(`\n--- Retained Section Context ---`);
  console.log(result.retrievedContent);
}

async function runWikiDemo() {
  console.log(`\n=== 📚 LLM Wiki Two-Pass Retrieval (Karpathy Model) ===`);
  const vault = LLMLibrarian.buildSampleWikiVault();
  const retriever = new TwoPassRetriever(vault);

  const result = await retriever.searchAndRetrieve(
    "Where is the documentation for ALB sticky sessions cookies?"
  );

  console.log(`\n--- Final Retrieved Document Text ---`);
  console.log(result.retrievedFullContent);
}

async function runBenchmarkDemo() {
  await VectorVsVectorlessBenchmark.runBenchmark(
    "What happens if sticky session persistence fails?"
  );
}

async function showInteractiveMenu() {
  console.log(`\n==================================================`);
  console.log(`🚀 ADVANCED VECTORLESS RAG INTERACTIVE CLI MENU`);
  console.log(`==================================================`);
  console.log(`1. Run Vectorless Tree Search (PageIndex Model)`);
  console.log(`2. Run LLM Wiki Two-Pass Retrieval (Karpathy Model)`);
  console.log(`3. Run Vector vs Vectorless RAG Benchmark`);
  console.log(`4. Exit`);
  console.log(`==================================================\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Select an option (1-4): ", async (answer) => {
    rl.close();
    switch (answer.trim()) {
      case "1":
        await runTreeDemo();
        break;
      case "2":
        await runWikiDemo();
        break;
      case "3":
        await runBenchmarkDemo();
        break;
      case "4":
        console.log("Exiting CLI application.");
        process.exit(0);
      default:
        console.log("Invalid option selected.");
    }
  });
}

async function main() {
  const flags = parseArgs();

  if (flags.mode === "tree") {
    await runTreeDemo();
  } else if (flags.mode === "wiki") {
    await runWikiDemo();
  } else if (flags.mode === "benchmark") {
    await runBenchmarkDemo();
  } else {
    await showInteractiveMenu();
  }
}

main().catch((err) => console.error("CLI Execution Error:", err));
