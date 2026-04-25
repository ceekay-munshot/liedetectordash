// Fetch a remote document with conservative defaults: short timeout,
// content-length cap, browser-style headers (BSE/NSE block default UAs).

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const DEFAULT_HEADERS: HeadersInit = {
  "User-Agent": UA,
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

export interface FetchedDoc {
  ok: boolean;
  status: number;
  contentType?: string;
  bytes?: ArrayBuffer;
  error?: string;
  byteLength: number;
  durationMs: number;
}

export async function fetchDocumentBytes(
  url: string,
  opts: { timeoutMs?: number; maxBytes?: number; referer?: string } = {},
): Promise<FetchedDoc> {
  const startedAt = Date.now();
  const timeoutMs = opts.timeoutMs ?? 12_000;
  const maxBytes = opts.maxBytes ?? 25 * 1024 * 1024;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: opts.referer
        ? { ...DEFAULT_HEADERS, Referer: opts.referer }
        : DEFAULT_HEADERS,
      redirect: "follow",
      cache: "no-store",
    });
    clearTimeout(timer);
    const contentType = res.headers.get("content-type") || undefined;
    const lengthHeader = parseInt(res.headers.get("content-length") || "0", 10);
    if (lengthHeader && lengthHeader > maxBytes) {
      return {
        ok: false,
        status: res.status,
        contentType,
        error: `Content too large: ${lengthHeader} bytes`,
        byteLength: lengthHeader,
        durationMs: Date.now() - startedAt,
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        contentType,
        error: `${res.status} ${res.statusText}`,
        byteLength: 0,
        durationMs: Date.now() - startedAt,
      };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > maxBytes) {
      return {
        ok: false,
        status: res.status,
        contentType,
        error: `Body exceeded cap: ${buf.byteLength} bytes`,
        byteLength: buf.byteLength,
        durationMs: Date.now() - startedAt,
      };
    }
    return {
      ok: true,
      status: res.status,
      contentType,
      bytes: buf,
      byteLength: buf.byteLength,
      durationMs: Date.now() - startedAt,
    };
  } catch (e) {
    clearTimeout(timer);
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
      byteLength: 0,
      durationMs: Date.now() - startedAt,
    };
  }
}

export function pickReferer(url: string): string | undefined {
  if (/bseindia\.com/i.test(url)) return "https://www.bseindia.com/";
  if (/nseindia\.com/i.test(url)) return "https://www.nseindia.com/";
  return undefined;
}
