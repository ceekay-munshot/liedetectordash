import type { Confidence, PromiseRecord } from "../types";

const STOPWORDS = new Set([
  "the","a","an","and","or","of","to","in","on","at","for","with","by","is","are",
  "was","were","be","been","being","this","that","these","those","we","our","us",
  "company","management","it","its","as","from","about","over","under","than","then",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9% ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  A.forEach((t) => B.has(t) && inter++);
  const uni = A.size + B.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

const CONF_RANK: Record<Confidence, number> = { High: 3, Medium: 2, Low: 1 };

// Merge near-duplicate promises within the same source. Keeps the strongest
// version (numeric target > horizon > confidence).
export function dedupePromises(
  promises: PromiseRecord[],
  threshold = 0.78,
): PromiseRecord[] {
  const buckets = new Map<string, PromiseRecord[]>();
  for (const p of promises) {
    const key = `${p.sourceId}::${p.promiseType}::${p.metric}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(p);
  }

  const survivors: PromiseRecord[] = [];
  for (const group of Array.from(buckets.values())) {
    const kept: PromiseRecord[] = [];
    for (const p of group) {
      const pTokens = tokens(p.promiseText);
      const dup = kept.find((k) => jaccard(tokens(k.promiseText), pTokens) >= threshold);
      if (!dup) {
        kept.push(p);
        continue;
      }
      // Choose the better record.
      const better = pickBetter(dup, p);
      if (better === p) {
        const idx = kept.indexOf(dup);
        kept[idx] = p;
      }
    }
    survivors.push(...kept);
  }
  return survivors;
}

function pickBetter(a: PromiseRecord, b: PromiseRecord): PromiseRecord {
  const aHasTarget = !!a.target && a.target !== "—";
  const bHasTarget = !!b.target && b.target !== "—";
  if (aHasTarget !== bHasTarget) return aHasTarget ? a : b;
  const aHasHorizon = !!a.timeHorizon;
  const bHasHorizon = !!b.timeHorizon;
  if (aHasHorizon !== bHasHorizon) return aHasHorizon ? a : b;
  return CONF_RANK[a.confidence] >= CONF_RANK[b.confidence] ? a : b;
}
