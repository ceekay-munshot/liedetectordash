import type { Confidence, PromiseStatus, Severity } from "@/lib/types";
import { Badge } from "./Badge";

export function StatusPill({ status }: { status: PromiseStatus }) {
  const map: Record<PromiseStatus, { tone: Parameters<typeof Badge>[0]["tone"]; label: string }> = {
    Met: { tone: "ok", label: "Met" },
    "Partially Met": { tone: "warn", label: "Partially Met" },
    "In-progress": { tone: "brand", label: "In-progress" },
    Pending: { tone: "muted", label: "Pending" },
    Missed: { tone: "bad", label: "Missed" },
    Rescinded: { tone: "violet", label: "Rescinded" },
  };
  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ConfidencePill({ confidence }: { confidence: Confidence }) {
  const map: Record<Confidence, { tone: Parameters<typeof Badge>[0]["tone"]; label: string }> = {
    High: { tone: "ok", label: "High" },
    Medium: { tone: "warn", label: "Medium" },
    Low: { tone: "muted", label: "Low" },
  };
  const { tone, label } = map[confidence];
  return <Badge tone={tone}>{label}</Badge>;
}

export function SeverityPill({ severity }: { severity: Severity }) {
  const map: Record<Severity, { tone: Parameters<typeof Badge>[0]["tone"]; label: string }> = {
    low: { tone: "muted", label: "Low" },
    medium: { tone: "warn", label: "Medium" },
    high: { tone: "bad", label: "High" },
  };
  const { tone, label } = map[severity];
  return <Badge tone={tone}>{label}</Badge>;
}
