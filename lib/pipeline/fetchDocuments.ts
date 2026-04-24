import type { CompanyProfile, SourceDocument } from "../types";
import { mockSources } from "../mockData";

// Step 2: Fetch public documents (annual reports, transcripts, exchange filings).
// Real implementation would hit exchange sites, SEBI, IR portals. Here returns mock.
export async function fetchDocuments(
  _company: CompanyProfile,
): Promise<SourceDocument[]> {
  return mockSources;
}
