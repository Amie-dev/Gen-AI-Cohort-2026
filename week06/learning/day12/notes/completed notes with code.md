

# 📚 Week 06 — Day 12 Complete Master Notes with Code

# 🕸️ Graph Databases, Cypher & Neo4j Integration with Node.js

> **Goal:** Master graph databases, understand index-free adjacency and graph-based memory, write Cypher queries, deploy Neo4j with Docker/Aura, integrate Neo4j with Node.js, and understand GraphRAG and AI-agent memory architectures.

---

# 📑 Table of Contents

1. Graph Database Fundamentals
2. Index-Free Adjacency
3. Cognitive & AI Agent Memory
4. SQL vs NoSQL vs Graph Databases
5. Cypher Query Language
6. Cypher CRUD & Traversals
7. Neo4j Architecture & Deployment
8. Text-to-Cypher & LLM Integration
9. Node.js + `neo4j-driver`
10. Parameterized Queries & Cypher Injection
11. Advanced Graph Modeling
12. BFS/DFS & Path Traversal Concepts
13. Vector Search & GraphRAG
14. Indexing & Query Profiling
15. Complete Node.js Application
16. Master Interview Questions
17. Final Mental Model

---

# 1. 🕸️ Graph Database Fundamentals

A **Graph Database** is a database designed to represent and query entities and the relationships between them.

Neo4j uses the **Property Graph Model**.

A property graph contains:

```text
Nodes
Relationships
Properties
Labels
```

Example:

```text
(:User {name: "Alice", age: 30})
        │
        │ LIKES
        ▼
(:Hotel {
    businessName: "Grand Plaza",
    rating: 4.8
})
```

Another relationship:

```text
(:User {name: "Alice"})
        │
        │ KNOWS
        ▼
(:User {name: "Jane"})
```

---

## 🔵 Nodes

Nodes represent entities.

Examples:

```text
User
Hotel
Company
Product
Document
Topic
City
```

Example:

```cypher
CREATE (u:User {
  name: "Alice",
  age: 30
});
```

---

## 🔗 Relationships

Relationships represent connections between nodes.

```cypher
CREATE (u)-[:LIKES]->(h);
```

Relationships can also contain properties:

```cypher
CREATE (u)-[
  :LIKES {
    since: 2024,
    rating: 5
  }
]->(h);
```

---

## 🏷️ Labels

Labels categorize nodes.

```cypher
(u:User)
(h:Hotel)
(c:Company)
```

A node can have multiple labels:

```cypher
CREATE (u:User:PremiumUser {
  name: "Alice"
});
```

---

## 🧩 Properties

Properties are key-value attributes.

```text
User
 ├── name
 ├── email
 ├── age
 └── createdAt
```

Relationships can also have properties.

```text
Alice
  │
  │ LIKES {
  │   since: 2024
  │   rating: 5
  │ }
  ▼
Hotel
```

---

# 2. ⚡ Index-Free Adjacency

**Index-free adjacency** is an important concept in native graph databases.

The basic idea is:

> Once the database has located a starting node, following an existing relationship to a neighboring node can be performed through the graph's native adjacency structures rather than repeatedly performing global searches or joins.

Conceptually:

```text
Find Alice
   │
   ▼
Alice
   │
   ├── KNOWS ──> Bob
   │
   └── KNOWS ──> Charlie
```

After reaching Alice, the database can follow her relationships directly.

---

## ⚠️ Important Correction

Don't memorize:

> "Every relationship traversal is O(1), therefore every graph query is O(1)."

That's incorrect.

A single adjacency step can be very efficient, but the **overall query cost depends on**:

* Number of relationships traversed
* Number of starting nodes
* Filtering
* Path length
* Graph density
* Query plan
* Index usage
* Result size
* Data distribution

So a better statement is:

> **Native graph storage makes relationship traversal efficient, especially once suitable starting nodes have been located, but overall query complexity still depends on how much of the graph the query must explore.**

---

# 3. 🧠 Cognitive & AI Agent Memory

Traditional key-value storage might represent memory as:

```text
theme = "dark"
language = "English"
```

But many real-world facts are relational.

For example:

```text
Alice
  │
  │ LIVES_IN
  ▼
Paris
  │
  │ LOCATED_IN
  ▼
France
```

Another example:

```text
Alice
  │
  ├── WORKS_AT ──> Acme Corp
  │
  ├── HAS_SKILL ──> Python
  │
  └── PREFERS ──> Dark Mode
```

This makes graphs useful for representing **connected knowledge**.

---

# 4. 🤖 Memory Types in AI Agents

AI systems can use multiple memory mechanisms.

## 1. Key-Value Memory

Simple attributes:

```text
theme = dark
language = English
```

---

## 2. Factual / Semantic Memory

Represents facts:

```text
Alice → WORKS_AT → Acme
Alice → HAS_SKILL → Python
```

---

## 3. Episodic Memory

Represents events or previous interactions:

```text
Session #101
      │
      ├── DISCUSSED → Neo4j
      ├── DISCUSSED → GraphRAG
      └── TRIGGERED → Send Email
```

---

## 4. Temporal Memory

Represents when a fact or event was valid/observed.

```text
Alice
 │
 │ PREFERS
 ▼
Dark Mode

Valid from: 2026-05-10
Valid until: 2026-08-20
```

Then:

```text
Alice
 │
 │ PREFERS
 ▼
Light Mode

Valid from: 2026-08-20
```

This allows the system to reason about changing information.

---

# 5. 🧠 Graph Memory Architecture

A practical AI memory architecture can look like:

```text
                 AI Agent
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Working      Graph       Vector
     Memory      Memory       Store
        │           │           │
        │           ▼           ▼
        │        Entities    Embeddings
        │        Relations
        │           │
        └───────────┼───────────┘
                    ▼
              Context Builder
                    │
                    ▼
                   LLM
```

### Simple distinction

```text
Graph → "What is connected?"

Vector → "What is semantically similar?"

Key-value → "What is this attribute?"

Episodic → "What happened?"

Temporal → "When was it true?"
```

---

# 6. ⚖️ SQL vs NoSQL vs Native Graph

| Feature        | SQL                           | Document NoSQL          | Graph DB                |
| -------------- | ----------------------------- | ----------------------- | ----------------------- |
| Main structure | Tables                        | Documents               | Nodes + relationships   |
| Relationships  | Foreign keys / joins          | References / embedding  | Native relationships    |
| Query language | SQL                           | Database-specific       | Cypher                  |
| Schema         | Usually strongly structured   | Flexible                | Flexible property graph |
| Deep traversal | Joins / recursive queries     | Often application logic | Native graph traversal  |
| Best for       | Structured transactional data | Document-oriented data  | Highly connected data   |

---

## ⚠️ Important SQL Correction

Don't say:

> "SQL multi-hop queries are exponentially slow."

That's too broad.

SQL databases can represent graphs using:

```text
Users
Relationships
Hotels
```

and use:

```text
JOIN
```

or:

```text
Recursive CTE
```

for graph-like queries.

The performance depends on:

* Number of rows
* Indexes
* Join strategy
* Data distribution
* Query shape
* Number of hops

The important difference is:

> **Graph databases make relationships a first-class part of the storage/query model, whereas relational databases typically reconstruct relationships through joins.**

---

# 7. ⚡ Cypher Query Language

Cypher is Neo4j's declarative graph query language.

The fundamental syntax is:

```text
(node)-[relationship]->(node)
```

Example:

```cypher
MATCH (u:User)-[:LIKES]->(h:Hotel)
RETURN u, h;
```

---

# 8. 🎯 Cypher Pattern Syntax

## Node

```cypher
(u)
```

## Node with label

```cypher
(u:User)
```

## Node with property

```cypher
(u:User {
  name: "Alice"
})
```

## Relationship

```cypher
-[r:LIKES]->
```

## Complete pattern

```cypher
(u:User)-[r:LIKES]->(h:Hotel)
```

Think:

```text
(u) ──[r]──> (h)
 │            │
User         Hotel
```

---

# 9. 🔍 MATCH + RETURN

Example:

```cypher
MATCH (u:User)-[:LIKES]->(h:Hotel)
RETURN u.name, h.businessName;
```

Meaning:

```text
Find:

User
  │
  │ LIKES
  ▼
Hotel

Return:
User name
Hotel name
```

---

# 10. 🔎 WHERE Filtering

```cypher
MATCH (u:User)-[:LIKES]->(h:Hotel)

WHERE u.age >= 25
  AND h.rating >= 4.5

RETURN
  u.name AS User,
  h.businessName AS Hotel;
```

---

# 11. ✨ MERGE

`MERGE` performs a **match-or-create** operation for the specified pattern.

Example:

```cypher
MERGE (u:User {
  email: "alice@example.com"
})

ON CREATE SET
  u.name = "Alice",
  u.createdAt = timestamp()

ON MATCH SET
  u.lastLogin = timestamp();
```

Conceptually:

```text
Does matching pattern exist?
          │
      ┌───┴───┐
     YES      NO
      │        │
     MATCH   CREATE
```

---

## ⚠️ MERGE ≠ Uniqueness Constraint

For important identity fields, use a constraint.

```cypher
CREATE CONSTRAINT user_email_unique
FOR (u:User)
REQUIRE u.email IS UNIQUE;
```

Think:

```text
MERGE
→ Match or create behavior

Constraint
→ Database-level uniqueness guarantee
```

---

# 12. ✏️ Updating Properties

```cypher
MATCH (u:User {
  name: "Alice"
})

SET u.age = 31;
```

Multiple properties:

```cypher
SET
  u.age = 31,
  u.status = "active";
```

---

# 13. 🏷️ Adding Labels

```cypher
MATCH (u:User {
  name: "Alice"
})

SET u:VipUser;
```

Now:

```text
Alice
Labels:
- User
- VipUser
```

---

# 14. 🗑️ DELETE vs DETACH DELETE

A node with relationships cannot simply be deleted.

```cypher
MATCH (u:User {
  name: "Alice"
})

DELETE u;
```

If relationships remain, this can fail.

Use:

```cypher
DETACH DELETE u;
```

This removes:

```text
Node
+
Its connected relationships
```

⚠️ Use carefully in production.

---

# 15. 🔗 Variable-Length Traversal

Cypher supports variable-length patterns.

Example:

```cypher
MATCH path =
  (a:User {name: "Alice"})
  -[:KNOWS*1..3]->
  (f:User)

RETURN
  f.name,
  length(path) AS distance;
```

Meaning:

```text
Alice
  │
  ├── 1 hop
  │
  ├── 2 hops
  │
  └── 3 hops
```

Always think about traversal bounds when working with highly connected graphs.

---

# 16. 🧮 Aggregations

Cypher supports aggregation functions such as:

```cypher
count()
sum()
avg()
min()
max()
collect()
```

Example:

```cypher
MATCH (u:User)-[:LIKES]->(h:Hotel)

RETURN
  u.name,
  count(h) AS numberOfHotels;
```

Conceptually:

```text
Alice
 ├── LIKES → Hotel A
 ├── LIKES → Hotel B
 └── LIKES → Hotel C

count(h) = 3
```

---

# 17. 🧭 SQL vs Cypher

Suppose we want:

> Find hotels liked by Alice's friends.

### SQL

This commonly requires several joins:

```sql
SELECT h.*
FROM users u
JOIN relationships r1
  ON u.id = r1.from_id
JOIN relationships r2
  ON r1.to_id = r2.from_id
JOIN hotels h
  ON r2.to_id = h.id
WHERE u.name = 'Alice'
  AND r1.type = 'KNOWS'
  AND r2.type = 'LIKES';
```

### Cypher

```cypher
MATCH
  (a:User {name: "Alice"})
  -[:KNOWS]->
  (f:User)
  -[:LIKES]->
  (h:Hotel)

RETURN
  h.businessName,
  h.rating;
```

Cypher visually resembles the graph itself.

---

# 18. 🏗️ Neo4j Architecture

A simplified architecture:

```text
Node.js / Python / Java
          │
          ▼
      Neo4j Driver
          │
          ▼
        Bolt
          │
          ▼
   Neo4j Database
          │
          ├── Query Planning
          ├── Execution
          ├── Transactions
          ├── Storage
          └── Indexes
```

---

# 19. 🔌 Bolt Protocol

Neo4j commonly uses:

```text
Port 7687 → Bolt
```

for driver connections.

A local Neo4j browser/web interface commonly uses:

```text
Port 7474 → HTTP
```

So:

```text
Node.js
   │
   │ Bolt :7687
   ▼
Neo4j
```

and:

```text
Browser
   │
   │ HTTP :7474
   ▼
Neo4j
```

---

# 20. 🐳 Running Neo4j with Docker

Example:

```bash
docker run -d \
  --name neo4j-container \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password123 \
  neo4j:latest
```

Then commonly:

```text
Browser:
http://localhost:7474

Bolt:
bolt://localhost:7687
```

⚠️ For real deployments, don't use simple example passwords. Use secure secrets.

---

# 21. ☁️ Neo4j Aura

Neo4j Aura is Neo4j's managed cloud database offering.

Instead of managing:

```text
Server
OS
Database installation
Updates
Infrastructure
```

the managed service handles much of the infrastructure.

Your application connects using a secure URI such as:

```text
neo4j+s://xxxxx.databases.neo4j.io
```

---

# 22. 🤖 Text-to-Cypher

An LLM can translate natural language into Cypher.

User:

```text
Find hotels liked by Alice.
```

LLM generates something conceptually like:

```cypher
MATCH
  (u:User {name: $name})
  -[:LIKES]->
  (h:Hotel)

RETURN h;
```

Parameters:

```javascript
{
  name: "Alice"
}
```

---

# 23. ⚠️ LLM-Generated Cypher Is Not Automatically Safe

Don't assume:

> "LLMs generate Cypher with high fidelity, so I can execute it directly."

LLMs can produce:

* Incorrect labels
* Incorrect relationships
* Invalid syntax
* Expensive queries
* Unexpected write operations
* Security-sensitive queries

A safer architecture is:

```text
User
 │
 ▼
LLM
 │
 ▼
Generate Cypher
 │
 ▼
Validate
 │
 ├── Syntax
 ├── Allowed operations
 ├── Allowed labels
 ├── Allowed relationships
 ├── Parameters
 └── Query complexity
 │
 ▼
Restricted Neo4j User
 │
 ▼
Neo4j
```

For read-only agents, use appropriate database permissions.

---

# 24. 📦 Node.js + Neo4j Driver

Install:

```bash
npm install neo4j-driver
```

Import:

```javascript
const neo4j = require("neo4j-driver");
```

Create a driver:

```javascript
const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic(
    "neo4j",
    "password123"
  )
);
```

---

# 25. 🔌 Testing the Connection

```javascript
const neo4j = require("neo4j-driver");

async function main() {

  const driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic(
      "neo4j",
      "password123"
    )
  );

  try {

    const serverInfo =
      await driver.getServerInfo();

    console.log(
      "Connected to:",
      serverInfo.address
    );

    console.log(
      "Server:",
      serverInfo.agent
    );

  } catch (error) {

    console.error(
      "Connection failed:",
      error
    );

  } finally {

    await driver.close();

  }
}

main();
```

---

# 26. ⚡ `driver.executeQuery()`

For straightforward individual queries:

```javascript
const result =
  await driver.executeQuery(
    `
    MATCH (u:User)
    RETURN u.name AS name
    `
  );
```

Then:

```javascript
result.records.forEach(
  (record) => {
    console.log(
      record.get("name")
    );
  }
);
```

---

# 27. 🛡️ Parameterized Queries

Never do:

```javascript
const query = `
  MATCH (u:User {
    name: '${userInput}'
  })
  RETURN u
`;
```

Instead:

```javascript
const query = `
  MATCH (u:User {
    name: $name
  })
  RETURN u
`;

const params = {
  name: userInput
};

const result =
  await driver.executeQuery(
    query,
    params
  );
```

---

## Why?

```text
Query structure
       +
Data parameters
       =
Safer query execution
```

Parameters help prevent injection by keeping values separate from Cypher source.

They also allow the database to reuse the same query structure more effectively.

---

# 28. 🧠 Driver vs Session vs Transaction

This is extremely important.

### Driver

Long-lived application-level object.

```javascript
const driver = neo4j.driver(...);
```

It manages communication and connection pooling.

---

### Session

Represents a logical interaction with a database.

```javascript
const session = driver.session({
  database: "neo4j"
});
```

Close it:

```javascript
await session.close();
```

---

### Transaction

Represents an atomic unit of work.

```text
Session
   │
   ▼
Transaction
   ├── Query 1
   ├── Query 2
   └── Query 3
```

If successful:

```text
COMMIT
```

If failed:

```text
ROLLBACK
```

---

# 29. ✍️ `executeWrite()`

For transactional writes:

```javascript
const session = driver.session({
  database: "neo4j"
});

try {

  await session.executeWrite(
    async (tx) => {

      await tx.run(
        `
        CREATE (u:User {
          email: $email
        })
        `,
        {
          email: "bob@example.com"
        }
      );

    }
  );

  console.log(
    "Transaction committed"
  );

} catch (error) {

  console.error(
    "Transaction failed:",
    error
  );

} finally {

  await session.close();

}
```

---

# 30. 📖 `executeRead()`

For transactional reads:

```javascript
const session = driver.session({
  database: "neo4j"
});

try {

  const records =
    await session.executeRead(
      async (tx) => {

        const result = await tx.run(
          `
          MATCH (u:User)
          RETURN u.name AS name
          `
        );

        return result.records;
      }
    );

  records.forEach(
    (record) => {
      console.log(
        record.get("name")
      );
    }
  );

} finally {

  await session.close();

}
```

---

# 31. 🧹 Driver Lifecycle

Recommended application architecture:

```text
Application Startup
        │
        ▼
Create Driver
        │
        ▼
Reuse Driver
        │
        ├── Request 1
        ├── Request 2
        ├── Request 3
        └── Request N
        │
        ▼
Application Shutdown
        │
        ▼
driver.close()
```

Don't create and destroy a driver for every HTTP request.

---

# 32. 🏗️ Recommended Node.js Structure

For an Express application:

```text
src/
│
├── config/
│   └── neo4j.js
│
├── repositories/
│   └── user.repository.js
│
├── services/
│   └── user.service.js
│
├── routes/
│   └── user.routes.js
│
└── server.js
```

Example:

```javascript
// config/neo4j.js

const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USER,
    process.env.NEO4J_PASSWORD
  )
);

module.exports = driver;
```

Then repositories/services can reuse it.

---

# 33. 📐 Advanced Graph Modeling

The main modeling question:

> **Should this be a property or a node?**

Example:

```text
User
 ├── age: 30
 ├── email: ...
 └── country: France
```

versus:

```text
User
  │
  │ LIVES_IN
  ▼
Country
```

Use a property when:

```text
Simple
Scalar
Usually not traversed
```

Use a node when:

```text
Independent entity
Shared
Has relationships
Has its own attributes
Frequently traversed
```

---

# 34. 🔄 BFS vs DFS

BFS:

```text
Alice
 ├── Bob
 ├── Charlie
 │
 ├── David
 ├── Emma
 └── Frank
```

It explores:

```text
Level 0
   ↓
Level 1
   ↓
Level 2
   ↓
Level 3
```

DFS instead explores deeply along a branch before backtracking.

```text
Alice
  ↓
Bob
  ↓
David
  ↓
Company
```

---

## ⚠️ Neo4j Clarification

Don't say:

> "Neo4j executes every Cypher query using BFS or DFS."

That's incorrect.

Neo4j uses a **query planner and execution engine** with operators such as:

```text
Node Index Seek
Node Scan
Expand
Filter
Aggregation
Projection
```

The exact execution strategy depends on the query and database state.

BFS/DFS are useful **graph algorithm concepts**, not a complete description of Neo4j's Cypher execution engine.

---

# 35. 🔀 Vector Search + Graph Search

Neo4j supports vector indexes in modern versions.

Example:

```cypher
CREATE VECTOR INDEX document_embeddings IF NOT EXISTS
FOR (d:Document) ON (d.embedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1536,
    `vector.similarity_function`: 'cosine'
  }
};
```

A document might contain:

```text
Document
 ├── title
 ├── content
 └── embedding
```

where:

```text
embedding =
[0.12, -0.43, 0.77, ...]
```

---

# 36. 🔎 Hybrid GraphRAG Retrieval

Conceptually:

```text
User Question
      │
      ▼
Generate Embedding
      │
      ▼
Vector Search
      │
      ▼
Relevant Documents
      │
      ▼
Graph Traversal
      │
      ▼
Related Entities
      │
      ▼
Context
      │
      ▼
LLM
      │
      ▼
Answer
```

Example:

```cypher
CALL db.index.vector.queryNodes(
  'document_embeddings',
  5,
  $queryEmbedding
)
YIELD node AS doc, score

MATCH (doc)-[:BELONGS_TO]->(c:Category)

RETURN
  doc.title,
  c.name,
  score

ORDER BY score DESC;
```

---

# 37. 🧠 Vector vs Graph Retrieval

| Vector                     | Graph                        |
| -------------------------- | ---------------------------- |
| Semantic similarity        | Explicit relationships       |
| Embeddings                 | Nodes + relationships        |
| "What is similar?"         | "What is connected?"         |
| Great for documents/chunks | Great for entities/relations |

Hybrid:

```text
Vector Search
      +
Graph Traversal
      ↓
GraphRAG
```

---

# 38. 📊 Indexing

Indexes help the database efficiently locate nodes based on indexed properties.

Example:

```cypher
CREATE INDEX user_name_idx IF NOT EXISTS
FOR (u:User) ON (u.name);
```

Then:

```cypher
MATCH (u:User {
  name: "Alice"
})
RETURN u;
```

may use an index-backed lookup depending on the execution plan.

---

# 39. 🧩 Composite Index

Example:

```cypher
CREATE INDEX hotel_city_rating_idx IF NOT EXISTS
FOR (h:Hotel) ON (h.city, h.rating);
```

Useful when query patterns frequently use the relevant property combination.

But don't automatically create indexes on every property.

---

# 40. 🔬 EXPLAIN vs PROFILE

## EXPLAIN

```cypher
EXPLAIN
MATCH (u:User {
  name: "Alice"
})-[:LIKES]->(h:Hotel)
RETURN h.businessName;
```

Shows the planned execution strategy without executing the query.

---

## PROFILE

```cypher
PROFILE
MATCH (u:User {
  name: "Alice"
})-[:LIKES]->(h:Hotel)
RETURN h.businessName;
```

Executes the query and reports runtime information from the execution plan.

Conceptually:

```text
EXPLAIN
   ↓
Plan only

PROFILE
   ↓
Execute + inspect runtime statistics
```

---

# 41. 🚀 Performance Optimization Workflow

Don't blindly add indexes.

Use:

```text
Real Query
    ↓
EXPLAIN
    ↓
Inspect Plan
    ↓
PROFILE
    ↓
Find Bottleneck
    ↓
Optimize
    ↓
PROFILE Again
```

Possible optimizations include:

```text
Better indexes
Better query patterns
Bounded traversals
Better filtering
Better data modeling
Appropriate constraints
```

---

# 42. 🧩 Complete Node.js Example

```javascript
const neo4j = require("neo4j-driver");

async function main() {

  const URI =
    process.env.NEO4J_URI ||
    "bolt://localhost:7687";

  const USER =
    process.env.NEO4J_USER ||
    "neo4j";

  const PASSWORD =
    process.env.NEO4J_PASSWORD ||
    "password123";

  const driver = neo4j.driver(
    URI,
    neo4j.auth.basic(
      USER,
      PASSWORD
    )
  );

  try {

    // ---------------------------
    // 1. Verify connection
    // ---------------------------

    const serverInfo =
      await driver.getServerInfo();

    console.log(
      "Connected to:",
      serverInfo.address
    );

    // ---------------------------
    // 2. Create graph
    // ---------------------------

    const createQuery = `
      MERGE (u:User {
        name: $userName
      })

      ON CREATE SET
        u.age = $age

      MERGE (h:Hotel {
        businessName: $hotelName
      })

      ON CREATE SET
        h.city = $city,
        h.rating = $rating

      MERGE (u)-[:LIKES]->(h)

      RETURN u, h
    `;

    const createResult =
      await driver.executeQuery(
        createQuery,
        {
          userName: "Alice",
          age: 30,
          hotelName: "Grand Plaza",
          city: "Paris",
          rating: 4.9
        }
      );

    const counters =
      createResult
        .summary
        .counters
        .updates();

    console.log(
      "Nodes created:",
      counters.nodesCreated
    );

    console.log(
      "Relationships created:",
      counters.relationshipsCreated
    );

    // ---------------------------
    // 3. Query graph
    // ---------------------------

    const fetchQuery = `
      MATCH
        (u:User {
          name: $userName
        })
        -[:LIKES]->
        (h:Hotel)

      RETURN
        u.name AS userName,
        h.businessName AS hotelName,
        h.city AS city,
        h.rating AS rating
    `;

    const fetchResult =
      await driver.executeQuery(
        fetchQuery,
        {
          userName: "Alice"
        }
      );

    // ---------------------------
    // 4. Process records
    // ---------------------------

    fetchResult.records.forEach(
      (record) => {

        console.log(
          `User: ${record.get("userName")}`
        );

        console.log(
          `Hotel: ${record.get("hotelName")}`
        );

        console.log(
          `City: ${record.get("city")}`
        );

        console.log(
          `Rating: ${record.get("rating")}`
        );
      }
    );

  } catch (error) {

    console.error(
      "Neo4j error:",
      error
    );

  } finally {

    await driver.close();

    console.log(
      "Neo4j driver closed."
    );
  }
}

main();
```

---

# 43. 🎯 Production Checklist

Before using Neo4j in a production Node.js application:

### Database

* [ ] Design nodes around meaningful domain entities
* [ ] Use relationships for important connections
* [ ] Use properties for simple attributes
* [ ] Add uniqueness constraints where required
* [ ] Add indexes based on actual query patterns
* [ ] Bound expensive traversals

### Node.js

* [ ] Create a reusable Driver
* [ ] Don't create a Driver per HTTP request
* [ ] Use environment variables for credentials
* [ ] Close explicit sessions
* [ ] Close Driver during application shutdown

### Security

* [ ] Use parameterized Cypher
* [ ] Never concatenate untrusted input
* [ ] Validate LLM-generated Cypher
* [ ] Restrict database permissions
* [ ] Prefer read-only credentials for read-only agents

### Performance

* [ ] Use `EXPLAIN`
* [ ] Use `PROFILE`
* [ ] Inspect query plans
* [ ] Measure real workloads
* [ ] Avoid unrestricted deep traversals

### GraphRAG

* [ ] Store embeddings appropriately
* [ ] Use vector search for semantic retrieval
* [ ] Use graph traversal for relationships
* [ ] Combine retrieval results before generation
* [ ] Validate agent-generated database queries

---

# 44. 🧾 Master Interview Questions

## Q1. What is a Graph Database?

A database designed to represent and query entities and their relationships as first-class data structures.

---

## Q2. What is a Property Graph?

A graph model containing:

```text
Nodes
Relationships
Properties
Labels
```

---

## Q3. What is Index-Free Adjacency?

It is a characteristic of native graph storage where, after locating a node, the database can follow its adjacent relationships through native graph structures rather than reconstructing those connections through relational-style joins.

---

## Q4. Is every graph traversal O(1)?

**No.**

An individual adjacency step can be very efficient, but the overall query cost depends on the amount of graph data traversed and the execution plan.

---

## Q5. Why can graphs be useful for highly connected data?

Because relationships are explicitly represented and can be traversed directly.

Examples:

```text
User
 ↓
Friend
 ↓
Company
 ↓
Product
```

---

## Q6. What is Cypher?

Cypher is Neo4j's declarative graph query language.

Example:

```cypher
MATCH (u:User)-[:LIKES]->(h:Hotel)
RETURN h;
```

---

## Q7. What is `MERGE`?

`MERGE` attempts to match a specified pattern and creates it if it doesn't exist.

It should not be confused with uniqueness constraints.

---

## Q8. What is `DETACH DELETE`?

It deletes a node together with its connected relationships.

---

## Q9. Why use parameterized queries?

To keep data separate from Cypher source and reduce the risk of injection attacks.

Example:

```cypher
MATCH (u:User {
  name: $name
})
RETURN u;
```

---

## Q10. Driver vs Session?

```text
Driver
→ Long-lived connection manager

Session
→ Logical database interaction
```

---

## Q11. What is a transaction?

An atomic unit of database work.

```text
All succeed → Commit

Failure → Rollback
```

---

## Q12. `executeQuery()` vs `executeWrite()`?

```text
executeQuery()
→ Convenient execution of an individual query

executeWrite()
→ Transactional write workflow through a session
```

---

## Q13. What is BFS?

Breadth-First Search explores the graph level by level.

---

## Q14. What is DFS?

Depth-First Search explores a branch deeply before backtracking.

---

## Q15. Does Neo4j simply use BFS/DFS for every Cypher query?

**No.**

Cypher queries are planned and executed through Neo4j's query execution machinery and operators.

BFS/DFS are useful conceptual graph algorithms but don't describe every Cypher execution plan.

---

## Q16. What is GraphRAG?

GraphRAG combines graph-based retrieval with semantic/vector retrieval to provide richer context to an LLM.

---

## Q17. Vector Search vs Graph Search?

```text
Vector Search
→ Semantic similarity

Graph Search
→ Explicit relationships
```

---

## Q18. What is episodic memory?

Memory representing previous events, interactions, or experiences.

---

## Q19. What is temporal memory?

Memory that captures when information was created, observed, updated, or valid.

---

## Q20. What does `EXPLAIN` do?

Shows the planned execution strategy without executing the query.

---

## Q21. What does `PROFILE` do?

Executes the query and provides runtime statistics for its execution plan.

---

## Q22. Should you create an index on every property?

**No.**

Indexes should be based on access patterns and performance requirements.

---

## Q23. Should LLM-generated Cypher be executed directly?

**No.**

It should be validated/restricted, and the database credentials should follow least-privilege principles.

---

# 45. 🧠 Final Mental Model

Memorize this:

```text
                  GRAPH DATABASE
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
        Nodes     Relationships   Properties
          │             │
          └─────────────┘
                  │
                  ▼
               Cypher
                  │
                  ▼
             Query Planner
                  │
                  ▼
            Neo4j Engine
                  │
         ┌────────┴────────┐
         ▼                 ▼
     Graph Search      Vector Search
         │                 │
         └────────┬────────┘
                  ▼
               GraphRAG
                  │
                  ▼
              AI Agent
                  │
          ┌───────┴────────┐
          ▼                ▼
       Factual          Episodic
       Memory            Memory
          │                │
          └───────┬────────┘
                  ▼
             AI Context
```

---

# 🚀 One-Minute Revision

```text
Graph DB
= Nodes + Relationships + Properties

Index-Free Adjacency
= Efficient native relationship traversal

Cypher
= Neo4j graph query language

MATCH
= Find graph patterns

CREATE
= Create data

MERGE
= Match or create

SET
= Update properties/labels

DETACH DELETE
= Delete node + relationships

Driver
= Long-lived Neo4j connectivity

Session
= Logical database interaction

Transaction
= Atomic unit of work

BFS
= Level by level

DFS
= Deep branch first

Vector Search
= Semantic similarity

Graph Search
= Relationships

GraphRAG
= Vector + Graph retrieval

EXPLAIN
= Plan without execution

PROFILE
= Execute + inspect runtime statistics
```

> **Final takeaway:**
> **Graph modeling defines entities and relationships → Cypher queries the graph → Neo4j's execution engine executes those patterns → Node.js connects through the Driver → vector search adds semantic retrieval → Graph traversal adds relational context → GraphRAG combines both → AI agents can use the resulting graph as structured, contextual memory.**
