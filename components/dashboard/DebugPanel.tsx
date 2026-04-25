"use client";

import { useState } from "react";
import type { RefreshJob } from "@/lib/types";
import { SectionCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function DebugPanel({ job }: { job?: RefreshJob }) {
  const [open, setOpen] = useState(false);
  const resolver = job?.debug?.resolver;
  const discovery = job?.debug?.discovery;
  const extraction = job?.debug?.extraction;
  const errorCount =
    (resolver?.errors?.length ?? 0) +
    (discovery?.errors?.length ?? 0) +
    (extraction?.errors?.length ?? 0);

  return (
    <SectionCard
      eyebrow="Debug · Refresh diagnostics"
      title="Live data status"
      subtitle="Resolver and discovery telemetry from the latest refresh."
      actions={
        <div className="flex items-center gap-2">
          {errorCount > 0 ? (
            <Badge tone="bad">{errorCount} errors</Badge>
          ) : job ? (
            <Badge tone="ok">No errors</Badge>
          ) : (
            <Badge tone="muted">Not run</Badge>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            {open ? "Hide details" : "Show details"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DebugCard
          title="Stage 1 · Company resolver"
          rows={[
            ["Query", resolver?.query
              ? `name="${resolver.query.name ?? ""}" · ticker="${resolver.query.ticker ?? ""}"`
              : "—"],
            ["Attempted", resolver?.attempted?.join(", ") || "—"],
            ["Matched from", resolver?.matchedFrom || "—"],
            ["Candidates", String(resolver?.candidates?.length ?? 0)],
            ["Errors", String(resolver?.errors?.length ?? 0)],
            ["Duration", resolver?.durationMs != null ? `${resolver.durationMs} ms` : "—"],
          ]}
          tone={resolver?.errors?.length ? "warn" : resolver ? "ok" : "muted"}
        />
        <DebugCard
          title="Stage 2 · Document discovery"
          rows={[
            ["Documents found", String(discovery?.documentsFound ?? 0)],
            ["Gaps found", String(discovery?.gapsFound ?? 0)],
            ["FY range", discovery?.fiscalYears?.join(", ") || "—"],
            ["Errors", String(discovery?.errors?.length ?? 0)],
            ["Duration", discovery?.durationMs != null ? `${discovery.durationMs} ms` : "—"],
          ]}
          tone={discovery?.errors?.length ? "warn" : discovery ? "ok" : "muted"}
        />
        <DebugCard
          title="Stage 3-4 · Parse + extract"
          rows={[
            ["Considered docs", String(extraction?.consideredDocs ?? 0)],
            ["Parsed OK", String(extraction?.parsedOk ?? 0)],
            ["Failed / skipped", String((extraction?.parsedFailed ?? 0) + (extraction?.skipped ?? 0))],
            ["Promises extracted", String(extraction?.promisesExtracted ?? 0)],
            ["Docs with 0 promises", String(extraction?.docsWithZeroPromises ?? 0)],
            ["Duration", extraction?.durationMs != null ? `${extraction.durationMs} ms` : "—"],
          ]}
          tone={extraction?.errors?.length ? "warn" : extraction ? "ok" : "muted"}
        />
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          {discovery?.perYear && Object.keys(discovery.perYear).length > 0 && (
            <div>
              <div className="section-title mb-2">Per fiscal year</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {Object.entries(discovery.perYear).map(([fy, v]) => (
                  <div key={fy} className="rounded-lg border border-ink-200 bg-white p-3 text-center">
                    <div className="text-[11px] uppercase tracking-wider text-ink-500">{fy}</div>
                    <div className="mt-1 text-sm font-semibold text-ink-900">{v.found} found</div>
                    <div className="text-[11px] text-ink-500">{v.gaps} gaps</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolver?.candidates && resolver.candidates.length > 0 && (
            <div>
              <div className="section-title mb-2">Resolver candidates</div>
              <div className="overflow-hidden rounded-lg border border-ink-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-ink-50 text-left uppercase tracking-wider text-ink-500">
                      <th className="px-3 py-1.5">Exchange</th>
                      <th className="px-3 py-1.5">Ticker</th>
                      <th className="px-3 py-1.5">Name</th>
                      <th className="px-3 py-1.5">ISIN</th>
                      <th className="px-3 py-1.5">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {resolver.candidates.map((c, i) => (
                      <tr key={`${c.exchange}-${c.ticker}-${i}`}>
                        <td className="px-3 py-1.5">
                          <Badge tone={c.exchange === "NSE" ? "brand" : "violet"}>
                            {c.exchange}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-ink-900">{c.ticker}</td>
                        <td className="px-3 py-1.5 text-ink-700">{c.name}</td>
                        <td className="px-3 py-1.5 text-ink-700">{c.isin || "—"}</td>
                        <td className="px-3 py-1.5 text-ink-700">{c.score?.toFixed(2) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {extraction?.perType && Object.keys(extraction.perType).length > 0 && (
            <div>
              <div className="section-title mb-2">Promises by type</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(extraction.perType).map(([t, n]) => (
                  <span
                    key={t}
                    className="rounded-full border border-ink-200 bg-white px-2.5 py-0.5 text-xs text-ink-700"
                  >
                    {t}: <span className="font-semibold text-ink-900">{n}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {errorCount > 0 && (
            <div>
              <div className="section-title mb-2">Errors</div>
              <ul className="space-y-1 rounded-lg border border-bad-100 bg-bad-100/40 p-3 text-xs text-bad-500">
                {[
                  ...(resolver?.errors ?? []),
                  ...(discovery?.errors ?? []),
                  ...(extraction?.errors ?? []),
                ].map((e, i) => (
                  <li key={i}>
                    <span className="font-semibold">[{e.source}]</span> {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function DebugCard({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: [string, string][];
  tone: "ok" | "warn" | "bad" | "muted";
}) {
  const ring: Record<string, string> = {
    ok: "border-emerald-200",
    warn: "border-amber-200",
    bad: "border-red-200",
    muted: "border-ink-200",
  };
  return (
    <div className={cn("rounded-xl border bg-white p-4", ring[tone])}>
      <div className="mb-2 text-sm font-semibold text-ink-900">{title}</div>
      <dl className="grid grid-cols-2 gap-y-1 text-xs">
        {rows.map(([k, v]) => (
          <span key={k} className="contents">
            <dt className="text-ink-500">{k}</dt>
            <dd className="text-ink-900">{v}</dd>
          </span>
        ))}
      </dl>
    </div>
  );
}
