/**
 * TreeNode represents an individual section or node within the document hierarchy.
 */
export class TreeNode {
  /**
   * @param {Object} params
   * @param {string} params.nodeId - Unique identifier (e.g. 'root', 'ch_1', 'sec_2_2')
   * @param {string} params.title - Human-readable title
   * @param {number} params.level - Hierarchy depth (0 = Root, 1 = Chapter, 2 = Section)
   * @param {number[]} params.pageRange - Page bounds [startPage, endPage]
   * @param {string} params.summary - Concise semantic abstract of section
   * @param {string[]} [params.keywords=[]] - Key domain terminology
   * @param {string[]} [params.entities=[]] - Key named entities
   * @param {string|null} [params.content=null] - Raw text content (lazy-loaded for leaf nodes)
   */
  constructor({
    nodeId,
    title,
    level,
    pageRange,
    summary,
    keywords = [],
    entities = [],
    content = null
  }) {
    this.nodeId = nodeId;
    this.title = title;
    this.level = level;
    this.pageRange = pageRange;
    this.summary = summary;
    this.keywords = keywords;
    this.entities = entities;

    this.children = [];
    this.parent = null;
    this.content = content;
  }

  /**
   * Binds parent reference and appends child to hierarchy.
   * @param {TreeNode} childNode 
   */
  addChild(childNode) {
    childNode.parent = this;
    this.children.push(childNode);
  }

  /**
   * Checks if node is a leaf node containing actual content.
   * @returns {boolean}
   */
  isLeaf() {
    return this.children.length === 0;
  }

  /**
   * Exports metadata JSON without bloating memory with raw text.
   * @param {boolean} [includeContent=false] 
   * @returns {Object}
   */
  toMetadataJSON(includeContent = false) {
    return {
      nodeId: this.nodeId,
      title: this.title,
      level: this.level,
      pageRange: this.pageRange,
      summary: this.summary,
      keywords: this.keywords,
      entities: this.entities,
      childrenCount: this.children.length,
      ...(includeContent && { content: this.content })
    };
  }
}
