# 📜 Chapter 02 — Cypher Query Language Syntax & CRUD Operations

## 1. ASCII-Art Visual Syntax

Cypher uses visual ASCII art conventions:
- `()` represents a node.
- `[]` represents a relationship.
- `-->` or `<--` represents direction.
- `{}` represents properties.

```cypher
MATCH (u:User {name: "Alice"})-[:LIKES]->(h:Hotel)
RETURN u, h
```

---

## 2. Core Cypher Statements

### MATCH & WHERE
Used to search for graph patterns:
```cypher
MATCH (u:User)-[l:LIKES]->(h:Hotel)
WHERE h.rating >= 4.5 AND h.city = 'Paris'
RETURN u.name, h.businessName, l.rating
```

### CREATE
Instantiates new nodes and edges:
```cypher
CREATE (u:User {name: "Frank", age: 32})
```

### MERGE
Match or Create pattern idempotently:
```cypher
MERGE (u:User {name: $userName})
ON CREATE SET u.createdAt = timestamp()
ON MATCH SET u.lastLogin = timestamp()
```

### SET & REMOVE
Update properties or node labels:
```cypher
MATCH (u:User {id: $userId})
SET u.role = 'Architect', u:VipUser
REMOVE u.temporaryFlag
```

### DETACH DELETE
Deletes node and all associated edges:
```cypher
MATCH (u:User {id: $userId})
DETACH DELETE u
```
