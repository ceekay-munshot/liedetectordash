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

// Stage 7: Assemble the dashboard state. A/B/C are live (company, sources,
// gaps); D-I are still mock and intentionally pass through unchanged for now.
export async function updateDashboard(
  input: UpdateDashboardInput,
): Promise<DashboardState> {
  return {
    company: input.company,
    sources: input.sources,
    gaps: input.gaps,
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
