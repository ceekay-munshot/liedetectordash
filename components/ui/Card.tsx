import { cn } from "@/lib/utils";

export function SectionCard({
  id,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("card p-6", className)}>
      <header className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && <div className="section-title">{eyebrow}</div>}
          <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "ok" | "warn" | "bad" | "brand";
}) {
  const toneColor: Record<string, string> = {
    neutral: "text-ink-900",
    ok: "text-ok-500",
    warn: "text-warn-500",
    bad: "text-bad-500",
    brand: "text-brand-700",
  };
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-semibold", toneColor[tone])}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-500">{hint}</div>}
    </div>
  );
}
