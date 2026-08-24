/**
 * Sub-Query Decomposition Module
 * Decomposes complex user queries into distinct sub-questions targeting specific domains.
 */
export class SubQueryDecomposer {
  static decompose(query) {
    return [
      `What is the primary definition and technical features of ${query.slice(0, 30)}?`,
      `What are the best practices, scalability aspects, and implementation guidelines for ${query.slice(0, 30)}?`
    ];
  }
}
