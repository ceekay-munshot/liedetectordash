import type { BseAnnouncement } from "./classify";

// BSE rejects requests that don't look like a real browser session. We warm up
// www.bseindia.com first to collect cookies, cache them in-process for ~25
// minutes, then forward the cookie jar on each api.bseindia.com call.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.bseindia.com/",
  Origin: "https://www.bseindia.com",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
};

const COOKIE_TTL_MS = 25 * 60 * 1000;
let cookieJar: { value: string; expiresAt: number } | null = null;

async function getBseCookies(force = false): Promise<string> {
  if (!force && cookieJar && cookieJar.expiresAt > Date.now()) {
    return cookieJar.value;
  }
  try {
    const res = await fetch("https://www.bseindia.com/", {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      cache: "no-store",
    });
    const setCookie = res.headers.get("set-cookie") ?? "";
    const cookie = setCookie
      .split(/,(?=[^ ])/)
      .map((c) => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");
    cookieJar = { value: cookie, expiresAt: Date.now() + COOKIE_TTL_MS };
    return cookie;
  } catch {
    cookieJar = null;
    return "";
  }
}

async function bseFetchText(url: string): Promise<string> {
  const cookie = await getBseCookies();
  const res = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) {
    // Cookie may have expired — refresh once and retry.
    await getBseCookies(true);
    const cookie2 = cookieJar?.value ?? "";
    const retry = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        ...(cookie2 ? { Cookie: cookie2 } : {}),
      },
      cache: "no-store",
    });
    if (!retry.ok) {
      throw new Error(`BSE ${retry.status} ${retry.statusText}`);
    }
    return retry.text();
  }
  if (!res.ok) {
    throw new Error(`BSE ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function bseFetchJson<T>(url: string): Promise<T> {
  const text = await bseFetchText(url);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`BSE non-JSON response (first 80 chars: ${text.slice(0, 80).replace(/\s+/g, " ")})`);
  }
}

export interface BseSearchHit {
  Scrip_Cd: string;
  Scrip_Name: string;
  Status: string;
  Group_Name?: string;
  Industry?: string;
  ISIN_Number?: string;
}

// BSE has multiple search endpoints with different shapes. We try the most
// stable one first and fall back if it doesn't return matches.
export async function searchBseByText(query: string): Promise<BseSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // 1. Stock_Search — JSON, most stable.
  try {
    const url = `https://api.bseindia.com/BseIndiaAPI/api/Stock_Search/w?Type=EQ&text=${encodeURIComponent(trimmed)}`;
    const data = await bseFetchJson<unknown>(url);
    const hits = parseSearchPayload(data);
    if (hits.length > 0) return hits;
  } catch {
    /* fall through */
  }

  // 2. PeerSmartSearch — older, sometimes returns HTML or different JSON.
  try {
    const url = `https://api.bseindia.com/BseIndiaAPI/api/PeerSmartSearch/w?Type=SS&text=${encodeURIComponent(trimmed)}`;
    const text = await bseFetchText(url);
    const trimmedText = text.trim();
    if (trimmedText.startsWith("[") || trimmedText.startsWith("{")) {
      try {
        const data = JSON.parse(trimmedText);
        const hits = parseSearchPayload(data);
        if (hits.length > 0) return hits;
      } catch {
        /* HTML fallback */
      }
    }
    return parseHtmlSearchPayload(trimmedText);
  } catch {
    return [];
  }
}

function parseSearchPayload(data: unknown): BseSearchHit[] {
  if (Array.isArray(data)) {
    return data
      .map(toHit)
      .filter((x): x is BseSearchHit => !!x);
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.Table)) {
      return (o.Table as unknown[])
        .map(toHit)
        .filter((x): x is BseSearchHit => !!x);
    }
  }
  return [];
}

function toHit(raw: unknown): BseSearchHit | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const code =
    (r.Scrip_Cd as string) ||
    (r.SCRIP_CD as string) ||
    (r.scrip_cd as string) ||
    (r.scripcode as string) ||
    "";
  const name =
    (r.Scrip_Name as string) ||
    (r.SCRIP_NAME as string) ||
    (r.scrip_name as string) ||
    (r.CompName as string) ||
    "";
  if (!code || !name) return null;
  return {
    Scrip_Cd: String(code),
    Scrip_Name: String(name).trim(),
    Status: (r.Status as string) || "Active",
    Industry: r.Industry as string | undefined,
    ISIN_Number: (r.ISIN_Number as string) || (r.ISIN as string) || undefined,
  };
}

function parseHtmlSearchPayload(html: string): BseSearchHit[] {
  const hits: BseSearchHit[] = [];
  const re = /([A-Z0-9 .&'-]+?)\s*\((\d{6})\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    hits.push({ Scrip_Cd: m[2], Scrip_Name: m[1].trim(), Status: "Active" });
  }
  return hits;
}

export interface BseCompanyHeader {
  CompName?: string;
  ISIN?: string;
  Industry?: string;
  Sector?: string;
  Website?: string;
}

export async function fetchBseHeader(scripCd: string): Promise<BseCompanyHeader | null> {
  const url = `https://api.bseindia.com/BseIndiaAPI/api/ComHeadernew/w?quotetype=EQ&scripcode=${scripCd}&seriesid=`;
  try {
    const data = await bseFetchJson<Record<string, unknown>>(url);
    return {
      CompName: (data.CompName as string) || (data.SLONGNAME as string) || undefined,
      ISIN: (data.ISIN as string) || undefined,
      Industry: (data.Industry as string) || (data.IndustryNew as string) || undefined,
      Sector: (data.Sector as string) || undefined,
      Website: (data.WebSiteAddress as string) || (data.Website as string) || undefined,
    };
  } catch {
    return null;
  }
}

function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export async function fetchBseAnnouncements(opts: {
  scripCd: string;
  from: Date;
  to: Date;
  maxPages?: number;
}): Promise<{ items: BseAnnouncement[]; pagesFetched: number; errors: string[] }> {
  const errors: string[] = [];
  const items: BseAnnouncement[] = [];
  const maxPages = opts.maxPages ?? 10;
  for (let page = 1; page <= maxPages; page++) {
    const url =
      `https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w` +
      `?pageno=${page}&strCat=-1&strPrevDate=${fmtDate(opts.from)}` +
      `&strScrip=${opts.scripCd}&strSearch=P&strToDate=${fmtDate(opts.to)}&strType=C`;
    try {
      const data = await bseFetchJson<{ Table?: BseAnnouncement[] }>(url);
      const batch = data.Table ?? [];
      if (batch.length === 0) {
        return { items, pagesFetched: page - 1, errors };
      }
      items.push(...batch);
      if (batch.length < 20) {
        return { items, pagesFetched: page, errors };
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
      return { items, pagesFetched: page - 1, errors };
    }
  }
  return { items, pagesFetched: maxPages, errors };
}
