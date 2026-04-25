import type {
  CompanyProfile,
  CredibilityScorecard,
  DashboardState,
  MissingSourceGap,
  PromiseRecord,
  RefreshJob,
  SourceDocument,
} from "../types";
import {
  mockConflicts,
  mockDashboardState,
  mockMonitor,
  mockRedFlags,
  mockRootCauses,
  mockTrend,
} from "../mockData";

export interface UpdateDashboardInput {
  company: CompanyProfile;
  sources: SourceDocument[];
  gaps: MissingSourceGap[];
  promises: PromiseRecord[];
  scorecard: CredibilityScorecard;
  lastRefresh?: RefreshJob;
}

// Stage 7: Assemble the dashboard state.
//   A · Company  -> live (input.company)
//   B · Sources  -> live (input.sources)
//   C · Gaps     -> live (input.gaps)
//   D · Promises -> live (input.promises)
//   E - I        -> still mock (intentional, per the staged plan).
export async function updateDashboard(
  input: UpdateDashboardInput,
): Promise<DashboardState> {
  return {
    company: input.company,
    sources: input.sources,
    gaps: input.gaps,
    promises: input.promises,
    scorecard: mockDashboardState.scorecard,
    trend: mockTrend,
    rootCauses: mockRootCauses,
    redFlags: mockRedFlags,
    monitorItems: mockMonitor,
    conflicts: mockConflicts,
    lastRefresh: input.lastRefresh,
  };
}
