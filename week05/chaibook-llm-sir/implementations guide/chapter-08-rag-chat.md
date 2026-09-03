# Chapter 8 — Conversations & RAG Chat

## 1. Goal & Outcome
- **Goal**: Implement grounded RAG (Retrieval-Augmented Generation) chat streaming using Vercel AI SDK, OpenAI (`gpt-4o-mini`), and Pinecone vector search. Maintain conversation thread persistence and citation mappings (`[1]`, `[2]`).
- **Student Outcome**: Users can create multi-turn chat threads, ask questions about workspace documents, and receive real-time streamed AI responses with interactive inline source citations.

---

## 2. Server Implementation (`server/`)

### A. Folder & File Structure
```
server/
├── prisma/
│   └── schema.prisma                         ← Conversation & Message models
└── src/
    ├── lib/
    │   └── rag/
    │       └── retrieve.ts                   ← Vector retrieval & System prompt builder
    ├── validators/
    │   └── chat.validator.ts                 ← Chat & Conversation schemas
    ├── repositories/
    │   ├── conversation.repository.ts        ← Conversation DB queries
    │   └── message.repository.ts             ← Message DB queries
    ├── services/
    │   └── chat.service.ts                   ← RAG stream orchestration
    ├── controllers/
    │   └── chat.controller.ts                ← Chat & Conversation controllers
    └── routes/
        ├── conversation.routes.ts            ← /api/workspaces/:workspaceId/conversations
        └── chat.routes.ts                    ← /api/workspaces/:workspaceId/chat
```

### B. Prerequisites & Prisma Schema Update

Add `Conversation` and `Message` models to `server/prisma/schema.prisma`:
```prisma
model Conversation {
  id                  String             @id @default(cuid())
  workspaceId         String
  title               String             @default("New Conversation")
  summary             String?
  summaryUpToMsgId    String?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  workspace           Workspace          @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  messages            Message[]

  @@index([workspaceId])
  @@map("conversation")
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  role           String       // "user" | "assistant" | "system"
  content        String
  metadata       Json?
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@map("message")
}
```

Run migration:
```bash
npx prisma migrate dev --name add_conversations_and_messages
```

---

### C. Server Code Implementation

#### 1. RAG Vector Retrieval & System Prompt (`server/src/lib/rag/retrieve.ts`)
```typescript
import { RAG_MIN_SCORE, RAG_TOP_K } from "../ai-config.js";
import { embedTexts } from "../openai.js";
import { queryWorkspaceVectors } from "../pinecone.js";

export type RetrievedChunk = {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  chunkId: string;
  chunkIndex: number;
  text: string;
  score: number;
};

export async function retrieveWorkspaceContext(workspaceId: string, query: string): Promise<RetrievedChunk[]> {
  const [embedding] = await embedTexts([query]);
  const matches = await queryWorkspaceVectors(workspaceId, embedding, RAG_TOP_K);

  const chunks: RetrievedChunk[] = [];
  for (const match of matches) {
    const score = match.score ?? 0;
    if (score < RAG_MIN_SCORE) continue;

    const meta = match.metadata as Record<string, unknown>;
    if (!meta || typeof meta.text !== "string") continue;

    chunks.push({
      sourceId: String(meta.sourceId),
      sourceTitle: String(meta.sourceTitle ?? "Untitled"),
      sourceType: String(meta.sourceType ?? "TEXT"),
      chunkId: String(meta.chunkId),
      chunkIndex: Number(meta.chunkIndex ?? 0),
      text: meta.text,
      score,
    });
  }

  return chunks;
}

export function buildChatSystemPrompt(input: { chunks: RetrievedChunk[]; conversationSummary?: string | null }) {
  const sections: string[] = [
    "You are Chaibook, an AI study assistant grounding responses in workspace sources.",
  ];

  if (input.conversationSummary) {
    sections.push("Previous Conversation Summary:", input.conversationSummary);
  }

  if (input.chunks.length === 0) {
    sections.push(
      "No direct matching source context was found for this query. Answer helpfully from general knowledge without inventing citations."
    );
    return sections.join("\n\n");
  }

  const contextBlocks = input.chunks
    .map((chunk, i) => `[${i + 1}] ${chunk.sourceTitle} (${chunk.sourceType})\n${chunk.text}`)
    .join("\n\n");

  sections.push(
    "Use ONLY the retrieved context below when answering factual questions.",
    "Cite sources inline using [1], [2], etc. matching the numbered context blocks.",
    "Retrieved Context:\n" + contextBlocks
  );

  return sections.join("\n\n");
}
```

#### 2. Streaming Chat Service (`server/src/services/chat.service.ts`)
```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { CHAT_MODEL } from "../lib/ai-config.js";
import { retrieveWorkspaceContext, buildChatSystemPrompt } from "../lib/rag/retrieve.js";
import { createMessageRecord } from "../repositories/message.repository.js";
import { getConversationById } from "../repositories/conversation.repository.js";

export async function streamRagChat(input: {
  workspaceId: string;
  conversationId: string;
  userMessage: string;
}) {
  const conversation = await getConversationById(input.conversationId);
  if (!conversation) throw new Error("Conversation thread not found");

  // Save incoming user message
  await createMessageRecord({
    conversationId: input.conversationId,
    role: "user",
    content: input.userMessage,
  });

  // Retrieve relevant vector chunks
  const chunks = await retrieveWorkspaceContext(input.workspaceId, input.userMessage);

  // Build system prompt
  const systemPrompt = buildChatSystemPrompt({
    chunks,
    conversationSummary: conversation.summary,
  });

  // Stream completion with Vercel AI SDK
  const result = streamText({
    model: openai(CHAT_MODEL),
    system: systemPrompt,
    prompt: input.userMessage,
    onFinish: async ({ text }) => {
      // Save assistant response once stream completes
      await createMessageRecord({
        conversationId: input.conversationId,
        role: "assistant",
        content: text,
        metadata: { citations: chunks },
      });
    },
  });

  return result.toDataStreamResponse();
}
```

#### 3. Chat Controller & Routes (`server/src/controllers/chat.controller.ts`)
```typescript
import type { Request, Response } from "express";
import { streamRagChat } from "../services/chat.service.js";

export async function streamChat(req: Request, res: Response) {
  const { conversationId, message } = req.body;
  const stream = await streamRagChat({
    workspaceId: req.params.workspaceId,
    conversationId,
    userMessage: message,
  });

  // Pipe AI stream response directly to client HTTP response
  stream.pipeToResponse(res);
}
```

Mount in `server/src/routes/workspace.routes.ts`:
```typescript
workspaceRoutes.use("/:workspaceId/conversations", conversationRoutes);
workspaceRoutes.use("/:workspaceId/chat", chatRoutes);
```

---

## 3. Client Implementation (`client/`)

### A. Component Setup (`client/features/chat/components/chat-interface.tsx`)
```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Bot, User } from "lucide-react";

export function ChatInterface({ workspaceId, conversationId }: { workspaceId: string; conversationId: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/workspaces/${workspaceId}/chat`,
    body: { conversationId },
  });

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 border border-slate-800 rounded-xl">
      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role !== "user" && <Bot className="w-6 h-6 text-amber-500 mt-1" />}
            <div
              className={`p-3 rounded-lg max-w-lg text-sm ${
                msg.role === "user"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-800 text-slate-200 border border-slate-700"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && <User className="w-6 h-6 text-slate-400 mt-1" />}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about your sources..."
          className="flex-1 bg-slate-950 text-white border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
```

---

## 4. Verification & Testing

```bash
# Stream Chat Response via Curl
curl -X POST http://localhost:8080/api/workspaces/ws123/chat \
  -H "Content-Type: application/json" \
  -b "better-auth.session_token=TOKEN" \
  -d '{
    "conversationId": "conv_123",
    "message": "What are the core concepts covered in my notes?"
  }'
```
Expected output: Server streams chunks over standard Server-Sent Event / Data Stream protocol.
