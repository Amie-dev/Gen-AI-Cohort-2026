import { callGemini } from "../search/geminiClient.js";

/**
 * TwoPassRetriever implements Andrej Karpathy's Two-Pass Retrieval Algorithm for LLM Wikis.
 * Supports Google Gemini API catalog scan with local keyword fallback.
 */
export class TwoPassRetriever {
  /**
   * @param {import('./WikiVault.js').WikiVault} wikiVault 
   */
  constructor(wikiVault) {
    this.vault = wikiVault;
  }

  /**
   * Evaluates catalog files using Google Gemini API.
   * @param {string} query 
   * @param {Object[]} catalog 
   * @returns {Promise<string|null>}
   */
  async evaluateCatalogWithGemini(query, catalog) {
    const catalogPrompt = catalog
      .map((c) => `File: ${c.filePath}\nTitle: ${c.title}\nCategory: ${c.category}\nTags: ${c.tags.join(", ")}\nSummary: ${c.summary}`)
      .join("\n\n---\n\n");

    const systemInstruction =
      'You are an AI Wiki Librarian. Given a user query and catalog file summaries, select the single best file path. ' +
      'Respond ONLY with JSON format: {"selectedFilePath": "<path>", "reasoning": "<short_explanation>"}';

    const prompt = `User Query: "${query}"\n\nWiki Catalog Files:\n${catalogPrompt}`;

    const rawResponse = await callGemini({ systemInstruction, prompt });
    if (rawResponse) {
      try {
        const cleaned = rawResponse.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.selectedFilePath) {
          console.log(`✨ [Gemini Librarian Selection]: '${parsed.selectedFilePath}' -> Reason: ${parsed.reasoning}`);
          return parsed.selectedFilePath;
        }
      } catch (err) {
        // Fallback to local scoring
      }
    }
    return null;
  }

  /**
   * Executes Two-Pass scanning search algorithm.
   * @param {string} query 
   * @returns {Promise<Object>}
   */
  async searchAndRetrieve(query) {
    console.log(`\n🔍 [LLM Wiki User Query]: "${query}"`);

    // -----------------------------------------------------------------
    // PASS 1: Lightweight Catalog Metadata & Summary Scan (0% Raw Text Loaded)
    // -----------------------------------------------------------------
    console.log(
      `\n⚡ [PASS 1]: Scanning File Titles, Metadata Tags & Summaries across Catalog...`
    );
    const catalog = this.vault.listCatalogMetadata();

    // Try Gemini API catalog evaluation first
    const geminiSelectedFile = await this.evaluateCatalogWithGemini(query, catalog);
    let selectedFilePath = geminiSelectedFile;

    if (!selectedFilePath) {
      // Local keyword matching fallback
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

      selectedFilePath = candidateFiles[0].filePath;
    }

    console.log(
      `🎯 [PASS 1 RESULT]: Selected Target File -> '${selectedFilePath}'`
    );

    // -----------------------------------------------------------------
    // PASS 2: Selective Full Content Loading
    // -----------------------------------------------------------------
    console.log(
      `\n📖 [PASS 2]: Lazy-loading raw content ONLY for selected file '${selectedFilePath}'...`
    );
    const rawContent = this.vault.readFileContent(selectedFilePath);

    return {
      query,
      selectedFile: selectedFilePath,
      retrievedFullContent: rawContent
    };
  }
}
