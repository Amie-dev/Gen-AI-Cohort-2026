# 🤖 Chapter 05 — GraphRAG Hybrid Retrieval & Query Performance Profiling

## 1. GraphRAG Architecture

GraphRAG combines **Vector Semantic Similarity** with **Explicit Graph Traversal Expansion** to provide comprehensive context to LLMs.

```text
User Question
     │
     ▼
Vector Search (Find relevant document chunks)
     │
     ▼
Graph Expansion (Traverse to related topics, entities, and historical user memories)
     │
     ▼
Unified Context Window ──> LLM ──> Answer Generation
```

---

## 2. Text-to-Cypher Safety Validation

LLM-generated Cypher queries must be validated before execution to prevent Cypher injection or unauthorized data modification.

```javascript
// Security checks enforced by GraphRagService:
1. Block mutating keywords: CREATE, MERGE, DELETE, DETACH, SET, REMOVE, DROP.
2. Require query to start with read-only keywords: MATCH, OPTIONAL MATCH, WITH.
3. Validate parameter bindings.
```

---

## 3. Query Performance Profiling (`EXPLAIN` & `PROFILE`)

- **`EXPLAIN`**: Previews execution plan without running query.
- **`PROFILE`**: Executes query and captures `dbHits` and timing statistics.

```cypher
PROFILE
MATCH (u:User {name: "Alice"})-[:LIKES]->(h:Hotel)
RETURN h.businessName
```
