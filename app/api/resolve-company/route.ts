import { NextResponse } from "next/server";
import type {
  CompanyProfile,
  ResolverCandidate,
  ResolverDebug,
} from "@/lib/types";
import { fetchBseHeader, searchBseByText } from "@/lib/sources/bse";
import { searchNseByText } from "@/lib/sources/nse";
import { fyForDate, fyLabel, scopeRangeForLastN } from "@/lib/sources/period";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  name?: string;
  ticker?: string;
  fiscalYear?: string;
  scopeYears?: number;
}

function score(query: string, name: string): number {
  const q = query.toLowerCase().trim();
  const n = name.toLowerCase().trim();
  if (q === n) return 1;
  if (n.startsWith(q)) return 0.9;
  if (n.includes(q)) return 0.7;
  return 0.3;
}

export async function POST(req: Request): Promise<NextResponse> {
  const startedAt = Date.now();
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body */
  }
  const query = (body.ticker || body.name || "").trim();
  const debug: ResolverDebug = {
    query: { name: body.name, ticker: body.ticker },
    attempted: [],
    candidates: [],
    errors: [],
  };

  if (!query) {
    debug.durationMs = Date.now() - startedAt;
    return NextResponse.json(
      { profile: null, debug, error: "name or ticker is required" },
      { status: 400 },
    );
  }

  // 1. BSE search (most permissive endpoint).
  let bseHits: Awaited<ReturnType<typeof searchBseByText>> = [];
  debug.attempted.push("BSE");
  try {
    bseHits = await searchBseByText(query);
  } catch (e) {
    const m = msg(e);
    debug.errors.push({ source: "BSE search", message: m });
    console.error("[resolve-company] BSE search failed:", m);
  }
  if (bseHits.length === 0 && !debug.errors.some((e) => e.source === "BSE search")) {
    debug.errors.push({
      source: "BSE search",
      message: `No BSE matches for "${query}". This usually means BSE is rate-limiting or blocking this IP.`,
    });
  }
  for (const h of bseHits.slice(0, 8)) {
    debug.candidates.push({
      exchange: "BSE",
      ticker: String(h.Scrip_Cd),
      name: h.Scrip_Name,
      isin: h.ISIN_Number,
      bseCode: String(h.Scrip_Cd),
      score: score(query, h.Scrip_Name),
    });
  }

  // 2. NSE search (best effort).
  debug.attempted.push("NSE");
  try {
    const nse = await searchNseByText(query);
    if (nse.error) {
      debug.errors.push({ source: "NSE search", message: nse.error });
      console.error("[resolve-company] NSE search error:", nse.error);
    }
    for (const h of nse.hits.slice(0, 8)) {
      debug.candidates.push({
        exchange: "NSE",
        ticker: h.symbol,
        name: h.symbol_info,
        isin: h.isin,
        score: score(query, h.symbol_info),
      });
    }
  } catch (e) {
    const m = msg(e);
    debug.errors.push({ source: "NSE search", message: m });
    console.error("[resolve-company] NSE search failed:", m);
  }

  if (debug.candidates.length === 0) {
    debug.durationMs = Date.now() - startedAt;
    const detail = debug.errors.length
      ? ` Errors: ${debug.errors.map((e) => `${e.source}: ${e.message}`).join("; ")}`
      : "";
    console.error(
      `[resolve-company] No candidates for "${query}".${detail}`,
    );
    return NextResponse.json(
      {
        profile: null,
        debug,
        error: `No matches found on BSE or NSE for "${query}".${detail}`,
      },
      { status: 200 },
    );
  }
  console.log(
    `[resolve-company] "${query}" -> ${debug.candidates.length} candidates (BSE: ${bseHits.length}, NSE: ${debug.candidates.length - bseHits.length})`,
  );

  debug.candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const best = debug.candidates[0];

  // Pair NSE/BSE entries representing the same company by name.
  const counterpart = debug.candidates.find(
    (c) =>
      c !== best &&
      c.exchange !== best.exchange &&
      similarName(c.name, best.name),
  );

  const nse = best.exchange === "NSE" ? best : counterpart?.exchange === "NSE" ? counterpart : undefined;
  const bse = best.exchange === "BSE" ? best : counterpart?.exchange === "BSE" ? counterpart : undefined;
  debug.matchedFrom = best.exchange;

  // 3. BSE header for sector/industry/website (only if we have a BSE code).
  let header: Awaited<ReturnType<typeof fetchBseHeader>> = null;
  if (bse?.bseCode) {
    try {
      header = await fetchBseHeader(bse.bseCode);
    } catch (e) {
      debug.errors.push({ source: "BSE header", message: msg(e) });
    }
  }

  const today = new Date();
  const fy = body.fiscalYear || fyLabel(fyForDate(today));
  const scope = scopeRangeForLastN(body.scopeYears ?? 5, today);

  const profile: CompanyProfile = {
    name: header?.CompName || best.name,
    ticker: nse?.ticker || bse?.ticker || best.ticker,
    nseSymbol: nse?.ticker,
    bseCode: bse?.bseCode || (best.exchange === "BSE" ? best.ticker : undefined),
    exchange: nse && bse ? "Both" : nse ? "NSE" : bse ? "BSE" : "Other",
    isin: header?.ISIN || best.isin || counterpart?.isin,
    sector: header?.Sector || "",
    industry: header?.Industry || "",
    website: header?.Website || undefined,
    irPage: header?.Website ? guessIrPage(header.Website) : undefined,
    fiscalYearConvention: "Apr–Mar (Indian FY)",
    fiscalYear: fy,
    scopePeriod: scope,
    lastUpdated: new Date().toISOString(),
  };

  debug.durationMs = Date.now() - startedAt;
  return NextResponse.json({ profile, debug });
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(ltd|limited|the|inc|llp|company)\b/g, "").trim();
}

function similarName(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function guessIrPage(website: string): string | undefined {
  try {
    const u = new URL(/^https?:\/\//.test(website) ? website : `https://${website}`);
    return `${u.origin}/investors`;
  } catch {
    return undefined;
  }
}
