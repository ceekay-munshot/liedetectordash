import type { PromiseRecord } from "../types";

// Step 5: For each promise whose test date has passed, fetch the actual
// outcome (from subsequent filings, financials, press releases) and update
// status + variance. Stub: pass-through.
export async function testOutcomes(
  promises: PromiseRecord[],
): Promise<PromiseRecord[]> {
  const now = Date.now();
  return promises.map((p) => {
    const due = new Date(p.testDate).getTime();
    if (due <= now && p.status === "Pending") {
      return { ...p, status: "In-progress" as PromiseRecord["status"] };
    }
    return p;
  });
}
