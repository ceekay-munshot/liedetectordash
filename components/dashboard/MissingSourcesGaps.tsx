import type { MissingSourceGap } from "@/lib/types";
import { SectionCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SeverityPill } from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/utils";

export function MissingSourcesGaps({ gaps }: { gaps: MissingSourceGap[] }) {
  return (
    <SectionCard
      id="missing-sources"
      eyebrow="C · Missing Sources & Gaps"
      title="Disclosure gaps"
      subtitle="Expected sources not yet located or confirmed absent."
      actions={<Badge tone="warn">{gaps.length} open</Badge>}
    >
      {gaps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm text-ink-500">
          No disclosure gaps detected in the current scope.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {gaps.map((g) => (
            <li
              key={g.id}
              className="rounded-xl border border-ink-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{g.category}</Badge>
                    <span className="text-xs text-ink-500">{g.period}</span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-ink-900">
                    {g.expected}
                  </div>
                  {g.reason && (
                    <p className="mt-1 text-xs text-ink-500">{g.reason}</p>
                  )}
                </div>
                <SeverityPill severity={g.severity} />
              </div>
              <div className="mt-3 text-[11px] text-ink-500">
                Discovered {formatDate(g.discoveredAt)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
