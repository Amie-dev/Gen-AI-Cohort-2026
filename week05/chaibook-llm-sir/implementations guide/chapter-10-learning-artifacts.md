# Chapter 10 — Learning Artifacts (Flashcards, Quizzes, Summaries)

## 1. Goal & Outcome
- **Goal**: Implement background AI learning artifact generation. Users can select indexed workspace sources to asynchronously create structured study artifacts: Summaries, Key Takeaways, Interactive Flashcards, Multiple-Choice Quizzes, Mindmaps, and In-depth Reports.
- **Student Outcome**: Users trigger artifact generation jobs via Inngest workers and view structured output directly inside their workspace UI.

---

## 2. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── prisma/
│   └── schema.prisma                         ← ArtifactType & LearningArtifact models
└── src/
    ├── lib/
    │   └── artifact-events.ts                ← Inngest artifact event trigger
    ├── validators/
    │   └── artifact.validator.ts             ← Artifact generation Zod schemas
    ├── repositories/
    │   └── artifact.repository.ts            ← LearningArtifact DB repository
    ├── services/
    │   ├── artifact-generation.service.ts    ← LLM structured artifact generators
    │   └── artifact.service.ts               ← Artifact CRUD & Inngest enqueue
    ├── controllers/
    │   └── artifact.controller.ts            ← Artifact HTTP handlers
    ├── routes/
    │   └── artifact.routes.ts                ← Mount artifact endpoints
    └── inngest/
        └── index.ts                          ← Add generateArtifact Inngest job
```

### B. Prisma Schema Update (`server/prisma/schema.prisma`)

```prisma
enum ArtifactType {
  SUMMARY
  TAKEAWAYS
  FLASHCARDS
  QUIZ
  MINDMAP
  REPORT
}

enum ArtifactStatus {
  PENDING
  PROCESSING
  READY
  FAILED
}

model LearningArtifact {
  id          String         @id @default(cuid())
  workspaceId String
  type        ArtifactType
  title       String
  content     Json?
  sourceIds   String[]
  status      ArtifactStatus @default(PENDING)
  metadata    Json?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  workspace   Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([workspaceId, type])
  @@index([workspaceId, status])
  @@map("learning_artifact")
}
```

Run migration:
```bash
npx prisma migrate dev --name add_learning_artifacts
```

---

### C. Server Code Implementation

#### 1. Artifact Validator (`server/src/validators/artifact.validator.ts`)
```typescript
import { z } from "zod";

export const createArtifactSchema = z.object({
  type: z.enum(["SUMMARY", "TAKEAWAYS", "FLASHCARDS", "QUIZ", "MINDMAP", "REPORT"]),
  title: z.string().min(1, "Title is required"),
  sourceIds: z.array(z.string()).optional(),
});

export type CreateArtifactInput = z.infer<typeof createArtifactSchema>;
```

#### 2. LLM Generator (`server/src/services/artifact-generation.service.ts`)
```typescript
import { openai } from "../lib/openai.js";
import { CHAT_MODEL } from "../lib/ai-config.js";
import { db } from "../lib/db.js";
import type { ArtifactType } from "@prisma/client";

export async function generateArtifactContent(
  artifactId: string,
  workspaceId: string,
  type: ArtifactType,
  sourceIds?: string[]
) {
  // Step 1: Mark status PROCESSING
  await db.learningArtifact.update({ where: { id: artifactId }, data: { status: "PROCESSING" } });

  try {
    // Step 2: Fetch source content chunks
    const sources = await db.source.findMany({
      where: {
        workspaceId,
        ...(sourceIds && sourceIds.length > 0 ? { id: { in: sourceIds } } : { status: "READY" }),
      },
      select: { title: true, content: true },
    });

    const combinedText = sources.map((s) => `### Source: ${s.title}\n${s.content}`).join("\n\n");

    let prompt = "";
    if (type === "FLASHCARDS") {
      prompt = `Generate 5 flashcards from the text below as JSON format array: [{"front": "question", "back": "answer"}]. Text:\n\n${combinedText}`;
    } else if (type === "QUIZ") {
      prompt = `Generate a 3-question multiple choice quiz as JSON format array: [{"question": "...", "options": ["A","B","C","D"], "answer": "A"}]. Text:\n\n${combinedText}`;
    } else {
      prompt = `Summarize the core concepts of this text into clean markdown:\n\n${combinedText}`;
    }

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: type === "FLASHCARDS" || type === "QUIZ" ? { type: "json_object" } : undefined,
    });

    const rawResult = completion.choices[0]?.message?.content || "";
    const parsedContent = type === "FLASHCARDS" || type === "QUIZ" ? JSON.parse(rawResult) : { markdown: rawResult };

    // Step 3: Update artifact READY
    await db.learningArtifact.update({
      where: { id: artifactId },
      data: {
        content: parsedContent,
        status: "READY",
      },
    });
  } catch (error) {
    console.error(`Artifact Generation Error (${artifactId}):`, error);
    await db.learningArtifact.update({ where: { id: artifactId }, data: { status: "FAILED" } });
  }
}
```

#### 3. Inngest Function Integration (`server/src/inngest/index.ts`)
```typescript
import { inngest } from "./client.js";
import { generateArtifactContent } from "../services/artifact-generation.service.js";

export const generateArtifact = inngest.createFunction(
  { id: "generate-artifact", retries: 2 },
  { event: "artifact/generate" },
  async ({ event }) => {
    const { artifactId, workspaceId, type, sourceIds } = event.data;
    await generateArtifactContent(artifactId, workspaceId, type, sourceIds);
    return { success: true, artifactId };
  }
);
```

#### 4. Controller & Routes (`server/src/routes/artifact.routes.ts`)
```typescript
import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { db } from "../lib/db.js";
import { inngest } from "../inngest/client.js";
import { createArtifactSchema } from "../validators/artifact.validator.js";

export const artifactRoutes = Router({ mergeParams: true });

artifactRoutes.get("/", asyncHandler(async (req, res) => {
  const artifacts = await db.learningArtifact.findMany({
    where: { workspaceId: req.params.workspaceId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ artifacts });
}));

artifactRoutes.post("/", asyncHandler(async (req, res) => {
  const input = createArtifactSchema.parse(req.body);
  const artifact = await db.learningArtifact.create({
    data: {
      workspaceId: req.params.workspaceId,
      type: input.type,
      title: input.title,
      sourceIds: input.sourceIds ?? [],
      status: "PENDING",
    },
  });

  // Dispatch background Inngest event
  await inngest.send({
    name: "artifact/generate",
    data: {
      artifactId: artifact.id,
      workspaceId: req.params.workspaceId,
      type: artifact.type,
      sourceIds: artifact.sourceIds,
    },
  });

  res.status(201).json({ artifact });
}));

artifactRoutes.get("/:artifactId", asyncHandler(async (req, res) => {
  const artifact = await db.learningArtifact.findFirst({
    where: { id: req.params.artifactId, workspaceId: req.params.workspaceId },
  });
  res.json({ artifact });
}));
```

Mount in `server/src/routes/workspace.routes.ts`:
```typescript
workspaceRoutes.use("/:workspaceId/artifacts", artifactRoutes);
```

---

## 3. Client Implementation (`client/`)

### A. Component Setup (`client/features/learn/components/flashcard-viewer.tsx`)
```tsx
"use client";

import { useState } from "react";
import { RotateCw, ChevronRight, ChevronLeft } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

export function FlashcardViewer({ cards }: { cards: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || cards.length === 0) return <p>No flashcards available.</p>;

  const current = cards[currentIndex];

  return (
    <div className="flex flex-col items-center gap-4 max-w-md mx-auto p-4">
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full h-64 bg-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-xl transition-all duration-300"
      >
        <span className="text-xs text-amber-500 font-semibold uppercase mb-4">
          {isFlipped ? "Answer" : "Question"} (Card {currentIndex + 1} of {cards.length})
        </span>
        <p className="text-lg font-medium text-white">
          {isFlipped ? current.back : current.front}
        </p>
        <span className="text-xs text-slate-500 mt-6 flex items-center gap-1">
          <RotateCw className="w-3 h-3" /> Click to flip
        </span>
      </div>

      <div className="flex gap-4">
        <button
          disabled={currentIndex === 0}
          onClick={() => { setIsFlipped(false); setCurrentIndex((i) => i - 1); }}
          className="p-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          disabled={currentIndex === cards.length - 1}
          onClick={() => { setIsFlipped(false); setCurrentIndex((i) => i + 1); }}
          className="p-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

---

## 4. Verification & Endpoint Testing

```bash
# Trigger Flashcard Generation
curl -X POST http://localhost:8080/api/workspaces/ws123/artifacts \
  -H "Content-Type: application/json" \
  -b "better-auth.session_token=TOKEN" \
  -d '{
    "type": "FLASHCARDS",
    "title": "TypeScript Interfaces Study Deck"
  }'
```
Expected response: `{ "artifact": { "id": "art_123", "status": "PENDING" } }`.
Inngest worker processes event and updates status to `READY` with generated flashcards payload.
