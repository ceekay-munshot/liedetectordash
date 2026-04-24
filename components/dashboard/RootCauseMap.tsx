import type { RootCauseCluster } from "@/lib/types";
import { SectionCard } from "@/components/ui/Card";
import { SeverityPill } from "@/components/ui/StatusPill";

export function RootCauseMap({ clusters }: { clusters: RootCauseCluster[] }) {
  const max = Math.max(1, ...clusters.map((c) => c.count));
  const sorted = [...clusters].sort((a, b) => b.count - a.count);

  return (
    <SectionCard
      id="root-cause"
      eyebrow="G · Root-Cause Map"
      title="Where are the misses coming from?"
      subtitle="Clustered themes behind partially-met and missed commitments."
    >
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sorted.map((c) => (
          <li
            key={c.tag}
            className="rounded-xl border border-ink-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-violet-50 px-2 py-0.5 font-mono text-xs text-violet-700">
                  #{c.tag}
                </span>
                <SeverityPill severity={c.severity} />
              </div>
              <span className="text-xs font-semibold text-ink-900">
                {c.count}
              </span>
            </div>
            {c.description && (
              <p className="mt-2 text-sm text-ink-700">{c.description}</p>
            )}
            <div className="mt-3 h-1.5 rounded-full bg-ink-100">
              <div
                className="h-1.5 rounded-full bg-violet-500"
                style={{ width: `${(c.count / max) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-ink-500">
              Examples: {c.examplePromiseIds.join(", ") || "—"}
            </div>
          </li>
        ))}
        {sorted.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm text-ink-500">
            No root-cause clusters detected yet.
          </div>
        )}
      </ul>
    </SectionCard>
  );
}
