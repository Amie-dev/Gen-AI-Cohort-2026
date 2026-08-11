# 📝 Day 04 — Class Lecture Notes

## Retrieval-Augmented Generation (RAG), Vector Databases, Pipelines & System Architecture

> **Goal:** Build a strong mental model of RAG—from why standalone LLMs struggle with private/current information to how documents are indexed, retrieved, and supplied to an LLM. This note also introduces vector databases, multimodal ingestion, and the limitations that lead to Advanced RAG.

---

# 📑 Table of Contents

1. [What is RAG?](#1-what-is-rag)
2. [Why Do We Need RAG?](#2-why-do-we-need-rag)
3. [The Core Problems with Standalone LLMs](#3-the-core-problems-with-standalone-llms)
4. [Why Fine-Tuning Is Not the Same as RAG](#4-why-fine-tuning-is-not-the-same-as-rag)
5. [The Naive Solution: Put Everything in the Prompt](#5-the-naive-solution-put-everything-in-the-prompt)
6. [Human Brain & Library Mental Model](#6-human-brain--library-mental-model)
7. [How RAG Works](#7-how-rag-works)
8. [The Two RAG Pipelines](#8-the-two-rag-pipelines)
9. [Vector Embeddings](#9-vector-embeddings)
10. [Vector Databases](#10-vector-databases)
11. [Popular Vector Databases](#11-popular-vector-databases)
12. [Similarity Search](#12-similarity-search)
13. [Multi-Modal Data Ingestion](#13-multi-modal-data-ingestion)
14. [Metadata & Why It Matters](#14-metadata--why-it-matters)
15. [Naive RAG Architecture](#15-naive-rag-architecture)
16. [Limitations of Naive RAG](#16-limitations-of-naive-rag)
17. [Introduction to Advanced RAG](#17-introduction-to-advanced-rag)
18. [Complete RAG Mental Model](#18-complete-rag-mental-model)
19. [Practical JavaScript Example](#19-practical-javascript-example)
20. [Important Interview Questions](#20-important-interview-questions)
21. [Final Cheat Sheet](#21-final-cheat-sheet)

---

# 1. What is RAG?

**RAG = Retrieval-Augmented Generation**

RAG is an architecture that combines:

```text
Retrieval
    +
LLM Generation
```

Instead of asking an LLM to answer a question only from what it learned during training, we first retrieve relevant information from an external knowledge source.

### Without RAG

```text
User
 │
 ▼
LLM
 │
 ▼
Answer
```

### With RAG

```text
User Question
      │
      ▼
Retrieve Relevant Information
      │
      ▼
Add Retrieved Context
      │
      ▼
LLM
      │
      ▼
Grounded Answer
```

### Example

Suppose your company has:

```text
company-policy.pdf
employee-handbook.pdf
leave-policy.pdf
salary-policy.pdf
```

User asks:

> "How many days of paid leave can an employee take?"

The LLM may not know your company's specific policy.

RAG does:

```text
Question
   │
   ▼
Search company documents
   │
   ▼
Find relevant section
   │
   ▼
Send section + question to LLM
   │
   ▼
Answer
```

For example:

> Employees can take 18 days of paid leave per year.

The important point is that this information came from **your company's documents**, not from the model's training memory.

---

# 2. Why Do We Need RAG?

The fundamental idea is:

> **An LLM is primarily a reasoning/generation engine, not your application's live database.**

Consider an e-commerce application.

Your database contains:

```text
Product: iPhone XYZ
Price: ₹79,999
Stock: 12
Updated: 2 minutes ago
```

You cannot expect an LLM's training knowledge to contain your current inventory.

Instead:

```text
Application Database
        │
        ▼
     Retrieve
        │
        ▼
      LLM
        │
        ▼
"iPhone XYZ costs ₹79,999 and
12 units are currently available."
```

This same principle applies to:

* Company documents
* Internal knowledge bases
* Product catalogs
* Legal documents
* Technical documentation
* Customer support knowledge
* Research papers
* Meeting transcripts
* Educational material

---

# 3. The Core Problems with Standalone LLMs

There are two major problems relevant to RAG.

---

## 3.1 Problem #1 — Knowledge Is Not Automatically Live

An LLM is trained using data available during its training process.

Conceptually:

```text
Internet / Training Data
          │
          ▼
     Model Training
          │
          ▼
       Model Weights
          │
          ▼
        LLM
```

The model doesn't automatically learn every new document created after training.

For example:

```text
Monday:
New company policy created

Tuesday:
New policy updated

Wednesday:
Employee asks LLM about policy
```

A standalone model does not automatically have access to that company's updated document.

### RAG solution

```text
New Document
    │
    ▼
Ingestion
    │
    ▼
Embedding
    │
    ▼
Vector Database
    │
    ▼
Available for Retrieval
```

You can update the knowledge base without retraining the entire foundation model.

---

# 3.2 Problem #2 — Private Data

Companies have sensitive information such as:

```text
Invoices
Contracts
Internal documentation
Private source code
Employee documents
Customer information
Business plans
```

A generic LLM doesn't automatically know this information.

For example:

> "What is invoice #99482 for ACME?"

The model cannot magically know your private invoice.

RAG allows your application to retrieve the relevant invoice data and provide it to the model at inference time.

---

# 4. Why Fine-Tuning Is Not the Same as RAG

A common misconception is:

> "Why don't we just fine-tune the LLM on our documents?"

Fine-tuning and RAG solve different problems.

| Fine-Tuning                                              | RAG                                               |
| -------------------------------------------------------- | ------------------------------------------------- |
| Changes model behavior/weights                           | Provides external context                         |
| Useful for style, behavior, task specialization          | Useful for dynamic/private knowledge              |
| Updating knowledge requires additional training workflow | Documents can be re-indexed                       |
| Knowledge is not naturally returned with source metadata | Retrieval can preserve sources                    |
| Access control is difficult to implement through weights | Metadata filters can enforce retrieval boundaries |

### Example

Suppose you want your AI assistant to always respond in a particular format.

Fine-tuning can be useful.

```text
Input → Model → Desired style/behavior
```

But if you want it to answer from:

```text
100,000 constantly changing company documents
```

RAG is generally a much more natural architecture.

### Important

RAG and fine-tuning are **not mutually exclusive**.

A production system can use:

```text
Fine-tuned Model
       +
RAG
```

---

# 5. The Naive Solution: Put Everything in the Prompt

A beginner might try:

```javascript
const prompt = `
Here are all 5,000 company documents:

${allDocuments}

Now answer:
${userQuestion}
`;
```

This looks simple.

But it doesn't scale.

---

## Problem 1 — Huge Context

Imagine:

```text
10,000 documents
       ↓
Millions of tokens
```

You don't want to send all of that to the LLM for every question.

---

## Problem 2 — Cost

If every request sends thousands or millions of tokens:

```text
Request 1 → huge prompt
Request 2 → huge prompt
Request 3 → huge prompt
...
```

Your inference cost can become enormous.

---

## Problem 3 — Latency

More context generally means more processing.

```text
Small context → faster
Large context → potentially slower
```

---

## Problem 4 — Irrelevant Information

Suppose the user asks:

> "What is our vacation policy?"

Why send:

```text
Finance documents
Engineering documentation
Marketing reports
Legal contracts
Product manuals
...
```

The model only needs the relevant section of the vacation policy.

This is the core idea behind retrieval.

---

# 6. Human Brain & Library Mental Model

Imagine you have a library containing **100,000 books**.

Someone asks:

> "How does TCP connection establishment work?"

You don't:

```text
Memorize all 100,000 books
```

Instead:

### Step 1 — Find relevant book

```text
100,000 books
      ↓
Networking books
```

### Step 2 — Find relevant chapter

```text
Networking book
      ↓
TCP chapter
```

### Step 3 — Read relevant pages

```text
TCP chapter
      ↓
2–3 relevant pages
```

### Step 4 — Answer

```text
Relevant pages
      ↓
Your reasoning
      ↓
Answer
```

RAG follows a similar architecture:

```text
Huge Knowledge Base
        │
        ▼
    Retrieval
        │
        ▼
Relevant Chunks
        │
        ▼
      LLM
        │
        ▼
      Answer
```

### Mental model

> **Vector database = searchable knowledge library**
> **Retriever = librarian**
> **LLM = researcher/writer**

---

# 7. How RAG Works

The basic RAG process:

```text
             USER QUERY
                 │
                 ▼
          Query Embedding
                 │
                 ▼
        Vector Database
                 │
                 ▼
       Relevant Documents
                 │
                 ▼
         Context Construction
                 │
                 ▼
          LLM + Context
                 │
                 ▼
             Answer
```

Let's understand each step.

---

## Step 1 — User asks a question

```text
"What is black box testing?"
```

---

## Step 2 — Convert question into a vector

The embedding model converts the question into numbers.

```text
"What is black box testing?"

          ↓

[0.12, -0.45, 0.78, ...]
```

---

## Step 3 — Search the vector database

Qdrant compares the query vector with document vectors.

```text
Query Vector
     │
     ├── Document A → 0.91
     ├── Document B → 0.82
     ├── Document C → 0.43
     └── Document D → 0.21
```

The highest-relevance documents are retrieved.

---

## Step 4 — Add retrieved context

```text
Question:
"What is black box testing?"

Context:
"Black box testing is a software testing
method where internal implementation is
not known to the tester."
```

---

## Step 5 — LLM generates the answer

```text
Context + Question
        │
        ▼
       LLM
        │
        ▼
"Black box testing is..."
```

---

# 8. The Two RAG Pipelines

RAG has two major workflows.

```text
                  RAG SYSTEM
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
      INDEXING                  QUERY
      PIPELINE                 PIPELINE
       Offline                  Online
```

---

# 9. Indexing Pipeline

The indexing pipeline prepares your knowledge base.

```text
Raw Documents
     │
     ▼
Document Loader
     │
     ▼
Text Extraction
     │
     ▼
Chunking
     │
     ▼
Embeddings
     │
     ▼
Vector Database
```

### Example

```text
dsa.pdf
   │
   ▼
PDFLoader
   │
   ▼
45 pages
   │
   ▼
Chunks
   │
   ▼
Embedding Model
   │
   ▼
Qdrant
```

---

## Why Chunking?

Suppose you have:

```text
500-page book
```

Embedding the entire book as one vector isn't useful.

Instead:

```text
Book
 │
 ├── Chunk 1
 ├── Chunk 2
 ├── Chunk 3
 ├── ...
 └── Chunk N
```

Each chunk gets its own embedding.

---

# 10. Query Pipeline

The query pipeline runs when a user asks something.

```text
User Question
     │
     ▼
Embedding
     │
     ▼
Similarity Search
     │
     ▼
Top-K Chunks
     │
     ▼
Prompt Augmentation
     │
     ▼
LLM
     │
     ▼
Answer
```

---

# 11. Vector Embeddings

An **embedding** converts information into a numerical vector representing semantic characteristics.

Example:

```text
"dog"
   ↓
[0.12, 0.82, -0.14, ...]
```

and:

```text
"puppy"
   ↓
[0.11, 0.80, -0.12, ...]
```

These vectors may be relatively close in the embedding space.

Whereas:

```text
"database indexing"
```

would generally occupy a different region.

### Important

Embeddings don't simply encode dictionary definitions.

They represent patterns learned by the embedding model that are useful for comparing semantic content.

---

# 12. Vector Databases

A vector database stores vectors and allows efficient similarity search.

Example:

```text
Document Chunk
      │
      ▼
Embedding
      │
      ▼
[0.21, -0.31, 0.82, ...]
      │
      ▼
Qdrant
```

A vector database usually stores:

```javascript
{
  vector: [0.21, -0.31, 0.82],
  payload: {
    text: "Black box testing...",
    source: "testing.pdf",
    page: 14
  }
}
```

The **payload/metadata** is extremely important because you don't just want to know which vector matched—you want to know what document and content that vector represents.

---

# 13. Popular Vector Databases

| Database                  | Main Characteristic                                                             |
| ------------------------- | ------------------------------------------------------------------------------- |
| **Qdrant**                | High-performance vector search, payload filtering, easy local Docker deployment |
| **Pinecone**              | Managed cloud vector database                                                   |
| **Weaviate**              | Open-source vector database with broad search capabilities                      |
| **pgvector**              | Vector search inside PostgreSQL                                                 |
| **Chroma**                | Simple developer-friendly vector store                                          |
| **MongoDB Vector Search** | Vector search integrated with MongoDB                                           |
| **Milvus**                | Distributed system designed for large-scale vector workloads                    |

### Qdrant

For learning RAG with JavaScript, Qdrant is particularly convenient because you can run it locally:

```bash
docker compose up -d
```

and connect to:

```text
localhost:6333
```

---

# 14. Similarity Search

Suppose:

```text
Query:
"How can I test software without seeing its source code?"
```

The query becomes:

```text
Q = [0.12, 0.83, -0.42, ...]
```

Stored document vectors might be:

```text
D1 = [0.11, 0.81, -0.40, ...]
D2 = [0.75, -0.20, 0.13, ...]
D3 = [0.13, 0.79, -0.41, ...]
```

Similarity search might produce:

```text
D1 → 0.94
D3 → 0.92
D2 → 0.31
```

So:

```text
Top K = 2

D1
D3
```

are retrieved.

Common distance/similarity functions include:

* Cosine similarity
* Dot product
* Euclidean/L2 distance

---

# 15. Multi-Modal Data Ingestion

Real-world data isn't only text.

You might have:

```text
PDF
DOCX
Audio
Video
Images
Web pages
Subtitles
```

A RAG ingestion system needs an appropriate extractor for each.

---

## PDF

```text
PDF
 ↓
PDF Parser / OCR
 ↓
Text
```

---

## Audio

```text
Audio
 ↓
Speech-to-Text
 ↓
Transcript
```

---

## Video

```text
Video
 ↓
Audio Track
 ↓
Speech-to-Text
 ↓
Transcript
```

For richer systems:

```text
Video
 ├── Audio → Transcript
 └── Frames → Vision/OCR
```

---

## Image

```text
Image
 ↓
OCR / Vision Model
 ↓
Text / Description
```

---

## Subtitle

```text
SRT/VTT
 ↓
Timestamp Parser
 ↓
Text + Timestamp
```

---

## Unified architecture

```text
 PDF ────────► PDF Parser ─────┐
 DOCX ───────► Doc Parser ─────┤
 Audio ──────► STT ────────────┤
 Video ──────► STT/Vision ─────┤
 Image ──────► OCR/Vision ─────┤
 Web ────────► HTML Parser ────┤
                               ▼
                       Normalized Documents
                               │
                               ▼
                            Chunking
                               │
                               ▼
                           Embeddings
                               │
                               ▼
                            Qdrant
```

---

# 16. Metadata & Why It Matters

Don't store only:

```javascript
{
  text: "Revenue increased by 20%"
}
```

Store:

```javascript
{
  text: "Revenue increased by 20%",
  metadata: {
    source: "q3-report.pdf",
    page: 12,
    section: "Revenue",
    type: "pdf"
  }
}
```

For video:

```javascript
{
  text: "The database migration starts Monday.",
  metadata: {
    source: "meeting.mp4",
    timestamp: 325,
    type: "video"
  }
}
```

For audio:

```javascript
{
  text: "The database migration starts Monday.",
  metadata: {
    source: "meeting.mp3",
    startTime: 83,
    endTime: 92,
    speaker: "Speaker 2",
    type: "audio"
  }
}
```

Metadata enables:

### Citations

```text
Source: q3-report.pdf
Page: 12
```

### Filtering

```text
Only search documents where:

department = "engineering"
```

### Access control

```text
User A
  ↓
Only retrieve documents
User A is allowed to see
```

This is an important production concern.

---

# 17. Naive RAG Architecture

The simplest RAG implementation looks like:

```text
                  User Query
                      │
                      ▼
                 Embedding
                      │
                      ▼
                 Vector DB
                      │
                      ▼
                    Top K
                      │
                      ▼
                   Context
                      │
                      ▼
                     LLM
                      │
                      ▼
                   Answer
```

This is often called **Naive RAG**.

It's a great starting point.

But it isn't always sufficient for production.

---

# 18. Limitations of Naive RAG

## 18.1 Vague Queries

User:

> "Why isn't it working?"

The system doesn't know what "it" means.

### Solution

**Query Rewriting**

```text
Original Query
      ↓
LLM
      ↓
Better Search Query
```

---

## 18.2 Chunk Boundary Problems

Suppose:

```text
Chunk 1:
"The API request failed."

Chunk 2:
"This happened because the token expired."
```

Searching only one chunk may lose the explanation.

### Solutions

* Better chunking
* Chunk overlap
* Parent-child retrieval
* Contextual chunking

---

## 18.3 Exact Keyword Problems

Suppose the user searches:

```text
ERR_NODE_9942
```

Dense semantic retrieval isn't always the best tool for exact identifiers.

### Solution

**Hybrid Search**

```text
Dense Vector Search
        +
Keyword/BM25 Search
```

---

## 18.4 Irrelevant Top-K Results

Vector search may retrieve:

```text
Result 1 → relevant
Result 2 → somewhat relevant
Result 3 → irrelevant
Result 4 → relevant
Result 5 → irrelevant
```

### Solution

**Re-ranking**

```text
Retrieve 20
     ↓
Reranker
     ↓
Best 3–5
```

---

# 19. Advanced RAG

Advanced RAG improves the retrieval process.

Instead of:

```text
Query
 ↓
Vector Search
 ↓
LLM
```

we can have:

```text
                 User Query
                     │
                     ▼
              Query Rewriting
                     │
                     ▼
             Hybrid Retrieval
              /           \
             /             \
        Vector Search    BM25
             \             /
              \           /
                   ▼
                 Fusion
                   │
                   ▼
                Reranker
                   │
                   ▼
              Top Documents
                   │
                   ▼
                  LLM
                   │
                   ▼
               Answer
```

---

# 20. Query Rewriting

User:

> "How can I fix this?"

The application can use previous conversation context and rewrite it:

```text
"How can I fix the Qdrant connection
error in my Node.js RAG application?"
```

This creates a better search query.

---

# 21. Multi-Query Retrieval

Another strategy is to create multiple search queries.

Original:

```text
"How does RAG retrieve information?"
```

Generate:

```text
1. How does vector retrieval work in RAG?
2. How does semantic search find relevant documents?
3. How does Qdrant retrieve document chunks?
```

Search each query:

```text
Query 1 ──► Search
Query 2 ──► Search
Query 3 ──► Search
                │
                ▼
         Combine Results
                │
                ▼
             Rerank
```

This increases the chance of finding relevant information.

---

# 22. HyDE

**HyDE = Hypothetical Document Embeddings**

Normal retrieval:

```text
Question
   ↓
Embedding
   ↓
Search
```

HyDE:

```text
Question
   ↓
LLM generates hypothetical answer
   ↓
Embed hypothetical answer
   ↓
Search
```

Example:

```text
Question:
"What is black box testing?"
```

Hypothetical answer:

```text
"Black box testing evaluates software
behavior without requiring knowledge of
the internal implementation."
```

That generated text is embedded and used for retrieval.

### Important

The hypothetical answer is **not treated as factual evidence**.

It is a retrieval technique.

The final answer should still be grounded in the actual retrieved documents.

---

# 23. Hybrid Search

Hybrid search combines two approaches:

```text
Dense Retrieval
+
Sparse Retrieval
```

### Dense

Understands semantic meaning.

```text
"How can I repair my notebook display?"
```

can retrieve:

```text
"Steps for fixing a laptop screen"
```

### Sparse/BM25

Excellent for exact terms.

```text
ERR_NODE_9942
```

### Combined

```text
             Query
               │
        ┌──────┴──────┐
        ▼             ▼
   Vector Search    BM25
        │             │
        └──────┬──────┘
               ▼
           Combined
            Results
```

---

# 24. Re-ranking

Suppose retrieval gives:

```text
20 candidate chunks
```

Instead of giving all 20 to the LLM:

```text
20 chunks
   ↓
Reranker
   ↓
Top 5
   ↓
LLM
```

The reranker evaluates the relationship between:

```text
Query + Document
```

and produces a better relevance ordering.

### Mental model

```text
Retriever → Find candidates quickly
Reranker  → Select the best candidates
LLM       → Understand and generate
```

---

# 25. Complete Production RAG Architecture

A more mature RAG system can look like this:

```text
                         DATA INGESTION
                              │
          ┌───────────────────┼──────────────────┐
          ▼                   ▼                  ▼
        PDF                 Audio              Video
          │                   │                  │
       Parser                STT            STT/Vision
          │                   │                  │
          └───────────────────┼──────────────────┘
                              ▼
                         Normalization
                              │
                              ▼
                           Chunking
                              │
                              ▼
                          Embeddings
                              │
                              ▼
                        Vector Database
                           Qdrant
                              │
                              │
                     ─────────┼─────────
                              │
                         USER QUERY
                              │
                              ▼
                       Query Rewriting
                              │
                              ▼
                      Hybrid Retrieval
                         /         \
                        ▼           ▼
                     Vector       BM25
                        \           /
                         ▼         ▼
                           Fusion
                              │
                              ▼
                           Reranker
                              │
                              ▼
                       Context Selection
                              │
                              ▼
                             LLM
                              │
                              ▼
                   Grounded Answer + Sources
```

---

# 26. Practical JavaScript Example

A simplified RAG query pipeline using LangChain and Qdrant:

```javascript
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const vectorStore =
  await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "chaicode-docs",
    }
  );

const retriever = vectorStore.asRetriever({
  k: 5,
});

const query = "What is black box testing?";

const documents = await retriever.invoke(query);

const context = documents
  .map((doc) => {
    return `
Source: ${doc.metadata.source}
Page: ${doc.metadata.loc?.pageNumber}

${doc.pageContent}
`;
  })
  .join("\n\n");

const client = new OpenAI();

const response =
  await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
Answer the question using only the
provided context.

If the answer cannot be found in the
context, say:

"I couldn't find this information
in the provided documents."

Context:
${context}
`,
      },
      {
        role: "user",
        content: query,
      },
    ],
  });

console.log(
  response.choices[0].message.content
);
```

### What happens here?

```text
User Query
    │
    ▼
Retriever
    │
    ▼
Qdrant
    │
    ▼
Top 5 Chunks
    │
    ▼
Context String
    │
    ▼
System Prompt
    │
    ▼
OpenAI
    │
    ▼
Answer
```

---

# 27. The Most Important Distinction

Don't confuse these three concepts:

### Embedding Model

Converts:

```text
Text → Vector
```

### Vector Database

Stores/searches:

```text
Vectors + Metadata
```

### LLM

Performs:

```text
Context + Question → Answer
```

Together:

```text
             RAG
              │
      ┌───────┼────────┐
      ▼       ▼        ▼
 Embedding   Vector    LLM
   Model       DB
      │         │       │
      ▼         ▼       ▼
  Represent  Retrieve  Generate
```

---

# 28. Important Interview Questions

### Q1. What is RAG?

**Answer:**

RAG is an architecture where relevant external information is retrieved and provided to an LLM as context before generating an answer.

---

### Q2. Why is RAG needed?

Because LLMs don't automatically have access to your application's private, frequently changing, or domain-specific data.

---

### Q3. What are the two RAG pipelines?

```text
1. Indexing Pipeline
2. Query Pipeline
```

---

### Q4. What happens during indexing?

```text
Load
 ↓
Extract
 ↓
Chunk
 ↓
Embed
 ↓
Store
```

---

### Q5. What happens during querying?

```text
Question
 ↓
Embed
 ↓
Search
 ↓
Retrieve
 ↓
Augment
 ↓
Generate
```

---

### Q6. Why do we chunk documents?

To create smaller, more semantically focused units that can be independently embedded and retrieved.

---

### Q7. What is an embedding?

A numerical vector representation of information that allows semantic similarity comparisons.

---

### Q8. What is a vector database?

A database optimized for storing and searching high-dimensional vectors, often alongside metadata.

---

### Q9. Why is metadata important?

It enables:

* Source attribution
* Page/timestamp citations
* Filtering
* Access control
* Document identification

---

### Q10. What is Advanced RAG?

Advanced RAG refers to techniques that improve retrieval quality beyond basic vector search, such as:

* Query rewriting
* Multi-query retrieval
* HyDE
* Hybrid search
* Re-ranking
* Better chunking
* Metadata filtering

---

# 29. Final Cheat Sheet

## Standalone LLM

```text
Question
   ↓
LLM
   ↓
Answer
```

Problem:

```text
❌ Private data
❌ Frequently changing data
❌ Domain-specific knowledge
```

---

## RAG

```text
Question
   ↓
Embedding
   ↓
Vector DB
   ↓
Relevant Chunks
   ↓
LLM
   ↓
Answer
```

---

## Indexing

```text
Documents
   ↓
Extraction
   ↓
Chunking
   ↓
Embedding
   ↓
Qdrant
```

---

## Query

```text
Question
   ↓
Embedding
   ↓
Similarity Search
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

## Multi-Modal

```text
PDF    → Parser/OCR
Audio  → Speech-to-Text
Video  → Audio/STT + Vision
Image  → OCR/Vision
Web    → HTML Parser
```

All eventually become a searchable semantic representation.

---

## Advanced RAG

```text
Query
 ↓
Rewrite
 ↓
Hybrid Search
 ↓
Rerank
 ↓
Context
 ↓
LLM
 ↓
Grounded Answer
```

---

# 🧠 One-Line Mental Model

> **RAG = Find the right information first, then let the LLM reason over that information.**

And remember the roles:

```text
┌──────────────────────────────────────────┐
│             RAG SYSTEM                   │
│                                          │
│ Embedding Model → Understand/represent   │
│ Vector DB       → Find relevant data     │
│ Retriever       → Select candidates      │
│ Reranker        → Improve ranking        │
│ LLM             → Reason + generate      │
│ Metadata        → Source/filter/context  │
└──────────────────────────────────────────┘
```

**The biggest lesson from Day 04:** RAG is not simply "put documents into a vector database." The real engineering challenge is building a reliable pipeline that **ingests the right information, preserves context and metadata, retrieves the right chunks, and gives the LLM enough—but not too much—relevant context to produce a grounded answer.**
