# 🤖 Graph Databases & Cypher Queries — Comprehensive Interview Questions & Answers

### Topics Covered: Graph DB Architecture, Index-Free Adjacency, Cypher Query Language, Neo4j Engine, Node.js Driver (`neo4j-driver`), Parameterized Queries, GraphRAG, and AI Agent Memory Systems.

---

## Section 1: Graph Database Fundamentals & Cognitive Architecture

### Q1. What is a Graph Database and how does it differ from a Relational Database (RDBMS)?
**Answer:**
A Graph Database is a purpose-built database engine designed to store entities as **Nodes** and relationships between entities as **Edges** with index-free adjacency.

* **RDBMS:** Stores data in normalized tables. Relationships are implicit and calculated at query time via Foreign Keys and costly JOIN operations.
* **Graph DB:** Stores relationships explicitly alongside node data on disk/memory. Querying connected entities dereferences memory pointers directly in $\mathcal{O}(1)$ time per hop, rather than executing expensive join scans across entire tables.

---

### Q2. What is Index-Free Adjacency? Why is it crucial for performance?
**Answer:**
Index-Free Adjacency means every node in a graph database maintains direct memory pointers to its adjacent edge and neighbor node records.

**Why it matters:**
In a traditional SQL database, looking up a record joined across tables requires searching a global index (e.g. B-Tree index lookup $\mathcal{O}(\log N)$). In a native graph database, once the starting node is located, traversing through connected edges relies solely on pointer dereferencing ($\mathcal{O}(1)$ constant time per relationship step), regardless of whether the database contains 1,000 nodes or 10 billion nodes.

---

### Q3. Why is flat Key-Value memory insufficient for complex AI Agent architectures?
**Answer:**
Flat Key-Value stores (like Redis) work well for scalar preferences (e.g., `user_theme = "dark"`), but fail to model human-like associative cognition.

Human brain memory relies on **Relational and Connected Memory** (Factual & Episodic memory), where thinking of one concept automatically triggers associated ideas, locations, people, and past events. A Graph DB allows AI agents to store dynamic subgraphs of knowledge, perform multi-hop reasoning, and decay or reinforce relationship weights over time.

---

### Q4. Can you model a graph in SQL? What are the limitations?
**Answer:**
Yes. You can model a graph in SQL using a **Junction/Mapping table**:
```sql
CREATE TABLE relationships (
    from_id INT,
    to_id INT,
    relation_type VARCHAR(50)
);
```

**Limitations:**
1. **Exponential JOIN Overhead:** To find friends of friends of friends ($3$-hop search), SQL requires 3 self-joins on giant mapping tables, causing query latency to scale exponentially $\mathcal{O}(R^N)$.
2. **Rigid Schema:** SQL tables require pre-defined schemas, making dynamic entity relationships difficult to adapt.
3. **Lack of Graph Syntax & Algorithms:** SQL lacks native language constructs for Breadth-First Search (BFS), Depth-First Search (DFS), and shortest path algorithms.

---

## Section 2: Cypher Query Language Deep Dive

### Q5. Explain the ASCII-art pattern syntax used in Cypher.
**Answer:**
Cypher uses ASCII art to represent visual graph structures:
* Parentheses `()` represent **Nodes**: `(u:User {name: "Alice"})`
* Square brackets `[]` represent **Relationships**: `-[r:LIKES {since: 2026}]->`
* Hyphens and arrows `--`, `-->`, `<--` represent **Directional Connections**.

Example:
```cypher
MATCH (u:User {name: "Alice"})-[r:LIKES]->(h:Hotel)
RETURN u, r, h;
```

---

### Q6. What is the difference between `CREATE` and `MERGE` in Cypher?
**Answer:**
* **`CREATE`**: Always creates a new node or relationship in the database, even if an identical entity already exists (can cause duplicate nodes).
* **`MERGE`**: Performs an **idempotent match-or-create** operation. It searches for the specified pattern first; if found, it matches it. If not found, it creates it. `MERGE` supports `ON CREATE SET` and `ON MATCH SET` clauses.

---

### Q7. Why does `DELETE` fail on nodes with connected relationships? How do you solve this?
**Answer:**
Neo4j enforces referential graph integrity. Deleting a node while leaving dangling relationships is forbidden.

**Solution:**
Use **`DETACH DELETE`**, which automatically deletes all incoming and outgoing relationships connected to the target node before deleting the node itself:
```cypher
MATCH (u:User {name: "Alice"})
DETACH DELETE u;
```

---

### Q8. How do you query variable-length path traversals in Cypher?
**Answer:**
Use range asterisks `[*minHops..maxHops]` inside relationship brackets:
```cypher
// Find friends of friends up to 3 hops away
MATCH path = (a:User {name: "Alice"})-[:KNOWS*1..3]->(f:User)
RETURN f.name, length(path) AS Hops;
```

---

## Section 3: Neo4j Architecture & Deployment

### Q9. Describe the key architectural components of Neo4j.
**Answer:**
1. **Bolt Protocol Layer (Port 7687):** High-performance binary communication protocol between application clients and database.
2. **Cypher Execution Engine:** Compiles Cypher queries into physical execution plans (index lookup, BFS/DFS traversal).
3. **Transaction Manager:** Guarantees strict **ACID** properties for write operations.
4. **Native Graph Storage Engine:** Stores nodes, relationships, labels, and properties in specialized fixed-size binary records with pointer chains.

---

### Q10. What are the key ports used by Neo4j in a Docker deployment?
**Answer:**
* **Port `7474` (HTTP):** Used for accessing the Neo4j Browser Web UI (`http://localhost:7474`).
* **Port `7687` (Bolt):** Used by database drivers (`neo4j-driver` in Node.js, Python driver) for binary RPC database queries.

```bash
docker run -d -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:latest
```

---

## Section 4: Node.js Driver & Security Practices

### Q11. How do you execute parameterized queries using `neo4j-driver`?
**Answer:**
Using `driver.executeQuery()` with a parameters object:
```javascript
const query = `
  MATCH (u:User {name: $userName})-[r:LIKES]->(h:Hotel)
  RETURN h.businessName AS hotelName
`;

const params = { userName: 'Alice' };

const { records } = await driver.executeQuery(query, params, { database: 'neo4j' });
```

---

### Q12. What is Cypher Injection and how do you protect Node.js applications against it?
**Answer:**
Cypher Injection occurs when raw user input is concatenated directly into Cypher string queries (e.g. `` `MATCH (u:User {name: '${input}'})` ``), allowing malicious actors to alter query logic or wipe nodes via `DETACH DELETE`.

**Protection:**
Always use **Parameterized Queries** (`$paramName`). Parameters are passed separately to the database engine, treating user input purely as literal data values and enabling execution plan caching.

---

### Q13. What is the difference between `driver.executeQuery()` and explicit session management (`driver.session()`)?
**Answer:**
* **`driver.executeQuery()`:** Higher-level API introduced in driver v5+. Automatically acquires a session from the connection pool, executes the statement, handles parameters, and closes the session.
* **`driver.session()`:** Lower-level API used when you need explicit control over read/write transactions (`session.executeWrite()`), multi-statement ACID transactions, or custom transaction configuration.

---

## Section 5: GraphRAG & AI Agent Memory Systems

### Q14. What is GraphRAG? How does it improve upon standard Vector RAG?
**Answer:**
**GraphRAG** combines dense Vector Embeddings with Knowledge Graphs.
* **Standard Vector RAG:** Searches top-$K$ text chunks based on semantic cosine similarity. It struggles with global questions or multi-hop factual connections.
* **GraphRAG:** Uses vector search to locate entry anchor nodes in a Graph DB, then executes multi-hop Cypher traversals to pull connected facts, context, and relationships, yielding precise, structured reasoning.

---

### Q15. How do you implement Vector Search inside Neo4j 5+?
**Answer:**
Using Neo4j's native Vector Indexes:
```cypher
// 1. Create Vector Index
CREATE VECTOR INDEX doc_embeddings IF NOT EXISTS
FOR (d:Document) ON (d.embedding)
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' }};

// 2. Query Vector Index in Cypher
CALL db.index.vector.queryNodes('doc_embeddings', 5, $queryVector)
YIELD node AS doc, score
MATCH (doc)-[:BELONGS_TO]->(c:Category)
RETURN doc.title, c.name, score;
```
