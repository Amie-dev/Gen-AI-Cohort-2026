# 05 — Agent Memory System Design & `mem0`: Code & Implementation Walkthrough

This file focuses on **how the implementation works in code**: memory retrieval, caching, scoring, eviction, agentic retrieval, and how a managed memory layer such as `mem0` can fit into the application.

---

## 1. Memory Retrieval in the Request Pipeline

A memory-enabled agent generally starts with a request handler:

```javascript
async function handleChat(userId, userQuery) {
  const recentMessages = await getRecentMessages(userId);

  const memories = await searchMemories(
    userId,
    userQuery
  );

  const messages = buildContext(
    recentMessages,
    memories,
    userQuery
  );

  const response = await callLLM(messages);

  await saveConversation(userId, userQuery, response);

  return response;
}
```

The important part is the order:

```text
User Query
    ↓
Load recent conversation
    ↓
Search relevant memories
    ↓
Build LLM context
    ↓
Call model
    ↓
Save conversation
```

The memory system is therefore part of the **request pipeline**, not something the LLM automatically manages.

---

# 2. Loading Frequently Used Memories

Searching a database for every request can introduce unnecessary latency.

For frequently accessed memories, the application can use a cache.

For example:

```javascript
const memoryCache = new Map();
```

A cache lookup can be implemented as:

```javascript
async function getUserProfile(userId) {

  if (memoryCache.has(userId)) {
    return memoryCache.get(userId);
  }

  const profile =
    await memoryDatabase.getUserProfile(userId);

  memoryCache.set(userId, profile);

  return profile;
}
```

The execution becomes:

```text
Request
   ↓
Check Cache
   │
   ├── Found → Return immediately
   │
   └── Not Found
          ↓
      Memory DB
          ↓
       Store Cache
          ↓
       Return
```

For production systems, the same idea can be implemented with Redis instead of an in-process `Map`.

---

# 3. Cache Expiration

Memory should not remain cached forever.

A simple cache entry can contain an expiration time:

```javascript
const cacheEntry = {
  data: profile,
  expiresAt: Date.now() + 60_000
};
```

When retrieving:

```javascript
function getCachedMemory(userId) {

  const entry = memoryCache.get(userId);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(userId);
    return null;
  }

  return entry.data;
}
```

This prevents stale information from remaining in memory indefinitely.

---

# 4. Memory Hit Tracking

A memory store should know which memories are actually useful.

A memory record can contain:

```javascript
{
  id: "memory_123",
  content: "User prefers TypeScript",
  createdAt: 1720000000000,
  lastAccessedAt: 1725000000000,
  accessCount: 15
}
```

Every time a memory is retrieved:

```javascript
async function recordMemoryHit(memoryId) {

  await memoryDatabase.update(memoryId, {
    lastAccessedAt: Date.now(),
    $inc: {
      accessCount: 1
    }
  });
}
```

So a retrieval operation becomes:

```javascript
const memories =
  await searchMemories(userId, query);

for (const memory of memories) {
  await recordMemoryHit(memory.id);
}
```

Now the system has information about how frequently memories are used.

---

# 5. Calculating a Memory Score

A simple implementation can combine **frequency** and **recency**.

For example:

```javascript
function calculateMemoryScore(memory) {

  const frequencyScore =
    Math.log1p(memory.accessCount);

  const age =
    Date.now() - memory.lastAccessedAt;

  const recencyScore =
    1 / (1 + age);

  return frequencyScore + recencyScore;
}
```

The exact formula can be changed depending on the application.

The important idea is that:

```text
Frequently accessed
        +
Recently accessed
        ↓
Higher score
```

while:

```text
Rarely accessed
        +
Old
        ↓
Lower score
```

---

# 6. Finding Memories for Eviction

The reflection process can use these scores.

```javascript
async function findUnusedMemories(memories) {

  return memories.filter(memory => {
    const score = calculateMemoryScore(memory);

    return score < MEMORY_EVICTION_THRESHOLD;
  });
}
```

For example:

```javascript
const MEMORY_EVICTION_THRESHOLD = 0.1;
```

The low-scoring memories can then be archived or deleted.

```javascript
for (const memory of unusedMemories) {
  await memoryDatabase.archive(memory.id);
}
```

This allows the active memory store to remain smaller.

---

# 7. Building a Better Context

Instead of simply appending every memory to the prompt:

```javascript
const messages = [
  ...allMemories,
  ...recentMessages,
  currentMessage
];
```

the application should select only the memories required for the current request.

For example:

```javascript
const relevantMemories =
  await searchMemories(
    userId,
    userQuery,
    { limit: 5 }
  );
```

Then:

```javascript
const messages = [
  {
    role: "system",
    content: "You are a helpful personal assistant."
  },

  ...formatMemories(relevantMemories),

  ...recentMessages,

  {
    role: "user",
    content: userQuery
  }
];
```

This keeps the LLM context smaller.

---

# 8. Formatting Memories for the LLM

The vector database should not necessarily return raw database objects directly to the model.

Instead, convert them into a clean prompt representation:

```javascript
function formatMemories(memories) {

  return memories.map(memory => ({
    role: "system",
    content: `Known user information: ${memory.content}`
  }));
}
```

For example:

```javascript
[
  {
    role: "system",
    content: "Known user information: User prefers TypeScript."
  },
  {
    role: "system",
    content: "Known user information: User lives in Tokyo."
  }
]
```

This creates a clean separation between:

```text
Database representation
        ↓
Application representation
        ↓
LLM context
```

---

# 9. Agentic Memory Search

A simple memory system performs one search:

```javascript
const memories =
  await searchMemories(userId, query);
```

For complicated queries, one search may not be enough.

For example:

```text
"What did I decide about the mobile app last month,
and how does that relate to my current React Native project?"
```

The application can break the problem into smaller searches.

```javascript
const subQueries = [
  "mobile app decision last month",
  "React Native project",
  "relationship between mobile app decision and project"
];
```

Then search each query:

```javascript
const results = [];

for (const query of subQueries) {

  const memories =
    await searchMemories(userId, query);

  results.push(...memories);
}
```

The results can then be merged:

```javascript
const uniqueMemories =
  deduplicateMemories(results);
```

This is a simple implementation of an **agentic retrieval loop**.

---

# 10. Iterative Memory Retrieval

A more advanced implementation can allow the agent to decide whether another search is necessary.

```javascript
async function agenticMemorySearch(userId, query) {

  let context = [];

  for (let step = 0; step < 3; step++) {

    const searchQuery =
      await generateNextSearchQuery(
        query,
        context
      );

    const memories =
      await searchMemories(
        userId,
        searchQuery
      );

    context.push(...memories);

    const complete =
      await shouldStopSearching(
        query,
        context
      );

    if (complete) {
      break;
    }
  }

  return deduplicateMemories(context);
}
```

The loop therefore becomes:

```text
Original Query
      ↓
Generate Search Query
      ↓
Search Memory
      ↓
Inspect Results
      ↓
Enough Information?
   │          │
  Yes         No
   │          │
   ↓          └──→ Generate Another Query
Return
```

---

# 11. `mem0` Integration

Instead of implementing every memory operation manually, a managed memory framework such as `mem0` can be placed between the application and the underlying memory stores.

The application can conceptually use an API like:

```javascript
const memory = new Memory();
```

Then add a conversation:

```javascript
await memory.add(
  [
    {
      role: "user",
      content: "I prefer TypeScript."
    }
  ],
  {
    userId: "user_123"
  }
);
```

The memory framework handles the processing required to turn the conversation into persistent memory.

---

# 12. Searching `mem0` Memory

When the user sends a new query:

```javascript
const results = await memory.search(
  "What programming language do I prefer?",
  {
    userId: "user_123"
  }
);
```

The application receives relevant memories.

Conceptually:

```javascript
[
  {
    memory: "User prefers TypeScript",
    score: 0.92
  }
]
```

The application can then add these results to the LLM context.

---

# 13. Updating Memory

If a user changes a preference:

```text
"I used to prefer JavaScript, but now I mainly use TypeScript."
```

the application can send the new conversation to the memory layer:

```javascript
await memory.add(
  [
    {
      role: "user",
      content:
        "I used to prefer JavaScript, but now I mainly use TypeScript."
    }
  ],
  {
    userId: "user_123"
  }
);
```

The memory layer can identify that the new information updates an existing memory rather than blindly creating another duplicate.

---

# 14. User-Level Memory Isolation

Memory must always be associated with the correct user.

For example:

```javascript
await memory.search(query, {
  userId: "user_123"
});
```

and:

```javascript
await memory.search(query, {
  userId: "user_456"
});
```

must return different memory sets.

The application should therefore always propagate the user identifier through the memory operations.

```text
Request
  ↓
Authentication
  ↓
userId
  ↓
Memory Search
  ↓
Only that user's memories
```

---

# 15. Session-Level Memory

The same memory system can distinguish between different conversations.

For example:

```javascript
{
  userId: "user_123",
  sessionId: "session_456"
}
```

A memory lookup can then use both:

```javascript
const results = await searchMemories({
  userId: "user_123",
  sessionId: "session_456",
  query: userQuery
});
```

This allows the application to separate:

```text
User Memory
    +
Current Session Memory
```

---

# 16. Complete Memory-Enabled Agent

Putting the pieces together:

```javascript
async function chat(userId, userQuery) {

  // 1. Load recent conversation
  const recentMessages =
    await getRecentMessages(userId);

  // 2. Search long-term memory
  const memories =
    await searchMemories(
      userId,
      userQuery,
      { limit: 5 }
    );

  // 3. Track memory usage
  for (const memory of memories) {
    await recordMemoryHit(memory.id);
  }

  // 4. Build context
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant."
    },

    ...formatMemories(memories),

    ...recentMessages,

    {
      role: "user",
      content: userQuery
    }
  ];

  // 5. Call LLM
  const response =
    await callLLM(messages);

  // 6. Save conversation
  await saveMessage({
    userId,
    role: "user",
    content: userQuery
  });

  await saveMessage({
    userId,
    role: "assistant",
    content: response
  });

  // 7. Extract/update long-term memories
  await updateLongTermMemory(
    userId,
    userQuery
  );

  return response;
}
```

This is the central implementation pattern.

---

# 17. Background Memory Maintenance

Memory cleanup should not block the user's request.

Instead of:

```javascript
await cleanupMemories();
return response;
```

the application can schedule cleanup separately:

```javascript
queueMemoryReflection(userId);
```

For example:

```javascript
async function queueMemoryReflection(userId) {

  await jobQueue.add(
    "memory-reflection",
    {
      userId
    }
  );
}
```

A worker can process the job later:

```javascript
worker.process(
  "memory-reflection",
  async job => {

    const memories =
      await getAllMemories(job.data.userId);

    const cleaned =
      await reflectAndConsolidate(memories);

    await saveCleanedMemories(
      job.data.userId,
      cleaned
    );
  }
);
```

This keeps expensive memory maintenance outside the main request path.

---

# 18. Complete Production-Level Flow

The implementation now becomes:

```text
User Request
     ↓
Authentication
     ↓
Get userId
     ↓
Load cached profile
     ↓
Load recent STM
     ↓
Search LTM
     ↓
Track memory hits
     ↓
Build minimal context
     ↓
LLM / vLLM
     ↓
Response
     ↓
Save conversation
     ↓
Extract/update memories
     ↓
Queue background reflection
```

Background:

```text
Reflection Worker
       ↓
Load memories
       ↓
Find duplicates
       ↓
Find contradictions
       ↓
Calculate memory scores
       ↓
Archive low-value memories
       ↓
Consolidate useful memories
       ↓
Save cleaned store
```

---

# 19. Main Code Responsibilities

The entire implementation can be understood through these responsibilities:

```text
Memory Store
    ↓
Stores persistent memories

Memory Search
    ↓
Finds memories relevant to current query

Cache
    ↓
Avoids unnecessary database calls

Hit Tracking
    ↓
Measures memory usefulness

Agentic Search
    ↓
Performs multiple memory searches when required

Reflection Worker
    ↓
Cleans and consolidates memories

mem0
    ↓
Provides a managed abstraction over memory operations

LLM / vLLM Client
    ↓
Uses the selected memories to generate the final response
```

---

# 20. Final Code-Level Architecture

```text
                         ┌──────────────────┐
                         │   User Request   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Application API  │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
             ┌─────────────┐             ┌─────────────┐
             │ STM / Cache │             │ LTM Search  │
             └──────┬──────┘             └──────┬──────┘
                    │                           │
                    │                     ┌─────▼─────┐
                    │                     │ Vector DB │
                    │                     └─────┬─────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                         ┌──────────────────┐
                         │ Context Builder  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ LLM / vLLM API   │
                         └────────┬─────────┘
                                  │
                                  ▼
                              Response
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
             Save Conversation          Update Memory
                                                │
                                                ▼
                                      ┌─────────────────┐
                                      │ Reflection Job  │
                                      └────────┬────────┘
                                               │
                                               ▼
                                      Clean Memory Store
```

The key implementation idea is to **keep the synchronous request path small**: retrieve only the memory needed for the current query, build the context, call the model, and return the response. Memory extraction, hit tracking, consolidation, and eviction can be handled asynchronously or through a managed layer such as `mem0`.
