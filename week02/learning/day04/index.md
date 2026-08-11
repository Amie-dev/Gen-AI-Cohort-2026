# 📂 Day 04: Retrieval-Augmented Generation (RAG) & Vector Stores

This directory contains comprehensive study notes, code implementations, Docker infrastructure, and architecture guides for **Week 02 — Day 04** of the Gen AI JS Cohort.

---

## 📋 Directory Navigation

### 1. Study Notes
Located under **[notes/](./notes/)**:
* **[01-introduction-to-rag.md](./notes/01-introduction-to-rag.md)**: Core concepts of RAG, solving LLM knowledge cutoffs and enterprise data privacy, and the human library mental model.
* **[02-vector-databases-and-embeddings.md](./notes/02-vector-databases-and-embeddings.md)**: Vector embeddings, mathematical similarity metrics (Cosine, Dot Product, Euclidean), and vector database comparison (Qdrant, Pinecone, Weaviate, pgvector, etc.).
* **[03-rag-architecture-and-pipelines.md](./notes/03-rag-architecture-and-pipelines.md)**: Breakdown of Indexing vs Query pipelines, text chunking strategies, metadata handling, and system prompt guardrails.
* **[04-building-rag-with-langchain-and-qdrant.md](./notes/04-building-rag-with-langchain-and-qdrant.md)**: Hands-on code walkthrough for Node.js using LangChain, OpenAI embeddings, Gemini embeddings, and Qdrant vector store.
* **[05-multimodal-ingestion-and-advanced-rag.md](./notes/05-multimodal-ingestion-and-advanced-rag.md)**: Multi-modal ingestion system design (Audio, Video, PDF, Images, Web), Naive RAG failure modes, and Advanced RAG concepts (Query Rewriting, HyDE, Hybrid Search, Reranking).
* **[raw-class.md](./notes/raw-class.md)** & **[raw-code-follow.md](./notes/raw-code-follow.md)**: Original transcript notes and raw code setup notes.

### 2. Code Implementations
Located under **[code/](./code/)**:
* **[docker-compose.yml](./code/docker-compose.yml)**: Local Qdrant Vector Database Docker composition setup.
* **OpenAI RAG Pipeline**:
  * **[rag1/openai/indexing.js](./code/rag1/openai/indexing.js)**: Document ingestion, chunking, and embedding generation stored in Qdrant using OpenAI embeddings.
  * **[rag1/openai/query.js](./code/rag1/openai/query.js)**: Vector similarity search and grounded LLM completion using `gpt-4o`.
* **Gemini RAG Pipeline**:
  * **[rag1/gemini/indexing.js](./code/rag1/gemini/indexing.js)**: Document indexing into Qdrant using Gemini `text-embedding-004`.
  * **[rag1/gemini/query.js](./code/rag1/gemini/query.js)**: Vector search and grounded completion using `gemini-2.5-flash`.

---

## 🚀 Execution Instructions

### 1. Start Qdrant Vector Database
Start the Qdrant instance via Docker Compose:
```bash
docker compose -f week02/learning/day04/code/docker-compose.yml up -d
```
> View Qdrant Dashboard at: 👉 `http://localhost:6333/dashboard`

### 2. Set API Keys
Ensure your API keys are defined in your environment or root `.env` file:
```env
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

### 3. Run Indexing Pipeline
```bash
# Index document with OpenAI embeddings
node --env-file=.env week02/learning/day04/code/rag1/openai/indexing.js

# Or index document with Gemini embeddings
node --env-file=.env week02/learning/day04/code/rag1/gemini/indexing.js
```

### 4. Query RAG System
```bash
# Query with OpenAI
node --env-file=.env week02/learning/day04/code/rag1/openai/query.js

# Query with Gemini
node --env-file=.env week02/learning/day04/code/rag1/gemini/query.js
```
