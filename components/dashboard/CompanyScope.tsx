import type { CompanyProfile } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export function CompanyScope({ company }: { company: CompanyProfile }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Company", value: company.name || "—" },
    {
      label: "NSE symbol",
      value: company.nseSymbol ? (
        <span className="font-mono">{company.nseSymbol}</span>
      ) : (
        <span className="text-ink-400">—</span>
      ),
    },
    {
      label: "BSE code",
      value: company.bseCode ? (
        <span className="font-mono">{company.bseCode}</span>
      ) : (
        <span className="text-ink-400">—</span>
      ),
    },
    {
      label: "Exchange(s)",
      value: <Badge tone="brand">{company.exchange}</Badge>,
    },
    {
      label: "ISIN",
      value: company.isin ? (
        <span className="font-mono">{company.isin}</span>
      ) : (
        <span className="text-ink-400">—</span>
      ),
    },
    { label: "Sector", value: company.sector || <span className="text-ink-400">—</span> },
    { label: "Industry", value: company.industry || <span className="text-ink-400">—</span> },
    {
      label: "Investor Relations",
      value: company.irPage ? (
        <a
          href={company.irPage}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-700 underline-offset-2 hover:underline"
        >
          {new URL(company.irPage).host}
        </a>
      ) : company.website ? (
        <a
          href={normalizeUrl(company.website)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-700 underline-offset-2 hover:underline"
        >
          {company.website}
        </a>
      ) : (
        <span className="text-ink-400">—</span>
      ),
    },
    {
      label: "Fiscal year convention",
      value: company.fiscalYearConvention || "—",
    },
    { label: "Fiscal year (in scope)", value: company.fiscalYear },
    {
      label: "Scope period",
      value: `${formatDate(company.scopePeriod.from)} → ${formatDate(
        company.scopePeriod.to,
      )}`,
    },
    { label: "Last updated", value: formatDate(company.lastUpdated) },
  ];

  return (
    <SectionCard
      id="company-scope"
      eyebrow="A · Company & Scope"
      title="Company & reporting scope"
      subtitle="Identity, coverage window, and disclosure universe under review."
      actions={<Badge tone="ok">Live</Badge>}
    >
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="rounded-xl border border-ink-200 bg-white p-4"
          >
            <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
              {r.label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">{r.value}</dd>
          </div>
        ))}
      </dl>
      {company.notes && (
        <p className="mt-4 text-sm text-ink-600">{company.notes}</p>
      )}
    </SectionCard>
  );
}

function normalizeUrl(s: string): string {
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
