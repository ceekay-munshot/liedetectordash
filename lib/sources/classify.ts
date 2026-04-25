import type { SourceType } from "../types";
import { inferPeriodFromText, periodLabelForDate } from "./period";

export interface BseAnnouncement {
  // Subset of fields the BSE API returns; only what we use.
  SCRIP_CD?: string | number;
  SLONGNAME?: string;
  NEWSSUB?: string;
  HEADLINE?: string;
  CATEGORYNAME?: string;
  SUBCATNAME?: string;
  ATTACHMENTNAME?: string;
  NEWS_DT?: string; // "2024-05-15T12:34:00"
  PDFFLAG?: string | number;
  NSURL?: string; // direct URL
}

const PDF_BASE = "https://www.bseindia.com/xml-data/corpfiling/AttachLive/";

export function bseAttachmentUrl(a: BseAnnouncement): string | undefined {
  if (a.NSURL && /^https?:\/\//i.test(a.NSURL)) return a.NSURL;
  if (a.ATTACHMENTNAME) return `${PDF_BASE}${a.ATTACHMENTNAME}`;
  return undefined;
}

export function classifyBseAnnouncement(
  a: BseAnnouncement,
): { type: SourceType; confidence: "high" | "medium" | "low" } | null {
  const subj = (a.NEWSSUB || a.HEADLINE || "").toLowerCase();
  const cat = (a.CATEGORYNAME || "").toLowerCase();
  const sub = (a.SUBCATNAME || "").toLowerCase();
  const blob = `${cat} ${sub} ${subj}`;

  if (blob.includes("annual report")) return { type: "Annual Report", confidence: "high" };
  if (
    blob.includes("investor presentation") ||
    blob.includes("earnings presentation") ||
    blob.includes("results presentation") ||
    blob.includes("analyst presentation")
  )
    return { type: "Investor Presentation", confidence: "high" };
  if (
    blob.includes("conference call") ||
    blob.includes("earnings call") ||
    blob.includes("transcript") ||
    blob.includes("concall")
  )
    return { type: "Earnings Call", confidence: "high" };
  if (
    cat.includes("result") ||
    blob.includes("financial result") ||
    blob.includes("quarterly result") ||
    blob.includes("audited result") ||
    blob.includes("unaudited result")
  )
    return { type: "Financial Result", confidence: "high" };
  if (blob.includes("press release") || blob.includes("media release"))
    return { type: "Press Release", confidence: "medium" };
  if (blob.includes("draft red herring") || blob.includes("drhp") || blob.includes("rhp"))
    return { type: "DRHP/RHP", confidence: "high" };
  if (blob.includes("sebi order") || blob.includes("regulatory action"))
    return { type: "Regulatory Order", confidence: "medium" };

  // Generic exchange filing fallback (still primary, since it's the exchange itself).
  return { type: "Exchange Filing", confidence: "low" };
}

export function periodForBseAnnouncement(a: BseAnnouncement): string {
  const fromText = inferPeriodFromText(a.NEWSSUB || a.HEADLINE || "");
  if (fromText) return fromText;
  if (a.NEWS_DT) {
    const d = new Date(a.NEWS_DT);
    if (!isNaN(d.getTime())) return periodLabelForDate(d);
  }
  return "Unknown";
}
