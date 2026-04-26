// Parse a promise's `target` string into a structured target so we can compare
// it to a numeric "actual" value extracted from later filings.
//
// Promise targets in the wild are shaped roughly like:
//   "25-30%"       -> range
//   "> 5,000"      -> threshold (above)
//   "< 1.0x"       -> threshold (below)
//   "~85%"         -> approx (with default tolerance)
//   "INR 5000 Cr"  -> point value with unit
//   "Q1 FY25"      -> qualitative date target (handled separately)
//   "1+"           -> qualitative ("at least one")
//
// We're conservative: anything we can't parse returns null and the promise
// stays "In-progress" rather than getting a fake outcome.

export type TargetKind = "range" | "threshold-above" | "threshold-below" | "approx" | "point" | "qualitative";

export interface ParsedTarget {
  kind: TargetKind;
  // For range:
  lo?: number;
  hi?: number;
  // For threshold/approx/point:
  value?: number;
  // Common:
  unit?: string; // "%", "x", "INR Cr", "USD mn"
  raw: string;
}

const PCT_RANGE = /^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*%/;
const PCT_POINT = /^(\d+(?:\.\d+)?)\s*%/;
const PCT_APPROX = /^[~≈]\s*(\d+(?:\.\d+)?)\s*%/;
const PCT_THRESH_ABOVE = /^(?:>=?|≥|at\s+least)\s*(\d+(?:\.\d+)?)\s*%/i;
const PCT_THRESH_BELOW = /^(?:<=?|≤|under|below)\s*(\d+(?:\.\d+)?)\s*%/i;

const X_RANGE = /^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*x/i;
const X_POINT = /^(\d+(?:\.\d+)?)\s*x/i;
const X_THRESH_ABOVE = /^(?:>=?|≥)\s*(\d+(?:\.\d+)?)\s*x/i;
const X_THRESH_BELOW = /^(?:<=?|≤)\s*(\d+(?:\.\d+)?)\s*x/i;

const INR_RANGE =
  /^INR\s*([\d,]+(?:\.\d+)?)\s*[-–]\s*([\d,]+(?:\.\d+)?)\s*(crore|cr|lakh|lac|million|mn|billion|bn)?/i;
const INR_THRESH_ABOVE =
  /^(?:>=?|≥|over|above)\s*INR?\s*([\d,]+(?:\.\d+)?)\s*(crore|cr|lakh|lac|million|mn|billion|bn)?/i;
const INR_POINT =
  /^INR\s*([\d,]+(?:\.\d+)?)\s*(crore|cr|lakh|lac|million|mn|billion|bn)?/i;

// Bare numeric range "25-30" with no unit — some extractor outputs lose the %.
const PLAIN_RANGE = /^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*$/;

export function parseTarget(rawIn: string): ParsedTarget | null {
  if (!rawIn) return null;
  const raw = rawIn.trim();
  if (!raw || raw === "—") return null;

  // Threshold variants.
  let m = raw.match(PCT_THRESH_ABOVE);
  if (m) return { kind: "threshold-above", value: parseFloat(m[1]), unit: "%", raw };
  m = raw.match(PCT_THRESH_BELOW);
  if (m) return { kind: "threshold-below", value: parseFloat(m[1]), unit: "%", raw };
  m = raw.match(X_THRESH_ABOVE);
  if (m) return { kind: "threshold-above", value: parseFloat(m[1]), unit: "x", raw };
  m = raw.match(X_THRESH_BELOW);
  if (m) return { kind: "threshold-below", value: parseFloat(m[1]), unit: "x", raw };
  m = raw.match(INR_THRESH_ABOVE);
  if (m) {
    return {
      kind: "threshold-above",
      value: parseAmount(m[1], m[2]),
      unit: normalizeAmountUnit(m[2]),
      raw,
    };
  }

  // Approx.
  m = raw.match(PCT_APPROX);
  if (m) return { kind: "approx", value: parseFloat(m[1]), unit: "%", raw };

  // Ranges.
  m = raw.match(PCT_RANGE);
  if (m) return { kind: "range", lo: parseFloat(m[1]), hi: parseFloat(m[2]), unit: "%", raw };
  m = raw.match(X_RANGE);
  if (m) return { kind: "range", lo: parseFloat(m[1]), hi: parseFloat(m[2]), unit: "x", raw };
  m = raw.match(INR_RANGE);
  if (m) {
    return {
      kind: "range",
      lo: parseAmount(m[1], m[3]),
      hi: parseAmount(m[2], m[3]),
      unit: normalizeAmountUnit(m[3]),
      raw,
    };
  }

  // Points.
  m = raw.match(PCT_POINT);
  if (m) return { kind: "point", value: parseFloat(m[1]), unit: "%", raw };
  m = raw.match(X_POINT);
  if (m) return { kind: "point", value: parseFloat(m[1]), unit: "x", raw };
  m = raw.match(INR_POINT);
  if (m) {
    return {
      kind: "point",
      value: parseAmount(m[1], m[2]),
      unit: normalizeAmountUnit(m[2]),
      raw,
    };
  }
  m = raw.match(PLAIN_RANGE);
  if (m) return { kind: "range", lo: parseFloat(m[1]), hi: parseFloat(m[2]), raw };

  // "1+" / "Q1 FY25" / "Launch by..." → qualitative.
  return { kind: "qualitative", raw };
}

function parseAmount(numStr: string, denom?: string): number {
  const n = parseFloat(numStr.replace(/,/g, ""));
  if (!denom) return n;
  const d = denom.toLowerCase();
  if (d === "lakh" || d === "lac") return n * 0.01; // express in Cr
  if (d === "billion" || d === "bn") return n * 100; // 1 bn = 100 cr in INR sense; rough
  if (d === "million" || d === "mn") return n * 0.1; // 1 mn = 0.1 cr
  return n; // cr
}

function normalizeAmountUnit(denom?: string): string {
  if (!denom) return "INR";
  const d = denom.toLowerCase();
  if (d === "lakh" || d === "lac") return "INR Cr"; // converted above
  if (d === "billion" || d === "bn") return "INR Cr";
  if (d === "million" || d === "mn") return "INR Cr";
  return "INR Cr";
}
