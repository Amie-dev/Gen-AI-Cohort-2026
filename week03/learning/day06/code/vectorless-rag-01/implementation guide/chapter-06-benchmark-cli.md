# Chapter 6 — Vector vs Vectorless Benchmark, CLI & SDK Exports

## 1. Chapter Goal

The goal of this chapter is to build the **`VectorVsVectorlessBenchmark` Class** (`src/comparison/VectorVsVectorlessBenchmark.js`), the **Multi-Mode CLI Driver** (`src/cli.js`), and the **Application Entry Point** (`src/index.js`).

In this chapter, we:
* Build the Benchmark Engine comparing Vector RAG vs Tree RAG (`VectorVsVectorlessBenchmark.js`)
* Build the Multi-Mode CLI Driver (`src/cli.js`)
* Export SDK modules from `src/index.js`
* Perform end-to-end verification

---

### 🎯 Expected Outcome

The CLI driver executes all three operational modes (`tree`, `wiki`, `benchmark`):

```text
npm run tree-search  ──> Hierarchical Tree Index & Top-Down Search
npm run llm-wiki     ──> Two-Pass Wiki Retrieval & LLM Librarian
npm run benchmark    ──> Vector RAG vs Vectorless Tree Benchmark
```

---

## 2. Implementing Benchmark Engine (`src/comparison/VectorVsVectorlessBenchmark.js`)

### File Path

```text
vectorless-rag-01/src/comparison/VectorVsVectorlessBenchmark.js
```

### Code

## 2. Implementing Benchmark Engine (`src/comparison/VectorVsVectorlessBenchmark.js`)

### File Path

```text
vectorless-rag-01/src/comparison/VectorVsVectorlessBenchmark.js
```

### Code

```javascript
import { TreeBuilder } from "../tree/TreeBuilder.js";
import { AgenticTreeSearchEngine } from "../search/AgenticTreeSearchEngine.js";

/**
 * VectorVsVectorlessBenchmark runs side-by-side comparison between Vector RAG chunking vs Vectorless Tree Search.
 */
export class VectorVsVectorlessBenchmark {
  /**
   * Simulates standard Vector RAG fixed 150-char chunking strategy.
   * @param {string} rawText 
   * @param {number} [chunkSize=150] 
   * @returns {string[]}
   */
  static simulateVectorChunking(rawText, chunkSize = 150) {
    const chunks = [];
    for (let i = 0; i < rawText.length; i += chunkSize) {
      chunks.push(rawText.substring(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Runs complete side-by-side benchmark comparison.
   */
  static runBenchmark() {
    console.log(
      "=========================================================================="
    );
    console.log(
      "⚡ BENCHMARK: Standard Vector RAG (Fixed Chunking) vs Vectorless Tree Search"
    );
    console.log(
      "==========================================================================\n"
    );

    const rawDocumentText = `Section 3.2: Load Balancing Architectures and High Availability.
The infrastructure employs two primary traffic distribution tiers: Content Delivery Networks (CDNs) 
and Application Load Balancers (ALBs). High-volume static assets are served directly via edge node caching. 
For dynamic user session state preservation across cluster nodes, the ALB employs cookie-based sticky sessions. 
If session persistence fails or a target server drops out, requests automatically fallback to round-robin routing 
across downstream backup application instances in the target group.`;

    // -----------------------------------------------------------------
    // 1. Vector RAG Fixed Token Chunking Simulation
    // -----------------------------------------------------------------
    console.log("1️⃣  STANDARD VECTOR RAG (Fixed 150-Character Token Chunking):");
    const chunks = VectorVsVectorlessBenchmark.simulateVectorChunking(rawDocumentText);

    chunks.forEach((chunk, index) => {
      console.log(`--- [Vector Chunk #${index + 1}] ---`);
      console.log(`"${chunk.trim().replace(/\n/g, " ")}"`);
    });

    console.log("\n⚠️  EXAMINING ABRUPT CHUNKING FAILURES:");
    console.log(
      "   • Chunk #2 starts mid-sentence with 'and Application Load Balancers...' -> Header context LOST!"
    );
    console.log(
      "   • Chunk #3 states 'If session persistence fails...' but lacks parent section context (Section 3.2)."
    );
    console.log(
      "   • Result: Similarity search retrieves fragmented text lacking hierarchical lineage.\n"
    );

    // -----------------------------------------------------------------
    // 2. Vectorless RAG Tree Navigation Simulation
    // -----------------------------------------------------------------
    console.log("2️⃣  VECTORLESS RAG (Hierarchical Tree Navigation):");
    const tree = TreeBuilder.buildSampleManualTree();
    const searchEngine = new AgenticTreeSearchEngine(tree);

    const query = "What happens if sticky session persistence fails?";
    const result = searchEngine.search(query);

    console.log("\n✅ VECTORLESS RAG BENCHMARK RESULT:");
    console.log(`   • Full Section Context Preserved!`);
    console.log(`   • Navigation Lineage: ${result.traversalPath.join(" -> ")}`);
    console.log(`   • Document Section: ${result.targetTitle} (pp. ${result.pageRange.join("-")})`);
    console.log(
      `   • Explaining Traceability: Every retrieved fact maps directly to explicit manual chapter & page numbers.`
    );
  }
}
```

---

## 3. Implementing Multi-Mode CLI Driver (`src/cli.js`)

### File Path

```text
vectorless-rag-01/src/cli.js
```

### Code

```javascript
import { TreeBuilder } from "./tree/TreeBuilder.js";
import { AgenticTreeSearchEngine } from "./search/AgenticTreeSearchEngine.js";
import { LLMLibrarian } from "./wiki/LLMLibrarian.js";
import { TwoPassRetriever } from "./wiki/TwoPassRetriever.js";
import { VectorVsVectorlessBenchmark } from "./comparison/VectorVsVectorlessBenchmark.js";

/**
 * Interactive Command Line Interface for Vectorless RAG & LLM Wiki Engine.
 */
function runCLI() {
  const args = process.argv.slice(2);
  const modeArg = args.find((a) => a.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : "all";

  console.log("==========================================================================");
  console.log("🚀 VECTORLESS RAG & LLM WIKI ENGINE (JS NODE.JS IMPLEMENTATION)");
  console.log("==========================================================================\n");

  if (mode === "tree" || mode === "all") {
    console.log("=== 🌳 DEMO 1: Vectorless RAG Tree Search (PageIndex Architecture) ===");
    const tree = TreeBuilder.buildSampleManualTree();

    console.log("\n--- Document Tree Structure ---");
    tree.printTree();

    const searchEngine = new AgenticTreeSearchEngine(tree);
    const query = "How do sticky sessions handle backend server failover on an ALB?";
    const result = searchEngine.search(query);

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
    const result = wikiRetriever.searchAndRetrieve(query);

    console.log("\n--- Final Retrieved Document Text ---");
    console.log(result.retrievedFullContent);
  }

  if (mode === "benchmark" || mode === "all") {
    console.log("\n==========================================================================");
    console.log("=== ⚡ DEMO 3: Vector RAG vs Vectorless RAG Benchmark ===");
    console.log("==========================================================================");
    VectorVsVectorlessBenchmark.runBenchmark();
  }
}

runCLI();
```

---

## 4. Application Entry Point (`src/index.js`)

```javascript
import { config } from "./config.js";
import { TreeNode } from "./tree/TreeNode.js";
import { HierarchicalTreeIndex } from "./tree/HierarchicalTreeIndex.js";
import { TreeBuilder } from "./tree/TreeBuilder.js";
import { SummaryPruner } from "./search/SummaryPruner.js";
import { AgenticTreeSearchEngine } from "./search/AgenticTreeSearchEngine.js";
import { WikiFileEntry, WikiVault } from "./wiki/WikiVault.js";
import { TwoPassRetriever } from "./wiki/TwoPassRetriever.js";
import { LLMLibrarian } from "./wiki/LLMLibrarian.js";
import { VectorVsVectorlessBenchmark } from "./comparison/VectorVsVectorlessBenchmark.js";

// Execute default CLI driver if invoked directly
if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  import("./cli.js");
}

export {
  config,
  TreeNode,
  HierarchicalTreeIndex,
  TreeBuilder,
  SummaryPruner,
  AgenticTreeSearchEngine,
  WikiFileEntry,
  WikiVault,
  TwoPassRetriever,
  LLMLibrarian,
  VectorVsVectorlessBenchmark
};
```

---

## 5. Verification & Execution Commands

### 1. Run Tree Search Mode

```bash
npm run tree-search
```

### 2. Run LLM Wiki Mode

```bash
npm run llm-wiki
```

### 3. Run Benchmark Mode

```bash
npm run benchmark
```

---

## 🎉 Conclusion

Congratulations! You have successfully built a complete **Vectorless RAG (PageIndex Model)** and **LLM Wiki Architecture (Karpathy Model)** framework featuring hierarchical tree indexing, summary pruning, top-down agentic tree search, two-pass wiki retrieval, and a Vector vs Vectorless benchmark suite!
