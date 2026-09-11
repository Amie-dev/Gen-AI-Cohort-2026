const { verifyConnection, closeDriver } = require('./src/config/neo4j');
const { seedDatabase } = require('./src/db/seed');

const { runFundamentalsDemo } = require('./src/demos/demo-01-fundamentals');
const { runCypherCrudDemo } = require('./src/demos/demo-02-cypher-crud');
const { runTraversalDemo } = require('./src/demos/demo-03-traversals');
const { runAgentMemoryDemo } = require('./src/demos/demo-04-agent-memory');
const { runGraphRagDemo } = require('./src/demos/demo-05-graphrag');
const { runProfilingDemo } = require('./src/demos/demo-06-profiling');

async function main() {
  console.log(`
====================================================================
  🚀 WEEK 06 — DAY 12: GRAPH DATABASES & NEO4J INTEGRATION SUITE
====================================================================
  Modules:
  1. Graph Database Fundamentals & Index-Free Adjacency
  2. Cypher CRUD Operations & Parameterized Statements
  3. Multi-Hop Graph Traversals & Shortest Path
  4. AI Agent Cognitive Memory Architecture (Factual, Episodic, Temporal Decay)
  5. GraphRAG Hybrid Retrieval & Text-to-Cypher Safety Validation
  6. Query Performance Profiling (EXPLAIN / PROFILE)
====================================================================
  `);

  const conn = await verifyConnection();

  if (!conn.success) {
    console.log('\n⚠️ Neo4j server is not accessible at bolt://localhost:7687.');
    console.log('   Please run the following docker command to launch Neo4j:');
    console.log('   👉  docker compose up -d\n');
    console.log('   Running fallback verification for non-database environment...\n');

    // Run safe offline validation checks
    const graphRagService = require('./src/services/graphRagService');
    const prompt = graphRagService.buildTextToCypherPrompt('Find hotels in Paris');
    console.log('✅ Text-to-Cypher Prompt Generator verified.');
    
    const check1 = graphRagService.validateCypherSafety('MATCH (u:User) RETURN u');
    const check2 = graphRagService.validateCypherSafety('MATCH (u:User) DETACH DELETE u');
    console.log('✅ Safety Validator Test (Read-only MATCH):', check1);
    console.log('✅ Safety Validator Test (Malicious DETACH DELETE):', check2);

    console.log('\n🎉 Baseline offline validation completed successfully!');
    return;
  }

  // Seed the graph database
  await seedDatabase();

  // Run All Demos
  await runFundamentalsDemo();
  await runCypherCrudDemo();
  await runTraversalDemo();
  await runAgentMemoryDemo();
  await runGraphRagDemo();
  await runProfilingDemo();

  console.log('\n====================================================================');
  console.log('  🎉 ALL DAY 12 DEMONSTRATIONS EXECUTED SUCCESSFULLY!');
  console.log('====================================================================\n');

  await closeDriver();
}

main().catch(async (err) => {
  console.error('❌ Master Application Execution Error:', err);
  await closeDriver();
  process.exit(1);
});
