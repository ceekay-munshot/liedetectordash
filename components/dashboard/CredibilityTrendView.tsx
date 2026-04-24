import type { CredibilityTrend } from "@/lib/types";
import { SectionCard } from "@/components/ui/Card";

// Lightweight inline SVG sparkline/area chart so we don't pull in a chart lib.
export function CredibilityTrendView({ trend }: { trend: CredibilityTrend }) {
  const width = 720;
  const height = 180;
  const padding = { top: 16, right: 16, bottom: 28, left: 32 };
  const series = trend.series;

  const maxScore = 100;
  const minScore = 0;
  const xStep =
    (width - padding.left - padding.right) / Math.max(series.length - 1, 1);

  const toX = (i: number) => padding.left + i * xStep;
  const toY = (v: number) =>
    padding.top +
    ((maxScore - v) / (maxScore - minScore)) *
      (height - padding.top - padding.bottom);

  const linePath = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.score)}`)
    .join(" ");

  const areaPath =
    `${linePath} L ${toX(series.length - 1)} ${height - padding.bottom} L ${toX(0)} ${
      height - padding.bottom
    } Z`;

  const latest = series[series.length - 1];
  const first = series[0];
  const delta = latest && first ? latest.score - first.score : 0;

  return (
    <SectionCard
      id="trend"
      eyebrow="F · Credibility Trend"
      title="Trajectory of management reliability"
      subtitle="Rolling credibility score across recent fiscal periods."
      actions={
        <div className="text-xs text-ink-600">
          Change vs start:{" "}
          <span
            className={
              delta >= 0 ? "font-semibold text-ok-500" : "font-semibold text-bad-500"
            }
          >
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        </div>
      }
    >
      <div className="rounded-xl border border-ink-200 bg-white p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label="Credibility trend chart"
        >
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f63f5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2f63f5" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((g) => (
            <g key={g}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={toY(g)}
                y2={toY(g)}
                stroke="#eef0f4"
                strokeWidth={1}
              />
              <text
                x={padding.left - 6}
                y={toY(g) + 3}
                textAnchor="end"
                fontSize={10}
                fill="#8e97a7"
              >
                {g}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#trendFill)" />
          <path
            d={linePath}
            stroke="#2f63f5"
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {series.map((p, i) => (
            <g key={p.period}>
              <circle
                cx={toX(i)}
                cy={toY(p.score)}
                r={3}
                fill="#fff"
                stroke="#2f63f5"
                strokeWidth={2}
              />
              <text
                x={toX(i)}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#5b6477"
              >
                {p.period}
              </text>
            </g>
          ))}
        </svg>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {series.slice(-4).map((p) => (
            <div
              key={p.period}
              className="rounded-lg border border-ink-200 bg-ink-50/40 p-3"
            >
              <div className="text-[11px] uppercase tracking-wider text-ink-500">
                {p.period}
              </div>
              <div className="mt-1 text-base font-semibold text-ink-900">
                {p.score}
              </div>
              <div className="text-[11px] text-ink-500">
                Hit {p.hitRate}% · Miss {p.missRate}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
