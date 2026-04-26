// Per-promise outcome testing. Given a promise and a set of later-period
// parsed source texts, find the best "actual" reading and produce an enriched
// PromiseRecord (status, variancePct, actualOutcome, managementExplanation,
// rootCauseTags). If we can't find an actual we fall back honestly:
//   - test date in future          → Pending
//   - test date passed, no actual  → In-progress

import type { PromiseRecord, SourceDocument } from "../types";
import { parseTarget } from "./target";
import { compareToTarget } from "./compare";
import { findActualForPromise } from "./actuals";
import { findExplanation } from "./explain";

export interface ParsedSourceText {
  source: SourceDocument;
  text: string;
}

// Source types that typically *report actuals* (vs. announcing future plans).
const RESULT_SOURCE_TYPES = new Set([
  "Financial Result",
  "Annual Report",
  "Earnings Call",
  "Investor Presentation",
  "Press Release",
  "Exchange Filing",
]);

export function testPromiseOutcomes(
  promises: PromiseRecord[],
  texts: ParsedSourceText[],
  now: Date = new Date(),
): PromiseRecord[] {
  const nowMs = now.getTime();
  const indexed = texts.filter((t) => !!t.text && t.text.length > 200);

  return promises.map((p) => {
    const promisedAtMs = p.date ? new Date(p.date).getTime() : 0;
    const testDateMs = p.testDate ? new Date(p.testDate).getTime() : Infinity;

    // Candidate texts: from any result-type source published AFTER the promise
    // was made. We allow before-test-date if the result already discloses the
    // metric, since some companies guide AND deliver in the same period.
    const candidates = indexed
      .filter((t) => t.source.id !== p.sourceId)
      .filter((t) => RESULT_SOURCE_TYPES.has(t.source.type as never))
      .filter((t) => {
        const d = t.source.publishedAt ? new Date(t.source.publishedAt).getTime() : 0;
        return d > promisedAtMs;
      })
      .sort((a, b) => {
        const da = new Date(a.source.publishedAt).getTime();
        const db = new Date(b.source.publishedAt).getTime();
        return db - da; // newest first
      });

    const target = parseTarget(p.target);
    if (!target || target.kind === "qualitative") {
      // For qualitative promises (date-targets, "evaluating M&A", etc.) we
      // can't compute variance — fall back to date-based status.
      return fallbackStatus(p, nowMs, testDateMs);
    }

    // Walk candidates newest-first, return on first solid match.
    for (const cand of candidates) {
      const actual = findActualForPromise(cand.text, p.promiseType, target.unit);
      if (!actual) continue;

      const cmp = compareToTarget(target, actual.numeric);
      // Find an explanation in the SAME source where we found the actual.
      const labelRx = matchedLabelToRegex(actual.matchedLabel);
      const exp = labelRx
        ? findExplanation(cand.text, labelRx, cmp.status)
        : { rootCauseTags: [] as string[] };

      const actualOutcome = formatActual(actual.numeric, actual.unit);
      return {
        ...p,
        status: cmp.status,
        variancePct: cmp.variancePct,
        actualOutcome,
        managementExplanation: exp.managementExplanation,
        rootCauseTags: exp.rootCauseTags,
        // Add a citation pointing to the source we tested against.
        citations: dedupeCitations([
          ...p.citations,
          {
            id: `${p.id}-actual-${cand.source.id}`,
            sourceId: cand.source.id,
            label: `Actual: ${cand.source.type} ${cand.source.period}`,
            url: cand.source.url,
            quote: actual.sentence.length > 200
              ? actual.sentence.slice(0, 197) + "…"
              : actual.sentence,
          },
        ]),
      };
    }

    return fallbackStatus(p, nowMs, testDateMs);
  });
}

function fallbackStatus(p: PromiseRecord, nowMs: number, testDateMs: number): PromiseRecord {
  if (testDateMs <= nowMs && p.status === "Pending") {
    return { ...p, status: "In-progress" };
  }
  return p;
}

function matchedLabelToRegex(label: string): RegExp | null {
  const safe = label.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!safe) return null;
  return new RegExp(`\\b${safe}\\b`, "i");
}

function formatActual(numeric: number, unit: string): string {
  if (unit === "%") return `${trim(numeric)}%`;
  if (unit === "x") return `${trim(numeric)}x`;
  if (unit === "INR Cr") return `INR ${trim(numeric)} Cr`;
  return `${trim(numeric)} ${unit}`.trim();
}

function trim(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
}

function dedupeCitations<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const c of list) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}
