import type {
  DashboardState,
  RefreshJob,
  RefreshStage,
  RefreshStageState,
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

// End-to-end refresh skeleton. Each stage is separately testable.
// Intentionally linear; parallelization can be added later.
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

  const company = await run("resolveCompany", () =>
    resolveCompany({
      name: input.company,
      ticker: input.ticker,
      fiscalYear: input.fiscalYear,
    }),
  );
  const sources = await run("fetchDocuments", () => fetchDocuments(company));
  const parsed = await run("parseDocuments", () => parseDocuments(sources));
  const promises = await run("extractPromises", () => extractPromises(parsed));
  const tested = await run("testOutcomes", () => testOutcomes(promises));
  const scorecard = await run("computeScore", () => computeScore(tested));
  const state = await run("updateDashboard", () =>
    updateDashboard({
      company,
      sources,
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
