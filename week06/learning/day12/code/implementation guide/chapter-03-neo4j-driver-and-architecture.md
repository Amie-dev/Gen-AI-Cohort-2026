# 📖 Chapter 03 — Neo4j Driver Architecture, Transactions & Graph Algorithms

## 1. Neo4j Node.js Driver Architecture & Lifecycle

The official **`neo4j-driver`** NPM package manages binary communication with Neo4j database instances over the **Bolt protocol** (`bolt://` or `neo4j://`).

```text
┌────────────────────────────────────────────────────────┐
│               Driver Singleton Instance                │
│ (URI: bolt://localhost:7687, Pool: maxConnectionPool: 50)│
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
  ┌───────────────────┐           ┌───────────────────┐
  │   Session Pool    │           │   Session Pool    │
  │ (Auto-managed)    │           │ (Explicit Session)│
  └─────────┬─────────┘           └─────────┬─────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ driver.executeQuery() │       │ session.executeWrite()│
│ (One-shot queries)    │       │ (ACID Transactions)   │
└───────────────────────┘       └───────────────────────┘
```

### Key Driver Lifecycle Rules:
1. **Singleton Pattern**: Instantiated once during application startup and shared globally. A single driver manages a connection pool of reusable sockets.
2. **Session Allocation**: Lightweight wrappers for query state. Sessions should be created when initiating operations and explicitly closed immediately after completion to return connections to the pool.
3. **Automatic Draining**: On process shutdown, `driver.close()` drains pending connections cleanly.

---

## 2. Singleton Driver Implementation

File path: [`src/config/neo4j.js`](../src/config/neo4j.js)

```javascript
const neo4j = require('neo4j-driver');
require('dotenv').config();

const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'password123';
const DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

let driverInstance = null;

function getDriver() {
  if (!driverInstance) {
    driverInstance = neo4j.driver(
      URI,
      neo4j.auth.basic(USER, PASSWORD),
      {
        maxConnectionPoolSize: 50,
        connectionTimeout: 5000,
        maxTransactionRetryTime: 15000,
      }
    );
  }
  return driverInstance;
}

// Convenient helper for auto-session managed parameterized queries
async function executeQuery(cypher, params = {}, config = {}) {
  const driver = getDriver();
  try {
    const dbConfig = { database: DATABASE, ...config };
    return await driver.executeQuery(cypher, params, dbConfig);
  } catch (error) {
    console.error(`❌ [Neo4j Query Error]: ${error.message}`);
    throw error;
  }
}

async function closeDriver() {
  if (driverInstance) {
    await driverInstance.close();
    driverInstance = null;
  }
}

module.exports = { getDriver, executeQuery, closeDriver, DATABASE };
```

---

## 3. Schema Indexes & Vector Indexing

File path: [`src/db/constraintsAndIndexes.js`](../src/db/constraintsAndIndexes.js)

Neo4j supports multiple index types to optimize graph entry-point lookups and semantic vector queries:

```cypher
// 1. Uniqueness Constraint
CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE

// 2. Single Property Index
CREATE INDEX user_name_idx IF NOT EXISTS FOR (u:User) ON (u.name)

// 3. Composite Property Index
CREATE INDEX hotel_city_rating_idx IF NOT EXISTS FOR (h:Hotel) ON (h.city, h.rating)

// 4. Vector Similarity Index (1536 dimensions for OpenAI Embeddings)
CREATE VECTOR INDEX document_embeddings IF NOT EXISTS
FOR (d:Document) ON (d.embedding)
OPTIONS {
  indexConfig: {
    `vector.similarity_function`: 'cosine',
    `vector.dimensions`: 1536
  }
}
```

---

## 4. Advanced Graph Traversals & Algorithms

File path: [`src/services/graphTraversalService.js`](../src/services/graphTraversalService.js)

The `GraphTraversalService` provides production implementations of multi-hop path reach, shortest path discovery, centrality metrics, and programmatic Breadth-First Search (BFS).

### 1. Multi-Hop Traversal (`[:KNOWS*1..3]`)
Finds friends of friends up to 3 hops away, returning the physical node path traversal sequence:

```javascript
async function findNetworkReach(startUserName, maxHops = 3) {
  const cypher = `
    MATCH path = (start:User {name: $startUserName})-[:KNOWS*1..${maxHops}]-(reached:User)
    WHERE start <> reached
    RETURN
      reached.name AS reachedUser,
      reached.role AS role,
      length(path) AS distance,
      [node IN nodes(path) | node.name] AS traversalPath
    ORDER BY distance ASC, reachedUser ASC
  `;
  const result = await executeQuery(cypher, { startUserName });
  return result.records.map(rec => rec.toObject());
}
```

### 2. Shortest Path Discovery (`shortestPath`)
Uses Cypher's native `shortestPath()` algorithm to find the minimum relationship path between distant entities:

```javascript
async function findShortestPath(user1Name, user2Name) {
  const cypher = `
    MATCH (u1:User {name: $user1Name}), (u2:User {name: $user2Name})
    MATCH p = shortestPath((u1)-[*]-(u2))
    RETURN
      length(p) AS hopCount,
      [n IN nodes(p) | labels(n)[0] + ': ' + coalesce(n.name, n.businessName, n.title, n.id)] AS nodesInPath,
      [r IN relationships(p) | type(r)] AS relationshipTypes
  `;
  const result = await executeQuery(cypher, { user1Name, user2Name });
  return result.records[0]?.toObject();
}
```

### 3. Programmatic Breadth-First Search (BFS) Simulation
Simulates a step-by-step queue-based BFS traversal in Node.js, dereferencing 1-hop index-free adjacency pointers per step:

```javascript
async function breadthFirstSearchSimulation(startNodeId, maxDepth = 2) {
  const visited = new Set();
  const queue = [{ id: startNodeId, depth: 0 }];
  const traversalLog = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.id) || current.depth > maxDepth) continue;
    visited.add(current.id);

    const cypher = `
      MATCH (curr {id: $id})-[r]-(neighbor)
      RETURN
        coalesce(curr.name, curr.businessName, curr.id) AS currName,
        type(r) AS relType,
        neighbor.id AS neighborId,
        coalesce(neighbor.name, neighbor.businessName, neighbor.title, neighbor.id) AS neighborName,
        labels(neighbor)[0] AS neighborLabel
    `;

    const res = await executeQuery(cypher, { id: current.id });
    for (const rec of res.records) {
      const neighborId = rec.get('neighborId');
      traversalLog.push({
        from: rec.get('currName'),
        rel: rec.get('relType'),
        to: rec.get('neighborName'),
        depth: current.depth + 1
      });

      if (neighborId && !visited.has(neighborId) && current.depth + 1 <= maxDepth) {
        queue.push({ id: neighborId, depth: current.depth + 1 });
      }
    }
  }

  return traversalLog;
}
```

---

## 5. Execution Demo

File path: [`src/demos/demo-03-traversals.js`](../src/demos/demo-03-traversals.js)

Run the Graph Traversal demonstration:
```bash
npm run demo:traversals
```

Proceed to [Chapter 04 — Cognitive AI Agent Memory System](chapter-04-cognitive-memory-system.md) to explore factual/episodic memory networks and decay algorithms.
