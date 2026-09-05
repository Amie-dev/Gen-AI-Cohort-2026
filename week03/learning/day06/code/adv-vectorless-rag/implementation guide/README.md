# Advanced Vectorless RAG Master Index — PageIndex & LLM Wiki Engine

Welcome to the **Advanced Vectorless RAG Guide**! This guide takes backend and AI engineers step-by-step through building an advanced **Vectorless RAG Engine (PageIndex Model)** and **LLM Wiki Architecture (Karpathy Model)** powered by **Google Gemini API** and native JavaScript reasoning fallbacks.

Traditional Vector RAG splits documents into arbitrary floating-point vector chunks, destroying document layout and section hierarchy. This framework preserves document structure using **Hierarchical Tree Indexes** and navigates them top-down using LLM reasoning, or organizes knowledge into an inspectable **LLM Wiki Vault** with two-pass retrieval.

---

## 📁 Project Folder Structure Map

All source code for this framework is located inside `week03/learning/day06/code/adv-vectorless-rag/`:

```text
adv-vectorless-rag/
├── package.json                   # NPM dependencies & scripts ("type": "module")
├── .env.example                   # Environment configuration template
├── CODE_EXPLANATION.md            # Deep architectural breakdown & code explanations
├── implementation.md              # Original implementation guide notes
├── implementation guide/          # Step-by-step implementation chapters & documentation
│   ├── README.md                  # Master index & system architecture (this file)
│   ├── chapter-00-overview-setup.md
│   ├── chapter-01-tree-node-index.md
│   ├── chapter-02-tree-builder.md
│   ├── chapter-03-gemini-tree-search.md
│   ├── chapter-04-llm-wiki-vault.md
│   ├── chapter-05-twopass-librarian.md
│   └── chapter-06-benchmark-cli.md
└── src/
    ├── config.js                  # Central configuration & zero-dep env loader
    ├── cli.js                     # Multi-mode CLI driver (tree, wiki, benchmark)
    ├── index.js                   # Application entry point & SDK exports
    ├── tree/
    │   ├── TreeNode.js            # Hierarchical tree node model with entity metadata
    │   ├── HierarchicalTreeIndex.js # Tree index data structure & traversals
    │   └── TreeBuilder.js         # Document tree parser with keyword extraction
    ├── search/
    │   ├── geminiClient.js        # Google Gemini API SDK helper & fallback engine
    │   ├── SummaryPruner.js       # Gemini LLM branch reasoning & summary pruner
    │   └── AgenticTreeSearchEngine.js # Top-down hierarchical tree search engine
    ├── wiki/
    │   ├── WikiVault.js           # LLM Wiki markdown page vault manager
    │   ├── TwoPassRetriever.js    # Two-pass retrieval engine (Headers -> Content)
    │   └── LLMLibrarian.js        # Agentic wiki librarian & Gemini synthesizer
    └── comparison/
        └── VectorVsVectorlessBenchmark.js # Benchmark engine comparing Vector vs Vectorless
```

---

## 🏗 Hierarchical Tree Index & Gemini Search Architecture

Vectorless RAG replaces flat vector embeddings with structured top-down tree navigation guided by Google Gemini API reasoning:

```mermaid
flowchart TD
    Root["📚 Document Root Index"]
    
    Root --> Ch1["📖 Chapter 1: System Overview"]
    Root --> Ch2["📖 Chapter 2: High Availability"]
    Root --> Ch3["📖 Chapter 3: Data Storage"]

    Ch2 --> Sec21["📑 Section 2.1: Load Balancing"]
    Ch2 --> Sec22["📑 Section 2.2: Sticky Sessions"]

    Sec22 --> Sub221["📄 2.2.1 Cookie Architecture"]
    Sec22 --> Sub222["📄 2.2.2 Failover Behavior"]
    Sec22 --> Sub223["📄 2.2.3 Recovery Rules"]

    Query["👤 User Query: 'How do sticky sessions handle failover?'"] --> Search["AgenticTreeSearchEngine"]
    
    Search --> Gemini["🤖 Google Gemini API (evaluateWithGemini)"]
    Gemini -->|Select Branch| Ch2
    Ch2 -->|Prune Unrelated Branches| Sec22
    Sec22 -->|Pinpoint Target Node| Sub222
    Sub222 --> TargetPages["Exact Relevant Pages / Context"]
```

---

## 🔄 Two-Pass LLM Wiki Retrieval Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant CLI as CLI Driver
    participant Librarian as LLMLibrarian
    participant TwoPass as TwoPassRetriever
    participant Vault as WikiVault
    participant Gemini as Google Gemini API

    User->>CLI: node src/cli.js --mode=wiki --query="..."
    CLI->>Librarian: answerQuery(query)
    Librarian->>TwoPass: retrieveRelevantContext(query)
    
    Note over TwoPass,Vault: Pass 1: Light Metadata Search
    TwoPass->>Vault: getPageHeaders()
    Vault-->>TwoPass: List of Wiki Page Titles, Tags & Summaries
    TwoPass->>Gemini: Select best wiki pages using Gemini reasoning
    Gemini-->>TwoPass: Target Page IDs
    
    Note over TwoPass,Vault: Pass 2: Deep Article Content Fetch
    TwoPass->>Vault: getPageContent(targetPageId)
    Vault-->>TwoPass: Full Markdown Article Content
    TwoPass-->>Librarian: Assembled Wiki Context
    
    Librarian->>Gemini: Synthesize Final Answer with Wiki Context
    Gemini-->>Librarian: Final Answer Text
    Librarian-->>User: Structured Answer + Wiki Citations
```

---

## 📚 Master Chapter Reference Table

| Chapter | Focus Area | Guide File | Key Topics Covered |
| :--- | :--- | :--- | :--- |
| **Ch 0** | **Overview & Setup** | [Chapter 00 Guide](chapter-00-overview-setup.md) | Node.js ESM setup, `package.json`, `.env.example`, `config.js`, Gemini API client (`geminiClient.js`). |
| **Ch 1** | **Tree Node & Index** | [Chapter 01 Guide](chapter-01-tree-node-index.md) | `TreeNode` model (`TreeNode.js`), keywords & entities, `HierarchicalTreeIndex` (`HierarchicalTreeIndex.js`), DFS/BFS traversals. |
| **Ch 2** | **Tree Builder** | [Chapter 02 Guide](chapter-02-tree-builder.md) | `TreeBuilder` implementation (`TreeBuilder.js`), section parsing, keyword extraction, summary post-processing. |
| **Ch 3** | **Gemini Tree Search**| [Chapter 03 Guide](chapter-03-gemini-tree-search.md) | `SummaryPruner` (`SummaryPruner.js`), Gemini branch evaluation (`evaluateWithGemini`), top-down `AgenticTreeSearchEngine`. |
| **Ch 4** | **LLM Wiki Vault** | [Chapter 04 Guide](chapter-04-llm-wiki-vault.md) | Karpathy LLM Wiki model principles, `WikiVault` class (`WikiVault.js`), Markdown page indexing, tags, and internal links. |
| **Ch 5** | **Two-Pass & Librarian**| [Chapter 05 Guide](chapter-05-twopass-librarian.md) | `TwoPassRetriever` (`TwoPassRetriever.js` - Pass 1 Headers -> Pass 2 Content), `LLMLibrarian` (`LLMLibrarian.js`) with Gemini. |
| **Ch 6** | **Benchmark & CLI** | [Chapter 06 Guide](chapter-06-benchmark-cli.md) | `VectorVsVectorlessBenchmark` (`VectorVsVectorlessBenchmark.js`), multi-mode CLI (`cli.js`), `index.js`, execution workflows. |

---

## ⚡ Quick Start Sequence

### 1. Install Dependencies
Navigate to the project root directory and install dependencies:

```bash
cd week03/learning/day06/code/adv-vectorless-rag
npm install
```

### 2. Configure Environment Variables (Optional)

```bash
cp .env.example .env
export GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Run Tree Search Demonstration

```bash
npm run tree-search
```

### 4. Run LLM Wiki Demonstration

```bash
npm run llm-wiki
```

### 5. Run Vector vs Vectorless Benchmark

```bash
npm run benchmark
```
