import type { PromiseRecord } from "../types";
import type { ParsedDocument } from "./parseDocuments";
import { mockPromises } from "../mockData";

// Step 4: Extract promises and commitments from parsed sources.
// Real implementation would use an LLM + rule-based classifier.
export async function extractPromises(
  _parsed: ParsedDocument[],
): Promise<PromiseRecord[]> {
  return mockPromises;
}
