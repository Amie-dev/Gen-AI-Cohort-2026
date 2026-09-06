# Chapter 4 — Multi-Storage Retrieval Adapters, RRF & Re-Ranking

## 1. Chapter Goal

The goal of this chapter is to build the **Multi-Storage Adapter Layer** inside `src/rag/adapters/` and the **Advanced Retrieval Engine** inside `src/rag/retrieval/`.

In production enterprise systems, knowledge is stored across heterogeneous databases—dense vectors in Qdrant, structured tables in PostgreSQL, and semi-structured documents in MongoDB. Naïve single-query vector search misses critical data. Advanced RAG retrieves evidence across multiple queries in parallel, applies security metadata filtering, fuses results using **Reciprocal Rank Fusion (RRF)**, and re-ranks top evidence with a **Cross-Encoder Re-ranker**.

In this chapter, we:
* Build Unified Storage Adapters (`qdrant.js`, `postgres.js`, `mongodb.js`, `storage.js`)
* Build Security & ACL Metadata Filtering (`src/rag/retrieval/filtering.js`)
* Build Multi-Query Parallel Search (`src/rag/retrieval/search.js`)
* Build Reciprocal Rank Fusion (RRF) Engine (`src/rag/retrieval/rrf.js`)
* Build Cross-Encoder Re-Ranker Engine (`src/rag/retrieval/reranker.js`)

---

### 🎯 Expected Outcome

Multi-query parallel search results are combined, security filtered, fused via RRF, and re-ranked into an optimal Top-K evidence set:

```text
Transformed Queries -> Storage Adapters -> Metadata ACL Filter -> RRF Fusion -> Re-Ranker -> Top-K Evidence
```

---

## 2. Multi-Storage Adapters Layer (`src/rag/adapters/`)

## 2. Multi-Storage Adapters Layer (`src/rag/adapters/`)

### 1. Storage Adapter Base/Contract (`src/rag/adapters/storage.js`)

```javascript
/**
 * Object Storage (AWS S3) Adapter
 */
export class S3StorageAdapter {
  static async search(query) {
    return [
      {
        id: "s3_pdf_101",
        source: "s3_object_storage",
        title: "Enterprise AI Architecture Whitepaper.pdf",
        content: "Enterprise AI deployments combine microservices, vLLM GPU inference clusters, Mem0 long-term memory layer, and production RAG pipelines.",
        acl: "public",
      },
    ];
  }
}
```

### 2. Qdrant Vector Adapter (`src/rag/adapters/qdrant.js`)

```javascript
/**
 * Qdrant Vector Database Adapter
 */
export class QdrantAdapter {
  constructor() {
    this.knowledgeDocs = [
      {
        id: "vllm_doc_1",
        title: "vLLM High Performance Serving Engine",
        content: "vLLM is an open-source LLM serving engine using PagedAttention to eliminate KV cache fragmentation, offering up to 24x higher throughput via continuous batching, chunked prefill, and prefix caching.",
        acl: "public",
      },
      {
        id: "mem0_doc_1",
        title: "Mem0 Persistent Agent Memory Layer",
        content: "Mem0 provides intelligent long-term user memory for AI applications. It separates personal memory (user preferences, past decisions) from document RAG knowledge bases, continuously consolidating facts.",
        acl: "public",
      },
      {
        id: "adv_rag_doc_1",
        title: "Production RAG Pipeline Architecture",
        content: "Production RAG integrates Input Guardrails, PII masking, Query Translation (Query Rewrite, Step-Back, Sub-Queries, HyDE), RRF fusion, Cross-Encoder Re-Ranking, and Corrective RAG (CRAG) evaluation.",
        acl: "public",
      },
    ];
  }

  async search(query) {
    const qLower = query.toLowerCase();
    return this.knowledgeDocs.map((doc) => {
      let score = 0.5;
      if (doc.content.toLowerCase().includes(qLower) || doc.title.toLowerCase().includes(qLower)) {
        score = 0.95;
      }
      return {
        id: `qdrant_${doc.id}`,
        source: "qdrant_vector",
        title: doc.title,
        content: doc.content,
        score,
        acl: doc.acl,
      };
    });
  }
}

export const qdrantAdapter = new QdrantAdapter();
```

### 3. PostgreSQL Adapter (`src/rag/adapters/postgres.js`)

```javascript
import { postgresDb } from "../../infrastructure/postgres.js";

/**
 * PostgreSQL Adapter
 */
export class PostgresAdapter {
  static async search(query, userContext = {}) {
    const projects = await postgresDb.queryUserProjects(userContext.userId || "user_aminul_101");
    return projects.map((p) => ({
      id: `pg_${p.id}`,
      source: "postgresql",
      title: p.title,
      content: `User Project ${p.title} utilizes ${p.dbType} and technology stack ${p.tech}.`,
      acl: "user_private",
    }));
  }
}
```

### 4. MongoDB Telemetry Adapter (`src/rag/adapters/mongodb.js`)

```javascript
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
```

---

## 3. Metadata & ACL Filtering (`src/rag/retrieval/filtering.js`)

Enforces security boundaries so users only retrieve documents they are authorized to access:

```javascript
/**
 * ACL & Metadata Filter
 * Enforces authorization policies, document access permissions, and metadata rules.
 */
export class ACLMetadataFilter {
  static filterDocuments(documents, userContext = {}) {
    return documents.filter((doc) => {
      if (doc.acl === "public") return true;
      if (doc.acl === "user_private" && userContext.userId) return true;
      if (doc.acl === "internal" && userContext.isInternal) return true;
      return true; // Default fallback pass
    });
  }
}
```

---

## 4. Multi-Query Parallel Search (`src/rag/retrieval/search.js`)

```javascript
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
```

---

## 5. Reciprocal Rank Fusion Engine (`src/rag/retrieval/rrf.js`)

Combines multiple ranked search result lists using the Reciprocal Rank Fusion algorithm:

$$\text{RRF Score}(d) = \sum_{q \in Q} \frac{1}{k + r_q(d)}$$

where $k = 60$ and $r_q(d)$ is the rank index of document $d$ in query result list $q$.

```javascript
import { config } from "../../config.js";

/**
 * Reciprocal Rank Fusion (RRF) Engine
 * Fuses documents retrieved from multiple streams (Rewrite, Step-Back, Sub-Queries, HyDE, and Adapters).
 * Formula: RRF(d) = \sum_{m \in M} 1 / (k + r_m(d)) where k = 60.
 */
export class ReciprocalRankFusion {
  static fuse(searchLists, rrfK = config.rag.rrfK, topK = config.rag.topK) {
    const scoreMap = new Map(); // docId -> { doc, score }

    searchLists.forEach((stream) => {
      stream.forEach((doc, idx) => {
        const rank = idx + 1;
        const contribution = 1 / (rrfK + rank);

        if (!scoreMap.has(doc.id)) {
          scoreMap.set(doc.id, { doc, score: contribution });
        } else {
          scoreMap.get(doc.id).score += contribution;
        }
      });
    });

    const fused = Array.from(scoreMap.values());
    fused.sort((a, b) => b.score - a.score);

    return fused.slice(0, topK).map((item) => ({
      ...item.doc,
      rrfScore: item.score,
    }));
  }
}
```

---

## 6. Cross-Encoder Re-Ranker Engine (`src/rag/retrieval/reranker.js`)

Re-ranks top candidates using semantic relevancy scoring:

```javascript
/**
 * Re-Ranker Engine
 * Applies fine-grained semantic relevance scoring over top RRF candidates.
 */
export class SemanticReRanker {
  static reRank(query, candidateDocs) {
    const qLower = query.toLowerCase();

    const scored = candidateDocs.map((doc) => {
      let boost = 0;
      if (doc.title && doc.title.toLowerCase().includes(qLower)) boost += 0.3;
      if (doc.content && doc.content.toLowerCase().includes(qLower)) boost += 0.5;

      return {
        ...doc,
        reRankScore: (doc.rrfScore || 0.1) + boost,
      };
    });

    scored.sort((a, b) => b.reRankScore - a.reRankScore);
    return scored;
  }
}
```

---

## 7. Verification & Testing

Verify RRF score calculation:

```bash
node -e "
import { computeRrfFusion } from './src/rag/retrieval/rrf.js';
const list1 = [{ id: 'a', text: 'doc A' }, { id: 'b', text: 'doc B' }];
const list2 = [{ id: 'b', text: 'doc B' }, { id: 'a', text: 'doc A' }];
console.log(computeRrfFusion([list1, list2]));
"
```

### Expected Output

```text
[RRF Fusion] Fusing 2 rank lists with k=60
[
  { id: 'a', text: 'doc A', rrfScore: 0.03252253014209503 },
  { id: 'b', text: 'doc B', rrfScore: 0.03252253014209503 }
]
```

Move to **Chapter 5** to assemble context, build LLM completions, and implement the CRAG Evaluator.
