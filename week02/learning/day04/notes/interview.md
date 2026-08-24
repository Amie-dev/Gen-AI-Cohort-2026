# 🎯 Week 02 — Day 04 Interview Questions & Deep Dive Answers

## Topic: Vector RAG, Document Chunking, Vector DBs (Qdrant), & Advanced Retrieval

> **Target Audience:** AI Engineers, RAG Pipeline Architects, and Vector Database Infrastructure Engineers.

---

## 📑 Table of Contents

1. [Category 1 — Foundational RAG & Memory](#category-1--foundational-rag--memory)
2. [Category 2 — Document Chunking & Ingestion](#category-2--document-chunking--ingestion)
3. [Category 3 — Embeddings, Similarity & Vector Search](#category-3--embeddings-similarity--vector-search)
4. [Category 4 — Vector Databases & Qdrant](#category-4--vector-databases--qdrant)
5. [Category 5 — Advanced Retrieval & Reranking](#category-5--advanced-retrieval--reranking)
6. [Category 6 — Query Transformation](#category-6--query-transformation)
7. [Category 7 — Production RAG](#category-7--production-rag)
8. [Category 8 — RAG Evaluation & Debugging](#category-8--rag-evaluation--debugging)
9. [Category 9 — Practical Node.js & LangChain](#category-9--practical-nodejs--langchain)

---

# 1. Category 1 — Foundational RAG & Memory

## Q1: What is Retrieval-Augmented Generation (RAG)?

### 💡 Short Interview Answer

**RAG, or Retrieval-Augmented Generation, is an architecture where an LLM retrieves relevant information from an external knowledge source before generating an answer.**

Instead of depending only on knowledge stored inside the model, RAG gives the model relevant information from sources such as documents, databases, or vector databases.

### 🧠 Easy Explanation

Think of an LLM as a student.

Without RAG:

```text
Question → Student's Memory → Answer
```

With RAG:

```text
Question
   ↓
Search Knowledge Base
   ↓
Find Relevant Information
   ↓
Give Information to LLM
   ↓
Generate Answer
```

It's similar to allowing the student to **open the book before answering**.

### 🔧 Basic RAG Pipeline

```text
                ┌───────────────┐
                │ User Question │
                └───────┬───────┘
                        ↓
                 ┌────────────┐
                 │   Embed    │
                 │   Query    │
                 └─────┬──────┘
                       ↓
              ┌─────────────────┐
              │  Vector Search  │
              └────────┬────────┘
                       ↓
             ┌────────────────────┐
             │ Relevant Documents │
             └─────────┬──────────┘
                       ↓
                ┌────────────┐
                │    LLM     │
                └─────┬──────┘
                      ↓
                   Answer
```

### 📌 Example

Suppose a company has:

```text
employee-handbook.pdf
```

The user asks:

> "How many annual leave days do employees receive?"

The LLM might not know the company's private policy.

RAG searches the company's documents, retrieves the relevant section, and gives it to the LLM.

### 🎯 Interview Follow-up

**Q: Does RAG require a vector database?**

**Answer:** No.

RAG can retrieve information using:

* Vector databases
* SQL databases
* Elasticsearch
* BM25
* APIs
* Graph databases
* Traditional search engines

A vector database is common for **semantic retrieval**, but RAG itself is broader than vector search.

---

# Q2: What are Parametric and Non-Parametric Memory?

### 💡 Short Answer

**Parametric memory** is knowledge encoded in the model's learned parameters.

**Non-parametric memory** is knowledge stored outside the model in an external data source that can be retrieved when needed.

| Type           | Stored In                   | Update                                |
| -------------- | --------------------------- | ------------------------------------- |
| Parametric     | Model weights               | Usually requires training/fine-tuning |
| Non-parametric | External database/documents | Can be updated independently          |

### 🧠 Easy Example

Imagine ChatGPT knows general programming concepts.

That knowledge is part of its **parametric memory**.

Your company's private employee handbook isn't inside the model.

You can store it in a database and retrieve it using RAG.

That's **non-parametric memory**.

---

# Q3: RAG vs Prompting vs Fine-Tuning — When should you use each?

### 💡 Short Answer

Use:

* **Prompting** → instructions and behavior
* **RAG** → external/private/current knowledge
* **Fine-tuning** → changing model behavior, style, or specialized task performance

| Feature                  | Prompting | RAG  | Fine-Tuning             |
| ------------------------ | --------- | ---- | ----------------------- |
| Instructions             | ✅         | ✅    | ✅                       |
| Private knowledge        | ⚠️        | ✅    | Possible, but not ideal |
| Frequently changing data | ❌         | ✅    | ❌                       |
| Custom style             | ✅         | ✅    | ✅                       |
| Domain behavior          | Limited   | Good | Excellent               |
| Easy knowledge updates   | ✅         | ✅    | ❌                       |
| Source citations         | ❌         | ✅    | ❌                       |

### 🎯 Interview Example

Suppose a company changes its leave policy every month.

Would you fine-tune the model every month?

**No.**

You would update the documents in the knowledge base and re-index the changed content.

That's one reason RAG is useful for dynamic information.

---

# Q4: Does RAG eliminate hallucinations?

### 💡 Answer

**No. RAG reduces hallucination risk, but it does not eliminate hallucinations.**

A RAG system can still fail if:

1. The wrong documents are retrieved.
2. Important information was lost during chunking.
3. The retrieved context is incomplete.
4. The LLM ignores the retrieved context.
5. The document itself contains incorrect information.

### 🧠 Easy Rule

```text
Bad Retrieval
     ↓
Bad Context
     ↓
Bad Generation
```

This is often summarized as:

> **Garbage Retrieval → Garbage Generation**

### 🛡️ Mitigation

Use:

* Better chunking
* Better embeddings
* Metadata filtering
* Hybrid search
* Reranking
* Query rewriting
* Grounded prompts
* Retrieval evaluation

---

# Q5: What happens if RAG cannot find the answer?

### 💡 Good Interview Answer

A production RAG system should **not force the LLM to answer** when the retrieved context doesn't contain enough information.

Instead, it should return something like:

> "I couldn't find enough information in the provided documents to answer this question."

### Example

User:

> "What is the company's policy for working on Mars?"

Retrieved documents:

```text
No relevant information
```

The system should not invent a policy.

```text
Retriever
   ↓
No relevant context
   ↓
Abstain
   ↓
"I don't have enough information."
```

---

# Q6: When should you NOT use RAG?

RAG isn't automatically the best solution.

You may not need RAG when:

* The task doesn't require external knowledge.
* The information is small enough to fit directly into the prompt.
* You only need general reasoning.
* The problem is mainly about model behavior/style.
* A normal SQL query can answer the question more reliably.

### Example

Question:

> "Convert 100 USD to INR."

You don't need a vector database for that.

A live exchange-rate API is more appropriate.

---

# 2. Category 2 — Document Chunking & Ingestion

# Q7: What is document chunking?

### 💡 Short Answer

**Chunking is the process of breaking a large document into smaller pieces before generating embeddings and storing them in a retrieval system.**

### Why?

LLMs and embedding models have context/token limitations, and smaller chunks generally make retrieval more precise.

```text
Large PDF
   ↓
Extract Text
   ↓
Split into Chunks
   ↓
Generate Embeddings
   ↓
Store in Vector DB
```

---

# Q8: Why not embed the entire document?

Imagine a 200-page PDF.

If you create only one embedding:

```text
200-page PDF
      ↓
   1 Vector
```

The vector represents many different topics.

A query about:

> "Employee leave policy"

could retrieve the entire document, but the embedding may not precisely represent the leave section.

Instead:

```text
200-page PDF
      ↓
  500 Chunks
      ↓
  500 Embeddings
```

Now retrieval can find the specific relevant section.

---

# Q9: What is fixed-size chunking?

Fixed-size chunking splits text based on a predefined size.

Example:

```text
Chunk Size = 500 tokens
Overlap = 50 tokens
```

```text
Document
────────────────────────────────────────────

[------500------]
          [------500------]
                    [------500------]
```

### Advantages

* Simple
* Fast
* Predictable
* Easy to implement

### Disadvantages

It can break semantic boundaries.

For example:

```text
"The API requires authentication using"
```

and:

```text
"OAuth 2.0 tokens."
```

could end up in different chunks.

---

# Q10: What is Recursive Character Chunking?

Recursive chunking attempts to split text using meaningful separators.

For example:

```text
Paragraph
   ↓
New line
   ↓
Sentence
   ↓
Space
   ↓
Character
```

Instead of immediately cutting text at a fixed position, it tries to preserve the document structure.

### Why is it popular?

It provides a good balance between:

```text
Speed + Simplicity + Semantic Coherence
```

---

# Q11: What is Semantic Chunking?

Semantic chunking uses the meaning of the text to decide where a split should happen.

Conceptually:

```text
Sentence 1 ── similar ── Sentence 2
                         ↓
                    Continue

Sentence 3 ── different ── Sentence 4
                         ↓
                       Split
```

It may use embeddings to detect significant changes in topic.

### Advantage

Better semantic boundaries.

### Disadvantage

More computationally expensive than simple chunking.

---

# Q12: How do you choose chunk size?

There is **no universal perfect chunk size**.

It depends on:

* Document type
* Embedding model
* Query complexity
* LLM context window
* Retrieval strategy

A practical starting point might be:

```text
Chunk Size: 500–1000 tokens
Overlap:    50–200 tokens
```

Then evaluate retrieval quality and adjust.

### Important Interview Point

Don't say:

> "1000 tokens is always the best."

Say:

> **"I would start with a reasonable chunk size and evaluate retrieval quality against a representative evaluation dataset."**

That sounds much stronger in an interview.

---

# Q13: What happens if chunks are too small?

Example:

```text
Chunk 1:
"The employee can request"

Chunk 2:
"20 days of annual leave."

Chunk 3:
"Requests require manager approval."
```

The information becomes fragmented.

### Problems

* Less context
* More retrieval results required
* More vectors
* Higher indexing/storage cost
* Relationships between statements can be lost

---

# Q14: What happens if chunks are too large?

Large chunks can contain many unrelated topics.

```text
Chunk
├── Leave Policy
├── Salary Policy
├── Travel Policy
├── Insurance Policy
└── Security Policy
```

A query about leave may retrieve a huge chunk containing unnecessary information.

### Problems

* Lower retrieval precision
* More context tokens
* Higher LLM cost
* More noise
* Potentially worse generation

---

# Q15: What is chunk overlap?

Chunk overlap means repeating some content between neighboring chunks.

Example:

```text
Chunk 1:
[A B C D E F]

Chunk 2:
        [E F G H I J]
         ↑
       overlap
```

If a sentence crosses a chunk boundary, overlap helps preserve the context.

### Example

```text
Chunk 1:
"The employee must submit the request"

Chunk 2:
"the request at least 14 days before..."
```

With overlap, the important relationship has a better chance of remaining intact.

---

# Q16: What metadata should be stored with a chunk?

A chunk should usually contain both:

```text
Content
+
Metadata
```

Example:

```json
{
  "text": "Employees receive 20 days of annual leave.",
  "metadata": {
    "document_id": "employee-handbook-01",
    "page": 23,
    "section": "Leave Policy",
    "tenant_id": "company_123",
    "source": "employee-handbook.pdf",
    "chunk_index": 42
  }
}
```

### Why metadata matters

It enables:

* Filtering
* Authorization
* Citations
* Debugging
* Source tracking
* Document deletion/update

---

# 3. Category 3 — Embeddings, Similarity & Vector Search

# Q17: What is an embedding?

### 💡 Short Answer

An **embedding is a numerical vector representation of data that captures semantic information.**

For example:

```text
"How do I reset my password?"
              ↓
       Embedding Model
              ↓
[0.12, -0.43, 0.91, ...]
```

Similar meanings tend to produce vectors that are close under the chosen similarity metric.

---

# Q18: Why do we use embeddings in RAG?

Suppose we have:

```text
Document:
"Users can change their password from account settings."
```

User asks:

> "How can I update my password?"

The words aren't identical.

Keyword search may struggle.

Embeddings can understand that:

```text
change password
≈
update password
```

So semantic search can retrieve the relevant chunk.

---

# Q19: What is cosine similarity?

Cosine similarity measures the angle between two vectors.

Formula:

```text
              A · B
cos(θ) = ─────────────
          ||A|| ||B||
```

### Easy Explanation

Think of two arrows.

```text
       B
      /
     /
    / θ
   /
  /________ A
```

If the arrows point in similar directions, the similarity is high.

### Common use

Cosine similarity is widely used for semantic embeddings, especially when vector direction is more important than magnitude.

---

# Q20: Cosine vs Dot Product vs Euclidean Distance

| Metric      | Measures               | Important Property            |
| ----------- | ---------------------- | ----------------------------- |
| Cosine      | Angle                  | Ignores magnitude             |
| Dot Product | Alignment + magnitude  | Sensitive to vector magnitude |
| Euclidean   | Straight-line distance | Measures absolute distance    |

### Important Interview Point

If vectors are normalized:

```text
Cosine similarity ≈ Dot product
```

But without normalization, they are not equivalent.

---

# Q21: What is embedding dimensionality?

Dimensionality means the number of values in an embedding vector.

Example:

```text
[0.2, 0.4, 0.1, 0.8]
```

has:

```text
4 dimensions
```

A real embedding model may produce hundreds or thousands of dimensions.

### Why does it matter?

Higher dimensional vectors can contain more representational capacity, but they can also increase:

* Storage
* Memory usage
* Search cost
* Index size

---

# Q22: What is ANN search?

ANN means:

> **Approximate Nearest Neighbor**

A brute-force search compares the query vector with every vector.

```text
Query
 ↓
Compare with 1
Compare with 2
Compare with 3
...
Compare with 1,000,000
```

That's expensive.

ANN indexes allow the system to search a much smaller portion of the vector space while maintaining high recall.

```text
Query
 ↓
ANN Index
 ↓
Likely candidates
 ↓
Top-K
```

The goal is:

> **Much faster search with an acceptable small loss in exactness.**

---

# 4. Category 4 — Vector Databases & Qdrant

# Q23: What is a vector database?

### 💡 Short Answer

A vector database is a database optimized for storing and searching high-dimensional vectors using similarity metrics.

Typical data:

```text
Vector
+
Original Text
+
Metadata
```

Example:

```text
Vector → [0.12, 0.44, ...]
Text   → "Leave policy..."
Metadata → page=23, tenant_id=123
```

---

# Q24: Why use a vector database instead of a normal database?

A traditional database is optimized for operations such as:

```sql
WHERE user_id = 123
```

A vector database is optimized for questions like:

> "Find documents semantically similar to this query."

For example:

```text
Query Vector
     ↓
Vector Index
     ↓
Top-K Similar Vectors
```

### However

You don't always need a dedicated vector database.

For smaller applications, **PostgreSQL + pgvector** can be a very practical choice.

---

# Q25: What is HNSW?

HNSW stands for:

> **Hierarchical Navigable Small World**

It is a graph-based approximate nearest-neighbor indexing algorithm.

Conceptually:

```text
Layer 2:        A -------- D
                \          /
Layer 1:     A --- B --- C --- D
                  |
Layer 0: A--B--C--D--E--F--G--H
```

The upper layers allow the search to move quickly toward promising regions, while lower layers provide finer navigation.

### Advantages

* Excellent search performance
* Strong recall
* Widely used for vector search

### Disadvantages

* Memory overhead
* Index construction/update cost
* Requires tuning for latency vs recall

### Interview Tip

Don't claim:

> "HNSW always gives O(log N)."

A safer answer is:

> **"HNSW provides efficient approximate nearest-neighbor search, with practical performance that is much better than brute-force scanning for large datasets."**

---

# Q26: What is IVF?

IVF means:

> **Inverted File Index**

The vector space is divided into clusters.

```text
                 Vector Space

       Cluster A       Cluster B

          ● ●             ● ●
        ● ● ●           ● ● ●

                    Cluster C

                     ● ● ●
                      ● ●
```

During search, instead of examining every vector, the system searches selected clusters.

### Advantages

* Efficient for large-scale datasets
* Can reduce search work significantly

### Trade-off

Searching too few clusters can reduce recall.

Searching more clusters improves recall but increases latency.

---

# Q27: What is a Qdrant Collection?

In Qdrant, a **collection** is a logical container for vectors with compatible vector configuration.

Example:

```text
Qdrant
│
├── users
├── products
└── company_documents
```

A collection defines things such as vector size and distance metric.

---

# Q28: What is a Qdrant Point?

A Qdrant point represents a stored item.

Conceptually:

```json
{
  "id": "chunk-123",
  "vector": [0.1, 0.4, 0.8],
  "payload": {
    "text": "Leave policy...",
    "page": 23,
    "tenant_id": "company_123"
  }
}
```

So a point can contain:

```text
ID
+
Vector
+
Payload
```

---

# Q29: What is Payload in Qdrant?

Payload is structured metadata stored alongside a vector.

Example:

```json
{
  "tenant_id": "company_123",
  "document_id": "doc_456",
  "page": 10,
  "category": "HR",
  "access_level": "employee"
}
```

Payload is extremely useful for filtering.

---

# Q30: How does metadata filtering improve RAG?

Suppose we have documents from:

```text
Company A
Company B
Company C
```

User belongs to Company A.

Instead of searching everything:

```text
Vector Search
     ↓
All Documents
```

we can search:

```text
Vector Search
     +
tenant_id = company_A
     ↓
Only Authorized Documents
```

This improves both **relevance and security**.

---

# Q31: How do you implement tenant isolation?

A chunk can contain:

```json
{
  "tenant_id": "tenant_123"
}
```

When querying:

```text
User
 ↓
Authenticate
 ↓
Get tenant_id
 ↓
Vector Search
 ↓
Filter tenant_id
 ↓
Retrieve only authorized chunks
```

### Important Security Point

Never trust a `tenant_id` supplied directly by an untrusted client.

The backend should derive authorization information from the authenticated user's identity/session.

---

# Q32: Qdrant vs Pinecone vs Milvus vs pgvector

| Technology | Best Fit                                          |
| ---------- | ------------------------------------------------- |
| Qdrant     | Flexible vector search + filtering + self-hosting |
| Pinecone   | Managed vector infrastructure                     |
| Milvus     | Large-scale distributed vector workloads          |
| pgvector   | Applications already centered around PostgreSQL   |

### Interview Answer

> "I wouldn't choose a vector database only by benchmark numbers. I'd consider scale, filtering requirements, operational complexity, deployment model, ecosystem, cost, and whether my application already uses PostgreSQL."

That's a stronger engineering answer.

---

# 5. Category 5 — Advanced Retrieval & Reranking

# Q33: What is Top-K retrieval?

Top-K means retrieving the K most relevant documents.

If:

```text
K = 5
```

the retriever returns the five highest-scoring chunks.

```text
Query
 ↓
Vector Search
 ↓
1. Chunk A — 0.92
2. Chunk B — 0.89
3. Chunk C — 0.85
4. Chunk D — 0.81
5. Chunk E — 0.78
```

---

# Q34: How do you choose K?

There is no universal K.

Too small:

```text
K = 1
```

You may miss useful information.

Too large:

```text
K = 50
```

You may introduce irrelevant context.

A common architecture is:

```text
Retrieve Top 20–50
        ↓
Rerank
        ↓
Keep Top 3–10
        ↓
LLM
```

The exact values should be determined through evaluation.

---

# Q35: What is Dense Retrieval?

Dense retrieval represents queries and documents as dense vectors.

```text
Query
 ↓
Embedding
 ↓
Vector
 ↓
Vector Search
 ↓
Relevant Documents
```

It is good at understanding semantic similarity.

---

# Q36: What is Sparse Retrieval?

Sparse retrieval represents documents using sparse term-based representations.

A classic example is:

> **BM25**

Sparse search is particularly good when exact terms matter.

For example:

```text
Error code: ERR_CONNECTION_RESET
```

Exact keyword matching can be extremely useful here.

---

# Q37: What is Hybrid Search?

Hybrid search combines multiple retrieval approaches.

For example:

```text
                Query
                  ↓
          ┌───────┴────────┐
          ↓                ↓
     Dense Search      BM25 Search
          ↓                ↓
       Results          Results
          └───────┬────────┘
                  ↓
             Fusion/RRF
                  ↓
              Top Results
```

### Why?

Dense retrieval is good at meaning.

Sparse retrieval is good at exact terms.

Together they can outperform either method alone on many datasets.

---

# Q38: What is Reciprocal Rank Fusion (RRF)?

RRF combines ranked result lists.

A simplified formula is:

```text
RRF(d) = Σ 1 / (k + rank(d))
```

If a document appears near the top in multiple retrieval systems, it receives a stronger combined score.

### Example

```text
Dense Search:
A, B, C

BM25:
B, D, A
```

Documents A and B appear strongly across both lists.

RRF can promote them.

---

# 6. Category 6 — Query Transformation

# Q39: What is Query Rewriting?

Sometimes users ask vague questions.

Example:

> "How does it work?"

The query lacks context.

Query rewriting can transform it into:

> "How does the employee leave approval process work according to the company policy?"

Then retrieval happens using the improved query.

---

# Q40: What is Multi-Query Retrieval?

Instead of creating one search query, an LLM generates several variations.

```text
User Query
    ↓
 ┌──┼────────┐
 ↓  ↓        ↓
Q1  Q2       Q3
 ↓  ↓        ↓
Search each query
    ↓
Combine results
```

This increases the chance of finding relevant documents when wording varies.

---

# Q41: What is Query Decomposition?

A complex question can be broken into smaller questions.

Example:

> "Compare the company's leave policy for full-time and contract employees and explain approval requirements."

Break it into:

```text
Q1 → Full-time leave policy?
Q2 → Contract employee leave policy?
Q3 → Approval requirements?
```

Each sub-question can be retrieved separately.

---

# Q42: What is HyDE?

HyDE stands for:

> **Hypothetical Document Embeddings**

The system asks an LLM to generate a hypothetical answer/document.

```text
User Query
    ↓
LLM generates hypothetical document
    ↓
Embed hypothetical document
    ↓
Vector Search
    ↓
Real documents
```

### Why?

Sometimes the user's question and the actual document have very different wording.

The hypothetical document can provide a representation closer to the expected answer.

### Important

The hypothetical document is **not treated as factual evidence**.

It is only used to improve retrieval.

---

# Q43: What is Step-Back Prompting?

Instead of immediately answering a very specific question, the system first asks:

> "What broader concept do I need to understand to answer this?"

Example:

```text
Specific:
"Why did this API request fail?"

Step back:
"What authentication mechanisms does this API use?"
```

The broader query can retrieve useful background information.

---

# 7. Category 7 — Reranking

# Q44: What is a Bi-Encoder?

A bi-encoder independently embeds:

```text
Query → Vector A

Document → Vector B
```

Then compares:

```text
Similarity(Vector A, Vector B)
```

### Advantage

Very fast.

That's why it works well for searching millions of documents.

---

# Q45: What is a Cross-Encoder?

A cross-encoder receives the query and document together:

```text
[Query + Document]
       ↓
 Transformer
       ↓
Relevance Score
```

Because the model can directly examine interactions between the query and document tokens, it is generally more accurate for reranking.

But it is more computationally expensive.

---

# Q46: Why use two-stage retrieval?

Because we want both:

```text
Speed + Accuracy
```

Architecture:

```text
                User Query
                    ↓
             Bi-Encoder Search
                    ↓
              Top 50 Results
                    ↓
             Cross-Encoder
                 Reranker
                    ↓
               Top 5 Results
                    ↓
                   LLM
```

The expensive reranker doesn't need to process millions of documents.

It only processes the candidate set.

---

# Q47: When should you use reranking?

Reranking is especially useful when:

* Initial retrieval returns many similar documents.
* Precision is more important than raw retrieval speed.
* Queries are complex.
* The vector search ranking isn't reliable enough.

For a tiny dataset, reranking may be unnecessary overhead.

---

# 8. Category 8 — Production RAG

# Q48: How would you design a production RAG system?

### 💡 Strong Interview Answer

I would separate the system into **indexing** and **query** pipelines.

```text
                INDEXING PIPELINE

PDF / Web / DB
      ↓
Document Parser
      ↓
Cleaning
      ↓
Chunking
      ↓
Metadata
      ↓
Embeddings
      ↓
Vector DB
```

And:

```text
                 QUERY PIPELINE

User Query
    ↓
Authentication
    ↓
Query Transformation
    ↓
Retrieval
    ↓
Metadata Filtering
    ↓
Reranking
    ↓
Context Construction
    ↓
LLM
    ↓
Grounded Answer + Sources
```

This separation makes the system easier to scale and maintain.

---

# Q49: How do you handle document updates?

Suppose:

```text
Policy v1
```

is updated to:

```text
Policy v2
```

You should not blindly insert v2 and leave stale v1 chunks.

A robust pipeline can:

```text
Detect document change
       ↓
Identify document_id/version
       ↓
Delete or deactivate old chunks
       ↓
Chunk new version
       ↓
Generate embeddings
       ↓
Upsert new chunks
```

Metadata such as:

```text
document_id
version
updated_at
```

makes this easier.

---

# Q50: How do you prevent duplicate indexing?

Use stable document identifiers.

For example:

```text
document_id = hash(file_content)
```

or an external source ID.

Then:

```text
Already indexed?
       ↓
     Yes → Skip / Update
       ↓
      No
       ↓
     Index
```

This makes indexing idempotent.

---

# Q51: How do you handle multi-tenant RAG?

Every chunk should have tenant metadata:

```json
{
  "tenant_id": "tenant_123",
  "document_id": "doc_456"
}
```

At retrieval time:

```text
Authenticated User
       ↓
Determine tenant
       ↓
Apply tenant filter
       ↓
Vector Search
       ↓
Authorized Documents
```

Tenant filtering should happen **before results are returned**, not merely after retrieval in application code.

---

# Q52: How do you reduce RAG latency?

Possible optimizations:

1. Cache embeddings.
2. Batch embedding requests.
3. Use ANN indexes.
4. Reduce unnecessary retrieval calls.
5. Use smaller candidate sets where appropriate.
6. Rerank only a limited number of candidates.
7. Stream the final LLM response.
8. Cache frequent queries.
9. Run independent retrieval operations in parallel.
10. Measure each pipeline stage separately.

### Key idea

Don't optimize blindly.

Measure:

```text
Embedding latency
Retrieval latency
Reranking latency
LLM latency
Total latency
```

---

# Q53: How do you reduce RAG cost?

Main cost sources include:

```text
Embedding API
LLM calls
Reranking
Storage
```

Possible solutions:

* Avoid re-embedding unchanged documents.
* Batch embeddings.
* Cache repeated queries.
* Use smaller embedding models when quality is sufficient.
* Retrieve fewer chunks.
* Rerank only candidates.
* Use an appropriately sized LLM.
* Avoid unnecessary query rewriting.

---

# Q54: What happens if the vector database goes down?

A production system should have a failure strategy.

Possible approaches:

```text
Vector DB unavailable
       ↓
Retry
       ↓
Circuit breaker
       ↓
Fallback
```

Depending on the application:

* Return a graceful error.
* Use cached results.
* Fall back to keyword search.
* Use a replicated vector database.
* Temporarily disable retrieval-dependent functionality.

Most importantly:

> **Don't silently generate an answer as if retrieval succeeded.**

---

# 9. Category 9 — RAG Evaluation & Debugging

# Q55: How do you evaluate a RAG system?

You should evaluate **retrieval and generation separately**.

```text
              RAG Evaluation
                    │
          ┌─────────┴─────────┐
          ↓                   ↓
   Retrieval Quality     Generation Quality
          ↓                   ↓
   Recall@K              Faithfulness
   Precision@K           Answer Relevance
   MRR                   Correctness
   NDCG
```

This is important because a bad answer doesn't necessarily mean the LLM is the problem.

The retriever may have returned the wrong documents.

---

# Q56: What is Recall@K?

Recall@K asks:

> **Did the relevant document appear within the top K retrieved documents?**

Example:

There are 5 relevant chunks.

If your Top-5 retrieval contains 4 of them:

```text
Recall = 4 / 5 = 80%
```

It helps evaluate whether retrieval is finding the information you need.

---

# Q57: What is Precision@K?

Precision@K asks:

> **How many of the top K retrieved documents are actually relevant?**

Example:

```text
Top 5 results
4 relevant
1 irrelevant
```

Then:

```text
Precision@5 = 4/5 = 80%
```

### Simple Difference

```text
Recall:
"Did I find the relevant documents?"

Precision:
"Are the documents I found actually relevant?"
```

---

# Q58: How do you debug a bad RAG answer?

Don't immediately blame the LLM.

Trace the entire pipeline:

```text
User Query
    ↓
Was query transformed correctly?
    ↓
Were the right chunks retrieved?
    ↓
Was ranking good?
    ↓
Was metadata filtering correct?
    ↓
Was context constructed correctly?
    ↓
Did the prompt instruct grounding?
    ↓
Did LLM generate correctly?
```

### Example

If the user asks:

> "How many leave days?"

and the retriever returns salary documents, the problem is probably **retrieval**, not generation.

---

# Q59: What are common causes of poor retrieval?

Common causes include:

### 1. Bad chunking

```text
Important information split incorrectly
```

### 2. Poor embeddings

The embedding model doesn't represent the domain/query well.

### 3. Wrong similarity metric

The vector index is configured inconsistently with the embedding setup.

### 4. Poor query

The user query is vague.

### 5. Missing metadata

The system cannot filter relevant documents.

### 6. Too-small K

Relevant context isn't retrieved.

### 7. Too-large K

Too much irrelevant context is introduced.

### 8. No reranking

Initial vector ranking isn't precise enough.

---

# 10. Category 10 — Practical Node.js & LangChain

# Q60: Explain a basic Node.js RAG pipeline.

A basic implementation looks like:

```text
Document
   ↓
Chunk
   ↓
Embedding
   ↓
Qdrant
   ↓
User Query
   ↓
Query Embedding
   ↓
Similarity Search
   ↓
Retrieved Chunks
   ↓
Prompt
   ↓
LLM
   ↓
Answer
```

A simplified implementation:

```javascript
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";

async function runRAG(userQuery) {
  // 1. Embedding model
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  // 2. Chat model
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  // 3. Source document
  const document = new Document({
    pageContent:
      "Acme employees receive 20 days of paid annual leave. Requests must be submitted two weeks in advance.",
    metadata: {
      tenant_id: "acme_1",
      source: "employee-handbook.pdf",
    },
  });

  // 4. Chunking
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const chunks = await splitter.splitDocuments([document]);

  // 5. Store embeddings in Qdrant
  const vectorStore = await QdrantVectorStore.fromDocuments(
    chunks,
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "employee_policies",
    }
  );

  // 6. Retrieve relevant chunks
  const retriever = vectorStore.asRetriever({
    k: 3,
  });

  const results = await retriever.invoke(userQuery);

  // 7. Build context
  const context = results
    .map((doc) => doc.pageContent)
    .join("\n\n---\n\n");

  // 8. Grounded prompt
  const prompt = `
Answer the question using only the provided context.

If the answer is not present in the context,
say that you do not have enough information.

Context:
${context}

Question:
${userQuery}
`;

  // 9. Generate answer
  const response = await model.invoke(prompt);

  console.log(response.content);
}

runRAG("How many paid leave days do employees get?");
```

### 🎯 Interview Explanation

You don't need to explain every line.

Explain the architecture:

> "First I parse and chunk the document. I generate embeddings for those chunks and store them in Qdrant with metadata. When a user asks a question, I embed the query and retrieve the most relevant chunks. I then put those chunks into the LLM context and ask the model to generate a grounded answer."

That's usually a much better interview explanation than reading code line by line.

---

# Q61: Implement Cosine Similarity from scratch.

```javascript
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }

  const denominator =
    Math.sqrt(normA) * Math.sqrt(normB);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}
```

### Example

```javascript
const query = [0.1, 0.5, 0.8];

const document = [0.12, 0.48, 0.81];

console.log(
  cosineSimilarity(query, document)
);
```

The closer the vectors point in the same direction, the higher the cosine similarity.

---

# Q62: How would you implement Top-K vector search?

```javascript
function searchTopK(queryVector, documents, k = 3) {
  const scored = documents.map((doc) => ({
    ...doc,
    score: cosineSimilarity(
      queryVector,
      doc.vector
    ),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
```

Example:

```javascript
const queryVector = [0.1, 0.5, 0.8];

const documents = [
  {
    id: 1,
    text: "Employee leave policy",
    vector: [0.12, 0.48, 0.81],
  },
  {
    id: 2,
    text: "Rocket engine design",
    vector: [-0.9, 0.1, 0.05],
  },
];
```

Then:

```javascript
const results = searchTopK(
  queryVector,
  documents,
  1
);

console.log(results);
```

### Important Interview Point

This implementation is useful for **understanding vector search**, but it doesn't scale well.

If you have:

```text
10 documents
```

brute-force search is fine.

If you have:

```text
100 million vectors
```

you need an ANN index/vector database.

---

# Q63: Explain the complete RAG architecture in an interview.

A strong answer would be:

> **"I divide a RAG system into two pipelines: indexing and querying."**

### Indexing

```text
Documents
    ↓
Parsing
    ↓
Cleaning
    ↓
Chunking
    ↓
Metadata
    ↓
Embedding Model
    ↓
Vector Database
```

### Query

```text
User Query
    ↓
Authentication
    ↓
Query Transformation
    ↓
Query Embedding
    ↓
Vector / Hybrid Retrieval
    ↓
Metadata Filtering
    ↓
Reranking
    ↓
Context Construction
    ↓
LLM
    ↓
Grounded Answer
    ↓
Sources
```

Then add:

> **"For production, I would also add evaluation, observability, caching, access control, retries, and document versioning."**

That one answer demonstrates that you understand RAG as a **system**, rather than simply knowing what embeddings and vector databases are.

---

# 🧠 Final Interview Cheat Sheet

Remember this progression:

```text
DOCUMENT
   ↓
PARSE
   ↓
CHUNK
   ↓
EMBED
   ↓
STORE
   ↓
────────────────────
      QUERY
────────────────────
   ↓
EMBED QUERY
   ↓
RETRIEVE
   ↓
FILTER
   ↓
RERANK
   ↓
CONTEXT
   ↓
LLM
   ↓
ANSWER
   ↓
EVALUATE
```

And remember the core concepts:

| Concept                 | One-Line Explanation                                         |
| ----------------------- | ------------------------------------------------------------ |
| **RAG**                 | Retrieve knowledge before generating an answer               |
| **Embedding**           | Convert meaning into a numerical vector                      |
| **Chunking**            | Break documents into retrievable pieces                      |
| **Vector DB**           | Store and search embeddings efficiently                      |
| **Qdrant**              | Vector database with similarity search and payload filtering |
| **HNSW**                | Graph-based ANN index                                        |
| **IVF**                 | Cluster-based ANN index                                      |
| **Top-K**               | Return the K highest-ranked results                          |
| **Metadata Filter**     | Restrict retrieval using structured conditions               |
| **Hybrid Search**       | Combine dense and sparse retrieval                           |
| **BM25**                | Keyword-based sparse retrieval algorithm                     |
| **Reranker**            | Reorders retrieved candidates for better precision           |
| **Bi-Encoder**          | Encodes query/document independently                         |
| **Cross-Encoder**       | Scores query + document together                             |
| **Query Rewriting**     | Improve the search query before retrieval                    |
| **Query Decomposition** | Break one complex query into smaller queries                 |
| **HyDE**                | Search using an LLM-generated hypothetical document          |
| **RRF**                 | Combine multiple ranked result lists                         |
| **Recall@K**            | Did we retrieve the relevant information?                    |
| **Precision@K**         | How many retrieved results are relevant?                     |
| **Grounding**           | Make the answer rely on retrieved evidence                   |
| **Production RAG**      | RAG + security + evaluation + observability + reliability    |

### 🎯 The most important interview mindset

Don't memorize only definitions.

For almost every RAG question, think:

**What problem does it solve → How does it work → What is the trade-off → When would I use it?**

That pattern will let you answer unfamiliar RAG questions much more confidently.
