const graphTraversalService = require('../services/graphTraversalService');

async function runTraversalDemo() {
  console.log('===============================================================');
  console.log('  🔍 DEMO 03 — MULTI-HOP TRAVERSALS, SHORTEST PATH & BFS');
  console.log('===============================================================\n');

  try {
    // 1. Multi-Hop Traversal (*1..3)
    console.log('1️⃣ [Multi-Hop Traversal] Finding all users connected to "Alice" within 1 to 3 hops...');
    const reach = await graphTraversalService.findNetworkReach('Alice', 3);
    console.table(reach);

    // 2. Shortest Path
    console.log('\n2️⃣ [Shortest Path] Finding shortest graph path from "Alice" to "David"...');
    const path = await graphTraversalService.findShortestPath('Alice', 'David');
    if (path) {
      console.log(`   Hop Count: ${path.hopCount}`);
      console.log(`   Path Nodes: ${path.nodesInPath.join('  ➡️  ')}`);
      console.log(`   Relationships: [${path.relationshipTypes.join(', ')}]`);
    } else {
      console.log('   No path found between users.');
    }

    // 3. Knowledge Discovery
    console.log('\n3️⃣ [Cross-Entity Knowledge Traversal] User -> Memory -> Topic -> Document...');
    const knowledge = await graphTraversalService.discoverRelatedKnowledge('Alice');
    console.table(knowledge);

    // 4. Centrality Analysis
    console.log('\n4️⃣ [Graph Centrality] Top 5 Most Connected Graph Entities (Node Degree)...');
    const centrality = await graphTraversalService.getCentralityMetrics();
    console.table(centrality);

    // 5. BFS Simulation
    console.log('\n5️⃣ [BFS Simulation] Level-by-level Graph Traversal from "usr_alice"...');
    const bfsLog = await graphTraversalService.breadthFirstSearchSimulation('usr_alice', 2);
    console.table(bfsLog.slice(0, 8));
  } catch (error) {
    console.error('❌ Demo 03 Error:', error.message);
  }
  console.log('===============================================================\n');
}

module.exports = { runTraversalDemo };

if (require.main === module) {
  runTraversalDemo().then(() => process.exit(0));
}
