export const MUNS_AGENT_LIBRARY_ID = "613aa071-2079-40a8-bf9f-f9f8af448c20";

export const MUNS_API_BASE = "https://devde.muns.io";

// Birdnest is the public-facing search service for MUNS-indexed tickers.
export const BIRDNEST_API_BASE = "https://birdnest.muns.io";

export const MUNS_USER_INDEX = 124;

// Reads the MUNS access token from the environment. Set via
// `wrangler secret put MUNS_ACCESS_TOKEN` for Cloudflare, or via
// `.env.local` (MUNS_ACCESS_TOKEN=...) for local `next dev`.
export const getMunsAccessToken = (): string => {
  const token = process.env.MUNS_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "MUNS_ACCESS_TOKEN is not set. Add it via `wrangler secret put MUNS_ACCESS_TOKEN` or in .env.local.",
    );
  }
  return token;
};
