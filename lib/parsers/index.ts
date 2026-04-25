import type { ParsedDocSummary, SourceDocument } from "../types";
import { fetchDocumentBytes, pickReferer } from "./fetch";
import { extractPdfText } from "./pdf";
import { extractHtmlText } from "./html";

export interface ParsedDoc {
  source: SourceDocument;
  text: string;
  summary: ParsedDocSummary;
}

function decideParser(contentType?: string, url?: string): "pdf" | "html" | "skipped" {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("pdf")) return "pdf";
  if (ct.includes("html") || ct.includes("text")) return "html";
  if (url && /\.pdf(\?|$)/i.test(url)) return "pdf";
  if (url && /\.html?(\?|$)/i.test(url)) return "html";
  return "skipped";
}

export async function parseDocument(
  source: SourceDocument,
): Promise<ParsedDoc> {
  const startedAt = Date.now();
  if (!source.url) {
    return {
      source,
      text: "",
      summary: {
        sourceId: source.id,
        url: source.url,
        parser: "skipped",
        status: "skipped",
        error: "No URL available for this source.",
        durationMs: Date.now() - startedAt,
      },
    };
  }

  const fetched = await fetchDocumentBytes(source.url, {
    referer: pickReferer(source.url),
    timeoutMs: 12_000,
    maxBytes: 25 * 1024 * 1024,
  });
  if (!fetched.ok || !fetched.bytes) {
    return {
      source,
      text: "",
      summary: {
        sourceId: source.id,
        url: source.url,
        contentType: fetched.contentType,
        byteLength: fetched.byteLength,
        parser: "failed",
        status: "failed",
        error: fetched.error || `HTTP ${fetched.status}`,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  const parser = decideParser(fetched.contentType, source.url);
  if (parser === "skipped") {
    return {
      source,
      text: "",
      summary: {
        sourceId: source.id,
        url: source.url,
        contentType: fetched.contentType,
        byteLength: fetched.byteLength,
        parser: "skipped",
        status: "skipped",
        error: `Unsupported content-type: ${fetched.contentType ?? "unknown"}`,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  if (parser === "pdf") {
    const r = await extractPdfText(fetched.bytes);
    return {
      source,
      text: r.text,
      summary: {
        sourceId: source.id,
        url: source.url,
        contentType: fetched.contentType,
        byteLength: fetched.byteLength,
        pageCount: r.pageCount,
        charCount: r.text.length,
        parser: "pdf",
        status: r.ok ? "ok" : "failed",
        error: r.error,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  // HTML
  const html = new TextDecoder("utf-8", { fatal: false }).decode(fetched.bytes);
  const text = extractHtmlText(html);
  return {
    source,
    text,
    summary: {
      sourceId: source.id,
      url: source.url,
      contentType: fetched.contentType,
      byteLength: fetched.byteLength,
      charCount: text.length,
      parser: "html",
      status: "ok",
      durationMs: Date.now() - startedAt,
    },
  };
}
