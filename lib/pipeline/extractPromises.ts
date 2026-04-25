import type {
  ExtractionDebug,
  ParsedDocSummary,
  PromiseRecord,
  SourceDocument,
} from "../types";

export interface ExtractPromisesResult {
  promises: PromiseRecord[];
  parsedDocs: ParsedDocSummary[];
  debug: ExtractionDebug;
}

// Stage 4: Live promise extraction. Calls the server-side extractor which
// fetches + parses + extracts. The pipeline never touches raw document bytes.
export async function extractPromises(
  sources: SourceDocument[],
  maxDocs = 30,
): Promise<ExtractPromisesResult> {
  const res = await fetch("/api/extract-promises", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sources, maxDocs }),
  });
  if (!res.ok) {
    throw new Error(`Extractor responded ${res.status}`);
  }
  return (await res.json()) as ExtractPromisesResult;
}
