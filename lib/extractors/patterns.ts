// Central regex registry for promise extraction. Patterns are intentionally
// conservative — we'd rather miss a vague promise than fabricate a number.

import type { PromiseType } from "../types";

// 1. Forward-looking signals. Presence of any one is necessary (but not
// sufficient) for a sentence to be a promise candidate. The downstream
// extractor additionally requires a numeric target OR a time horizon.
export const FORWARD_LOOKING = new RegExp(
  [
    // Modal/auxiliary forward verbs anywhere in the sentence.
    "\\b(?:will|would|shall|should|going\\s+to)\\b",
    // Explicit forward-looking verbs (with or without a leading subject).
    "\\b(?:expects?|expected\\s+to|is\\s+expected\\s+to|anticipat(?:e|es|ed|ing)|targets?|targeting|guides?|guiding|guidance|outlook|trajectory|aim(?:s|ing)?|intend(?:s|ing|ed)?|plan(?:s|ned|ning)?|estimate(?:s|d)?|project(?:s|ed|ing)?|forecast(?:s|ed|ing)?|believe(?:s|d)?|see(?:s|n|ing)?\\s+(?:revenue|margin|growth|demand))\\b",
    // Constructions like "to cross/reach/exceed/achieve/launch/commission".
    "\\bto\\s+(?:cross|reach|exceed|achieve|deliver|launch|ramp|commission|hit|surpass|attain)\\b",
    // Status / cadence cues.
    "\\b(?:on\\s+track|in\\s+the\\s+pipeline|scheduled|going\\s+forward|in\\s+the\\s+coming\\s+(?:quarter|year|period|months))\\b",
    // Horizon-anchored hints (these are themselves forward-looking).
    "\\bby\\s+(?:end\\s+of\\s+)?(?:q\\s*[1-4]|h\\s*[12]|fy\\s*\\d{0,4}|march|june|september|december)",
    "\\b(?:no\\s+impact|transitory|tailwind|headwind\\s+behind\\s+us)\\b",
    "\\b(?:confident|comfortable)\\s+(?:of|that|in)\\b",
  ].join("|"),
  "i",
);

// 2. Promise type classification. First match wins.
export const TYPE_PATTERNS: { type: PromiseType; metric: string; rx: RegExp }[] = [
  { type: "Margin", metric: "EBITDA margin", rx: /\bebitda\s*margin\b/i },
  { type: "Margin", metric: "EBIT margin", rx: /\bebit\s*margin\b/i },
  { type: "Margin", metric: "Gross margin", rx: /\bgross\s*margin\b/i },
  { type: "Margin", metric: "PAT margin", rx: /\bpat\s*margin\b/i },
  { type: "Margin", metric: "Operating margin", rx: /\boperating\s*margin\b/i },
  { type: "Revenue", metric: "Revenue / topline", rx: /\b(?:revenue|topline|sales|turnover)\b/i },
  { type: "Order Book", metric: "Order book / intake", rx: /\border\s*(?:book|inflow|intake|conversion|pipeline)\b/i },
  { type: "Capex", metric: "Capex", rx: /\b(?:capex|capital\s*expenditure)\b/i },
  { type: "Capacity", metric: "Capacity / utilization", rx: /\b(?:capacity|utili[sz]ation|commission(?:ed|ing)?|sop|start\s*of\s*production|ramp[\s-]*up)\b/i },
  { type: "Debt", metric: "Net debt / leverage", rx: /\b(?:net\s*debt|leverage|debt\s*to\s*ebitda|deleverag(?:e|ing))\b/i },
  { type: "Product Launch", metric: "Product launch", rx: /\b(?:product\s*launch|new\s*product|rollout|go-?live|launch(?:ing)?)\b/i },
  { type: "M&A", metric: "M&A / acquisition", rx: /\b(?:acquisition|m&a|bolt[-\s]*on|inorganic|merger)\b/i },
  { type: "Guidance", metric: "PAT / Profit", rx: /\b(?:pat|profit\s+after\s+tax|net\s*profit|bottomline)\b/i },
  { type: "Guidance", metric: "ROCE / ROE", rx: /\b(?:roce|return\s+on\s+capital\s+employed|roe|return\s+on\s+equity)\b/i },
  { type: "Guidance", metric: "Working capital / cash cycle", rx: /\b(?:working\s*capital|cash\s*conversion\s*cycle|days\s*sales\s*outstanding)\b/i },
];

// 3. Numeric target patterns. We capture the exact match for the `target` field.
export const TARGET_PATTERNS: { rx: RegExp; unit: string }[] = [
  { rx: /\b(\d{1,3}(?:\.\d+)?\s*-\s*\d{1,3}(?:\.\d+)?)\s*%/i, unit: "%" },
  { rx: /\b(\d{1,3}(?:\.\d+)?)\s*%/i, unit: "%" },
  {
    rx: /\b(?:rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d+)?)\s*(crore|cr|lakh|lac|million|mn|billion|bn)\b/i,
    unit: "INR",
  },
  {
    rx: /\b(?:usd|us\$|\$)\s*([\d,]+(?:\.\d+)?)\s*(million|mn|billion|bn)?\b/i,
    unit: "USD",
  },
  { rx: /\b(\d+(?:\.\d+)?)x\b/i, unit: "x" },
];

// 4. Time-horizon patterns.
export const HORIZON_PATTERNS: RegExp[] = [
  /\bby\s+end\s+of\s+(q[1-4]\s*fy\s*\d{2,4})/i,
  /\bby\s+(q[1-4]\s*fy\s*\d{2,4})/i,
  /\bin\s+(q[1-4]\s*fy\s*\d{2,4})/i,
  /\b(q[1-4]\s*fy\s*\d{2,4})/i,
  /\b(?:by|in|for)\s+(fy\s*\d{2,4})\b/i,
  /\b(fy\s*\d{2,4})\b/i,
  /\bby\s+(?:end\s+of\s+)?(?:march|june|september|december)\s+(\d{4})/i,
  /\b(?:next|coming)\s+(quarter|year|fiscal\s+year|fy|2\s+years|12\s+months|18\s+months|24\s+months)/i,
  /\b(?:in\s+the\s+next|over\s+the\s+next|within\s+the\s+next)\s+(\d+\s+(?:months|quarters|years))/i,
  /\b(h[12]\s*fy\s*\d{2,4})/i,
];

// 5. False-positive guards. Reject if the sentence is past-tense reportage.
export const PAST_REPORTAGE = new RegExp(
  [
    "^(?:in\\s+(?:q[1-4]|fy)|during\\s+(?:q[1-4]|fy)|the\\s+quarter|the\\s+year)\\s",
    "\\b(?:reported|recorded|delivered|achieved|posted|registered)\\b\\s+(?:a|an|the)?\\s*\\d",
  ].join("|"),
  "i",
);

// 6. Speaker attribution. Looks for a "Name [- Title]:" pattern preceding the sentence.
export const SPEAKER_PATTERN = /\b([A-Z][a-zA-Z.]+\s+[A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+)?)\s*[-–—]?\s*(?:Chairman|MD|Managing Director|CEO|CFO|COO|President|Director|Promoter|Vice Chairman)\b/;
