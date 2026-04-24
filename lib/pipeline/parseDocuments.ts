import type { SourceDocument } from "../types";

export interface ParsedDocument {
  source: SourceDocument;
  text: string;
  sections?: { heading: string; text: string; page?: number }[];
}

// Step 3: Parse documents into normalized text/sections. Stub returns empty text.
export async function parseDocuments(
  sources: SourceDocument[],
): Promise<ParsedDocument[]> {
  return sources.map((source) => ({
    source,
    text: "",
    sections: [],
  }));
}
