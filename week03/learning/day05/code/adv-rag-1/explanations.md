# Root Project Explanations — `adv-rag-1`

## Overview
This directory contains the complete, production-ready Advanced RAG (Retrieval-Augmented Generation) application code structured strictly according to **Section 37 (Recommended Production Folder Structure)**.

## High-Level Architecture
The project decouples concerns into specialized layers:
- **`src/rag/`**: Contains core RAG components split into logical sub-domains:
  - **`query/`**: Query translation modules (Rewrite, Step-Back, Sub-Queries, HyDE).
  - **`routing/`**: Dynamic multi-store LLM query router.
  - **`adapters/`**: Database access adapters providing unified interfaces (`sqlAdapter`, `vectorAdapter`, `mongoAdapter`, `s3Adapter`).
  - **`retrieval/`**: Multi-query searching, metadata & access filtering, Reciprocal Rank Fusion (RRF), and relevance re-ranking.
  - **`generation/`**: Context construction and grounded LLM generation.
  - **`evaluation/`**: Corrective RAG (CRAG) evaluation engine.
  - **`guardrails/`**: Input/output security checks, PII masking, and jailbreak detection.
- **`src/queues/`**: Off-thread async document processing workers using BullMQ and Redis.
- **`src/db/`**: Connection managers for PostgreSQL, Qdrant Vector DB, and Redis.
- **`src/server.js`**: RESTful API server exposing querying and async indexing endpoints.

## File Breakdown (Root Directory)
- **`package.json`**: NPM project manifest specifying ESM modules (`"type": "module"`) and dependencies including OpenAI SDK, Qdrant client, BullMQ, Express, and IORedis.
- **`.env.example`**: Environment template for API keys, vector collection names, and database connection strings.
- **`docker-compose.yml`**: Docker service setup for local development (Qdrant on port 6333, Redis on port 6379, Postgres on port 5432).
- **`README.md`**: Technical overview, architecture diagram reference, and setup guide.
- **`explanations.md`**: Root documentation detailing folder layout and system design.
