/**
 * Vectorless RAG Tree Indexer & Agentic Search Engine (PageIndex Architecture Model)
 * Week 03 Day 06 - JavaScript / Node.js Implementation
 * 
 * Key Features:
 * 1. Structural Document Parsing (Root -> Chapter -> Section -> Page Range).
 * 2. Hierarchical Tree Index with Enriched Metadata (Summaries, Keywords, Entities).
 * 3. Agentic Tree Search Traversal without Vector Embeddings.
 */

export class TreeNode {
  /**
   * @param {string} nodeId - Unique identifier (e.g. 'sec_2_2')
   * @param {string} title - Section / Chapter title
   * @param {number} level - Depth level in document hierarchy (0 = Root, 1 = Chapter, etc.)
   * @param {number[]} pageRange - [startPage, endPage]
   * @param {string} summary - High-density semantic abstract
   * @param {string[]} keywords - Key topic tags
   * @param {string} [content=''] - Raw targeted section text (lazy-loaded)
   * @param {string|null} [parentId=null] - Parent node ID
   */
  constructor(nodeId, title, level, pageRange, summary, keywords, content = '', parentId = null) {
    this.nodeId = nodeId;
    this.title = title;
    this.level = level;
    this.pageRange = pageRange;
    this.summary = summary;
    this.keywords = keywords;
    this.content = content;
    this.parentId = parentId;
    /** @type {TreeNode[]} */
    this.children = [];
  }

  /**
   * Attach a child branch to current node.
   * @param {TreeNode} childNode 
   */
  addChild(childNode) {
    childNode.parentId = this.nodeId;
    this.children.push(childNode);
  }

  /**
   * Serialize lightweight node metadata for tree storage.
   */
  toMetadataJSON(includeContent = false) {
    const data = {
      nodeId: this.nodeId,
      title: this.title,
      level: this.level,
      pageRange: this.pageRange,
      summary: this.summary,
      keywords: this.keywords,
      parentId: this.parentId,
      childrenIds: this.children.map(c => c.nodeId)
    };
    if (includeContent) {
      data.content = this.content;
    }
    return data;
  }
}

export class HierarchicalTreeIndex {
  /**
   * @param {TreeNode} rootNode 
   */
  constructor(rootNode) {
    this.root = rootNode;
    /** @type {Map<string, TreeNode>} */
    this.nodesById = new Map();
    this._indexNodes(rootNode);
  }

  _indexNodes(node) {
    this.nodesById.set(node.nodeId, node);
    for (const child of node.children) {
      this._indexNodes(child);
    }
  }

  /**
   * Visualizes the Document Tree Structure in terminal.
   */
  printTree(node = this.root, indent = 0) {
    const prefix = indent > 0 ? "  ".repeat(indent) + "└── " : "";
    console.log(`${prefix}[${node.nodeId}] ${node.title} (Pages: ${node.pageRange.join('-')})`);
    for (const child of node.children) {
      this.printTree(child, indent + 1);
    }
  }
}

export class AgenticTreeSearchEngine {
  /**
   * @param {HierarchicalTreeIndex} tree 
   */
  constructor(tree) {
    this.tree = tree;
  }

  /**
   * Simulates an LLM agent evaluating candidate branch summaries against user intent.
   * @param {string} query 
   * @param {TreeNode[]} candidateNodes 
   * @returns {TreeNode}
   */
  _mockLlmRelevanceEvaluator(query, candidateNodes) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let bestNode = candidateNodes[0];
    let bestScore = -1;

    for (const node of candidateNodes) {
      let score = 0;
      const textToScan = `${node.title} ${node.summary} ${node.keywords.join(' ')}`.toLowerCase();
      
      for (const term of queryTerms) {
        if (term.length > 2 && textToScan.includes(term)) {
          score += 2;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestNode = node;
      }
    }

    return bestNode;
  }

  /**
   * Executes top-down agentic tree search.
   * @param {string} query 
   */
  search(query) {
    let currentNode = this.tree.root;
    const traversalPath = [currentNode.nodeId];

    console.log(`\n🔍 [Agentic Tree Search Query]: "${query}"`);
    console.log(`🚀 Starting Search Traversal at Root: [${currentNode.nodeId}] ${currentNode.title}`);

    while (currentNode.children.length > 0) {
      console.log(`\n📂 Evaluating ${currentNode.children.length} child branches under "${currentNode.title}":`);
      for (const child of currentNode.children) {
        console.log(`   • [${child.nodeId}] ${child.title} -> Summary: ${child.summary.substring(0, 80)}...`);
      }

      // LLM agent evaluates branches and selects best candidate
      const selectedChild = this._mockLlmRelevanceEvaluator(query, currentNode.children);
      console.log(`🎯 [LLM Agent Selected Branch]: [${selectedChild.nodeId}] ${selectedChild.title}`);

      currentNode = selectedChild;
      traversalPath.push(currentNode.nodeId);
    }

    console.log(`\n✅ [Target Leaf Node Located]: [${currentNode.nodeId}] ${currentNode.title}`);
    console.log(`📍 Explicit Lineage Path: ${traversalPath.join(' -> ')}`);
    console.log(`📖 Page Range: pp. ${currentNode.pageRange.join('-')}`);

    return {
      query,
      targetNodeId: currentNode.nodeId,
      title: currentNode.title,
      pageRange: currentNode.pageRange,
      traversalPath,
      retrievedContent: currentNode.content
    };
  }
}

// ============================================================================
// Demonstration Runnable Script
// ============================================================================
export function buildSampleDocumentTree() {
  const root = new TreeNode(
    "root",
    "Distributed Systems Architecture Manual v2.0",
    0,
    [1, 500],
    "Master reference manual covering global networking, load balancing, sticky sessions, database replication, and failover mechanics.",
    ["distributed systems", "load balancing", "networking", "replication"]
  );

  const ch1 = new TreeNode(
    "ch_1",
    "Chapter 1: Networking & Traffic Routing",
    1,
    [1, 120],
    "Covers TCP/IP stack, BGP routing, DNS resolution, and edge gateway proxies.",
    ["networking", "dns", "bgp", "proxy"]
  );

  const ch2 = new TreeNode(
    "ch_2",
    "Chapter 2: Load Balancing Architectures",
    1,
    [121, 250],
    "Detailed architecture of Content Delivery Networks (CDN) vs Application Load Balancers (ALBs), session persistence algorithms, and sticky sessions.",
    ["load balancing", "alb", "cdn", "sticky sessions", "session persistence"]
  );

  const sec2_1 = new TreeNode(
    "sec_2_1",
    "Section 2.1: CDN Static Asset Caching",
    2,
    [121, 160],
    "Explains edge caching, TTL headers, cache invalidation strategies, and static content delivery.",
    ["cdn", "caching", "ttl", "static assets"]
  );

  const sec2_2 = new TreeNode(
    "sec_2_2",
    "Section 2.2: Session Persistence & Sticky Sessions",
    2,
    [161, 250],
    "In-depth analysis of cookie-based sticky sessions on ALBs, failover handling when upstream app servers crash, and session state serialization.",
    ["sticky sessions", "alb", "session persistence", "failover", "cookies"],
    `FULL SECTION TEXT (pp. 161-250):
When an Application Load Balancer (ALB) handles sticky sessions, it injects an encrypted 
cookie (AWSALB) into HTTP response headers. Subsequent user requests containing this cookie 
are routed exclusively to the same backend application server instance.

FAILOVER MECHANISM:
If the primary backend server fails health checks (3 consecutive 502 timeouts), the ALB invalidates 
the sticky cookie mapping and executes a consistent hash ring re-route to an active backup server instance. 
Session state must be restored from a centralized Redis cluster to prevent session drop.`
  );

  ch2.addChild(sec2_1);
  ch2.addChild(sec2_2);
  root.addChild(ch1);
  root.addChild(ch2);

  return new HierarchicalTreeIndex(root);
}

// Run if executed directly
if (process.argv[1] && process.argv[1].endsWith('vectorless-rag-tree-indexer.js')) {
  console.log("=== 🌳 Vectorless RAG Tree Indexing & Agentic Search Demo (JS Node.js) ===");
  const tree = buildSampleDocumentTree();
  
  console.log("\n--- Document Tree Hierarchy ---");
  tree.printTree();

  const searchEngine = new AgenticTreeSearchEngine(tree);
  const query = "How do sticky sessions handle backend server failover on an ALB?";
  const result = searchEngine.search(query);

  console.log("\n--- Retrieved Full Text Context ---");
  console.log(result.retrievedContent);
}
