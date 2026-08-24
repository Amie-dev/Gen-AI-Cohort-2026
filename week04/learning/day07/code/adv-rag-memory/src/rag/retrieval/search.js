import { QueryRouter } from "../routing/queryRouter.js";
import { PostgresAdapter } from "../adapters/postgres.js";
import { qdrantAdapter } from "../adapters/qdrant.js";
import { MongoAdapter } from "../adapters/mongodb.js";
import { S3StorageAdapter } from "../adapters/storage.js";
import { ACLMetadataFilter } from "./filtering.js";
import { ReciprocalRankFusion } from "./rrf.js";
import { SemanticReRanker } from "./reranker.js";

/**
 * Multi-Source Parallel Search Orchestrator
 */
export class ParallelSearch {
  static async searchAll(queries, userContext = {}) {
    const allStreams = [];

    for (const q of queries) {
      const targets = QueryRouter.routeQuery(q);
      
      for (const target of targets) {
        let docs = [];
        if (target === "qdrant_vector" || target === "vector_db") {
          docs = await qdrantAdapter.search(q);
        } else if (target === "postgres") {
          docs = await PostgresAdapter.search(q, userContext);
        } else if (target === "mongodb") {
          docs = await MongoAdapter.search(q);
        } else if (target === "s3_storage") {
          docs = await S3StorageAdapter.search(q);
        }

        const filtered = ACLMetadataFilter.filterDocuments(docs, userContext);
        allStreams.push(filtered);
      }
    }

    const fused = ReciprocalRankFusion.fuse(allStreams);
    const reRanked = SemanticReRanker.reRank(queries[0] || "", fused);

    return reRanked;
  }
}
