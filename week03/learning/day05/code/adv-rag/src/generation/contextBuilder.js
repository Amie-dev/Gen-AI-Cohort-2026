/**
 * Step 12: Context Construction
 * Formats top ranked documents into a clean prompt context block with source headers.
 */
export function buildContext(documents) {
  if (!documents || documents.length === 0) {
    return "(No relevant documents retrieved)";
  }

  return documents
    .map((doc, index) => {
      const sourceInfo = doc.source ? ` (Source: ${doc.source})` : "";
      const titleInfo = doc.title ? ` - ${doc.title}` : "";
      return `[SOURCE ${index + 1}]${titleInfo}${sourceInfo}\n${doc.text.trim()}`;
    })
    .join("\n\n");
}
