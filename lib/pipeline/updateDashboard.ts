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
  mockGaps,
  mockMonitor,
  mockRedFlags,
  mockRootCauses,
  mockTrend,
} from "../mockData";

export interface UpdateDashboardInput {
  company: CompanyProfile;
  sources: SourceDocument[];
  promises: PromiseRecord[];
  scorecard: CredibilityScorecard;
  gaps?: MissingSourceGap[];
  lastRefresh?: RefreshJob;
}

// Step 7: Assemble the dashboard state that the UI renders.
export async function updateDashboard(
  input: UpdateDashboardInput,
): Promise<DashboardState> {
  return {
    company: input.company,
    sources: input.sources,
    gaps: input.gaps ?? mockGaps,
    promises: input.promises,
    scorecard: input.scorecard,
    trend: mockTrend,
    rootCauses: mockRootCauses,
    redFlags: mockRedFlags,
    monitorItems: mockMonitor,
    conflicts: mockConflicts,
    lastRefresh: input.lastRefresh,
  };
}
