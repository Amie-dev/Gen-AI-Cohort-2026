/**
 * WikiFileEntry encapsulates a Markdown knowledge vault file.
 */
export class WikiFileEntry {
  /**
   * @param {Object} params
   * @param {string} params.filePath 
   * @param {string} params.title 
   * @param {string} params.category 
   * @param {string[]} params.tags 
   * @param {string} params.summary 
   * @param {string} params.content 
   */
  constructor({ filePath, title, category, tags, summary, content }) {
    this.filePath = filePath;
    this.title = title;
    this.category = category;
    this.tags = tags;
    this.summary = summary;
    this.content = content;
  }

  /**
   * Returns lightweight metadata payload WITHOUT loading raw content.
   * @returns {Object}
   */
  toMetadata() {
    return {
      filePath: this.filePath,
      title: this.title,
      category: this.category,
      tags: this.tags,
      summary: this.summary
    };
  }
}

/**
 * WikiVault manages human-readable Markdown wiki documents catalog.
 */
export class WikiVault {
  constructor() {
    this.catalog = new Map();
  }

  /**
   * Registers a file entry into the vault.
   * @param {WikiFileEntry} entry 
   */
  addFileEntry(entry) {
    this.catalog.set(entry.filePath, entry);
  }

  /**
   * Returns metadata list across ALL catalog files (Pass 1).
   * Loads 0% raw markdown content into memory.
   * @returns {Object[]} Catalog metadata array
   */
  listCatalogMetadata() {
    const metadataList = [];
    for (const entry of this.catalog.values()) {
      metadataList.push(entry.toMetadata());
    }
    return metadataList;
  }

  /**
   * Lazy-loads full raw text for a specific target file (Pass 2).
   * @param {string} filePath 
   * @returns {string|null}
   */
  readFileContent(filePath) {
    const entry = this.catalog.get(filePath);
    return entry ? entry.content : null;
  }
}
