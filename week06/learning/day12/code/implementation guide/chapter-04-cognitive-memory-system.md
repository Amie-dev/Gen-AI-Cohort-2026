# 🧠 Chapter 04 — Cognitive AI Agent Memory Architecture

## 1. Human Cognitive Memory vs Graph Memory

Human cognitive memory stores connected factual and episodic experiences rather than flat key-value pairs.

```text
       ┌────────────────────────┐
       │ Factual Memory Node    │  (Long-term preference/fact)
       └───────────┬────────────┘
                   │
                   ▼ OBSERVED
       ┌────────────────────────┐
       │   User Node [Alice]    │
       └───────────┬────────────┘
                   │
                   ▼ PARTICIPATED_IN
       ┌────────────────────────┐
       │ Episodic Memory Node   │  (Interaction Event with timestamp)
       └────────────────────────┘
```

---

## 2. Memory Decay Algorithm

Memories naturally decay over time unless reinforced. The effective relevance score is computed in Cypher:

$$\text{effectiveRelevanceScore} = \text{baseConfidence} \times (\text{decayFactor})^{\text{daysOld}}$$

```cypher
MATCH (u:User {id: $userId})-[r]->(m:Memory)
WITH m,
     duration.between(m.createdAt, datetime()).days AS daysOld,
     coalesce(m.confidence, 1.0) AS baseConfidence,
     coalesce(m.decayFactor, 0.9) AS decayFactor

WITH m, daysOld,
     baseConfidence * (decayFactor ^ daysOld) AS effectiveRelevanceScore

RETURN m.fact, effectiveRelevanceScore
ORDER BY effectiveRelevanceScore DESC
```
