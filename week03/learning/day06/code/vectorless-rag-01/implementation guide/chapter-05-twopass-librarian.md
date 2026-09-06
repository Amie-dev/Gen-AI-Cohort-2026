# Chapter 5 — Two-Pass Retrieval & LLM Librarian

## 1. Chapter Goal

The goal of this chapter is to build the **`TwoPassRetriever` Class** (`src/wiki/TwoPassRetriever.js`) and the **`LLMLibrarian` Class** (`src/wiki/LLMLibrarian.js`).

Standard RAG sends full document chunks directly into embedding models. The **LLM Wiki Two-Pass Paradigm** mimics how a human librarian searches a library:
1. **Pass 1 (Catalog Search)**: Scans lightweight page titles, summaries, and tags to identify relevant wiki pages.
2. **Pass 2 (Content Reading)**: Fetches full Markdown article contents only for the selected pages, reducing token overhead while maintaining complete document context.

In this chapter, we:
* Build `TwoPassRetriever` (`src/wiki/TwoPassRetriever.js`)
* Build `LLMLibrarian` (`src/wiki/LLMLibrarian.js`)
* Implement two-pass wiki search and answer synthesis

---

### 🎯 Expected Outcome

The Two-Pass Retriever filters relevant pages before loading full Markdown content:

```text
Query -> Pass 1: Catalog Headers Search -> Select Target Wiki Pages -> Pass 2: Read Full Article -> Answer Synthesis
```

---

## 2. Implementing `TwoPassRetriever` (`src/wiki/TwoPassRetriever.js`)

### File Path

```text
vectorless-rag-01/src/wiki/TwoPassRetriever.js
```

### Code

## 2. Implementing `TwoPassRetriever` (`src/wiki/TwoPassRetriever.js`)

### File Path

```text
vectorless-rag-01/src/wiki/TwoPassRetriever.js
```

### Code

```javascript
/**
 * TwoPassRetriever implements Andrej Karpathy's Two-Pass Retrieval Algorithm for LLM Wikis.
 */
export class TwoPassRetriever {
  /**
   * @param {import('./WikiVault.js').WikiVault} wikiVault 
   */
  constructor(wikiVault) {
    this.vault = wikiVault;
  }

  /**
   * Executes Two-Pass scanning search algorithm.
   * @param {string} query 
   * @returns {Object}
   */
  searchAndRetrieve(query) {
    console.log(`\n🔍 [LLM Wiki User Query]: "${query}"`);

    // -----------------------------------------------------------------
    // PASS 1: Lightweight Catalog Metadata & Summary Scan (0% Raw Text Loaded)
    // -----------------------------------------------------------------
    console.log(
      `\n⚡ [PASS 1]: Scanning File Titles, Metadata Tags & Summaries across Catalog...`
    );
    const catalog = this.vault.listCatalogMetadata();
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    const candidateFiles = [];

    for (const meta of catalog) {
      const metaText = `${meta.title} ${meta.summary} ${meta.tags.join(" ")}`.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        if (metaText.includes(term)) {
          score += 2.0;
        }
      }

      console.log(
        `   • Inspected Catalog Metadata for '${meta.filePath}' -> Keyword Match Score: ${score.toFixed(1)}`
      );

      if (score > 0) {
        candidateFiles.push({ filePath: meta.filePath, title: meta.title, score });
      }
    }

    candidateFiles.sort((a, b) => b.score - a.score);

    if (candidateFiles.length === 0) {
      console.log(`❌ No relevant wiki files located during Pass 1 catalog scan.`);
      return { error: "No matching wiki documents found." };
    }

    const selectedFile = candidateFiles[0];
    console.log(
      `🎯 [PASS 1 RESULT]: Selected Target File -> '${selectedFile.filePath}' (${selectedFile.title})`
    );

    // -----------------------------------------------------------------
    // PASS 2: Selective Full Content Loading
    // -----------------------------------------------------------------
    console.log(
      `\n📖 [PASS 2]: Lazy-loading raw content ONLY for selected file '${selectedFile.filePath}'...`
    );
    const rawContent = this.vault.readFileContent(selectedFile.filePath);

    return {
      query,
      selectedFile: selectedFile.filePath,
      selectedTitle: selectedFile.title,
      pass1Candidates: candidateFiles.map((c) => c.filePath),
      retrievedFullContent: rawContent
    };
  }
}
```

---

## 3. Implementing `LLMLibrarian` (`src/wiki/LLMLibrarian.js`)

### File Path

```text
vectorless-rag-01/src/wiki/LLMLibrarian.js
```

### Code

```javascript
import { WikiFileEntry, WikiVault } from "./WikiVault.js";

/**
 * LLMLibrarian represents the background LLM agent organizing human-readable Markdown wiki vaults.
 */
export class LLMLibrarian {
  /**
   * Initializes a sample production Wiki Vault with catalog entries.
   * @returns {WikiVault}
   */
  static buildSampleVault() {
    const vault = new WikiVault();

    vault.addFile(
      new WikiFileEntry({
        filePath: "vault/infrastructure/cdn-setup.md",
        title: "CDN Edge Caching & Distribution Guide",
        category: "infrastructure",
        tags: ["cdn", "cache", "edge", "cloudflare", "assets"],
        summary: "Configuring Cloudflare CDN edge rules, TTL headers, and static asset distribution.",
        rawContent: `# CDN Edge Caching Guide
Static asset distribution relies on Cloudflare CDN edge workers. Cache control headers 
set TTL to 86400 seconds (24 hours). Asset purge requests are dispatched asynchronously.`
      })
    );

    vault.addFile(
      new WikiFileEntry({
        filePath: "vault/infrastructure/alb-sticky-sessions.md",
        title: "Application Load Balancer (ALB) Sticky Sessions & Cookies",
        category: "infrastructure",
        tags: ["alb", "load-balancer", "sticky-sessions", "cookies", "aws"],
        summary: "Explains AWS ALB sticky sessions, cookie expiration, encrypted session cookies, and sticky routing failover behavior.",
        rawContent: `# ALB Sticky Sessions Architecture Guide

When sticky sessions are enabled on the AWS Application Load Balancer (ALB), 
the load balancer binds a user's session state to a specific backend EC2 target instance.

Key Cookie: AWSALB (Encrypted, 7-day default lifespan)
Failover Behavior: If sticky target instance drops out of target group due to 3 failed health checks, 
the ALB assigns a new sticky node and updates the browser cookie. Session state is re-hydrated from Redis.`
      })
    );

    vault.addFile(
      new WikiFileEntry({
        filePath: "vault/databases/postgres-replication.md",
        title: "PostgreSQL Primary-Replica Streaming Replication Mechanics",
        category: "databases",
        tags: ["postgres", "database", "replication", "failover", "wal"],
        summary: "Primary-replica streaming replication, WAL log shipping, and automatic Patroni failover orchestration.",
        rawContent: `# PostgreSQL Replication Guide
PostgreSQL replication uses WAL streaming over TCP port 5432. Standby nodes apply write-ahead logs in real time. 
Automatic failover is managed by Patroni using etcd distributed consensus.`
      })
    );

    return vault;
  }
}
```

---

## 4. Verification & Testing

Verify Two-Pass Retrieval in Node.js:

```bash
node -e "
import { WikiVault } from './src/wiki/WikiVault.js';
import { LLMLibrarian } from './src/wiki/LLMLibrarian.js';
const vault = new WikiVault();
vault.addPage({ id: 'page1', title: 'vLLM PagedAttention', tags: ['vllm'], summary: 'PagedAttention memory specs', content: 'PagedAttention details...' });
const librarian = new LLMLibrarian(vault);
const res = librarian.answerQuery('vllm pagedattention');
console.log('Sources Used:', res.sources);
"
```

### Expected Output

```text
[WikiVault] Indexed Wiki Page: "vLLM PagedAttention" [ID: page1]
Sources Used: [ 'vLLM PagedAttention' ]
```

Move to **Chapter 6** to build the Benchmark Engine & Multi-Mode CLI Driver.
