import type { CompanyProfile, ResolverDebug } from "../types";

export interface ResolveCompanyInput {
  name?: string;
  ticker?: string;
  fiscalYear: string;
  scopeYears?: number;
}

export interface ResolveCompanyResult {
  profile: CompanyProfile | null;
  debug: ResolverDebug;
  error?: string;
}

// Stage 1: Resolve company identity from BSE/NSE via the server-side route.
// Throws only on transport errors. Returns { profile: null, debug, error } when
// the company can't be resolved, so the pipeline can record the gap cleanly.
export async function resolveCompany(
  input: ResolveCompanyInput,
): Promise<ResolveCompanyResult> {
  const res = await fetch("/api/resolve-company", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      ticker: input.ticker,
      fiscalYear: input.fiscalYear,
      scopeYears: input.scopeYears ?? 5,
    }),
  });
  const data = (await res.json()) as ResolveCompanyResult;
  return data;
}
