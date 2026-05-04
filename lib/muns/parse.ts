export interface MunsTable {
  columns: string[];
  rows: string[][];
}

export interface MunsSection {
  id: string;
  heading: string;
  prose: string;
  tables: MunsTable[];
}

export interface MunsParsedResponse {
  sections: MunsSection[];
  ans: string;
  conclusion?: string;
  summary?: string;
  raw: string;
}

const ANS_RE = /<ans>([\s\S]*?)<\/ans>/i;
const CONCLUSION_RE = /<conclusion>([\s\S]*?)<\/conclusion>/i;
const SUMMARY_RE = /<summary>([\s\S]*?)<\/summary>/i;

const splitRow = (line: string): string[] =>
  line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.replace(/\*\*/g, "").trim());

const isSeparatorLine = (line: string): boolean =>
  /^\s*\|?[\s|\-:]+\|?\s*$/.test(line) && line.includes("-");

const stripHttpHeaders = (body: string): string => {
  if (!/^HTTP\/\d/i.test(body)) return body;
  // HTTP headers use CRLF; the header/body separator is CRLFCRLF. Some captures
  // (e.g. curl into a file) leave LF-only newlines in the body, which would
  // make a plain "\n\n" search match inside the body itself.
  const crlfIdx = body.indexOf("\r\n\r\n");
  if (crlfIdx >= 0) return body.slice(crlfIdx + 4);
  const lfIdx = body.indexOf("\n\n");
  return lfIdx > 0 ? body.slice(lfIdx + 2) : body;
};

const extractTables = (body: string): { prose: string; tables: MunsTable[] } => {
  const lines = body.split("\n");
  const tables: MunsTable[] = [];
  const proseLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1] ?? "";
    const looksLikeHeader = line.includes("|");
    const looksLikeSeparator = isSeparatorLine(next);

    if (looksLikeHeader && looksLikeSeparator) {
      const columns = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length) {
        const row = lines[i];
        const trimmed = row.trim();
        if (!trimmed || !row.includes("|") || trimmed.startsWith("#")) break;
        const cells = splitRow(row);
        if (cells.length < columns.length) {
          while (cells.length < columns.length) cells.push("");
        } else if (cells.length > columns.length) {
          cells.length = columns.length;
        }
        rows.push(cells);
        i += 1;
      }
      tables.push({ columns, rows });
      continue;
    }

    proseLines.push(line);
    i += 1;
  }

  return { prose: proseLines.join("\n").trim(), tables };
};

const splitSections = (ans: string): MunsSection[] => {
  const parts = ans
    .split(/(?=^#\s)/m)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    const { prose, tables } = extractTables(ans);
    return [{ id: "section-0", heading: "Output", prose, tables }];
  }

  return parts.map((part, index) => {
    const headingMatch = part.match(/^#\s+(.+)/);
    const heading = headingMatch ? headingMatch[1].trim() : `Section ${index + 1}`;
    const body = part.replace(/^#\s+.+\n?/, "");
    const { prose, tables } = extractTables(body);
    return { id: `section-${index}`, heading, prose, tables };
  });
};

export const parseMunsResponse = (body: string): MunsParsedResponse => {
  const stripped = stripHttpHeaders(body);
  const ansMatch = stripped.match(ANS_RE);
  const ans = (ansMatch ? ansMatch[1] : stripped).trim();
  const conclusionMatch = stripped.match(CONCLUSION_RE);
  const summaryMatch = stripped.match(SUMMARY_RE);

  return {
    sections: splitSections(ans),
    ans,
    conclusion: conclusionMatch ? conclusionMatch[1].trim() : undefined,
    summary: summaryMatch ? summaryMatch[1].trim() : undefined,
    raw: body,
  };
};
