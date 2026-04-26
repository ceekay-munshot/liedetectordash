import type {
  DashboardState,
  MissingSourceGap,
  PromiseRecord,
  RefreshJob,
  RefreshStage,
  RefreshStageState,
  SourceDocument,
} from "../types";
import { resolveCompany } from "./resolveCompany";
import { fetchDocuments } from "./fetchDocuments";
import { parseDocuments } from "./parseDocuments";
import { extractPromises } from "./extractPromises";
import { testOutcomes } from "./testOutcomes";
import { computeScore } from "./computeScore";
import { updateDashboard } from "./updateDashboard";

export interface RunRefreshInput {
  company: string;
  ticker: string;
  fiscalYear: string;
  scopeYears?: number;
  maxParseDocs?: number;
}

export interface RunRefreshResult {
  state: DashboardState;
  job: RefreshJob;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeStage(stage: RefreshStage): RefreshStageState {
  return { stage, status: "pending" };
}

// End-to-end refresh. All seven stages are live:
//   1 resolveCompany      — BSE/NSE lookup
//   2 fetchDocuments      — BSE corporate announcements + gap analysis
//   3 parseDocuments      — visibility pass-through (real parsing happens in 4)
//   4 extractPromises     — server-side: parse PDFs/HTML, regex extraction,
//                           and inline outcome testing against later filings
//   5 testOutcomes        — date-based fallback for anything still Pending
//   6 computeScore        — credibility scorecard from tested promises
//   7 updateDashboard     — derive trend, root causes, red flags, monitor items
export async function runRefresh(
  input: RunRefreshInput,
  onProgress?: (job: RefreshJob) => void,
): Promise<RunRefreshResult> {
  const job: RefreshJob = {
    id: `job-${Date.now()}`,
    companyTicker: input.ticker,
    fiscalYear: input.fiscalYear,
    startedAt: nowIso(),
    status: "running",
    stages: [
      makeStage("resolveCompany"),
      makeStage("fetchDocuments"),
      makeStage("parseDocuments"),
      makeStage("extractPromises"),
      makeStage("testOutcomes"),
      makeStage("computeScore"),
      makeStage("updateDashboard"),
    ],
    debug: {},
  };

  const run = async <T>(stage: RefreshStage, fn: () => Promise<T>): Promise<T> => {
    const s = job.stages.find((x) => x.stage === stage)!;
    s.status = "running";
    s.startedAt = nowIso();
    job.currentStage = stage;
    onProgress?.({ ...job });
    try {
      const out = await fn();
      s.status = "done";
      s.completedAt = nowIso();
      onProgress?.({ ...job });
      return out;
    } catch (err) {
      s.status = "failed";
      s.completedAt = nowIso();
      s.notes = err instanceof Error ? err.message : String(err);
      job.status = "failed";
      onProgress?.({ ...job });
      throw err;
    }
  };

  const scopeYears = input.scopeYears ?? 5;

  // Stage 1.
  const resolved = await run("resolveCompany", () =>
    resolveCompany({
      name: input.company,
      ticker: input.ticker,
      fiscalYear: input.fiscalYear,
      scopeYears,
    }),
  );
  job.debug!.resolver = resolved.debug;
  if (!resolved.profile) {
    job.stages.find((x) => x.stage === "resolveCompany")!.notes =
      resolved.error || "Could not resolve company on BSE/NSE.";
    job.status = "failed";
    job.completedAt = nowIso();
    onProgress?.({ ...job });
    throw new Error(
      resolved.error || "Could not resolve company on BSE or NSE.",
    );
  }
  const company = resolved.profile;

  // Stage 2.
  let sources: SourceDocument[] = [];
  let gaps: MissingSourceGap[] = [];
  await run("fetchDocuments", async () => {
    const r = await fetchDocuments(company, scopeYears);
    sources = r.sources;
    gaps = r.gaps;
    job.debug!.discovery = r.debug;
    return r;
  });

  // Stage 3 (visibility only).
  await run("parseDocuments", () => parseDocuments(sources));

  // Stage 4 — live extraction.
  let promises: PromiseRecord[] = [];
  await run("extractPromises", async () => {
    const r = await extractPromises(sources, input.maxParseDocs ?? 30);
    promises = r.promises;
    job.debug!.extraction = r.debug;
    return r;
  });

  // Stage 5: most outcome-testing already happened inside extract-promises
  // (where the parsed text is in memory). This stage is a thin pass that
  // promotes any leftover "Pending" promises whose test date has passed to
  // "In-progress" for honest visibility.
  const tested = await run("testOutcomes", () => testOutcomes(promises));
  const scorecard = await run("computeScore", () => computeScore(tested));

  const state = await run("updateDashboard", () =>
    updateDashboard({
      company,
      sources,
      gaps,
      promises: tested,
      scorecard,
      lastRefresh: job,
    }),
  );

  job.status = "completed";
  job.completedAt = nowIso();
  job.currentStage = undefined;
  onProgress?.({ ...job });

  return { state: { ...state, lastRefresh: job }, job };
}

export {
  resolveCompany,
  fetchDocuments,
  parseDocuments,
  extractPromises,
  testOutcomes,
  computeScore,
  updateDashboard,
};
