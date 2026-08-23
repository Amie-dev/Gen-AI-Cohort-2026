import { TreeNode } from "./TreeNode.js";

/**
 * Manages the Document Tree Index hierarchy (PageIndex Architecture).
 */
export class HierarchicalTreeIndex {
  /**
   * @param {TreeNode} rootNode 
   * @param {string} [documentTitle="Document Index"]
   */
  constructor(rootNode, documentTitle = "Document Index") {
    this.root = rootNode;
    this.documentTitle = documentTitle;
    /** @type {Map<string, TreeNode>} */
    this.nodesById = new Map();
    this._indexSubtree(rootNode);
  }

  /**
   * Recursively registers all nodes into fast Map lookup table.
   * @param {TreeNode} node 
   * @private
   */
  _indexSubtree(node) {
    this.nodesById.set(node.nodeId, node);
    for (const child of node.children) {
      this._indexSubtree(child);
    }
  }

  /**
   * Get node by unique ID.
   * @param {string} nodeId 
   * @returns {TreeNode|undefined}
   */
  getNode(nodeId) {
    return this.nodesById.get(nodeId);
  }

  /**
   * Get full lineage path from root down to specified node.
   * @param {string} nodeId 
   * @returns {TreeNode[]}
   */
  getLineagePath(nodeId) {
    const path = [];
    let curr = this.getNode(nodeId);

    while (curr) {
      path.unshift(curr);
      curr = curr.parentId ? this.getNode(curr.parentId) : null;
    }

    return path;
  }

  /**
   * Terminal visualizer for document tree hierarchy.
   * @param {TreeNode} [node=this.root] 
   * @param {number} [indent=0] 
   */
  printTree(node = this.root, indent = 0) {
    const prefix = indent > 0 ? "  ".repeat(indent) + "└── " : "";
    console.log(
      `${prefix}[${node.nodeId}] ${node.title} (Pages: ${node.pageRange.join("-")})`
    );
    for (const child of node.children) {
      this.printTree(child, indent + 1);
    }
  }

  /**
   * Exports full document tree to serializable JSON object.
   * @returns {Object}
   */
  exportToJSON() {
    const serializeNode = (node) => {
      const json = node.toMetadataJSON(true);
      json.children = node.children.map(serializeNode);
      return json;
    };
    return {
      documentTitle: this.documentTitle,
      tree: serializeNode(this.root)
    };
  }

  /**
   * Reconstructs HierarchicalTreeIndex from exported JSON structure.
   * @param {Object} json 
   * @returns {HierarchicalTreeIndex}
   */
  static importFromJSON(json) {
    const deserializeNode = (data) => {
      const node = new TreeNode({
        nodeId: data.nodeId,
        title: data.title,
        level: data.level,
        pageRange: data.pageRange,
        summary: data.summary,
        keywords: data.keywords,
        entities: data.entities,
        content: data.content,
        parentId: data.parentId
      });

      if (data.children && Array.isArray(data.children)) {
        for (const childData of data.children) {
          node.addChild(deserializeNode(childData));
        }
      }

      return node;
    };

    const rootNode = deserializeNode(json.tree);
    return new HierarchicalTreeIndex(rootNode, json.documentTitle);
  }
}
