import { getCloudflareContext } from "@opennextjs/cloudflare";

export const MUNS_AGENT_LIBRARY_ID = "613aa071-2079-40a8-bf9f-f9f8af448c20";

export const MUNS_API_BASE = "https://devde.muns.io";

// Birdnest is the public-facing search service for MUNS-indexed tickers.
export const BIRDNEST_API_BASE = "https://birdnest.muns.io";

export const MUNS_USER_INDEX = 124;

// On Cloudflare Workers, secrets set via `wrangler secret put` (or the
// dashboard) are only exposed on the Worker `env` binding — they are NOT
// mirrored into `process.env`. OpenNext surfaces that binding through
// `getCloudflareContext().env`. For local `next dev`, that helper throws,
// so we fall back to `process.env` (use `.env.local`).
export const getMunsAccessToken = (): string => {
  let token: string | undefined;
  try {
    const env = getCloudflareContext().env as { MUNS_ACCESS_TOKEN?: string };
    token = env?.MUNS_ACCESS_TOKEN;
  } catch {
    // Not running inside a Cloudflare request context.
  }
  if (!token) token = process.env.MUNS_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "MUNS_ACCESS_TOKEN is not set. Add it via `wrangler secret put MUNS_ACCESS_TOKEN` (Cloudflare) or .env.local (local dev).",
    );
  }
  return token;
};
