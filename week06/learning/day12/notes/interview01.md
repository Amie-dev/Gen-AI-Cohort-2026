# 🎯 Week 06 — Day 12: Interview Questions & Answers

Below are **only the interview questions covered by your notes** on Graph Databases, Index-Free Adjacency, Cypher Query Syntax, Neo4j Engine Architecture, Node.js Driver (`neo4j-driver`), Parameterized Queries, and GraphRAG.

---

## 1. What is a Graph Database?

**Answer:**
A Graph Database is a non-relational database engine that natively stores data as **Nodes** (entities), **Edges/Relationships** (connections), and **Properties** (key-value attributes).

**In short:**
> **Graph Database = Nodes + Relationships + Properties + Index-Free Adjacency**

---

## 2. What is the difference between a Relational DB (SQL) and a Native Graph DB (Neo4j)?

**Answer:**
A Relational Database stores entities in separate tables and computes relationships dynamically using foreign key JOINs. As query hop depth increases, performance degrades exponentially.

A Native Graph Database physically stores relationships as direct memory pointers between nodes (Index-Free Adjacency). Traversing relationships takes constant $\mathcal{O}(1)$ time per step regardless of database size.

```text
SQL RDBMS
Request → Table Scans → FK Index Lookup → Join Table → Result

Graph DB (Neo4j)
Node Pointer → Edge Pointer → Target Node Pointer → Result
```

---

## 3. What is Cypher?

**Answer:**
Cypher is a declarative, ASCII-art graph query language created by Neo4j and standardized as openCypher.

Example:
```cypher
MATCH (u:User {name: "Alice"})-[r:LIKES]->(h:Hotel)
RETURN u, r, h;
```

---

## 4. How do `CREATE` and `MERGE` differ in Cypher?

**Answer:**
* `CREATE` always inserts a new node or relationship into the database, even if a duplicate exists.
* `MERGE` performs an idempotent "match-or-create" operation (similar to UPSERT in SQL).

---

## 5. Why must you use `DETACH DELETE` to remove a node in Neo4j?

**Answer:**
Neo4j prevents orphan relationships. If a node has active connected edges, a standard `DELETE` command throws an error. `DETACH DELETE` automatically deletes all connected incoming and outgoing edges first before deleting the node.

---

## 6. How do you prevent Cypher Injection in Node.js applications?

**Answer:**
Never use string concatenation to build Cypher statements. Always use **Parameterized Queries** (`$paramName`) with `driver.executeQuery()`:

```javascript
// Secure parameterized execution
await driver.executeQuery(
  'MATCH (u:User {name: $userName}) RETURN u',
  { userName: userInput }
);
```

---

## 7. What is GraphRAG and why is it used in GenAI applications?

**Answer:**
GraphRAG combines vector search embeddings with knowledge graph traversals. It allows LLMs to query structured multi-hop relationships alongside unstructured text chunks, eliminating hallucinations in complex factual retrieval.
