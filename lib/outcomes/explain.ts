// Try to extract management's stated *reason* for an outcome (esp. for misses /
// partial hits) and tag the dominant root cause. Heuristic: search the same
// source's text for sentences that mention BOTH the metric phrase AND a causal
// connector ("due to", "driven by", "on account of", "headwind", etc.). Tag
// based on a small keyword vocabulary used widely in Indian listed-co
// disclosures.

import type { PromiseStatus } from "../types";

const CAUSAL = /\b(?:due\s+to|because\s+of|driven\s+by|on\s+account\s+of|impact(?:ed)?\s+by|attributable\s+to|owing\s+to|led\s+by|headwinds?|tailwinds?|delayed?\s+by|deferred?\s+to)\b/i;

const ROOT_CAUSE_LEXICON: { tag: string; rx: RegExp }[] = [
  { tag: "supply-chain", rx: /\b(?:supply\s*chain|component\s*shortage|chip\s*shortage|raw[\s-]*material\s*shortage)\b/i },
  { tag: "logistics", rx: /\b(?:logistics?|freight|shipping|port\s*(?:clearance|congestion)|customs)\b/i },
  { tag: "working-capital", rx: /\bworking\s*capital\b/i },
  { tag: "inventory", rx: /\b(?:inventory|stock\s*build[-\s]*up|destock)\b/i },
  { tag: "demand-timing", rx: /\b(?:demand|weak\s*demand|softness|slow(?:er|down)|order\s*push[-\s]*out|pushout)\b/i },
  { tag: "customer-ramp", rx: /\b(?:customer\s*ramp|ramp[-\s]*up\s*delay|qualification\s*delay|customer\s*qualification)\b/i },
  { tag: "regulatory", rx: /\b(?:regulatory|approval\s*pending|clearance|licen[sc]e\s*delay|sebi|cci|nclt)\b/i },
  { tag: "fx", rx: /\b(?:fx|forex|currency\s*(?:headwind|tailwind|impact)|usd\/inr)\b/i },
  { tag: "raw-material", rx: /\b(?:raw\s*material|input\s*cost(?:s)?|commodity\s*price)\b/i },
  { tag: "labor", rx: /\b(?:labour|labor|manpower|attrition|wage\s*inflation)\b/i },
  { tag: "capex-delay", rx: /\b(?:capex\s*(?:delay|push[-\s]*out)|equipment\s*delay|installation\s*delay)\b/i },
  { tag: "seasonality", rx: /\b(?:seasonal(?:ity)?|festive|monsoon|q4\s*seasonality)\b/i },
  { tag: "execution", rx: /\b(?:execution\s*(?:slip|delay|miss)|operational\s*issue)\b/i },
  { tag: "geopolitics", rx: /\b(?:geopolitic|red\s*sea|russia|ukraine|sanction|war)\b/i },
];

export interface ExplanationResult {
  managementExplanation?: string;
  rootCauseTags: string[];
}

import { splitSentences } from "../extractors/sentences";

export function findExplanation(
  text: string,
  metricLabelRx: RegExp,
  status: PromiseStatus,
): ExplanationResult {
  // Only spend the work for outcomes that are misses / partial / in-progress
  // (where investors care WHY). For Met we still capture if a clean reason
  // exists but don't overinvest.
  if (!text) return { rootCauseTags: [] };
  const sentences = splitSentences(text);

  let best: string | undefined;
  for (const s of sentences) {
    if (!metricLabelRx.test(s)) continue;
    if (!CAUSAL.test(s)) continue;
    if (!best || s.length < best.length) best = s;
  }

  // Fallback: try just the causal phrase within ~120 chars of any metric
  // mention, even if not in same sentence.
  if (!best && (status === "Missed" || status === "Partially Met")) {
    for (const s of sentences) {
      if (CAUSAL.test(s) && hasNearbyMetric(sentences, sentences.indexOf(s), metricLabelRx)) {
        if (!best || s.length < best.length) best = s;
      }
    }
  }

  const tags: string[] = [];
  if (best) {
    for (const { tag, rx } of ROOT_CAUSE_LEXICON) {
      if (rx.test(best)) tags.push(tag);
    }
  }

  return {
    managementExplanation: best ? truncate(best, 220) : undefined,
    rootCauseTags: dedupe(tags),
  };
}

function hasNearbyMetric(sentences: string[], idx: number, rx: RegExp, window = 1): boolean {
  for (let i = Math.max(0, idx - window); i <= Math.min(sentences.length - 1, idx + window); i++) {
    if (i === idx) continue;
    if (rx.test(sentences[i])) return true;
  }
  return false;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s.trim();
  return s.slice(0, n - 1).trimEnd() + "…";
}

function dedupe(a: string[]): string[] {
  return Array.from(new Set(a));
}
