import type { Confidence } from "../types";

export function scoreConfidence(args: {
  hasNumericTarget: boolean;
  hasHorizon: boolean;
  hasHedge: boolean;
  hasFirmCommitment: boolean;
}): Confidence {
  let s = 0;
  if (args.hasNumericTarget) s += 2;
  if (args.hasHorizon) s += 2;
  if (args.hasFirmCommitment) s += 1;
  if (args.hasHedge) s -= 1;
  if (s >= 4) return "High";
  if (s >= 2) return "Medium";
  return "Low";
}

const HEDGE = /\b(?:may|might|could|hopefully|possibly|likely|tentatively|aspire|aspirational)\b/i;
const FIRM = /\b(?:will|on\s+track|committed|guidance|target|targets|targeting|by\s+(?:end\s+of\s+)?(?:q[1-4]|fy|march|june|september|december))\b/i;

export function detectHedge(sentence: string): boolean {
  return HEDGE.test(sentence);
}
export function detectFirm(sentence: string): boolean {
  return FIRM.test(sentence);
}
