# 📖 Chapter 02 — Cypher Query Language Syntax & CRUD Operations

## 1. Cypher ASCII Art Pattern Notation

**Cypher** is the declarative graph query language used by Neo4j. It uses visual **ASCII Art** syntax to represent graph patterns, nodes, relationships, and property conditions.

```text
Node Notation:
(u:User {name: "Alice"})
 │└─── Label
 └────── Variable Alias

Relationship Notation:
-[r:LIKES {rating: 5}]->
  │  └────── Relationship Type
  └───────── Variable Alias

Complete Pattern Matching:
(u:User {name: "Alice"})-[r:LIKES]->(h:Hotel {city: "Paris"})
```

### Pattern Notation Reference:
- `()` — Represents a Node.
- `(:User)` — Node with `:User` label filter.
- `(u:User)` — Node bound to query variable `u`.
- `--` — Undirected relationship link.
- `-->` — Directed relationship link (left-to-right).
- `<-[r:KNOWS]-` — Directed relationship link with variable `r` and type `:KNOWS`.
- `(u)-[:LIKES]->(h)` — Directed pattern connecting variable `u` to variable `h`.

---

## 2. Core Cypher CRUD Clauses

Cypher query execution relies on core query clauses that match, construct, update, or detach graph structures.

```text
               ┌──────────┐
               │  MATCH   │  (Find existing nodes/edges)
               └────┬─────┘
                    │
            ┌───────┴───────┐
            ▼               ▼
     ┌─────────────┐  ┌───────────┐
     │   CREATE    │  │   MERGE   │  (Match or Create Idempotently)
     └──────┬──────┘  └─────┬─────┘
            │               │
            ├───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌─────────────┐  ┌───────────┐  ┌─────────────┐
     │     SET     │  │  REMOVE   │  │   DELETE    │ (Or DETACH DELETE)
     └─────────────┘  └───────────┘  └─────────────┘
```

### 1. `MATCH` Clause
Used to specify graph search patterns.
```cypher
MATCH (u:User {name: $userName})-[:LIKES]->(h:Hotel)
WHERE h.rating >= 4.5
RETURN u.name AS user, h.businessName AS hotel, h.rating AS rating
```

### 2. `CREATE` Clause
Instantiates new nodes or relationships unconditionally.
```cypher
CREATE (u:User {id: $id, name: $name, age: $age, createdAt: timestamp()})
RETURN u
```

### 3. `MERGE` Clause (Idempotent Upsert)
Matches existing entities or creates them if they do not exist. Combines with `ON CREATE SET` and `ON MATCH SET`.
```cypher
MERGE (h:Hotel {businessName: $hotelName})
ON CREATE SET
  h.id = $hotelId,
  h.city = $city,
  h.rating = $rating,
  h.createdAt = timestamp()
ON MATCH SET
  h.rating = $rating,
  h.updatedAt = timestamp()
```

### 4. `SET` and `REMOVE` Clauses
Modifies property key-values or updates node label sets.
```cypher
MATCH (u:User {id: $userId})
SET u.role = $newRole, u.updatedAt = timestamp()
SET u:VipUser
REMOVE u.temporaryFlag
```

### 5. `DELETE` and `DETACH DELETE` Clauses
Removes nodes or edges. If a node still has connected relationships, plain `DELETE` throws a constraint error; `DETACH DELETE` automatically deletes all connected relationships first.
```cypher
MATCH (u:User {id: $userId})
DETACH DELETE u
```

---

## 3. Parameterization & Query Plan Optimization

> [!IMPORTANT]
> **Never string-concatenate user input into Cypher queries!**
> Always use parameterized parameters (e.g., `$userId`, `$userName`). Parameterized queries protect against Cypher injection attacks and allow Neo4j's query planner to cache and reuse compiled execution plans across executions.

```javascript
// ❌ WRONG (Vulnerable to Cypher Injection & Recompilation Overhead)
const query = `MATCH (u:User {name: '${userInput}'}) RETURN u`;

// ✅ CORRECT (Safe Parameterized Query)
const query = `MATCH (u:User {name: $userName}) RETURN u`;
const params = { userName: userInput };
```

---

## 4. Code Walkthrough — Cypher CRUD Service

File path: [`src/services/cypherCrudService.js`](../src/services/cypherCrudService.js)

The `CypherCrudService` class provides concrete methods encapsulating standard data access patterns:

```javascript
const { executeQuery, getSession } = require('../config/neo4j');

class CypherCrudService {
  // 1. CREATE User Node
  async createUser(userParams) {
    const cypher = `
      CREATE (u:User {
        id: $id,
        name: $name,
        age: $age,
        role: $role,
        createdAt: timestamp()
      })
      RETURN u
    `;
    const result = await executeQuery(cypher, userParams);
    return result.records[0]?.get('u').properties;
  }

  // 2. MERGE User LIKES Hotel Relationship
  async mergeUserLikesHotel(userName, hotelData) {
    const cypher = `
      MERGE (u:User {name: $userName})
      MERGE (h:Hotel {businessName: $hotelName})
      ON CREATE SET h.id = $hotelId, h.city = $city, h.rating = $rating
      ON MATCH SET h.rating = $rating

      MERGE (u)-[r:LIKES]->(h)
      ON CREATE SET r.since = date().year, r.rating = $rating
      RETURN u.name AS userName, h.businessName AS hotelName, h.rating AS rating
    `;

    const params = {
      userName,
      hotelId: hotelData.id || `htl_${Date.now()}`,
      hotelName: hotelData.businessName,
      city: hotelData.city,
      rating: hotelData.rating,
    };

    const result = await executeQuery(cypher, params);
    return result.records.map(rec => rec.toObject());
  }

  // 3. READ with 2-Hop Traversal Filtering
  async findHotelsLikedByFriends(userName) {
    const cypher = `
      MATCH (u:User {name: $userName})-[:KNOWS*1..2]-(friend:User)
      MATCH (friend)-[l:LIKES]->(h:Hotel)
      WHERE h.rating >= $minRating
      RETURN friend.name AS friendName, h.businessName AS hotelName, h.rating AS rating
      ORDER BY h.rating DESC
    `;
    const result = await executeQuery(cypher, { userName, minRating: 4.0 });
    return result.records.map(r => r.toObject());
  }

  // 4. Managed Transaction (executeWrite)
  async transferUserConnectionTransactional(userId1, userId2, relType = 'KNOWS') {
    const session = getSession();
    try {
      return await session.executeWrite(async (tx) => {
        const query = `
          MATCH (u1:User {id: $userId1}), (u2:User {id: $userId2})
          MERGE (u1)-[r:${relType} {createdInTx: true}]->(u2)
          RETURN u1.name AS fromUser, u2.name AS toUser
        `;
        const res = await tx.run(query, { userId1, userId2 });
        return res.records.map(rec => rec.toObject());
      });
    } finally {
      await session.close();
    }
  }
}

module.exports = new CypherCrudService();
```

---

## 5. Execution Demo

File path: [`src/demos/demo-02-cypher-crud.js`](../src/demos/demo-02-cypher-crud.js)

Run the Cypher CRUD demonstration suite:
```bash
npm run demo:cypher
```

Proceed to [Chapter 03 — Neo4j Driver Architecture, Transactions & Graph Algorithms](chapter-03-neo4j-driver-and-architecture.md) for deep driver pooling and multi-hop algorithm details.
