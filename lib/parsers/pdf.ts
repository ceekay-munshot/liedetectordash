// PDF text extraction using pdf-parse. Node-only (Buffer + native deps).

export interface PdfExtractResult {
  ok: boolean;
  text: string;
  pageCount: number;
  error?: string;
}

export async function extractPdfText(buf: ArrayBuffer): Promise<PdfExtractResult> {
  try {
    // Lazy import: pdf-parse pulls in pdfjs at module load and prints noise.
    const mod = (await import("pdf-parse")) as unknown as {
      default?: (b: Buffer) => Promise<{ text: string; numpages: number }>;
    } & ((b: Buffer) => Promise<{ text: string; numpages: number }>);
    const pdfParse = (mod.default ?? mod) as (
      b: Buffer,
    ) => Promise<{ text: string; numpages: number }>;
    const data = await pdfParse(Buffer.from(buf));
    return {
      ok: true,
      text: data.text || "",
      pageCount: data.numpages || 0,
    };
  } catch (e) {
    return {
      ok: false,
      text: "",
      pageCount: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
