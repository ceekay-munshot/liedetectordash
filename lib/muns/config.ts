// MUNS access token. Replace this string when it expires (consumer-product
// style; one file to swap). The JWT's `exp` is checked server-side by MUNS.
export const MUNS_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZWE5ZGMyYi0xZDBmLTQ2MzctOGE2Ny0wM2VhNzFmMGYyY2YiLCJlbWFpbCI6Im5hZGFtc2FsdWphQGdtYWlsLmNvbSIsIm9yZ0lkIjoiMSIsImF1dGhvcml0eSI6ImFkbWluIiwiaWF0IjoxNzc3OTgzNTUzLCJleHAiOjE3Nzg0MTU1NTN9.IQKdGF0H3E_KzCy5h5dyTAIFgSMkbHQ5PEtNjtEVY_c";

export const MUNS_AGENT_LIBRARY_ID = "613aa071-2079-40a8-bf9f-f9f8af448c20";

export const MUNS_API_BASE = "https://devde.muns.io";

// Birdnest is the public-facing search service for MUNS-indexed tickers.
// Swap the bearer token here when it expires.
export const BIRDNEST_API_BASE = "https://birdnest.muns.io";

export const MUNS_BEARER_TOKEN = MUNS_ACCESS_TOKEN;
