# 🕸️ Chapter 01 — Property Graph Model & Index-Free Adjacency

## 1. The Labeled Property Graph (LPG) Model

The **Labeled Property Graph (LPG)** model represents domain data as connected network topologies consisting of four primitive components: **Nodes**, **Labels**, **Relationships**, and **Properties**.

```text
       (:User {id: "usr_alice", name: "Alice"})
                          │
                          │ -[:LIKES {rating: 5, since: 2024}]->
                          ▼
(:Hotel {id: "htl_grand_plaza", businessName: "Grand Plaza", city: "Paris"})
                          │
                          │ -[:LOCATED_IN]->
                          ▼
           (:City {id: "cty_paris", name: "Paris"})
```

### LPG Primitive Components:

1. **Nodes (`()`)**: Main data entities representing real-world objects, events, concepts, or agent states.
   - Example: `(:User)` or `(:Hotel)`.
2. **Labels (`:LabelName`)**: Categorical tags attached to nodes. A single node can carry multiple labels (e.g. `(:Memory:FactualMemory)`).
3. **Relationships (`-[]->`)**: Typed, directional edges representing explicit links between two nodes. Edges *always* have a starting node, an ending node, and a single relationship type.
   - Example: `-[:KNOWS]->` or `-[:OBSERVED]->`.
4. **Properties (`{key: value}`)**: Key-value metadata maps stored directly inside nodes or relationships.
   - Example on Node: `{name: "Alice", age: 30}`
   - Example on Relationship: `{rating: 5, since: 2024}`

---

## 2. Index-Free Adjacency (IFA) Mechanics

The defining feature of a native graph database (such as Neo4j) is **Index-Free Adjacency (IFA)**.

In non-native databases (SQL or Document stores), relationships are computed at query time by performing global index lookups. In native graph databases, nodes store **direct physical memory pointers** to adjacent relationship records and target nodes.

```text
SQL Approach (Global Index Traversal):
[Table: User] ──(Foreign Key: user_id)──> [Table: User_Hotel_Junction] ──(Foreign Key: hotel_id)──> [Table: Hotel]
* Traversal Cost: O(log N) or O(N) per JOIN step where N = total table size.
* As the database grows from 1M to 1B rows, query response times degrade exponentially.

Native Graph Approach (Index-Free Adjacency):
┌─────────────────────────┐        Direct Memory Pointer        ┌───────────────────────────┐
│ Node [Alice]            ├────────────────────────────────────►│ Node [Grand Plaza Hotel]  │
│ Pointer: 0x7FFF8A120000 │                                     │ Pointer: 0x7FFF8A14B200   │
└─────────────────────────┘                                     └───────────────────────────┘
* Traversal Cost: O(1) per step (Pointer dereference).
* Traversal cost depends ONLY on the size of the traversed subgraph, NOT the total size of the database.
```

### Architectural Comparison Matrix:

| Metric / Dimension | Relational Database (SQL) | Document Store (NoSQL) | Native Graph DB (Neo4j) |
| :--- | :--- | :--- | :--- |
| **Data Representation** | Tables, Rows, Foreign Keys | JSON / BSON Documents | Nodes, Edges, Properties |
| **Relationship Resolution** | Global Index Lookups via `JOIN` | Application-level stitching / Embeds | **Index-Free Adjacency (Direct Pointers)** |
| **1-Hop Traversal Complexity** | $O(\log N)$ | $O(\log N)$ | **$O(1)$** |
| **3-Hop Traversal Complexity** | $O(\log N)^3$ (Exponential degradation) | $O(M \times \log N)$ | **$O(k_1 \cdot k_2 \cdot k_3)$ (Subgraph size only)** |
| **Schema Flexibility** | Rigid DDL Schemas | Schema-less / Flexible | Dynamic Property Graph Schema |

---

## 3. Physical Memory Record Layout in Neo4j

Under the hood, Neo4j manages data using fixed-size record files on disk and in memory:

```text
Node Record (15 bytes):
┌──────────┬─────────────┬────────────────┬──────────────┐
│ InUse (1)│ FirstRel (4)│ FirstProp (4)  │ Labels (5)   │
└──────────┴─────────────┴────────────────┴──────────────┘

Relationship Record (34 bytes):
┌──────────┬────────────┬────────────┬─────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ InUse (1)│ FirstNode(4│ SecondNode │ RelType (2) │ PrevRelIn (4)│ NextRelIn (4)│ PrevRelOut(4)│ NextRelOut(4)│
└──────────┴────────────┴────────────┴─────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

Because relationship records form double doubly-linked lists (`NextRelIn` / `NextRelOut`), traversing from node $A$ to node $B$ is a direct pointer traversal through RAM.

---

## 4. Code Walkthrough — Basic Graph Verification

File path: [`src/demos/demo-01-fundamentals.js`](../src/demos/demo-01-fundamentals.js)

The initial demonstration code verifies connectivity to the Neo4j database engine and inspects graph node counts.

```javascript
const { executeQuery, verifyConnection, closeDriver } = require('../config/neo4j');

async function runFundamentalsDemo() {
  console.log('--- Demo 01: Graph Fundamentals & Verification ---');

  // 1. Verify connection pool & serverinfo
  const connection = await verifyConnection();
  if (!connection.success) return;

  // 2. Query node and relationship statistics using Cypher
  const statsQuery = `
    MATCH (n)
    OPTIONAL MATCH (n)-[r]->()
    RETURN count(DISTINCT n) AS totalNodes, count(r) AS totalRelationships
  `;

  const result = await executeQuery(statsQuery);
  const record = result.records[0];

  console.log(`📊 Current Knowledge Graph State:`);
  console.log(`   - Total Nodes: ${record.get('totalNodes')}`);
  console.log(`   - Total Relationships: ${record.get('totalRelationships')}`);
}

if (require.main === module) {
  runFundamentalsDemo().then(() => closeDriver());
}
```

Proceed to [Chapter 02 — Cypher Query Language Syntax & CRUD Operations](chapter-02-cypher-syntax-and-crud.md) to master pattern matching and data modification.
