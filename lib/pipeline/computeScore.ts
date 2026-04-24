import type { CredibilityScorecard, PromiseRecord } from "../types";
import { computeScorecard } from "../scorecard";

// Step 6: Compute the credibility scorecard.
export async function computeScore(
  promises: PromiseRecord[],
): Promise<CredibilityScorecard> {
  return computeScorecard(promises);
}
