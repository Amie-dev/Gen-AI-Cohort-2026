# 📘 Day 04 — Note 02: Vector Embeddings & Vector Databases

> **Goal:** Understand how text becomes vectors, how semantic similarity is calculated, how vector databases store and search embeddings, and how this fits into a production RAG system.

> **Important update:** Your original note mentions `text-embedding-004`. That model was shut down on **January 14, 2026**; Google's current embedding lineup includes `gemini-embedding-001` for text and `gemini-embedding-2` for multimodal embeddings. ([Google AI for Developers][1])

---

# 📑 Table of Contents

1. [What Are Embeddings?](#1-what-are-embeddings)
2. [Why Do We Need Vectors?](#2-why-do-we-need-vectors)
3. [Semantic Meaning in Vector Space](#3-semantic-meaning-in-vector-space)
4. [Embedding Example](#4-embedding-example)
5. [Dimensions](#5-dimensions)
6. [Keyword Search vs Semantic Search](#6-keyword-search-vs-semantic-search)
7. [Similarity vs Distance](#7-similarity-vs-distance)
8. [Cosine Similarity](#8-cosine-similarity)
9. [Dot Product](#9-dot-product)
10. [Euclidean Distance](#10-euclidean-distance)
11. [Why Normalization Matters](#11-why-normalization-matters)
12. [What Is a Vector Database?](#12-what-is-a-vector-database)
13. [What Does a Vector DB Store?](#13-what-does-a-vector-db-store)
14. [ANN & HNSW](#14-ann--hnsw)
15. [Qdrant](#15-qdrant)
16. [Qdrant with Docker](#16-qdrant-with-docker)
17. [Qdrant with JavaScript](#17-qdrant-with-javascript)
18. [Insert Embeddings](#18-insert-embeddings)
19. [Search Embeddings](#19-search-embeddings)
20. [Metadata Filtering](#20-metadata-filtering)
21. [Embedding Models](#21-embedding-models)
22. [Embedding Model Compatibility](#22-embedding-model-compatibility)
23. [Vector DB Comparison](#23-vector-db-comparison)
24. [RAG + Vector DB Complete Flow](#24-rag--vector-db-complete-flow)
25. [Common Mistakes](#25-common-mistakes)
26. [Production Architecture](#26-production-architecture)
27. [Key Takeaways](#27-key-takeaways)

---

# 1. What Are Embeddings?

An **embedding** is a numerical representation of data that captures useful relationships between pieces of information.

For example:

```text
"dog"
   ↓
Embedding Model
   ↓
[0.12, -0.45, 0.78, 0.31, ...]
```

A sentence:

```text
"Employees receive 18 paid leaves annually."
```

might become:

```text
[0.021, -0.184, 0.762, 0.331, ...]
```

The actual numbers have no human-readable meaning individually.

The **relationship between vectors** is what matters.

---

# 2. Why Do We Need Vectors?

Computers are extremely good at mathematical operations.

Suppose we have:

```text
Document A:
"Employees receive 18 paid leaves annually."

Document B:
"Workers get 18 vacation days every year."

Document C:
"React Native uses JavaScript."
```

A human immediately understands:

```text
A ≈ B

A ≠ C
```

But a computer needs a representation that lets us calculate this relationship.

Embeddings provide that representation:

```text
Document A → Vector A
Document B → Vector B
Document C → Vector C
```

Then:

```text
distance(Vector A, Vector B) → small
distance(Vector A, Vector C) → large
```

That's the foundation of **semantic search**.

---

# 3. Semantic Meaning in Vector Space

Imagine a simple 2D world.

```text
                  Technology
                     ●
                Microsoft
                     │
                     │
                     │
                     │
                     │
  Apple ●────────────┘


        Fruit
          ●
        Apple
          │
          ●
        Banana
```

In a real embedding system, we don't have just 2 dimensions.

We might have:

```text
384 dimensions
768 dimensions
1536 dimensions
3072 dimensions
```

or other model-specific sizes.

We cannot visualize 1536 dimensions directly, but the mathematical principle remains the same.

---

# 4. Embedding Example

Consider:

```text
Sentence A:
"I love programming."

Sentence B:
"Software development is something I enjoy."

Sentence C:
"I ordered pizza."
```

Conceptually:

```text
A ───── B

      ↕

      C
```

A and B should have relatively similar semantic representations.

The exact similarity depends on the embedding model and task.

---

# 5. Dimensions

A vector is an array of numbers.

For example:

```js
const vector = [
  0.12,
  -0.45,
  0.78,
  0.21
];
```

This vector has:

```text
4 dimensions
```

Real embedding models may output hundreds or thousands of dimensions.

For example:

```text
Embedding
   │
   ├── dimension 1
   ├── dimension 2
   ├── dimension 3
   ├── ...
   └── dimension N
```

### Important

More dimensions do **not automatically mean better retrieval**.

The quality depends on:

* embedding model
* training
* task
* language
* corpus
* retrieval strategy
* dimensionality
* distance metric

---

# 6. Keyword Search vs Semantic Search

This is one of the most important concepts.

## Keyword Search

Suppose your document says:

```text
"How to repair a notebook display"
```

User asks:

```text
"How do I fix my laptop screen?"
```

Keyword search may have difficulty because:

```text
repair ≠ fix
notebook ≠ laptop
display ≈ screen
```

---

## Semantic Search

An embedding model represents the meaning.

```text
Query:
"How do I fix my laptop screen?"

          ↓

       Embedding

          ↓

Search vectors

          ↓

"How to repair a notebook display"
```

The concepts can be recognized as related even when the exact words differ.

---

# 7. Similarity vs Distance

Different systems use different terminology.

### Similarity

Higher score usually means:

```text
MORE similar
```

Example:

```text
A ↔ B = 0.94
A ↔ C = 0.23
```

A and B are more similar.

---

### Distance

Lower distance usually means:

```text
CLOSER
```

Example:

```text
A ↔ B = 0.10
A ↔ C = 1.80
```

A and B are closer.

So always check whether your database/model reports:

```text
similarity score
```

or

```text
distance
```

before interpreting the number.

---

# 8. Cosine Similarity

Cosine similarity measures the **angle between two vectors**.

Formula:

[
\text{cosine similarity}
========================

\frac{A \cdot B}
{|A||B|}
]

Where:

```text
A · B
```

is the dot product.

And:

```text
||A||
```

is the magnitude/norm of A.

---

## Simple Example

Suppose:

```text
A = [1, 0]

B = [1, 0]
```

They point in the same direction.

```text
Cosine similarity = 1
```

Now:

```text
A = [1, 0]

B = [0, 1]
```

They are perpendicular.

```text
Cosine similarity = 0
```

Conceptually:

```text
       B
       ↑
       │
       │
       │
       └────────→ A
```

---

# 9. Dot Product

Formula:

[
A \cdot B =
\sum_{i=1}^{n} A_iB_i
]

Example:

```text
A = [1, 2, 3]
B = [4, 5, 6]
```

Then:

```text
A · B

= (1×4)
+ (2×5)
+ (3×6)

= 4 + 10 + 18

= 32
```

Dot product considers both:

```text
direction
+
magnitude
```

---

## Normalized Vectors

If vectors are normalized to unit length:

```text
||A|| = 1
||B|| = 1
```

then:

[
A \cdot B = \cos(\theta)
]

So dot product and cosine similarity become equivalent.

Qdrant documents this relationship explicitly and implements cosine search as dot-product search over normalized vectors. ([Qdrant][2])

---

# 10. Euclidean Distance

Also called:

```text
L2 distance
```

Formula:

[
d(A,B)
======

\sqrt{\sum_{i=1}^{n}(A_i-B_i)^2}
]

For:

```text
A = [1, 2]

B = [4, 6]
```

we get:

```text
distance
= √((1-4)² + (2-6)²)

= √(9 + 16)

= √25

= 5
```

### Interpretation

```text
Small distance → vectors are close
Large distance → vectors are far
```

---

# 11. Comparing the Three Metrics

| Metric       | Measures               | Usually Better                                      |
| ------------ | ---------------------- | --------------------------------------------------- |
| Cosine       | Angle/direction        | Semantic text similarity                            |
| Dot Product  | Direction + magnitude  | Fast similarity, especially with normalized vectors |
| Euclidean/L2 | Straight-line distance | Spatial distance                                    |

There isn't a universal winner.

The appropriate metric depends on how the embedding model was trained and how the vectors are represented. Qdrant supports cosine, dot product, Euclidean, and Manhattan metrics. ([Qdrant][2])

---

# 12. A Tiny JavaScript Implementation

Understanding the mathematics yourself is useful.

### Dot Product

```js
function dotProduct(a, b) {
  return a.reduce(
    (sum, value, i) => sum + value * b[i],
    0
  );
}
```

---

### Magnitude

```js
function magnitude(vector) {
  return Math.sqrt(
    vector.reduce(
      (sum, value) => sum + value ** 2,
      0
    )
  );
}
```

---

### Cosine Similarity

```js
function cosineSimilarity(a, b) {
  const dot = dotProduct(a, b);

  const magnitudeA = magnitude(a);
  const magnitudeB = magnitude(b);

  return dot / (magnitudeA * magnitudeB);
}
```

Usage:

```js
const a = [1, 2, 3];
const b = [1, 2, 4];

console.log(
  cosineSimilarity(a, b)
);
```

This is educational code. Production vector databases use optimized indexing/search implementations rather than looping over every vector in JavaScript.

---

# 13. What Is a Vector Database?

A **vector database** stores vectors and provides efficient similarity search over them.

A point in a vector database commonly looks conceptually like:

```json
{
  "id": "chunk-001",
  "vector": [0.12, -0.42, 0.73, "..."],
  "payload": {
    "text": "Employees receive 18 paid leaves annually.",
    "document": "employee-handbook.pdf",
    "page": 12
  }
}
```

Think:

```text
Vector DB Point
│
├── ID
├── Vector
└── Metadata / Payload
```

Qdrant calls these records **points**: vectors associated with payload data. ([Qdrant][3])

---

# 14. Why Not Just Use PostgreSQL?

You can.

For example:

```text
PostgreSQL
+
pgvector
```

can provide vector search.

But a dedicated vector database can provide specialized capabilities for:

```text
Large-scale vector retrieval
Filtering
Indexing
Vector-specific optimization
Hybrid search
Quantization
Distributed search
```

The correct choice depends on your architecture.

---

# 15. What Does a Vector DB Actually Store?

Imagine your document:

```text
employee-handbook.pdf
```

After chunking:

```text
Chunk 1
Chunk 2
Chunk 3
...
Chunk 1000
```

Each chunk can become:

```json
{
  "id": "employee-001",
  "vector": [0.12, 0.34, -0.56],
  "payload": {
    "text": "Employees receive 18 paid leaves annually.",
    "documentId": "employee-handbook",
    "page": 12,
    "tenantId": "company-A"
  }
}
```

So the database isn't storing **just vectors**.

It usually stores:

```text
Vector
+
Payload/Metadata
```

---

# 16. What Is ANN?

ANN means:

> **Approximate Nearest Neighbor**

Suppose you have:

```text
10 million vectors
```

and a query vector:

```text
Q
```

The naive approach would compare:

```text
Q ↔ Vector 1
Q ↔ Vector 2
Q ↔ Vector 3
...
Q ↔ Vector 10,000,000
```

That's expensive.

ANN indexing helps find highly relevant vectors without exhaustively comparing the query with every vector.

---

# 17. HNSW

One popular ANN technique is:

> **Hierarchical Navigable Small World**

or:

```text
HNSW
```

Conceptually, HNSW builds a graph where nearby vectors are connected.

Simplified:

```text
                A
               / \
              /   \
             B─────C
             │     │
             │     │
             D─────E
```

When searching for a vector near:

```text
E
```

the algorithm can navigate through nearby graph nodes instead of scanning every vector.

HNSW is approximate, so recall isn't necessarily 100%; parameters such as graph construction/search settings affect the trade-off between speed and recall. ([Qdrant][4])

---

# 18. Why ANN Is Important

Imagine:

```text
100 vectors
```

Brute force is easy.

But:

```text
100 million vectors
```

changes the problem.

You want:

```text
Fast retrieval
+
High recall
+
Reasonable memory
```

ANN techniques help achieve this trade-off.

---

# 19. Qdrant

For your Node.js/RAG learning, **Qdrant is a very good database to learn deeply**.

Qdrant supports:

* dense vectors
* sparse vectors
* payloads
* metadata filtering
* cosine
* dot product
* Euclidean
* hybrid-style retrieval patterns
* local deployment
* managed cloud

Its JavaScript client is available as:

```text
@qdrant/js-client-rest
```

Qdrant's official documentation provides JavaScript examples for creating collections and inserting/searching vectors. ([Qdrant][2])

---

# 20. Qdrant Architecture

```text
              Your Node.js App
                     │
                     │ HTTP
                     ▼
              ┌──────────────┐
              │    Qdrant    │
              │              │
              │ Collection   │
              │     │        │
              │     ▼        │
              │   Points     │
              │     │        │
              │  Vector +     │
              │   Payload    │
              └──────────────┘
```

---

# 21. Run Qdrant with Docker

For local development:

```bash
docker run -p 6333:6333 \
  -p 6334:6334 \
  qdrant/qdrant
```

Then Qdrant is available locally.

Conceptually:

```text
Node.js
   │
   ▼
localhost:6333
   │
   ▼
Qdrant
```

Qdrant's official quickstart uses the local Qdrant service and demonstrates creating a collection and inserting vectors. ([Qdrant][3])

---

# 22. Install Qdrant JavaScript Client

```bash
npm install @qdrant/js-client-rest
```

Then:

```js
import { QdrantClient } from "@qdrant/js-client-rest";

const qdrant = new QdrantClient({
  host: "localhost",
  port: 6333
});
```

---

# 23. Create a Collection

Suppose our embedding model produces:

```text
1536 dimensions
```

Create:

```js
await qdrant.createCollection("documents", {
  vectors: {
    size: 1536,
    distance: "Cosine"
  }
});
```

The vector size and distance metric are properties of the collection's vector configuration. ([Qdrant][2])

Conceptually:

```text
documents
│
├── vector size = 1536
└── distance = Cosine
```

---

# 24. Why Vector Size Must Match

Suppose your collection expects:

```text
1536
```

but you send:

```text
768
```

You have a mismatch.

```text
Collection
1536
   ▲
   │
   │ ❌
   │
Query
768
```

The embedding dimension must match the collection configuration for that vector.

---

# 25. Insert a Vector

Example:

```js
await qdrant.upsert("documents", {
  wait: true,

  points: [
    {
      id: "chunk-1",

      vector: [
        0.12,
        -0.42,
        0.73,
        // ...
      ],

      payload: {
        text: "Employees receive 18 paid leaves annually.",
        documentId: "employee-handbook",
        page: 12
      }
    }
  ]
});
```

Qdrant's upsert operation inserts a point or replaces an existing point with the same ID. ([Qdrant][5])

---

# 26. Real Example with a Small Vector

For learning, let's pretend our embedding has only four dimensions:

```js
await qdrant.createCollection("demo", {
  vectors: {
    size: 4,
    distance: "Cosine"
  }
});
```

Insert:

```js
await qdrant.upsert("demo", {
  wait: true,

  points: [
    {
      id: 1,
      vector: [0.9, 0.1, 0.1, 0.2],
      payload: {
        text: "JavaScript is a programming language."
      }
    },

    {
      id: 2,
      vector: [0.1, 0.9, 0.1, 0.2],
      payload: {
        text: "React is a UI library."
      }
    }
  ]
});
```

Real embedding vectors will normally have hundreds or thousands of dimensions.

---

# 27. Search the Vector Database

Suppose your query has already been embedded:

```js
const queryVector = [
  0.88,
  0.12,
  0.10,
  0.20
];
```

Search:

```js
const results = await qdrant.search("demo", {
  vector: queryVector,
  limit: 3
});

console.log(results);
```

Conceptually:

```text
Query Vector
     │
     ▼
Qdrant
     │
     ├── Vector A → score 0.96
     ├── Vector B → score 0.42
     └── Vector C → score 0.21
```

The highest-scoring result is the most similar according to the configured metric.

---

# 28. Qdrant + Metadata

This is where vector databases become particularly useful for RAG.

Store:

```js
payload: {
  text: "...",
  documentId: "doc-123",
  page: 15,
  tenantId: "company-a",
  department: "engineering"
}
```

Then you can search semantically **and** apply filters.

---

# 29. Metadata Filtering

Suppose we have:

```text
Company A
Company B
```

You must prevent Company A users from retrieving Company B data.

Conceptually:

```text
Query
  │
  ▼
Vector Search
  +
tenantId = company-A
  │
  ▼
Results
```

Qdrant supports payload-based filtering and recommends payload-based partitioning as one approach to multitenancy. ([Qdrant][2])

Example concept:

```js
const results = await qdrant.search("documents", {
  vector: queryVector,

  limit: 5,

  filter: {
    must: [
      {
        key: "tenantId",
        match: {
          value: "company-a"
        }
      }
    ]
  }
});
```

**Important:** authorization should be enforced by your application/backend, not delegated to the LLM.

---

# 30. Embedding Models

An embedding model is separate from the generative LLM.

For example:

```text
Embedding Model
       │
       ▼
Text → Vector
```

while:

```text
Generative Model
       │
       ▼
Prompt → Answer
```

A RAG system can use:

```text
Embedding Model
        +
Vector DB
        +
Generative LLM
```

---

# 31. Current Gemini Embedding Models

Your original note says:

```text
text-embedding-004
```

That information is outdated.

Google lists:

### `gemini-embedding-001`

Text embedding model:

```text
Input limit: 2,048 tokens
Output: configurable 128–3072
Recommended: 768 / 1536 / 3072
```

([Google AI for Developers][6])

### `gemini-embedding-2`

Current multimodal embedding model:

```text
Text
Images
Video
Audio
PDF
```

It supports up to 8,192 input tokens and configurable output dimensions from 128–3072, with 768, 1536, and 3072 recommended. ([Google AI for Developers][7])

---

# 32. Important Embedding Rule

Your original note contains an extremely important rule:

> **Use a compatible embedding space for indexing and querying.**

For example:

```text
Documents
   ↓
Embedding Model A
   ↓
Vector DB
```

Then queries should use the compatible same embedding model/configuration:

```text
Query
   ↓
Embedding Model A
   ↓
Vector DB
```

Don't do:

```text
Documents
 ↓
Model A
 ↓
Vector DB

Query
 ↓
Model B ❌
 ↓
Vector DB
```

Different embedding models generally produce incompatible vector spaces.

Google explicitly notes that `gemini-embedding-001` and `gemini-embedding-2` have incompatible embedding spaces, so migrating between them requires re-embedding existing data. ([Google AI for Developers][8])

---

# 33. Same Model ≠ Only Same Dimension

This is a subtle but important point.

Suppose:

```text
Model A → 1536 dimensions
Model B → 1536 dimensions
```

You still shouldn't assume they are compatible.

Why?

Because:

```text
1536 dimensions
```

only tells you the vector length.

It doesn't tell you that the two models learned the **same vector space**.

So:

```text
Same dimension
      ≠
Same embedding space
```

---

# 34. Document vs Query Embeddings

Some embedding models support different task instructions/types.

For example, Google's `gemini-embedding-001` supports retrieval-oriented task types such as:

```text
RETRIEVAL_DOCUMENT
RETRIEVAL_QUERY
```

which are intended for document and query retrieval respectively. ([Google AI for Developers][8])

Conceptually:

```text
Document
   ↓
RETRIEVAL_DOCUMENT
   ↓
Vector
```

and:

```text
User Query
   ↓
RETRIEVAL_QUERY
   ↓
Vector
```

This is an important detail when using embedding models that expose task-specific embedding modes.

---

# 35. Vector Database Comparison

| Database                  | Type                           | Best For                       | Deployment          |
| ------------------------- | ------------------------------ | ------------------------------ | ------------------- |
| **Qdrant**                | Dedicated vector DB            | RAG, filtering, local + cloud  | Docker / Cloud      |
| **Pinecone**              | Managed vector DB              | Managed production systems     | Cloud               |
| **Weaviate**              | Vector DB                      | Semantic + hybrid applications | Self-host / Cloud   |
| **pgvector**              | PostgreSQL extension           | Existing Postgres apps         | Self-host / Managed |
| **Chroma**                | Developer-focused vector store | Learning/prototyping           | Local / Cloud       |
| **MongoDB Vector Search** | MongoDB capability             | Existing MongoDB applications  | Atlas               |
| **Milvus**                | Distributed vector DB          | Large-scale workloads          | Self-host / Cloud   |

There isn't one universally "best" vector database.

Choose based on:

```text
Scale
Cost
Existing infrastructure
Filtering
Hybrid search
Operational complexity
Cloud requirements
Team experience
```

---

# 36. Qdrant vs pgvector

A useful comparison:

### Qdrant

```text
Node.js
   ↓
Qdrant
   ↓
Vector Search
```

Great when your application is heavily retrieval-focused.

### pgvector

```text
Node.js
   ↓
PostgreSQL
   ├── users
   ├── products
   ├── orders
   └── embeddings
```

Great when you already use PostgreSQL and want vectors close to your relational data.

---

# 37. Qdrant vs Pinecone

### Qdrant

```text
More control
+
Local Docker
+
Self-hosting
+
Cloud option
```

### Pinecone

```text
Managed infrastructure
+
Less operational work
+
Cloud-first
```

The right choice depends on your requirements rather than popularity.

---

# 38. Vector DB Is Not Your Source of Truth

This is an important production concept.

Suppose you have:

```text
PostgreSQL
   │
   ├── document metadata
   ├── users
   ├── permissions
   └── application data
```

and:

```text
Qdrant
   │
   ├── embeddings
   └── searchable chunks
```

You often don't want the vector DB to become the only authoritative copy of your business data.

Think:

```text
Source of Truth
      │
      ▼
PostgreSQL / Object Storage
      │
      ▼
Embedding Pipeline
      │
      ▼
Vector DB
```

---

# 39. What Happens When a Document Changes?

Suppose:

```text
Old:
Employees receive 18 paid leaves.

New:
Employees receive 20 paid leaves.
```

You need to update the corresponding indexed chunk.

Pipeline:

```text
Document Updated
       ↓
Detect Change
       ↓
Extract Text
       ↓
Chunk
       ↓
Generate New Embedding
       ↓
Upsert Vector
       ↓
Old Vector Removed/Replaced
```

This is part of **RAG ingestion**, not merely querying.

---

# 40. Complete RAG + Vector DB Architecture

```text
                   DOCUMENTS
                       │
                       ▼
                Text Extraction
                       │
                       ▼
                    Chunking
                       │
                       ▼
                 Embedding Model
                       │
                       ▼
              ┌─────────────────┐
              │     QDRANT      │
              │                 │
              │ Vector          │
              │ +               │
              │ Payload         │
              └────────┬────────┘
                       ▲
                       │
                       │ Search
                       │
User ──► Question ──► Embedding
                       │
                       ▼
                  Top-K Results
                       │
                       ▼
               Context Construction
                       │
                       ▼
                      LLM
                       │
                       ▼
                    Answer
```

---

# 41. Complete Example

Imagine your RAG application contains:

```text
100,000 chunks
```

User asks:

> "How many paid leaves do employees receive?"

### Step 1

Convert question into vector:

```text
Question
   ↓
Embedding Model
   ↓
[0.12, -0.32, 0.91, ...]
```

### Step 2

Search:

```text
Qdrant
```

### Step 3

Return:

```text
Top 3

1. Employee Handbook — Page 12
2. Leave Policy — Page 4
3. HR FAQ — Page 7
```

### Step 4

Construct:

```text
Context:
Employees receive 18 paid leaves annually.

Question:
How many paid leaves do employees receive?
```

### Step 5

LLM:

```text
Employees receive 18 paid leaves annually.
```

That's the complete connection between:

```text
Embedding
+
Vector DB
+
RAG
```

---

# 42. Hybrid Search

Pure vector search isn't always enough.

Suppose your document contains:

```text
Error Code: ERR_AUTH_4017
```

A semantic embedding may understand the general topic, but exact identifiers are often better handled lexically.

So production systems may combine:

```text
Keyword Search
       +
Dense Vector Search
       ↓
Hybrid Search
```

Conceptually:

```text
User Query
    │
    ├──────────────┐
    ▼              ▼
Keyword Search   Vector Search
    │              │
    └──────┬───────┘
           ▼
      Combined Rank
           │
           ▼
       Top Results
```

Qdrant also supports sparse vectors alongside dense vectors, enabling more advanced retrieval designs. ([Qdrant][2])

---

# 43. Reranking

Another production technique:

```text
Query
 ↓
Vector Search
 ↓
Top 50
 ↓
Reranker
 ↓
Top 5
 ↓
LLM
```

Why?

Vector search is optimized for finding candidates quickly.

A reranker can perform a more expensive relevance evaluation on a smaller candidate set.

So:

```text
Retriever → Candidate generation
Reranker  → Candidate refinement
LLM       → Answer generation
```

---

# 44. Common Mistake #1 — Using Keyword Search as "RAG"

This:

```js
documents.filter(doc =>
  doc.includes(query)
);
```

is not semantic vector retrieval.

It's keyword matching.

Useful for learning, but not a real embedding-based retriever.

---

# 45. Common Mistake #2 — Wrong Embedding Model

Bad:

```text
Index → Model A
Query → Model B
```

Good:

```text
Index → Compatible Model A
Query → Compatible Model A
```

If changing models:

```text
Old vectors
   ↓
Delete/rebuild or migrate
   ↓
New embeddings
   ↓
New vector index
```

---

# 46. Common Mistake #3 — Wrong Vector Dimension

Collection:

```text
size = 1536
```

Embedding:

```text
768
```

❌ incompatible.

Your collection configuration must match the embedding vectors you store. ([Qdrant][2])

---

# 47. Common Mistake #4 — Storing No Metadata

Bad:

```json
{
  "vector": [...]
}
```

Better:

```json
{
  "vector": [...],
  "payload": {
    "text": "...",
    "documentId": "...",
    "page": 12,
    "tenantId": "...",
    "source": "handbook.pdf"
  }
}
```

Metadata enables:

```text
Filtering
Citations
Authorization
Debugging
Deletion
Document tracking
```

---

# 48. Common Mistake #5 — Thinking Vector Search Is Always Correct

Suppose:

```text
Question
 ↓
Vector Search
 ↓
Wrong chunk
 ↓
LLM
```

The LLM may produce a convincing but incorrect answer.

So:

> **Good RAG depends heavily on retrieval quality.**

---

# 49. Common Mistake #6 — Sending Too Many Results

You might think:

```text
More chunks = better answer
```

Not necessarily.

Suppose:

```text
Top 5 → useful
Top 100 → noisy
```

More context can introduce:

```text
irrelevant information
contradictions
higher cost
higher latency
```

You need to find the appropriate retrieval strategy for your application.

---

# 50. Vector Search Evaluation

Important retrieval metrics include:

### Recall@K

> Did the relevant result appear within the top K?

Example:

```text
Correct chunk = rank 4

K = 5

Recall@5 = successful
```

### Precision@K

> How many of the retrieved results were actually relevant?

Example:

```text
Top 5 results

Relevant = 4

Precision@5 = 4/5 = 0.8
```

These metrics help you evaluate the retriever independently from the LLM.

---

# 51. Production Architecture

A mature RAG system might look like:

```text
                     ┌──────────────┐
                     │ Object Store │
                     │ PDF / Docs   │
                     └──────┬───────┘
                            │
                            ▼
                    Ingestion Worker
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
             Extraction             Metadata
                 │                     │
                 ▼                     │
              Chunking                │
                 │                     │
                 ▼                     │
            Embedding Model            │
                 │                     │
                 └──────────┬──────────┘
                            ▼
                     ┌────────────┐
                     │  Qdrant    │
                     │            │
                     │ Vectors +  │
                     │ Payload    │
                     └─────┬──────┘
                           ▲
                           │
User → Auth → RBAC → Query → Retrieval
                           │
                           ▼
                       Reranker
                           │
                           ▼
                      Context
                           │
                           ▼
                          LLM
                           │
                           ▼
                       Response
```

---

# 52. Where Your Technologies Fit

Since you're learning **JavaScript/Node.js + GenAI + RAG**, a practical stack to learn is:

```text
Frontend
   ↓
React / Next.js
   ↓
Node.js API
   ↓
Authentication / RBAC
   ↓
RAG Service
   ├── Embedding Model
   ├── Qdrant
   └── LLM
```

For example:

```text
Next.js
   ↓
Express / Node.js
   ↓
Qdrant
   ↓
Embedding API
   ↓
LLM
```

---

# 53. Recommended Learning Project

Build:

## 📚 "Ask My Documents"

Features:

```text
1. Upload PDF
2. Extract text
3. Split into chunks
4. Generate embeddings
5. Store in Qdrant
6. Ask questions
7. Retrieve top-K chunks
8. Send context to LLM
9. Generate answer
10. Show source/page
```

Architecture:

```text
                PDF
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
              Qdrant
                 ▲
                 │
             Search
                 │
User Question ───┘
                 │
                 ▼
            Retrieved
              Chunks
                 │
                 ▼
                LLM
                 │
                 ▼
              Answer
                 │
                 ▼
          Source Citation
```

This single project will teach you most of the fundamentals of RAG retrieval.

---

# 54. One Code-Level Mental Model

Remember this function:

```js
async function rag(question) {

  // 1. Convert question to vector
  const queryVector =
    await embed(question);

  // 2. Search vector database
  const results =
    await qdrant.search("documents", {
      vector: queryVector,
      limit: 5
    });

  // 3. Extract relevant text
  const context = results
    .map(result => result.payload.text)
    .join("\n\n");

  // 4. Give context to LLM
  const answer =
    await llm.generate({
      prompt: `
        Answer using only this context:

        ${context}

        Question:
        ${question}
      `
    });

  return answer;
}
```

This is the heart of a basic RAG system:

```text
question
   ↓
embedding
   ↓
vector search
   ↓
relevant chunks
   ↓
prompt
   ↓
LLM
   ↓
answer
```

---

# 55. Embeddings vs Vector DB vs RAG

Don't confuse these three.

### Embedding

Converts:

```text
Text
 ↓
Vector
```

### Vector Database

Stores/searches:

```text
Vector
+
Metadata
```

### RAG

Combines retrieval with generation:

```text
Question
 ↓
Retrieve
 ↓
Context
 ↓
LLM
 ↓
Answer
```

So:

```text
           RAG
            │
      ┌─────┴─────┐
      ▼           ▼
  Retrieval    Generation
      │           │
      ▼           ▼
 Embeddings      LLM
      │
      ▼
 Vector DB
```

---

# 🧠 56. The Most Important Mental Model

If you remember only one diagram:

```text
                 📄 DOCUMENT
                      │
                      ▼
                  CHUNKING
                      │
                      ▼
                EMBEDDING MODEL
                      │
                      ▼
                  🔢 VECTOR
                      │
                      ▼
                 🗄️ VECTOR DB
                      │
                      │
                      │
USER ──► QUESTION ──► EMBEDDING
                      │
                      ▼
                 🔎 SEARCH
                      │
                      ▼
                 TOP-K CHUNKS
                      │
                      ▼
              📝 CONTEXT + QUERY
                      │
                      ▼
                    🤖 LLM
                      │
                      ▼
                  💬 ANSWER
```

---

# 🎯 57. Final Key Takeaways

### 1. Embeddings

> Convert semantic information into numerical vectors.

### 2. Vector space

> Similar concepts can be represented near each other according to the embedding model.

### 3. Cosine similarity

> Measures the angle/direction between vectors.

### 4. Dot product

> Measures vector interaction; with normalized vectors, it corresponds to cosine similarity.

### 5. Euclidean distance

> Measures straight-line distance; smaller generally means closer.

### 6. Vector database

> Stores vectors + metadata and performs efficient similarity search.

### 7. ANN

> Makes large-scale nearest-neighbor retrieval practical without exhaustive scanning.

### 8. HNSW

> A popular graph-based ANN indexing approach.

### 9. Qdrant

> A strong option to learn for Node.js RAG, especially because it supports vectors, payloads, filtering, and local/cloud deployment. ([Qdrant][2])

### 10. Embedding compatibility

> Your indexing and querying embeddings must belong to the same compatible embedding space. Switching embedding models can require re-embedding your corpus. ([Google AI for Developers][8])

### 11. Vector DB ≠ RAG

> Vector DB is the retrieval/storage component; RAG is the broader retrieval + generation architecture.

### 12. Production RAG

```text
Documents
    ↓
Extraction
    ↓
Chunking
    ↓
Embeddings
    ↓
Vector DB
    ↓
Query Embedding
    ↓
Retrieval
    ↓
Filtering
    ↓
Reranking
    ↓
Context
    ↓
LLM
    ↓
Grounded Answer
    ↓
Citation
```

**The core idea to remember:**

> 🧠 **Embedding converts meaning into vectors → Vector DB finds similar vectors → RAG gives the retrieved information to the LLM → LLM generates the answer.**

For current implementation references, [Qdrant's official JavaScript/collection documentation](https://qdrant.tech/documentation/manage-data/collections/?utm_source=chatgpt.com) and [Google's current Gemini Embeddings documentation](https://ai.google.dev/gemini-api/docs/embeddings?authuser=117&utm_source=chatgpt.com) are the best places to keep alongside these notes.

[1]: https://ai.google.dev/gemini-api/docs/deprecations?utm_source=chatgpt.com "Gemini deprecations  |  Gemini API  |  Google AI for Developers"
[2]: https://qdrant.tech/documentation/manage-data/collections/?utm_source=chatgpt.com "Collections - Qdrant"
[3]: https://qdrant.tech/documentation/quick-start/?utm_source=chatgpt.com "Local Quickstart - Qdrant"
[4]: https://qdrant.tech/documentation/migration-guidance/search-quality/?utm_source=chatgpt.com "Search Quality - Qdrant"
[5]: https://api.qdrant.tech/api-reference/points/upsert-points?utm_source=chatgpt.com "Upsert points | Qdrant | API Reference"
[6]: https://ai.google.dev/gemini-api/docs/models/gemini-embedding-001?utm_source=chatgpt.com "Gemini Embedding model  |  Gemini API  |  Google AI for Developers"
[7]: https://ai.google.dev/gemini-api/docs/models/gemini-embedding-2?utm_source=chatgpt.com "Gemini Embedding 2 model  |  Gemini API  |  Google AI for Developers"
[8]: https://ai.google.dev/gemini-api/docs/embeddings?authuser=117&utm_source=chatgpt.com "Embeddings  |  Gemini API  |  Google AI for Developers"
