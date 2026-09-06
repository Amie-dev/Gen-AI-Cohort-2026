# Chapter 0 — Overview, Infrastructure & Environment Setup

## 1. Chapter Goal

The goal of this chapter is to configure the foundation infrastructure for the **Advanced RAG Project (`adv-rag-1`)**.

Before implementing multi-query engines, security guardrails, rank fusion, or API endpoints, we first build a stable local environment connecting:
1. **Containerized Infrastructure**: Vector DB (**Qdrant**), Redis key-value store (**BullMQ** queue storage), and Relational DB (**PostgreSQL**).
2. **ESM Project Configuration**: Native ES Module `package.json` with scripts for server startup and background worker execution.
3. **Environment Parameters**: System ports, model parameters, and database parameters defined in `.env`.

### 🎯 Expected Outcome

By the end of this chapter, your directory layout will contain:

```text
adv-rag-1/
├── docker-compose.yml      # Qdrant (6333), Redis (6379), Postgres (5432)
├── package.json            # ESM package configuration & npm scripts
├── .env                    # Active environment variables
└── .env.example            # Environment template
```

---

## 2. Infrastructure Setup (`docker-compose.yml`)

Create [`docker-compose.yml`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/docker-compose.yml):

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: adv_rag_qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage

  redis:
    image: redis:7-alpine
    container_name: adv_rag_redis
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    container_name: adv_rag_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_db
    ports:
      - "5432:5432"

volumes:
  qdrant_storage:
```

### Starting Infrastructure Containers

Spin up containers in detached mode:

```bash
docker compose up -d
```

Verify running containers:

```bash
docker ps
```

---

## 3. Package Configuration (`package.json`)

Create [`package.json`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/package.json):

```json
{
  "name": "adv-rag-1",
  "version": "1.0.0",
  "description": "Production-Grade Advanced RAG System following Section 37 Folder Structure",
  "license": "ISC",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "worker": "node src/queues/indexingWorker.js",
    "services:up": "docker compose up -d",
    "services:down": "docker compose down"
  },
  "dependencies": {
    "@qdrant/js-client-rest": "^1.13.0",
    "bullmq": "^5.34.0",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "ioredis": "^5.4.2",
    "multer": "^2.0.1",
    "openai": "^4.77.0",
    "pdf-parse": "^1.1.1"
  }
}
```

Install NPM dependencies:

```bash
npm install
```

---

## 4. Environment Variables (`.env`)

Create [`.env.example`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/.env.example) and copy to `.env`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Server Port
PORT=3000

# Qdrant Vector DB Configuration
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=production_rag_docs

# Redis / BullMQ Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=app_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/app_docs

# AWS S3 Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=production-rag-assets
```

---

## 5. Summary & Next Steps

In this chapter, we:
- Configured Docker infrastructure containers for Qdrant, Redis, and PostgreSQL.
- Setup native ES Module package dependencies and startup scripts.
- Defined environment settings in `.env`.

In [**Chapter 01 — Database Clients & Shared LLM Client**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/adv-rag-1/implementation%20guide/chapter-01-database-llm-foundation.md), we will build the database initializers and the unified LLM completion client with local mock fallback logic.
