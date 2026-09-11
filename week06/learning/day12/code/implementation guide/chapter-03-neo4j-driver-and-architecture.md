# 🔌 Chapter 03 — Neo4j Engine Architecture & Node.js Driver Integration

## 1. Neo4j Architecture

- **Bolt Protocol (7687)**: Binary, multiplexed, low-latency protocol over TCP.
- **Neo4j Browser UI (7474)**: Web interactive interface for visual graph exploration.
- **Cypher Compiler & Execution Engine**: Parses Cypher text into optimized query execution plans.

---

## 2. Official Node.js Driver (`neo4j-driver`)

```javascript
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password123')
);
```

### Parameterized Execution Strategy:
Never string concatenate variables into Cypher! Always use `$parameter` placeholders:

```javascript
// ✅ Safe Parameterized Execution
const result = await driver.executeQuery(
  'MATCH (u:User {name: $userName}) RETURN u',
  { userName: 'Alice' }
);
```

### Transaction Management (`executeWrite` / `executeRead`):
```javascript
const session = driver.session();
try {
  await session.executeWrite(async (tx) => {
    await tx.run('MERGE (u:User {id: $id})', { id: 'usr_101' });
  });
} finally {
  await session.close();
}
```
