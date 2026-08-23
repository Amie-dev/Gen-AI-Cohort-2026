/**
 * Step 12 — Context Construction
 * Section 19: Formats top-K retrieved documents into clear prompt context with source citations.
 */
export function buildContext(documents) {
  if (!documents || documents.length === 0) {
    return 'No relevant document context found.';
  }

  return documents
    .map((doc, index) => {
      return `SOURCE ${index + 1} [${doc.source || 'KnowledgeBase'}]
Title: ${doc.title}
Content:
${doc.text}`;
    })
    .join('\n\n---\n\n');
}
