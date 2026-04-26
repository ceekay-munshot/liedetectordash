// Cluster root-cause tags surfaced during outcome testing into a flat list of
// (tag, count, severity, examples). We keep severity heuristic: high if at
// least one supporting promise is a confirmed Miss, medium if Partially Met,
// else low.

import type { PromiseRecord, RootCauseCluster, Severity } from "../types";

const TAG_DESCRIPTION: Record<string, string> = {
  "supply-chain": "Component / raw-material availability constraints.",
  logistics: "Freight, port and customs friction.",
  "working-capital": "Cash cycle stretched by inventory or receivables.",
  inventory: "Inventory build-up holding back delivery or cash.",
  "demand-timing": "End-market demand softness or order push-outs.",
  "customer-ramp": "Slower than guided ramp at key customers.",
  regulatory: "Pending approvals / regulatory delay.",
  fx: "Currency-driven impact on financial outcomes.",
  "raw-material": "Input-cost / commodity volatility.",
  labor: "Manpower availability or wage inflation.",
  "capex-delay": "Equipment / installation delays affecting timelines.",
  seasonality: "Period-specific seasonal effect.",
  execution: "Internal execution miss / operational issue.",
  geopolitics: "Geopolitical disruption (Red Sea, sanctions, etc).",
};

function severityFromPromises(group: PromiseRecord[]): Severity {
  if (group.some((p) => p.status === "Missed")) return "high";
  if (group.some((p) => p.status === "Partially Met")) return "medium";
  return "low";
}

export function computeRootCauseClusters(
  promises: PromiseRecord[],
): RootCauseCluster[] {
  const tagToPromises = new Map<string, PromiseRecord[]>();
  for (const p of promises) {
    for (const t of p.rootCauseTags ?? []) {
      if (!tagToPromises.has(t)) tagToPromises.set(t, []);
      tagToPromises.get(t)!.push(p);
    }
  }

  const out: RootCauseCluster[] = [];
  for (const [tag, group] of Array.from(tagToPromises.entries())) {
    out.push({
      tag,
      count: group.length,
      severity: severityFromPromises(group),
      examplePromiseIds: group.slice(0, 5).map((p) => p.id),
      description: TAG_DESCRIPTION[tag],
    });
  }

  // Most prevalent first; stable secondary sort by severity rank.
  const SEV_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
  out.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return SEV_RANK[b.severity] - SEV_RANK[a.severity];
  });
  return out;
}
