import type { RedFlagPattern } from "@/lib/types";
import { SectionCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SeverityPill } from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/utils";

export function RedFlagPatterns({ flags }: { flags: RedFlagPattern[] }) {
  const sorted = [...flags].sort((a, b) => {
    const sev = { high: 3, medium: 2, low: 1 } as const;
    return sev[b.severity] - sev[a.severity];
  });

  return (
    <SectionCard
      id="red-flags"
      eyebrow="H · Red-Flag Pattern Detector"
      title="Recurring behaviours worth watching"
      subtitle="Patterns across multiple commitments that suggest systemic risk."
      actions={<Badge tone="bad">{flags.length} patterns</Badge>}
    >
      <ul className="grid grid-cols-1 gap-3">
        {sorted.map((f) => (
          <li
            key={f.id}
            className="rounded-xl border border-ink-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-900">
                    {f.name}
                  </span>
                  <SeverityPill severity={f.severity} />
                </div>
                <p className="mt-1 text-sm text-ink-700">{f.description}</p>
                <div className="mt-2 text-[11px] text-ink-500">
                  First detected {formatDate(f.firstDetected)} · Evidence:{" "}
                  {f.evidencePromiseIds.join(", ") || "—"}
                </div>
              </div>
            </div>
          </li>
        ))}
        {sorted.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm text-ink-500">
            No red-flag patterns detected.
          </div>
        )}
      </ul>
    </SectionCard>
  );
}
