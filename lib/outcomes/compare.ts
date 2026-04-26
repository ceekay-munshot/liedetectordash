// Compare a parsed target to a numeric actual and return a status + variance.

import type { PromiseStatus } from "../types";
import type { ParsedTarget } from "./target";

export interface ComparisonResult {
  status: PromiseStatus;
  variancePct?: number; // signed; positive = above target
}

const PARTIAL_TOL = 0.15; // 15% slack qualifies as Partially Met

export function compareToTarget(
  target: ParsedTarget,
  actual: number,
): ComparisonResult {
  switch (target.kind) {
    case "range": {
      if (target.lo === undefined || target.hi === undefined) return { status: "In-progress" };
      const mid = (target.lo + target.hi) / 2;
      const variancePct = round1(((actual - mid) / mid) * 100);
      if (actual >= target.lo && actual <= target.hi) {
        return { status: "Met", variancePct };
      }
      const slackLo = target.lo * (1 - PARTIAL_TOL);
      const slackHi = target.hi * (1 + PARTIAL_TOL);
      if (actual >= slackLo && actual <= slackHi) {
        return { status: "Partially Met", variancePct };
      }
      return { status: "Missed", variancePct };
    }
    case "threshold-above": {
      if (target.value === undefined) return { status: "In-progress" };
      const variancePct = round1(((actual - target.value) / target.value) * 100);
      if (actual >= target.value) return { status: "Met", variancePct };
      if (actual >= target.value * (1 - PARTIAL_TOL)) return { status: "Partially Met", variancePct };
      return { status: "Missed", variancePct };
    }
    case "threshold-below": {
      if (target.value === undefined) return { status: "In-progress" };
      const variancePct = round1(((actual - target.value) / target.value) * 100);
      if (actual <= target.value) return { status: "Met", variancePct };
      if (actual <= target.value * (1 + PARTIAL_TOL)) return { status: "Partially Met", variancePct };
      return { status: "Missed", variancePct };
    }
    case "approx":
    case "point": {
      if (target.value === undefined) return { status: "In-progress" };
      const diff = (actual - target.value) / target.value;
      const variancePct = round1(diff * 100);
      if (Math.abs(diff) <= 0.05) return { status: "Met", variancePct };
      if (Math.abs(diff) <= PARTIAL_TOL) return { status: "Partially Met", variancePct };
      return { status: "Missed", variancePct };
    }
    case "qualitative":
    default:
      return { status: "In-progress" };
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
