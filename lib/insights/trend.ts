// Compute a per-period credibility trend from a set of promises. We score each
// promise's quarter-of-issue independently so the chart shows how reliable
// management's commitments from each disclosure period turned out to be.

import type { CredibilityTrend, CredibilityTrendPoint, PromiseRecord } from "../types";
import { computeScorecard } from "../scorecard";

const FY_PERIOD_RX = /^(?:Q([1-4])\s+)?FY(\d{2,4})$/i;

function periodSortKey(period: string): number {
  const m = period.match(FY_PERIOD_RX);
  if (!m) return 0;
  const q = m[1] ? parseInt(m[1], 10) : 5; // full-year buckets sort after Q4
  let y = parseInt(m[2], 10);
  if (y < 100) y = 2000 + y;
  return y * 10 + q;
}

export function computeTrend(promises: PromiseRecord[]): CredibilityTrend {
  if (promises.length === 0) return { series: [] };

  const buckets = new Map<string, PromiseRecord[]>();
  for (const p of promises) {
    const key = p.quarter || "Unknown";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(p);
  }

  const series: CredibilityTrendPoint[] = [];
  for (const [period, group] of Array.from(buckets.entries())) {
    if (period === "Unknown") continue;
    const card = computeScorecard(group);
    const resolved = group.filter((p) =>
      ["Met", "Partially Met", "Missed", "Rescinded"].includes(p.status),
    );
    const missed = group.filter((p) => p.status === "Missed").length;
    const missRate = resolved.length ? Math.round((missed / resolved.length) * 100) : 0;
    series.push({
      period,
      score: card.overall,
      hitRate: card.hitRate,
      missRate,
    });
  }

  series.sort((a, b) => periodSortKey(a.period) - periodSortKey(b.period));
  return { series };
}
