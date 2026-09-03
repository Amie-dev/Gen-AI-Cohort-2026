# Chapter 4 — App Skeleton & Workspaces CRUD

## 1. Goal & Outcome
- **Goal**: Establish the standard enterprise architecture pattern (**Route → Controller → Service → Repository → Prisma**) with global error handling, Zod validation, and workspace management.
- **Student Outcome**: Users can create, list, inspect, update, and delete isolated knowledge workspaces.

---

## 2. Architectural Design Pattern

Every business feature in Chaibook follows strict separation of concerns:
```
  [ HTTP Request ]
         │
         ▼
 ┌───────────────┐
 │ Router        │  src/routes/workspace.routes.ts (Applies auth & mounts endpoints)
 └───────┬───────┘
         ▼
 ┌───────────────┐
 │ Controller    │  src/controllers/workspace.controller.ts (Parses HTTP, validates Zod, calls service)
 └───────┬───────┘
         ▼
 ┌───────────────┐
 │ Service       │  src/services/workspace.service.ts (Business logic, ownership verification)
 └───────┬───────┘
         ▼
 ┌───────────────┐
 │ Repository    │  src/repositories/workspace.repository.ts (Direct Prisma DB calls)
 └───────┬───────┘
         ▼
 ┌───────────────┐
 │ Database      │  PostgreSQL via Prisma ORM
 └───────────────┘
```

---

## 3. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── src/
    ├── types/
    │   └── app-error.ts                      ← Custom Error Hierarchy
    ├── utils/
    │   ├── async-handler.ts                  ← Wraps async routes
    │   └── zod-error.ts                      ← Zod error formatter
    ├── middleware/
    │   └── error-handler.middleware.ts        ← Global Error Middleware
    ├── validators/
    │   └── workspace.validator.ts            ← Zod validation schemas
    ├── repositories/
    │   └── workspace.repository.ts           ← Prisma CRUD queries
    ├── services/
    │   └── workspace.service.ts              ← Business & Ownership checks
    ├── controllers/
    │   └── workspace.controller.ts           ← HTTP request handlers
    └── routes/
        ├── workspace.routes.ts               ← Workspace sub-router
        └── index.ts                          ← Route registry
```

### B. Prerequisites & Prisma Schema Update

Add `Workspace` model to `server/prisma/schema.prisma`:
```prisma
model Workspace {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("workspaces")
}
```

Run migration command:
```bash
npx prisma migrate dev --name add_workspace_model
```

---

### C. Server Code Implementation

#### 1. Custom Error Types (`server/src/types/app-error.ts`)
```typescript
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}
```

#### 2. Async Handler Utility (`server/src/utils/async-handler.ts`)
```typescript
import type { NextFunction, Request, RequestHandler, Response } from "express";

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

#### 3. Global Error Middleware (`server/src/middleware/error-handler.middleware.ts`)
```typescript
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../types/app-error.js";
import { ZodError } from "zod";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal server error" });
}
```

#### 4. Workspace Validator (`server/src/validators/workspace.validator.ts`)
```typescript
import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
```

#### 5. Workspace Repository (`server/src/repositories/workspace.repository.ts`)
```typescript
import { db } from "../lib/db.js";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "../validators/workspace.validator.js";

export async function findWorkspacesByUserId(userId: string) {
  return db.workspace.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function findWorkspaceByIdAndUserId(id: string, userId: string) {
  return db.workspace.findFirst({
    where: { id, userId },
  });
}

export async function createWorkspaceRecord(userId: string, data: CreateWorkspaceInput) {
  return db.workspace.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function updateWorkspaceRecord(id: string, data: UpdateWorkspaceInput) {
  return db.workspace.update({
    where: { id },
    data,
  });
}

export async function deleteWorkspaceRecord(id: string) {
  return db.workspace.delete({
    where: { id },
  });
}
```

#### 6. Workspace Service (`server/src/services/workspace.service.ts`)
```typescript
import {
  findWorkspacesByUserId,
  findWorkspaceByIdAndUserId,
  createWorkspaceRecord,
  updateWorkspaceRecord,
  deleteWorkspaceRecord,
} from "../repositories/workspace.repository.js";
import { NotFoundError } from "../types/app-error.js";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "../validators/workspace.validator.js";

export async function listUserWorkspaces(userId: string) {
  return findWorkspacesByUserId(userId);
}

export async function getWorkspaceByIdForUser(workspaceId: string, userId: string) {
  const workspace = await findWorkspaceByIdAndUserId(workspaceId, userId);
  if (!workspace) {
    throw new NotFoundError("Workspace not found");
  }
  return workspace;
}

export async function createWorkspaceForUser(userId: string, input: CreateWorkspaceInput) {
  return createWorkspaceRecord(userId, input);
}

export async function updateWorkspaceForUser(workspaceId: string, userId: string, input: UpdateWorkspaceInput) {
  await getWorkspaceByIdForUser(workspaceId, userId);
  return updateWorkspaceRecord(workspaceId, input);
}

export async function deleteWorkspaceForUser(workspaceId: string, userId: string) {
  await getWorkspaceByIdForUser(workspaceId, userId);
  await deleteWorkspaceRecord(workspaceId);
}
```

#### 7. Workspace Controller (`server/src/controllers/workspace.controller.ts`)
```typescript
import type { Request, Response } from "express";
import {
  listUserWorkspaces,
  getWorkspaceByIdForUser,
  createWorkspaceForUser,
  updateWorkspaceForUser,
  deleteWorkspaceForUser,
} from "../services/workspace.service.js";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../validators/workspace.validator.js";

export async function listWorkspaces(req: Request, res: Response) {
  const workspaces = await listUserWorkspaces(req.session.user.id);
  res.json({ workspaces });
}

export async function getWorkspace(req: Request, res: Response) {
  const workspace = await getWorkspaceByIdForUser(req.params.workspaceId, req.session.user.id);
  res.json({ workspace });
}

export async function createWorkspace(req: Request, res: Response) {
  const input = createWorkspaceSchema.parse(req.body);
  const workspace = await createWorkspaceForUser(req.session.user.id, input);
  res.status(201).json({ workspace });
}

export async function updateWorkspace(req: Request, res: Response) {
  const input = updateWorkspaceSchema.parse(req.body);
  const workspace = await updateWorkspaceForUser(req.params.workspaceId, req.session.user.id, input);
  res.json({ workspace });
}

export async function deleteWorkspace(req: Request, res: Response) {
  await deleteWorkspaceForUser(req.params.workspaceId, req.session.user.id);
  res.json({ success: true, message: "Workspace deleted" });
}
```

#### 8. Workspace Routes (`server/src/routes/workspace.routes.ts`)
```typescript
import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  listWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspace.controller.js";

export const workspaceRoutes = Router();

// Protect all workspace endpoints
workspaceRoutes.use(requireAuth);

workspaceRoutes.get("/", asyncHandler(listWorkspaces));
workspaceRoutes.post("/", asyncHandler(createWorkspace));
workspaceRoutes.get("/:workspaceId", asyncHandler(getWorkspace));
workspaceRoutes.patch("/:workspaceId", asyncHandler(updateWorkspace));
workspaceRoutes.delete("/:workspaceId", asyncHandler(deleteWorkspace));
```

#### 9. Registry (`server/src/routes/index.ts`)
```typescript
import type { Express } from "express";
import { workspaceRoutes } from "./workspace.routes.js";

export function registerRoutes(app: Express) {
  app.use("/api/workspaces", workspaceRoutes);
}
```

---

## 4. Verification & Endpoint Testing

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/workspaces` | List all workspaces for logged-in user |
| `POST` | `/api/workspaces` | Create new workspace `{ "name": "AI Study Notes" }` |
| `GET` | `/api/workspaces/:workspaceId` | Fetch details of workspace |
| `PATCH` | `/api/workspaces/:workspaceId` | Update workspace name/description |
| `DELETE` | `/api/workspaces/:workspaceId` | Delete workspace |

Test with curl / Postman using session cookies:
```bash
curl -X POST http://localhost:8080/api/workspaces \
  -H "Content-Type: application/json" \
  -b "better-auth.session_token=YOUR_SESSION_TOKEN" \
  -d '{"name":"TypeScript Masterclass","description":"Notes and code samples"}'
```
