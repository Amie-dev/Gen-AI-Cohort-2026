const { executeQuery } = require('../config/neo4j');
const { setupConstraintsAndIndexes } = require('./constraintsAndIndexes');

/**
 * Seed sample Graph Database for Day 12 demonstration
 */
async function seedDatabase() {
  console.log('\n🌱 Seeding Neo4j Database with Sample Knowledge Graph...');

  // Setup Constraints & Indexes first
  await setupConstraintsAndIndexes();

  // Clear existing nodes and relationships cleanly
  try {
    await executeQuery(`MATCH (n) DETACH DELETE n`);
    console.log('   🧹 Cleared previous graph data.');
  } catch (e) {
    console.warn('   ⚠️ Clear step warning:', e.message);
  }

  // Create Users, Companies, Cities, Hotels, Documents, Topics, and Cognitive Memory Nodes
  const seedCypher = `
    // 1. Create Users
    MERGE (u1:User {id: 'usr_alice', name: 'Alice', age: 30, role: 'AI Architect'})
    MERGE (u2:User {id: 'usr_bob', name: 'Bob', age: 35, role: 'Data Engineer'})
    MERGE (u3:User {id: 'usr_charlie', name: 'Charlie', age: 28, role: 'Software Engineer'})
    MERGE (u4:User {id: 'usr_david', name: 'David', age: 42, role: 'Product Lead'})
    MERGE (u5:User {id: 'usr_jane', name: 'Jane', age: 29, role: 'Graph Researcher'})

    // 2. Create Cities & Countries
    MERGE (city1:City {id: 'cty_paris', name: 'Paris', country: 'France'})
    MERGE (city2:City {id: 'cty_tokyo', name: 'Tokyo', country: 'Japan'})
    MERGE (city3:City {id: 'cty_nyc', name: 'New York', country: 'USA'})

    // 3. Create Hotels
    MERGE (h1:Hotel {id: 'htl_grand_plaza', businessName: 'Grand Plaza', city: 'Paris', rating: 4.9, luxuryLevel: 5})
    MERGE (h2:Hotel {id: 'htl_tokyo_tower', businessName: 'Tokyo Tower Inn', city: 'Tokyo', rating: 4.7, luxuryLevel: 4})
    MERGE (h3:Hotel {id: 'htl_nyc_suites', businessName: 'NYC Central Suites', city: 'New York', rating: 4.5, luxuryLevel: 4})

    // 4. Create Companies
    MERGE (c1:Company {id: 'cmp_techcorp', name: 'TechCorp', industry: 'Software'})
    MERGE (c2:Company {id: 'cmp_ailab', name: 'AI Research Lab', industry: 'Artificial Intelligence'})

    // 5. Create Topics & Categories
    MERGE (t1:Topic {id: 'tpc_graphrag', name: 'GraphRAG', description: 'Graph Augmented Retrieval'})
    MERGE (t2:Topic {id: 'tpc_vectors', name: 'Vector Search', description: 'Semantic Similarity Search'})
    MERGE (t3:Topic {id: 'tpc_neo4j', name: 'Neo4j', description: 'Native Graph Database Engine'})

    // 6. Create Documents
    MERGE (d1:Document {id: 'doc_01', title: 'Deep Dive into GraphRAG Architecture', content: 'GraphRAG combines vector search with explicit graph traversals for richer LLM context.', category: 'AI Architecture'})
    MERGE (d2:Document {id: 'doc_02', title: 'Cypher Query Performance Optimization', content: 'Use EXPLAIN and PROFILE to inspect query execution plans and database hits.', category: 'Database Performance'})
    MERGE (d3:Document {id: 'doc_03', title: 'Cognitive Memory for Autonomous AI Agents', content: 'Episodic and factual memory networks allow agents to retain temporal context.', category: 'Cognitive Science'})

    // 7. Create Cognitive Agent Memory Nodes (Factual & Episodic)
    MERGE (m1:Memory:FactualMemory {
      id: 'mem_fact_01',
      fact: 'Alice prefers quiet hotels with high ratings in Paris',
      confidence: 0.98,
      createdAt: datetime('2026-09-01T10:00:00Z')
    })
    MERGE (m2:Memory:EpisodicMemory {
      id: 'mem_ep_01',
      interaction: 'Alice inquired about luxury hotels in Paris during session #102',
      sessionID: 'sess_102',
      createdAt: datetime('2026-09-10T14:30:00Z'),
      decayFactor: 0.85
    })
    MERGE (m3:Memory:EpisodicMemory {
      id: 'mem_ep_02',
      interaction: 'Alice collaborated with Bob on the GraphRAG indexing pipeline',
      sessionID: 'sess_105',
      createdAt: datetime('2026-09-11T09:15:00Z'),
      decayFactor: 0.95
    })

    // 8. Create Relationships
    // User Connections
    MERGE (u1)-[:KNOWS {since: 2022, closeness: 0.9}]->(u2)
    MERGE (u2)-[:KNOWS {since: 2023, closeness: 0.8}]->(u3)
    MERGE (u3)-[:KNOWS {since: 2024, closeness: 0.75}]->(u4)
    MERGE (u1)-[:KNOWS {since: 2021, closeness: 0.95}]->(u5)

    // User - Hotel Likes
    MERGE (u1)-[:LIKES {rating: 5, since: 2024}]->(h1)
    MERGE (u2)-[:LIKES {rating: 4, since: 2025}]->(h2)
    MERGE (u3)-[:LIKES {rating: 5, since: 2023}]->(h3)

    // Hotel Locations
    MERGE (h1)-[:LOCATED_IN]->(city1)
    MERGE (h2)-[:LOCATED_IN]->(city2)
    MERGE (h3)-[:LOCATED_IN]->(city3)

    // User Employment
    MERGE (u1)-[:WORKS_AT {since: 2023, title: 'Lead Architect'}]->(c2)
    MERGE (u2)-[:WORKS_AT {since: 2021, title: 'Senior Engineer'}]->(c1)
    MERGE (u3)-[:WORKS_AT {since: 2024, title: 'Engineer'}]->(c1)
    MERGE (u5)-[:WORKS_AT {since: 2022, title: 'Research Scientist'}]->(c2)

    // Document - Topic links
    MERGE (d1)-[:HAS_TOPIC]->(t1)
    MERGE (d1)-[:HAS_TOPIC]->(t2)
    MERGE (d2)-[:HAS_TOPIC]->(t3)
    MERGE (d3)-[:HAS_TOPIC]->(t1)

    // Memory links
    MERGE (u1)-[:OBSERVED]->(m1)
    MERGE (u1)-[:PARTICIPATED_IN]->(m2)
    MERGE (u1)-[:PARTICIPATED_IN]->(m3)
    MERGE (u2)-[:PARTICIPATED_IN]->(m3)
    MERGE (m1)-[:ABOUT_HOTEL]->(h1)
    MERGE (m2)-[:MENTIONS]->(t1)
    MERGE (m3)-[:MENTIONS]->(t1)
  `;

  const result = await executeQuery(seedCypher);
  const counters = result.summary.counters.updates();

  console.log('   🎉 Graph Database Seed Completed!');
  console.log(`      Nodes Created: ${counters.nodesCreated}`);
  console.log(`      Relationships Created: ${counters.relationshipsCreated}`);
  console.log(`      Properties Set: ${counters.propertiesSet}\n`);

  return counters;
}

module.exports = {
  seedDatabase,
};
