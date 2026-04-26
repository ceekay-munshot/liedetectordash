// Heuristic red-flag detector. We surface a few patterns that investors look
// for when reading a multi-year promise track record:
//
//   1. Repeated slippage   — same metric promised in 2+ disclosures with
//                            successively later horizons (e.g. capex date
//                            keeps moving right).
//   2. Category miss       — a promise category (Margin, Debt, Capex, etc.)
//                            with low scorecard score AND ≥3 resolved promises.
//   3. Vague language      — many promises with non-numeric / range-only
//                            targets in the latest 2 disclosure periods.
//   4. Disclosure silence  — promises whose test date has passed but no
//                            actual outcome was found (transparency gap).

import type { PromiseRecord, RedFlagPattern, Severity } from "../types";
import { computeScorecard } from "../scorecard";

export function detectRedFlags(promises: PromiseRecord[]): RedFlagPattern[] {
  const out: RedFlagPattern[] = [];

  // 1. Repeated slippage by metric.
  const byMetric = groupBy(promises, (p) => `${p.promiseType}::${p.metric}`);
  for (const [, group] of Array.from(byMetric.entries())) {
    if (group.length < 2) continue;
    const sorted = [...group].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const slips = countSlippages(sorted);
    if (slips >= 2) {
      const sample = sorted[0];
      out.push({
        id: `rf-slip-${slugify(sample.metric)}`,
        name: `Repeated slippage on ${sample.metric}`,
        description: `Management has restated the ${sample.metric} timeline at least ${slips} times.`,
        severity: slips >= 3 ? "high" : "medium",
        firstDetected: sorted[1].date,
        evidencePromiseIds: sorted.map((p) => p.id).slice(0, 5),
      });
    }
  }

  // 2. Category miss — bucket by promiseType, look at score.
  const byType = groupBy(promises, (p) => p.promiseType);
  for (const [type, group] of Array.from(byType.entries())) {
    const resolved = group.filter((p) =>
      ["Met", "Partially Met", "Missed", "Rescinded"].includes(p.status),
    );
    if (resolved.length < 3) continue;
    const card = computeScorecard(group);
    if (card.overall < 50) {
      out.push({
        id: `rf-cat-${slugify(type)}`,
        name: `${type} category underperforming`,
        description: `${type} promises score ${card.overall}/100 across ${resolved.length} resolved commitments.`,
        severity: card.overall < 35 ? "high" : "medium",
        firstDetected: latestDate(group),
        evidencePromiseIds: group
          .filter((p) => p.status === "Missed" || p.status === "Partially Met")
          .map((p) => p.id)
          .slice(0, 5),
      });
    }
  }

  // 3. Vague language pattern — many qualitative / non-numeric targets in
  // the most recent disclosures.
  const recentVague = promises
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)
    .filter((p) => !/\d/.test(p.target));
  if (recentVague.length >= 3) {
    out.push({
      id: "rf-vague",
      name: "Vague guidance language",
      description: `${recentVague.length} of the most recent commitments lack a numeric target.`,
      severity: recentVague.length >= 6 ? "medium" : "low",
      firstDetected: latestDate(recentVague),
      evidencePromiseIds: recentVague.map((p) => p.id).slice(0, 5),
    });
  }

  // 4. Disclosure silence — test-date passed, no actual found.
  const now = Date.now();
  const silent = promises.filter((p) => {
    if (!p.testDate) return false;
    const due = new Date(p.testDate).getTime();
    return due < now && !p.actualOutcome && p.status === "In-progress";
  });
  if (silent.length >= 3) {
    out.push({
      id: "rf-silence",
      name: "Disclosure silence on past commitments",
      description: `${silent.length} commitments are past their test date with no public outcome surfaced.`,
      severity: silent.length >= 6 ? "high" : "medium",
      firstDetected: latestDate(silent),
      evidencePromiseIds: silent.map((p) => p.id).slice(0, 5),
    });
  }

  // De-dupe by id, keep the highest severity first.
  const SEV_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
  const seen = new Set<string>();
  const unique: RedFlagPattern[] = [];
  for (const f of out) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    unique.push(f);
  }
  unique.sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity]);
  return unique;
}

function countSlippages(ordered: PromiseRecord[]): number {
  let slips = 0;
  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1].testDate
      ? new Date(ordered[i - 1].testDate).getTime()
      : 0;
    const curr = ordered[i].testDate ? new Date(ordered[i].testDate).getTime() : 0;
    if (prev && curr && curr > prev) slips++;
  }
  return slips;
}

function groupBy<T>(arr: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of arr) {
    const k = key(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(x);
  }
  return m;
}

function latestDate(promises: PromiseRecord[]): string {
  let max = 0;
  let iso = new Date().toISOString();
  for (const p of promises) {
    const d = new Date(p.date).getTime();
    if (d > max) {
      max = d;
      iso = p.date;
    }
  }
  return iso;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
