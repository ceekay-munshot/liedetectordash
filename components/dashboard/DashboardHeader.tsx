"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { CompanyProfile } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

export interface DashboardQuery {
  company: string;
  ticker: string;
  fiscalYear: string;
}

const FY_OPTIONS = ["FY22", "FY23", "FY24", "FY25", "FY26"];

export function DashboardHeader({
  company,
  lastUpdated,
  isRefreshing,
  onRefresh,
}: {
  company: CompanyProfile;
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: (q: DashboardQuery) => void;
}) {
  const [name, setName] = useState(company.name);
  const [ticker, setTicker] = useState(company.ticker);
  const [fiscalYear, setFiscalYear] = useState(company.fiscalYear);

  return (
    <header className="border-b border-ink-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-ink-900" aria-hidden />
              <span className="font-display text-base font-semibold tracking-tight text-ink-900">
                Walk-the-Talk Dashboard
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Track every promise. Score the reliability. Flag the patterns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-ink-500">
              <div>Last updated</div>
              <div className="font-medium text-ink-900">
                {formatRelative(lastUpdated)}
              </div>
            </div>
            <Button
              onClick={() => onRefresh({ company: name, ticker, fiscalYear })}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Refreshing…
                </>
              ) : (
                <>Refresh</>
              )}
            </Button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRefresh({ company: name, ticker, fiscalYear });
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Input
            name="company"
            label="Company"
            placeholder="e.g., Acme Bharat Industries Ltd."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            name="ticker"
            label="Ticker"
            placeholder="e.g., ACMEIN"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
          />
          <Select
            name="fiscalYear"
            label="Fiscal year"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            options={FY_OPTIONS.map((v) => ({ label: v, value: v }))}
          />
          <div className="flex items-end">
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={isRefreshing}
            >
              Apply & refresh
            </Button>
          </div>
        </form>
      </div>
    </header>
  );
}
