# 📖 Chapter 00 — Overview, Setup & Architecture Foundations

## 1. Architectural Overview & Graph Database Paradigms

Traditional relational databases (RDBMS) model domains as tables containing rows and columns, expressing relationships through foreign keys and expensive multi-table `JOIN` operations. Document databases (NoSQL) store entities as nested JSON documents, embedding child structures or duplicating data across document collections.

While RDBMS and NoSQL systems excel at structured row processing and key-value document lookups, they struggle when handling **highly connected data**, multi-hop network traversals, or dynamic cognitive knowledge graphs for Autonomous AI Agents.

```text
Relational Model (RDBMS):
[User Table] --(Foreign Key)---> [User_Hotel Junction] <---(Foreign Key)-- [Hotel Table]
* Traversal requires multi-table JOINs scanning global indexes (O(log N) per JOIN step).

Document Model (NoSQL):
{ "user": "Alice", "likedHotels": [{ "name": "Grand Plaza", "city": "Paris" }] }
* Data is embedded or duplicated; queries across shared relationships suffer from redundancy and update anomalies.

Native Property Graph Model (Neo4j):
(:User {name: "Alice"}) ──[:LIKES {rating: 5}]──> (:Hotel {businessName: "Grand Plaza"})
* Traversal uses Index-Free Adjacency (direct physical memory pointers) operating in O(1) time per step.
```

In this implementation guide, we explore how to build a **Cognitive AI Agent Memory System** and **GraphRAG Retrieval Engine** using **Neo4j 5+** and **Node.js**.

---

## 2. Environment Prerequisites & Setup

### Docker Container Configuration

The codebase utilizes Docker Compose to instantiate a isolated Neo4j Community Edition container.

File path: [`docker-compose.yml`](../docker-compose.yml)

```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:5.18.0-community
    container_name: neo4j-day12
    ports:
      - "7474:7474" # HTTP Browser / Cypher Workbench UI
      - "7687:7687" # Bolt Protocol Binary Connection
    environment:
      - NEO4J_AUTH=neo4j/password123
      - NEO4J_PLUGINS=["apoc"]
      - NEO4J_dbms_security_procedures_unrestricted=apoc.*
    volumes:
      - neo4j_data:/data
    restart: unless-stopped

volumes:
  neo4j_data:
```

### Environment Credentials Configuration

File path: [`.env`](../.env) / [`.env.example`](../.env.example)

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123
NEO4J_DATABASE=neo4j
```

---

## 3. Database Schema Initialization & Seeding Workflow

Before querying the graph, uniqueness constraints, performance indexes, and initial knowledge entities must be instantiated.

### 1. Constraints & Indexes Setup

File path: [`src/db/constraintsAndIndexes.js`](../src/db/constraintsAndIndexes.js)

```javascript
const { executeQuery } = require('../config/neo4j');

async function setupConstraintsAndIndexes() {
  console.log('\n⚙️ Setting up Neo4j Constraints and Indexes...');

  const schemaStatements = [
    // 1. Uniqueness Constraints
    { name: 'user_id_unique', cypher: `CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE`, type: 'Constraint' },
    { name: 'hotel_id_unique', cypher: `CREATE CONSTRAINT hotel_id_unique IF NOT EXISTS FOR (h:Hotel) REQUIRE h.id IS UNIQUE`, type: 'Constraint' },
    { name: 'memory_id_unique', cypher: `CREATE CONSTRAINT memory_id_unique IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE`, type: 'Constraint' },
    { name: 'document_id_unique', cypher: `CREATE CONSTRAINT document_id_unique IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE`, type: 'Constraint' },

    // 2. Single & Composite Indexes
    { name: 'user_name_idx', cypher: `CREATE INDEX user_name_idx IF NOT EXISTS FOR (u:User) ON (u.name)`, type: 'Single Index' },
    { name: 'hotel_city_rating_idx', cypher: `CREATE INDEX hotel_city_rating_idx IF NOT EXISTS FOR (h:Hotel) ON (h.city, h.rating)`, type: 'Composite Index' },

    // 3. Vector Index for Embeddings (GraphRAG)
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
    await executeQuery(stmt.cypher);
  }
}
```

### 2. Knowledge Graph Seeding Script

File path: [`src/db/seed.js`](../src/db/seed.js)

The seed script creates initial node entities (`User`, `Hotel`, `City`, `Company`, `Topic`, `Document`, `Memory`) and relationships (`KNOWS`, `LIKES`, `WORKS_AT`, `PARTICIPATED_IN`, `OBSERVED`, `HAS_TOPIC`, `MENTIONS`) using idempotent `MERGE` patterns.

```javascript
const { executeQuery } = require('../config/neo4j');
const { setupConstraintsAndIndexes } = require('./constraintsAndIndexes');

async function seedDatabase() {
  await setupConstraintsAndIndexes();

  // Clear previous graph data
  await executeQuery(`MATCH (n) DETACH DELETE n`);

  const seedCypher = `
    // 1. Create Users
    MERGE (u1:User {id: 'usr_alice', name: 'Alice', age: 30, role: 'AI Architect'})
    MERGE (u2:User {id: 'usr_bob', name: 'Bob', age: 35, role: 'Data Engineer'})

    // 2. Create Hotels & Cities
    MERGE (city1:City {id: 'cty_paris', name: 'Paris', country: 'France'})
    MERGE (h1:Hotel {id: 'htl_grand_plaza', businessName: 'Grand Plaza', city: 'Paris', rating: 4.9, luxuryLevel: 5})

    // 3. Create Cognitive Agent Memories
    MERGE (m1:Memory:FactualMemory {
      id: 'mem_fact_01',
      fact: 'Alice prefers quiet hotels with high ratings in Paris',
      confidence: 0.98,
      createdAt: datetime('2026-09-01T10:00:00Z')
    })

    // 4. Connect Relationships
    MERGE (u1)-[:KNOWS {since: 2022, closeness: 0.9}]->(u2)
    MERGE (u1)-[:LIKES {rating: 5, since: 2024}]->(h1)
    MERGE (h1)-[:LOCATED_IN]->(city1)
    MERGE (u1)-[:OBSERVED]->(m1)
    MERGE (m1)-[:ABOUT_HOTEL]->(h1)
  `;

  const result = await executeQuery(seedCypher);
  return result.summary.counters.updates();
}
```

---

## 4. Verification & Execution

To initialize and populate your database:

```bash
# Start Docker Container
docker compose up -d

# Execute Seed Script via NPM script
npm run seed
```

Proceed to [Chapter 01 — Property Graph Model & Index-Free Adjacency](chapter-01-graph-fundamentals.md) to explore node/edge structures and memory pointer mechanics.
