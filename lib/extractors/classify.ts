import type { PromiseType } from "../types";
import { TYPE_PATTERNS } from "./patterns";

export interface ClassifyResult {
  type: PromiseType;
  metric: string;
}

export function classifyPromise(sentence: string): ClassifyResult {
  for (const { type, metric, rx } of TYPE_PATTERNS) {
    if (rx.test(sentence)) return { type, metric };
  }
  return { type: "Other", metric: "Unspecified" };
}
