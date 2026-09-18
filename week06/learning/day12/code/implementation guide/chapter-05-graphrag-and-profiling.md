# 📖 Chapter 05 — GraphRAG Hybrid Retrieval & Query Profiling

## 1. GraphRAG (Graph-Augmented Retrieval) Architecture

Standard Vector Retrieval-Augmented Generation (RAG) converts document chunks into vector embeddings and retrieves similar chunks using cosine similarity search. While vector search captures semantic keyword overlap, it lacks **structural reasoning**, **multi-hop connection awareness**, and **entity hierarchy mapping**.

**GraphRAG** combines vector search with explicit graph traversals. It first matches entry point nodes via semantic vector or keyword similarity, and then traverses connected edges to retrieve rich relational context (connected topics, category hierarchies, user interactions, and active memories).

```text
                               ┌───────────────────────────┐
                               │  User Natural Language    │
                               │  "GraphRAG Architecture"  │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          ┌──────────────────────────┐               ┌──────────────────────────┐
          │  Vector / Text Search    │               │ Explicit Graph Traversal │
          │  (Document Entry Nodes)  │               │ (Sub-Graph Context)      │
          └────────────┬─────────────┘               └─────────────┬────────────┘
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             ▼
                               ┌───────────────────────────┐
                               │ Document: "doc_01"        │
                               │  ├── Topic: "GraphRAG"    │
                               │  ├── Topic: "Vectors"     │
                               │  └── Memory: "mem_fact_01" │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │ Synthesized LLM Prompt    │
                               └───────────────────────────┘
```

---

## 2. GraphRAG Hybrid Retrieval & Cypher Safety Validator

File path: [`src/services/graphRagService.js`](../src/services/graphRagService.js)

The `GraphRagService` provides hybrid retrieval, Text-to-Cypher prompt compilation, AST/keyword security validation, and safe execution wrappers.

```javascript
const { executeQuery } = require('../config/neo4j');

class GraphRagService {
  // 1. Hybrid Search (Text/Vector Match + Subgraph Expansion)
  async retrieveGraphRagContext(queryTerm, limit = 3) {
    const cypher = `
      MATCH (d:Document)
      WHERE toLower(d.title) CONTAINS toLower($queryTerm) 
         OR toLower(d.content) CONTAINS toLower($queryTerm)
         OR toLower(d.category) CONTAINS toLower($queryTerm)
      
      OPTIONAL MATCH (d)-[:HAS_TOPIC]->(t:Topic)
      OPTIONAL MATCH (m:Memory)-[:MENTIONS]->(t)
      OPTIONAL MATCH (u:User)-[:PARTICIPATED_IN|OBSERVED]->(m)

      RETURN
        d.id AS documentId,
        d.title AS title,
        d.content AS content,
        d.category AS category,
        collect(DISTINCT t.name) AS topics,
        collect(DISTINCT coalesce(m.fact, m.interaction)) AS relatedMemories,
        collect(DISTINCT u.name) AS interestedUsers
      LIMIT toInteger($limit)
    `;

    const result = await executeQuery(cypher, { queryTerm, limit });
    return result.records.map(rec => rec.toObject());
  }

  // 2. Build Text-to-Cypher Translation Prompt
  buildTextToCypherPrompt(userQuery) {
    const graphSchemaDescription = `
      Node Labels & Properties:
      - (:User {id, name, age, role})
      - (:Hotel {id, businessName, city, rating})
      - (:Company {id, name, industry})
      - (:Document {id, title, content, category})
      - (:Topic {id, name, description})
      - (:Memory {id, fact, interaction, createdAt})

      Relationships:
      - (:User)-[:KNOWS]->(:User)
      - (:User)-[:LIKES]->(:Hotel)
      - (:Hotel)-[:LOCATED_IN]->(:City)
      - (:Document)-[:HAS_TOPIC]->(:Topic)
      - (:User)-[:OBSERVED|PARTICIPATED_IN]->(:Memory)
    `;

    return `
      You are an expert Cypher Query Translator for Neo4j 5+.
      Given the graph schema:
      ${graphSchemaDescription}

      Rules:
      1. ONLY generate READ-ONLY queries starting with MATCH or WITH.
      2. Use parameter placeholders like $userName, $cityName instead of raw values.

      User Query: "${userQuery}"
      Generated Cypher Query:
    `;
  }

  // 3. Cypher Injection & Safety Validator
  validateCypherSafety(cypherQuery) {
    if (typeof cypherQuery !== 'string' || !cypherQuery.trim()) {
      return { safe: false, reason: 'Empty query string.' };
    }

    const uppercaseCypher = cypherQuery.toUpperCase();

    // Blacklisted mutating keywords
    const forbiddenKeywords = [
      'CREATE', 'MERGE', 'DELETE', 'DETACH', 'SET', 'REMOVE',
      'DROP', 'ALTER', 'CALL DBMS', 'CALL APOC.TRIGGER', 'CALL APOC.CYPHER.RUNWRITE'
    ];

    for (const keyword of forbiddenKeywords) {
      if (uppercaseCypher.includes(keyword)) {
        return {
          safe: false,
          reason: `Security Violation: Mutating keyword [${keyword}] is forbidden in read-only queries.`
        };
      }
    }

    // Must start with read-only operations
    const validStarts = ['MATCH', 'WITH', 'OPTIONAL MATCH', 'EXPLAIN', 'PROFILE'];
    const startsValid = validStarts.some(keyword => uppercaseCypher.trim().startsWith(keyword));

    if (!startsValid) {
      return {
        safe: false,
        reason: 'Invalid Query: Read-only queries must start with MATCH, OPTIONAL MATCH, WITH, EXPLAIN, or PROFILE.'
      };
    }

    return { safe: true, reason: 'Query passed read-only safety checks.' };
  }

  // 4. Safe Execution Engine
  async executeSafeTextToCypher(cypherQuery, params = {}) {
    const check = this.validateCypherSafety(cypherQuery);
    if (!check.safe) {
      throw new Error(`[Security Block] ${check.reason}`);
    }
    const result = await executeQuery(cypherQuery, params);
    return result.records.map(r => r.toObject());
  }
}

module.exports = new GraphRagService();
```

---

## 3. Query Performance Profiling (`EXPLAIN` & `PROFILE`)

File path: [`src/services/queryProfilerService.js`](../src/services/queryProfilerService.js)

Optimizing graph query performance requires analyzing query plans generated by the Cypher planner.

```text
Cypher Query Profiling Modes:

1. EXPLAIN
   ┌──────────────────────────────────────────────┐
   │ Logical Execution Plan Inspection            │
   │ (Runs without executing the query against DB)│
   └──────────────────────────────────────────────┘

2. PROFILE
   ┌──────────────────────────────────────────────┐
   │ Runtime Statistics & Execution Benchmark     │
   │ (Executes query; captures Execution Time,    │
   │  DB Hits, and Rows processed per operator)   │
   └──────────────────────────────────────────────┘
```

### Profiler Service Implementation:

```javascript
const { executeQuery } = require('../config/neo4j');

class QueryProfilerService {
  // 1. Run EXPLAIN (Plan inspection without execution)
  async explainQuery(cypher, params = {}) {
    const explainCypher = `EXPLAIN ${cypher}`;
    try {
      const result = await executeQuery(explainCypher, params);
      const plan = result.summary.plan;
      return {
        operatorType: plan ? plan.operatorType : 'Unknown',
        childrenCount: plan?.children?.length || 0,
        summaryText: `EXPLAIN plan analyzed. Operator: ${plan ? plan.operatorType : 'AllNodeScan'}`,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // 2. Run PROFILE (Execution + DB Hits statistics)
  async profileQuery(cypher, params = {}) {
    const profileCypher = `PROFILE ${cypher}`;
    try {
      const result = await executeQuery(profileCypher, params);
      const profile = result.summary.profile || result.summary.plan;
      const executionTimeMs = result.summary.resultAvailableAfter;

      return {
        executionTimeMs,
        dbHits: profile ? profile.dbHits || 0 : 0,
        rows: profile ? profile.rows || result.records.length : result.records.length,
        operatorType: profile ? profile.operatorType : 'Execution',
        recordsRetrieved: result.records.length,
        summaryText: `PROFILE executed in ${executionTimeMs} ms. Retrieved ${result.records.length} records.`,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // 3. Performance Benchmark Comparison
  async compareQueryPerformance(userName) {
    const query = `
      MATCH (u:User {name: $userName})-[:LIKES]->(h:Hotel)
      RETURN u.name AS user, h.businessName AS hotel, h.rating AS rating
    `;

    const explainResult = await this.explainQuery(query, { userName });
    const profileResult = await this.profileQuery(query, { userName });

    return {
      query,
      explain: explainResult,
      profile: profileResult,
    };
  }
}

module.exports = new QueryProfilerService();
```

---

## 4. DB Hits Optimization Metrics

When tuning Cypher queries, minimize **DB Hits**. A DB Hit represents an abstract unit of work where Neo4j reads or writes data in physical memory storage (e.g., fetching a node, expanding a relationship pointer, or reading a property key).

- **High DB Hits**: Indicates unindexed scans (`AllNodeScan`) or cartesian products (`CartesianProduct`).
- **Low DB Hits**: Indicates index lookup entry points (`NodeUniqueIndexSeek` or `NodeByLabelScan`) followed by direct index-free adjacency traversals.

---

## 5. Execution Demos

Run the GraphRAG and Profiling demonstration suites:

```bash
# Run GraphRAG Hybrid Context Retrieval & Safety Check
npm run demo:graphrag

# Run EXPLAIN & PROFILE Cypher Query Benchmarks
npm run demo:profiling
```

---

## 🏁 Summary

You have completed the **Week 06 Day 12 Implementation Guide**. You can now construct, traverse, optimize, and safely query production Neo4j Knowledge Graphs for Autonomous AI Agents!
