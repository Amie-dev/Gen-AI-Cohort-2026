# 📚 Week 04 — Day 07: Code Implementation Guide

This document explains the **actual implementation code** for the Day 07 memory-system examples. It focuses on **what each file does, how the code works, how data moves between functions, and how the pieces connect**.

No theory or architecture diagrams are covered here—only the code.

---

# 📁 Project Code Structure

```text
week04/learning/day07/code/sample-code/

├── 01_short_term_memory.js
├── 02_long_term_memory_rag.js
├── 03_memory_dreaming_reflection.js
└── 04_vllm_inference_client.js
```

Each file demonstrates one independent implementation:

| File                               | Implementation                                         |
| ---------------------------------- | ------------------------------------------------------ |
| `01_short_term_memory.js`          | Short-Term Memory with a sliding window                |
| `02_long_term_memory_rag.js`       | Long-Term Memory with fact extraction and retrieval    |
| `03_memory_dreaming_reflection.js` | Memory cleanup, reflection, and contradiction handling |
| `04_vllm_inference_client.js`      | Calling a vLLM OpenAI-compatible inference server      |

---

# 1. `01_short_term_memory.js`

## Purpose

This file implements a simple **Short-Term Memory (STM)** system.

The implementation keeps conversation messages in memory and limits the number of messages returned to the LLM.

The basic flow is:

```text
User Message
     ↓
Store Message
     ↓
Conversation History
     ↓
Apply Sliding Window
     ↓
Return Recent Messages
     ↓
Send to LLM
```

---

## 1.1 Message Storage

The simplest implementation starts with an array:

```javascript
const messages = [];
```

This array represents the conversation history.

A message normally contains:

```javascript
{
  role: "user",
  content: "Hello"
}
```

or:

```javascript
{
  role: "assistant",
  content: "Hi! How can I help?"
}
```

The `role` tells the application who produced the message.

Common values are:

```text
user
assistant
system
```

---

## 1.2 Adding Messages

A function can be used to store new messages:

```javascript
function addMessage(role, content) {
  messages.push({
    role,
    content
  });
}
```

When the user sends:

```javascript
addMessage("user", "My name is Alex");
```

the array becomes:

```javascript
[
  {
    role: "user",
    content: "My name is Alex"
  }
]
```

After the assistant responds:

```javascript
addMessage("assistant", "Nice to meet you, Alex!");
```

the array becomes:

```javascript
[
  {
    role: "user",
    content: "My name is Alex"
  },
  {
    role: "assistant",
    content: "Nice to meet you, Alex!"
  }
]
```

---

# 1.3 Implementing the Sliding Window

The important part of STM is limiting how many messages are sent to the model.

For example:

```javascript
const WINDOW_SIZE = 10;
```

The complete conversation can continue growing, but only the latest messages are selected:

```javascript
function getRecentMessages() {
  return messages.slice(-WINDOW_SIZE);
}
```

### How `slice()` works

Suppose the history contains:

```javascript
[
  "message 1",
  "message 2",
  "message 3",
  "message 4",
  "message 5"
]
```

and:

```javascript
const WINDOW_SIZE = 2;
```

Then:

```javascript
messages.slice(-2);
```

returns:

```javascript
[
  "message 4",
  "message 5"
]
```

The original history is not deleted.

Only the **prompt context** is limited.

---

# 1.4 Building the LLM Prompt

Before calling the LLM, the application retrieves the recent messages:

```javascript
const recentMessages = getRecentMessages();
```

The current user message can then be added:

```javascript
recentMessages.push({
  role: "user",
  content: userQuery
});
```

The resulting array becomes the context sent to the model.

For example:

```javascript
[
  {
    role: "user",
    content: "I am learning JavaScript"
  },
  {
    role: "assistant",
    content: "That's great!"
  },
  {
    role: "user",
    content: "What should I learn next?"
  }
]
```

---

# 1.5 Important Implementation Detail

There are actually **two different concepts**:

```text
Complete History
      ↓
Stored somewhere permanently
```

and:

```text
Recent History
      ↓
Selected for current LLM request
```

The sliding window does not necessarily mean old messages are deleted.

A production application can store the complete history in PostgreSQL, SQLite, MongoDB, Redis, etc., while only loading the latest `N` messages into the LLM context.

---

# 2. `02_long_term_memory_rag.js`

## Purpose

This file extends the memory system by storing information that should survive beyond the short-term conversation.

The implementation generally contains four steps:

```text
Conversation
    ↓
Extract Important Facts
    ↓
Create Memory Records
    ↓
Generate Embeddings
    ↓
Store Memories
    ↓
Retrieve Relevant Memories
```

---

# 2.1 Representing a Memory

A memory can be represented as an object:

```javascript
const memory = {
  userId: "user_123",
  content: "User prefers vegetarian food.",
  type: "semantic",
  createdAt: Date.now()
};
```

Each memory contains information about:

* Which user owns it
* What was remembered
* What type of memory it is
* When it was created

---

# 2.2 Fact Extraction

The application receives a normal conversation:

```text
User:
I recently moved to Tokyo and I follow a gluten-free diet.
```

The system needs to identify information worth remembering.

An extraction prompt can be sent to an LLM:

```javascript
const extractionPrompt = `
Extract important long-term facts from the following message.

Message:
${userMessage}

Return the facts as JSON.
`;
```

The model might return:

```json
[
  {
    "fact": "User lives in Tokyo"
  },
  {
    "fact": "User follows a gluten-free diet"
  }
]
```

The application then converts those facts into memory records.

---

# 2.3 Creating Memory Objects

Each extracted fact can become a memory:

```javascript
const memories = extractedFacts.map((fact) => ({
  userId,
  content: fact.fact,
  type: "semantic",
  createdAt: Date.now()
}));
```

For example:

```javascript
[
  {
    userId: "user_123",
    content: "User lives in Tokyo",
    type: "semantic",
    createdAt: 1724500000000
  },
  {
    userId: "user_123",
    content: "User follows a gluten-free diet",
    type: "semantic",
    createdAt: 1724500000000
  }
]
```

---

# 2.4 Generating an Embedding

To make memories searchable semantically, each memory can be converted into an embedding.

Conceptually:

```javascript
const embedding = await createEmbedding(memory.content);
```

For:

```text
User follows a gluten-free diet.
```

the embedding model returns a vector:

```javascript
[
  0.012,
  -0.083,
  0.421,
  ...
]
```

The vector is stored together with the original memory.

---

# 2.5 Memory Storage

A stored record can look like:

```javascript
{
  id: "memory_001",
  userId: "user_123",
  content: "User follows a gluten-free diet.",
  embedding: [...],
  type: "semantic",
  createdAt: 1724500000000
}
```

The important thing is that **the original text should also be stored**.

The embedding is used for searching, while the original text is returned as useful context.

---

# 2.6 Searching Long-Term Memory

When a new question arrives:

```text
What should I order for dinner?
```

the query is converted into an embedding:

```javascript
const queryEmbedding = await createEmbedding(
  "What should I order for dinner?"
);
```

That vector is then compared with stored memory vectors.

The database returns the most relevant memories.

For example:

```javascript
[
  {
    content: "User follows a gluten-free diet.",
    score: 0.91
  },
  {
    content: "User lives in Tokyo.",
    score: 0.72
  }
]
```

---

# 2.7 Building the Final LLM Context

The application now combines multiple sources:

```javascript
const context = {
  systemPrompt,
  longTermMemories,
  recentMessages,
  currentQuery
};
```

For example:

```javascript
const messages = [
  {
    role: "system",
    content: "You are a helpful personal assistant."
  },

  ...longTermMemories.map(memory => ({
    role: "system",
    content: `Memory: ${memory.content}`
  })),

  ...recentMessages,

  {
    role: "user",
    content: currentQuery
  }
];
```

The model now receives:

```text
System:
You are a helpful personal assistant.

Memory:
User follows a gluten-free diet.

Recent conversation:
...

User:
What should I order for dinner?
```

This is the important implementation idea:

```text
STM → recent conversation
LTM → relevant persistent information
Query → current request
```

---

# 2.8 Why Retrieval Happens Before the LLM Call

A common mistake would be:

```javascript
const allMemories = await getAllMemories(userId);
```

and then sending everything to the model.

Instead:

```javascript
const relevantMemories =
  await searchMemories(userId, query);
```

Only relevant memories are included.

This keeps the prompt smaller and prevents unrelated memories from distracting the model.

---

# 3. `03_memory_dreaming_reflection.js`

## Purpose

This file demonstrates the background process responsible for improving the quality of stored memories.

The system can periodically inspect existing memories and identify:

* duplicates
* outdated information
* contradictions
* memories that should be merged
* memories that should be removed

The important idea is that this happens **separately from the normal user request path**.

---

# 3.1 Loading Existing Memories

The process starts by loading memories:

```javascript
const memories = await memoryStore.getMemories(userId);
```

Example:

```javascript
[
  {
    id: "m1",
    content: "User lives in Delhi."
  },
  {
    id: "m2",
    content: "User lives in Tokyo."
  },
  {
    id: "m3",
    content: "User prefers vegetarian food."
  }
]
```

---

# 3.2 Sending Memories to the Reflection Process

The memories can be passed to an LLM for analysis:

```javascript
const prompt = `
Review the following memories.

Identify:
1. Duplicates
2. Contradictions
3. Outdated information
4. Memories that should be merged

Memories:
${JSON.stringify(memories)}
`;
```

The LLM can return structured instructions.

For example:

```json
{
  "delete": ["m1"],
  "keep": ["m2", "m3"]
}
```

The application then processes these instructions.

---

# 3.3 Handling Contradictory Memories

Suppose the database contains:

```text
User lives in Delhi.
User lives in Tokyo.
```

The application should not blindly delete the old information simply because a new memory exists.

Instead, the reflection process determines which memory is newer or more reliable.

For example:

```javascript
if (newMemory.createdAt > oldMemory.createdAt) {
  // New memory becomes the current fact
}
```

A production implementation may also track:

```javascript
{
  confidence,
  source,
  createdAt,
  updatedAt
}
```

This allows the system to make better decisions.

---

# 3.4 Removing Duplicate Memories

Suppose the database contains:

```text
User likes React Native.
User enjoys React Native development.
User is interested in React Native.
```

These may represent the same underlying fact.

The reflection process can merge them into:

```text
User is interested in React Native development.
```

Instead of maintaining three separate memories.

---

# 3.5 Memory Updates

The reflection process can perform operations such as:

```javascript
await memoryStore.delete(memoryId);
```

or:

```javascript
await memoryStore.update(memoryId, updatedMemory);
```

or:

```javascript
await memoryStore.create(newMemory);
```

The important design principle is to keep the original conversation/history immutable while allowing the **derived memory store** to be updated.

---

# 3.6 Background Execution

The reflection process does not need to run every time the user sends a message.

Instead, it can run periodically:

```javascript
setInterval(
  () => runMemoryReflection(),
  60 * 60 * 1000
);
```

That means the normal chat request remains fast while memory cleanup happens separately.

A production application could use:

```text
Cron
Queue
Worker
Background Job
Scheduled Task
```

instead of `setInterval()`.

---

# 4. `04_vllm_inference_client.js`

## Purpose

This file demonstrates how a JavaScript application communicates with a **vLLM server**.

vLLM exposes an API compatible with the OpenAI-style chat/completions interface, so the client code can look very similar to calling a hosted LLM API.

---

# 4.1 Creating the Client

The client normally needs:

```javascript
const client = new OpenAI({
  baseURL: "http://localhost:8000/v1",
  apiKey: "EMPTY"
});
```

The important part is:

```javascript
baseURL
```

Instead of sending requests to a hosted provider, requests are sent to the local/self-hosted vLLM server.

---

# 4.2 Sending a Chat Request

A basic request looks like:

```javascript
const response = await client.chat.completions.create({
  model: "your-model-name",

  messages: [
    {
      role: "user",
      content: "Explain JavaScript closures."
    }
  ]
});
```

The server receives the request and runs inference using the configured model.

---

# 4.3 Reading the Generated Response

The generated text can be extracted from:

```javascript
const answer =
  response.choices[0].message.content;
```

So:

```javascript
console.log(answer);
```

prints the model's response.

---

# 4.4 Adding Conversation Memory

The same client can be combined with STM:

```javascript
const messages = [
  ...recentMessages,
  {
    role: "user",
    content: userQuery
  }
];

const response =
  await client.chat.completions.create({
    model,
    messages
  });
```

This means the inference engine does not need to manage application memory itself.

The application prepares the context.

```text
Application
   ↓
Load STM
   ↓
Retrieve LTM
   ↓
Build messages[]
   ↓
vLLM
   ↓
LLM inference
   ↓
Response
```

---

# 4.5 Streaming Responses

The client can also request streaming:

```javascript
const stream =
  await client.chat.completions.create({
    model,
    messages,
    stream: true
  });
```

Instead of waiting for the entire answer, tokens can be processed as they arrive.

Conceptually:

```text
Request
   ↓
vLLM
   ↓
Token 1 → Client
Token 2 → Client
Token 3 → Client
Token 4 → Client
...
```

This improves the perceived response speed for users.

---

# 5. How the Four Files Work Together

Although the examples are separated into different files, they can be combined into one application.

A complete request can follow this sequence:

```text
1. User sends message
        ↓
2. Load recent STM messages
        ↓
3. Search relevant LTM memories
        ↓
4. Build LLM messages[]
        ↓
5. Send request to vLLM
        ↓
6. Receive assistant response
        ↓
7. Store user + assistant messages
        ↓
8. Extract new long-term facts
        ↓
9. Save new memories
        ↓
10. Background reflection cleans memory later
```

The key code-level separation is:

```text
01_short_term_memory.js
        │
        ├── stores conversation
        └── selects recent messages

02_long_term_memory_rag.js
        │
        ├── extracts facts
        ├── creates embeddings
        ├── stores memories
        └── retrieves relevant memories

03_memory_dreaming_reflection.js
        │
        ├── analyzes memories
        ├── detects duplicates
        ├── resolves contradictions
        └── updates memory store

04_vllm_inference_client.js
        │
        ├── creates LLM client
        ├── sends messages
        └── receives generated output
```

---

# 6. End-to-End Implementation Pattern

A production-style request handler can therefore be organized roughly like this:

```javascript
async function chat(userId, userQuery) {

  // 1. Get recent conversation
  const recentMessages =
    await getRecentMessages(userId);

  // 2. Retrieve relevant long-term memories
  const memories =
    await searchLongTermMemory(
      userId,
      userQuery
    );

  // 3. Build final context
  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant."
    },

    ...memories.map(memory => ({
      role: "system",
      content: `Memory: ${memory.content}`
    })),

    ...recentMessages,

    {
      role: "user",
      content: userQuery
    }
  ];

  // 4. Call LLM / vLLM
  const response =
    await callLLM(messages);

  // 5. Store conversation
  await saveMessage(
    userId,
    "user",
    userQuery
  );

  await saveMessage(
    userId,
    "assistant",
    response
  );

  // 6. Extract new long-term facts
  await extractAndStoreMemories(
    userId,
    userQuery
  );

  // 7. Return response
  return response;
}
```

This is the central implementation pattern behind the examples.

---

# 7. Important Code Responsibilities

Each component should have **one clear responsibility**:

### Conversation Store

Responsible for:

```javascript
saveMessage()
getRecentMessages()
```

### Memory Extractor

Responsible for:

```javascript
extractFacts()
```

### Memory Store

Responsible for:

```javascript
createMemory()
updateMemory()
deleteMemory()
getMemory()
```

### Memory Retriever

Responsible for:

```javascript
searchMemories()
```

### Reflection Worker

Responsible for:

```javascript
detectDuplicates()
detectContradictions()
mergeMemories()
cleanupMemories()
```

### LLM Client

Responsible for:

```javascript
callLLM()
```

or:

```javascript
callVLLM()
```

Keeping these responsibilities separate makes the implementation easier to test, replace, and scale.

---

# 8. Complete Request Lifecycle

The complete code flow can be summarized as:

```text
                    USER QUERY
                        │
                        ▼
              ┌──────────────────┐
              │ Load STM History │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Search LTM       │
              │ Relevant Memory  │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Build messages[] │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ LLM / vLLM Call  │
              └────────┬─────────┘
                       │
                       ▼
                ASSISTANT ANSWER
                       │
              ┌────────┴─────────┐
              ▼                  ▼
       Save Conversation    Extract Facts
                                  │
                                  ▼
                           Store LTM Memory
                                  │
                                  ▼
                       Background Reflection
```

The important point from the implementation is that **memory is not one single database or one single function**. It is a collection of separate operations:

```text
Conversation History
        +
Recent Context Selection
        +
Fact Extraction
        +
Memory Storage
        +
Memory Retrieval
        +
Memory Cleanup
        +
LLM Inference
```

Together, these components turn a stateless LLM API into an application that can maintain useful memory across conversations.
