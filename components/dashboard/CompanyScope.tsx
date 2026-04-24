import type { CompanyProfile } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export function CompanyScope({ company }: { company: CompanyProfile }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Company", value: company.name },
    {
      label: "Ticker",
      value: (
        <span className="font-mono text-ink-900">
          {company.ticker}
          <span className="ml-2 text-xs text-ink-500">{company.exchange}</span>
        </span>
      ),
    },
    { label: "ISIN", value: company.isin ?? "—" },
    { label: "Sector", value: company.sector },
    { label: "Industry", value: company.industry },
    { label: "Fiscal year", value: company.fiscalYear },
    {
      label: "Scope period",
      value: `${formatDate(company.scopePeriod.from)} → ${formatDate(
        company.scopePeriod.to,
      )}`,
    },
  ];

  return (
    <SectionCard
      id="company-scope"
      eyebrow="A · Company & Scope"
      title="Company & reporting scope"
      subtitle="Identity, coverage window, and disclosure universe under review."
      actions={<Badge tone="brand">Active scope</Badge>}
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
