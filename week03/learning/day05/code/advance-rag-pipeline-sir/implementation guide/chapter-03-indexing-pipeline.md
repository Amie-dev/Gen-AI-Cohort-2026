# Chapter 03 — PDF Ingestion & Indexing Pipeline

## 1. Chapter Goal

The goal of this chapter is to build the core document ingestion pipeline in [`src/indexer.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/indexer.js).

When an uploaded PDF document arrives on disk, it cannot be fed directly to a vector database as a single monolithic file. Instead, it must be processed through a 4-step pipeline:

```text
Raw PDF File on Disk
        │
        ▼ 1. Extract Text
Raw Plain Text String
        │
        ▼ 2. Boundary-Aware Sliding Window Chunking
Array of Overlapping Chunks (~1000 chars, 200 overlap)
        │
        ▼ 3. Batched Vector Embedding (text-embedding-3-small)
Array of 1536-Dimensional Floating Point Vectors
        │
        ▼ 4. Format Payload Points & Upsert into Qdrant
Indexed Point Records with Unique UUIDs in Vector Collection
```

---

## 2. Full Pipeline Implementation (`src/indexer.js`)

Create [`src/indexer.js`](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/src/indexer.js):

```javascript
import fs from "node:fs/promises";
import crypto from "node:crypto";
// Import the lib entry directly to avoid pdf-parse's debug-mode file read on import.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { config } from "./config.js";
import { qdrant, ensureCollection } from "./qdrant.js";
import { embedTexts } from "./openai.js";

/** Read a PDF from disk and return its raw text. */
async function readPdfText(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Split text into overlapping chunks (~chunkSize chars, chunkOverlap overlap),
 * breaking on whitespace boundaries where possible.
 */
export function chunkText(text, chunkSize = config.chunking.chunkSize, overlap = config.chunking.chunkOverlap) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length);

    // Try to end on a space so we don't cut words in half.
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= clean.length) break;
    start = end - overlap; // step forward with overlap
    if (start < 0) start = 0;
  }

  return chunks;
}

/**
 * Full indexing pipeline for a single uploaded PDF:
 * read -> chunk -> embed -> upsert into Qdrant.
 */
export async function indexPdf({ filePath, originalName }) {
  const collection = await ensureCollection();

  const text = await readPdfText(filePath);
  const chunks = chunkText(text);

  if (chunks.length === 0) {
    return { chunks: 0, message: "No extractable text found in PDF" };
  }

  const vectors = await embedTexts(chunks);

  const points = chunks.map((chunk, i) => ({
    id: crypto.randomUUID(),
    vector: vectors[i],
    payload: {
      text: chunk,
      source: originalName,
      filePath,
      chunkIndex: i,
    },
  }));

  await qdrant.upsert(collection, { wait: true, points });

  return { chunks: chunks.length, collection };
}
```

---

## 3. Deep-Dive Code Walkthrough

### 1. `pdf-parse` Import Optimization

```javascript
import pdfParse from "pdf-parse/lib/pdf-parse.js";
```

#### Why import `lib/pdf-parse.js` directly?
The default index import of `pdf-parse` executes test file checks (`./test/data/05-versions-space.pdf`) in debug mode during initial module resolution. When running inside bundled ESM environments, this can trigger unexpected file read errors. Importing `pdf-parse/lib/pdf-parse.js` directly bypasses debug initialization scripts.

---

### 2. Boundary-Aware Sliding-Window Chunker Algorithm (`chunkText`)

Naive character slicing (e.g. `text.slice(0, 1000)`) frequently cuts words, numbers, or sentences directly in half (e.g. slicing "authentication" into "auth" and "entication"). This damages semantic vector similarity.

Our `chunkText` function solves this with a **whitespace-aware sliding window**:

```text
Text String: "The quick brown fox jumps over the lazy dog..."
             [========== Chunk 1 (size=1000) ==========]
                                               ^
                                      End at space boundary!
                                [=== Overlap (200) ===]
                                [========== Chunk 2 (size=1000) ==========]
```

#### Step-by-Step Chunker Logic:
1. **Whitespace Normalization**: `text.replace(/\s+/g, " ").trim()` collapses multiple spaces, newlines, and tabs into single spaces.
2. **Ideal Cut-Point Calculation**: `let end = Math.min(start + chunkSize, clean.length);` calculates the target end boundary.
3. **Word Boundary Detection**:
   ```javascript
   if (end < clean.length) {
     const lastSpace = clean.lastIndexOf(" ", end);
     if (lastSpace > start) end = lastSpace;
   }
   ```
   Searches backward from the target end index to locate the nearest space character, ensuring words are preserved.
4. **Sliding Overlap Step**: `start = end - overlap;` shifts the start boundary backward by 200 characters. This overlap guarantees that concepts bridging across chunk boundaries are captured together in at least one chunk.

---

### 3. Vector Payload Formatting & Qdrant Upsertion

```javascript
const points = chunks.map((chunk, i) => ({
  id: crypto.randomUUID(),
  vector: vectors[i],
  payload: {
    text: chunk,
    source: originalName,
    filePath,
    chunkIndex: i,
  },
}));

await qdrant.upsert(collection, { wait: true, points });
```

#### Understanding Qdrant Points & Payloads:
- **`id`**: A valid UUID v4 string representing the unique vector ID in Qdrant.
- **`vector`**: The 1536-dimensional float array generated by `embedTexts(chunks)`.
- **`payload`**: Metadata attached to the vector record inside Qdrant:
  - `text`: The raw plain text content of the chunk (used when synthesizing LLM answers).
  - `source`: Original PDF filename (e.g. `report.pdf`).
  - `filePath`: Server storage path.
  - `chunkIndex`: Sequential chunk order (0, 1, 2, ...).
- **`wait: true`**: Tells Qdrant to confirm write-ahead log persistence before resolving the promise, ensuring immediate queryability.

---

## 4. Summary & Next Steps

In this chapter, we implemented:
- PDF text extraction via `pdf-parse`.
- `chunkText()`: A sliding-window chunker with whitespace word-boundary detection.
- `indexPdf()`: The complete PDF-to-Vector pipeline that parses, chunks, embeds, formats, and upserts point records into Qdrant.

In [**Chapter 04 — Advanced Retrieval & Reciprocal Rank Fusion**](file:///home/aminul/development/gen-ai-cohort/week03/learning/day05/code/advance-rag-pipeline-sir/implementation%20guide/chapter-04-advanced-retrieval-rrf.md), we will build the advanced retrieval engine featuring Structured Query Rewriting, Step-Back Prompting, Sub-Query Decomposition, HyDE, and Reciprocal Rank Fusion (RRF).
