# Chapter 7 — Source Indexing & Processing Pipeline

## 1. Goal & Outcome
- **Goal**: Build an automated background pipeline (`PENDING → PROCESSING → READY`) that extracts text, splits content into overlapping chunks, generates OpenAI embeddings, stores vector embeddings in Pinecone, and persists chunk metadata using Inngest event queues.
- **Student Outcome**: Any saved or imported source automatically transitions to `READY` state and becomes searchable via similarity vector search.

---

## 2. Architecture & Pipeline Sequence

```
[ New Source Created ]
          │
          ▼ Enqueue Event: source/created
  ┌───────────────┐
  │ Inngest Queue │
  └───────┬───────┘
          ▼
  ┌───────────────┐  Mark Status: PROCESSING
  │ Extract Text  │  Unpdf (for PDF) or raw text / scraped markdown
  └───────┬───────┘
          ▼
  ┌───────────────┐  Split into 1000 char chunks with 100 char overlap
  │ Chunk Text    │  Save chunks to Postgres (SourceChunk table)
  └───────┬───────┘
          ▼
  ┌───────────────┐  OpenAI text-embedding-3-small (1536 dims)
  │ Embed Chunks  │  Batch array of vector embeddings
  └───────┬───────┘
          ▼
  ┌───────────────┐  Upsert into Pinecone namespace (workspaceId)
  │ Index Vectors │  Save metadata: sourceId, chunkId, index, text
  └───────┬───────┘
          ▼
     Mark Status: READY
```

---

## 3. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── src/
    ├── lib/
    │   ├── ai-config.ts                       ← Embedding & Chunking constants
    │   ├── chunking.ts                        ← Sliding window text chunking algorithm
    │   ├── pdf.ts                             ← Unpdf text extractor
    │   ├── openai.ts                          ← OpenAI client & embedding API
    │   ├── pinecone.ts                        ← Pinecone vector upsert & delete
    │   └── source-events.ts                   ← Inngest event dispatcher
    ├── repositories/
    │   └── source-chunk.repository.ts         ← SourceChunk DB repository
    ├── services/
    │   └── source-processing.service.ts       ← Indexing orchestration service
    ├── inngest/
    │   ├── client.ts                          ← Inngest client singleton
    │   └── index.ts                           ← Inngest background functions
    └── routes/
        └── source.routes.ts                   ← Chunk inspection & reprocess routes
```

### B. Installation Commands
From `week05/chaibook-llm-sir/server`:
```bash
npm install @pinecone-database/pinecone openai inngest unpdf @ai-sdk/openai ai
```

---

### C. Server Code Implementation

#### 1. AI Configuration (`server/src/lib/ai-config.ts`)
```typescript
export const CHAT_MODEL = "gpt-4o-mini";
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 100;
export const RAG_TOP_K = 6;
export const RAG_MIN_SCORE = 0.35;
```

#### 2. Sliding Window Chunking (`server/src/lib/chunking.ts`)
```typescript
import { CHUNK_OVERLAP, CHUNK_SIZE } from "./ai-config.js";

export interface TextChunk {
  index: number;
  content: string;
}

export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): TextChunk[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < clean.length) {
    let end = start + chunkSize;
    if (end < clean.length) {
      const nextSpace = clean.indexOf(" ", end);
      if (nextSpace !== -1 && nextSpace - end < 50) {
        end = nextSpace;
      }
    } else {
      end = clean.length;
    }

    const chunkContent = clean.slice(start, end).trim();
    if (chunkContent.length > 0) {
      chunks.push({ index, content: chunkContent });
      index++;
    }

    if (end >= clean.length) break;
    start = end - overlap;
  }

  return chunks;
}
```

#### 3. OpenAI Embeddings (`server/src/lib/openai.ts`)
```typescript
import OpenAI from "openai";
import { EMBEDDING_MODEL } from "./ai-config.js";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map((item) => item.embedding);
}
```

#### 4. Pinecone Vector Storage (`server/src/lib/pinecone.ts`)
```typescript
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const indexName = process.env.PINECONE_INDEX || "chaibook";

export const getPineconeIndex = () => pinecone.index(indexName);

export async function upsertSourceVectors(
  workspaceId: string,
  vectors: { id: string; values: number[]; metadata: Record<string, unknown> }[]
) {
  const index = getPineconeIndex();
  const namespace = index.namespace(workspaceId);
  await namespace.upsert(vectors);
}

export async function deleteSourceVectors(workspaceId: string, sourceId: string) {
  const index = getPineconeIndex();
  const namespace = index.namespace(workspaceId);
  await namespace.deleteMany({ sourceId: { $eq: sourceId } });
}

export async function deleteWorkspaceVectors(workspaceId: string) {
  const index = getPineconeIndex();
  await index.namespace(workspaceId).deleteAll();
}
```

#### 5. Source Processing Service (`server/src/services/source-processing.service.ts`)
```typescript
import { findSourceById } from "../repositories/source.repository.js";
import { db } from "../lib/db.js";
import { chunkText } from "../lib/chunking.js";
import { embedTexts } from "../lib/openai.js";
import { upsertSourceVectors, deleteSourceVectors } from "../lib/pinecone.js";

export async function processSourceById(sourceId: string) {
  const source = await findSourceById(sourceId);
  if (!source) throw new Error("Source not found");

  // Step 1: Update status to PROCESSING
  await db.source.update({ where: { id: sourceId }, data: { status: "PROCESSING" } });

  try {
    const rawContent = source.content || "";
    if (!rawContent) throw new Error("Source contains no text content to process");

    // Step 2: Split text into chunks
    const chunks = chunkText(rawContent);

    // Step 3: Clear existing chunks & Save new chunks to Postgres
    await db.sourceChunk.deleteMany({ where: { sourceId } });
    await db.sourceChunk.createMany({
      data: chunks.map((c) => ({
        sourceId,
        index: c.index,
        content: c.content,
      })),
    });

    const savedChunks = await db.sourceChunk.findMany({
      where: { sourceId },
      orderBy: { index: "asc" },
    });

    // Step 4: Generate Embeddings
    const chunkTexts = savedChunks.map((c) => c.content);
    const embeddings = await embedTexts(chunkTexts);

    // Step 5: Upsert to Pinecone (Namespaced by workspaceId)
    const vectors = savedChunks.map((chunk, idx) => ({
      id: chunk.id,
      values: embeddings[idx],
      metadata: {
        sourceId,
        workspaceId: source.workspaceId,
        chunkId: chunk.id,
        index: chunk.index,
        text: chunk.content,
      },
    }));

    await upsertSourceVectors(source.workspaceId, vectors);

    // Step 6: Mark READY
    await db.source.update({ where: { id: sourceId }, data: { status: "READY" } });
  } catch (error) {
    console.error(`[Indexing Failure] Source ${sourceId}:`, error);
    await db.source.update({ where: { id: sourceId }, data: { status: "FAILED" } });
    throw error;
  }
}
```

#### 6. Inngest Integration (`server/src/inngest/client.ts` & `index.ts`)

`server/src/inngest/client.ts`:
```typescript
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "chaibook-server" });
```

`server/src/inngest/index.ts`:
```typescript
import { inngest } from "./client.js";
import { processSourceById } from "../services/source-processing.service.js";

export const processSource = inngest.createFunction(
  { id: "process-source", retries: 2 },
  { event: "source/created" },
  async ({ event }) => {
    const { sourceId } = event.data;
    await processSourceById(sourceId);
    return { success: true, sourceId };
  }
);

export const functions = [processSource];
```

#### 7. Mount Inngest Router (`server/src/index.ts`)
```typescript
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { functions } from "./inngest/index.js";

// Mount Inngest endpoint
app.use("/api/inngest", serve({ client: inngest, functions }));
```

---

## 4. Environment Variables (`server/.env`)

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=chaibook
INNGEST_DEV=1
```

---

## 5. Verification & Testing Workflow

1. Start Inngest Dev Server:
   ```bash
   npx inngest-cli@latest dev -u http://localhost:8080/api/inngest
   ```
2. Create a new source via REST API.
3. Observe Inngest dashboard (`http://localhost:8288`): Event `source/created` triggers background execution.
4. Query DB source status: verify status transitions `PENDING → PROCESSING → READY`.
5. Verify source chunks:
   ```bash
   curl http://localhost:8080/api/workspaces/ws123/sources/SRC_ID/chunks \
     -b "better-auth.session_token=TOKEN"
   ```
