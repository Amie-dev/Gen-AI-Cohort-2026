const { verifyConnection } = require('../config/neo4j');
const { seedDatabase } = require('../db/seed');

async function runFundamentalsDemo() {
  console.log('===============================================================');
  console.log('  🕸️ DEMO 01 — GRAPH DATABASE FUNDAMENTALS & INDEX-FREE ADJACENCY');
  console.log('===============================================================\n');

  // Verify connection
  const conn = await verifyConnection();
  if (!conn.success) {
    console.log('⚠️ Neo4j server is offline. Run `docker compose up -d` to start Neo4j.');
    return;
  }

  // Seed database
  await seedDatabase();

  console.log('\n💡 Graph Fundamentals Overview:');
  console.log('   - Nodes: Represent entities (User, Hotel, Company, Memory, Document)');
  console.log('   - Relationships: Connect nodes with direction (KNOWS, LIKES, LOCATED_IN)');
  console.log('   - Properties: Key-value attributes on nodes and edges (rating, since, age)');
  console.log('   - Index-Free Adjacency: Traversing adjacent edges directly without global table JOINs.');
  console.log('===============================================================\n');
}

module.exports = { runFundamentalsDemo };

if (require.main === module) {
  runFundamentalsDemo().then(() => process.exit(0));
}
