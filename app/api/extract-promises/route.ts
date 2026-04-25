import { NextResponse } from "next/server";
import type {
  ExtractionDebug,
  ParsedDocSummary,
  PromiseRecord,
  SourceDocument,
} from "@/lib/types";
import { parseDocument } from "@/lib/parsers";
import { extractPromisesFromText, priorityOf } from "@/lib/extractors/extract";
import { dedupePromises } from "@/lib/extractors/dedupe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  sources: SourceDocument[];
  maxDocs?: number; // safety cap per refresh
}

const DEFAULT_MAX_DOCS = 30;
const PARSE_BUDGET_MS = 90_000;

export async function POST(req: Request): Promise<NextResponse> {
  const startedAt = Date.now();
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const sources = Array.isArray(body.sources) ? body.sources : [];
  const maxDocs = Math.max(1, Math.min(body.maxDocs ?? DEFAULT_MAX_DOCS, 100));

  // Prioritize: transcripts > presentations > exchange filings > press releases > AR.
  const ordered = [...sources]
    .filter((s) => !!s.url)
    .sort((a, b) => {
      const pa = priorityOf(a);
      const pb = priorityOf(b);
      if (pa !== pb) return pb - pa;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, maxDocs);

  const debug: ExtractionDebug = {
    consideredDocs: ordered.length,
    parsedOk: 0,
    parsedFailed: 0,
    skipped: 0,
    promisesExtracted: 0,
    docsWithZeroPromises: 0,
    perType: {},
    errors: [],
  };

  const parsedDocs: ParsedDocSummary[] = [];
  const allPromises: PromiseRecord[] = [];

  for (const source of ordered) {
    if (Date.now() - startedAt > PARSE_BUDGET_MS) {
      debug.errors.push({
        source: source.id,
        message: `Skipped — parse budget exceeded (${PARSE_BUDGET_MS}ms).`,
      });
      parsedDocs.push({
        sourceId: source.id,
        url: source.url,
        parser: "skipped",
        status: "skipped",
        error: "Budget exceeded",
      });
      debug.skipped++;
      continue;
    }

    let parsed;
    try {
      parsed = await parseDocument(source);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      debug.errors.push({ source: source.id, message: msg });
      parsedDocs.push({
        sourceId: source.id,
        url: source.url,
        parser: "failed",
        status: "failed",
        error: msg,
      });
      debug.parsedFailed++;
      continue;
    }

    parsedDocs.push(parsed.summary);
    if (parsed.summary.status === "ok") debug.parsedOk++;
    else if (parsed.summary.status === "failed") debug.parsedFailed++;
    else debug.skipped++;
    if (parsed.summary.error && parsed.summary.status !== "ok") {
      debug.errors.push({ source: source.id, message: parsed.summary.error });
    }

    if (!parsed.text) {
      debug.docsWithZeroPromises++;
      continue;
    }

    const { promises } = extractPromisesFromText(parsed.text, source);
    if (promises.length === 0) debug.docsWithZeroPromises++;
    for (const p of promises) {
      debug.perType[p.promiseType] = (debug.perType[p.promiseType] ?? 0) + 1;
    }
    allPromises.push(...promises);
  }

  const deduped = dedupePromises(allPromises);
  debug.promisesExtracted = deduped.length;
  debug.durationMs = Date.now() - startedAt;

  return NextResponse.json({ promises: deduped, parsedDocs, debug });
}
