import { getCloudflareContext } from "@opennextjs/cloudflare";

export const MUNS_AGENT_LIBRARY_ID = "613aa071-2079-40a8-bf9f-f9f8af448c20";

export const MUNS_API_BASE = "https://devde.muns.io";

// Birdnest is the public-facing search service for MUNS-indexed tickers.
export const BIRDNEST_API_BASE = "https://birdnest.muns.io";

export const MUNS_USER_INDEX = 124;

// Resolves the MUNS access token at request time. Cloudflare exposes
// secrets only through the Worker `env` binding (not via process.env on
// every adapter), so try the binding first (sync, then async fallback)
// and fall back to `process.env` for local `next dev`.
export const getMunsAccessToken = async (): Promise<string> => {
  const key = "MUNS_ACCESS_TOKEN";

  if (typeof process.env[key] === "string" && process.env[key]) {
    return process.env[key] as string;
  }

  try {
    const env = getCloudflareContext().env as Record<string, unknown>;
    const val = env?.[key];
    if (typeof val === "string" && val) return val;
  } catch {
    // sync context not available — fall through
  }

  try {
    const env = (await getCloudflareContext({ async: true }))
      .env as Record<string, unknown>;
    const val = env?.[key];
    if (typeof val === "string" && val) return val;
  } catch {
    // async context not available — fall through
  }

  throw new Error(
    "MUNS_ACCESS_TOKEN is not set. Add it via `wrangler secret put MUNS_ACCESS_TOKEN` (Cloudflare) or .env.local (local dev).",
  );
};
