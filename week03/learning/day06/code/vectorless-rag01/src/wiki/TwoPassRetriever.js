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
