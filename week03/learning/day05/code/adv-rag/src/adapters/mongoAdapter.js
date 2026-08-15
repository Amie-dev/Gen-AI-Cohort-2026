import { queryMongo } from "../db/mongo.js";

/**
 * MongoDB Adapter
 */
export async function searchMongo(query) {
  const docs = await queryMongo("sessions", { query });
  return docs.map(d => ({
    id: `mongo_${d.sessionId}`,
    title: "MongoDB User Session Log",
    text: `Session ${d.sessionId} for ${d.userId} active at ${d.lastLogin}. Theme: ${d.preferences.theme}`,
    source: "MongoDB Database",
    score: 0.90,
    metadata: { tenantId: "default", accessLevel: 1 }
  }));
}
