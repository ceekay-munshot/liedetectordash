import type {
  CredibilityScorecard,
  PromiseRecord,
  PromiseType,
  ScoreBreakdown,
} from "./types";

// A lightweight, transparent scorecard. All weights live in one place so they
// can be tuned later against real data. Scores are 0-100.

const STATUS_WEIGHT: Record<PromiseRecord["status"], number> = {
  Met: 100,
  "Partially Met": 55,
  "In-progress": 60, // neutral-ish while pending verification
  Pending: 50,
  Missed: 0,
  Rescinded: 20,
};

const CONFIDENCE_WEIGHT: Record<PromiseRecord["confidence"], number> = {
  High: 1.0,
  Medium: 0.75,
  Low: 0.5,
};

function clamp(value: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function weightedMean(values: number[], weights: number[]): number {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = values.reduce((acc, v, i) => acc + v * weights[i], 0);
  return weightedSum / totalWeight;
}

export function computeScorecard(
  promises: PromiseRecord[],
  asOf: string = new Date().toISOString(),
): CredibilityScorecard {
  const resolved = promises.filter(
    (p) => p.status === "Met" || p.status === "Partially Met" || p.status === "Missed" || p.status === "Rescinded",
  );

  const statusValues = resolved.map((p) => STATUS_WEIGHT[p.status]);
  const confidenceWeights = resolved.map((p) => CONFIDENCE_WEIGHT[p.confidence]);
  const overall = clamp(weightedMean(statusValues, confidenceWeights));

  const hits = resolved.filter((p) => p.status === "Met").length;
  const hitRate = resolved.length ? (hits / resolved.length) * 100 : 0;

  // On-time: variancePct in [-5, +5] counts as on-time for Met/Partially Met.
  const onTime = resolved.filter((p) => {
    if (p.status === "Missed" || p.status === "Rescinded") return false;
    if (p.variancePct === undefined) return p.status === "Met";
    return Math.abs(p.variancePct) <= 5;
  }).length;
  const onTimeRate = resolved.length ? (onTime / resolved.length) * 100 : 0;

  // Precision: specific numeric targets score high; ranges score mid; qualitative low.
  const precisionScore = clamp(
    mean(
      promises.map((p) => {
        const t = p.target.trim();
        if (/^[<>]?=?\s*\d/.test(t)) return 90;
        if (/\d+\s*-\s*\d+/.test(t)) return 70;
        if (/\d/.test(t)) return 60;
        return 35;
      }),
    ),
  );

  // Recovery: quality of explanations on misses/partials.
  const misses = promises.filter(
    (p) => p.status === "Missed" || p.status === "Partially Met",
  );
  const recoveryScore = clamp(
    mean(
      misses.map((p) =>
        p.managementExplanation && p.managementExplanation.length > 20 ? 75 : 30,
      ),
    ),
  );

  // Transparency: disclosure of misses with explanations and root causes.
  const transparencyScore = clamp(
    mean(
      misses.map((p) => {
        const hasExplanation = !!p.managementExplanation;
        const hasRootCause = (p.rootCauseTags ?? []).length > 0;
        if (hasExplanation && hasRootCause) return 85;
        if (hasExplanation || hasRootCause) return 55;
        return 25;
      }),
    ),
  );

  const typeSet = Array.from(new Set(promises.map((p) => p.promiseType))) as PromiseType[];
  const breakdownByType: ScoreBreakdown[] = typeSet.map((type) => {
    const subset = promises.filter((p) => p.promiseType === type);
    const resolvedSubset = subset.filter((p) =>
      ["Met", "Partially Met", "Missed", "Rescinded"].includes(p.status),
    );
    const met = subset.filter((p) => p.status === "Met").length;
    const missed = subset.filter((p) => p.status === "Missed").length;
    const score = clamp(
      weightedMean(
        resolvedSubset.map((p) => STATUS_WEIGHT[p.status]),
        resolvedSubset.map((p) => CONFIDENCE_WEIGHT[p.confidence]),
      ),
    );
    return { type, score, count: subset.length, met, missed };
  });

  return {
    overall: Math.round(overall),
    hitRate: Math.round(hitRate),
    onTimeRate: Math.round(onTimeRate),
    precisionScore: Math.round(precisionScore),
    recoveryScore: Math.round(recoveryScore),
    transparencyScore: Math.round(transparencyScore),
    sampleSize: promises.length,
    asOf,
    breakdownByType,
  };
}
