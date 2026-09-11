const { executeQuery } = require('../config/neo4j');

/**
 * Initialize database constraints and indexes for optimal performance and data integrity.
 */
async function setupConstraintsAndIndexes() {
  console.log('\n⚙️ Setting up Neo4j Constraints and Indexes...');

  const schemaStatements = [
    // 1. Uniqueness Constraints
    {
      name: 'user_id_unique',
      cypher: `CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE`,
      type: 'Constraint',
    },
    {
      name: 'hotel_id_unique',
      cypher: `CREATE CONSTRAINT hotel_id_unique IF NOT EXISTS FOR (h:Hotel) REQUIRE h.id IS UNIQUE`,
      type: 'Constraint',
    },
    {
      name: 'company_id_unique',
      cypher: `CREATE CONSTRAINT company_id_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE`,
      type: 'Constraint',
    },
    {
      name: 'memory_id_unique',
      cypher: `CREATE CONSTRAINT memory_id_unique IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE`,
      type: 'Constraint',
    },
    {
      name: 'document_id_unique',
      cypher: `CREATE CONSTRAINT document_id_unique IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE`,
      type: 'Constraint',
    },

    // 2. Property Indexes
    {
      name: 'user_name_idx',
      cypher: `CREATE INDEX user_name_idx IF NOT EXISTS FOR (u:User) ON (u.name)`,
      type: 'Single Index',
    },
    {
      name: 'hotel_name_idx',
      cypher: `CREATE INDEX hotel_name_idx IF NOT EXISTS FOR (h:Hotel) ON (h.businessName)`,
      type: 'Single Index',
    },
    {
      name: 'memory_timestamp_idx',
      cypher: `CREATE INDEX memory_timestamp_idx IF NOT EXISTS FOR (m:Memory) ON (m.createdAt)`,
      type: 'Single Index',
    },

    // 3. Composite Index
    {
      name: 'hotel_city_rating_idx',
      cypher: `CREATE INDEX hotel_city_rating_idx IF NOT EXISTS FOR (h:Hotel) ON (h.city, h.rating)`,
      type: 'Composite Index',
    },

    // 4. Vector Index for GraphRAG
    {
      name: 'document_embeddings_idx',
      cypher: `
        CREATE VECTOR INDEX document_embeddings IF NOT EXISTS
        FOR (d:Document) ON (d.embedding)
        OPTIONS {
          indexConfig: {
            \`vector.similarity_function\`: 'cosine',
            \`vector.dimensions\`: 1536
          }
        }
      `,
      type: 'Vector Index',
    },
  ];

  for (const stmt of schemaStatements) {
    try {
      await executeQuery(stmt.cypher);
      console.log(`   ✅ Created ${stmt.type}: [${stmt.name}]`);
    } catch (err) {
      console.warn(`   ⚠️ ${stmt.name} notice: ${err.message}`);
    }
  }

  console.log('✅ All constraints and indexes initialized.\n');
}

module.exports = {
  setupConstraintsAndIndexes,
};
