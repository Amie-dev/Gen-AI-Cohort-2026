# 📘 Day 04 — Note 04: Building RAG with LangChain & Qdrant

> **Goal:** Build a complete RAG application in JavaScript using **LangChain + Qdrant + OpenAI/Gemini embeddings + an LLM**, understand every line of the implementation, and know how to move from a simple demo toward production architecture.

I’ve also corrected a few important gaps in the original code—especially **chunking before embedding** and the distinction between `fromExistingCollection()` and creating/populating a collection. LangChain's current JavaScript docs show `QdrantVectorStore`, `addDocuments()`, `similaritySearch()`, and `asRetriever()` as the core APIs. ([Docs by LangChain][1])

---

# 📑 Table of Contents

1. [What We Are Building](#1-what-we-are-building)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Prerequisites](#4-prerequisites)
5. [Step 1 — Run Qdrant](#5-step-1--run-qdrant)
6. [Step 2 — Install Dependencies](#6-step-2--install-dependencies)
7. [Step 3 — Environment Variables](#7-step-3--environment-variables)
8. [Step 4 — Understand LangChain Documents](#8-step-4--understand-langchain-documents)
9. [Step 5 — PDF Loading](#9-step-5--pdf-loading)
10. [Step 6 — Chunking](#10-step-6--chunking)
11. [Step 7 — Generate Embeddings](#11-step-7--generate-embeddings)
12. [Step 8 — Store in Qdrant](#12-step-8--store-in-qdrant)
13. [Step 9 — Query Qdrant](#13-step-9--query-qdrant)
14. [Step 10 — Build Context](#14-step-10--build-context)
15. [Step 11 — Grounded LLM Prompt](#15-step-11--grounded-llm-prompt)
16. [Complete OpenAI Implementation](#16-complete-openai-implementation)
17. [Gemini Version](#17-gemini-version)
18. [Indexing vs Querying](#18-indexing-vs-querying)
19. [Common Errors](#19-common-errors)
20. [Production Improvements](#20-production-improvements)
21. [Interview Questions](#21-interview-questions)
22. [Final Mental Model](#22-final-mental-model)

---

# 1. What We Are Building

We're going to build a simple **PDF Question Answering system**.

Suppose we have:

```text
dsa.pdf
```

containing 100 pages of notes.

User asks:

> **"What is black box testing?"**

Our application will:

```text
PDF
 ↓
Extract text
 ↓
Split into chunks
 ↓
Generate embeddings
 ↓
Store vectors in Qdrant
```

Then:

```text
User Question
 ↓
Generate query embedding
 ↓
Search Qdrant
 ↓
Get relevant chunks
 ↓
Build context
 ↓
Send context + question to LLM
 ↓
Generate grounded answer
```

---

# 2. Architecture

The complete architecture:

```text
                    ┌─────────────────┐
                    │     PDF         │
                    │    dsa.pdf      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PDFLoader     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Chunking    │
                    │  1000 / 200     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Embeddings    │
                    │ text-embedding  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Qdrant      │
                    │  Vector Store   │
                    └────────┬────────┘
                             ▲
                             │
                      Similarity Search
                             │
                             │
                    ┌────────┴────────┐
                    │  User Question  │
                    └────────┬────────┘
                             │
                             ▼
                    Query Embedding
                             │
                             ▼
                       Top-K Chunks
                             │
                             ▼
                     Context Builder
                             │
                             ▼
                     System Prompt
                             │
                             ▼
                            LLM
                             │
                             ▼
                          Answer
```

---

# 3. Project Structure

A clean structure:

```text
rag-app/
│
├── docker-compose.yml
├── package.json
├── .env
│
├── documents/
│   └── dsa.pdf
│
└── src/
    ├── openai/
    │   ├── indexing.js
    │   └── query.js
    │
    └── gemini/
        ├── indexing.js
        └── query.js
```

For a larger project, I'd eventually separate:

```text
src/
├── config/
├── loaders/
├── embeddings/
├── vectorstore/
├── retrieval/
├── prompts/
├── llm/
└── api/
```

But for learning, the smaller structure is easier.

---

# 4. Prerequisites

You need:

* Node.js
* npm
* Docker
* OpenAI API key **or** Gemini API key
* A PDF document

Check Node:

```bash
node --version
```

Check Docker:

```bash
docker --version
```

---

# 5. Step 1 — Run Qdrant

Qdrant is our vector database.

Qdrant's local setup exposes the REST API on **6333**, gRPC on **6334**, and the local dashboard at `localhost:6333/dashboard`. ([Qdrant][2])

## `docker-compose.yml`

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant

    ports:
      - "6333:6333"
      - "6334:6334"

    volumes:
      - qdrant_storage:/qdrant/storage

volumes:
  qdrant_storage:
```

Start it:

```bash
docker compose up -d
```

Check:

```bash
docker ps
```

You should see:

```text
qdrant
```

Open:

```text
http://localhost:6333/dashboard
```

([Qdrant][2])

### Why use a volume?

Without persistent storage:

```text
Docker container
    ↓
Qdrant data
    ↓
Container deleted
    ↓
Data may disappear
```

With:

```text
Docker
 ↓
Named volume
 ↓
Qdrant storage
```

your local vector database persists across container recreation.

Qdrant also recommends persistent storage and additional security considerations for production deployments. ([Qdrant][3])

---

# 6. Step 2 — Install Dependencies

For OpenAI:

```bash
npm install \
  @langchain/core \
  @langchain/community \
  @langchain/openai \
  @langchain/qdrant \
  @langchain/textsplitters
```

For Gemini:

```bash
npm install @langchain/google-genai
```

For PDF loading:

```bash
npm install pdf-parse
```

The current LangChain JavaScript docs use `@langchain/qdrant`, `@langchain/core`, and `@langchain/openai` for the Qdrant/OpenAI setup. ([Docs by LangChain][1])

---

# 7. Step 3 — Environment Variables

Create:

```text
.env
```

For OpenAI:

```env
OPENAI_API_KEY=your_openai_key
QDRANT_URL=http://localhost:6333
```

For Gemini:

```env
GOOGLE_API_KEY=your_google_key
QDRANT_URL=http://localhost:6333
```

### Never do this:

```javascript
const apiKey = "sk-xxxxxxxx";
```

Keep credentials outside your source code.

---

# 8. Understand LangChain Documents

LangChain represents loaded content using a `Document`.

Conceptually:

```javascript
{
  pageContent: "Black box testing is...",
  
  metadata: {
    source: "dsa.pdf",
    page: 14
  }
}
```

So:

```text
Document
├── pageContent
└── metadata
```

### `pageContent`

Contains actual text:

```text
Black box testing is...
```

### `metadata`

Contains information about that text:

```javascript
{
  source: "dsa.pdf",
  page: 14
}
```

Metadata is extremely useful for:

* citations
* filtering
* debugging
* authorization
* document management

---

# 9. Step 5 — PDF Loading

LangChain provides `PDFLoader` for PDF documents. The loader produces LangChain `Document` objects, which can then be further split before indexing. ([Docs by LangChain][4])

```javascript
import { PDFLoader } 
  from "@langchain/community/document_loaders/fs/pdf";

const loader = new PDFLoader("./documents/dsa.pdf");

const documents = await loader.load();

console.log(documents.length);
```

You might get:

```text
45
```

meaning the loader produced 45 document objects/pages.

Inspect one:

```javascript
console.log(documents[0]);
```

Conceptually:

```javascript
Document {
  pageContent: "...",
  metadata: {
    source: "...",
    loc: {
      pageNumber: 1
    }
  }
}
```

---

# 10. Step 6 — Chunking

This is an **important improvement** over the original indexing example.

The original example directly did:

```javascript
await vectorStore.addDocuments(document);
```

That can work, but for a serious RAG pipeline, you usually want to split the loaded pages into smaller chunks first.

LangChain recommends `RecursiveCharacterTextSplitter` as a strong starting point for generic text. It attempts to preserve larger semantic units such as paragraphs before falling back to smaller separators. ([Docs by LangChain][5])

Install:

```bash
npm install @langchain/textsplitters
```

Then:

```javascript
import {
  RecursiveCharacterTextSplitter
} from "@langchain/textsplitters";
```

Create splitter:

```javascript
const splitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
```

Split:

```javascript
const chunks =
  await splitter.splitDocuments(documents);
```

Now:

```text
45 PDF pages
      ↓
    Chunking
      ↓
500+ smaller chunks
```

The exact number depends on your document.

### What does `1000` mean?

By default, this splitter measures chunk size by characters, not tokens. ([Docs by LangChain][5])

```text
chunkSize: 1000
```

≈ target maximum of 1000 characters.

### What does `200` mean?

```text
chunkOverlap: 200
```

Adjacent chunks intentionally share some content.

```text
Chunk 1
[==============================]
                 ↓
          shared content
                 ↓
              [==============================]
                    Chunk 2
```

Overlap reduces the chance that important context gets cut exactly at a chunk boundary. ([Docs by LangChain][5])

---

# 11. Step 7 — Generate Embeddings

Now each chunk becomes a vector.

Example:

```text
"Black box testing focuses on inputs and outputs."
```

becomes something conceptually like:

```javascript
[
  0.123,
  -0.452,
  0.817,
  ...
]
```

With OpenAI:

```javascript
import { OpenAIEmbeddings }
  from "@langchain/openai";

const embeddings =
  new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });
```

### Critical rule

The model used during indexing and querying must be compatible and, in practice, you should use the **same embedding model** for both.

```text
INDEXING

Document
   ↓
text-embedding-3-small
   ↓
Vector
   ↓
Qdrant
```

Then:

```text
QUERY

Question
   ↓
text-embedding-3-small
   ↓
Vector
   ↓
Qdrant Search
```

Don't randomly switch embedding models between indexing and querying.

---

# 12. Step 8 — Store in Qdrant

Now we have:

```text
Chunk
+
Embedding
+
Metadata
```

and send them to Qdrant.

LangChain's Qdrant integration exposes `addDocuments()` for adding LangChain documents to a vector store. ([Docs by LangChain][1])

There are two concepts worth understanding.

## `fromExistingCollection()`

```javascript
const vectorStore =
  await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      collectionName: "chaicode-docs",
    }
  );
```

This means:

> "Connect me to a Qdrant collection that already exists."

Then:

```javascript
await vectorStore.addDocuments(chunks);
```

adds vectors.

---

## Why this matters

Your original code used:

```javascript
fromExistingCollection()
```

during indexing.

That assumes the collection has already been created/configured appropriately.

For a first-time indexing flow, a more convenient pattern is often to create/populate the vector store from the documents, depending on the integration/version.

For learning, remember:

```text
Existing collection
       ↓
fromExistingCollection()

New/populated vector store
       ↓
fromDocuments(...) / equivalent initialization
```

And after initialization:

```text
addDocuments(...)
```

adds more documents.

The current LangChain Qdrant documentation explicitly demonstrates connecting with `fromExistingCollection()` and then using `addDocuments()`. ([Docs by LangChain][1])

---

# 13. Step 9 — Query Qdrant

User asks:

```javascript
const question =
  "What is black box testing?";
```

Create the same embedding model:

```javascript
const embeddings =
  new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });
```

Connect to Qdrant:

```javascript
const vectorStore =
  await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      collectionName: "chaicode-docs",
    }
  );
```

Now search:

```javascript
const results =
  await vectorStore.similaritySearch(
    question,
    5
  );
```

This means:

> Find the 5 most semantically similar documents/chunks.

LangChain's current Qdrant integration supports both direct similarity search and conversion of the vector store into a retriever. ([Docs by LangChain][1])

---

# 14. Retriever vs Similarity Search

You can directly search:

```javascript
const results =
  await vectorStore.similaritySearch(
    question,
    5
  );
```

Or create a retriever:

```javascript
const retriever =
  vectorStore.asRetriever({
    k: 5,
  });

const results =
  await retriever.invoke(question);
```

Think of:

```text
Vector Store
     │
     ▼
 Retriever
     │
     ▼
 Relevant Documents
```

A retriever is an abstraction around the retrieval operation.

---

# 15. Step 10 — Build Context

Suppose Qdrant returns:

```text
Chunk 1
Black box testing...

Chunk 2
Testing focuses on inputs and outputs...

Chunk 3
The tester doesn't need to know internal implementation...
```

We convert those results into context.

```javascript
const context = results
  .map((doc, index) => {
    return `
SOURCE ${index + 1}

Document:
${doc.metadata.source}

Page:
${doc.metadata.loc?.pageNumber ?? "Unknown"}

Content:
${doc.pageContent}
`;
  })
  .join("\n\n");
```

Now:

```text
SOURCE 1

Document: dsa.pdf
Page: 14

Content:
Black box testing is...
```

---

# 16. Step 11 — Grounded LLM Prompt

Now we have:

```text
Question
+
Retrieved Context
```

We give both to the LLM.

A better prompt:

```javascript
const SYSTEM_PROMPT = `
You are a document question-answering assistant.

Your job is to answer using ONLY the provided context.

Rules:
1. Do not invent facts.
2. Do not use outside knowledge.
3. If the answer is not present in the context,
   say:
   "I couldn't find this information in the provided documents."
4. Keep the answer concise.
5. Mention the source document and page when available.

CONTEXT:
${context}
`;
```

Then:

```text
System Prompt
       +
Retrieved Context
       +
User Question
       ↓
      LLM
       ↓
Grounded Answer
```

---

# 17. Complete OpenAI Implementation

## `src/openai/indexing.js`

```javascript
import { PDFLoader }
  from "@langchain/community/document_loaders/fs/pdf";

import {
  RecursiveCharacterTextSplitter
} from "@langchain/textsplitters";

import { OpenAIEmbeddings }
  from "@langchain/openai";

import { QdrantVectorStore }
  from "@langchain/qdrant";


const FILE_PATH = "./documents/dsa.pdf";

const QDRANT_URL =
  process.env.QDRANT_URL ||
  "http://localhost:6333";

const COLLECTION_NAME =
  "chaicode-docs";


async function indexDocument() {

  // --------------------------------
  // 1. Load PDF
  // --------------------------------

  const loader =
    new PDFLoader(FILE_PATH);

  const documents =
    await loader.load();

  console.log(
    `Loaded ${documents.length} pages`
  );


  // --------------------------------
  // 2. Split into chunks
  // --------------------------------

  const splitter =
    new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

  const chunks =
    await splitter.splitDocuments(
      documents
    );

  console.log(
    `Created ${chunks.length} chunks`
  );


  // --------------------------------
  // 3. Embedding model
  // --------------------------------

  const embeddings =
    new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
    });


  // --------------------------------
  // 4. Connect to Qdrant
  // --------------------------------

  const vectorStore =
    await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: QDRANT_URL,
        collectionName: COLLECTION_NAME,
      }
    );


  // --------------------------------
  // 5. Store chunks
  // --------------------------------

  await vectorStore.addDocuments(
    chunks
  );

  console.log(
    "Documents indexed successfully!"
  );
}


indexDocument().catch(console.error);
```

### Important

For a brand-new collection, make sure the collection exists/is initialized before using `fromExistingCollection()`. Alternatively, use the appropriate vector-store creation flow for your installed LangChain/Qdrant version.

This distinction is important because:

```javascript
fromExistingCollection()
```

doesn't mean:

```text
"create a brand-new collection from nothing"
```

It means:

```text
"connect to an existing collection"
```

---

# 18. Complete Query Implementation

## `src/openai/query.js`

```javascript
import OpenAI from "openai";

import { OpenAIEmbeddings }
  from "@langchain/openai";

import { QdrantVectorStore }
  from "@langchain/qdrant";


const QDRANT_URL =
  process.env.QDRANT_URL ||
  "http://localhost:6333";

const COLLECTION_NAME =
  "chaicode-docs";


const client =
  new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY,
  });


async function query(userQuery) {

  // --------------------------------
  // 1. Same embedding model
  // --------------------------------

  const embeddings =
    new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey:
        process.env.OPENAI_API_KEY,
    });


  // --------------------------------
  // 2. Connect to Qdrant
  // --------------------------------

  const vectorStore =
    await QdrantVectorStore
      .fromExistingCollection(
        embeddings,
        {
          url: QDRANT_URL,
          collectionName:
            COLLECTION_NAME,
        }
      );


  // --------------------------------
  // 3. Retrieve top K
  // --------------------------------

  const retriever =
    vectorStore.asRetriever({
      k: 5,
    });

  const results =
    await retriever.invoke(
      userQuery
    );


  // --------------------------------
  // 4. Build context
  // --------------------------------

  const context =
    results
      .map((doc, index) => {

        return `
SOURCE ${index + 1}

Document:
${doc.metadata.source}

Page:
${doc.metadata.loc?.pageNumber ?? "Unknown"}

Content:
${doc.pageContent}
`;
      })
      .join("\n\n");


  // --------------------------------
  // 5. Build system prompt
  // --------------------------------

  const SYSTEM_PROMPT = `
You are a document question-answering assistant.

Answer ONLY using the provided context.

Rules:
- Do not invent information.
- Do not use outside knowledge.
- If the answer is not in the context,
  say:
  "I couldn't find this information in
  the provided documents."
- Keep the answer concise.
- Mention document and page when available.

CONTEXT:

${context}
`;


  // --------------------------------
  // 6. Call LLM
  // --------------------------------

  const response =
    await client.chat.completions.create({

      model: "gpt-4o",

      messages: [

        {
          role: "system",
          content:
            SYSTEM_PROMPT,
        },

        {
          role: "user",
          content:
            userQuery,
        },

      ],
    });


  // --------------------------------
  // 7. Print answer
  // --------------------------------

  console.log(
    "\n--- ANSWER ---\n"
  );

  console.log(
    response
      .choices[0]
      .message
      .content
  );
}


query(
  "What is black box testing?"
).catch(console.error);
```

---

# 19. Run the Application

Start Qdrant:

```bash
docker compose up -d
```

Index:

```bash
node --env-file=.env src/openai/indexing.js
```

Expected:

```text
Loaded 45 pages
Created 312 chunks
Documents indexed successfully!
```

Then query:

```bash
node --env-file=.env src/openai/query.js
```

Expected:

```text
--- ANSWER ---

Black box testing is a testing method where
the tester focuses on the system's inputs and
outputs without relying on knowledge of its
internal implementation.

Source: dsa.pdf
Page: 14
```

---

# 20. Gemini Version

The architecture doesn't change.

Only the embedding provider and LLM provider change.

```text
                RAG
                 │
        ┌────────┴────────┐
        │                 │
      OpenAI            Gemini
        │                 │
   Embeddings         Embeddings
        │                 │
        └────────┬────────┘
                 │
              Qdrant
```

For Gemini embeddings:

```javascript
import {
  GoogleGenerativeAIEmbeddings
} from "@langchain/google-genai";

const embeddings =
  new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
  });
```

**Important:** use the exact embedding model consistently for both indexing and querying, and configure Qdrant's collection/vector dimensions accordingly.

Then:

```javascript
const vectorStore =
  await QdrantVectorStore
    .fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        collectionName:
          "chaicode-gemini-docs",
      }
    );
```

---

# 21. OpenAI vs Gemini RAG Architecture

### OpenAI

```text
PDF
 ↓
Chunk
 ↓
OpenAI Embeddings
 ↓
Qdrant
 ↓
OpenAI Embeddings
 ↓
Search
 ↓
OpenAI LLM
```

### Gemini

```text
PDF
 ↓
Chunk
 ↓
Gemini Embeddings
 ↓
Qdrant
 ↓
Gemini Embeddings
 ↓
Search
 ↓
Gemini LLM
```

### Critical rule

Don't do:

```text
Index:
OpenAI Embeddings
      ↓
Qdrant

Query:
Gemini Embeddings
      ↓
Qdrant ❌
```

Instead:

```text
Index ──────┐
            │
            ▼
       Same embedding
          model
            ▲
            │
Query ──────┘
```

---

# 22. What Actually Gets Stored in Qdrant?

This is an important concept.

Suppose your chunk is:

```text
Black box testing focuses on the external
behavior of the system.
```

Qdrant stores something conceptually like:

```javascript
{
  vector: [
    0.021,
    -0.124,
    0.542,
    ...
  ],

  payload: {
    pageContent:
      "Black box testing focuses...",

    metadata: {
      source: "dsa.pdf",

      loc: {
        pageNumber: 14
      }
    }
  }
}
```

So Qdrant isn't just storing:

```text
Vector ❌
```

It's effectively:

```text
Vector
+
Payload
```

The payload can contain the original content and metadata.

Qdrant describes its stored points as vectors with associated payload, and LangChain's Qdrant integration exposes metadata filtering on those payload fields. ([Docs by LangChain][1])

---

# 23. Metadata Filtering

Suppose your database contains:

```text
HR.pdf
Engineering.pdf
Finance.pdf
```

User asks:

> "What is the leave policy?"

You could search everything.

But production systems may filter:

```javascript
const filter = {
  must: [
    {
      key: "metadata.department",
      match: {
        value: "HR"
      }
    }
  ]
};
```

Then:

```javascript
const results =
  await vectorStore.similaritySearch(
    "What is the leave policy?",
    5,
    filter
  );
```

This gives you:

```text
Query
 ↓
Metadata Filter
 ↓
Semantic Search
 ↓
Relevant HR chunks
```

LangChain's current Qdrant integration documents metadata filters for narrowing similarity searches. ([Docs by LangChain][1])

This becomes extremely important when building:

* SaaS applications
* enterprise RAG
* multi-tenant systems
* private knowledge bases

---

# 24. Why `k = 5`?

You might see:

```javascript
asRetriever({
  k: 5
});
```

`k` means:

> **How many documents/chunks should retrieval return?**

For example:

```text
k = 3
```

returns:

```text
Chunk 12
Chunk 48
Chunk 71
```

While:

```text
k = 10
```

returns:

```text
Chunk 12
Chunk 48
Chunk 71
...
Chunk 99
```

### Don't blindly assume 5 is optimal.

The right value depends on:

* chunk size
* document structure
* question complexity
* context window
* retrieval quality
* reranking strategy

Start with:

```text
3–10
```

and evaluate.

---

# 25. Similarity Search With Scores

Sometimes you want to inspect how relevant the retrieved chunks were.

```javascript
const results =
  await vectorStore.similaritySearchWithScore(
    question,
    5
  );
```

You can inspect:

```javascript
for (const [doc, score] of results) {
  console.log({
    score,
    content: doc.pageContent,
    metadata: doc.metadata
  });
}
```

Conceptually:

```text
0.92 → highly relevant
0.87 → relevant
0.41 → probably weak
```

But **don't assume a universal score threshold** such as `0.8 = correct`. Score behavior depends on the metric, embedding model, and data.

LangChain's Qdrant documentation provides `similaritySearchWithScore()` for retrieving documents together with their scores. ([Docs by LangChain][1])

---

# 26. RAG Is NOT Just "Vector DB + LLM"

A beginner often thinks:

```text
RAG =
Qdrant + LLM
```

Not exactly.

A useful mental model is:

```text
                RAG
                 │
     ┌───────────┴───────────┐
     │                       │
  INDEXING                 QUERY
     │                       │
 Extraction              Query
     ↓                       ↓
 Chunking               Embedding
     ↓                       ↓
 Embedding              Retrieval
     ↓                       ↓
 Qdrant                Filtering
                             ↓
                         Reranking
                             ↓
                          Context
                             ↓
                         Prompt
                             ↓
                            LLM
                             ↓
                          Answer
```

---

# 27. Common Mistake #1 — No Chunking

Bad:

```javascript
const documents =
  await loader.load();

await vectorStore.addDocuments(
  documents
);
```

This can leave retrieval operating on relatively coarse page-sized documents.

Better:

```javascript
const documents =
  await loader.load();

const chunks =
  await splitter.splitDocuments(
    documents
  );

await vectorStore.addDocuments(
  chunks
);
```

LangChain's own knowledge-base guide demonstrates loading PDF pages and then further splitting them before indexing. ([Docs by LangChain][6])

---

# 28. Common Mistake #2 — Wrong Embedding Model

Wrong:

```text
Index → OpenAI
Query → Gemini
```

Correct:

```text
Index → OpenAI
Query → OpenAI
```

or:

```text
Index → Gemini
Query → Gemini
```

---

# 29. Common Mistake #3 — Losing Metadata

Bad:

```javascript
{
  pageContent: text
}
```

Better:

```javascript
{
  pageContent: text,

  metadata: {
    source: "dsa.pdf",
    page: 14,
    section: "Testing"
  }
}
```

Without metadata:

```text
Answer
 ↓
"Where did this come from?"
 ↓
Unknown ❌
```

With metadata:

```text
Answer
 ↓
dsa.pdf
Page 14
 ↓
Source available ✅
```

---

# 30. Common Mistake #4 — Huge Chunks

Bad:

```text
10,000 characters
      ↓
1 embedding
```

Potentially:

```text
many unrelated topics
      ↓
one vague vector
```

Better:

```text
10,000 characters
       ↓
chunking
       ↓
10 focused chunks
       ↓
10 embeddings
```

---

# 31. Common Mistake #5 — Too Much Context

Retrieval:

```text
Top 50 chunks
```

Then:

```text
50 chunks
 ↓
LLM
```

may introduce:

* irrelevant information
* higher token cost
* higher latency
* conflicting context

A production system often uses:

```text
Retrieve more
      ↓
Rerank
      ↓
Select best
      ↓
LLM
```

For example:

```text
Qdrant
 ↓
Top 20
 ↓
Reranker
 ↓
Top 5
 ↓
LLM
```

---

# 32. Common Mistake #6 — Exposing Qdrant Publicly

For local development:

```text
localhost:6333
```

is fine.

But don't casually expose an unsecured Qdrant instance to the public internet.

Qdrant's documentation notes that default local/self-hosted configurations can have no authentication and recommends securing deployments with appropriate network controls, API keys/TLS, and production infrastructure practices. ([Qdrant][7])

For example, don't treat:

```text
http://your-server:6333
```

as automatically secure.

---

# 33. Production RAG Architecture

A more realistic system:

```text
                         DOCUMENTS
                             │
                             ▼
                     ┌───────────────┐
                     │   Ingestion   │
                     └───────┬───────┘
                             │
                             ▼
                     ┌───────────────┐
                     │ Text Extract  │
                     └───────┬───────┘
                             │
                             ▼
                     ┌───────────────┐
                     │   Chunking    │
                     └───────┬───────┘
                             │
                             ▼
                     ┌───────────────┐
                     │  Embeddings   │
                     └───────┬───────┘
                             │
                             ▼
                        ┌─────────┐
                        │ Qdrant  │
                        └────┬────┘
                             │
═════════════════════════════╪══════════════════════════════
                             │
                         USER QUERY
                             │
                             ▼
                      Query Embedding
                             │
                             ▼
                      Access Control
                             │
                             ▼
                      Metadata Filter
                             │
                             ▼
                       Vector Search
                             │
                             ▼
                       Top 20 chunks
                             │
                             ▼
                         Reranker
                             │
                             ▼
                        Top 5 chunks
                             │
                             ▼
                      Context Builder
                             │
                             ▼
                    Prompt + Guardrails
                             │
                             ▼
                            LLM
                             │
                             ▼
                     Answer + Citations
```

---

# 34. Important: RAG Security

This connects directly with the security topics you're learning.

Suppose:

```text
Company
├── Public documents
├── HR documents
├── Finance documents
└── CEO documents
```

User:

```text
Employee A
```

shouldn't automatically retrieve:

```text
CEO salary.pdf ❌
```

So production RAG needs:

```text
Authentication
      ↓
Authorization
      ↓
Metadata filtering
      ↓
Retrieval
```

For example:

```javascript
const filter = {
  must: [
    {
      key: "metadata.userId",
      match: {
        value: user.id
      }
    }
  ]
};
```

The important principle is:

> **Do not rely on the LLM to enforce access control.**

Access control should happen **before the protected data reaches the model**.

---

# 35. Indexing vs Querying

| Indexing                 | Query                 |
| ------------------------ | --------------------- |
| Offline                  | Online                |
| PDF/document             | User question         |
| Extract text             | Embed question        |
| Chunk                    | Search                |
| Generate embeddings      | Retrieve Top-K        |
| Store vectors            | Filter/rerank         |
| Store metadata           | Build context         |
| Update when data changes | Runs per user request |

### Easy way to remember:

```text
INDEXING = Prepare knowledge

QUERY = Find knowledge
```

---

# 36. What Does LangChain Actually Do?

LangChain isn't the vector database.

It acts as an abstraction/orchestration layer.

```text
Your Application
       │
       ▼
    LangChain
       │
 ┌─────┼─────────┐
 ▼     ▼         ▼
Loader Embedding VectorStore
              │
              ▼
            Qdrant
```

For example:

```javascript
vectorStore.similaritySearch(
  question,
  5
);
```

LangChain hides some of the lower-level database interaction.

This makes it easier to change components.

For example:

```text
Qdrant
   ↓
Pinecone
   ↓
pgvector
```

without rewriting your entire RAG architecture.

LangChain's vector-store abstraction exposes common operations such as adding documents, deleting data, and similarity search across different vector-store implementations. ([Docs by LangChain][8])

---

# 37. End-to-End Code Flow

The entire application can be remembered as:

```javascript
// INDEXING

const documents =
  await loader.load();

const chunks =
  await splitter.splitDocuments(
    documents
  );

await vectorStore.addDocuments(
  chunks
);
```

Then:

```javascript
// QUERY

const results =
  await retriever.invoke(
    userQuestion
  );

const context =
  buildContext(results);

const answer =
  await llm.invoke({
    context,
    question: userQuestion
  });
```

Or in plain English:

```text
LOAD
 ↓
SPLIT
 ↓
EMBED
 ↓
STORE
 ↓
SEARCH
 ↓
RETRIEVE
 ↓
AUGMENT
 ↓
GENERATE
```

---

# 38. Interview Questions

### Q1. Why do we need a vector database?

> To efficiently store embeddings and perform similarity search over large collections of vectors.

---

### Q2. Why do we chunk documents?

> To create focused retrievable units, improve semantic retrieval, and avoid embedding very large documents as a single vector.

---

### Q3. What is `chunkOverlap`?

> The amount of content shared between adjacent chunks, which helps preserve context across chunk boundaries.

---

### Q4. What is `k`?

> The number of top results returned by the retriever.

---

### Q5. Why must the embedding model be consistent?

> Because document vectors and query vectors need to live in the same embedding space for meaningful similarity comparisons.

---

### Q6. What is Qdrant?

> A vector similarity search engine/database used to store embeddings and associated payload/metadata and retrieve semantically similar records.

---

### Q7. What is a retriever?

> An abstraction that takes a query and returns relevant documents/chunks from a knowledge source such as a vector store.

---

### Q8. Why preserve metadata?

> For source attribution, filtering, debugging, document management, and authorization.

---

### Q9. Why not send the entire PDF to the LLM?

> It wastes context, increases cost and latency, and can reduce retrieval precision. RAG retrieves only the relevant portions.

---

### Q10. What is grounded generation?

> Generating an answer using retrieved evidence supplied as context rather than relying only on the model's parametric knowledge.

---

# 39. Day 04 — Hands-On Cheat Sheet

## Start Qdrant

```bash
docker compose up -d
```

## Install

```bash
npm install \
  @langchain/core \
  @langchain/community \
  @langchain/openai \
  @langchain/qdrant \
  @langchain/textsplitters \
  pdf-parse
```

## Load

```javascript
const loader =
  new PDFLoader("./documents/dsa.pdf");

const docs =
  await loader.load();
```

## Split

```javascript
const splitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
  });

const chunks =
  await splitter.splitDocuments(docs);
```

## Embed

```javascript
const embeddings =
  new OpenAIEmbeddings({
    model: "text-embedding-3-small"
  });
```

## Store

```javascript
await vectorStore.addDocuments(
  chunks
);
```

## Retrieve

```javascript
const retriever =
  vectorStore.asRetriever({
    k: 5
  });

const results =
  await retriever.invoke(question);
```

## Build Context

```javascript
const context =
  results
    .map(doc => doc.pageContent)
    .join("\n\n");
```

## Generate

```text
System Instructions
+
Retrieved Context
+
User Question
        ↓
       LLM
        ↓
     Answer
```

---

# 🧠 Final Mental Model

The most important thing to remember from Day 04 is this:

```text
                   RAG
                    │
       ┌────────────┴────────────┐
       │                         │
   INDEXING                    QUERY
       │                         │
     PDF                      Question
       ↓                         ↓
  PDFLoader                 Embedding
       ↓                         ↓
   Chunking                 Qdrant Search
       ↓                         ↓
  Embedding                  Top-K
       ↓                         ↓
    Qdrant                  Filtering
                                 ↓
                              Reranking
                                 ↓
                               Context
                                 ↓
                          Prompt + Guardrails
                                 ↓
                                LLM
                                 ↓
                           Answer + Source
```

### 🔥 Remember this sentence:

> **"LangChain orchestrates the pipeline, the embedding model converts meaning into vectors, Qdrant stores and retrieves those vectors, and the LLM uses the retrieved context to generate the final answer."**

And the complete RAG lifecycle is:

```text
INGEST
  ↓
EXTRACT
  ↓
CHUNK
  ↓
EMBED
  ↓
STORE
  ↓
QUERY
  ↓
EMBED
  ↓
RETRIEVE
  ↓
FILTER
  ↓
RERANK
  ↓
AUGMENT
  ↓
GENERATE
  ↓
CITE
```

That is the foundation you need before moving into **hybrid search, reranking, query rewriting, parent-child retrieval, multi-query retrieval, metadata filtering, RAG evaluation, and production RAG security**.

[1]: https://docs.langchain.com/oss/javascript/integrations/vectorstores/qdrant?utm_source=chatgpt.com "QdrantVectorStore integration - Docs by LangChain"
[2]: https://qdrant.tech/documentation/quick-start/?utm_source=chatgpt.com "Local Quickstart - Qdrant"
[3]: https://qdrant.tech/documentation/installation/?utm_source=chatgpt.com "Installation - Qdrant"
[4]: https://docs.langchain.com/oss/javascript/integrations/document_loaders?utm_source=chatgpt.com "Document loader integrations - Docs by LangChain"
[5]: https://docs.langchain.com/oss/javascript/integrations/splitters/recursive_text_splitter?utm_source=chatgpt.com "Splitting recursively - Text splitter integration guide - Docs by LangChain"
[6]: https://docs.langchain.com/oss/javascript/langchain/knowledge-base?utm_source=chatgpt.com "Build a semantic search engine with LangChain - Docs by LangChain"
[7]: https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/?utm_source=chatgpt.com "Secure a Self-Hosted Qdrant Instance"
[8]: https://docs.langchain.com/oss/javascript/integrations/vectorstores/index?utm_source=chatgpt.com "Vector store integrations - Docs by LangChain"
