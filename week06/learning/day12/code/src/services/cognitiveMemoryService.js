const { executeQuery } = require('../config/neo4j');

/**
 * Service implementing Cognitive & AI Agent Memory System
 * Covers Factual Memory, Episodic Memory, Temporal Memory, and Memory Decay Retrieval
 */
class CognitiveMemoryService {
  /**
   * 1. Store a Factual Memory (e.g., preference, factual assertion)
   */
  async storeFactualMemory(userId, factText, confidence = 0.95, targetEntity = null) {
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

    const params = { userId, memoryId, factText, confidence, targetEntityId: targetEntity };
    const result = await executeQuery(cypher, params);
    const rec = result.records[0];
    return {
      memoryId: rec.get('memoryId'),
      fact: rec.get('fact'),
      confidence: rec.get('confidence'),
    };
  }

  /**
   * 2. Store an Episodic Memory (Interaction event, user message, or agent turn)
   */
  async storeEpisodicMemory(userId, interactionText, sessionID, topicName = null) {
    const memoryId = `mem_ep_${Date.now()}`;
    const cypher = `
      MATCH (u:User {id: $userId})
      CREATE (m:Memory:EpisodicMemory {
        id: $memoryId,
        interaction: $interactionText,
        sessionID: $sessionID,
        createdAt: datetime(),
        decayFactor: 1.0
      })
      CREATE (u)-[:PARTICIPATED_IN]->(m)

      WITH m
      OPTIONAL MATCH (t:Topic {name: $topicName})
      FOREACH (_ IN CASE WHEN t IS NOT NULL THEN [1] ELSE [] END |
        CREATE (m)-[:MENTIONS]->(t)
      )

      RETURN m.id AS memoryId, m.interaction AS interaction, m.sessionID AS sessionID
    `;

    const params = { userId, memoryId, interactionText, sessionID, topicName };
    const result = await executeQuery(cypher, params);
    const rec = result.records[0];
    return {
      memoryId: rec.get('memoryId'),
      interaction: rec.get('interaction'),
      sessionID: rec.get('sessionID'),
    };
  }

  /**
   * 3. Retrieve Agent Memories with Temporal Decay Calculation
   * Formula: calculatedScore = baseScore * (decayFactor ^ daysOld)
   */
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
    return result.records.map((rec) => ({
      memoryId: rec.get('memoryId'),
      memoryTypes: rec.get('memoryTypes'),
      content: rec.get('content'),
      createdAt: rec.get('createdAt').toString(),
      daysOld: rec.get('daysOld').toNumber ? rec.get('daysOld').toNumber() : rec.get('daysOld'),
      effectiveRelevanceScore: parseFloat(rec.get('effectiveRelevanceScore').toFixed(4)),
    }));
  }

  /**
   * 4. Construct Structured Prompt Context from Factual & Episodic Knowledge Graph
   */
  async buildAgentContextForUser(userId) {
    const cypher = `
      MATCH (u:User {id: $userId})
      
      // Get User Profile & Likes
      OPTIONAL MATCH (u)-[l:LIKES]->(h:Hotel)
      WITH u, collect({hotel: h.businessName, city: h.city, rating: h.rating}) AS likedHotels
      
      // Get Factual Memories
      OPTIONAL MATCH (u)-[:OBSERVED]->(fm:FactualMemory)
      WITH u, likedHotels, collect(fm.fact) AS facts

      // Get Recent Episodic Interactions
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
    if (result.records.length === 0) return null;

    const rec = result.records[0];
    return {
      userName: rec.get('name'),
      userRole: rec.get('role'),
      likedHotels: rec.get('likedHotels'),
      facts: rec.get('facts'),
      recentInteractions: rec.get('recentInteractions'),
    };
  }
}

module.exports = new CognitiveMemoryService();
