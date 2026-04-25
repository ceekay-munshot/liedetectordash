import type { BseAnnouncement } from "./classify";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const BASE_HEADERS: HeadersInit = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.bseindia.com/",
  Origin: "https://www.bseindia.com",
};

async function bseFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...BASE_HEADERS, ...(init?.headers as Record<string, string>) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`BSE ${res.status} ${res.statusText} for ${url}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`BSE non-JSON response for ${url}`);
  }
}

export interface BseSearchHit {
  Scrip_Cd: string;
  Scrip_Name: string;
  Status: string;
  Group_Name?: string;
  Industry?: string;
  ISIN_Number?: string;
  // BSE returns more — we keep only what we use.
}

export async function searchBseByText(query: string): Promise<BseSearchHit[]> {
  const url = `https://api.bseindia.com/BseIndiaAPI/api/PeerSmartSearch/w?Type=SS&text=${encodeURIComponent(query)}`;
  // PeerSmartSearch returns HTML in some cases; fall back to raw text parse.
  const res = await fetch(url, { headers: BASE_HEADERS, cache: "no-store" });
  if (!res.ok) throw new Error(`BSE search ${res.status}`);
  const txt = await res.text();
  // Parse hits out of the JSON-ish or HTML payload.
  // Newer endpoint sometimes returns a JSON array; older returns HTML.
  if (txt.trim().startsWith("[") || txt.trim().startsWith("{")) {
    try {
      const json = JSON.parse(txt);
      if (Array.isArray(json)) return json as BseSearchHit[];
      if (json?.Table && Array.isArray(json.Table))
        return json.Table as BseSearchHit[];
    } catch {
      /* fall through */
    }
  }
  // Heuristic HTML parse: rows like <a ... >NAME (CODE)</a>
  const hits: BseSearchHit[] = [];
  const re = /([A-Z0-9 .&'-]+?)\s*\((\d{6})\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(txt)) !== null) {
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
  // Public head endpoint used by BSE to render the company landing page.
  const url = `https://api.bseindia.com/BseIndiaAPI/api/ComHeadernew/w?quotetype=EQ&scripcode=${scripCd}&seriesid=`;
  try {
    const data = await bseFetch<Record<string, unknown>>(url);
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
  // BSE wants DD/MM/YYYY
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
      const data = await bseFetch<{ Table?: BseAnnouncement[] }>(url);
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
