import type {
  CompanyProfile,
  SourceDocument,
  MissingSourceGap,
  PromiseRecord,
  CredibilityTrend,
  RootCauseCluster,
  RedFlagPattern,
  InvestorMonitorItem,
  ConflictRecord,
  RefreshJob,
  DashboardState,
} from "./types";
import { computeScorecard } from "./scorecard";

// NOTE: All data below is synthetic placeholder content. No real company.

export const mockCompany: CompanyProfile = {
  name: "Acme Bharat Industries Ltd.",
  ticker: "ACMEIN",
  exchange: "NSE",
  isin: "INE000A00000",
  sector: "Industrials",
  industry: "Electronics Manufacturing Services",
  fiscalYear: "FY25",
  scopePeriod: { from: "2021-04-01", to: "2025-03-31" },
  lastUpdated: new Date().toISOString(),
  notes: "Scope includes last four fiscal years of public disclosures.",
};

export const mockSources: SourceDocument[] = [
  {
    id: "src-ar-fy23",
    type: "Annual Report",
    title: "Annual Report FY23",
    period: "FY23",
    publishedAt: "2023-08-10",
    ingestedAt: "2026-04-10T10:00:00Z",
    pages: 284,
    trustScore: 92,
  },
  {
    id: "src-call-q2fy24",
    type: "Earnings Call",
    title: "Q2 FY24 Earnings Call Transcript",
    period: "Q2 FY24",
    publishedAt: "2023-11-02",
    ingestedAt: "2026-04-10T10:05:00Z",
    pages: 22,
    trustScore: 80,
  },
  {
    id: "src-ip-q3fy24",
    type: "Investor Presentation",
    title: "Q3 FY24 Investor Presentation",
    period: "Q3 FY24",
    publishedAt: "2024-02-05",
    ingestedAt: "2026-04-10T10:06:00Z",
    pages: 34,
    trustScore: 74,
  },
  {
    id: "src-call-q4fy24",
    type: "Earnings Call",
    title: "Q4 FY24 Earnings Call Transcript",
    period: "Q4 FY24",
    publishedAt: "2024-05-15",
    ingestedAt: "2026-04-10T10:10:00Z",
    pages: 26,
    trustScore: 82,
  },
  {
    id: "src-ar-fy24",
    type: "Annual Report",
    title: "Annual Report FY24",
    period: "FY24",
    publishedAt: "2024-08-08",
    ingestedAt: "2026-04-10T10:12:00Z",
    pages: 302,
    trustScore: 94,
  },
  {
    id: "src-pr-capex",
    type: "Press Release",
    title: "Capex announcement: new facility",
    period: "Q3 FY24",
    publishedAt: "2024-01-18",
    ingestedAt: "2026-04-10T10:14:00Z",
    trustScore: 60,
  },
  {
    id: "src-call-q2fy25",
    type: "Earnings Call",
    title: "Q2 FY25 Earnings Call Transcript",
    period: "Q2 FY25",
    publishedAt: "2024-11-05",
    ingestedAt: "2026-04-10T10:18:00Z",
    pages: 24,
    trustScore: 83,
  },
];

export const mockGaps: MissingSourceGap[] = [
  {
    id: "gap-1",
    category: "Earnings Call",
    expected: "Q1 FY24 earnings call transcript",
    period: "Q1 FY24",
    reason: "Transcript not located on IR site.",
    severity: "medium",
    discoveredAt: "2026-04-10T10:20:00Z",
  },
  {
    id: "gap-2",
    category: "Regulatory Order",
    expected: "SEBI disposition (if any) related to related-party disclosures",
    period: "FY23",
    reason: "Awaiting MCA/SEBI search confirmation.",
    severity: "low",
    discoveredAt: "2026-04-10T10:20:30Z",
  },
  {
    id: "gap-3",
    category: "Investor Presentation",
    expected: "Q4 FY24 investor presentation PDF",
    period: "Q4 FY24",
    severity: "low",
    discoveredAt: "2026-04-10T10:21:00Z",
  },
];

export const mockPromises: PromiseRecord[] = [
  {
    id: "p-001",
    date: "2023-11-02",
    quarter: "Q2 FY24",
    sourceId: "src-call-q2fy24",
    sourceType: "Earnings Call",
    promiseType: "Revenue",
    promiseText: "Revenue growth guidance of 25-30% YoY for FY24",
    exactQuote:
      "We expect full-year revenue growth in the band of 25 to 30 percent for FY24, driven by order-book execution.",
    metric: "FY24 Revenue Growth YoY",
    target: "25-30%",
    testDate: "2024-05-15",
    confidence: "High",
    actualOutcome: "27.4% YoY",
    status: "Met",
    variancePct: 0,
    managementExplanation:
      "Execution as per schedule; marginal FX tailwind.",
    rootCauseTags: [],
    citations: [
      {
        id: "c-001",
        sourceId: "src-call-q2fy24",
        label: "Q2 FY24 Call, p.7",
        page: 7,
      },
    ],
  },
  {
    id: "p-002",
    date: "2024-01-18",
    quarter: "Q3 FY24",
    sourceId: "src-pr-capex",
    sourceType: "Press Release",
    promiseType: "Capex",
    promiseText: "Commissioning of new SMT line by Q1 FY25",
    exactQuote:
      "The new SMT line will be commissioned by the first quarter of FY25.",
    metric: "Commissioning date",
    target: "Q1 FY25",
    testDate: "2024-06-30",
    confidence: "Medium",
    actualOutcome: "Commissioned in Q2 FY25",
    status: "Partially Met",
    variancePct: -1,
    managementExplanation:
      "Delay cited due to imported equipment clearance at port.",
    rootCauseTags: ["supply-chain", "logistics"],
    citations: [
      {
        id: "c-002",
        sourceId: "src-pr-capex",
        label: "Capex PR",
      },
    ],
  },
  {
    id: "p-003",
    date: "2024-02-05",
    quarter: "Q3 FY24",
    sourceId: "src-ip-q3fy24",
    sourceType: "Investor Presentation",
    promiseType: "Margin",
    promiseText: "EBITDA margin expansion to 14-15% by FY25",
    exactQuote:
      "We are targeting EBITDA margins in the 14 to 15 percent range by FY25 as mix improves.",
    metric: "EBITDA margin",
    target: "14-15%",
    testDate: "2025-05-30",
    confidence: "Medium",
    status: "In-progress",
    rootCauseTags: [],
    citations: [
      {
        id: "c-003",
        sourceId: "src-ip-q3fy24",
        label: "IP Q3 FY24, slide 12",
        page: 12,
      },
    ],
  },
  {
    id: "p-004",
    date: "2024-05-15",
    quarter: "Q4 FY24",
    sourceId: "src-call-q4fy24",
    sourceType: "Earnings Call",
    promiseType: "Order Book",
    promiseText: "Order book to cross INR 5,000 Cr by end-FY25",
    exactQuote:
      "We expect the consolidated order book to cross the 5,000 crore mark by the end of FY25.",
    metric: "Order book (INR Cr)",
    target: "> 5,000",
    testDate: "2025-05-30",
    confidence: "High",
    status: "Pending",
    rootCauseTags: [],
    citations: [
      {
        id: "c-004",
        sourceId: "src-call-q4fy24",
        label: "Q4 FY24 Call, p.11",
        page: 11,
      },
    ],
  },
  {
    id: "p-005",
    date: "2023-08-10",
    quarter: "FY23",
    sourceId: "src-ar-fy23",
    sourceType: "Annual Report",
    promiseType: "Debt",
    promiseText: "Net debt to EBITDA below 1.0x by FY24",
    exactQuote:
      "We remain committed to bringing net debt to EBITDA below 1.0x by the end of FY24.",
    metric: "Net debt / EBITDA",
    target: "< 1.0x",
    testDate: "2024-05-15",
    confidence: "High",
    actualOutcome: "1.4x",
    status: "Missed",
    variancePct: 40,
    managementExplanation:
      "Working capital stretched due to inventory buildup ahead of launch.",
    rootCauseTags: ["working-capital", "inventory"],
    citations: [
      {
        id: "c-005",
        sourceId: "src-ar-fy23",
        label: "AR FY23, p.42",
        page: 42,
      },
    ],
  },
  {
    id: "p-006",
    date: "2024-11-05",
    quarter: "Q2 FY25",
    sourceId: "src-call-q2fy25",
    sourceType: "Earnings Call",
    promiseType: "Product Launch",
    promiseText: "Launch of new automotive product line in Q4 FY25",
    exactQuote:
      "The new automotive product line is on track for a Q4 FY25 launch.",
    metric: "Launch date",
    target: "Q4 FY25",
    testDate: "2025-03-31",
    confidence: "Medium",
    status: "In-progress",
    rootCauseTags: [],
    citations: [
      {
        id: "c-006",
        sourceId: "src-call-q2fy25",
        label: "Q2 FY25 Call, p.9",
        page: 9,
      },
    ],
  },
  {
    id: "p-007",
    date: "2023-08-10",
    quarter: "FY23",
    sourceId: "src-ar-fy23",
    sourceType: "Annual Report",
    promiseType: "Capacity",
    promiseText: "Capacity utilization to reach ~85% in FY24",
    exactQuote:
      "We expect capacity utilization to trend to approximately 85 percent over FY24.",
    metric: "Capacity utilization",
    target: "~85%",
    testDate: "2024-05-15",
    confidence: "Medium",
    actualOutcome: "78%",
    status: "Partially Met",
    variancePct: -8,
    managementExplanation: "Customer ramp slower than anticipated.",
    rootCauseTags: ["demand-timing", "customer-ramp"],
    citations: [
      {
        id: "c-007",
        sourceId: "src-ar-fy23",
        label: "AR FY23, p.57",
        page: 57,
      },
    ],
  },
  {
    id: "p-008",
    date: "2024-02-05",
    quarter: "Q3 FY24",
    sourceId: "src-ip-q3fy24",
    sourceType: "Investor Presentation",
    promiseType: "M&A",
    promiseText: "Evaluation of bolt-on M&A in EV components",
    exactQuote:
      "We are actively evaluating bolt-on acquisition opportunities in the EV components space.",
    metric: "Announced deals",
    target: "1+",
    testDate: "2025-03-31",
    confidence: "Low",
    status: "Pending",
    rootCauseTags: [],
    citations: [
      {
        id: "c-008",
        sourceId: "src-ip-q3fy24",
        label: "IP Q3 FY24, slide 21",
        page: 21,
      },
    ],
  },
];

export const mockTrend: CredibilityTrend = {
  series: [
    { period: "FY22", score: 62, hitRate: 55, missRate: 30 },
    { period: "FY23", score: 68, hitRate: 60, missRate: 25 },
    { period: "Q1 FY24", score: 66, hitRate: 58, missRate: 28 },
    { period: "Q2 FY24", score: 71, hitRate: 64, missRate: 22 },
    { period: "Q3 FY24", score: 69, hitRate: 62, missRate: 24 },
    { period: "Q4 FY24", score: 65, hitRate: 58, missRate: 30 },
    { period: "Q1 FY25", score: 67, hitRate: 61, missRate: 27 },
    { period: "Q2 FY25", score: 70, hitRate: 63, missRate: 24 },
  ],
};

export const mockRootCauses: RootCauseCluster[] = [
  {
    tag: "supply-chain",
    count: 3,
    severity: "medium",
    examplePromiseIds: ["p-002"],
    description: "Component availability and port clearance delays.",
  },
  {
    tag: "working-capital",
    count: 2,
    severity: "high",
    examplePromiseIds: ["p-005"],
    description: "Inventory buildup stretching cash cycle.",
  },
  {
    tag: "customer-ramp",
    count: 2,
    severity: "medium",
    examplePromiseIds: ["p-007"],
    description: "Slower than guided ramp at new customers.",
  },
  {
    tag: "logistics",
    count: 1,
    severity: "low",
    examplePromiseIds: ["p-002"],
  },
];

export const mockRedFlags: RedFlagPattern[] = [
  {
    id: "rf-1",
    name: "Repeated debt-reduction slippage",
    description:
      "Debt reduction timelines have slipped in two of the last three fiscal years.",
    severity: "high",
    firstDetected: "2024-05-15",
    evidencePromiseIds: ["p-005"],
  },
  {
    id: "rf-2",
    name: "Capex slippage pattern",
    description: "Capacity commissioning dates pushed by ~1 quarter twice.",
    severity: "medium",
    firstDetected: "2024-07-20",
    evidencePromiseIds: ["p-002"],
  },
  {
    id: "rf-3",
    name: "Vague margin language",
    description:
      "Margin guidance phrased in ranges without explicit drivers in last 2 presentations.",
    severity: "low",
    firstDetected: "2024-02-05",
    evidencePromiseIds: ["p-003"],
  },
];

export const mockMonitor: InvestorMonitorItem[] = [
  {
    id: "m-1",
    label: "Track FY25 EBITDA margin vs 14-15% guide",
    rationale:
      "Core profitability promise on investor presentation; must verify at FY25 results.",
    metric: "EBITDA margin (%)",
    targetDate: "2025-05-30",
    priority: "high",
    relatedPromiseIds: ["p-003"],
  },
  {
    id: "m-2",
    label: "Order book crossing INR 5,000 Cr",
    rationale: "Management has made this explicit at Q4 FY24 call.",
    metric: "Order book (INR Cr)",
    targetDate: "2025-05-30",
    priority: "high",
    relatedPromiseIds: ["p-004"],
  },
  {
    id: "m-3",
    label: "Automotive line launch in Q4 FY25",
    rationale: "Product launch commitment to watch.",
    metric: "Launch status",
    targetDate: "2025-03-31",
    priority: "medium",
    relatedPromiseIds: ["p-006"],
  },
  {
    id: "m-4",
    label: "EV components M&A announcement",
    rationale: "Soft guidance; watch for announcements or silence.",
    metric: "Announced deals",
    targetDate: "2025-03-31",
    priority: "low",
    relatedPromiseIds: ["p-008"],
  },
];

export const mockConflicts: ConflictRecord[] = [
  {
    id: "cf-1",
    topic: "SMT line commissioning date",
    detectedAt: "2024-05-16",
    severity: "medium",
    statements: [
      {
        sourceId: "src-pr-capex",
        statement: "Commissioning in Q1 FY25",
        date: "2024-01-18",
      },
      {
        sourceId: "src-call-q4fy24",
        statement: "Now expected in Q2 FY25",
        date: "2024-05-15",
      },
    ],
  },
];

export const mockRefreshJob: RefreshJob = {
  id: "job-0001",
  companyTicker: mockCompany.ticker,
  fiscalYear: mockCompany.fiscalYear,
  startedAt: "2026-04-10T10:00:00Z",
  completedAt: "2026-04-10T10:22:00Z",
  status: "completed",
  stages: [
    {
      stage: "resolveCompany",
      status: "done",
      startedAt: "2026-04-10T10:00:00Z",
      completedAt: "2026-04-10T10:00:02Z",
    },
    {
      stage: "fetchDocuments",
      status: "done",
      startedAt: "2026-04-10T10:00:02Z",
      completedAt: "2026-04-10T10:05:00Z",
    },
    {
      stage: "parseDocuments",
      status: "done",
      startedAt: "2026-04-10T10:05:00Z",
      completedAt: "2026-04-10T10:11:00Z",
    },
    {
      stage: "extractPromises",
      status: "done",
      startedAt: "2026-04-10T10:11:00Z",
      completedAt: "2026-04-10T10:17:00Z",
    },
    {
      stage: "testOutcomes",
      status: "done",
      startedAt: "2026-04-10T10:17:00Z",
      completedAt: "2026-04-10T10:20:00Z",
    },
    {
      stage: "computeScore",
      status: "done",
      startedAt: "2026-04-10T10:20:00Z",
      completedAt: "2026-04-10T10:21:30Z",
    },
    {
      stage: "updateDashboard",
      status: "done",
      startedAt: "2026-04-10T10:21:30Z",
      completedAt: "2026-04-10T10:22:00Z",
    },
  ],
};

export const mockDashboardState: DashboardState = {
  company: mockCompany,
  sources: mockSources,
  gaps: mockGaps,
  promises: mockPromises,
  scorecard: computeScorecard(mockPromises),
  trend: mockTrend,
  rootCauses: mockRootCauses,
  redFlags: mockRedFlags,
  monitorItems: mockMonitor,
  conflicts: mockConflicts,
  lastRefresh: mockRefreshJob,
};
