import type {
  DashboardState,
  MissingSourceGap,
  RefreshJob,
  RefreshStage,
  RefreshStageState,
  SourceDocument,
} from "../types";
import { mockPromises } from "../mockData";
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

// End-to-end refresh. Stage 1 (resolveCompany) and Stage 2 (fetchDocuments) are
// live; Stage 3-6 still operate on mock content for now. updateDashboard wires
// real A/B/C with mock D-I.
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

  // Stage 1: live resolver.
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

  // Stage 2: live document discovery.
  let sources: SourceDocument[] = [];
  let gaps: MissingSourceGap[] = [];
  await run("fetchDocuments", async () => {
    const r = await fetchDocuments(company, scopeYears);
    sources = r.sources;
    gaps = r.gaps;
    job.debug!.discovery = r.debug;
    return r;
  });

  // Stages 3-6: still mock for now (extraction intelligence comes next step).
  await run("parseDocuments", () => parseDocuments(sources));
  const promises = await run("extractPromises", () => extractPromises([]));
  const tested = await run("testOutcomes", () => testOutcomes(promises));
  const scorecard = await run("computeScore", () => computeScore(tested));

  void mockPromises; // keep mock import warm for clarity

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
