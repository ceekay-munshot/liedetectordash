import type { SourceDocument } from "../types";

// Stage 3: Document parsing happens server-side together with extraction in
// /api/extract-promises so we don't ship raw document text to the browser. This
// pipeline stage is therefore a fast pass-through used purely for visibility.
export interface ParseDocumentsResult {
  ready: number; // count of sources eligible for parsing
}

export async function parseDocuments(
  sources: SourceDocument[],
): Promise<ParseDocumentsResult> {
  const ready = sources.filter((s) => !!s.url).length;
  return { ready };
}
