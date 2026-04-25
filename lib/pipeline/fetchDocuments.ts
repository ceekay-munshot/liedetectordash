import type {
  CompanyProfile,
  DiscoveryDebug,
  MissingSourceGap,
  SourceDocument,
} from "../types";

export interface FetchDocumentsResult {
  sources: SourceDocument[];
  gaps: MissingSourceGap[];
  debug: DiscoveryDebug;
}

// Stage 2: Discover the primary-source disclosure register for a company over
// the last N fiscal years. Calls the server-side BSE-backed discovery endpoint.
export async function fetchDocuments(
  company: CompanyProfile,
  scopeYears = 5,
): Promise<FetchDocumentsResult> {
  const res = await fetch("/api/discover-documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile: company, scopeYears }),
  });
  const data = (await res.json()) as FetchDocumentsResult;
  return data;
}
