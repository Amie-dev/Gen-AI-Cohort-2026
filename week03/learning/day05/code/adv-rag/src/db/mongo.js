/**
 * NoSQL DB Adapter Mock / Implementation (MongoDB)
 * Serves document metadata, session data, and application telemetry.
 */
export async function queryMongo(collectionName, filter = {}) {
  console.log(`🍃 [MongoDB] Collection "${collectionName}" filter:`, JSON.stringify(filter));

  return [
    {
      sessionId: "sess_99812",
      userId: "USER_123",
      lastLogin: new Date().toISOString(),
      preferences: { theme: "dark", notifications: true }
    }
  ];
}
