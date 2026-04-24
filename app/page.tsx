"use client";

import { useState } from "react";
import type { DashboardState } from "@/lib/types";
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

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(mockDashboardState);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (q: DashboardQuery) => {
    setIsRefreshing(true);
    try {
      const { state: next } = await runRefresh({
        company: q.company,
        ticker: q.ticker,
        fiscalYear: q.fiscalYear,
      });
      // Preserve the previous company's human-authored notes if any.
      setState({
        ...next,
        company: { ...next.company, notes: state.company.notes },
      });
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
          Base scaffold · mock data · do not treat as investment advice.
        </footer>
      </main>
    </div>
  );
}
