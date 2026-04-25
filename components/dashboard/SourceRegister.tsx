"use client";

import { useMemo, useState } from "react";
import type { SourceDocument, SourceType } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";

const TYPES: (SourceType | "All")[] = [
  "All",
  "Annual Report",
  "Earnings Call",
  "Investor Presentation",
  "Financial Result",
  "Exchange Filing",
  "Press Release",
  "DRHP/RHP",
  "Regulatory Order",
  "Interview",
  "Broker Note",
];

export function SourceRegister({ sources }: { sources: SourceDocument[] }) {
  const [type, setType] = useState<SourceType | "All">("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources
      .filter((s) => type === "All" || s.type === type)
      .filter((s) => {
        if (!q) return true;
        return [s.title, s.period, s.type, s.notes ?? "", s.originSite ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
  }, [sources, type, query]);

  return (
    <SectionCard
      id="source-register"
      eyebrow="B · Source Register"
      title="Primary disclosure sources"
      subtitle="Annual reports, transcripts, filings, and releases ingested for analysis. Only primary sources are stored."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="ok">Live</Badge>
          <Badge tone="neutral">{filtered.length} of {sources.length}</Badge>
        </div>
      }
    >
      {sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-8 text-center text-sm text-ink-500">
          No sources loaded yet. Click Refresh to discover live filings for the
          current company.
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Search"
              placeholder="Title, period, notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select
              label="Source type"
              value={type}
              onChange={(e) => setType(e.target.value as SourceType | "All")}
              options={TYPES.map((t) => ({ label: t, value: t }))}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-ink-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Published</th>
                  <th className="px-4 py-2">Origin</th>
                  <th className="px-4 py-2">Access</th>
                  <th className="px-4 py-2">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-2">
                      <Badge tone="brand">{s.type}</Badge>
                    </td>
                    <td className="px-4 py-2 font-medium text-ink-900">
                      <div>{s.title}</div>
                      {s.notes && (
                        <div className="text-[11px] text-ink-500">{s.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-ink-700">{s.period}</td>
                    <td className="px-4 py-2 text-ink-700">
                      {formatDate(s.publishedAt)}
                    </td>
                    <td className="px-4 py-2 text-ink-700">
                      {s.originSite ? <Badge tone="violet">{s.originSite}</Badge> : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <AccessBadge value={s.accessibility} />
                    </td>
                    <td className="px-4 py-2">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-700 underline-offset-2 hover:underline"
                        >
                          Open ↗
                        </a>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-ink-500">
                      No sources match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SectionCard>
  );
}

function AccessBadge({ value }: { value?: SourceDocument["accessibility"] }) {
  if (!value || value === "unknown") return <Badge tone="muted">—</Badge>;
  if (value === "open") return <Badge tone="ok">Open</Badge>;
  if (value === "restricted") return <Badge tone="warn">Restricted</Badge>;
  return <Badge tone="bad">Broken</Badge>;
}
