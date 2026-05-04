import {
  MUNS_ACCESS_TOKEN,
  MUNS_AGENT_LIBRARY_ID,
  MUNS_API_BASE,
} from "./config";

export interface RunMunsAgentInput {
  ticker: string;
  company: string;
}

export interface RunMunsAgentResult {
  raw: string;
  activeAnalystId?: string;
  analystOutputId?: string;
}

export const runMunsAgent = async (
  input: RunMunsAgentInput,
): Promise<RunMunsAgentResult> => {
  const today = new Date().toISOString().slice(0, 10);
  const ticker = input.ticker.trim();
  const company = input.company.trim();

  if (!ticker || !company) {
    throw new Error("Ticker and company are required.");
  }

  const response = await fetch(`${MUNS_API_BASE}/agents/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MUNS_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_library_id: MUNS_AGENT_LIBRARY_ID,
      metadata: {
        stock_ticker: ticker,
        stock_company_name: company,
        context_company_name: company,
        stock_country: "INDIA",
        to_date: today,
        timezone: "UTC",
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`MUNS request failed (${response.status}): ${raw.slice(0, 200)}`);
  }

  return {
    raw,
    activeAnalystId: response.headers.get("x-active-analyst-id") ?? undefined,
    analystOutputId: response.headers.get("x-analyst-output-id") ?? undefined,
  };
};
