const { executeQuery, getSession } = require('../config/neo4j');

/**
 * Service demonstrating core Cypher CRUD Operations in Node.js with Parameterized Queries
 */
class CypherCrudService {
  /**
   * 1. CREATE Operation: Create a new User node safely using parameters
   */
  async createUser(userParams) {
    const cypher = `
      CREATE (u:User {
        id: $id,
        name: $name,
        age: $age,
        role: $role,
        createdAt: timestamp()
      })
      RETURN u
    `;

    const result = await executeQuery(cypher, userParams);
    const record = result.records[0];
    const createdNode = record ? record.get('u').properties : null;
    return {
      node: createdNode,
      updates: result.summary.counters.updates(),
    };
  }

  /**
   * 2. MERGE Operation: Match or Create a Hotel node and form a LIKES relationship with a User
   */
  async mergeUserLikesHotel(userName, hotelData) {
    const cypher = `
      MERGE (u:User {name: $userName})

      MERGE (h:Hotel {businessName: $hotelName})
      ON CREATE SET
        h.id = $hotelId,
        h.city = $city,
        h.rating = $rating,
        h.createdAt = timestamp()
      ON MATCH SET
        h.rating = $rating,
        h.updatedAt = timestamp()

      MERGE (u)-[r:LIKES]->(h)
      ON CREATE SET r.since = date().year, r.rating = $rating
      ON MATCH SET r.lastUpdated = timestamp()

      RETURN u.name AS userName, h.businessName AS hotelName, h.city AS city, h.rating AS rating, r.since AS likeSince
    `;

    const params = {
      userName,
      hotelId: hotelData.id || `htl_${Date.now()}`,
      hotelName: hotelData.businessName,
      city: hotelData.city,
      rating: hotelData.rating,
    };

    const result = await executeQuery(cypher, params);
    const records = result.records.map((rec) => ({
      userName: rec.get('userName'),
      hotelName: rec.get('hotelName'),
      city: rec.get('city'),
      rating: rec.get('rating'),
      likeSince: rec.get('likeSince'),
    }));

    return {
      records,
      updates: result.summary.counters.updates(),
    };
  }

  /**
   * 3. READ Operation with Filtering & Aggregation: Find hotels liked by a user or their friends
   */
  async findHotelsLikedByFriends(userName) {
    const cypher = `
      MATCH (u:User {name: $userName})-[:KNOWS*1..2]-(friend:User)
      MATCH (friend)-[l:LIKES]->(h:Hotel)
      WHERE h.rating >= $minRating
      RETURN
        friend.name AS friendName,
        h.businessName AS hotelName,
        h.city AS city,
        h.rating AS rating,
        l.rating AS userRating
      ORDER BY h.rating DESC
    `;

    const result = await executeQuery(cypher, { userName, minRating: 4.0 });
    return result.records.map((r) => ({
      friendName: r.get('friendName'),
      hotelName: r.get('hotelName'),
      city: r.get('city'),
      rating: r.get('rating'),
      userRating: r.get('userRating'),
    }));
  }

  /**
   * 4. UPDATE Operation using SET and REMOVE: Update user properties or labels
   */
  async updateUserRoleAndAddLabel(userId, newRole, addVipLabel = false) {
    let labelCypher = addVipLabel ? 'SET u:VipUser' : '';
    const cypher = `
      MATCH (u:User {id: $userId})
      SET u.role = $newRole, u.updatedAt = timestamp()
      ${labelCypher}
      RETURN u.id AS id, u.name AS name, u.role AS role, labels(u) AS labels
    `;

    const result = await executeQuery(cypher, { userId, newRole });
    if (result.records.length === 0) return null;
    const rec = result.records[0];
    return {
      id: rec.get('id'),
      name: rec.get('name'),
      role: rec.get('role'),
      labels: rec.get('labels'),
    };
  }

  /**
   * 5. DELETE & DETACH DELETE Operation: Safely remove nodes and their connected edges
   */
  async deleteUser(userId, detach = true) {
    const cypher = detach
      ? `MATCH (u:User {id: $userId}) DETACH DELETE u`
      : `MATCH (u:User {id: $userId}) DELETE u`;

    const result = await executeQuery(cypher, { userId });
    return result.summary.counters.updates();
  }

  /**
   * 6. Transactional Write using explicit Session (executeWrite)
   */
  async transferUserConnectionTransactional(userId1, userId2, relationshipType = 'KNOWS') {
    const session = getSession();
    try {
      const txResult = await session.executeWrite(async (tx) => {
        const query = `
          MATCH (u1:User {id: $userId1}), (u2:User {id: $userId2})
          MERGE (u1)-[r:${relationshipType} {createdInTx: true, timestamp: timestamp()}]->(u2)
          RETURN u1.name AS fromUser, u2.name AS toUser, type(r) AS relType
        `;
        const res = await tx.run(query, { userId1, userId2 });
        return res.records.map((rec) => ({
          fromUser: rec.get('fromUser'),
          toUser: rec.get('toUser'),
          relType: rec.get('relType'),
        }));
      });
      return txResult;
    } finally {
      await session.close();
    }
  }
}

module.exports = new CypherCrudService();
