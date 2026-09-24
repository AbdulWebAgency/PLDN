import type { Concern, GoalOption } from "@/types/pldn";

/**
 * Concern catalogue. Deliberately document-type agnostic: employment terms are
 * covered, but so are lease/service/vendor concepts. New concerns can be added
 * here without touching the UI.
 */
export const CONCERNS: Concern[] = [
  {
    id: "notice-period",
    label: "Notice period",
    severity: "high",
    keywords: [
      "notice",
      "written notice",
      "notice period",
      "resign",
      "resignation",
      "days prior",
      "advance notice",
    ],
  },
  {
    id: "termination",
    label: "Termination",
    severity: "high",
    keywords: [
      "termination",
      "terminate",
      "cause",
      "dismissal",
      "end of the term",
      "expiry",
      "cancellation",
    ],
  },
  {
    id: "non-compete",
    label: "Non-compete & restrictions",
    severity: "high",
    keywords: [
      "non-compete",
      "non competition",
      "competing",
      "restrictive covenant",
      "solicit",
      "restricted period",
      "territory",
    ],
  },
  {
    id: "compensation",
    label: "Compensation & payment",
    severity: "medium",
    keywords: [
      "salary",
      "compensation",
      "bonus",
      "payment",
      "fees",
      "remuneration",
      "invoice",
      "rent",
    ],
  },
  {
    id: "intellectual-property",
    label: "Intellectual property",
    severity: "medium",
    keywords: [
      "intellectual property",
      "inventions",
      "work product",
      "copyright",
      "assignment of rights",
      "moral rights",
    ],
  },
  {
    id: "confidentiality",
    label: "Confidentiality",
    severity: "medium",
    keywords: [
      "confidential",
      "confidentiality",
      "non-disclosure",
      "proprietary information",
      "trade secret",
    ],
  },
  {
    id: "obligations",
    label: "My obligations",
    severity: "medium",
    keywords: [
      "shall",
      "duties",
      "obligations",
      "responsibilities",
      "covenants",
      "comply",
    ],
  },
  {
    id: "liability",
    label: "Liability & penalties",
    severity: "medium",
    keywords: [
      "liability",
      "indemnity",
      "indemnify",
      "penalty",
      "damages",
      "breach",
    ],
  },
  {
    id: "dispute",
    label: "Disputes & governing law",
    severity: "low",
    keywords: [
      "governing law",
      "jurisdiction",
      "arbitration",
      "dispute",
      "venue",
      "mediation",
    ],
  },
];

export const GOALS: GoalOption[] = [
  {
    id: "considering-signing",
    label: "I'm considering signing this",
    description: "Understand what you would be agreeing to before you commit.",
    suggestedConcerns: ["obligations", "compensation", "termination", "liability"],
  },
  {
    id: "considering-leaving",
    label: "I'm considering leaving or terminating an agreement",
    description: "Notice, exit conditions and what applies afterwards.",
    suggestedConcerns: ["notice-period", "termination", "non-compete", "compensation"],
  },
  {
    id: "understand-obligations",
    label: "I want to understand my obligations",
    description: "What you are required to do, and for how long.",
    suggestedConcerns: ["obligations", "confidentiality", "liability"],
  },
  {
    id: "understand-payment",
    label: "I want to understand payment or compensation",
    description: "Amounts, timing, bonuses and what happens on exit.",
    suggestedConcerns: ["compensation", "termination"],
  },
  {
    id: "check-restrictions",
    label: "I want to check for restrictions or important clauses",
    description: "Restrictive covenants, IP, confidentiality and penalties.",
    suggestedConcerns: ["non-compete", "intellectual-property", "confidentiality"],
  },
  {
    id: "something-else",
    label: "Something else",
    description: "Describe your situation in your own words.",
    suggestedConcerns: [],
  },
];

export function getConcern(id: string): Concern | undefined {
  return CONCERNS.find((c) => c.id === id);
}

export function customConcernId(label: string): string {
  return `custom:${label.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`;
}

/** Builds a Concern object for a free-text concern the user typed. */
export function toCustomConcern(label: string): Concern {
  return {
    id: customConcernId(label),
    label,
    severity: "medium",
    keywords: label
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  };
}
