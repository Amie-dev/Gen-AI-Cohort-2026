# Chapter 0 — Overview, Setup & Gemini SDK Integration

## 1. Chapter Goal

The goal of this chapter is to prepare the **Node.js (ESM)** environment, central configuration, and **Google Gemini API Client Helper** inside `src/search/geminiClient.js`.

The Advanced Vectorless RAG Engine leverages **Google Gemini API** (`@google/generative-ai`) for LLM-driven tree branch reasoning and two-pass wiki synthesis, while maintaining zero-crash local fallback mechanisms when API keys are unconfigured.

In this chapter, we:
* Configure `package.json` with native ES Modules (`"type": "module"`)
* Create `.env.example`
* Build the zero-dependency configuration module (`src/config.js`)
* Build the Google Gemini API helper (`src/search/geminiClient.js`)

---

### 🎯 Expected Outcome

`src/search/geminiClient.js` provides a unified execution wrapper for calling Google Gemini models with fallback error safety:

```text
src/
├── config.js
└── search/
    └── geminiClient.js    # callGemini({ systemInstruction, prompt })
```

---

## 2. Package & Environment Setup

Navigate to the project root directory:

```bash
cd week03/learning/day06/code/adv-vectorless-rag
```

### `package.json`

```json
{
  "name": "adv-vectorless-rag",
  "version": "1.0.0",
  "description": "Advanced Vectorless RAG Engine (PageIndex Model & Karpathy LLM Wiki Architecture) in JavaScript",
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
    "llm-wiki",
    "agentic-search",
    "karpathy-architecture",
    "mcts",
    "gemini-api"
  ],
  "dependencies": {
    "@google/generative-ai": "^0.21.0"
  }
}
```

### `.env.example`

```env
NODE_ENV=development
LOG_LEVEL=info
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
DEFAULT_MAX_TREE_DEPTH=3
SUMMARY_PRUNING_THRESHOLD=1.5
```

---

## 3. Central Configuration (`src/config.js`)

```javascript
import fs from "fs";
import path from "path";

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

export const config = {
  env: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  maxTreeDepth: Number(process.env.DEFAULT_MAX_TREE_DEPTH) || 3,
  pruningThreshold: Number(process.env.SUMMARY_PRUNING_THRESHOLD) || 1.5
};
```

---

## 4. Google Gemini API Helper (`src/search/geminiClient.js`)

### File Path

```text
adv-vectorless-rag/src/search/geminiClient.js
```

### Code

```javascript
import { config } from "../config.js";

let genAI = null;

// Dynamically initialize Google Gemini API SDK if installed and key set
if (config.geminiApiKey && config.geminiApiKey !== "your_gemini_api_key_here") {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    console.log(`[Gemini Client] Initialized GoogleGenerativeAI SDK with model: ${config.geminiModel}`);
  } catch (err) {
    console.warn(`[Gemini Client Warning] Could not load @google/generative-ai (${err.message}). Using local reasoning fallbacks.`);
  }
}

export async function callGemini({ systemInstruction, prompt }) {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: config.geminiModel,
        systemInstruction
      });

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.warn(`[Gemini Client Warning] Gemini API call failed (${err.message}). Using local fallback evaluation.`);
    }
  }
  return null;
}
```

---

## 5. Verification & Setup Validation

Verify configuration loading and Gemini client initialization:

```bash
node -e "import { config } from './src/config.js'; console.log('Gemini Model:', config.geminiModel);"
```

### Expected Output

```text
Gemini Model: gemini-1.5-flash
```

Move to **Chapter 1** to implement the Enhanced Hierarchical Tree Data Structure.
