const { executeQuery } = require('../config/neo4j');

/**
 * Service implementing GraphRAG (Hybrid Vector + Graph Traversal) and Text-to-Cypher Safety Validation
 */
class GraphRagService {
  /**
   * 1. Hybrid Retrieval (Vector Keyword Match / Embedding + Knowledge Graph Traversal)
   */
  async retrieveGraphRagContext(queryTerm, limit = 3) {
    // Cypher hybrid retrieval pattern: Find relevant Documents, then expand to related Topics, Categories, & Users
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
    return result.records.map((rec) => ({
      documentId: rec.get('documentId'),
      title: rec.get('title'),
      content: rec.get('content'),
      category: rec.get('category'),
      topics: rec.get('topics'),
      relatedMemories: rec.get('relatedMemories'),
      interestedUsers: rec.get('interestedUsers'),
    }));
  }

  /**
   * 2. Build Text-to-Cypher Prompt for LLM Translation
   */
  buildTextToCypherPrompt(userQuery) {
    const graphSchemaDescription = `
      Node Labels and Properties:
      - (:User {id, name, age, role})
      - (:Hotel {id, businessName, city, rating})
      - (:Company {id, name, industry})
      - (:Document {id, title, content, category})
      - (:Topic {id, name, description})
      - (:Memory {id, fact, interaction, createdAt})

      Relationship Types:
      - (:User)-[:KNOWS]->(:User)
      - (:User)-[:LIKES]->(:Hotel)
      - (:Hotel)-[:LOCATED_IN]->(:City)
      - (:User)-[:WORKS_AT]->(:Company)
      - (:Document)-[:HAS_TOPIC]->(:Topic)
      - (:User)-[:OBSERVED|PARTICIPATED_IN]->(:Memory)
    `;

    return `
      You are an expert Cypher Query Translator for Neo4j 5+.
      Given the graph schema below:
      ${graphSchemaDescription}

      Task: Translate the user's natural language request into a valid, safe, parameterized Cypher query.
      Rules:
      1. ONLY generate READ-ONLY queries starting with MATCH or WITH.
      2. Use parameter placeholders like $userName, $cityName instead of concatenating strings.
      3. Always RETURN meaningful properties or alias variables cleanly.

      User Query: "${userQuery}"
      Generated Cypher Query:
    `;
  }

  /**
   * 3. Cypher Safety Validator & Injection Protection
   * Ensures generated/untrusted Cypher queries are strictly read-only and safe to execute.
   */
  validateCypherSafety(cypherQuery) {
    if (typeof cypherQuery !== 'string' || !cypherQuery.trim()) {
      return { safe: false, reason: 'Empty or invalid query string.' };
    }

    const uppercaseCypher = cypherQuery.toUpperCase();

    // Blacklisted mutating/destructive operations
    const forbiddenKeywords = [
      'CREATE',
      'MERGE',
      'DELETE',
      'DETACH',
      'SET',
      'REMOVE',
      'DROP',
      'ALTER',
      'CALL DBMS',
      'CALL APOC.TRIGGER',
      'CALL APOC.CYPHER.RUNWRITE',
    ];

    for (const keyword of forbiddenKeywords) {
      if (uppercaseCypher.includes(keyword)) {
        return {
          safe: false,
          reason: `Security Violation: Mutating/Destructive keyword [${keyword}] is forbidden in read-only GraphRAG queries.`,
        };
      }
    }

    // Must start with read-only operations
    const trimmed = cypherQuery.trim();
    const validStarts = ['MATCH', 'WITH', 'OPTIONAL MATCH', 'EXPLAIN', 'PROFILE'];
    const startsValid = validStarts.some((keyword) =>
      trimmed.toUpperCase().startsWith(keyword)
    );

    if (!startsValid) {
      return {
        safe: false,
        reason: `Invalid Query: Read-only Cypher query must start with MATCH, OPTIONAL MATCH, WITH, EXPLAIN, or PROFILE.`,
      };
    }

    return { safe: true, reason: 'Query passed read-only safety checks.' };
  }

  /**
   * 4. Safe Execution of LLM-Generated Cypher Query
   */
  async executeSafeTextToCypher(cypherQuery, params = {}) {
    const safetyCheck = this.validateCypherSafety(cypherQuery);
    if (!safetyCheck.safe) {
      throw new Error(`[Security Block] ${safetyCheck.reason}`);
    }

    console.log(`🛡️ Executing Safe Read-Only Cypher Query:\n${cypherQuery}`);
    const result = await executeQuery(cypherQuery, params);
    return result.records.map((r) => r.toObject());
  }
}

module.exports = new GraphRagService();
