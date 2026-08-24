# 🎯 Week 03 — Day 06 Interview Questions & Deep Dive Answers

**Topic:** Vectorless RAG, Hierarchical Tree Indexing, Agentic Search & LLM Wiki Engines

> **Target Audience:** Principal AI Architects, Knowledge Graph Engineers, and Advanced RAG Pipeline Engineers.

---

## 📑 Table of Contents

1. Category 1 — Vectorless RAG Paradigm & Chunking Failure Modes
2. Category 2 — Tree-Structured Indexing & Hierarchy Navigation
3. Category 3 — Agentic Tree Search & Beam Search
4. Category 4 — LLM Wiki Architecture & Knowledge Engines
5. Category 5 — Practical Node.js & Tree Search Implementations

---

# 1. Category 1 — Vectorless RAG Paradigm & Chunking Failure Modes

## Q1: What is Vectorless RAG and how does it fundamentally differ from traditional Vector RAG?

### 💡 Answer

**Vectorless RAG** is a retrieval architecture that does not depend primarily on dense vector embeddings. Instead, it preserves the document's **logical hierarchy** and uses that structure to navigate toward relevant information.

Traditional Vector RAG asks:

> "Which chunks are semantically closest to this query?"

Vectorless RAG asks:

> "Which section of the document's structure is most likely to contain the answer?"

### 📊 Comparison

| Dimension                | Vector RAG                 | Vectorless RAG             |
| ------------------------ | -------------------------- | -------------------------- |
| **Search mechanism**     | Vector similarity          | Structural/tree navigation |
| **Representation**       | Flat chunks + embeddings   | Hierarchical nodes         |
| **Document structure**   | Often partially lost       | Explicitly preserved       |
| **Global understanding** | Limited                    | Strong                     |
| **Embeddings required**  | Usually yes                | Not necessarily            |
| **Best for**             | Large unstructured corpora | Long, structured documents |

### Example

Imagine a 500-page company policy document:

```text
Company Policy
├── HR
│   ├── Leave Policy
│   └── Recruitment
├── Finance
│   ├── Expenses
│   └── Budget
└── Security
    ├── Authentication
    └── Encryption
```

For:

> "What encryption standard does the company use?"

A vector system searches embedded chunks.

A tree-based system can navigate:

```text
Root
 ↓
Security
 ↓
Encryption
 ↓
Leaf Content
```

### 🎯 Interview Point

Vectorless RAG is **not simply "RAG without embeddings."** The important idea is that **document structure becomes part of the retrieval mechanism**.

---

# Q2: Explain the "Abrupt Chunking Problem" in Vector RAG.

### 💡 Answer

Traditional RAG commonly divides documents into fixed-size chunks.

For example:

```text
Document
   ↓
500 tokens
   ↓
500 tokens
   ↓
500 tokens
   ↓
500 tokens
```

This is simple, but it can destroy important relationships.

### 1. Header-Content Disconnection

```text
Chunk 1:
## Authentication

Chunk 2:
The system uses OAuth 2.0...
```

A query for **"authentication"** may retrieve the heading without the explanation.

### 2. Table Severing

A table can be split:

```text
Chunk 1
----------------
| Product | Price
| A       | $100
----------------

Chunk 2
----------------
| Product | Price
| B       | $200
----------------
```

The retrieval system may receive incomplete information.

### 3. Loss of Global Context

A question such as:

> "What are the major themes of this 300-page report?"

requires information from across the document.

Retrieving a few local chunks may not provide enough global context.

### 🎯 Core Problem

```text
Original Document
       ↓
   Flat Chunking
       ↓
Structure Lost
       ↓
Retrieval Becomes Harder
```

Tree-based approaches attempt to preserve that lost structure.

---

# 2. Category 2 — Tree-Structured Indexing & Hierarchy Navigation

# Q3: How does Tree Indexing work in Vectorless RAG?

### 💡 Answer

Instead of treating a document as an unordered collection of chunks, we convert it into a **hierarchical tree**.

For example:

```text
                 Root Document
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
      Chapter 1               Chapter 2
    Architecture              Security
          │                       │
     ┌────┴────┐             ┌────┴────┐
     ▼         ▼             ▼         ▼
   Sec 1.1   Sec 1.2       Sec 2.1   Sec 2.2
     │         │             │         │
     ▼         ▼             ▼         ▼
   Content   Content       Content   Content
```

Each node can contain:

* `id`
* `title`
* `level`
* `summary`
* `content`
* `children`
* metadata

### Example Node

```javascript
{
  id: "section-2-2",
  title: "Encryption",
  level: 3,
  summary: "Describes encryption standards used by the company.",
  content: "The company uses AES-256...",
  children: []
}
```

### Why summaries matter

A parent node doesn't necessarily need to contain the entire content of all children.

Instead:

```text
Chapter
   ↓
Summary
   ↓
Section summaries
   ↓
Leaf content
```

The LLM can use these summaries to decide which branch to explore.

---

# Q4: Compare Top-Down Tree Traversal vs Bottom-Up Aggregation.

### 💡 Answer

These approaches solve different retrieval problems.

## 🔽 Top-Down Traversal

Best for **specific questions**.

Example:

> "What encryption algorithm is used?"

The system starts from the root:

```text
Root
 ↓
Security
 ↓
Encryption
 ↓
Leaf
```

The LLM progressively narrows the search space.

### Advantages

* Efficient for targeted questions
* Preserves document hierarchy
* Avoids searching every leaf
* Useful for large structured documents

---

## 🔼 Bottom-Up Aggregation

Best for **global questions**.

Example:

> "Summarize the entire report."

The system aggregates:

```text
Leaf summaries
      ↓
Section summary
      ↓
Chapter summary
      ↓
Document summary
```

### 🎯 Simple Rule

```text
Specific Question → Top-Down

Global Question → Bottom-Up
```

---

# 3. Category 3 — Agentic Tree Search & Beam Search

# Q5: What is Agentic Tree Search?

### 💡 Answer

**Agentic Tree Search** uses an LLM as a decision-making navigator.

Instead of blindly retrieving chunks, the LLM determines **which branch of the document tree should be explored next**.

### Flow

```text
User Query
    ↓
Root
    ↓
Inspect Children
    ↓
Choose Relevant Branch
    ↓
Inspect Subsections
    ↓
Choose Relevant Section
    ↓
Leaf Content
    ↓
Answer
```

### Example

User asks:

> "How is database memory managed?"

Agent:

```text
Root
 ↓
Architecture
 ↓
Storage
 ↓
Memory Management
 ↓
Leaf Content
```

The important difference is that **retrieval becomes a navigation problem**.

---

# Q6: How do Branch Pruning and Beam Search optimize Agentic Tree Search?

### 💡 Answer

Consider a document with:

```text
50 Chapters
500 Sections
5000 Leaf Nodes
```

Exploring every node would be extremely expensive.

## 🌳 Branch Pruning

The agent evaluates the top-level branches:

```text
50 Chapters
    ↓
Evaluate relevance
    ↓
Keep Top 5
    ↓
Discard 45
```

This dramatically reduces search cost.

---

## 🔦 Beam Search

Instead of keeping only one path, maintain several promising paths.

For example:

```text
             Root
               │
        ┌──────┼──────┐
        ▼      ▼      ▼
       A       B      C
       │       │      │
       ▼       ▼      ▼
      A1      B2      C1
```

With:

```text
Beam Width = 3
```

the system keeps three promising paths instead of committing to one.

### Why?

If the first choice is wrong:

```text
Single Path
Root → A → Wrong ❌
```

the search fails.

With beam search:

```text
Root
├── A → Wrong
├── B → Correct ✅
└── C → Possible
```

the system has alternatives.

---

# 4. Category 4 — LLM Wiki Architecture & Knowledge Engines

# Q7: What is an LLM Wiki Architecture?

### 💡 Answer

An **LLM Wiki** is a structured, human-readable knowledge system where information is stored as interconnected documents rather than only as vectors.

Example:

```text
my-knowledge-wiki/
│
├── index.md
│
├── entities/
│   ├── Vector_RAG.md
│   ├── Qdrant.md
│   └── vLLM.md
│
├── concepts/
│   ├── RAG.md
│   ├── Embeddings.md
│   └── Inference.md
│
└── systems/
    └── Production_RAG.md
```

A document could contain links such as:

```markdown
# Vector RAG

Vector RAG uses [[Embeddings]] to retrieve
information from a [[Qdrant]] vector database.

See also:
- [[Hybrid RAG]]
- [[Reranking]]
- [[Production RAG]]
```

### Key Benefits

**1. Human readable**

Developers can directly inspect Markdown files.

**2. Machine readable**

Agents can parse the same structure.

**3. Explicit relationships**

Links such as:

```text
RAG → Embeddings
RAG → Qdrant
RAG → Reranking
```

create a knowledge graph-like structure.

**4. Easy to version**

The wiki can live inside Git.

```text
Edit
 ↓
Git Commit
 ↓
Review
 ↓
Agent Knowledge Updated
```

### 🎯 Important Interview Point

The major idea is **explicit, navigable knowledge representation**, rather than relying entirely on opaque vector similarity.

---

# Q8: Compare Vector RAG vs Vectorless RAG vs Hybrid RAG.

### 💡 Answer

| Feature                       | Vector RAG             | Vectorless RAG       | Hybrid RAG         |
| ----------------------------- | ---------------------- | -------------------- | ------------------ |
| **Vector Search**             | ✅                      | ❌                    | ✅                  |
| **Tree Navigation**           | ❌                      | ✅                    | ✅                  |
| **BM25/Keyword Search**       | Optional               | Optional             | ✅                  |
| **Document Structure**        | Often flattened        | Preserved            | Preserved          |
| **Global Understanding**      | Medium/Low             | High                 | High               |
| **Implementation Complexity** | Low                    | Medium               | High               |
| **Best For**                  | Unstructured knowledge | Structured documents | Enterprise systems |

### Production Architecture

A sophisticated system may combine all three:

```text
                 User Query
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      Vector       BM25       Tree
      Search      Search     Search
          │          │          │
          └──────────┼──────────┘
                     ▼
                Fusion/Rerank
                     │
                     ▼
                    LLM
```

This gives the system multiple ways to find relevant information.

---

# 5. Category 5 — Practical Node.js & Tree Search Implementations

# Q9: Write a Node.js implementation of a Document Tree Builder parsing Markdown headings.

### 💡 Answer

```javascript
function buildDocumentTree(markdownText) {
  const lines = markdownText.split("\n");

  const root = {
    id: "root",
    title: "Root Document",
    level: 0,
    content: "",
    children: [],
  };

  const stack = [root];

  lines.forEach((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      const node = {
        id: `node_${index}`,
        title,
        level,
        content: "",
        children: [],
      };

      // Find the correct parent
      while (
        stack.length > 0 &&
        stack[stack.length - 1].level >= level
      ) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];

      parent.children.push(node);
      stack.push(node);
    } else {
      // Add normal text to the current section
      stack[stack.length - 1].content += line + "\n";
    }
  });

  return root;
}

// Example
const markdown = `
# Chapter 1: Introduction
This is the introduction.

## Section 1.1: Architecture
The system uses a microservice architecture.

## Section 1.2: Storage
The system uses PostgreSQL.

# Chapter 2: Security
Security information goes here.
`;

const tree = buildDocumentTree(markdown);

console.log(JSON.stringify(tree, null, 2));
```

### How it works

The important data structure is:

```javascript
const stack = [root];
```

When a heading appears:

```text
#       → Level 1
##      → Level 2
###     → Level 3
```

The algorithm compares heading levels and adjusts the stack.

For example:

```text
# Chapter 1
    ↓
## Architecture
    ↓
### Database
```

creates:

```text
Chapter 1
└── Architecture
    └── Database
```

---

# Q10: Write a Node.js implementation of an Agentic Tree Search Engine.

### 💡 Answer

```javascript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
});

async function agenticTreeSearch(treeNode, userQuery) {
  // Base case: leaf node
  if (!treeNode.children || treeNode.children.length === 0) {
    console.log(
      `[Tree Search] Reached Leaf: "${treeNode.title}"`
    );

    return treeNode.content;
  }

  // Present available branches to the LLM
  const choices = treeNode.children
    .map(
      (child, index) =>
        `${index + 1}. ${child.title}`
    )
    .join("\n");

  const prompt = `
User Question:
${userQuery}

Current Node:
${treeNode.title}

Available Sections:
${choices}

Which section is most likely to contain the answer?

Return ONLY the index number.
`;

  const response = await model.invoke(prompt);

  let selectedIndex =
    parseInt(response.content.trim(), 10) - 1;

  // Safety check
  if (
    Number.isNaN(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= treeNode.children.length
  ) {
    selectedIndex = 0;
  }

  const selectedChild =
    treeNode.children[selectedIndex];

  console.log(
    `[Tree Search] Navigating → "${selectedChild.title}"`
  );

  // Continue recursively
  return agenticTreeSearch(
    selectedChild,
    userQuery
  );
}
```

### Execution

```javascript
const answer = await agenticTreeSearch(
  documentTree,
  "How does the system handle encryption?"
);

console.log("Retrieved Content:", answer);
```

### Architecture

```text
                    User Query
                        │
                        ▼
                 ┌─────────────┐
                 │ Root Node   │
                 └──────┬──────┘
                        │
                 LLM chooses branch
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Chapter A     Chapter B     Chapter C
                         │
                  LLM chooses branch
                         │
                         ▼
                     Section B2
                         │
                         ▼
                    Leaf Content
                         │
                         ▼
                       LLM
                         │
                         ▼
                     Answer
```

---

# 🧠 Bonus Interview Questions

## Q11: Is Vectorless RAG always better than Vector RAG?

### 💡 Answer

**No.**

Vectorless RAG works particularly well when document structure is meaningful.

For example:

```text
Legal Documents
Technical Documentation
Books
Research Reports
Financial Reports
Company Policies
```

But if you have millions of independent documents such as:

```text
Emails
Chat messages
Short support tickets
Product reviews
```

vector search can be much more practical.

### Best Production Approach

Use the retrieval method that matches the data:

```text
Structured Documents
        ↓
Tree Retrieval

Unstructured Documents
        ↓
Vector Retrieval

Mixed Enterprise Data
        ↓
Hybrid Retrieval
```

---

# Q12: What are the major weaknesses of Agentic Tree Search?

### 💡 Answer

Agentic Tree Search introduces powerful capabilities, but it also has costs.

### 1. LLM Latency

Every navigation decision can require an LLM call.

```text
Root → LLM
Section → LLM
Subsection → LLM
```

This can increase latency.

### 2. Cost

More LLM calls mean higher inference costs.

### 3. Navigation Errors

The agent may choose the wrong branch:

```text
Query
 ↓
Wrong Branch ❌
 ↓
Wrong Content
```

### 4. Complex Implementation

You need to handle:

* retries
* invalid selections
* branch pruning
* search limits
* timeouts
* fallback strategies

---

# Q13: How would you build a production-grade Vectorless/Hybrid RAG system?

### 💡 Answer

A strong production architecture could look like this:

```text
                    User Query
                        │
                        ▼
                 Input Guardrails
                        │
                        ▼
                Query Transformation
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           Vector      BM25      Tree
           Search     Search    Search
              │         │         │
              └─────────┼─────────┘
                        ▼
                  Result Fusion
                        │
                        ▼
                     Reranker
                        │
                        ▼
                  Context Filter
                        │
                        ▼
                   CRAG Check
                  ┌─────┴─────┐
                  ▼           ▼
               Correct      Incorrect
                  │           │
                  │       Fallback
                  │           │
                  └─────┬─────┘
                        ▼
                       LLM
                        │
                        ▼
                Output Guardrails
                        │
                        ▼
                    Response
```

### Key principle

Don't think of RAG as:

```text
Embedding → Search → LLM
```

Modern production RAG is better understood as:

```text
Query Understanding
        ↓
Retrieval Strategy
        ↓
Multiple Retrieval Sources
        ↓
Fusion / Reranking
        ↓
Evaluation
        ↓
Generation
        ↓
Validation
```

---

# 🔥 Quick Interview Revision

| Question                       | One-Line Answer                                                                |
| ------------------------------ | ------------------------------------------------------------------------------ |
| **Vectorless RAG?**            | Retrieves through document structure rather than primarily through embeddings. |
| **Abrupt chunking?**           | Flat chunking can destroy headers, tables, and global context.                 |
| **Tree indexing?**             | Converts documents into hierarchical parent-child nodes.                       |
| **Top-down search?**           | Navigate Root → Section → Leaf for targeted questions.                         |
| **Bottom-up aggregation?**     | Leaf → Section → Chapter → Root for global synthesis.                          |
| **Agentic search?**            | LLM decides which tree branch to explore.                                      |
| **Branch pruning?**            | Removes irrelevant branches early to reduce computation.                       |
| **Beam search?**               | Keeps multiple promising search paths simultaneously.                          |
| **LLM Wiki?**                  | Human/machine-readable interconnected knowledge stored in structured files.    |
| **Hybrid RAG?**                | Combines vector, keyword, tree, and reranking techniques.                      |
| **Main Agentic RAG weakness?** | Higher latency, cost, and navigation-error risk.                               |
| **Production goal?**           | Retrieve the right information using the cheapest reliable strategy.           |
