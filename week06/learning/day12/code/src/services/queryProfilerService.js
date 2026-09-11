const { executeQuery } = require('../config/neo4j');

/**
 * Service for Profiling Cypher Queries using EXPLAIN and PROFILE
 */
class QueryProfilerService {
  /**
   * 1. Run EXPLAIN on a Cypher Query (Planner inspection without execution)
   */
  async explainQuery(cypher, params = {}) {
    const explainCypher = `EXPLAIN ${cypher}`;
    try {
      const result = await executeQuery(explainCypher, params);
      const plan = result.summary.plan;
      return {
        operatorType: plan ? plan.operatorType : 'Unknown',
        arguments: plan ? plan.arguments : {},
        childrenCount: plan && plan.children ? plan.children.length : 0,
        summaryText: `EXPLAIN analyzed plan for query. Operator: ${plan ? plan.operatorType : 'AllNodeScan'}`,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 2. Run PROFILE on a Cypher Query (Execution + Runtime Performance Statistics)
   */
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
        summaryText: `PROFILE executed query in ${executionTimeMs} ms. Retrieved ${result.records.length} records.`,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 3. Performance Optimization Comparison (Unindexed vs Index-Backed Query)
   */
  async compareQueryPerformance(userName) {
    const query = `
      MATCH (u:User {name: $userName})-[:LIKES]->(h:Hotel)
      RETURN u.name AS user, h.businessName AS hotel, h.rating AS rating
    `;

    console.log(`\n🔍 Profiling Cypher Query performance for user: "${userName}"...`);

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
