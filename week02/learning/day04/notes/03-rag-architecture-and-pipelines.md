# 📘 Day 04 — Note 03: RAG Architecture & Pipeline Mechanics

> **Goal:** Understand how a production RAG system works internally—from document ingestion and chunking to embeddings, Qdrant retrieval, prompt augmentation, and grounded LLM responses.

---

# 📑 Table of Contents

1. [What Happens Inside a RAG System?](#1-what-happens-inside-a-rag-system)
2. [The Two RAG Pipelines](#2-the-two-rag-pipelines)
3. [Pipeline 1 — Indexing / Ingestion](#3-pipeline-1--indexing--ingestion)
4. [Document Loading & Text Extraction](#4-document-loading--text-extraction)
5. [Text Chunking](#5-text-chunking)
6. [Chunk Overlap](#6-chunk-overlap)
7. [Metadata](#7-metadata)
8. [Generating Embeddings](#8-generating-embeddings)
9. [Storing Data in Qdrant](#9-storing-data-in-qdrant)
10. [Pipeline 2 — Query / Retrieval](#10-pipeline-2--query--retrieval)
11. [Similarity Search & Top-K](#11-similarity-search--top-k)
12. [Context Construction](#12-context-construction)
13. [Prompt Augmentation](#13-prompt-augmentation)
14. [Grounded Generation](#14-grounded-generation)
15. [Complete Node.js Example](#15-complete-nodejs-example)
16. [Production Architecture](#16-production-architecture)
17. [Common Mistakes](#17-common-mistakes)
18. [Key Takeaways](#18-key-takeaways)

---

# 1. What Happens Inside a RAG System?

Suppose you have a company knowledge base:

```text
company/
├── HR_Policy.pdf
├── Engineering_Guide.pdf
├── Leave_Policy.pdf
├── API_Documentation.pdf
└── Employee_Handbook.pdf
```

A user asks:

> **"How many casual leaves can I take?"**

A normal LLM may not know your company's policy.

RAG does this:

```text
                    USER QUESTION
                         │
                         ▼
              "How many casual leaves?"
                         │
                         ▼
                 Generate Embedding
                         │
                         ▼
                ┌─────────────────┐
                │   Vector DB     │
                │     Qdrant      │
                └────────┬────────┘
                         │
                    Top-K chunks
                         │
                         ▼
              Relevant HR Policy
                         │
                         ▼
                  Build Context
                         │
                         ▼
                   LLM + Context
                         │
                         ▼
                 Grounded Answer
```

The important idea is:

> **The LLM doesn't search your entire database itself. Your application retrieves relevant information and gives that information to the LLM.**

---

# 2. The Two RAG Pipelines

A RAG system has two major pipelines.

```text
                 ┌─────────────────────────────┐
                 │          RAG SYSTEM          │
                 └──────────────┬──────────────┘
                                │
                ┌───────────────┴────────────────┐
                │                                │
                ▼                                ▼
       INDEXING PIPELINE                  QUERY PIPELINE
          Offline                            Online
                │                                │
         Documents                         User Question
                │                                │
          Extract Text                    Create Embedding
                │                                │
            Chunking                       Vector Search
                │                                │
          Embeddings                       Top-K Chunks
                │                                │
          Qdrant Store                    Build Context
                │                                │
                ▼                                ▼
           Vector DB                            LLM
```

### Pipeline 1 — Indexing

Runs when you add/update documents.

```text
PDF
 ↓
Extract Text
 ↓
Chunk
 ↓
Embedding
 ↓
Qdrant
```

### Pipeline 2 — Query

Runs every time the user asks a question.

```text
Question
 ↓
Embedding
 ↓
Qdrant Search
 ↓
Top-K Chunks
 ↓
Prompt
 ↓
LLM
 ↓
Answer
```

---

# 3. Pipeline 1 — Indexing / Ingestion

The indexing pipeline converts raw documents into searchable vectors.

## Step 1 — Document

Example:

```text
employee-handbook.pdf
```

Contains:

```text
Employees receive 12 casual leaves per year.

Casual leaves cannot be carried forward
to the next financial year.
```

---

## Step 2 — Extract text

We first convert the PDF into text.

```text
PDF
 ↓
Text Extraction
 ↓
"Employees receive 12 casual leaves..."
```

For different sources:

| Source   | Possible processing   |
| -------- | --------------------- |
| PDF      | PDF text extraction   |
| DOCX     | DOCX parser           |
| Website  | HTML extraction       |
| Markdown | Markdown parser       |
| Database | SQL query             |
| Images   | OCR                   |
| Audio    | Speech-to-text        |
| Video    | Audio → transcription |

So a more general architecture is:

```text
PDF ────────┐
DOCX ───────┤
Web ────────┤
Database ───┤
Audio ──────┼──► Extraction ──► Text
Images ─────┤
Video ──────┘
```

---

# 4. Document Loading & Text Extraction

For example, using LangChain:

```bash
npm install @langchain/community pdf-parse
```

Example:

```javascript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const loader = new PDFLoader("./employee-handbook.pdf");

const documents = await loader.load();

console.log(documents[0].pageContent);
```

You may get:

```text
Employees receive 12 casual leaves per year...
```

And metadata such as:

```javascript
console.log(documents[0].metadata);
```

Possible result:

```javascript
{
  source: "./employee-handbook.pdf",
  pdf: {
    version: "1.10.100"
  },
  loc: {
    pageNumber: 4
  }
}
```

This metadata becomes extremely useful later.

---

# 5. Text Chunking

Imagine your document contains **100,000 characters**.

We don't want to create one giant embedding:

```text
100,000 characters
        ↓
     1 vector ❌
```

Instead:

```text
100,000 characters
        ↓
      Chunking
        ↓
 ┌───────────┐
 │ Chunk 1   │
 ├───────────┤
 │ Chunk 2   │
 ├───────────┤
 │ Chunk 3   │
 ├───────────┤
 │ Chunk 4   │
 ├───────────┤
 │ ...       │
 └───────────┘
```

Each chunk gets its own embedding.

```text
Chunk 1 → Vector 1
Chunk 2 → Vector 2
Chunk 3 → Vector 3
Chunk 4 → Vector 4
```

### Why?

Because smaller chunks provide more focused semantic representations.

---

## Recursive Character Text Splitter

A common approach in LangChain:

```javascript
import { RecursiveCharacterTextSplitter } 
  from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(documents);

console.log(chunks.length);
```

Here:

```text
chunkSize = 1000
chunkOverlap = 200
```

means approximately:

```text
Chunk 1
[----------------------------------------]
                 1000 chars

Chunk 2
                [----------------------------------------]
                 ↑
              200 overlap
```

---

# 6. Chunk Overlap

Consider this sentence:

```text
The refund policy applies only to purchases
made within 30 days of the original transaction.
```

Without overlap:

```text
Chunk 1:
"The refund policy applies only to purchases"

Chunk 2:
"made within 30 days..."
```

The meaning is split.

With overlap:

```text
Chunk 1:
"The refund policy applies only to purchases
made within 30 days"

Chunk 2:
"made within 30 days of the original transaction..."
```

Now the second chunk still has important context.

### Typical starting point

For general text:

```javascript
{
  chunkSize: 800,
  chunkOverlap: 150
}
```

But there is **no universal perfect value**.

Chunking depends on:

* document type
* language
* average paragraph size
* question complexity
* embedding model
* retrieval quality

---

# 7. Metadata

Metadata is one of the most important parts of a production RAG system.

Don't store only:

```javascript
{
  text: "Employees receive 12 casual leaves..."
}
```

Store useful metadata:

```javascript
{
  text: "Employees receive 12 casual leaves...",
  metadata: {
    source: "employee-handbook.pdf",
    page: 4,
    section: "Leave Policy",
    documentType: "HR",
    department: "HR"
  }
}
```

Now retrieval can tell you:

```text
Answer came from:

employee-handbook.pdf
Page: 4
Section: Leave Policy
```

### Metadata can also enable filtering

For example:

```text
department = "engineering"
```

or:

```text
documentType = "HR"
```

or:

```text
userId = "123"
```

This becomes extremely important for **multi-user RAG and authorization**.

---

# 8. Generating Embeddings

Now each chunk is converted into a vector.

Example:

```text
"Employees receive 12 casual leaves per year."
```

becomes something like:

```javascript
[
  0.023,
  -0.192,
  0.551,
  0.087,
  ...
]
```

For example:

```text
Chunk
  ↓
Embedding Model
  ↓
[0.023, -0.192, 0.551, ...]
```

The same embedding model must be used for:

```text
Document indexing
       +
User query
```

Example:

```text
Documents
   ↓
Embedding Model A
   ↓
Vectors

User Query
   ↓
Embedding Model A
   ↓
Query Vector
```

Not:

```text
Documents → Model A ❌
Query     → Model B ❌
```

---

# 9. Storing Data in Qdrant

Qdrant stores:

```text
Vector
+
Payload
```

Conceptually:

```javascript
{
  vector: [0.12, -0.23, 0.54, ...],

  payload: {
    text: "Employees receive 12 casual leaves...",
    source: "employee-handbook.pdf",
    page: 4,
    section: "Leave Policy"
  }
}
```

Think of Qdrant like:

```text
              QDRANT
        ┌──────────────────┐
        │ Vector            │
        │ [0.12, -0.23...]  │
        │                  │
        │ Payload           │
        │ text             │
        │ source           │
        │ page             │
        │ section          │
        └──────────────────┘
```

---

# 10. Pipeline 2 — Query / Retrieval

Now the user asks:

> **"How many casual leaves do employees get?"**

The query pipeline starts.

---

## Step 1 — User Query

```javascript
const question =
  "How many casual leaves do employees get?";
```

---

## Step 2 — Query Embedding

Convert the question into a vector:

```text
Question
   ↓
Embedding Model
   ↓
[0.21, -0.11, 0.62, ...]
```

---

## Step 3 — Search Qdrant

Qdrant compares the query vector with stored vectors.

```text
Query Vector
     │
     ▼
┌──────────────────────┐
│       QDRANT         │
│                      │
│ Vector 1 → 0.92      │ ← highly relevant
│ Vector 2 → 0.87      │ ← relevant
│ Vector 3 → 0.81      │
│ Vector 4 → 0.43      │
│ Vector 5 → 0.21      │
└──────────────────────┘
```

The exact score interpretation depends on the distance metric.

---

# 11. Similarity Search & Top-K

Suppose we ask for:

```text
topK = 3
```

Qdrant returns the three most relevant chunks.

```javascript
const results = await vectorStore.similaritySearch(
  question,
  3
);
```

Conceptually:

```text
Question
   ↓
Vector
   ↓
Qdrant
   ↓
┌──────────────────────────┐
│ 1. Leave Policy — 0.94   │
│ 2. Employee Handbook — .89│
│ 3. HR Rules — 0.81       │
└──────────────────────────┘
```

### Why Top-K?

Sending every document to the LLM is inefficient.

Instead:

```text
10,000 documents
      ↓
Vector Search
      ↓
Top 5 relevant chunks
      ↓
LLM
```

This reduces:

* token usage
* latency
* cost
* irrelevant context

---

# 12. Context Construction

Suppose Qdrant returns:

```text
Chunk 1:
Employees receive 12 casual leaves per year.

Chunk 2:
Casual leaves cannot be carried forward.

Chunk 3:
Employees must apply for leave through the HR portal.
```

We construct context:

```javascript
const context = results
  .map((doc, index) => {
    return `
SOURCE ${index + 1}
Document: ${doc.metadata.source}
Page: ${doc.metadata.page}

${doc.pageContent}
`;
  })
  .join("\n\n");
```

Result:

```text
SOURCE 1
Document: employee-handbook.pdf
Page: 4

Employees receive 12 casual leaves per year.

SOURCE 2
Document: employee-handbook.pdf
Page: 4

Casual leaves cannot be carried forward.
```

---

# 13. Prompt Augmentation

Now we combine:

```text
System Instructions
+
Retrieved Context
+
User Question
```

Conceptually:

```text
                 ┌───────────────────┐
                 │ System Instructions│
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │ Retrieved Context │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │ User Question     │
                 └─────────┬─────────┘
                           │
                           ▼
                          LLM
                           │
                           ▼
                        Answer
```

Example:

```javascript
const prompt = `
You are a company knowledge assistant.

Answer using ONLY the provided context.

If the answer cannot be found in the context,
say that the information is not available.

Context:
${context}

Question:
${question}
`;
```

---

# 14. Grounded Generation

The LLM now receives:

```text
Context:
Employees receive 12 casual leaves per year.

Question:
How many casual leaves do employees get?
```

It can answer:

> Employees receive **12 casual leaves per year**.

This is called **grounded generation** because the answer is based on retrieved information.

---

# 15. Complete Node.js Example

Here's a simplified JavaScript architecture using LangChain + Qdrant.

## Installation

```bash
npm install @langchain/community
npm install @langchain/openai
npm install @langchain/textsplitters
npm install @qdrant/js-client-rest
```

---

## Project Structure

```text
rag-app/
│
├── documents/
│   └── handbook.pdf
│
├── src/
│   ├── ingest.js
│   ├── retrieve.js
│   ├── prompt.js
│   └── index.js
│
├── .env
└── package.json
```

---

## `.env`

```env
OPENAI_API_KEY=your_api_key
QDRANT_URL=http://localhost:6333
```

---

# 15.1 Start Qdrant

Using Docker:

```bash
docker run -p 6333:6333 qdrant/qdrant
```

Then Qdrant is available at:

```text
http://localhost:6333
```

---

# 15.2 Document Ingestion

```javascript
// src/ingest.js

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } 
  from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

const loader = new PDFLoader(
  "./documents/handbook.pdf"
);

const documents = await loader.load();

console.log(`Loaded ${documents.length} pages`);
```

Now split them:

```javascript
const splitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

const chunks =
  await splitter.splitDocuments(documents);

console.log(`Created ${chunks.length} chunks`);
```

---

## Add useful metadata

```javascript
for (const chunk of chunks) {
  chunk.metadata.documentType = "employee-handbook";
  chunk.metadata.source =
    chunk.metadata.source ?? "handbook.pdf";
}
```

---

## Generate embeddings + store

```javascript
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

await QdrantVectorStore.fromDocuments(
  chunks,
  embeddings,
  {
    url: process.env.QDRANT_URL,
    collectionName: "company-docs",
  }
);

console.log("Documents indexed successfully");
```

The complete ingestion flow is:

```text
PDF
 ↓
PDFLoader
 ↓
Documents
 ↓
Text Splitter
 ↓
Chunks
 ↓
OpenAI Embeddings
 ↓
Qdrant
```

---

# 15.3 Retrieval

```javascript
// src/retrieve.js

import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const vectorStore =
  await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      collectionName: "company-docs",
    }
  );

const question =
  "How many casual leaves do employees get?";
```

Search:

```javascript
const results =
  await vectorStore.similaritySearch(
    question,
    5
  );
```

Inspect:

```javascript
for (const result of results) {
  console.log({
    content: result.pageContent,
    metadata: result.metadata,
  });
}
```

---

# 15.4 Build Context

```javascript
const context = results
  .map((result, index) => {
    return `
--- SOURCE ${index + 1} ---

Document:
${result.metadata.source}

Page:
${result.metadata.loc?.pageNumber ?? "Unknown"}

Content:
${result.pageContent}
`;
  })
  .join("\n");
```

---

# 15.5 Send Context to LLM

For example:

```javascript
const prompt = `
You are a company knowledge assistant.

Rules:
1. Answer only using the provided context.
2. Do not invent information.
3. If the answer is not present, say:
   "I couldn't find this information in the provided documents."
4. Mention the source when possible.

CONTEXT:
${context}

USER QUESTION:
${question}
`;
```

Then send `prompt` to your chosen LLM.

---

# 15.6 Complete Conceptual Flow

```javascript
async function ask(question) {

  // 1. Retrieve
  const results =
    await vectorStore.similaritySearch(
      question,
      5
    );

  // 2. Build context
  const context = results
    .map((doc) => `
      Source: ${doc.metadata.source}
      Page: ${doc.metadata.loc?.pageNumber}
      
      ${doc.pageContent}
    `)
    .join("\n\n");

  // 3. Augment prompt
  const prompt = `
    Answer only using this context:

    ${context}

    Question:
    ${question}
  `;

  // 4. Send prompt to LLM
  const answer = await callLLM(prompt);

  return answer;
}
```

So:

```text
ask(question)
      │
      ▼
Embedding
      │
      ▼
Qdrant
      │
      ▼
Top-K chunks
      │
      ▼
Context
      │
      ▼
Prompt
      │
      ▼
LLM
      │
      ▼
Answer
```

---

# 16. Production Architecture

A real production RAG system is usually more complex than:

```text
Query → Qdrant → LLM
```

A better architecture looks like:

```text
                         ┌───────────────┐
                         │   Documents   │
                         └───────┬───────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Text Extraction │
                        └────────┬────────┘
                                 │
                                 ▼
                         ┌──────────────┐
                         │   Chunking   │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  Embeddings  │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │    Qdrant    │
                         └──────────────┘


USER
 │
 ▼
Query
 │
 ▼
Query Embedding
 │
 ▼
Qdrant Search
 │
 ▼
Metadata / Permission Filter
 │
 ▼
Top-K Results
 │
 ▼
Reranking
 │
 ▼
Context Construction
 │
 ▼
Prompt + Guardrails
 │
 ▼
LLM
 │
 ▼
Answer + Sources
```

Notice the **permission filter**.

This is extremely important for enterprise RAG.

You don't want:

```text
Employee A
   ↓
Search
   ↓
Private documents belonging to Employee B ❌
```

Instead:

```text
User
 ↓
Authentication
 ↓
Authorization
 ↓
Vector Search + Metadata Filter
 ↓
Only permitted documents
```

---

# 17. Common Mistakes

## ❌ Mistake 1 — Sending entire documents to the LLM

Bad:

```text
500-page PDF
      ↓
LLM
```

Better:

```text
500-page PDF
      ↓
Chunk
      ↓
Retrieve relevant chunks
      ↓
LLM
```

---

## ❌ Mistake 2 — No chunk overlap

```text
Chunk 1 | Chunk 2
         ↑
    context lost
```

Use overlap where appropriate.

---

## ❌ Mistake 3 — Mixing embedding models

Wrong:

```text
Documents → OpenAI embeddings

Query → Gemini embeddings ❌
```

Correct:

```text
Documents ──┐
            ├──► Same embedding model
Query ──────┘
```

---

## ❌ Mistake 4 — Losing metadata

Bad:

```javascript
{
  text: "some information"
}
```

Better:

```javascript
{
  text: "some information",
  source: "handbook.pdf",
  page: 42,
  section: "Leave Policy"
}
```

---

## ❌ Mistake 5 — Trusting the LLM blindly

Don't assume:

```text
Retrieved context
      ↓
LLM
      ↓
Always correct ❌
```

The model can still misunderstand or hallucinate.

Use instructions such as:

```text
Use only the supplied context.

If the context does not contain
the answer, say you don't know.

Do not make up facts.
```

And evaluate retrieval + generation separately.

---

## ❌ Mistake 6 — Retrieving too many chunks

Suppose:

```text
Top-K = 50
```

You may introduce lots of irrelevant information.

Start with something like:

```text
Top-K = 3–10
```

and evaluate your actual dataset.

---

## ❌ Mistake 7 — Thinking vector search is always enough

Semantic search can miss exact information such as:

```text
Invoice #INV-928374
Error code: EACCES
Employee ID: EMP-10291
```

For production systems, **hybrid search** can be valuable:

```text
Keyword Search
      +
Vector Search
      ↓
Better Retrieval
```

---

# 18. Chunking vs Retrieval — Important Distinction

These two concepts are often confused.

### Chunking

Answers:

> **"How should I divide my documents?"**

```text
Document
 ↓
Chunk 1
Chunk 2
Chunk 3
```

### Retrieval

Answers:

> **"Which chunks are relevant to this question?"**

```text
Question
 ↓
Search
 ↓
Chunk 17
Chunk 43
Chunk 92
```

Together:

```text
Documents
    ↓
  Chunking
    ↓
Embeddings
    ↓
Vector DB
    ↓
      User Query
          ↓
      Retrieval
          ↓
     Relevant Chunks
```

---

# 🧠 The Most Important Mental Model

Remember RAG as:

> **"Don't make the LLM memorize the entire library. Give it the right pages at the right time."**

```text
                 📚 YOUR KNOWLEDGE
                       │
                       ▼
                    Chunking
                       │
                       ▼
                   Embeddings
                       │
                       ▼
                    QDRANT
                       ▲
                       │
                 Similarity Search
                       ▲
                       │
                  User Question
                       │
                       ▼
                  Relevant Chunks
                       │
                       ▼
                Context + Prompt
                       │
                       ▼
                      LLM
                       │
                       ▼
                   Answer
```

---

# 🔥 Indexing vs Query Pipeline — Interview View

| Indexing Pipeline           | Query Pipeline         |
| --------------------------- | ---------------------- |
| Runs offline/asynchronously | Runs at request time   |
| Starts with documents       | Starts with user query |
| Extract text                | Embed query            |
| Chunk documents             | Search vectors         |
| Generate embeddings         | Retrieve Top-K         |
| Store vectors               | Build context          |
| Store metadata              | Generate answer        |
| Updates knowledge base      | Answers questions      |

### One-line interview answer

> **"In RAG, the indexing pipeline converts documents into metadata-rich vector chunks and stores them in a vector database, while the query pipeline embeds the user's question, retrieves the most relevant chunks, augments the LLM prompt with that context, and generates a grounded response."**

---

# 🎯 Day 04 — Note 03 Final Summary

```text
                  RAG
                   │
        ┌──────────┴──────────┐
        │                     │
     INDEXING                QUERY
        │                     │
     Documents             Question
        ↓                     ↓
  Text Extraction         Embedding
        ↓                     ↓
    Chunking             Vector Search
        ↓                     ↓
   Embeddings              Top-K
        ↓                     ↓
     Qdrant             Context Build
                              ↓
                         Prompt + Rules
                              ↓
                             LLM
                              ↓
                           Answer
```

### Remember these 10 points:

1. **RAG = Retrieval + Augmentation + Generation.**
2. RAG has **Indexing** and **Query** pipelines.
3. Documents must first be converted into text.
4. Large documents are divided into **chunks**.
5. Chunks are converted into **embeddings**.
6. Embeddings + metadata are stored in a vector database such as **Qdrant**.
7. The user's query is embedded using the **same embedding model**.
8. Vector search retrieves the most relevant **Top-K chunks**.
9. Retrieved chunks are added to the LLM's context with appropriate instructions.
10. Production RAG should also consider **metadata filtering, authorization, hybrid retrieval, reranking, citations, evaluation, and guardrails**.

### The complete mental model:

> **Ingest → Extract → Chunk → Embed → Store → Query → Embed → Retrieve → Filter/Rerank → Augment → Generate → Cite**

This is the core RAG pipeline you should understand before moving into **advanced retrieval, hybrid search, reranking, query rewriting, RAG evaluation, and production RAG architecture**.
