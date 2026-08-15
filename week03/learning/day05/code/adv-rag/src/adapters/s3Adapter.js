/**
 * AWS S3 Object Storage Adapter
 */
export async function searchS3(query) {
  return [
    {
      id: "s3_invoice_2026_08.pdf",
      title: "Subscription Invoice August 2026",
      text: "PDF Invoice Document: Invoice #INV-2026-0881. Total Paid: $29.99. Download URL: https://s3.amazonaws.com/billing/INV-2026-0881.pdf",
      source: "Amazon S3 Storage",
      score: 0.95,
      metadata: { tenantId: "default", accessLevel: 1 }
    }
  ];
}
