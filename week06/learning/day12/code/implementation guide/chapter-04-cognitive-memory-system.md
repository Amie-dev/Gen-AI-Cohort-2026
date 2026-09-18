# 📖 Chapter 04 — Cognitive AI Agent Memory System

## 1. Cognitive Memory Architecture for Autonomous AI Agents

Stateless LLM agent calls reset after every HTTP invocation or context window turnover. To achieve persistent, context-aware intelligence, Autonomous AI Agents require a structured **Cognitive Memory Architecture** backed by a knowledge graph.

Our graph memory model divides agent memory into three distinct layers:

```text
               ┌─────────────────────────────────────────┐
               │        (:User {id: "usr_alice"})        │
               └────────────────────┬────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │ -[:OBSERVED]->                                │ -[:PARTICIPATED_IN]->
            ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     (:FactualMemory)          │               │    (:EpisodicMemory)          │
├───────────────────────────────┤               ├───────────────────────────────┤
│ fact: "Alice prefers quiet    │               │ interaction: "Inquired about  │
│       hotels in Paris"        │               │ luxury hotels in session #102"│
│ confidence: 0.98              │               │ sessionID: "sess_102"         │
│ createdAt: 2026-09-01         │               │ decayFactor: 0.85             │
└───────────────┬───────────────┘               └───────────────┬───────────────┘
                │ -[:ABOUT_HOTEL]->                             │ -[:MENTIONS]->
                ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│           (:Hotel)            │               │           (:Topic)            │
└───────────────────────────────┘               └───────────────────────────────┘
```

### Memory Classification:
1. **Factual Memory (`:FactualMemory`)**: Immutable domain assertions, user preferences, and explicit facts extracted from user interactions (e.g., `"Alice prefers quiet hotels"`). Factual memories carry a `confidence` rating ($0.0 - 1.0$) and remain relatively stable over time.
2. **Episodic Memory (`:EpisodicMemory`)**: Temporal event logs capturing specific agent turn interactions, tool call parameters, or session events (e.g., `"Alice searched for luxury suites"`). Episodic memories are subject to exponential decay.
3. **Temporal Memory Subgraph**: Edges linking memories to entities (`-[:ABOUT_HOTEL]->`, `-[:MENTIONS]->`) allowing the graph to perform multi-hop memory retrieval based on topic relevance.

---

## 2. Mathematical Memory Decay Algorithm

Recent interactions should weigh more heavily during LLM context synthesis than stale past interactions. We implement an exponential memory decay engine calculated directly inside the Cypher query.

### Exponential Decay Formula:

$$\text{effectiveRelevanceScore} = \text{baseConfidence} \times (\text{decayFactor})^{\text{daysOld}}$$

Where:
- $\text{baseConfidence} \in [0.0, 1.0]$: Initial confidence or importance weight assigned at memory creation.
- $\text{decayFactor} \in (0.0, 1.0)$: Per-memory retention factor (e.g., $0.85$ for episodic events, $0.98$ for factual preferences).
- $\text{daysOld} = \text{duration.between}(m.\text{createdAt}, \text{datetime}()).\text{days}$: Temporal age in fractional days.

---

## 3. Cypher Temporal Decay Implementation

File path: [`src/services/cognitiveMemoryService.js`](../src/services/cognitiveMemoryService.js)

```javascript
const { executeQuery } = require('../config/neo4j');

class CognitiveMemoryService {
  // 1. Store a Factual Memory
  async storeFactualMemory(userId, factText, confidence = 0.95, targetEntityId = null) {
    const memoryId = `mem_fact_${Date.now()}`;
    const cypher = `
      MATCH (u:User {id: $userId})
      CREATE (m:Memory:FactualMemory {
        id: $memoryId,
        fact: $factText,
        confidence: $confidence,
        createdAt: datetime()
      })
      CREATE (u)-[:OBSERVED {created: timestamp()}]->(m)
      
      WITH m
      OPTIONAL MATCH (e {id: $targetEntityId})
      FOREACH (_ IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
        CREATE (m)-[:ABOUT_ENTITY]->(e)
      )
      RETURN m.id AS memoryId, m.fact AS fact, m.confidence AS confidence
    `;
    const result = await executeQuery(cypher, { userId, memoryId, factText, confidence, targetEntityId });
    return result.records[0]?.toObject();
  }

  // 2. Store an Episodic Interaction Memory
  async storeEpisodicMemory(userId, interactionText, sessionID, topicName = null) {
    const memoryId = `mem_ep_${Date.now()}`;
    const cypher = `
      MATCH (u:User {id: $userId})
      CREATE (m:Memory:EpisodicMemory {
        id: $memoryId,
        interaction: $interactionText,
        sessionID: $sessionID,
        createdAt: datetime(),
        decayFactor: 0.85
      })
      CREATE (u)-[:PARTICIPATED_IN]->(m)

      WITH m
      OPTIONAL MATCH (t:Topic {name: $topicName})
      FOREACH (_ IN CASE WHEN t IS NOT NULL THEN [1] ELSE [] END |
        CREATE (m)-[:MENTIONS]->(t)
      )
      RETURN m.id AS memoryId, m.interaction AS interaction
    `;
    const result = await executeQuery(cypher, { userId, memoryId, interactionText, sessionID, topicName });
    return result.records[0]?.toObject();
  }

  // 3. Retrieve Memories Ranked by Temporal Decay Score
  async retrieveActiveMemories(userId, maxMemories = 5) {
    const cypher = `
      MATCH (u:User {id: $userId})-[r:PARTICIPATED_IN|OBSERVED]->(m:Memory)
      OPTIONAL MATCH (m)-[:MENTIONS|ABOUT_ENTITY]->(target)
      
      WITH m, target,
           duration.between(m.createdAt, datetime()).days AS daysOld,
           coalesce(m.confidence, 1.0) AS baseConfidence,
           coalesce(m.decayFactor, 0.9) AS decayFactor
      
      WITH m, target, daysOld,
           baseConfidence * (decayFactor ^ daysOld) AS effectiveRelevanceScore
      
      RETURN
        m.id AS memoryId,
        labels(m) AS memoryTypes,
        coalesce(m.fact, m.interaction) AS content,
        m.createdAt AS createdAt,
        daysOld,
        effectiveRelevanceScore
      ORDER BY effectiveRelevanceScore DESC, createdAt DESC
      LIMIT toInteger($maxMemories)
    `;

    const result = await executeQuery(cypher, { userId, maxMemories });
    return result.records.map(rec => ({
      memoryId: rec.get('memoryId'),
      memoryTypes: rec.get('memoryTypes'),
      content: rec.get('content'),
      createdAt: rec.get('createdAt').toString(),
      daysOld: rec.get('daysOld').toNumber ? rec.get('daysOld').toNumber() : rec.get('daysOld'),
      effectiveRelevanceScore: parseFloat(rec.get('effectiveRelevanceScore').toFixed(4)),
    }));
  }

  // 4. Construct Structured Prompt Context for LLMs
  async buildAgentContextForUser(userId) {
    const cypher = `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[l:LIKES]->(h:Hotel)
      WITH u, collect({hotel: h.businessName, city: h.city, rating: h.rating}) AS likedHotels
      
      OPTIONAL MATCH (u)-[:OBSERVED]->(fm:FactualMemory)
      WITH u, likedHotels, collect(fm.fact) AS facts

      OPTIONAL MATCH (u)-[:PARTICIPATED_IN]->(em:EpisodicMemory)
      WITH u, likedHotels, facts, collect(em.interaction) AS recentInteractions

      RETURN
        u.name AS name,
        u.role AS role,
        likedHotels,
        facts,
        recentInteractions
    `;
    const result = await executeQuery(cypher, { userId });
    return result.records[0]?.toObject();
  }
}

module.exports = new CognitiveMemoryService();
```

---

## 4. LLM Prompt Context Construction Flow

The memory service turns raw graph traversals into a clean JSON string ready to be injected into an OpenAI/Anthropic System Prompt:

```json
{
  "userName": "Alice",
  "userRole": "AI Architect",
  "likedHotels": [
    { "hotel": "Grand Plaza", "city": "Paris", "rating": 4.9 }
  ],
  "facts": [
    "Alice prefers quiet hotels with high ratings in Paris"
  ],
  "recentInteractions": [
    "Alice inquired about luxury hotels in Paris during session #102"
  ]
}
```

---

## 5. Execution Demo

File path: [`src/demos/demo-04-agent-memory.js`](../src/demos/demo-04-agent-memory.js)

Run the Agent Cognitive Memory demonstration:
```bash
npm run demo:memory
```

Proceed to [Chapter 05 — GraphRAG Hybrid Retrieval & Query Profiling](chapter-05-graphrag-and-profiling.md) for vector + graph context expansion and performance benchmarking.
