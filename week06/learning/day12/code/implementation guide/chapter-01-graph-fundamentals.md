# 🕸️ Chapter 01 — Graph Database Fundamentals & Index-Free Adjacency

## 1. The Property Graph Model

A **Graph Database** stores data as nodes (entities) and relationships (connections), both of which can carry properties (key-value attributes).

```text
(:User {name: "Alice", age: 30}) ──[:LIKES {rating: 5}]──> (:Hotel {businessName: "Grand Plaza"})
```

### Components:
- **Nodes**: Entities represented as `()`.
- **Labels**: Categories prefixed with `:` e.g. `:User`, `:Hotel`.
- **Relationships**: Typed directional edges represented as `[]` e.g. `-[:LIKES]->`.
- **Properties**: Key-value pairs enclosed in `{}` on nodes or edges.

---

## 2. Index-Free Adjacency

In native graph databases like Neo4j, **Index-Free Adjacency** means that each node maintains direct physical memory pointers to its adjacent relationships and neighboring nodes.

```text
SQL Approach:
User Table  --->  Junction Table  --->  Hotel Table
(Global Index Lookup per JOIN step: O(log N) or O(N))

Native Graph Approach:
Node [Alice]  ===[Direct Memory Pointer]===>  Node [Grand Plaza]
(Relationship Traversal step: Native Adjacency Step)
```

### Why Graph Databases Excel for Connected Data:
- Traversal query cost depends on the **subgraph traversed**, not the total size of the database.
- Deep multi-hop relationships (`Friends of Friends of Friends`) do not degrade exponentially like relational SQL JOINs.
