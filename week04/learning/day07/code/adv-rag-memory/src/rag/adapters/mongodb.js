/**
 * MongoDB Telemetry Adapter
 */
export class MongoAdapter {
  static async search(query) {
    return [
      {
        id: "mongo_telemetry_1",
        source: "mongodb_logs",
        title: "System Performance Telemetry",
        content: "API Gateway average response latency is 120ms. Background queue processing handles 45 memory updates/sec with zero dropouts.",
        acl: "internal",
      },
    ];
  }
}
