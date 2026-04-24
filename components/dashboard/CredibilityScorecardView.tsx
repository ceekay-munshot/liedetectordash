import type { CredibilityScorecard } from "@/lib/types";
import { SectionCard, Stat } from "@/components/ui/Card";
import { cn, formatDate } from "@/lib/utils";

function ScoreBar({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: number;
  tone?: "brand" | "ok" | "warn" | "bad";
}) {
  const barColor: Record<string, string> = {
    brand: "bg-brand-500",
    ok: "bg-ok-500",
    warn: "bg-warn-500",
    bad: "bg-bad-500",
  };
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink-600">{label}</span>
        <span className="text-xs font-semibold text-ink-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-ink-100">
        <div
          className={cn("h-2 rounded-full", barColor[tone])}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function CredibilityScorecardView({
  scorecard,
}: {
  scorecard: CredibilityScorecard;
}) {
  const overallTone =
    scorecard.overall >= 75 ? "ok" : scorecard.overall >= 55 ? "warn" : "bad";

  return (
    <SectionCard
      id="scorecard"
      eyebrow="E · Credibility Scorecard"
      title="How reliably does management walk the talk?"
      subtitle={`Computed on ${scorecard.sampleSize} tracked promises · as of ${formatDate(
        scorecard.asOf,
      )}`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label="Overall credibility"
          value={`${scorecard.overall}`}
          hint="0 - 100 scale"
          tone={overallTone}
        />
        <Stat
          label="Hit rate"
          value={`${scorecard.hitRate}%`}
          hint="Share fully met"
          tone="brand"
        />
        <Stat
          label="On-time rate"
          value={`${scorecard.onTimeRate}%`}
          hint="Within ±5% of target"
          tone="brand"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <div className="section-title mb-3">Signal breakdown</div>
          <div className="space-y-3">
            <ScoreBar label="Precision" value={scorecard.precisionScore} />
            <ScoreBar label="Recovery" value={scorecard.recoveryScore} tone="warn" />
            <ScoreBar
              label="Transparency"
              value={scorecard.transparencyScore}
              tone="ok"
            />
          </div>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <div className="section-title mb-3">By promise type</div>
          <div className="overflow-hidden rounded-lg border border-ink-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Met</th>
                  <th className="px-3 py-2">Missed</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {scorecard.breakdownByType.map((row) => (
                  <tr key={row.type}>
                    <td className="px-3 py-2 text-ink-900">{row.type}</td>
                    <td className="px-3 py-2 font-semibold text-ink-900">
                      {row.score}
                    </td>
                    <td className="px-3 py-2 text-ok-500">{row.met}</td>
                    <td className="px-3 py-2 text-bad-500">{row.missed}</td>
                    <td className="px-3 py-2 text-ink-700">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
