"use client";

import { useState } from "react";
import type { InvestorMonitorItem } from "@/lib/types";
import { SectionCard } from "@/components/ui/Card";
import { SeverityPill } from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function InvestorChecklist({
  items,
}: {
  items: InvestorMonitorItem[];
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, !!i.done])),
  );

  const sorted = [...items].sort((a, b) => {
    const sev = { high: 3, medium: 2, low: 1 } as const;
    return sev[b.priority] - sev[a.priority];
  });

  const done = Object.values(checked).filter(Boolean).length;

  return (
    <SectionCard
      id="investor-checklist"
      eyebrow="I · Investor Checklist"
      title="What to monitor next"
      subtitle="Concrete items to verify at upcoming disclosures."
      actions={
        <div className="text-xs text-ink-600">
          <span className="font-semibold text-ink-900">{done}</span> / {items.length}{" "}
          tracked
        </div>
      }
    >
      <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200">
        {sorted.map((item) => {
          const isDone = !!checked[item.id];
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-start gap-3 bg-white p-4 transition-colors",
                isDone && "bg-ink-50/50",
              )}
            >
              <input
                type="checkbox"
                aria-label={item.label}
                checked={isDone}
                onChange={(e) =>
                  setChecked((c) => ({ ...c, [item.id]: e.target.checked }))
                }
                className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className={cn(
                        "text-sm font-medium text-ink-900",
                        isDone && "text-ink-500 line-through",
                      )}
                    >
                      {item.label}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {item.rationale}
                    </p>
                  </div>
                  <SeverityPill severity={item.priority} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
                  <span>
                    Metric:{" "}
                    <span className="font-medium text-ink-700">
                      {item.metric}
                    </span>
                  </span>
                  <span>Target date: {formatDate(item.targetDate)}</span>
                  {item.relatedPromiseIds.length > 0 && (
                    <span>Linked: {item.relatedPromiseIds.join(", ")}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
