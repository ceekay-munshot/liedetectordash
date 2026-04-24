import type { SourceDocument } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export function SourceRegister({ sources }: { sources: SourceDocument[] }) {
  return (
    <SectionCard
      id="source-register"
      eyebrow="B · Source Register"
      title="Primary disclosure sources"
      subtitle="Annual reports, transcripts, filings, and releases ingested for analysis."
      actions={<Badge tone="neutral">{sources.length} sources</Badge>}
    >
      <div className="overflow-hidden rounded-xl border border-ink-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Period</th>
              <th className="px-4 py-2">Published</th>
              <th className="px-4 py-2">Pages</th>
              <th className="px-4 py-2">Trust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {sources.map((s) => (
              <tr key={s.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-2">
                  <Badge tone="brand">{s.type}</Badge>
                </td>
                <td className="px-4 py-2 font-medium text-ink-900">
                  {s.title}
                </td>
                <td className="px-4 py-2 text-ink-700">{s.period}</td>
                <td className="px-4 py-2 text-ink-700">
                  {formatDate(s.publishedAt)}
                </td>
                <td className="px-4 py-2 text-ink-700">{s.pages ?? "—"}</td>
                <td className="px-4 py-2 text-ink-700">
                  {typeof s.trustScore === "number" ? `${s.trustScore}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
