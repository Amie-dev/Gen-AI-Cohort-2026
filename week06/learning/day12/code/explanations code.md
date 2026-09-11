# 📖 Detailed Code Explanations — Week 06 Day 12

This document provides a comprehensive walkthrough of the entire Day 12 codebase, explaining each module, service, Cypher pattern, and architecture design decision.

---

## 📑 Table of Contents

1. [Database Connection & Lifecycle (`src/config/neo4j.js`)](#1-database-connection--lifecycle)
2. [Constraints & Indexes (`src/db/constraintsAndIndexes.js`)](#2-constraints--indexes)
3. [Graph Seeding (`src/db/seed.js`)](#3-graph-seeding)
4. [Cypher CRUD Operations (`src/services/cypherCrudService.js`)](#4-cypher-crud-operations)
5. [Graph Traversals & Algorithms (`src/services/graphTraversalService.js`)](#5-graph-traversals--algorithms)
6. [Cognitive AI Agent Memory System (`src/services/cognitiveMemoryService.js`)](#6-cognitive-ai-agent-memory-system)
7. [GraphRAG & Cypher Safety Validation (`src/services/graphRagService.js`)](#7-graphrag--cypher-safety-validation)
8. [Query Performance Profiling (`src/services/queryProfilerService.js`)](#8-query-performance-profiling)

---

## 1. Database Connection & Lifecycle

Located at: [`src/config/neo4j.js`](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/code/src/config/neo4j.js)

### Key Concepts:
- **Driver Singleton**: A single long-lived `neo4j.driver()` instance manages connection pooling across the application lifecycle.
- **Connection Check**: Uses `driver.getServerInfo()` to verify Bolt protocol connectivity to port `7687`.
- **Parameterized Query Execution**: Exposes `executeQuery(cypher, params)` which automatically handles session creation, query execution, and session closing.
- **Graceful Shutdown**: `closeDriver()` drains the connection pool during application exit.

---

## 2. Constraints & Indexes

Located at: [`src/db/constraintsAndIndexes.js`](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/code/src/db/constraintsAndIndexes.js)

### Implemented Schema Rules:
- **Uniqueness Constraints**:
  ```cypher
  CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE
  ```
- **Single Property Indexes**:
  ```cypher
  CREATE INDEX user_name_idx IF NOT EXISTS FOR (u:User) ON (u.name)
  ```
- **Composite Property Indexes**:
  ```cypher
  CREATE INDEX hotel_city_rating_idx IF NOT EXISTS FOR (h:Hotel) ON (h.city, h.rating)
  ```
- **Vector Indexes for Embeddings**:
  ```cypher
  CREATE VECTOR INDEX document_embeddings IF NOT EXISTS FOR (d:Document) ON (d.embedding)
  ```

---

## 3. Graph Seeding

Located at: [`src/db/seed.js`](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/code/src/db/seed.js)

Populates nodes (`User`, `Hotel`, `Company`, `Memory`, `Document`, `Topic`, `City`) and explicit relationships (`KNOWS`, `LIKES`, `LOCATED_IN`, `WORKS_AT`, `PARTICIPATED_IN`, `OBSERVED`, `HAS_TOPIC`, `MENTIONS`) using idempotent `MERGE` Cypher statements.

---

## 4. Cypher CRUD Operations

Located at: [`src/services/cypherCrudService.js`](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/code/src/services/cypherCrudService.js)

### Operations Walkthrough:
- **CREATE**: Instantiates new node entities.
- **MERGE**: Combines match or create semantics using `ON CREATE SET` and `ON MATCH SET`.
- **SET & REMOVE**: Modifies node properties or adds labels (`SET u:VipUser`).
- **DETACH DELETE**: Removes a node alongside all attached relationships to prevent orphaned reference errors.
- **Transactions (`executeWrite`)**: Ensures atomic execution across multiple operations.

---

## 5. Graph Traversals & Algorithms

Located at: [`src/services/graphTraversalService.js`](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/code/src/services/graphTraversalService.js)

### Key Traversal Patterns:
- **Multi-Hop Traversal**: `(u:User)-[:KNOWS*1..3]-(reached:User)` finds friends of friends up to 3 hops away.
- **Shortest Path**: `shortestPath((u1)-[*]-(u2))` calculates minimum relationship hops between distant nodes.
- **Centrality Metrics**: Evaluates node degree `count(r)` to find high-importance graph hubs.
- **BFS Simulation**: Level-by-level queue traversal utilizing native 1-hop index-free adjacency steps.

---

## 6. Cognitive AI Agent Memory System

Located at: [`src/services/cognitiveMemoryService.js`](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/code/src/services/cognitiveMemoryService.js)

### Memory System Architecture:
1. **Factual Memory**: Nodes storing domain facts and preferences (`Alice prefers quiet hotels in Paris`).
2. **Episodic Memory**: Event nodes capturing interactions (`User inquired about luxury hotels`).
3. **Temporal Decay Retrieval**:
   Calculates memory weight using:
   $$\text{relevanceScore} = \text{baseConfidence} \times (\text{decayFactor})^{\text{daysOld}}$$

---

## 7. GraphRAG & Cypher Safety Validation

Located at: [`src/services/graphRagService.js`](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/code/src/services/graphRagService.js)

### Hybrid Retrieval & Safety Features:
- **Hybrid Search**: Combines content match on `Document` nodes with graph expansion into linked `Topic` and `Memory` nodes.
- **Text-to-Cypher Generator**: Builds prompt containing graph schema rules to translate natural language to Cypher.
- **Safety Validator**: Inspects generated Cypher text to block mutating keywords (`CREATE`, `MERGE`, `DELETE`, `DETACH`, `SET`) and ensure queries start with `MATCH` or `WITH`.

---

## 8. Query Performance Profiling

Located at: [`src/services/queryProfilerService.js`](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/code/src/services/queryProfilerService.js)

- **`EXPLAIN`**: Inspects Cypher execution plan without executing the query.
- **`PROFILE`**: Executes query and captures runtime execution stats (`resultAvailableAfter` ms and `dbHits`).
