"use client";

import { useMemo, useState } from "react";
import type {
  Confidence,
  PromiseRecord,
  PromiseStatus,
  PromiseType,
  SourceType,
} from "@/lib/types";
import { SectionCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  ConfidencePill,
  StatusPill,
} from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/utils";

const statusOptions: { label: string; value: PromiseStatus | "All" }[] = [
  { label: "All statuses", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "In-progress", value: "In-progress" },
  { label: "Met", value: "Met" },
  { label: "Partially Met", value: "Partially Met" },
  { label: "Missed", value: "Missed" },
  { label: "Rescinded", value: "Rescinded" },
];

const confidenceOptions: { label: string; value: Confidence | "All" }[] = [
  { label: "All confidence", value: "All" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];

const promiseTypeOptions: { label: string; value: PromiseType | "All" }[] = [
  { label: "All promise types", value: "All" },
  { label: "Guidance", value: "Guidance" },
  { label: "Capex", value: "Capex" },
  { label: "Capacity", value: "Capacity" },
  { label: "Margin", value: "Margin" },
  { label: "Revenue", value: "Revenue" },
  { label: "Order Book", value: "Order Book" },
  { label: "Debt", value: "Debt" },
  { label: "Product Launch", value: "Product Launch" },
  { label: "M&A", value: "M&A" },
  { label: "ESG", value: "ESG" },
  { label: "Other", value: "Other" },
];

const sourceTypeOptions: { label: string; value: SourceType | "All" }[] = [
  { label: "All sources", value: "All" },
  { label: "Annual Report", value: "Annual Report" },
  { label: "Earnings Call", value: "Earnings Call" },
  { label: "Investor Presentation", value: "Investor Presentation" },
  { label: "DRHP/RHP", value: "DRHP/RHP" },
  { label: "Exchange Filing", value: "Exchange Filing" },
  { label: "Press Release", value: "Press Release" },
  { label: "Regulatory Order", value: "Regulatory Order" },
  { label: "Interview", value: "Interview" },
  { label: "Broker Note", value: "Broker Note" },
];

export function WalkTheTalkTable({ promises }: { promises: PromiseRecord[] }) {
  const [status, setStatus] = useState<PromiseStatus | "All">("All");
  const [confidence, setConfidence] = useState<Confidence | "All">("All");
  const [promiseType, setPromiseType] = useState<PromiseType | "All">("All");
  const [sourceType, setSourceType] = useState<SourceType | "All">("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return promises
      .filter((p) => status === "All" || p.status === status)
      .filter((p) => confidence === "All" || p.confidence === confidence)
      .filter((p) => promiseType === "All" || p.promiseType === promiseType)
      .filter((p) => sourceType === "All" || p.sourceType === sourceType)
      .filter((p) => {
        if (!q) return true;
        return [
          p.promiseText,
          p.exactQuote,
          p.metric,
          p.target,
          p.managementExplanation ?? "",
          p.actualOutcome ?? "",
          p.quarter,
          p.sourceType,
          p.promiseType,
          p.rootCauseTags.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [promises, status, confidence, promiseType, sourceType, query]);

  return (
    <SectionCard
      id="walk-the-talk"
      eyebrow="D · Walk-the-Talk Tracking"
      title="Chronological promise vs. outcome ledger"
      subtitle="Every commitment, its verbatim source, the test, and the result. Outcome / status / variance / explanation columns are next-step work."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="ok">Live</Badge>
          <Badge tone="brand">{filtered.length} shown</Badge>
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          label="Search"
          placeholder="Quote, metric, tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as PromiseStatus | "All")}
          options={statusOptions.map((o) => ({ label: o.label, value: o.value }))}
        />
        <Select
          label="Confidence"
          value={confidence}
          onChange={(e) =>
            setConfidence(e.target.value as Confidence | "All")
          }
          options={confidenceOptions.map((o) => ({
            label: o.label,
            value: o.value,
          }))}
        />
        <Select
          label="Promise type"
          value={promiseType}
          onChange={(e) =>
            setPromiseType(e.target.value as PromiseType | "All")
          }
          options={promiseTypeOptions.map((o) => ({
            label: o.label,
            value: o.value,
          }))}
        />
        <Select
          label="Source type"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as SourceType | "All")}
          options={sourceTypeOptions.map((o) => ({
            label: o.label,
            value: o.value,
          }))}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200">
        <table className="min-w-[1400px] w-full text-sm">
          <thead>
            <tr className="bg-ink-50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Quarter/FY</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Promise</th>
              <th className="px-3 py-2">Exact quote</th>
              <th className="px-3 py-2">Metric + target</th>
              <th className="px-3 py-2">Test date</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Actual outcome</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Variance</th>
              <th className="px-3 py-2">Mgmt explanation</th>
              <th className="px-3 py-2">Root-cause tag(s)</th>
              <th className="px-3 py-2">Citation(s)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 align-top">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-ink-50/60">
                <td className="whitespace-nowrap px-3 py-3 text-ink-700">
                  {formatDate(p.date)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-700">
                  {p.quarter}
                </td>
                <td className="px-3 py-3">
                  <Badge tone="brand">{p.sourceType}</Badge>
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-ink-900">
                    {p.promiseText}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-500">
                    {p.promiseType}
                    {p.speaker ? ` · ${p.speaker}` : ""}
                  </div>
                  {p.extractionNotes && (
                    <div className="mt-0.5 text-[11px] italic text-ink-400">
                      {p.extractionNotes}
                    </div>
                  )}
                </td>
                <td className="max-w-[280px] px-3 py-3 text-ink-700">
                  <span className="italic">“{p.exactQuote}”</span>
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-ink-900">{p.metric}</div>
                  <div className="text-xs text-ink-500">
                    Target: {p.target || "—"}
                    {p.unit && p.target !== "—" ? "" : ""}
                  </div>
                  {p.timeHorizon && (
                    <div className="text-[11px] text-ink-500">Horizon: {p.timeHorizon}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-700">
                  {p.testDate ? formatDate(p.testDate) : <span className="text-ink-400">—</span>}
                </td>
                <td className="px-3 py-3">
                  <ConfidencePill confidence={p.confidence} />
                </td>
                <td className="max-w-[200px] px-3 py-3">
                  {p.actualOutcome ? (
                    <span className="text-ink-700">{p.actualOutcome}</span>
                  ) : (
                    <span className="text-[11px] italic text-ink-400">next step</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <StatusPill status={p.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-700">
                  {p.variancePct === undefined ? (
                    <span className="text-[11px] italic text-ink-400">next step</span>
                  ) : (
                    `${p.variancePct > 0 ? "+" : ""}${p.variancePct}%`
                  )}
                </td>
                <td className="max-w-[240px] px-3 py-3">
                  {p.managementExplanation ? (
                    <span className="text-ink-700">{p.managementExplanation}</span>
                  ) : (
                    <span className="text-[11px] italic text-ink-400">next step</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {p.rootCauseTags.length === 0 ? (
                    <span className="text-[11px] italic text-ink-400">next step</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {p.rootCauseTags.map((t) => (
                        <Badge key={t} tone="violet">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    {p.citations.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs text-brand-700 underline-offset-2 hover:underline"
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={14}
                  className="px-3 py-8 text-center text-sm text-ink-500"
                >
                  {promises.length === 0
                    ? "No promises extracted yet. Click Refresh to run extraction on the discovered sources."
                    : "No promises match the current filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
