// Indian fiscal year (Apr 1 -> Mar 31) helpers.

export function fyForDate(d: Date): number {
  // FY ending in March of year Y is "FYY". Date in Apr-Dec year Y => FY(Y+1).
  // Date in Jan-Mar year Y => FY(Y).
  return d.getUTCMonth() + 1 >= 4 ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
}

export function fyLabel(fyEndYear: number): string {
  return `FY${(fyEndYear % 100).toString().padStart(2, "0")}`;
}

export function quarterForDate(d: Date): 1 | 2 | 3 | 4 {
  const m = d.getUTCMonth() + 1;
  if (m >= 4 && m <= 6) return 1;
  if (m >= 7 && m <= 9) return 2;
  if (m >= 10 && m <= 12) return 3;
  return 4;
}

export function periodLabelForDate(d: Date): string {
  return `Q${quarterForDate(d)} ${fyLabel(fyForDate(d))}`;
}

export function lastNFiscalYears(n: number, today: Date = new Date()): number[] {
  const currentFy = fyForDate(today);
  const out: number[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(currentFy - i);
  return out;
}

export function fyToScopeRange(fyEndYear: number): { from: string; to: string } {
  const from = new Date(Date.UTC(fyEndYear - 1, 3, 1)).toISOString();
  const to = new Date(Date.UTC(fyEndYear, 2, 31)).toISOString();
  return { from, to };
}

export function scopeRangeForLastN(
  n: number,
  today: Date = new Date(),
): { from: string; to: string } {
  const fys = lastNFiscalYears(n, today);
  const start = fyToScopeRange(fys[0]).from;
  const end = fyToScopeRange(fys[fys.length - 1]).to;
  return { from: start, to: end };
}

// Try to extract a period label from arbitrary text that disclosures use.
// Examples: "Quarter ended June 30, 2024" -> "Q1 FY25"
//           "Year ended March 31, 2024" -> "FY24"
const MONTH_TO_NUM: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

export function inferPeriodFromText(text: string): string | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();

  // Annual: "year ended march 31, 2024" or "for the year ended 31 march 2024"
  const yearEnd =
    t.match(/year\s+ended[^0-9]*(\d{1,2})[^a-z0-9]*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[^0-9]*(\d{4})/) ||
    t.match(/year\s+ended[^a-z0-9]*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{4})/);
  if (yearEnd) {
    let month: number;
    let year: number;
    if (/^\d/.test(yearEnd[1])) {
      month = MONTH_TO_NUM[yearEnd[2]];
      year = parseInt(yearEnd[3], 10);
    } else {
      month = MONTH_TO_NUM[yearEnd[1]];
      year = parseInt(yearEnd[3], 10);
    }
    if (month === 3) return fyLabel(year);
  }

  // Quarter ended <Month> <Day>, <Year>
  const quarterEnd =
    t.match(/quarter\s+ended[^a-z0-9]*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{4})/) ||
    t.match(/quarter\s+ended[^0-9]*(\d{1,2})[^a-z0-9]*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[^0-9]*(\d{4})/);
  if (quarterEnd) {
    let month: number;
    let year: number;
    if (/^\d/.test(quarterEnd[1])) {
      month = MONTH_TO_NUM[quarterEnd[2]];
      year = parseInt(quarterEnd[3], 10);
    } else {
      month = MONTH_TO_NUM[quarterEnd[1]];
      year = parseInt(quarterEnd[3], 10);
    }
    const d = new Date(Date.UTC(year, month - 1, 15));
    return periodLabelForDate(d);
  }

  // "Q1 FY25", "Q2 FY 2025", "Q3FY24"
  const qfy = t.match(/q\s*([1-4])\s*fy\s*(\d{2,4})/);
  if (qfy) {
    const q = qfy[1];
    let y = parseInt(qfy[2], 10);
    if (y < 100) y = 2000 + y;
    return `Q${q} ${fyLabel(y)}`;
  }

  // "FY24", "FY 2024"
  const fy = t.match(/\bfy\s*(\d{2,4})\b/);
  if (fy) {
    let y = parseInt(fy[1], 10);
    if (y < 100) y = 2000 + y;
    return fyLabel(y);
  }

  return undefined;
}
