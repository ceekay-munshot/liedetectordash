import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "brand"
  | "ok"
  | "warn"
  | "bad"
  | "muted"
  | "violet"
  | "sky";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  ok: "bg-ok-100 text-ok-500 border-emerald-200",
  warn: "bg-warn-100 text-warn-500 border-amber-200",
  bad: "bg-bad-100 text-bad-500 border-red-200",
  muted: "bg-ink-50 text-ink-500 border-ink-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pill border",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
