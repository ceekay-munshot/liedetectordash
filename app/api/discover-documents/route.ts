import { NextResponse } from "next/server";
import type {
  CompanyProfile,
  DiscoveryDebug,
  MissingSourceGap,
  SourceDocument,
  SourceType,
} from "@/lib/types";
import { fetchBseAnnouncements } from "@/lib/sources/bse";
import {
  bseAttachmentUrl,
  classifyBseAnnouncement,
  periodForBseAnnouncement,
  type BseAnnouncement,
} from "@/lib/sources/classify";
import {
  fyLabel,
  fyToScopeRange,
  lastNFiscalYears,
} from "@/lib/sources/period";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  profile: CompanyProfile;
  scopeYears?: number;
}

const EXPECTED_BY_FY: { type: SourceType; perYear: number }[] = [
  { type: "Annual Report", perYear: 1 },
  { type: "Earnings Call", perYear: 4 },
  { type: "Investor Presentation", perYear: 4 },
  { type: "Financial Result", perYear: 4 },
];

export async function POST(req: Request): Promise<NextResponse> {
  const startedAt = Date.now();
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { profile } = body;
  const scopeYears = body.scopeYears ?? 5;

  const debug: DiscoveryDebug = {
    fyRange: { from: "", to: "" },
    fiscalYears: [],
    documentsFound: 0,
    gapsFound: 0,
    perYear: {},
    errors: [],
  };

  if (!profile) {
    debug.durationMs = Date.now() - startedAt;
    return NextResponse.json(
      { sources: [], gaps: [], debug, error: "profile is required" },
      { status: 400 },
    );
  }
  if (!profile.bseCode) {
    debug.errors.push({
      source: "BSE announcements",
      message: "No BSE code on profile; primary discovery source unavailable.",
    });
    debug.durationMs = Date.now() - startedAt;
    return NextResponse.json(
      { sources: [], gaps: gapsForMissingPrimary(profile, scopeYears), debug },
      { status: 200 },
    );
  }

  const fyEnds = lastNFiscalYears(scopeYears);
  debug.fiscalYears = fyEnds.map(fyLabel);
  const earliest = fyToScopeRange(fyEnds[0]).from;
  const latest = fyToScopeRange(fyEnds[fyEnds.length - 1]).to;
  debug.fyRange = { from: earliest, to: latest };

  // Fetch BSE corporate announcements across the full window.
  let announcements: BseAnnouncement[] = [];
  try {
    const r = await fetchBseAnnouncements({
      scripCd: profile.bseCode,
      from: new Date(earliest),
      to: new Date(latest),
      maxPages: 25,
    });
    announcements = r.items;
    for (const m of r.errors) {
      debug.errors.push({ source: "BSE announcements", message: m });
    }
  } catch (e) {
    debug.errors.push({
      source: "BSE announcements",
      message: e instanceof Error ? e.message : String(e),
    });
  }

  // Classify and convert.
  const sources: SourceDocument[] = [];
  for (const a of announcements) {
    const c = classifyBseAnnouncement(a);
    if (!c) continue;
    const url = bseAttachmentUrl(a);
    const publishedAt = a.NEWS_DT ? new Date(a.NEWS_DT).toISOString() : new Date().toISOString();
    sources.push({
      id: `bse-${a.SCRIP_CD}-${publishedAt}-${sources.length}`,
      type: c.type,
      title: a.NEWSSUB || a.HEADLINE || "(no title)",
      period: periodForBseAnnouncement(a),
      publishedAt,
      ingestedAt: new Date().toISOString(),
      url,
      originSite: "BSE",
      accessibility: url ? "open" : "unknown",
      trustScore: c.confidence === "high" ? 88 : c.confidence === "medium" ? 70 : 55,
      notes: a.SUBCATNAME ? `BSE category: ${a.CATEGORYNAME ?? "?"} / ${a.SUBCATNAME}` : undefined,
    });
  }

  // Compute per-year coverage and gaps.
  const gaps: MissingSourceGap[] = [];
  for (const fyEnd of fyEnds) {
    const label = fyLabel(fyEnd);
    const inYear = sources.filter((s) =>
      s.period === label || s.period.endsWith(label),
    );
    const found = inYear.length;
    let yearGaps = 0;
    for (const exp of EXPECTED_BY_FY) {
      const matches = inYear.filter((s) => s.type === exp.type).length;
      if (matches < exp.perYear) {
        if (exp.perYear === 1 && matches === 0) {
          gaps.push({
            id: `gap-${label}-${exp.type}`,
            category: exp.type,
            expected: `${exp.type} for ${label}`,
            period: label,
            reason: `No ${exp.type} located on BSE for ${label}.`,
            severity: exp.type === "Annual Report" ? "high" : "medium",
            discoveredAt: new Date().toISOString(),
          });
          yearGaps += 1;
        } else if (exp.perYear === 4) {
          const missing = exp.perYear - matches;
          for (let i = 0; i < missing; i++) {
            gaps.push({
              id: `gap-${label}-${exp.type}-${i}`,
              category: exp.type,
              expected: `${exp.type} (${missing} of 4 missing) in ${label}`,
              period: label,
              reason: `Found ${matches}/4 expected ${exp.type} filings for ${label}.`,
              severity: matches === 0 ? "high" : "medium",
              discoveredAt: new Date().toISOString(),
            });
          }
          yearGaps += missing;
        }
      }
    }
    debug.perYear[label] = { found, gaps: yearGaps };
  }

  debug.documentsFound = sources.length;
  debug.gapsFound = gaps.length;
  debug.durationMs = Date.now() - startedAt;

  return NextResponse.json({ sources, gaps, debug });
}

function gapsForMissingPrimary(
  profile: CompanyProfile,
  scopeYears: number,
): MissingSourceGap[] {
  const fys = lastNFiscalYears(scopeYears).map(fyLabel);
  const out: MissingSourceGap[] = [];
  for (const label of fys) {
    out.push({
      id: `gap-noprimary-${label}`,
      category: "Exchange Filing",
      expected: `BSE/NSE filings for ${profile.name} (${label})`,
      period: label,
      reason: "No BSE code resolved for this company; primary discovery source unavailable.",
      severity: "high",
      discoveredAt: new Date().toISOString(),
    });
  }
  return out;
}
