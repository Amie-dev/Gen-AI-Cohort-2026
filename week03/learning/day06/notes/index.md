

### 📚 Week 03 — Day 06: Vectorless RAG & Hierarchical Knowledge Engines

**Main idea:**
Traditional RAG usually asks:

> “Which chunks are semantically similar to my query?”

Vectorless RAG asks:

> “Which part of the document structure is relevant to my query?”

That small change leads to a very different retrieval architecture.

---

## 1. What We Learn Today

Day 06 focuses on four major ideas:

1. **Why traditional Vector RAG can fail**
2. **Vectorless RAG with hierarchical tree indexing**
3. **Agentic Tree Search using an LLM**
4. **LLM Wiki / Knowledge Engine architecture**

At the end, we compare **Vector RAG vs Vectorless RAG** and understand when to use each.

---

# 2. Why Traditional Vector RAG Has Problems

A typical Vector RAG pipeline looks like this:

```mermaid
flowchart LR
    DOC[Large Document] --> CHUNK[Split into Fixed Chunks]
    CHUNK --> EMB[Create Embeddings]
    EMB --> DB[(Vector Database)]

    Q[User Query] --> QE[Query Embedding]
    QE --> DB
    DB --> TOP[Top-K Similar Chunks]
    TOP --> LLM[LLM]
    LLM --> A[Answer]
```

The problem starts with **chunking**.

Imagine a 200-page financial report.

Instead of understanding the document structure, we might simply split it:

```text
Page 1-5   → Chunk 1
Page 6-10  → Chunk 2
Page 11-15 → Chunk 3
...
```

This can break important relationships.

### Example

A document may have:

```text
Annual Report
│
├── Financial Performance
│   ├── Revenue
│   ├── Expenses
│   └── Profit
│
├── Risk Factors
│   ├── Market Risk
│   ├── Credit Risk
│   └── Operational Risk
│
└── Future Strategy
```

Fixed-size chunking doesn't naturally understand this hierarchy.

---

## 3. Similarity ≠ Relevance

This is one of the most important concepts.

A vector database finds text that is **semantically similar** to the query.

But the most similar text isn't always the most useful text.

```mermaid
flowchart TD
    Q[User Query]

    Q --> V[Query Embedding]
    V --> DB[(Vector Database)]

    DB --> S1[Similar Chunk A]
    DB --> S2[Similar Chunk B]
    DB --> S3[Similar Chunk C]

    S1 --> E{Actually Relevant?}
    S2 --> E
    S3 --> E

    E -->|Sometimes No| PROBLEM[Wrong or Incomplete Context]
```

This becomes especially problematic for:

* Financial reports
* Legal documents
* Technical manuals
* Research papers
* Large enterprise documentation
* Documents with complex hierarchies

---

# 4. Vectorless RAG

Vectorless RAG takes a different approach.

Instead of converting everything into vectors and searching by distance, we first understand the **structure of the document**.

The document becomes a tree.

```mermaid
flowchart TD
    D[Document]

    D --> S1[Section 1]
    D --> S2[Section 2]
    D --> S3[Section 3]

    S1 --> T1[Topic 1.1]
    S1 --> T2[Topic 1.2]

    S2 --> T3[Topic 2.1]
    S2 --> T4[Topic 2.2]

    T1 --> P1[Page 1]
    T1 --> P2[Page 2]

    T3 --> P3[Page 20]
    T3 --> P4[Page 21]
```

Now the system knows:

> Document → Section → Topic → Page

rather than simply:

> Document → Chunk 1 → Chunk 2 → Chunk 3

---

# 5. PageIndex / Hierarchical Tree Indexing

The core idea behind **PageIndex-style retrieval** is to create a structured representation of a document.

### Traditional approach

```text
Document
   ↓
Fixed-size chunks
   ↓
Embeddings
   ↓
Vector DB
   ↓
Similarity Search
```

### Hierarchical approach

```text
Document
   ↓
Understand structure
   ↓
Build tree
   ↓
Navigate relevant branches
   ↓
Reach relevant page
   ↓
Load full context
```

![Image](https://images.openai.com/static-rsc-4/atR_fcrFtmbefkC4HejfRHPq75WsKa7X3njW0_NGwFhzufMbLy9YaGaQphXtHKF4Lg7J2YwqvBUyOLBo8uHQ-GGijzb5IyEpb38o5S1ruQm7CPji7ATZQeFVaDtMWmWTxwyUO-Dgvb6JO_emEZRP4ryFpSrhsHLleTxvPQfIhjcC8rcRAGpV5us_T6Y4RFTt?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/AUOsVbNZsdMAfSpc6opAMaulqV_0cyb9hE3d_IpOpuOCiVMvQCcbP3pr_aEbC7vMTzp5A8ay0asxV5ulj7PbdruDpgfQrK-p3iCSCr6oFum0iLbDf_h4MVnrhnux5XCKtycCWSFlotce7uaeDXZWHhc9MWqgc1vGXLwGTc9AGxoiWIf4XScXffcYcDCXSiSp?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/IBvhAowJ_nZqyjyiLVTtEWlG7Fo2K8yau9U0t0N3guI1FlCmqatakTJGfQcwQ3jI5upgljrp3GsI1bw-oudSNLQNSdfBKSFceTxmsde-cLGz-c4TR87A11iACUCIPGjKvbPANverc9SQlVkUfqe5-gbB987XgjNGpE71CIVRt54ALzQOuH5YTfBgmfeCMVgV?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/2c0VIdueMXdvV6_45owua0b-SDGfUL6Pk8HPoz6BRSned2FjA6FMQzNzqSqgAMzBJrxL5vulsWV-9GxastRXUu98pZmPP3_IsfJSq4_Ig1dmFK8hUZGePWh15QcEXsr8eTCwSMgN3YCzqF4_bn5HeQbvVgNgQ2E3NnitgZGNH2pqiFdZukFzZD2j6zYDY-KZ?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/nL2ZTihRu-pmjCs4Qz7b-yI69Ee7Gc3xMwFLsTnkNiPSRFtQHucAgMn7hrI_BGCUmnuOrkIwo_O1vTwQ7NRUO5ouEyDUUx0VlW8cQOCYiDaWfYEBNTFsUszexzQksXIuT7ahfx4Q6YBEJu5Ow1WVhsbqofydvDd-5Yzo5kOA1cV5jh-AVk_UpKQhl_Qqe_7f?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/Bm4apfkBrsSDy6HBEqTyEyIkwNPvQNX77Vv7M43kAOFHe8KJ-tNII8XQ6bT1ndzjWrF0wl0gFFJdohgBLPTyYa85c7csz1-aXNSVAUILWrJBJ8znWWUyjKfwuDZlYJv_JLGWI2FPVYC03GmqynYbjravaNuHu3OKxRq28irVThF5g-dmJm1pCo-lSnJ6SGdw?purpose=fullsize)

---

# 6. Tree Index Structure

A more complete tree might look like:

```mermaid
flowchart TD
    ROOT["📄 Annual Report"]

    ROOT --> A["1. Company Overview"]
    ROOT --> B["2. Financial Performance"]
    ROOT --> C["3. Risk Management"]
    ROOT --> D["4. Future Strategy"]

    B --> B1["2.1 Revenue"]
    B --> B2["2.2 Expenses"]
    B --> B3["2.3 Profit"]

    C --> C1["3.1 Market Risk"]
    C --> C2["3.2 Credit Risk"]
    C --> C3["3.3 Operational Risk"]

    B1 --> P1["📃 Pages 20-25"]
    B2 --> P2["📃 Pages 26-30"]
    B3 --> P3["📃 Pages 31-35"]

    C1 --> P4["📃 Pages 40-44"]
    C2 --> P5["📃 Pages 45-48"]
```

Each node can also contain metadata such as:

* Title
* Summary
* Page numbers
* Parent section
* Child sections
* Keywords
* Document location

---

# 7. Agentic Tree Search

Now comes the interesting part.

Instead of performing vector similarity search, an **LLM acts as a navigation agent**.

The LLM starts at the root and decides which branch is relevant.

```mermaid
flowchart TD
    Q[User Query]

    Q --> ROOT["📄 Document Root"]

    ROOT --> LLM1{"LLM: Which Section?"}

    LLM1 -->|Financial Question| FIN["💰 Financial Performance"]
    LLM1 -->|Risk Question| RISK["⚠️ Risk Management"]
    LLM1 -->|Strategy Question| STRAT["🎯 Future Strategy"]

    RISK --> LLM2{"LLM: Which Topic?"}

    LLM2 --> MARKET["Market Risk"]
    LLM2 --> CREDIT["Credit Risk"]
    LLM2 --> OPS["Operational Risk"]

    CREDIT --> LLM3{"LLM: Which Page?"}

    LLM3 --> PAGE["📃 Relevant Page"]

    PAGE --> CONTEXT["Load Full Context"]
    CONTEXT --> ANSWER["Generate Answer"]
```

This is **agentic retrieval**.

The LLM isn't simply selecting chunks.

It is **navigating the knowledge structure**.

---

# 8. Why Tree Search Can Preserve Context

Suppose the user asks:

> "Why did the company's profit decrease in 2025?"

A vector search might return a few isolated chunks mentioning:

```text
profit
revenue
2025
expenses
```

Tree search can instead navigate:

```text
Annual Report
   ↓
Financial Performance
   ↓
Profit
   ↓
2025 Results
   ↓
Relevant Pages
```

The system can then load the surrounding content instead of only one small chunk.

This helps preserve:

* Section context
* Chapter context
* Page relationships
* Headings
* Tables
* Explanations
* References

---

# 9. LLM Wiki / Knowledge Engine

The second major concept is the **LLM Wiki**.

The basic idea is:

> Instead of asking an LLM to search your entire knowledge base every time, first create an organized catalog of your knowledge.

Your knowledge might come from many sources:

```mermaid
flowchart LR
    G[Google Drive]
    PDF[PDF Files]
    WEB[Web Links]
    USB[USB / Local Files]
    MD[Markdown Notes]
    OBS[Obsidian]

    G --> ING[Knowledge Ingestion]
    PDF --> ING
    WEB --> ING
    USB --> ING
    MD --> ING
    OBS --> ING

    ING --> WIKI["🧠 Personal Knowledge Wiki"]
```

---

# 10. Two-Pass Retrieval

One of the important ideas is **Two-Pass Retrieval**.

Instead of loading every file completely:

### Pass 1 — Scan

Look at lightweight information:

* File name
* Title
* Summary
* Tags
* Metadata
* Headings

### Pass 2 — Load

Only open the files that appear relevant.

```mermaid
flowchart TD
    Q[User Query]

    Q --> P1["Pass 1: Scan Catalog"]

    P1 --> META["Titles + Summaries + Tags + Metadata"]

    META --> FILTER["Select Candidate Documents"]

    FILTER --> P2["Pass 2: Load Selected Files"]

    P2 --> CONTEXT["Full Relevant Content"]

    CONTEXT --> LLM["LLM"]

    LLM --> A[Answer]
```

This can significantly reduce unnecessary context loading.

---

# 11. Vector RAG vs Vectorless RAG

The two approaches solve the same broad problem differently.

| Feature         | Vector RAG              | Vectorless RAG            |
| --------------- | ----------------------- | ------------------------- |
| Retrieval       | Similarity search       | Tree/structure search     |
| Main index      | Vector DB               | Hierarchical tree         |
| Embeddings      | Required                | Not necessarily required  |
| Chunking        | Usually required        | Structure-aware           |
| Context         | Can be fragmented       | Better structural context |
| Retrieval logic | Similarity              | Relevance + navigation    |
| Best for        | General semantic search | Structured documents      |
| Explainability  | Moderate                | High                      |
| Citations       | Chunk-based             | Section/page-based        |

---

# 12. Hybrid RAG

In production systems, we don't always have to choose one.

We can combine both.

For example:

```mermaid
flowchart TD
    Q[User Query]

    Q --> EMB[Query Embedding]
    EMB --> VDB[(Vector DB)]

    VDB --> PRE["Retrieve Candidate Documents"]

    PRE --> TREE["Hierarchical Tree Search"]

    TREE --> LLM["LLM Relevance Evaluation"]

    LLM --> PAGE["Relevant Section / Page"]

    PAGE --> CONTEXT["Full Context"]

    CONTEXT --> GEN["Generate Answer"]

    GEN --> CITE["Answer + Citations"]
```

This gives us:

**Vector Search → Candidate Filtering → Tree Navigation → Precise Retrieval**

This can be useful when working with large enterprise knowledge bases.

---

# 13. Complete Day 06 Architecture

Putting everything together:

```mermaid
flowchart TD
    USER["👤 User"] --> QUERY["User Query"]

    QUERY --> ROUTER{"Retrieval Strategy"}

    ROUTER -->|General / Semantic Search| VRAG["Vector RAG"]
    ROUTER -->|Structured Documents| TREE["Vectorless Tree RAG"]
    ROUTER -->|Personal Knowledge| WIKI["LLM Wiki"]

    VRAG --> EMB["Query Embedding"]
    EMB --> VDB["Vector Database"]
    VDB --> CHUNKS["Top-K Chunks"]

    TREE --> ROOT["Document Tree"]
    ROOT --> SECTION["Relevant Section"]
    SECTION --> TOPIC["Relevant Topic"]
    TOPIC --> PAGE["Relevant Page"]

    WIKI --> CATALOG["Catalog / Metadata"]
    CATALOG --> FILE["Candidate Files"]
    FILE --> MD["Load Selected Content"]

    CHUNKS --> CONTEXT["Context"]
    PAGE --> CONTEXT
    MD --> CONTEXT

    CONTEXT --> LLM["🤖 LLM"]
    LLM --> ANSWER["📝 Answer"]
    ANSWER --> CITE["🔗 Traceable Citations"]
```

---

# 14. The Big Picture

The evolution can be understood like this:

```mermaid
flowchart LR
    A["Naive RAG"] --> B["Vector RAG"]
    B --> C["Advanced RAG"]
    C --> D["Vectorless / Tree RAG"]
    D --> E["Hybrid RAG"]
    E --> F["Agentic Knowledge Engine"]
```

### Naive RAG

```text
Chunk → Embed → Search → Generate
```

### Advanced Vector RAG

```text
Query
 ↓
Rewrite / Decompose
 ↓
Retrieve
 ↓
Rerank
 ↓
Generate
```

### Vectorless RAG

```text
Query
 ↓
Understand Document Structure
 ↓
Navigate Tree
 ↓
Select Section
 ↓
Select Page
 ↓
Load Context
 ↓
Generate
```

### Agentic Knowledge Engine

```text
Query
 ↓
Choose Retrieval Strategy
 ↓
Navigate / Search
 ↓
Evaluate Relevance
 ↓
Load Only Required Knowledge
 ↓
Generate Traceable Answer
```

---

## 🎯 Key Takeaways

Remember these **6 points** from Day 06:

1. **Vector similarity does not always mean true relevance.**
2. **Fixed-size chunking can destroy document structure and context.**
3. **Vectorless RAG uses hierarchical document structures instead of relying only on embeddings.**
4. **PageIndex-style retrieval lets an LLM navigate a document tree from high-level sections to specific pages.**
5. **LLM Wiki systems use catalogs and two-pass retrieval to avoid loading unnecessary knowledge.**
6. **Hybrid RAG can combine vector search with tree-based retrieval for large production systems.**

### One-line mental model

> **Vector RAG searches for similar text; Vectorless RAG navigates the structure of knowledge.**
