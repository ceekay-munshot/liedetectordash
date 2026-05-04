"use client";

import { Fragment, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { runMunsAgent } from "@/lib/muns/api";
import {
  parseMunsResponse,
  type MunsParsedResponse,
  type MunsSection,
  type MunsTable,
} from "@/lib/muns/parse";
import { cn } from "@/lib/utils";

interface MunsAnalysisPanelProps {
  ticker: string;
  company: string;
}

export function MunsAnalysisPanel({ ticker, company }: MunsAnalysisPanelProps) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MunsParsedResponse | null>(null);
  const [meta, setMeta] = useState<{ activeAnalystId?: string; analystOutputId?: string }>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const runAnalysis = async () => {
    setRunning(true);
    setError(null);
    setOpen(true);
    try {
      const response = await runMunsAgent({ ticker, company });
      setResult(parseMunsResponse(response.raw));
      setMeta({
        activeAnalystId: response.activeAnalystId,
        analystOutputId: response.analystOutputId,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setRunning(false);
    }
  };

  const close = () => {
    setOpen(false);
  };

  const disabled = running || !ticker.trim() || !company.trim();

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={runAnalysis}
        disabled={disabled}
        title={
          !ticker.trim() || !company.trim()
            ? "Set a ticker and company first"
            : "Run MUNS analysis for the current company"
        }
      >
        {running ? (
          <>
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink-300 border-t-ink-700" />
            Running…
          </>
        ) : (
          <>MUNS analysis</>
        )}
      </Button>

      {open ? (
        <MunsAnalysisModal
          onClose={close}
          ticker={ticker}
          company={company}
          running={running}
          error={error}
          result={result}
          meta={meta}
        />
      ) : null}
    </>
  );
}

function MunsAnalysisModal({
  onClose,
  ticker,
  company,
  running,
  error,
  result,
  meta,
}: {
  onClose: () => void;
  ticker: string;
  company: string;
  running: boolean;
  error: string | null;
  result: MunsParsedResponse | null;
  meta: { activeAnalystId?: string; analystOutputId?: string };
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="MUNS analysis"
      onClick={onClose}
    >
      <div
        className="card my-8 w-full max-w-5xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 rounded-t-2xl border-b border-ink-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <div className="section-title">MUNS · agent analysis</div>
            <h2 className="mt-1 text-lg font-semibold text-ink-900">
              {company || "—"}{" "}
              <span className="text-ink-500">({ticker || "—"})</span>
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
              {running ? <Badge tone="warn">Running</Badge> : null}
              {!running && result ? <Badge tone="ok">Complete</Badge> : null}
              {!running && error ? <Badge tone="bad">Failed</Badge> : null}
              {meta.activeAnalystId ? (
                <span className="font-mono text-[11px]">
                  analyst: {meta.activeAnalystId.slice(0, 8)}…
                </span>
              ) : null}
              {meta.analystOutputId ? (
                <span className="font-mono text-[11px]">
                  output: {meta.analystOutputId.slice(0, 8)}…
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </header>

        <div className="space-y-5 p-6">
          {running && !result && !error ? (
            <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-10 text-center text-sm text-ink-500">
              Calling MUNS agent. This typically takes 30–90 seconds while the
              agent fetches filings and runs walk-the-talk analysis…
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-bad-100/40 p-4 text-sm text-bad-500">
              <div className="font-semibold">MUNS request failed</div>
              <div className="mt-1 break-words text-bad-500/90">{error}</div>
            </div>
          ) : null}

          {result ? <MunsResultView result={result} /> : null}
        </div>
      </div>
    </div>
  );
}

function MunsResultView({ result }: { result: MunsParsedResponse }) {
  if (result.sections.length === 0 && !result.summary && !result.conclusion) {
    return (
      <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-8 text-center text-sm text-ink-500">
        No structured output returned.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {result.sections.map((section) => (
        <SectionView key={section.id} section={section} />
      ))}
      {result.conclusion ? (
        <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4">
          <div className="section-title">Conclusion</div>
          <div className="mt-2">
            <ProseText text={result.conclusion} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionView({ section }: { section: MunsSection }) {
  return (
    <section className="rounded-xl border border-ink-200 bg-white p-5">
      <h3 className="text-base font-semibold tracking-tight text-ink-900">
        {section.heading}
      </h3>
      {section.prose ? (
        <div className="mt-3">
          <ProseText text={section.prose} />
        </div>
      ) : null}
      {section.tables.map((table, index) => (
        <div key={index} className={cn("overflow-hidden rounded-xl border border-ink-200", index > 0 || section.prose ? "mt-4" : "mt-3")}>
          <TableView table={table} />
        </div>
      ))}
    </section>
  );
}

function TableView({ table }: { table: MunsTable }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ink-50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            {table.columns.map((column, index) => (
              <th key={`${column}-${index}`} className="px-4 py-2 align-top">
                {column || `Col ${index + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top hover:bg-ink-50/60">
              {table.columns.map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-2 text-ink-800">
                  <CellContent value={row[colIndex] ?? ""} />
                </td>
              ))}
            </tr>
          ))}
          {table.rows.length === 0 ? (
            <tr>
              <td
                colSpan={Math.max(table.columns.length, 1)}
                className="px-4 py-6 text-center text-sm text-ink-500"
              >
                No rows.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

const URL_RE = /(https?:\/\/[^\s)\]]+)/g;
const BOLD_RE = /\*\*(.+?)\*\*/g;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Replace markdown links [label](url) first, then bold, then bare URLs.
  const nodes: React.ReactNode[] = [];
  let working = text;
  let counter = 0;

  // Tokenize markdown links into placeholders so we don't double-process URLs.
  type Token = { type: "text" | "link" | "bold" | "url"; value: string; href?: string };
  const tokens: Token[] = [];

  let lastIndex = 0;
  for (const match of working.matchAll(MD_LINK_RE)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) tokens.push({ type: "text", value: working.slice(lastIndex, idx) });
    tokens.push({ type: "link", value: match[1], href: match[2] });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < working.length) tokens.push({ type: "text", value: working.slice(lastIndex) });

  // Now expand text tokens: bold + bare URLs.
  const expandText = (raw: string): Token[] => {
    const out: Token[] = [];
    let cursor = 0;
    const combined: { idx: number; len: number; type: "bold" | "url"; value: string; href?: string }[] = [];

    for (const m of raw.matchAll(BOLD_RE)) {
      combined.push({ idx: m.index ?? 0, len: m[0].length, type: "bold", value: m[1] });
    }
    for (const m of raw.matchAll(URL_RE)) {
      combined.push({ idx: m.index ?? 0, len: m[0].length, type: "url", value: m[1], href: m[1] });
    }
    combined.sort((a, b) => a.idx - b.idx);

    // Drop overlaps (bold wins over a URL inside it; in practice, our data doesn't nest these).
    const filtered: typeof combined = [];
    let lastEnd = -1;
    for (const c of combined) {
      if (c.idx >= lastEnd) {
        filtered.push(c);
        lastEnd = c.idx + c.len;
      }
    }

    for (const c of filtered) {
      if (c.idx > cursor) out.push({ type: "text", value: raw.slice(cursor, c.idx) });
      if (c.type === "bold") out.push({ type: "bold", value: c.value });
      else out.push({ type: "url", value: c.value, href: c.href });
      cursor = c.idx + c.len;
    }
    if (cursor < raw.length) out.push({ type: "text", value: raw.slice(cursor) });
    return out;
  };

  const finalTokens: Token[] = [];
  for (const tok of tokens) {
    if (tok.type === "text") finalTokens.push(...expandText(tok.value));
    else finalTokens.push(tok);
  }

  for (const tok of finalTokens) {
    const key = `${keyPrefix}-${counter++}`;
    if (tok.type === "text") {
      nodes.push(<Fragment key={key}>{tok.value}</Fragment>);
    } else if (tok.type === "bold") {
      nodes.push(<strong key={key} className="font-semibold text-ink-900">{tok.value}</strong>);
    } else {
      const href = tok.href ?? tok.value;
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-700 underline-offset-2 hover:underline break-words"
        >
          {tok.value}
        </a>,
      );
    }
  }

  return nodes;
}

function CellContent({ value }: { value: string }) {
  if (!value) return <span className="text-ink-400">—</span>;
  return (
    <span className="block whitespace-pre-wrap break-words leading-relaxed">
      {renderInline(value, "cell")}
    </span>
  );
}

function ProseText({ text }: { text: string }) {
  // Group consecutive bullet / numbered lines into list elements; everything
  // else becomes a paragraph. Blank lines split paragraphs.
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let buffer: string[] = [];
  let bufferType: "para" | "ul" | "ol" | null = null;

  const flush = () => {
    if (buffer.length === 0 || bufferType === null) {
      buffer = [];
      bufferType = null;
      return;
    }
    const key = `block-${blocks.length}`;
    if (bufferType === "para") {
      blocks.push(
        <p key={key} className="text-sm leading-relaxed text-ink-700">
          {renderInline(buffer.join(" "), key)}
        </p>,
      );
    } else if (bufferType === "ul") {
      blocks.push(
        <ul key={key} className="list-disc space-y-1 pl-5 text-sm text-ink-700">
          {buffer.map((item, i) => (
            <li key={`${key}-${i}`} className="leading-relaxed">
              {renderInline(item, `${key}-${i}`)}
            </li>
          ))}
        </ul>,
      );
    } else {
      blocks.push(
        <ol key={key} className="list-decimal space-y-1 pl-5 text-sm text-ink-700">
          {buffer.map((item, i) => (
            <li key={`${key}-${i}`} className="leading-relaxed">
              {renderInline(item, `${key}-${i}`)}
            </li>
          ))}
        </ol>,
      );
    }
    buffer = [];
    bufferType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const ulMatch = line.match(/^\s*[-*]\s+(.+)/);
    const olMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (ulMatch) {
      if (bufferType !== "ul") flush();
      bufferType = "ul";
      buffer.push(ulMatch[1]);
    } else if (olMatch) {
      if (bufferType !== "ol") flush();
      bufferType = "ol";
      buffer.push(olMatch[1]);
    } else {
      if (bufferType !== "para") flush();
      bufferType = "para";
      buffer.push(line.trim());
    }
  }
  flush();

  return <div className="space-y-3">{blocks}</div>;
}
