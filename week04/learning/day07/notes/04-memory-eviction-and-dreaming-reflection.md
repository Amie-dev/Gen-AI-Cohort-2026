# 04 — Memory Eviction & Memory Dreaming: Code Implementation Guide

This file explains the **implementation of `03_memory_dreaming_reflection.js`**, focusing only on the code, functions, data structures, and execution flow.

---

## 1. Memory Data Structure

The implementation starts with memory objects representing previously extracted facts.

A memory can look like:

```javascript
const memories = [
  {
    id: "memory_001",
    userId: "user_123",
    content: "User likes C++",
    createdAt: "2026-08-20T10:00:00Z",
    lastAccessedAt: "2026-08-23T10:00:00Z",
    hitCount: 5
  },

  {
    id: "memory_002",
    userId: "user_123",
    content: "User likes C++",
    createdAt: "2026-08-22T12:00:00Z",
    lastAccessedAt: "2026-08-22T12:00:00Z",
    hitCount: 1
  }
];
```

Each memory contains enough information for the reflection process to decide whether it should be kept, merged, updated, or removed.

Important fields:

```text
id
userId
content
createdAt
lastAccessedAt
hitCount
```

---

# 2. Loading Memories

The reflection process first loads the user's existing memories.

```javascript
async function loadMemories(userId) {
  return await memoryStore.getMemories(userId);
}
```

The function does not create new memories.

Its responsibility is simply to retrieve the current memory state.

For example:

```javascript
const memories = await loadMemories("user_123");
```

might return:

```javascript
[
  {
    id: "m1",
    content: "User likes C++"
  },
  {
    id: "m2",
    content: "User likes C++"
  },
  {
    id: "m3",
    content: "User lives in Tokyo"
  }
]
```

---

# 3. Finding Duplicate Memories

The next step is identifying memories that contain the same or very similar information.

A simple implementation can normalize the text first:

```javascript
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
```

For example:

```javascript
normalizeText("  User Likes C++  ");
```

produces:

```text
"user likes c++"
```

This makes simple duplicate comparisons easier.

---

## 3.1 Duplicate Detection

A basic implementation can use a `Map`:

```javascript
function findDuplicates(memories) {
  const seen = new Map();
  const duplicates = [];

  for (const memory of memories) {
    const key = normalizeText(memory.content);

    if (seen.has(key)) {
      duplicates.push(memory);
    } else {
      seen.set(key, memory);
    }
  }

  return duplicates;
}
```

Suppose the input is:

```javascript
[
  {
    id: "m1",
    content: "User likes C++"
  },
  {
    id: "m2",
    content: "User likes C++"
  }
]
```

The result becomes:

```javascript
[
  {
    id: "m2",
    content: "User likes C++"
  }
]
```

The first memory is treated as the original and the second one as the duplicate.

---

# 4. Merging Duplicate Memories

Instead of simply deleting duplicates, the implementation can merge useful metadata.

For example:

```javascript
function mergeMemories(primary, duplicate) {
  return {
    ...primary,

    hitCount:
      (primary.hitCount || 0) +
      (duplicate.hitCount || 0),

    lastAccessedAt:
      primary.lastAccessedAt > duplicate.lastAccessedAt
        ? primary.lastAccessedAt
        : duplicate.lastAccessedAt
  };
}
```

Suppose:

```javascript
primary = {
  id: "m1",
  content: "User likes C++",
  hitCount: 5
};
```

and:

```javascript
duplicate = {
  id: "m2",
  content: "User likes C++",
  hitCount: 3
};
```

The merged memory can become:

```javascript
{
  id: "m1",
  content: "User likes C++",
  hitCount: 8
}
```

This prevents useful usage information from being lost.

---

# 5. Handling Contradictory Memories

Duplicates are not the only problem.

Consider:

```javascript
[
  {
    id: "m1",
    content: "User lives in New York",
    createdAt: "2026-08-10T10:00:00Z"
  },

  {
    id: "m2",
    content: "User lives in Tokyo",
    createdAt: "2026-08-20T10:00:00Z"
  }
]
```

These memories are different, but they may describe the same attribute.

The reflection process needs to determine which fact represents the current state.

---

# 6. Timestamp-Based Resolution

A simple implementation can compare timestamps:

```javascript
function getLatestMemory(memories) {
  return memories.reduce((latest, current) => {
    return new Date(current.createdAt) >
      new Date(latest.createdAt)
      ? current
      : latest;
  });
}
```

For:

```text
m1 → New York → August 10
m2 → Tokyo    → August 20
```

the function returns:

```text
m2 → Tokyo
```

because it is newer.

---

# 7. Updating an Existing Memory

Once the reflection process determines that a newer memory should replace an older one, the memory store can be updated.

```javascript
async function updateMemory(memoryId, updates) {
  return await memoryStore.update(
    memoryId,
    updates
  );
}
```

For example:

```javascript
await updateMemory("m1", {
  content: "User lives in Tokyo",
  updatedAt: new Date().toISOString()
});
```

The old memory record is therefore replaced with the newer state.

---

# 8. Memory Hit Tracking

A useful implementation detail is tracking how often a memory is actually retrieved.

A memory can contain:

```javascript
{
  id: "m1",
  content: "User prefers TypeScript",
  hitCount: 12,
  lastAccessedAt: "2026-08-24T10:00:00Z"
}
```

Whenever retrieval returns this memory:

```javascript
async function recordMemoryHit(memoryId) {
  await memoryStore.update(memoryId, {
    hitCount: {
      increment: 1
    },
    lastAccessedAt:
      new Date().toISOString()
  });
}
```

This gives the system two useful signals:

```text
hitCount
    ↓
How frequently is this memory useful?

lastAccessedAt
    ↓
How recently was it useful?
```

---

# 9. Identifying Unused Memories

A memory that has never been retrieved may eventually become a candidate for eviction.

For example:

```javascript
function isUnused(memory) {
  return (
    (memory.hitCount || 0) === 0
  );
}
```

A more practical implementation also considers age:

```javascript
function isStale(memory, maxAgeDays) {
  const lastAccess =
    new Date(memory.lastAccessedAt);

  const ageMs =
    Date.now() - lastAccess.getTime();

  const ageDays =
    ageMs / (1000 * 60 * 60 * 24);

  return ageDays > maxAgeDays;
}
```

Then:

```javascript
if (isStale(memory, 90)) {
  // Candidate for eviction
}
```

---

# 10. Building a Memory Score

Instead of deleting a memory based on a single condition, the implementation can calculate a score.

For example:

```javascript
function calculateMemoryScore(memory) {
  const hits = memory.hitCount || 0;

  const lastAccess =
    new Date(memory.lastAccessedAt).getTime();

  const ageDays =
    (Date.now() - lastAccess) /
    (1000 * 60 * 60 * 24);

  const recencyScore =
    Math.max(0, 30 - ageDays);

  return hits + recencyScore;
}
```

A memory with frequent usage and recent access receives a higher score.

Example:

```text
Memory A
hitCount = 20
recently accessed
→ High score

Memory B
hitCount = 0
not accessed for 180 days
→ Low score
```

The low-score memory becomes an eviction candidate.

---

# 11. Selecting Memories for Eviction

The system can filter memories:

```javascript
function findEvictionCandidates(memories) {
  return memories.filter(
    memory =>
      calculateMemoryScore(memory) < 5
  );
}
```

This produces a list of memories that the reflection process can review.

Importantly, the reflection stage does not have to immediately delete them.

It can first generate a cleanup plan.

---

# 12. LLM-Based Reflection

The more advanced part of the implementation is sending memory information to an LLM.

For example:

```javascript
async function reflectOnMemories(memories) {

  const prompt = `
Review these stored memories.

Identify:
- duplicates
- contradictions
- stale memories
- memories that should be merged
- memories that should be removed

Return JSON only.

Memories:
${JSON.stringify(memories)}
`;

  const response =
    await callLLM(prompt);

  return JSON.parse(response);
}
```

The LLM might return:

```json
{
  "merge": [
    ["m1", "m2"]
  ],
  "replace": [
    {
      "old": "m3",
      "new": "m4"
    }
  ],
  "delete": [
    "m5"
  ]
}
```

The application then interprets this result.

---

# 13. Applying the Reflection Result

The reflection result should not directly modify the database without validation.

A dedicated function can apply the operations:

```javascript
async function applyReflection(result) {

  for (const ids of result.merge) {
    await mergeMemoryRecords(ids);
  }

  for (const replacement of result.replace) {
    await replaceMemory(
      replacement.old,
      replacement.new
    );
  }

  for (const memoryId of result.delete) {
    await deleteMemory(memoryId);
  }
}
```

This separates:

```text
Reflection
```

from:

```text
Database mutation
```

which makes the implementation safer.

---

# 14. Deleting a Memory

The actual deletion function can be very small:

```javascript
async function deleteMemory(memoryId) {
  await memoryStore.delete(memoryId);
}
```

The important logic deciding **which** memory should be deleted happens before this function is called.

---

# 15. Keeping Raw Conversation Data

The memory store should not be treated as the original source of truth.

The original conversation can remain stored separately:

```javascript
await conversationStore.save({
  userId,
  role,
  content,
  createdAt
});
```

The extracted memory is derived from that conversation.

This gives the system:

```text
Original Conversation
        ↓
Fact Extraction
        ↓
Memory Store
        ↓
Reflection
        ↓
Consolidated Memory
```

If the memory extraction logic changes later, the original conversation is still available.

---

# 16. Complete Reflection Function

The individual functions can be combined into one background job:

```javascript
async function runMemoryReflection(userId) {

  // 1. Load memories
  const memories =
    await loadMemories(userId);

  if (!memories.length) {
    return;
  }

  // 2. Find duplicate memories
  const duplicates =
    findDuplicates(memories);

  // 3. Find stale memories
  const stale =
    memories.filter(memory =>
      isStale(memory, 90)
    );

  // 4. Ask the LLM to analyze memories
  const reflection =
    await reflectOnMemories(memories);

  // 5. Apply approved operations
  await applyReflection(reflection);

  console.log({
    userId,
    totalMemories: memories.length,
    duplicates: duplicates.length,
    stale: stale.length
  });
}
```

This function represents the complete reflection workflow.

---

# 17. Running Reflection in the Background

Reflection should not normally block the user's chat request.

Instead of:

```javascript
await runMemoryReflection(userId);

return response;
```

the application can enqueue a background job:

```javascript
await memoryQueue.add(
  "reflection",
  {
    userId
  }
);
```

A worker then processes it:

```javascript
memoryQueue.process(
  "reflection",
  async job => {
    await runMemoryReflection(
      job.data.userId
    );
  }
);
```

The user's request can therefore finish immediately.

---

# 18. Complete Implementation Flow

Putting all the functions together:

```text
User Conversation
       │
       ▼
Save Original Transcript
       │
       ▼
Extract Memory
       │
       ▼
Store Memory
       │
       ▼
       ... more conversations ...
       │
       ▼
Background Reflection Job
       │
       ├── Load memories
       │
       ├── Detect duplicates
       │
       ├── Detect contradictions
       │
       ├── Calculate usage
       │
       ├── Find stale memories
       │
       ├── Ask LLM for consolidation
       │
       └── Apply changes
              │
              ▼
       Clean Memory Store
```

---

# 19. Recommended Function Map

The entire `03_memory_dreaming_reflection.js` implementation can be understood through these functions:

```javascript
loadMemories()
        ↓
findDuplicates()
        ↓
mergeMemories()
        ↓
detectContradictions()
        ↓
calculateMemoryScore()
        ↓
findEvictionCandidates()
        ↓
reflectOnMemories()
        ↓
applyReflection()
        ↓
updateMemory()
        ↓
deleteMemory()
```

Each function has a single responsibility.

That makes the memory system much easier to understand and extend.

---

# 20. The Most Important Code-Level Idea

The key implementation separation is:

```text
WRITE PATH
User Message
    ↓
Extract Fact
    ↓
Create Memory
```

while cleanup happens separately:

```text
BACKGROUND PATH
Memory Store
    ↓
Analyze
    ↓
Merge
    ↓
Resolve
    ↓
Evict
    ↓
Update
```

So the normal chat request does **not** need to perform expensive memory cleanup every time.

The result is a memory system where:

* conversation history remains available,
* useful memories accumulate,
* duplicate memories can be consolidated,
* newer facts can replace older states,
* unused memories can become eviction candidates, and
* expensive reflection can run asynchronously in the background.
