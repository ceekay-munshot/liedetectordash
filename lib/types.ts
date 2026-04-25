// Type-safe schemas for the Walk-the-Talk Dashboard.
// Keep these framework-agnostic so the same types power UI, pipeline, and tests.

export type Severity = "low" | "medium" | "high";
export type Confidence = "High" | "Medium" | "Low";

// ------------------------------
// A) Company & Scope
// ------------------------------
export type Exchange = "NSE" | "BSE" | "Both" | "Other";

export interface CompanyProfile {
  name: string;
  ticker: string; // primary ticker (NSE preferred, else BSE code)
  nseSymbol?: string;
  bseCode?: string;
  exchange: Exchange;
  isin?: string;
  sector: string;
  industry: string;
  website?: string;
  irPage?: string;
  fiscalYearConvention?: string; // e.g., "Apr–Mar"
  fiscalYear: string; // e.g., "FY25" — the year currently in scope
  scopePeriod: { from: string; to: string }; // ISO dates
  lastUpdated: string; // ISO
  notes?: string;
}

// ------------------------------
// B) Source Register
// ------------------------------
export type SourceType =
  | "Annual Report"
  | "Earnings Call"
  | "Investor Presentation"
  | "Financial Result"
  | "DRHP/RHP"
  | "Exchange Filing"
  | "Press Release"
  | "Regulatory Order"
  | "Interview"
  | "Broker Note";

export type SourceOrigin = "BSE" | "NSE" | "IR" | "Other";
export type Accessibility = "open" | "restricted" | "broken" | "unknown";

export interface SourceDocument {
  id: string;
  type: SourceType;
  title: string;
  period: string; // e.g., "Q2 FY24" or "FY23"
  publishedAt: string; // ISO
  ingestedAt: string; // ISO
  url?: string;
  originSite?: SourceOrigin;
  accessibility?: Accessibility;
  pages?: number;
  hash?: string;
  trustScore?: number; // 0-100
  notes?: string;
}

// ------------------------------
// C) Missing Sources & Gaps
// ------------------------------
export interface MissingSourceGap {
  id: string;
  category: SourceType;
  expected: string; // what should exist
  period: string;
  reason?: string;
  severity: Severity;
  discoveredAt: string; // ISO
}

// ------------------------------
// Shared: Citations
// ------------------------------
export interface Citation {
  id: string;
  sourceId: string;
  label: string; // e.g., "Concall Q2 FY24, p.7"
  page?: number;
  url?: string;
  quote?: string;
}

// ------------------------------
// D) Walk-the-Talk Chronological Tracking
// ------------------------------
export type PromiseType =
  | "Guidance"
  | "Capex"
  | "Capacity"
  | "Margin"
  | "Revenue"
  | "Order Book"
  | "Debt"
  | "Product Launch"
  | "M&A"
  | "ESG"
  | "Other";

export type PromiseStatus =
  | "Pending"
  | "In-progress"
  | "Met"
  | "Partially Met"
  | "Missed"
  | "Rescinded";

export interface PromiseRecord {
  id: string;
  date: string; // ISO - when promise was made
  quarter: string; // e.g., "Q2 FY24"
  sourceId: string;
  sourceType: SourceType;
  promiseType: PromiseType;
  promiseText: string; // short human-readable summary
  exactQuote: string; // verbatim
  metric: string; // e.g., "Revenue growth"
  target: string; // e.g., "25-30% YoY"
  testDate: string; // ISO - when we can verify
  confidence: Confidence;
  actualOutcome?: string;
  status: PromiseStatus;
  variancePct?: number; // +/-, null while pending
  managementExplanation?: string;
  rootCauseTags: string[];
  citations: Citation[];
}

// ------------------------------
// E) Credibility Scorecard
// ------------------------------
export interface ScoreBreakdown {
  type: PromiseType;
  score: number; // 0-100
  count: number;
  met: number;
  missed: number;
}

export interface CredibilityScorecard {
  overall: number; // 0-100
  hitRate: number; // 0-100
  onTimeRate: number; // 0-100
  precisionScore: number; // vague-vs-specific, 0-100
  recoveryScore: number; // explanation quality, 0-100
  transparencyScore: number; // disclosure of misses, 0-100
  sampleSize: number;
  asOf: string; // ISO
  breakdownByType: ScoreBreakdown[];
}

// ------------------------------
// F) Credibility Trend
// ------------------------------
export interface CredibilityTrendPoint {
  period: string; // e.g., "FY22", "Q2 FY24"
  score: number;
  hitRate: number;
  missRate: number;
}

export interface CredibilityTrend {
  series: CredibilityTrendPoint[];
}

// ------------------------------
// G) Root-Cause Map
// ------------------------------
export interface RootCauseCluster {
  tag: string;
  count: number;
  severity: Severity;
  examplePromiseIds: string[];
  description?: string;
}

// ------------------------------
// H) Red-Flag Pattern Detector
// ------------------------------
export interface RedFlagPattern {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  firstDetected: string; // ISO
  evidencePromiseIds: string[];
}

// ------------------------------
// I) Investor Checklist
// ------------------------------
export interface InvestorMonitorItem {
  id: string;
  label: string;
  rationale: string;
  metric: string;
  targetDate: string; // ISO
  priority: Severity;
  relatedPromiseIds: string[];
  done?: boolean;
}

// ------------------------------
// Conflicts (cross-statement contradictions)
// ------------------------------
export interface ConflictRecord {
  id: string;
  topic: string;
  detectedAt: string; // ISO
  severity: Severity;
  statements: {
    sourceId: string;
    statement: string;
    date: string; // ISO
  }[];
  resolution?: string;
}

// ------------------------------
// Refresh Pipeline
// ------------------------------
export type RefreshStage =
  | "resolveCompany"
  | "fetchDocuments"
  | "parseDocuments"
  | "extractPromises"
  | "testOutcomes"
  | "computeScore"
  | "updateDashboard";

export type StageStatus = "pending" | "running" | "done" | "failed";

export interface RefreshStageState {
  stage: RefreshStage;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface ResolverCandidate {
  exchange: "NSE" | "BSE";
  ticker: string;
  name: string;
  isin?: string;
  bseCode?: string;
  score?: number;
}

export interface ResolverDebug {
  query: { name?: string; ticker?: string };
  attempted: ("BSE" | "NSE")[];
  matchedFrom?: "BSE" | "NSE";
  candidates: ResolverCandidate[];
  errors: { source: string; message: string }[];
  durationMs?: number;
}

export interface DiscoveryDebug {
  fyRange: { from: string; to: string }; // ISO
  fiscalYears: string[]; // e.g., ["FY21","FY22",...]
  documentsFound: number;
  gapsFound: number;
  perYear: Record<string, { found: number; gaps: number }>;
  errors: { source: string; message: string }[];
  durationMs?: number;
}

export interface RefreshJob {
  id: string;
  companyTicker: string;
  fiscalYear: string;
  startedAt: string; // ISO
  completedAt?: string;
  status: "queued" | "running" | "completed" | "failed";
  currentStage?: RefreshStage;
  stages: RefreshStageState[];
  debug?: {
    resolver?: ResolverDebug;
    discovery?: DiscoveryDebug;
  };
}

// ------------------------------
// Aggregated Dashboard State
// ------------------------------
export interface DashboardState {
  company: CompanyProfile;
  sources: SourceDocument[];
  gaps: MissingSourceGap[];
  promises: PromiseRecord[];
  scorecard: CredibilityScorecard;
  trend: CredibilityTrend;
  rootCauses: RootCauseCluster[];
  redFlags: RedFlagPattern[];
  monitorItems: InvestorMonitorItem[];
  conflicts: ConflictRecord[];
  lastRefresh?: RefreshJob;
}
