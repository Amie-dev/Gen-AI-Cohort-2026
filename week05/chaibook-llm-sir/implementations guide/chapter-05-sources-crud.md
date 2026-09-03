# Chapter 5 — Knowledge Sources: TEXT & MARKDOWN Notes

## 1. Goal & Outcome
- **Goal**: Implement workspace knowledge source management. Users can create, view, list, delete, and bulk-delete raw `TEXT` and `MARKDOWN` notes saved with an initial `PENDING` status.
- **Student Outcome**: Users can upload text notes to a workspace DB without triggering AI indexing yet (indexing is hooked up in Chapter 7).

---

## 2. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── prisma/
│   └── schema.prisma                         ← Enums (SourceType, SourceStatus) & Source model
└── src/
    ├── validators/
    │   └── source.validator.ts               ← Source CRUD validation schemas
    ├── repositories/
    │   └── source.repository.ts              ← Prisma Source DB queries
    ├── services/
    │   └── source.service.ts                 ← Source CRUD business logic
    ├── controllers/
    │   └── source.controller.ts              ← Source HTTP request handlers
    └── routes/
        └── source.routes.ts                  ← Nested source routes (/api/workspaces/:workspaceId/sources)
```

### B. Prisma Schema Update (`server/prisma/schema.prisma`)

```prisma
enum SourceType {
  PDF
  WEBSITE
  YOUTUBE
  TEXT
  MARKDOWN
}

enum SourceStatus {
  PENDING
  PROCESSING
  READY
  FAILED
}

model Source {
  id          String       @id @default(cuid())
  workspaceId String
  type        SourceType
  title       String
  content     String?
  url         String?
  status      SourceStatus @default(PENDING)
  metadata    Json?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  chunks      SourceChunk[]

  @@index([workspaceId])
  @@index([workspaceId, type])
  @@index([workspaceId, status])
  @@map("source")
}

model SourceChunk {
  id         String   @id @default(cuid())
  sourceId   String
  index      Int
  content    String
  tokenCount Int?
  metadata   Json?
  createdAt  DateTime @default(now())

  source     Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  @@unique([sourceId, index])
  @@index([sourceId])
  @@map("source_chunk")
}
```

Run migration:
```bash
npx prisma migrate dev --name add_source_and_chunk_models
```

---

### C. Server Code Implementation

#### 1. Source Validator (`server/src/validators/source.validator.ts`)
```typescript
import { z } from "zod";

export const createTextSourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["TEXT", "MARKDOWN"]),
});

export const bulkDeleteSourcesSchema = z.object({
  sourceIds: z.array(z.string()).min(1, "At least one source ID is required"),
});

export type CreateTextSourceInput = z.infer<typeof createTextSourceSchema>;
export type BulkDeleteSourcesInput = z.infer<typeof bulkDeleteSourcesSchema>;
```

#### 2. Source Repository (`server/src/repositories/source.repository.ts`)
```typescript
import { db } from "../lib/db.js";
import type { SourceType, SourceStatus } from "@prisma/client";

export interface CreateSourceParams {
  workspaceId: string;
  type: SourceType;
  title: string;
  content?: string;
  url?: string;
  status?: SourceStatus;
  metadata?: Record<string, unknown>;
}

export async function findSourcesByWorkspaceId(workspaceId: string) {
  return db.source.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      workspaceId: true,
      type: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findSourceById(id: string) {
  return db.source.findUnique({
    where: { id },
  });
}

export async function createSourceRecord(data: CreateSourceParams) {
  return db.source.create({
    data: {
      ...data,
      status: data.status ?? "PENDING",
    },
  });
}

export async function deleteSourceRecord(id: string) {
  return db.source.delete({
    where: { id },
  });
}

export async function deleteManySourceRecords(ids: string[]) {
  return db.source.deleteMany({
    where: { id: { in: ids } },
  });
}
```

#### 3. Source Service (`server/src/services/source.service.ts`)
```typescript
import { getWorkspaceByIdForUser } from "./workspace.service.js";
import {
  findSourcesByWorkspaceId,
  findSourceById,
  createSourceRecord,
  deleteSourceRecord,
  deleteManySourceRecords,
} from "../repositories/source.repository.js";
import { NotFoundError } from "../types/app-error.js";
import type { CreateTextSourceInput } from "../validators/source.validator.js";

export async function listSourcesInWorkspace(workspaceId: string, userId: string) {
  await getWorkspaceByIdForUser(workspaceId, userId);
  return findSourcesByWorkspaceId(workspaceId);
}

export async function getSourceInWorkspace(workspaceId: string, sourceId: string, userId: string) {
  await getWorkspaceByIdForUser(workspaceId, userId);
  const source = await findSourceById(sourceId);
  if (!source || source.workspaceId !== workspaceId) {
    throw new NotFoundError("Source not found in workspace");
  }
  return source;
}

export async function createTextSourceInWorkspace(
  workspaceId: string,
  userId: string,
  input: CreateTextSourceInput
) {
  await getWorkspaceByIdForUser(workspaceId, userId);
  return createSourceRecord({
    workspaceId,
    type: input.type,
    title: input.title,
    content: input.content,
    status: "PENDING",
  });
}

export async function deleteSourceInWorkspace(workspaceId: string, sourceId: string, userId: string) {
  await getSourceInWorkspace(workspaceId, sourceId, userId);
  await deleteSourceRecord(sourceId);
}

export async function bulkDeleteSourcesInWorkspace(workspaceId: string, sourceIds: string[], userId: string) {
  await getWorkspaceByIdForUser(workspaceId, userId);
  await deleteManySourceRecords(sourceIds);
}
```

#### 4. Source Controller (`server/src/controllers/source.controller.ts`)
```typescript
import type { Request, Response } from "express";
import {
  listSourcesInWorkspace,
  getSourceInWorkspace,
  createTextSourceInWorkspace,
  deleteSourceInWorkspace,
  bulkDeleteSourcesInWorkspace,
} from "../services/source.service.js";
import { createTextSourceSchema, bulkDeleteSourcesSchema } from "../validators/source.validator.js";

export async function listSources(req: Request, res: Response) {
  const sources = await listSourcesInWorkspace(req.params.workspaceId, req.session.user.id);
  res.json({ sources });
}

export async function getSource(req: Request, res: Response) {
  const source = await getSourceInWorkspace(req.params.workspaceId, req.params.sourceId, req.session.user.id);
  res.json({ source });
}

export async function createSource(req: Request, res: Response) {
  const input = createTextSourceSchema.parse(req.body);
  const source = await createTextSourceInWorkspace(req.params.workspaceId, req.session.user.id, input);
  res.status(201).json({ source });
}

export async function deleteSource(req: Request, res: Response) {
  await deleteSourceInWorkspace(req.params.workspaceId, req.params.sourceId, req.session.user.id);
  res.json({ success: true });
}

export async function bulkDeleteSources(req: Request, res: Response) {
  const { sourceIds } = bulkDeleteSourcesSchema.parse(req.body);
  await bulkDeleteSourcesInWorkspace(req.params.workspaceId, sourceIds, req.session.user.id);
  res.json({ success: true });
}
```

#### 5. Source Routes (`server/src/routes/source.routes.ts`)
```typescript
import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
  listSources,
  getSource,
  createSource,
  deleteSource,
  bulkDeleteSources,
} from "../controllers/source.controller.js";

export const sourceRoutes = Router({ mergeParams: true });

sourceRoutes.get("/", asyncHandler(listSources));
sourceRoutes.post("/", asyncHandler(createSource));
sourceRoutes.post("/bulk-delete", asyncHandler(bulkDeleteSources));
sourceRoutes.get("/:sourceId", asyncHandler(getSource));
sourceRoutes.delete("/:sourceId", asyncHandler(deleteSource));
```

#### 6. Mounting Nested Route (`server/src/routes/workspace.routes.ts`)
```typescript
import { sourceRoutes } from "./source.routes.js";

// Mount sources sub-router under specific workspaceId path
workspaceRoutes.use("/:workspaceId/sources", sourceRoutes);
```

---

## 3. Verification & Endpoint Testing

| Method | Endpoint Path | Description |
| --- | --- | --- |
| `GET` | `/api/workspaces/:workspaceId/sources` | List all knowledge sources in workspace |
| `POST` | `/api/workspaces/:workspaceId/sources` | Save text/markdown note (status: `PENDING`) |
| `GET` | `/api/workspaces/:workspaceId/sources/:sourceId` | Read note contents & metadata |
| `DELETE` | `/api/workspaces/:workspaceId/sources/:sourceId` | Delete specific note |
| `POST` | `/api/workspaces/:workspaceId/sources/bulk-delete` | Delete list of sources |

```bash
# Create Markdown Note
curl -X POST http://localhost:8080/api/workspaces/ws123/sources \
  -H "Content-Type: application/json" \
  -b "better-auth.session_token=YOUR_TOKEN" \
  -d '{
    "title": "LLM Architecture Notes",
    "content": "# Transformers\nAttention is all you need...",
    "type": "MARKDOWN"
  }'
```
