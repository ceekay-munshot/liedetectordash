import type { CompanyProfile } from "../types";

export interface ResolveCompanyInput {
  name?: string;
  ticker?: string;
  fiscalYear: string;
}

// Step 1: Resolve the company identity (name, ticker, ISIN, exchange, sector).
// Real implementation would hit NSE/BSE/MCA lookups; here we return a stub.
export async function resolveCompany(
  input: ResolveCompanyInput,
): Promise<CompanyProfile> {
  const today = new Date();
  return {
    name: input.name?.trim() || "Unknown Company",
    ticker: input.ticker?.trim().toUpperCase() || "UNKNOWN",
    exchange: "NSE",
    sector: "Unknown",
    industry: "Unknown",
    fiscalYear: input.fiscalYear,
    scopePeriod: {
      from: new Date(today.getFullYear() - 4, 3, 1).toISOString(),
      to: new Date(today.getFullYear(), 2, 31).toISOString(),
    },
    lastUpdated: today.toISOString(),
  };
}
