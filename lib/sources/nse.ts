// NSE has aggressive bot mitigation. We do a 2-step warmup (root + a market
// page that registers _abck/bm_sz cookies) and cache cookies in-process for
// 25 minutes. Errors are surfaced rather than swallowed so the debug panel
// can show the user why NSE didn't return matches.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const HEADERS_BROWSER: Record<string, string> = {
  "User-Agent": UA,
  "Accept-Language": "en-US,en;q=0.9",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

const HEADERS_API: Record<string, string> = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

const COOKIE_TTL_MS = 25 * 60 * 1000;
let cookieJar: { value: string; expiresAt: number } | null = null;

function mergeCookies(existing: string, setHeader: string | null): string {
  if (!setHeader) return existing;
  const parsed = setHeader
    .split(/,(?=[^ ])/)
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean);
  if (parsed.length === 0) return existing;
  const map = new Map<string, string>();
  for (const c of existing.split("; ").filter(Boolean)) {
    const [k, ...rest] = c.split("=");
    map.set(k, rest.join("="));
  }
  for (const c of parsed) {
    const [k, ...rest] = c.split("=");
    map.set(k, rest.join("="));
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function warmupNseCookies(force = false): Promise<string> {
  if (!force && cookieJar && cookieJar.expiresAt > Date.now()) {
    return cookieJar.value;
  }
  let cookies = "";
  try {
    const r1 = await fetch("https://www.nseindia.com/", {
      headers: HEADERS_BROWSER,
      cache: "no-store",
    });
    cookies = mergeCookies(cookies, r1.headers.get("set-cookie"));
    const r2 = await fetch("https://www.nseindia.com/market-data/equity-stock-watch", {
      headers: { ...HEADERS_BROWSER, Cookie: cookies },
      cache: "no-store",
    });
    cookies = mergeCookies(cookies, r2.headers.get("set-cookie"));
    cookieJar = { value: cookies, expiresAt: Date.now() + COOKIE_TTL_MS };
    return cookies;
  } catch {
    cookieJar = null;
    return cookies;
  }
}

export interface NseSearchHit {
  symbol: string;
  symbol_info: string;
  isin?: string;
  activeSeries?: string[];
}

export interface NseSearchResult {
  hits: NseSearchHit[];
  error?: string;
}

export async function searchNseByText(query: string): Promise<NseSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { hits: [] };
  const cookies = await warmupNseCookies();
  if (!cookies) {
    return { hits: [], error: "NSE warmup failed (no cookies returned)" };
  }
  const url = `https://www.nseindia.com/api/search/autocomplete?q=${encodeURIComponent(trimmed)}`;
  try {
    const res = await fetch(url, {
      headers: { ...HEADERS_API, Cookie: cookies },
      cache: "no-store",
    });
    if (!res.ok) {
      // Refresh cookies once and retry.
      if (res.status === 401 || res.status === 403) {
        const fresh = await warmupNseCookies(true);
        const retry = await fetch(url, {
          headers: { ...HEADERS_API, Cookie: fresh },
          cache: "no-store",
        });
        if (!retry.ok) {
          return {
            hits: [],
            error: `NSE ${retry.status} ${retry.statusText} (after cookie refresh)`,
          };
        }
        const data = (await retry.json()) as { symbols?: NseSearchHit[] };
        return { hits: data.symbols ?? [] };
      }
      return { hits: [], error: `NSE ${res.status} ${res.statusText}` };
    }
    const data = (await res.json()) as { symbols?: NseSearchHit[] };
    return { hits: data.symbols ?? [] };
  } catch (e) {
    return { hits: [], error: e instanceof Error ? e.message : String(e) };
  }
}
