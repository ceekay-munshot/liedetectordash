// NSE has bot mitigation that requires a cookie warmup. Best-effort: we try once,
// fall back gracefully if blocked. NSE results enrich a CompanyProfile but are
// never required.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const HEADERS: HeadersInit = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/",
};

export interface NseSearchHit {
  symbol: string;
  symbol_info: string; // company name
  isin?: string;
  activeSeries?: string[];
}

async function nseFetch<T>(url: string, cookies?: string): Promise<T> {
  const res = await fetch(url, {
    headers: cookies ? { ...HEADERS, Cookie: cookies } : HEADERS,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NSE ${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

async function warmupNseCookies(): Promise<string | undefined> {
  try {
    const res = await fetch("https://www.nseindia.com/", {
      headers: HEADERS,
      cache: "no-store",
    });
    const set = res.headers.get("set-cookie");
    if (!set) return undefined;
    return set
      .split(/,(?=[^ ])/)
      .map((c) => c.split(";")[0])
      .join("; ");
  } catch {
    return undefined;
  }
}

export async function searchNseByText(query: string): Promise<NseSearchHit[]> {
  const cookies = await warmupNseCookies();
  const url = `https://www.nseindia.com/api/search/autocomplete?q=${encodeURIComponent(query)}`;
  try {
    const data = await nseFetch<{ symbols?: NseSearchHit[] }>(url, cookies);
    return data.symbols ?? [];
  } catch {
    return [];
  }
}
