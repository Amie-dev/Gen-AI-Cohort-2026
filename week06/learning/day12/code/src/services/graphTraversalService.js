const { executeQuery } = require('../config/neo4j');

/**
 * Service handling Advanced Graph Traversals, Multi-Hop Paths, and Graph Algorithms
 */
class GraphTraversalService {
  /**
   * 1. Multi-Hop Traversal (Friends of Friends within 1 to 3 hops)
   */
  async findNetworkReach(startUserName, maxHops = 3) {
    const cypher = `
      MATCH path = (start:User {name: $startUserName})-[:KNOWS*1..${maxHops}]-(reached:User)
      WHERE start <> reached
      RETURN
        reached.name AS reachedUser,
        reached.role AS role,
        length(path) AS distance,
        [node IN nodes(path) | node.name] AS traversalPath
      ORDER BY distance ASC, reachedUser ASC
    `;

    const result = await executeQuery(cypher, { startUserName });
    return result.records.map((rec) => ({
      reachedUser: rec.get('reachedUser'),
      role: rec.get('role'),
      distance: rec.get('distance').toNumber ? rec.get('distance').toNumber() : rec.get('distance'),
      traversalPath: rec.get('traversalPath'),
    }));
  }

  /**
   * 2. Shortest Path Discovery between two users
   */
  async findShortestPath(user1Name, user2Name) {
    const cypher = `
      MATCH (u1:User {name: $user1Name}), (u2:User {name: $user2Name})
      MATCH p = shortestPath((u1)-[*]-(u2))
      RETURN
        length(p) AS hopCount,
        [n IN nodes(p) | labels(n)[0] + ': ' + coalesce(n.name, n.businessName, n.title, n.id)] AS nodesInPath,
        [r IN relationships(p) | type(r)] AS relationshipTypes
    `;

    const result = await executeQuery(cypher, { user1Name, user2Name });
    if (result.records.length === 0) return null;

    const rec = result.records[0];
    return {
      hopCount: rec.get('hopCount').toNumber ? rec.get('hopCount').toNumber() : rec.get('hopCount'),
      nodesInPath: rec.get('nodesInPath'),
      relationshipTypes: rec.get('relationshipTypes'),
    };
  }

  /**
   * 3. Entity Connection Discovery (Traverse from User -> Memory -> Topic -> Document)
   */
  async discoverRelatedKnowledge(userName) {
    const cypher = `
      MATCH (u:User {name: $userName})-[:PARTICIPATED_IN|OBSERVED]->(m:Memory)-[:MENTIONS]->(t:Topic)
      MATCH (doc:Document)-[:HAS_TOPIC]->(t)
      RETURN
        u.name AS userName,
        m.id AS memoryId,
        t.name AS topicName,
        doc.title AS documentTitle,
        doc.category AS docCategory
    `;

    const result = await executeQuery(cypher, { userName });
    return result.records.map((r) => ({
      userName: r.get('userName'),
      memoryId: r.get('memoryId'),
      topicName: r.get('topicName'),
      documentTitle: r.get('documentTitle'),
      docCategory: r.get('docCategory'),
    }));
  }

  /**
   * 4. Node Degree & Connectivity Analysis (Find most connected entities)
   */
  async getCentralityMetrics() {
    const cypher = `
      MATCH (n)
      WHERE n:User OR n:Company OR n:Hotel OR n:Topic
      OPTIONAL MATCH (n)-[r]-()
      RETURN
        id(n) AS nodeInternalId,
        labels(n)[0] AS nodeLabel,
        coalesce(n.name, n.businessName, n.title, n.id) AS nodeIdentifier,
        count(r) AS degree
      ORDER BY degree DESC
      LIMIT 10
    `;

    const result = await executeQuery(cypher);
    return result.records.map((rec) => ({
      nodeLabel: rec.get('nodeLabel'),
      nodeIdentifier: rec.get('nodeIdentifier'),
      degree: rec.get('degree').toNumber ? rec.get('degree').toNumber() : rec.get('degree'),
    }));
  }

  /**
   * 5. Conceptual Breadth-First Search (BFS) Simulation in Node.js over graph connections
   */
  async breadthFirstSearchSimulation(startNodeId, maxDepth = 2) {
    const visited = new Set();
    const queue = [{ id: startNodeId, depth: 0 }];
    const traversalLog = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.id) || current.depth > maxDepth) continue;
      visited.add(current.id);

      // Fetch immediate neighbors using 1-hop Index-Free Adjacency Cypher
      const cypher = `
        MATCH (curr {id: $id})-[r]-(neighbor)
        RETURN
          coalesce(curr.name, curr.businessName, curr.id) AS currName,
          type(r) AS relType,
          neighbor.id AS neighborId,
          coalesce(neighbor.name, neighbor.businessName, neighbor.title, neighbor.id) AS neighborName,
          labels(neighbor)[0] AS neighborLabel
      `;

      const res = await executeQuery(cypher, { id: current.id });
      for (const rec of res.records) {
        const neighborId = rec.get('neighborId');
        traversalLog.push({
          from: rec.get('currName'),
          rel: rec.get('relType'),
          to: rec.get('neighborName'),
          label: rec.get('neighborLabel'),
          depth: current.depth + 1,
        });

        if (neighborId && !visited.has(neighborId) && current.depth + 1 <= maxDepth) {
          queue.push({ id: neighborId, depth: current.depth + 1 });
        }
      }
    }

    return traversalLog;
  }
}

module.exports = new GraphTraversalService();
