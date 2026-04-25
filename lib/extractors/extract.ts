import type { Citation, PromiseRecord, SourceDocument } from "../types";
import { fyLabel, fyForDate, periodLabelForDate } from "../sources/period";
import {
  FORWARD_LOOKING,
  HORIZON_PATTERNS,
  PAST_REPORTAGE,
  SPEAKER_PATTERN,
  TARGET_PATTERNS,
} from "./patterns";
import { classifyPromise } from "./classify";
import { detectFirm, detectHedge, scoreConfidence } from "./confidence";
import { nWordWindow, splitSentences } from "./sentences";

export interface ExtractFromTextResult {
  promises: PromiseRecord[];
  notes: string[];
}

function findHorizon(sentence: string): string | undefined {
  for (const rx of HORIZON_PATTERNS) {
    const m = sentence.match(rx);
    if (m && m[1]) return cleanHorizon(m[1]);
    if (m && m[0]) return cleanHorizon(m[0]);
  }
  return undefined;
}

function cleanHorizon(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/^by\s+/i, "").trim();
}

function findTarget(sentence: string): { target?: string; unit?: string } {
  for (const { rx, unit } of TARGET_PATTERNS) {
    const m = sentence.match(rx);
    if (m) {
      // If the percentage match is part of e.g. "30 percent" handled, return clean
      if (unit === "%") return { target: `${m[1]}%`, unit };
      if (unit === "INR") {
        const denom = (m[2] || "Cr").toString();
        return { target: `INR ${m[1]} ${denom}`, unit: `INR ${denom}` };
      }
      if (unit === "USD") {
        const denom = (m[2] || "").toString();
        return { target: `USD ${m[1]}${denom ? " " + denom : ""}`, unit: `USD${denom ? " " + denom : ""}` };
      }
      if (unit === "x") return { target: `${m[1]}x`, unit };
    }
  }
  return {};
}

function findSpeaker(context: string): string | undefined {
  const m = context.match(SPEAKER_PATTERN);
  return m ? m[0].trim() : undefined;
}

function inferTestDate(horizon: string | undefined, fallback: Date): string | undefined {
  if (!horizon) return undefined;
  const h = horizon.toLowerCase();
  // Q1 FY25 -> 30 Jun 2024 (quarter ends in June for Q1)
  const qfy = h.match(/q\s*([1-4])\s*fy\s*(\d{2,4})/);
  if (qfy) {
    const q = parseInt(qfy[1], 10);
    let y = parseInt(qfy[2], 10);
    if (y < 100) y = 2000 + y;
    // Indian FY: Q1=Apr-Jun(yearY-1), Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar(yearY)
    const endMonth = q === 1 ? 5 : q === 2 ? 8 : q === 3 ? 11 : 2; // 0-indexed
    const endYear = q === 4 ? y : y - 1;
    return new Date(Date.UTC(endYear, endMonth + 1, 0)).toISOString();
  }
  const fy = h.match(/^fy\s*(\d{2,4})/);
  if (fy) {
    let y = parseInt(fy[1], 10);
    if (y < 100) y = 2000 + y;
    return new Date(Date.UTC(y, 2, 31)).toISOString();
  }
  const monthYear = h.match(/(march|june|september|december)\s+(\d{4})/);
  if (monthYear) {
    const month = { march: 2, june: 5, september: 8, december: 11 }[monthYear[1] as "march"]!;
    const year = parseInt(monthYear[2], 10);
    return new Date(Date.UTC(year, month + 1, 0)).toISOString();
  }
  // "next quarter" / "next year" relative to fallback
  if (/next\s+quarter/.test(h)) {
    const d = new Date(fallback);
    d.setUTCMonth(d.getUTCMonth() + 3);
    return d.toISOString();
  }
  if (/next\s+(?:year|fiscal\s+year|fy)/.test(h)) {
    const fyEnd = fyForDate(fallback) + 1;
    return new Date(Date.UTC(fyEnd, 2, 31)).toISOString();
  }
  const months = h.match(/(\d+)\s+months/);
  if (months) {
    const d = new Date(fallback);
    d.setUTCMonth(d.getUTCMonth() + parseInt(months[1], 10));
    return d.toISOString();
  }
  return undefined;
}

function buildPromiseText(args: {
  type: string;
  metric: string;
  target?: string;
  horizon?: string;
}): string {
  const parts = [args.metric];
  if (args.target) parts.push(args.target);
  if (args.horizon) parts.push(`by ${args.horizon}`);
  return parts.join(" ");
}

const PRIORITY: Record<string, number> = {
  "Earnings Call": 5,
  "Investor Presentation": 4,
  "Exchange Filing": 3,
  "Financial Result": 3,
  "Press Release": 2,
  "Annual Report": 1,
  "DRHP/RHP": 1,
  Interview: 1,
  "Regulatory Order": 0,
  "Broker Note": 0,
};

export function priorityOf(source: SourceDocument): number {
  return PRIORITY[source.type] ?? 0;
}

export function extractPromisesFromText(
  text: string,
  source: SourceDocument,
): ExtractFromTextResult {
  if (!text || text.length < 100) {
    return { promises: [], notes: ["Text too short to extract."] };
  }

  const docDate = source.publishedAt ? new Date(source.publishedAt) : new Date();
  const docPeriod = source.period && source.period !== "Unknown"
    ? source.period
    : periodLabelForDate(docDate);

  const sentences = splitSentences(text);
  const out: PromiseRecord[] = [];
  const notes: string[] = [];
  let idx = 0;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if (PAST_REPORTAGE.test(s)) continue;

    const { type, metric } = classifyPromise(s);
    if (type === "Other") continue;

    const horizon = findHorizon(s);
    const { target, unit } = findTarget(s);

    // Gate: forward-looking verb OR (numeric target paired with a horizon).
    const isForward = FORWARD_LOOKING.test(s) || (!!target && !!horizon);
    if (!isForward) continue;

    // Require at least target OR horizon — otherwise too generic.
    if (!target && !horizon) continue;

    const hasFirm = detectFirm(s);
    const hasHedge = detectHedge(s);
    const confidence = scoreConfidence({
      hasNumericTarget: !!target,
      hasHorizon: !!horizon,
      hasHedge,
      hasFirmCommitment: hasFirm,
    });

    // Speaker: look at preceding 2 sentences for an attribution line.
    const ctx = `${sentences[i - 2] ?? ""} ${sentences[i - 1] ?? ""}`;
    const speaker = findSpeaker(ctx);

    const exactQuote = nWordWindow(s.replace(/\s+/g, " ").trim(), 25);
    const promiseText = buildPromiseText({ type, metric, target, horizon });
    const testDate = inferTestDate(horizon, docDate);

    const citation: Citation = {
      id: `${source.id}-${idx}`,
      sourceId: source.id,
      label: `${source.type} ${docPeriod}`,
      url: source.url,
    };

    const extractionNotes: string[] = [];
    if (!target) extractionNotes.push("No numeric target captured");
    if (!horizon) extractionNotes.push("No time horizon captured");
    if (hasHedge) extractionNotes.push("Hedged language detected");

    out.push({
      id: `${source.id}-p${idx++}`,
      date: docDate.toISOString(),
      quarter: docPeriod,
      sourceId: source.id,
      sourceType: source.type,
      promiseType: type,
      promiseText,
      exactQuote,
      metric,
      target: target ?? "—",
      unit,
      timeHorizon: horizon,
      testDate: testDate ?? "",
      speaker,
      confidence,
      status: "Pending",
      rootCauseTags: [],
      citations: [citation],
      extractionNotes: extractionNotes.join("; ") || undefined,
    });
  }

  if (out.length === 0) notes.push(`No promises extracted from "${source.title}"`);
  void fyLabel; // satisfy module usage if treeshaken
  return { promises: out, notes };
}
