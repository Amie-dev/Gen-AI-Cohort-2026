import { TreeNode } from "./TreeNode.js";

/**
 * HierarchicalTreeIndex manages the complete document tree index.
 */
export class HierarchicalTreeIndex {
  /**
   * @param {string} documentTitle 
   * @param {TreeNode} rootNode 
   */
  constructor(documentTitle, rootNode) {
    this.documentTitle = documentTitle;
    this.root = rootNode;
    this.indexMap = new Map();
    this._indexSubtree(this.root);
  }

  /**
   * Recursively populates lookup map for O(1) node access.
   * @param {TreeNode} node 
   * @private
   */
  _indexSubtree(node) {
    this.indexMap.set(node.nodeId, node);
    for (const child of node.children) {
      this._indexSubtree(child);
    }
  }

  /**
   * Retrieves a node by ID.
   * @param {string} nodeId 
   * @returns {TreeNode|undefined}
   */
  getNode(nodeId) {
    return this.indexMap.get(nodeId);
  }

  /**
   * Traces root-to-node path by walking parent pointers upwards.
   * @param {string} nodeId 
   * @returns {string[]} Lineage path array
   */
  getLineagePath(nodeId) {
    const path = [];
    let current = this.getNode(nodeId);
    while (current) {
      path.unshift(current.nodeId);
      current = current.parent;
    }
    return path;
  }

  /**
   * Renders visual ASCII tree structure in terminal.
   * @param {TreeNode} [node=this.root] 
   * @param {string} [indent=""] 
   */
  printTree(node = this.root, indent = "") {
    console.log(
      `${indent}${node.level === 0 ? "└── " : "├── "}[${node.nodeId}] ${node.title} (Pages: ${node.pageRange.join("-")})`
    );
    for (const child of node.children) {
      this.printTree(child, indent + "  ");
    }
  }

  /**
   * Serializes tree index to JSON format.
   * @returns {string}
   */
  exportToJSON() {
    return JSON.stringify(this.root.toMetadataJSON(true), null, 2);
  }
}
