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
