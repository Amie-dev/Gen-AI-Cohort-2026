# 🕸️ Week 06 — Day 12: Graph Databases, Cypher & Neo4j Integration

Master implementation codebase for **Graph Databases**, **Cypher Query Language**, **Neo4j Node.js Driver**, **AI Agent Cognitive Memory System (Factual, Episodic, Temporal)**, **GraphRAG Hybrid Retrieval**, and **Query Profiling**.

---

## 📁 Repository Structure

```text
week06/learning/day12/code/
├── docker-compose.yml              # Neo4j 5.x Docker container setup (Ports 7474, 7687)
├── .env.example                    # Environment variable configuration template
├── .env                            # Active environment configuration
├── package.json                    # Project dependencies and script commands
├── index.js                        # Master CLI application entry point
├── explanations code.md            # Comprehensive line-by-line code explanation handbook
│
├── src/
│   ├── config/
│   │   └── neo4j.js                # Neo4j driver connection pool & lifecycle manager
│   ├── db/
│   │   ├── constraintsAndIndexes.js # Schema uniqueness constraints & index creation
│   │   └── seed.js                 # Knowledge graph dataset seed script
│   ├── services/
│   │   ├── cypherCrudService.js    # Parameterized CRUD operations & write transactions
│   │   ├── graphTraversalService.js# Multi-hop traversals, shortest path, & BFS simulation
│   │   ├── cognitiveMemoryService.js# Factual, Episodic, & Temporal memory decay engine
│   │   ├── graphRagService.js      # Vector + Graph hybrid retrieval & Cypher safety validator
│   │   └── queryProfilerService.js # EXPLAIN and PROFILE query performance analyzer
│   └── demos/
│       ├── demo-01-fundamentals.js # Graph DB & Index-Free Adjacency demonstration
│       ├── demo-02-cypher-crud.js    # Cypher CRUD & parameterized queries demo
│       ├── demo-03-traversals.js     # Multi-hop paths & graph centrality demo
│       ├── demo-04-agent-memory.js   # Cognitive memory decay & AI context demo
│       ├── demo-05-graphrag.js       # GraphRAG & Cypher injection validator demo
│       └── demo-06-profiling.js      # EXPLAIN & PROFILE query performance demo
│
└── implementation guide/
    ├── README.md                   # Implementation Guide Overview
    ├── chapter-01-graph-fundamentals.md
    ├── chapter-02-cypher-syntax-and-crud.md
    ├── chapter-03-neo4j-driver-and-architecture.md
    ├── chapter-04-cognitive-memory-system.md
    └── chapter-05-graphrag-and-profiling.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **Docker & Docker Compose**: For local Neo4j database instance

### 2. Launch Neo4j Container
Spin up local Neo4j 5.x database with APOC plugin:

```bash
docker compose up -d
```

Access Neo4j Browser UI at: `http://localhost:7474`
- **Username**: `neo4j`
- **Password**: `password123`

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Master Demo
```bash
npm start
```

---

## 🧪 Individual Demo Commands

| Command | Description |
| :--- | :--- |
| `npm run seed` | Seed Neo4j database with sample knowledge graph |
| `npm run demo:all` | Run all 6 interactive demonstrations end-to-end |
| `npm run demo:cypher` | Run Cypher CRUD & Parameterized Query demo |
| `npm run demo:traversals` | Run Multi-Hop Paths & BFS Traversal demo |
| `npm run demo:memory` | Run Cognitive Memory Decay & Agent Context demo |
| `npm run demo:graphrag` | Run GraphRAG Hybrid Retrieval & Safety Validator demo |
| `npm run demo:profiling` | Run EXPLAIN & PROFILE Query Performance demo |

---

## 🧠 Key Features Implemented

1. **Index-Free Adjacency & Native Graph Engine**: Directly following pointers between connected nodes without costly SQL table JOINs.
2. **Parameterized Cypher Operations**: Safe query execution preventing Cypher injection attacks using `$param` placeholders.
3. **Cognitive AI Memory System**:
   - **Factual Memory**: Storing user preferences and entity facts as graph nodes.
   - **Episodic & Temporal Memory**: Capturing user interactions with timestamps (`createdAt`) and time decay calculations.
4. **GraphRAG & Text-to-Cypher Safety**:
   - Hybrid retrieval combining text/vector similarity with graph traversal expansion.
   - Security validator ensuring untrusted LLM-generated Cypher queries are strictly read-only (`MATCH`, `WITH`).
5. **Query Profiling**: Utilizing `EXPLAIN` (plan analysis) and `PROFILE` (dbHits & execution timing).
