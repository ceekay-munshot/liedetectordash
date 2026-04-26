// Build the investor monitoring checklist (Section I) from live promises.
// We surface every promise whose outcome is still pending verification (status
// = Pending or In-progress) and which has a test date in the future or in
// the recent past (last 60 days, so it stays actionable).

import type { InvestorMonitorItem, PromiseRecord, Severity } from "../types";

const STALE_TOLERANCE_DAYS = 60;
const SEV_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

export function computeMonitorItems(
  promises: PromiseRecord[],
): InvestorMonitorItem[] {
  const now = Date.now();
  const cutoff = now - STALE_TOLERANCE_DAYS * 24 * 60 * 60 * 1000;

  const items: InvestorMonitorItem[] = [];
  for (const p of promises) {
    if (p.status !== "Pending" && p.status !== "In-progress") continue;
    if (!p.testDate) continue;
    const due = new Date(p.testDate).getTime();
    if (due < cutoff) continue;

    const priority: Severity =
      p.confidence === "High" ? "high" : p.confidence === "Medium" ? "medium" : "low";

    items.push({
      id: `mon-${p.id}`,
      label: shortLabel(p),
      rationale: `Commitment made on ${formatShort(p.date)} via ${p.sourceType}.${
        p.exactQuote ? ` "${truncate(p.exactQuote, 110)}"` : ""
      }`,
      metric: p.metric,
      targetDate: p.testDate,
      priority,
      relatedPromiseIds: [p.id],
    });
  }

  items.sort((a, b) => {
    const sd = SEV_RANK[b.priority] - SEV_RANK[a.priority];
    if (sd !== 0) return sd;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  return items.slice(0, 30);
}

function shortLabel(p: PromiseRecord): string {
  const horizonLabel = p.timeHorizon ? ` by ${p.timeHorizon}` : "";
  return `${p.metric}: ${p.target}${horizonLabel}`.trim();
}

function formatShort(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
