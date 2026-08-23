# Day 06 — Vectorless RAG & Hierarchical Knowledge Engines

## 03. Agentic Tree Search & LLM Relevance-Based Retrieval

---

## 1. The Retrieval Philosophy: Search the Tree, Not the Chunks

In traditional Vector RAG, retrieval usually works like this:

```text
User Query
   ↓
Query Embedding
   ↓
Search ALL vector chunks
   ↓
Calculate similarity
   ↓
Return Top-K chunks
```

The system asks:

> **"Which chunks are mathematically closest to this query?"**

Vectorless RAG takes a different approach.

It asks:

> **"Which part of the document structure is most likely to contain the answer?"**

The LLM acts as a **navigation agent** that moves through the document tree step by step.

This idea is conceptually similar to tree-search strategies used in systems such as **AlphaGo**: rather than treating every possibility equally, the system progressively explores promising branches.

---

# 2. Vector Search vs Agentic Tree Search

```mermaid id="5f8v2m"
flowchart LR

    subgraph VECTOR["🔵 Vector RAG"]

        Q1["👤 User Query"]
        Q1 --> E["Query Embedding"]
        E --> DB[("Vector DB")]

        DB --> C1["Chunk 1"]
        DB --> C2["Chunk 2"]
        DB --> C3["Chunk 3"]
        DB --> C4["Chunk ..."]

        C1 --> R["Top-K Results"]
        C2 --> R
        C3 --> R
        C4 --> R
    end

    subgraph TREE["🟢 Vectorless RAG"]

        Q2["👤 User Query"]
        Q2 --> ROOT["🌳 Root"]

        ROOT --> B["Select Relevant Branch"]
        B --> S["Select Relevant Section"]
        S --> T["Select Relevant Topic"]
        T --> P["📄 Target Page"]

        P --> R2["Full Context"]
    end
```

### Mental model

**Vector RAG:**

> Search everywhere and rank by similarity.

**Vectorless RAG:**

> Navigate intelligently and progressively narrow the search.

---

# 3. Example Query

Consider this question:

> **"How do sticky sessions behave during ALB failure?"**

Suppose our document contains:

```text id="y3v6gr"
Distributed Systems Architecture Manual

├── Chapter 1: Networking
│
├── Chapter 2: Load Balancing
│   ├── Section 2.1: CDN Architecture
│   ├── Section 2.2: Session Persistence
│   │   ├── 2.2.1 Cookie-Based Sticky Sessions
│   │   └── 2.2.2 Session Failover & Recovery
│   └── Section 2.3: Traffic Routing
│
└── Chapter 3: Database Replication
```

The correct answer is probably somewhere inside:

```text id="1f9q1p"
Chapter 2
   ↓
Section 2.2
   ↓
Subsection 2.2.2
```

The agent should not need to inspect every page.

---

# 4. Step-by-Step Agentic Tree Traversal

## Step 1 — Evaluate the Root

The LLM first sees the top-level structure.

```mermaid id="3w0e5p"
flowchart TD

    Q["👤 Query:<br/>How do sticky sessions behave during ALB failure?"]

    Q --> ROOT["📘 Document Root"]

    ROOT --> EVAL{"🤖 LLM evaluates<br/>top-level summaries"}

    EVAL --> C1["Chapter 1<br/>Networking"]
    EVAL --> C2["Chapter 2<br/>Load Balancing"]
    EVAL --> C3["Chapter 3<br/>Database Replication"]

    C1 --> X1["❌ Not relevant"]
    C2 --> OK["✅ Relevant"]
    C3 --> X3["❌ Not relevant"]
```

The agent reasons:

```text id="b7r5a1"
Sticky sessions + ALB failure
        ↓
Load Balancing
        ↓
Chapter 2 is relevant
```

So it **prunes** Chapters 1 and 3.

---

# 5. Step 2 — Expand the Relevant Branch

The agent now looks inside Chapter 2.

```mermaid id="8r7w3z"
flowchart TD

    CH["📑 Chapter 2<br/>Load Balancing"]

    CH --> S1["Section 2.1<br/>CDN Architecture"]
    CH --> S2["Section 2.2<br/>Session Persistence"]
    CH --> S3["Section 2.3<br/>Traffic Routing"]

    S1 --> X1["❌ Discard"]
    S2 --> OK["✅ Select"]
    S3 --> X3["❌ Discard"]
```

The LLM sees summaries such as:

```text id="v4g5q7"
2.1 CDN Architecture
→ Static asset distribution and edge caching.

2.2 Session Persistence
→ Cookie-based sticky sessions and failover
   behavior during server failures.

2.3 Traffic Routing
→ General request routing and traffic policies.
```

Section 2.2 clearly matches the query.

---

# 6. Step 3 — Continue Down the Tree

The agent expands Section 2.2.

```mermaid id="w7y2p4"
flowchart TD

    SEC["📌 Section 2.2<br/>Session Persistence"]

    SEC --> A["2.2.1<br/>Cookie-Based Sticky Sessions"]
    SEC --> B["2.2.2<br/>Session Failover & Recovery"]

    A --> X["⚠️ Related"]
    B --> TARGET["🎯 Highly Relevant"]
```

The agent identifies:

```text id="h6q9x3"
2.2.2 Session Failover & Recovery
        ↓
Pages 181–200
```

Now we have reached the target area.

---

# 7. Step 4 — Lazy Load the Actual Content

This is where **lazy loading** becomes important.

The system did **not** load the entire 500-page document into the LLM.

Instead, it first used lightweight metadata:

```text id="2nj5rz"
Chapter summaries
Section summaries
Page ranges
Keywords
Node relationships
```

Only after finding the relevant branch does it load the actual pages.

```mermaid id="z3g8p1"
flowchart TD

    TREE["🌳 Tree Index"]

    TREE --> ROOT["Root"]
    ROOT --> CH["Chapter 2"]
    CH --> SEC["Section 2.2"]
    SEC --> SUB["Subsection 2.2.2"]

    SUB --> RANGE["Pages 181–200"]

    RANGE --> LOAD["📥 Lazy Load"]
    LOAD --> RAW["📄 Original Page Content"]

    RAW --> CONTEXT["📝 Full Context"]
    CONTEXT --> LLM["🤖 Answer Generation"]
```

### Traditional approach

```text
Search
 ↓
10 fragmented chunks
 ↓
LLM
```

### Tree approach

```text
Navigate
 ↓
Relevant section
 ↓
1–2 targeted pages
 ↓
Full surrounding context
 ↓
LLM
```

---

# 8. Complete Agentic Tree Search

Putting all steps together:

```mermaid id="5k0s6d"
flowchart TD

    Q["👤 User Query"]

    Q --> ROOT["🌳 Root Node"]

    ROOT --> E1{"🤖 Evaluate Chapters"}

    E1 --> X1["❌ Chapter 1"]
    E1 --> CH2["✅ Chapter 2: Load Balancing"]
    E1 --> X3["❌ Chapter 3"]

    CH2 --> E2{"🤖 Evaluate Sections"}

    E2 --> X21["❌ Section 2.1"]
    E2 --> SEC22["✅ Section 2.2"]
    E2 --> X23["❌ Section 2.3"]

    SEC22 --> E3{"🤖 Evaluate Subsections"}

    E3 --> X221["⚠️ 2.2.1"]
    E3 --> SUB222["🎯 2.2.2 Session Failover"]

    SUB222 --> PAGE["📄 Pages 181–200"]

    PAGE --> LOAD["Lazy Load Full Content"]

    LOAD --> ANSWER["🧠 Synthesize Answer"]
```

This is **agentic retrieval** because the LLM is actively making retrieval decisions.

---

# 9. Why This Is More Traceable

One major problem with Vector RAG is that the retrieval process can be difficult to explain.

You might get:

```text id="f8s4g2"
Chunk #472
Similarity: 0.814
```

But Vectorless RAG can provide an explicit path:

```text id="0b8j6w"
Document
  ↓
Chapter 2: Load Balancing
  ↓
Section 2.2: Session Persistence
  ↓
Subsection 2.2.2: Session Failover
  ↓
Pages 181–184
```

The retrieval decision becomes much easier to inspect.

---

# 10. Traceable Answer Generation

A Vectorless RAG system can produce an answer together with its navigation path.

### Example

```text id="h3w9z2"
Answer:

When an ALB node fails, session traffic is redirected
according to the documented failover mechanism.

Source:
Distributed Systems Architecture Manual v2

Navigation Path:
Root
 → Chapter 2: Load Balancing
 → Section 2.2: Session Persistence
 → Subsection 2.2.2: Session Failover & Recovery

Pages:
181–184

Node:
sub_2_2_2
```

The important part isn't simply the citation.

It's that the system can explain **how it reached that source**.

---

# 11. Why Hierarchical Context Helps

Consider a query:

> "How does it handle state persistence?"

The word **"it"** is ambiguous.

But if the previous conversation was:

> "How does the ALB maintain user sessions?"

Then the LLM can resolve:

```text id="c8r3m5"
"it"
 ↓
ALB
 ↓
Load Balancing
 ↓
Session Persistence
```

The tree gives the agent a natural place to continue searching.

```mermaid id="9m5x2q"
flowchart TD

    HISTORY["💬 Conversation History"]

    HISTORY --> REF["'it'"]

    REF --> RESOLVE["🤖 LLM Resolves Reference"]

    RESOLVE --> ALB["Application Load Balancer"]

    ALB --> TREE["🌳 Load Balancing Branch"]

    TREE --> SESSION["Session Persistence"]

    SESSION --> ANSWER["Relevant Content"]
```

---

# 12. Complex Query: Global Context

Vectorless RAG becomes especially interesting when the query isn't asking about one small piece of information.

### Query

> **"Summarize all high-availability strategies across the entire system."**

A simple vector search might return:

```text id="m0j4k7"
Chunk 12 → High availability
Chunk 89 → High availability
Chunk 203 → HA architecture
Chunk 401 → Availability
Chunk 512 → Failover
```

These are isolated pieces.

The system may miss the **global architecture**.

---

# 13. Tree-Based Global Search

A tree-based system can inspect high-level summaries first.

```mermaid id="2v5q8k"
flowchart TD

    Q["👤 Summarize all High-Availability Strategies"]

    Q --> ROOT["📘 Document Root"]

    ROOT --> C1["Chapter 1<br/>Networking"]
    ROOT --> C2["Chapter 2<br/>Load Balancing"]
    ROOT --> C3["Chapter 3<br/>Database Replication"]

    C1 --> A1["HA Strategy A"]
    C2 --> A2["HA Strategy B"]
    C3 --> A3["HA Strategy C"]

    A1 --> AGG["🧠 Aggregate Findings"]
    A2 --> AGG
    A3 --> AGG

    AGG --> FINAL["📋 Global Architecture Summary"]
```

The agent can inspect multiple branches and combine their findings.

---

# 14. Agentic Retrieval Is Not Just "Search"

The important difference is that retrieval becomes a **reasoning process**.

```text id="q6y2r8"
Query
 ↓
Understand intent
 ↓
Inspect root
 ↓
Select branch
 ↓
Inspect children
 ↓
Select section
 ↓
Inspect deeper nodes
 ↓
Find target
 ↓
Load content
 ↓
Reason over content
 ↓
Generate answer
```

So:

> **Retrieval itself becomes an intelligent navigation task.**

---

# 15. The Cost of Agentic Tree Search

There is an important tradeoff.

Vector search can retrieve results with a relatively small number of database operations.

Tree search may require multiple LLM decisions:

```text id="2x7p9k"
Root evaluation
      ↓
Chapter evaluation
      ↓
Section evaluation
      ↓
Subsection evaluation
      ↓
Content evaluation
```

That means:

### More reasoning

but potentially:

### Better retrieval quality and context

Therefore, Vectorless RAG needs **token and latency optimization**.

---

# 16. Optimization #1 — Summary-First Pruning

Don't send the entire content of every node to the LLM.

Instead, send a small summary.

```text id="r3k6m8"
❌ Expensive:

5,000-token section
       ↓
LLM evaluation

✅ Efficient:

50–100 token summary
       ↓
LLM evaluation
```

```mermaid id="5w0q8p"
flowchart TD

    ROOT["🌳 Tree"]

    ROOT --> S1["Section Summary<br/>~50 tokens"]
    ROOT --> S2["Section Summary<br/>~50 tokens"]
    ROOT --> S3["Section Summary<br/>~50 tokens"]
    ROOT --> S4["Section Summary<br/>~50 tokens"]

    S1 --> X1["❌ Prune"]
    S2 --> X2["❌ Prune"]
    S3 --> KEEP["✅ Keep"]
    S4 --> X4["❌ Prune"]

    KEEP --> RAW["Load Full Content"]
```

This means the LLM first asks:

> "Is this branch worth exploring?"

Only promising branches are expanded.

---

# 17. Optimization #2 — Parallel Subtree Evaluation

Sibling nodes can often be evaluated concurrently.

Instead of:

```text id="j6p4a8"
Section 1
   ↓
wait

Section 2
   ↓
wait

Section 3
   ↓
wait
```

we can evaluate them in parallel:

```text id="r8m1q4"
Section 1 ──┐
Section 2 ──┼──→ LLM Evaluation
Section 3 ──┘
```

### Architecture

```mermaid id="0g6t4z"
flowchart TD

    ROOT["🌳 Parent Node"]

    ROOT --> P["⚡ Parallel Evaluation"]

    P --> S1["Section 1"]
    P --> S2["Section 2"]
    P --> S3["Section 3"]
    P --> S4["Section 4"]

    S1 --> R["Combine Results"]
    S2 --> R
    S3 --> R
    S4 --> R

    R --> SELECT["🎯 Select Best Branch"]
```

In JavaScript/TypeScript, this can be implemented using concurrency patterns such as:

```text
Promise.all(...)
```

The goal is to reduce **wall-clock latency**.

---

# 18. Optimization #3 — Tree Structure Caching

The document tree usually doesn't need to be generated every time a user asks a question.

It can be created once during indexing.

```mermaid id="7s2j6v"
flowchart LR

    DOC["📄 Document"]

    DOC --> INDEX["Indexing"]
    INDEX --> TREE["🌳 Generate Tree"]

    TREE --> CACHE[("⚡ Cache / Fast Store")]

    CACHE --> Q1["Query 1"]
    CACHE --> Q2["Query 2"]
    CACHE --> Q3["Query 3"]
    CACHE --> Q4["Query 4"]
```

Possible storage options include:

* In-memory cache
* Redis
* SQLite
* PostgreSQL
* JSON files

The important idea:

> **Build the tree once, reuse it for many queries.**

---

# 19. Combined Optimization Strategy

The three techniques work together:

```mermaid id="8j4k2p"
flowchart TD

    Q["👤 User Query"]

    Q --> ROOT["🌳 Tree"]

    ROOT --> SUMMARY["1️⃣ Summary-First Pruning"]

    SUMMARY --> PARALLEL["2️⃣ Parallel Branch Evaluation"]

    PARALLEL --> SELECT["🎯 Select Relevant Branch"]

    SELECT --> CACHE["3️⃣ Cached Tree Structure"]

    CACHE --> NODE["Relevant Node"]

    NODE --> LOAD["Lazy Load Raw Content"]

    LOAD --> LLM["🤖 Final Reasoning"]
```

---

# 20. End-to-End Agentic Tree Search

Now we can combine everything:

```mermaid id="p9k3x1"
flowchart TD

    Q["👤 User Query"]

    Q --> HISTORY["💬 Conversation Context"]

    HISTORY --> ROOT["🌳 Root Tree"]

    ROOT --> SUM1["Read Node Summaries"]

    SUM1 --> PAR["⚡ Parallel Branch Evaluation"]

    PAR --> PRUNE["✂️ Prune Irrelevant Branches"]

    PRUNE --> NEXT["Relevant Branch"]

    NEXT --> SUM2["Read Child Summaries"]

    SUM2 --> PRUNE2["✂️ Further Pruning"]

    PRUNE2 --> LEAF["🎯 Target Leaf"]

    LEAF --> PAGE["📄 Page Range"]

    PAGE --> LOAD["📥 Lazy Load Full Content"]

    LOAD --> CONTEXT["📝 Full Structural Context"]

    CONTEXT --> LLM["🤖 LLM"]

    LLM --> ANSWER["💬 Answer"]

    ANSWER --> CITE["🔗 Explicit Source Path"]
```

---

# 21. Vector RAG vs Agentic Tree Search

| Aspect           | 🔵 Vector RAG     | 🟢 Agentic Tree Search         |
| ---------------- | ----------------- | ------------------------------ |
| Retrieval method | Similarity search | Hierarchical navigation        |
| Search space     | Flat chunks       | Document tree                  |
| Decision maker   | Similarity metric | LLM                            |
| Context          | Chunk-based       | Structure-aware                |
| Search path      | Often opaque      | Explicit                       |
| Citations        | Retrieved chunks  | Section/page lineage           |
| Complex queries  | Can struggle      | Better suited                  |
| Global queries   | Difficult         | Can traverse multiple branches |
| Cost             | Usually lower     | More LLM calls                 |
| Latency          | Usually lower     | Requires optimization          |
| Explainability   | Moderate          | High                           |

---

# 22. Important Trade-Off

Vectorless RAG is **not automatically better for every use case**.

The trade-off is:

```mermaid id="m4q8v2"
flowchart LR

    SPEED["⚡ Fast / Cheap Retrieval"]

    QUALITY["🎯 Structured / Explainable Retrieval"]

    SPEED --- TRADE["⚖️ Trade-off"] --- QUALITY
```

### Vector RAG can be preferable when:

* Documents are relatively simple
* Semantic search is enough
* Very low latency is important
* The knowledge base is highly unstructured

### Vectorless RAG can be preferable when:

* Documents are highly structured
* Exact sections matter
* Page-level traceability matters
* Context preservation is important
* Documents are long and complex
* Explainability is important

---

# 23. The Complete Mental Model

Think of the two systems like two people searching a book.

### 🔵 Vector RAG

```text id="j5p2q9"
Question
   ↓
Search every page for similar language
   ↓
Pick the closest passages
   ↓
Answer
```

### 🟢 Vectorless RAG

```text id="v8k3m6"
Question
   ↓
Open Table of Contents
   ↓
Choose Chapter
   ↓
Choose Section
   ↓
Choose Subsection
   ↓
Open Relevant Pages
   ↓
Read Full Context
   ↓
Answer
```

---

# 🎯 Key Takeaways

Remember these **8 points**:

1. **Agentic Tree Search turns retrieval into a navigation problem.**
2. **The LLM evaluates node summaries and chooses which branches to explore.**
3. **Irrelevant branches can be pruned before loading their raw content.**
4. **Lazy loading retrieves full text only after reaching a relevant node or page range.**
5. **Tree traversal provides an explicit and traceable retrieval path.**
6. **Hierarchical retrieval is particularly useful for long, structured documents and complex queries.**
7. **Summary-first pruning, parallel evaluation, and caching help control token usage and latency.**
8. **Vectorless RAG trades some retrieval simplicity and latency for better structural reasoning, context preservation, and explainability.**

> **Mental Model:**
> **Vector RAG asks, "Which text is similar?"**
> **Agentic Tree Search asks, "Which branch of the knowledge structure should I explore next?"**
