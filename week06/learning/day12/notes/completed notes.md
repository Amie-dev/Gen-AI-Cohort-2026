# 📚 Week 06 — Day 12 Master Notes

# Graph Databases, Cypher Query Language & Neo4j Integration

> **Overview:** Day 12 focuses on **Graph Databases**, **Cypher Query Language**, **Neo4j Engine Architecture & Docker/Cloud Deployments**, **Node.js Integration via `neo4j-driver`**, and **GraphRAG & AI Agent Memory Systems**.

---

## 📑 Notes Structure & Links

### 🕸️ Core Class Modules (`/notes/`)

1. 📄 **[01 — Graph Database Fundamentals & Cognitive Memory Architecture](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/notes/01-graph-database-fundamentals-and-memory-architecture.md)**
   - What is a Graph DB? Nodes, Edges, Properties, Labels
   - In-Memory vs. Persistent Databases
   - Human Cognitive Memory: Key-Value vs. Connected/Relational Memory (Factual & Episodic)
   - Paradigm Comparison: SQL (Junction tables) vs. NoSQL (Embedded links) vs. Native Graph DB (Index-Free Adjacency)

2. 📄 **[02 — Cypher Query Language Syntax & Pattern Guide](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/notes/02-cypher-query-language-syntax-and-patterns.md)**
   - ASCII-Art pattern notation: `()`, `[]`, `-->`
   - Cypher CRUD Statements: `MATCH`, `CREATE`, `MERGE`, `SET`, `REMOVE`, `DELETE`, `DETACH DELETE`
   - Pattern Filtering with `WHERE`, Regex, and Aggregations (`count`, `collect`)
   - Variable-Length Traversal Paths (`*1..3`) and SQL vs Cypher comparative table

3. 📄 **[03 — Neo4j Architecture, Deployment & LLM Cypher Integration](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/notes/03-neo4j-architecture-deployment-and-llm-integration.md)**
   - Neo4j Engine Architecture: Bolt Protocol (Port 7687), Cypher Compiler, ACID Tx Manager, Native Graph Store
   - Deployment options: Neo4j Aura Cloud vs. Local Docker Container (`docker run -p 7474:7474 -p 7687:7687`)
   - Visualization tools: Neo4j Browser & Neo4j Bloom
   - LLMs & Text-to-Cypher translation, Knowledge Graphs, and GraphRAG

4. 📄 **[04 — Building Neo4j Applications with Node.js Driver](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/notes/04-building-neo4j-applications-with-nodejs-driver.md)**
   - Official package: `npm i neo4j-driver`
   - Connection lifecycle & `driver.getServerInfo()`
   - Parameterized query execution with `driver.executeQuery()` to prevent Cypher injection
   - Session & transaction management (`executeWrite` / `executeRead`) and clean driver shutdown

5. 📄 **[05 — Advanced Graph Data Modeling, GraphRAG & AI Agent Memory Systems](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/notes/05-advanced-graph-modeling-graphrag-and-memory-systems.md)**
   - Graph Modeling rules: Nodes vs Properties
   - Traversal algorithms: Breadth-First Search (BFS) vs. Depth-First Search (DFS)
   - Shortest Path discovery & Memory Decay representation
   - Hybrid Vector Search + Knowledge Graph traversals (Neo4j 5+ Vector Indexes) and Query Profiling (`EXPLAIN` / `PROFILE`)

6. 📄 **[completed notes with code.md — Single File Comprehensive Master Reference](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/notes/completed%20notes%20with%20code.md)**
   - Complete unified deep-dive handbook combining concepts, diagrams, full Node.js & Cypher codebase walkthrough, and master interview Q&A.

7. 📄 **[Interview.md — Comprehensive Interview Questions & Answers](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/notes/Interview.md)**
   - In-depth technical interview guide covering 25+ questions on Graph DBs, Cypher, Neo4j, Node.js driver, and GraphRAG.

8. 📄 **[interview01.md — Focused Interview Reference Guide](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/notes/interview01.md)**
   - Concise executive Q&A reference covering core Day 12 learning objectives.

---

## 🧪 Code Directory (`/code/`)

All sample and reference implementations are located in:
👉 **[day12 code directory](file:///home/aminul/development/gen-ai-cohort/week06/learning/day12/code)**
