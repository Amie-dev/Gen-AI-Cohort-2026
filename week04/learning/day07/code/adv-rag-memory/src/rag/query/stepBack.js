/**
 * Step-Back Prompting Generator
 * Abstracts specific query into high-level conceptual background question.
 */
export class StepBackGenerator {
  static generateStepBack(query) {
    return `What are the core architectural concepts, design patterns, and principles behind ${query}?`;
  }
}
