// Find an "actual" numeric reading for a promise's metric inside the parsed
// text of a later-period source. We deliberately keep the matching narrow:
// require the metric phrase AND a numeric value with a compatible unit in the
// SAME sentence, to avoid pairing the wrong number with the wrong line item.
//
// Heuristic — not exhaustive — but designed to be correct when it does match.

import type { PromiseType } from "../types";
import { splitSentences } from "../extractors/sentences";

// Per-type label patterns. These are intentionally conservative so we don't
// pair (e.g.) "revenue" growth language with a "deferred revenue" line item.
const METRIC_LABEL_BY_TYPE: Record<PromiseType, RegExp[]> = {
  Margin: [
    /\bebitda\s*margin\b/i,
    /\bebit\s*margin\b/i,
    /\bgross\s*margin\b/i,
    /\bpat\s*margin\b/i,
    /\boperating\s*margin\b/i,
    /\bmargin\s+(?:expanded|stood|came in|was)\b/i,
  ],
  Revenue: [
    /\b(?:revenue|topline|net\s*sales|total\s*income)\b/i,
    /\b(?:revenue|topline)\s+(?:growth|grew|of)\b/i,
  ],
  "Order Book": [
    /\border\s*book\b/i,
    /\border\s*(?:inflow|intake)\b/i,
    /\b(?:order\s*pipeline|backlog)\b/i,
  ],
  Capex: [
    /\bcap[ie]x\b/i,
    /\bcapital\s*expenditure\b/i,
    /\binvested\b/i,
  ],
  Capacity: [
    /\butili[sz]ation\b/i,
    /\bcapacity\b/i,
    /\b(?:commission(?:ed|ing)|sop|start\s*of\s*production|ramp[\s-]*up)\b/i,
  ],
  Debt: [
    /\bnet\s*debt\b/i,
    /\bdebt\s*to\s*ebitda\b/i,
    /\bleverage\b/i,
    /\bdeleverag/i,
  ],
  "Product Launch": [
    /\b(?:launched|launch(?:ing)?|rollout|rolled\s*out|go-?live|commenced)\b/i,
  ],
  "M&A": [
    /\b(?:acquired|acquisition|merger|m&a|bolt[-\s]*on)\b/i,
  ],
  Guidance: [
    /\b(?:pat|profit\s+after\s+tax|net\s*profit|bottomline)\b/i,
    /\b(?:roce|return\s+on\s+capital|roe|return\s+on\s+equity)\b/i,
    /\b(?:working\s*capital|cash\s*conversion\s*cycle)\b/i,
  ],
  ESG: [/\b(?:emissions?|carbon|esg|scope\s*[123])\b/i],
  Other: [],
};

// Numeric value extractors anchored by unit. We capture both the numeric and
// the unit (canonicalized).
const VALUE_PATTERNS: { rx: RegExp; unit: string; toNumber: (m: RegExpExecArray) => number }[] = [
  // Range "12-14%" — pick midpoint as a single readout.
  {
    rx: /(\d{1,3}(?:\.\d+)?)\s*[-–]\s*(\d{1,3}(?:\.\d+)?)\s*%/g,
    unit: "%",
    toNumber: (m) => (parseFloat(m[1]) + parseFloat(m[2])) / 2,
  },
  { rx: /(\d{1,3}(?:\.\d+)?)\s*%/g, unit: "%", toNumber: (m) => parseFloat(m[1]) },
  {
    rx: /(?:rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d+)?)\s*(crore|cr|lakh|lac|million|mn|billion|bn)?/gi,
    unit: "INR Cr",
    toNumber: (m) => toCrore(parseFloat(m[1].replace(/,/g, "")), m[2]),
  },
  { rx: /(\d+(?:\.\d+)?)x\b/gi, unit: "x", toNumber: (m) => parseFloat(m[1]) },
];

function toCrore(n: number, denom?: string): number {
  const d = (denom || "cr").toLowerCase();
  if (d === "lakh" || d === "lac") return n * 0.01;
  if (d === "million" || d === "mn") return n * 0.1;
  if (d === "billion" || d === "bn") return n * 100;
  return n;
}

export interface ActualReading {
  numeric: number;
  unit: string;
  sentence: string;
  matchedLabel: string;
}

// Pull every (label-mentioned + numeric) pair out of a parsed text. We return
// the latest (closest to end of doc) value per unit since later mentions in
// results documents typically reflect the actual period number.
export function findActualForPromise(
  text: string,
  promiseType: PromiseType,
  preferredUnit?: string,
): ActualReading | null {
  if (!text || text.length < 120) return null;
  const labelPatterns = METRIC_LABEL_BY_TYPE[promiseType] ?? [];
  if (labelPatterns.length === 0) return null;

  const sentences = splitSentences(text);
  const candidates: ActualReading[] = [];

  for (const s of sentences) {
    const matchedLabel = labelPatterns.find((rx) => rx.test(s));
    if (!matchedLabel) continue;

    for (const vp of VALUE_PATTERNS) {
      vp.rx.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = vp.rx.exec(s))) {
        candidates.push({
          numeric: vp.toNumber(m),
          unit: vp.unit,
          sentence: s,
          matchedLabel: s.match(matchedLabel)?.[0] ?? "",
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Prefer the candidate whose unit matches the promise's preferred unit.
  if (preferredUnit) {
    const u = preferredUnit.toLowerCase();
    const hit = [...candidates].reverse().find((c) => c.unit.toLowerCase().includes(u) || u.includes(c.unit.toLowerCase()));
    if (hit) return hit;
  }
  // Otherwise pick the most recent occurrence (later in document).
  return candidates[candidates.length - 1];
}
