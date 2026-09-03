# Chapter 9 — Personal Memory, Conversation Summarization & Web Search

## 1. Goal & Outcome
- **Goal**: Integrate personal user memory storage (Mem0), real-time live web search (Tavily), and automatic rolling conversation summarization via Inngest background jobs.
- **Student Outcome**: The AI assistant retains persistent long-term memories across chat threads, generates compact rolling summaries for long conversations, and searches the live web when workspace context is insufficient.

---

## 2. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── src/
    ├── lib/
    │   ├── mem0.ts                           ← Mem0 Client & Memory CRUD / Search
    │   ├── tavily.ts                         ← Tavily Web Search integration
    │   └── conversation-events.ts            ← Inngest summarization event trigger
    ├── validators/
    │   └── memory.validator.ts               ← Memory CRUD schemas
    ├── services/
    │   ├── memory.service.ts                 ← User memory management service
    │   └── conversation-memory.service.ts    ← Rolling summary generator service
    ├── controllers/
    │   └── memory.controller.ts              ← Memory HTTP controllers
    ├── routes/
    │   └── memory.routes.ts                  ← Mount /api/memory routes
    └── inngest/
        └── index.ts                          ← Add summarizeConversation function
```

### B. Installation Commands
From `week05/chaibook-llm-sir/server`:
```bash
npm install mem0ai @tavily/core
```

---

### C. Server Code Implementation

#### 1. Mem0 User Memory SDK (`server/src/lib/mem0.ts`)
```typescript
import { MemoryClient } from "mem0ai";

let client: MemoryClient | null = null;

export function getMem0Client() {
  const apiKey = process.env.MEM0_API_KEY?.trim();
  if (!apiKey) throw new Error("MEM0_API_KEY is missing");

  if (!client) {
    client = new MemoryClient({ apiKey });
  }
  return client;
}

export async function listUserMemories(userId: string) {
  if (!process.env.MEM0_API_KEY?.trim()) return [];
  const res = await getMem0Client().getAll({ filters: { user_id: userId } });
  return res.results.map((r) => ({
    id: r.id,
    memory: r.memory ?? "",
    createdAt: r.createdAt ?? new Date().toISOString(),
  }));
}

export async function searchUserMemories(userId: string, query: string) {
  if (!process.env.MEM0_API_KEY?.trim() || !query.trim()) return [];
  const res = await getMem0Client().search(query, { filters: { user_id: userId }, topK: 5 });
  return res.results.map((r) => r.memory ?? "");
}

export async function addUserMemory(userId: string, memoryText: string) {
  const created = await getMem0Client().add([{ role: "user", content: memoryText }], { userId, infer: false });
  return created[0];
}

export async function deleteUserMemory(memoryId: string) {
  await getMem0Client().delete(memoryId);
}
```

#### 2. Tavily Web Search SDK (`server/src/lib/tavily.ts`)
```typescript
import { tavily } from "@tavily/core";

export async function searchWebTavily(query: string) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const tv = tavily({ apiKey });
  const response = await tv.search(query, { maxResults: 4, searchDepth: "basic" });
  return response.results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  }));
}
```

#### 3. Conversation Summarizer (`server/src/services/conversation-memory.service.ts`)
```typescript
import { db } from "../lib/db.js";
import { openai } from "../lib/openai.js";
import { CHAT_MODEL } from "../lib/ai-config.js";

export async function summarizeConversationThread(conversationId: string) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation || conversation.messages.length < 6) return;

  const transcript = conversation.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `Summarize the following study discussion into 3-4 concise bullet points outlining key facts and topics covered:\n\n${transcript}`;

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = completion.choices[0]?.message?.content?.trim();

  if (summary) {
    await db.conversation.update({
      where: { id: conversationId },
      data: { summary },
    });
  }
}
```

#### 4. Memory Controller & Routes (`server/src/controllers/memory.controller.ts`)
```typescript
import type { Request, Response } from "express";
import { listUserMemories, addUserMemory, deleteUserMemory } from "../lib/mem0.js";

export async function getMemories(req: Request, res: Response) {
  const memories = await listUserMemories(req.session.user.id);
  res.json({ memories });
}

export async function createMemory(req: Request, res: Response) {
  const { memory } = req.body;
  const created = await addUserMemory(req.session.user.id, memory);
  res.status(201).json({ memory: created });
}

export async function removeMemory(req: Request, res: Response) {
  await deleteUserMemory(req.params.memoryId);
  res.json({ success: true });
}
```

Mount memory routes in `server/src/routes/index.ts`:
```typescript
import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getMemories, createMemory, removeMemory } from "../controllers/memory.controller.js";

export const memoryRoutes = Router();
memoryRoutes.use(requireAuth);

memoryRoutes.get("/", asyncHandler(getMemories));
memoryRoutes.post("/", asyncHandler(createMemory));
memoryRoutes.delete("/:memoryId", asyncHandler(removeMemory));

// In registerRoutes(app):
app.use("/api/memory", memoryRoutes);
```

---

## 3. Environment Setup (`server/.env`)

```env
MEM0_API_KEY=m0-...
TAVILY_API_KEY=tvly-...
```

---

## 4. Verification & Testing

```bash
# 1. Fetch user personal memories
curl http://localhost:8080/api/memory -b "better-auth.session_token=TOKEN"

# 2. Add manual memory preference
curl -X POST http://localhost:8080/api/memory \
  -H "Content-Type: application/json" \
  -b "better-auth.session_token=TOKEN" \
  -d '{"memory": "I am preparing for an advanced System Design interview."}'
```
