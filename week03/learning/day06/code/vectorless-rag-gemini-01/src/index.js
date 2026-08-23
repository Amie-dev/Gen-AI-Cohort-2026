import { config } from "./config.js";
import { TreeNode } from "./tree/TreeNode.js";
import { HierarchicalTreeIndex } from "./tree/HierarchicalTreeIndex.js";
import { TreeBuilder } from "./tree/TreeBuilder.js";
import { SummaryPruner } from "./search/SummaryPruner.js";
import { AgenticTreeSearchEngine } from "./search/AgenticTreeSearchEngine.js";
import { WikiFileEntry, WikiVault } from "./wiki/WikiVault.js";
import { TwoPassRetriever } from "./wiki/TwoPassRetriever.js";
import { LLMLibrarian } from "./wiki/LLMLibrarian.js";
import { VectorVsVectorlessBenchmark } from "./comparison/VectorVsVectorlessBenchmark.js";

// Execute default CLI driver if invoked directly
if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  import("./cli.js");
}

export {
  config,
  TreeNode,
  HierarchicalTreeIndex,
  TreeBuilder,
  SummaryPruner,
  AgenticTreeSearchEngine,
  WikiFileEntry,
  WikiVault,
  TwoPassRetriever,
  LLMLibrarian,
  VectorVsVectorlessBenchmark
};
