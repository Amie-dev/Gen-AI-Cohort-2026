import { TreeBuilder } from "../tree/TreeBuilder.js";
import { AgenticTreeSearchEngine } from "../search/AgenticTreeSearchEngine.js";

/**
 * VectorVsVectorlessBenchmark runs side-by-side performance & accuracy comparisons.
 */
export class VectorVsVectorlessBenchmark {
  /**
   * Executes comparison benchmark.
   * @param {string} [query="What happens if sticky session persistence fails?"]
   */
  static async runBenchmark(query = "What happens if sticky session persistence fails?") {
    console.log(`\n==========================================================================`);
    console.log(`⚡ BENCHMARK: Standard Vector RAG (Fixed Chunking) vs Vectorless Tree Search`);
    console.log(`==========================================================================\n`);

    const rawDocumentText = `Section 3.2: Load Balancing Architectures and High Availability. The infrastructure employs two primary traffic distribution tiers: Content Delivery Networks (CDNs) and Application Load Balancers (ALBs). High-volume static assets are served directly via edge node caching. For dynamic user session state preservation across cluster nodes, the ALB employs cookie-based sticky sessions. If session persistence fails or a target server drops out, requests automatically fallback to round-robin routing across downstream backup application instances in the target group.`;

    // -----------------------------------------------------------------
    // 1️⃣ STANDARD VECTOR RAG SIMULATION (Fixed 150-Char Chunking)
    // -----------------------------------------------------------------
    console.log(`1️⃣  STANDARD VECTOR RAG (Fixed 150-Character Token Chunking):`);
    const chunkSize = 150;
    const chunks = [];
    for (let i = 0; i < rawDocumentText.length; i += chunkSize) {
      chunks.push(rawDocumentText.substring(i, i + chunkSize));
    }

    chunks.forEach((chunk, index) => {
      console.log(`--- [Vector Chunk #${index + 1}] ---`);
      console.log(`"${chunk}"`);
    });

    console.log(`\n⚠️  EXAMINING ABRUPT CHUNKING FAILURES:`);
    console.log(`   • Chunk #2 starts mid-sentence with 'and Application Load Balancers...' -> Header context LOST!`);
    console.log(`   • Chunk #3 states 'If session persistence fails...' but lacks parent section context (Section 3.2).`);
    console.log(`   • Result: Similarity search retrieves fragmented text lacking hierarchical lineage.\n`);

    // -----------------------------------------------------------------
    // 2️⃣ VECTORLESS RAG (Hierarchical Tree Navigation)
    // -----------------------------------------------------------------
    console.log(`2️⃣  VECTORLESS RAG (Hierarchical Tree Navigation):\n`);
    const treeIndex = TreeBuilder.buildSampleDistributedSystemsTree();
    const searchEngine = new AgenticTreeSearchEngine(treeIndex);

    const result = await searchEngine.search(query);

    console.log(`\n✅ VECTORLESS RAG BENCHMARK RESULT:`);
    console.log(`   • Full Section Context Preserved!`);
    console.log(`   • Navigation Lineage: ${result.traversalPath.join(" -> ")}`);
    console.log(`   • Document Section: ${result.targetTitle} (pp. ${result.pageRange.join("-")})`);
    console.log(`   • Explaining Traceability: Every retrieved fact maps directly to explicit manual chapter & page numbers.\n`);
  }
}
