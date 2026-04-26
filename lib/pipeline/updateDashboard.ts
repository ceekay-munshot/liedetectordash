import type {
  CompanyProfile,
  CredibilityScorecard,
  DashboardState,
  MissingSourceGap,
  PromiseRecord,
  RefreshJob,
  SourceDocument,
} from "../types";
import { computeTrend } from "../insights/trend";
import { computeRootCauseClusters } from "../insights/rootCauses";
import { detectRedFlags } from "../insights/redFlags";
import { computeMonitorItems } from "../insights/monitorItems";

export interface UpdateDashboardInput {
  company: CompanyProfile;
  sources: SourceDocument[];
  gaps: MissingSourceGap[];
  promises: PromiseRecord[];
  scorecard: CredibilityScorecard;
  lastRefresh?: RefreshJob;
}

// Stage 7: Assemble the dashboard state. Every section is now derived from
// live inputs:
//   A · Company       -> input.company
//   B · Sources       -> input.sources
//   C · Gaps          -> input.gaps
//   D · Promises      -> input.promises (status / variance / explanation
//                        already populated upstream by the outcome-testing
//                        pass inside /api/extract-promises)
//   E · Scorecard     -> input.scorecard (computed from tested promises)
//   F · Trend         -> per-quarter scorecards from input.promises
//   G · Root causes   -> clustered from rootCauseTags on input.promises
//   H · Red flags     -> heuristics over input.promises
//   I · Monitor list  -> derived from active (Pending / In-progress) promises
export async function updateDashboard(
  input: UpdateDashboardInput,
): Promise<DashboardState> {
  return {
    company: input.company,
    sources: input.sources,
    gaps: input.gaps,
    promises: input.promises,
    scorecard: input.scorecard,
    trend: computeTrend(input.promises),
    rootCauses: computeRootCauseClusters(input.promises),
    redFlags: detectRedFlags(input.promises),
    monitorItems: computeMonitorItems(input.promises),
    conflicts: [],
    lastRefresh: input.lastRefresh,
  };
}
