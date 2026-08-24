/**
 * Query Router
 * Directs search queries to appropriate backend adapters (PostgreSQL, Qdrant Vector DB, MongoDB, S3 Object Store).
 */
export class QueryRouter {
  static routeQuery(query) {
    const qLower = query.toLowerCase();
    const targets = ["vector_db"]; // Qdrant vector db is default

    if (qLower.includes("user") || qLower.includes("account") || qLower.includes("project")) {
      targets.push("postgres");
    }
    if (qLower.includes("log") || qLower.includes("telemetry") || qLower.includes("event")) {
      targets.push("mongodb");
    }
    if (qLower.includes("pdf") || qLower.includes("document") || qLower.includes("s3")) {
      targets.push("s3_storage");
    }

    return targets;
  }
}
