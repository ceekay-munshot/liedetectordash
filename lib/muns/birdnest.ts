import { BIRDNEST_API_BASE, MUNS_BEARER_TOKEN } from "./config";

// Birdnest returns a map keyed by ticker, with [country, name, industry] tuples.
export type BirdnestRawResponse = {
  data?: {
    results?: Record<string, [string, string, string] | string[]>;
  };
};

export interface BirdnestEntry {
  ticker: string;
  country: string;
  name: string;
  industry: string;
}

export const mapBirdnestEntry = (
  ticker: string,
  tuple: string[] | undefined,
): BirdnestEntry | null => {
  if (!ticker || !Array.isArray(tuple)) return null;
  const [country = "", name = "", industry = ""] = tuple;
  if (!name) return null;
  return { ticker: ticker.trim(), country, name, industry };
};

// Rank exact ticker match first, then prefix, then substring on ticker, then
// substring on name. Stable on ties via the original index.
export const rankBirdnestEntries = (
  entries: BirdnestEntry[],
  query: string,
): BirdnestEntry[] => {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries
    .map((entry, index) => ({ entry, index, score: scoreEntry(entry, q) }))
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map((row) => row.entry);
};

const scoreEntry = (entry: BirdnestEntry, q: string): number => {
  const ticker = entry.ticker.toLowerCase();
  const name = entry.name.toLowerCase();
  if (ticker === q) return 100;
  if (ticker.startsWith(q)) return 80;
  if (ticker.includes(q)) return 60;
  if (name.startsWith(q)) return 40;
  if (name.includes(q)) return 20;
  return 0;
};

export interface BirdnestSearchResult {
  results: BirdnestEntry[];
}

export const searchBirdnest = async (
  query: string,
  signal?: AbortSignal,
): Promise<BirdnestSearchResult> => {
  const trimmed = query.trim();
  if (!trimmed) return { results: [] };

  const response = await fetch(`${BIRDNEST_API_BASE}/stock/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MUNS_BEARER_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: trimmed }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Birdnest search failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  const json = (await response.json()) as BirdnestRawResponse;
  const raw = json?.data?.results ?? {};
  const entries: BirdnestEntry[] = [];
  for (const [ticker, tuple] of Object.entries(raw)) {
    const entry = mapBirdnestEntry(ticker, tuple);
    if (entry) entries.push(entry);
  }
  return { results: rankBirdnestEntries(entries, trimmed) };
};
