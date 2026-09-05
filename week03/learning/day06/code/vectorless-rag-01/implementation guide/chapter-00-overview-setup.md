# Chapter 0 — Overview, Setup & Zero-Dependency Configuration

## 1. Chapter Goal

The goal of this chapter is to prepare the **Node.js (ESM)** environment and implement the zero-dependency configuration module inside `src/config.js`.

Unlike heavy frameworks requiring vector databases, native extensions, or third-party ORMs, the Vectorless RAG architecture operates using pure JavaScript object representations. To maintain lightweight performance, the configuration layer features a custom zero-dependency `.env` parser.

In this chapter, we:
* Configure `package.json` with native ES Modules (`"type": "module"`)
* Create the `.env.example` environment template
* Build the zero-dependency configuration module (`src/config.js`)

---

### 🎯 Expected Outcome

By the end of this chapter, `src/config.js` will export a clean configuration object:

```text
src/
└── config.js        # Zero-Dependency Environment Loader & Config Module
```

---

## 2. Package & Environment Setup

Navigate to the project root directory:

```bash
cd week03/learning/day06/code/vectorless-rag-01
```

### `package.json`

```json
{
  "name": "vectorless-rag01",
  "version": "1.0.0",
  "description": "Production JavaScript implementation of Vectorless RAG, Hierarchical Tree Indexing (PageIndex Model), and LLM Wiki Architecture (Karpathy Model)",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "cli": "node src/cli.js",
    "tree-search": "node src/cli.js --mode=tree",
    "llm-wiki": "node src/cli.js --mode=wiki",
    "benchmark": "node src/cli.js --mode=benchmark"
  },
  "keywords": [
    "vectorless-rag",
    "pageindex",
    "tree-search",
    "llm-wiki",
    "karpathy",
    "javascript",
    "nodejs"
  ],
  "dependencies": {
    "dotenv": "^16.4.5"
  },
  "author": "GenAI Cohort 2026",
  "license": "ISC"
}
```

### `.env.example`

```env
NODE_ENV=development
LOG_LEVEL=info
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
DEFAULT_MAX_TREE_DEPTH=3
SUMMARY_PRUNING_THRESHOLD=1.5
```

---

## 3. Implementation of `src/config.js`

### File Path

```text
vectorless-rag-01/src/config.js
```

### Code

```javascript
import fs from "fs";
import path from "path";

/**
 * Lightweight zero-dependency .env file parser.
 */
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...vals] = trimmed.split("=");
          process.env[key.trim()] = vals.join("=").trim();
        }
      }
    }
  } catch (err) {
    // Ignore error if .env doesn't exist
  }
}

loadEnv();

/**
 * Centralized Application Configuration Module
 */
export const config = {
  env: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  openaiApiKey: process.env.OPENAI_API_KEY || null,
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  maxTreeDepth: Number(process.env.DEFAULT_MAX_TREE_DEPTH) || 3,
  pruningThreshold: Number(process.env.SUMMARY_PRUNING_THRESHOLD) || 1.5
};
```

---

## 4. Line-by-Line Code Breakdown

* **`loadEnv()`**: Reads `.env` using Node's `fs.readFileSync`. Parses key-value pairs while ignoring comments (`#`) and empty lines, assigning values directly into `process.env`.
* **`config.maxTreeDepth`**: Sets default maximum tree search depth (default: `3` levels).
* **`config.pruningThreshold`**: Relevancy score threshold below which tree branches are pruned during top-down agentic search.

---

## 5. Verification & Setup Validation

To verify configuration loading:

```bash
node -e "import { config } from './src/config.js'; console.log('Max Tree Depth:', config.maxTreeDepth);"
```

### Expected Output

```text
Max Tree Depth: 3
```

Move to **Chapter 1** to implement the Hierarchical Tree Data Structure.
