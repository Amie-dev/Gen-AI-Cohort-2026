# Chapter 0 — Overview, Setup & Prerequisites

Welcome to the **Chaibook LLM Sir** implementation guide! This project is a full-stack, enterprise-grade AI Notebook and Knowledge RAG application built using Express (Node.js/TypeScript) for the backend server and Next.js (React/TypeScript) for the frontend client.

---

## 1. System Architecture Overview

```
                         ┌─────────────────────────┐
                         │   Next.js Client (App)  │
                         │  Port 3000 (React 19)   │
                         └────────────┬────────────┘
                                      │ HTTP / SSE / REST
                                      ▼
                         ┌─────────────────────────┐
                         │   Express Server (TS)   │
                         │  Port 8080 (ESM + TS)   │
                         └──────┬────────────┬─────┘
                                │            │
           ┌────────────────────┴┐          ┌┴───────────────────┐
           ▼                     ▼          ▼                    ▼
   ┌───────────────┐     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ PostgreSQL 16 │     │ Pinecone DB  │ │ Inngest Dev  │ │ External APIs│
   │ (via Prisma)  │     │ (Vector DB)  │ │ (Job Queue)  │ │ OpenAi/Mem0  │
   └───────────────┘     └──────────────┘ └──────────────┘ └──────────────┘
```

### Key Capabilities & Technology Stack
- **Server Framework**: Express 5.x on Node.js (ESM, TypeScript, `tsx watch`).
- **Database & ORM**: PostgreSQL 16 (via Docker Compose pgvector) + Prisma ORM.
- **Auth Engine**: Better Auth (Google OAuth 2.0, Prisma Adapter, session cookies).
- **Background Pipeline**: Inngest for asynchronous job processing (source indexing, background summarization, artifact generation).
- **Vector Search & AI**: OpenAI (`text-embedding-3-small`, `gpt-4o-mini`), Pinecone (Vector database for similarity search), Mem0 (Personal user memory), Tavily (Live web search).
- **Frontend Client**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Shadcn UI components, TanStack Query.

---

## 2. Prerequisites & Environment Setup

Before starting, ensure you have the following installed on your developer machine:
- **Node.js**: v20.x or v22.x+
- **Package Managers**: `npm` (v10+) or `bun`
- **Docker & Docker Compose**: Docker Engine 24+ (for running PostgreSQL container)
- **Git**: Version control

---

## 3. Directory Layout

The project is divided into two separate roots under `week05/chaibook-llm-sir`:

```
week05/chaibook-llm-sir/
├── docker-compose.yml           # PostgreSQL container setup
├── notes.md                     # Raw build order and technical notes
├── server/                      # Express Backend API Server
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma.config.ts
│   ├── .env.example
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.ts
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── routes/
│       ├── middleware/
│       ├── validators/
│       ├── inngest/
│       ├── lib/
│       ├── types/
│       └── utils/
└── client/                      # Next.js Frontend Application
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── components.json
    └── app/
        ├── layout.tsx
        ├── page.tsx
        ├── (auth)/
        └── (protected)/
```

---

## 4. Installation Commands Quick Reference

### Server Setup & Dependencies
To set up the server from scratch, execute:

```bash
# Navigate to server directory
cd week05/chaibook-llm-sir/server

# Initialize package.json (ESM mode)
npm init -y

# Add "type": "module" in package.json

# Install Runtime Dependencies
npm install express dotenv cors better-auth @prisma/client @prisma/adapter-pg pg zod inngest @ai-sdk/openai ai openai @pinecone-database/pinecone @mendable/firecrawl-js @tavily/core mem0ai cloudinary multer unpdf youtube-transcript

# Install Development Dependencies
npm install -D typescript tsx @types/node @types/express @types/cors @types/multer @types/pg prisma
```

### Client Setup & Dependencies
To set up the Next.js client, execute:

```bash
# Navigate to client directory
cd week05/chaibook-llm-sir/client

# Create Next.js app (or install dependencies)
npm install next react react-dom @tanstack/react-query better-auth ai @ai-sdk/openai @ai-sdk/react zustand lucide-react clsx tailwind-merge class-variance-authority framer-motion @streamdown/code streamdown @xyflow/react recharts

# Install Dev Dependencies
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss eslint eslint-config-next
```

---

## 5. Docker Infrastructure Setup

Create `docker-compose.yml` in `week05/chaibook-llm-sir/docker-compose.yml`:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: chaibook-postgres
    environment:
      POSTGRES_DB: chaibook
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5434:5432"
    volumes:
      - chaibook_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d chaibook"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  chaibook_pg_data:
```

### Starting the Database:
```bash
# From workspace root (week05/chaibook-llm-sir)
docker compose up -d
```

---

## 6. Guide Navigation

Proceed chapter by chapter through the implementation docs:
1. `chapter-01-bootstrap.md` — Express Server & Next.js Client Bootstrap
2. `chapter-02-database.md` — PostgreSQL & Prisma ORM Foundation
3. `chapter-03-authentication.md` — Google OAuth & Better Auth Integration
4. `chapter-04-workspaces.md` — App Layering Architecture & Workspaces CRUD
5. `chapter-05-sources-crud.md` — Knowledge Sources (Text & Markdown Notes)
6. `chapter-06-import-channels.md` — Source Import Channels (Web, YouTube, PDF, Web-Search)
7. `chapter-07-indexing-pipeline.md` — Background Indexing, Embeddings & Vector DB (Inngest + Pinecone)
8. `chapter-08-rag-chat.md` — RAG Retrieval & Streaming AI Chat
9. `chapter-09-memory-search.md` — User Personal Memory (Mem0) & Web Search (Tavily)
10. `chapter-10-learning-artifacts.md` — Async AI Study Artifacts (Flashcards, Quizzes, Summaries)
