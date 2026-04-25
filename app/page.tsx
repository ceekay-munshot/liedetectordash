"use client";

import { useState } from "react";
import type { DashboardState, RefreshJob } from "@/lib/types";
import { mockDashboardState } from "@/lib/mockData";
import { runRefresh } from "@/lib/pipeline";

import { DashboardHeader, type DashboardQuery } from "@/components/dashboard/DashboardHeader";
import { SectionNav } from "@/components/dashboard/SectionNav";
import { CompanyScope } from "@/components/dashboard/CompanyScope";
import { SourceRegister } from "@/components/dashboard/SourceRegister";
import { MissingSourcesGaps } from "@/components/dashboard/MissingSourcesGaps";
import { WalkTheTalkTable } from "@/components/dashboard/WalkTheTalkTable";
import { CredibilityScorecardView } from "@/components/dashboard/CredibilityScorecardView";
import { CredibilityTrendView } from "@/components/dashboard/CredibilityTrendView";
import { RootCauseMap } from "@/components/dashboard/RootCauseMap";
import { RedFlagPatterns } from "@/components/dashboard/RedFlagPatterns";
import { InvestorChecklist } from "@/components/dashboard/InvestorChecklist";
import { DebugPanel } from "@/components/dashboard/DebugPanel";

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(mockDashboardState);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLive, setHasLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async (q: DashboardQuery) => {
    setIsRefreshing(true);
    setError(null);
    let latestJob: RefreshJob | undefined;
    const onProgress = (job: RefreshJob) => {
      latestJob = job;
      // Stream stage updates into state so the Debug panel reflects what's
      // happening in real time, including resolver/discovery telemetry.
      setState((s) => ({ ...s, lastRefresh: job }));
    };
    try {
      const { state: next } = await runRefresh(
        {
          company: q.company,
          ticker: q.ticker,
          fiscalYear: q.fiscalYear,
        },
        onProgress,
      );
      setState(next);
      setHasLive(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      // Make sure the last job (with its debug + errors) ends up in state so
      // the Debug panel shows what failed, instead of stale mock data.
      if (latestJob) {
        setState((s) => ({ ...s, lastRefresh: latestJob }));
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const lastUpdated =
    state.lastRefresh?.completedAt ??
    state.company.lastUpdated ??
    new Date().toISOString();

  return (
    <div className="min-h-screen bg-ink-50">
      <DashboardHeader
        company={state.company}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      <SectionNav />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <LivenessBanner hasLive={hasLive} error={error} />

        <DebugPanel job={state.lastRefresh} />

        <CompanyScope company={state.company} />
        <SourceRegister sources={state.sources} />
        <MissingSourcesGaps gaps={state.gaps} />
        <WalkTheTalkTable promises={state.promises} />
        <CredibilityScorecardView scorecard={state.scorecard} />
        <CredibilityTrendView trend={state.trend} />
        <RootCauseMap clusters={state.rootCauses} />
        <RedFlagPatterns flags={state.redFlags} />
        <InvestorChecklist items={state.monitorItems} />

        <footer className="pt-6 text-center text-[11px] text-ink-400">
          Sections A · B · C are live (BSE primary). D – I still on mock data.
          Not investment advice.
        </footer>
      </main>
    </div>
  );
}

function LivenessBanner({
  hasLive,
  error,
}: {
  hasLive: boolean;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-bad-100/40 p-4 text-sm text-bad-500">
        <div className="font-semibold">Refresh failed</div>
        <div className="mt-0.5 text-bad-500/90">{error}</div>
        <div className="mt-1 text-xs text-bad-500/80">
          Showing last known state. Check the debug panel below for details.
        </div>
      </div>
    );
  }
  if (!hasLive) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-warn-100/50 p-4 text-sm text-warn-500">
        <span className="font-semibold">Sample data shown.</span>{" "}
        <span className="text-warn-500/90">
          Enter a company / ticker and click Refresh to load live data for
          sections A, B, C, D from BSE/NSE plus on-the-fly PDF extraction.
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-emerald-200 bg-ok-100/60 p-4 text-sm text-ok-500">
      <span className="font-semibold">Live:</span>{" "}
      <span className="text-ok-500/90">
        Sections A · B · C · D are populated from primary sources and
        rule-based extraction. Sections E – I still use mock data in this step.
      </span>
    </div>
  );
}
