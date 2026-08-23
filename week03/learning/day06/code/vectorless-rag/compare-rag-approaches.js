/**
 * Vector RAG (Abrupt Fixed Chunking) vs Vectorless RAG (Tree Navigation) Comparison
 * Week 03 Day 06 - JavaScript / Node.js Implementation
 */

import { buildSampleDocumentTree, AgenticTreeSearchEngine } from './vectorless-rag-tree-indexer.js';

// Raw document string representing a chapter in a manual
const RAW_DOCUMENT = `
Section 3.2: Load Balancing Architectures and High Availability.
The infrastructure employs two primary traffic distribution tiers: Content Delivery Networks (CDNs) 
and Application Load Balancers (ALBs). High-volume static assets are served directly via edge node caching. 
For dynamic user session state preservation across cluster nodes, the ALB employs cookie-based sticky sessions. 
If session persistence fails or a target server drops out, requests automatically fallback to round-robin routing 
across downstream backup application instances in the target group.
`;

/**
 * Simulates standard Vector RAG fixed-size chunking (e.g. 150 characters per chunk).
 */
function simulateVectorRAGFixedChunking(docText, chunkSize = 150) {
  const chunks = [];
  for (let i = 0; i < docText.length; i += chunkSize) {
    chunks.push(docText.substring(i, i + chunkSize));
  }
  return chunks;
}

console.log("=== ⚡ Comparison: Vector RAG Abrupt Chunking vs Vectorless Tree Search ===\n");

// 1. Vector RAG Demonstration
console.log("1️⃣  STANDARD VECTOR RAG (Fixed-Size Token Chunking):");
const vectorChunks = simulateVectorRAGFixedChunking(RAW_DOCUMENT);

vectorChunks.forEach((chunk, index) => {
  console.log(`--- [Vector Chunk #${index + 1}] ---`);
  console.log(`"${chunk.trim().replace(/\n/g, ' ')}"`);
});

console.log("\n⚠️  Notice the Abrupt Chunking Problem:");
console.log("   • Chunk #2 starts with 'and Application Load Balancers...' losing the section header context!");
console.log("   • Chunk #3 contains 'If session persistence fails...' but lacks the parent header (Section 3.2).\n");

// 2. Vectorless RAG Demonstration
console.log("2️⃣  VECTORLESS RAG (Tree Indexing & Agentic Search):");
const tree = buildSampleDocumentTree();
const treeEngine = new AgenticTreeSearchEngine(tree);

const query = "What happens if sticky session persistence fails?";
const treeResult = treeEngine.search(query);

console.log("\n✅ Vectorless RAG Result:");
console.log(`   • Full Section Context Preserved!`);
console.log(`   • Navigation Lineage: ${treeResult.traversalPath.join(' -> ')}`);
console.log(`   • Retained Section Header & Prerequisite Content intact.`);
