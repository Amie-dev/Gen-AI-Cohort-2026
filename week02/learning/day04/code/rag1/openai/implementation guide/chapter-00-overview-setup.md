# Chapter 00 — System Architecture & Environment Setup

## 1. Overview

The `rag1/openai` project implements a fundamental Retrieval-Augmented Generation (RAG) system using **LangChain**, **Qdrant Vector Database**, and **OpenAI APIs** (`text-embedding-3-small` and `gpt-4o`).

The system works in two distinct workflows:
1. **Indexing Pipeline (`indexing.js`)**: Loads local PDF documents, generates dense vector embeddings via OpenAI, and persists document vectors into Qdrant.
2. **Querying & Grounded Generation Pipeline (`query.js`)**: Converts user queries to vector embeddings, retrieves top matching chunks from Qdrant, builds a strict grounded prompt with source page metadata, and generates factual answers with `gpt-4o`.

---

## 2. Infrastructure Setup (`docker-compose.yml`)

The system requires a running instance of **Qdrant Vector Database**. Qdrant is configured using Docker Compose located at [`week02/learning/day04/code/docker-compose.yml`](file:///home/aminul/development/gen-ai-cohort/week02/learning/day04/code/docker-compose.yml):

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage

volumes:
  qdrant_storage:
```

### Starting Qdrant Service

Run the following command to start Qdrant in detached mode:

```bash
docker compose up -d
```

Verify that Qdrant is running:
- **REST API / Dashboard**: `http://localhost:6333/dashboard`
- **gRPC API**: `localhost:6334`

---

## 3. Environment Variables (`.env`)

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
QDRANT_URL=http://localhost:6333
```

---

## 4. Dependencies

The required Node.js packages for running this OpenAI RAG project:

```json
{
  "dependencies": {
    "@langchain/community": "^0.2.0",
    "@langchain/openai": "^0.2.0",
    "@langchain/qdrant": "^0.0.5",
    "openai": "^4.50.0",
    "pdf-parse": "^1.1.1"
  }
}
```

Install them using:

```bash
npm install @langchain/community @langchain/openai @langchain/qdrant openai pdf-parse
```
