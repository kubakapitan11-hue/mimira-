import { Archetype, DimensionKey } from "./types";

interface Indicator {
  pattern: RegExp;
  weight: number;
  label: string;
  evidenceText?: string;
}

interface DimensionRules {
  positive: Indicator[];
  negative: Indicator[];
  missingHint: string;
}

interface DimensionOutcome {
  score: number;
  evidence: string;
  gaps: string;
  matchedPositive: Indicator[];
  matchedNegative: Indicator[];
}

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

function findSnippet(text: string, pattern: RegExp): string | null {
  const sentences = text.split(SENTENCE_SPLIT);
  for (const sentence of sentences) {
    if (pattern.test(sentence)) return sentence.trim();
  }
  const match = text.match(pattern);
  return match ? match[0] : null;
}

function scoreDimension(
  text: string,
  rules: DimensionRules,
  extraMatched: Indicator[] = []
): DimensionOutcome {
  const matchedPositive: Indicator[] = [...extraMatched];
  const matchedNegative: Indicator[] = [];

  for (const indicator of rules.positive) {
    if (indicator.pattern.test(text)) matchedPositive.push(indicator);
  }
  for (const indicator of rules.negative) {
    if (indicator.pattern.test(text)) matchedNegative.push(indicator);
  }

  const raw =
    1 +
    matchedPositive.reduce((sum, i) => sum + i.weight, 0) +
    matchedNegative.reduce((sum, i) => sum + i.weight, 0);
  const score = Math.max(0, Math.min(10, Math.round(raw * 10) / 10));

  const evidence = matchedPositive.length
    ? matchedPositive
        .map((i) => `"${i.evidenceText || findSnippet(text, i.pattern) || i.label}" (${i.label})`)
        .slice(0, 3)
        .join(" | ")
    : "No explicit textual evidence found for this dimension.";

  const gapsParts: string[] = [];
  if (matchedNegative.length) {
    gapsParts.push(
      matchedNegative.map((i) => i.label).join("; ")
    );
  }
  if (matchedPositive.length < 2) {
    gapsParts.push(rules.missingHint);
  }
  const gaps = gapsParts.join(" ");

  return { score, evidence, gaps, matchedPositive, matchedNegative };
}

const RULES: Record<DimensionKey, DimensionRules> = {
  outcome_delivery: {
    positive: [
      {
        pattern: /won\b[^.]{0,40}\b(tender|contract|claim|case|filing)s?/i,
        weight: 3,
        label: "verifiable completed outcome (won/resolved/filed)",
      },
      {
        pattern: /(resolved|reconciled|completed|cleared)\s+(the |a |an )?(claim|case|filing|balance sheet|dispute)/i,
        weight: 3,
        label: "verifiable completed outcome",
      },
      {
        pattern: /(generat(es|ing)|produc(es|ing)|creates?)\s+(a |the )?(complete|full|final|ready-to-(file|submit))\s+\w*\s*(bid|document|report|filing|brief|contract)/i,
        weight: 2.5,
        label: "produces a finished work product, not just a tool",
      },
      {
        pattern: /handles? the (full|entire|whole)\s+\w*\s*(lifecycle|process|workflow)/i,
        weight: 2,
        label: "owns the end-to-end lifecycle",
      },
      {
        pattern: /support(s|ing) (the )?submission/i,
        weight: 1,
        label: "supports final delivery/submission step",
      },
      {
        pattern: /deliver(s|ed)?\s+(a |an |the )?(result|outcome)/i,
        weight: 3,
        label: "explicitly frames offering as a delivered result",
      },
    ],
    negative: [
      {
        pattern: /(self[- ]serve|do[- ]it[- ]yourself|use (our|the) (platform|tool|software|dashboard) to)/i,
        weight: -3,
        label: "self-serve tool framing — client does the work",
      },
      {
        pattern: /software licen[sc]e/i,
        weight: -3,
        label: "sells a software licence",
      },
    ],
    missingHint:
      "Look for a specific completed deliverable (won tender, filed claim, reconciled report) rather than access to a tool.",
  },

  human_in_the_loop: {
    positive: [
      {
        pattern: /(team of |a |an )?(lawyer|attorney|accountant|procurement specialist|claims handler|underwriter|auditor|recruiter|case manager|clinician|adjuster)s?\s+(verif(y|ies|ied)|review(s|ed)?|sign(s|ed)?[- ]off|approve(s|d)?)/i,
        weight: 4,
        label: "named expert role verifies/signs off",
      },
      {
        pattern: /human[- ]in[- ]the[- ]loop/i,
        weight: 3,
        label: "explicit human-in-the-loop framing",
      },
      {
        pattern: /(verified|reviewed|checked|approved)\s+by\s+(a |an |our )?(expert|specialist|professional|human)/i,
        weight: 3,
        label: "explicit expert verification step",
      },
      {
        pattern: /before it goes out|before (it is|it's) (sent|submitted|delivered)/i,
        weight: 1,
        label: "pre-delivery verification gate",
      },
      {
        pattern: /\bAI\b[^.]{0,100}(generat|produc|draft|creat)[^;.]*[;.][^.]{0,150}\b(verif|review|check|approv|sign[- ]off)/i,
        weight: 3,
        label: "explicit AI-generates / human-verifies pairing — the canonical AIES production pattern",
      },
      {
        pattern: /\b(verif(y|ies|ying)|review(s|ing)?|check(s|ing)?|approve(s|d|ing)?)\s+every\b/i,
        weight: 1.5,
        label: "claims systematic verification of every output, not spot-checked",
      },
    ],
    negative: [
      {
        pattern: /fully autonomous/i,
        weight: -4,
        label: "claims full autonomy with no human oversight",
      },
      {
        pattern: /no human (review|oversight|intervention)/i,
        weight: -4,
        label: "explicitly excludes human oversight",
      },
    ],
    missingHint: "Look for a named expert role (lawyer, accountant, specialist) who verifies or signs off.",
  },

  asymmetric_productivity: {
    positive: [
      {
        pattern: /one (person|expert|employee|specialist|lawyer|accountant)\s+(can do|does the work of|handles|replaces)/i,
        weight: 4,
        label: "explicit 1-does-the-work-of-N claim",
      },
      {
        pattern: /\d+(\.\d+)?x\s+(more|faster|productivity|output|throughput|capacity)/i,
        weight: 3,
        label: "quantified productivity multiplier",
      },
      {
        pattern: /without (growing|increasing|adding to)\s+(the )?(headcount|team size)/i,
        weight: 3,
        label: "explicit output growth without headcount growth",
      },
      {
        pattern: /\d{2,}\+?\s*(clients|cases|bids|claims|filings|contracts)/i,
        weight: 1,
        label: "high output volume cited (implies leverage, though no explicit ratio given)",
      },
      {
        pattern: /(PLN|USD|EUR|GBP|\$|€|£)\s?\d+(\.\d+)?\s?(K|M|B|million|billion|thousand)\+?\s+(in\s+)?(contracts|savings|claims|revenue|value)/i,
        weight: 2.5,
        label: "high-value outcomes attributed to the company (value of contracts/savings/claims), consistent with productivity leverage",
      },
      {
        pattern: /\bautomat(es|e|ing|ion)\b/i,
        weight: 2,
        label: "explicitly frames the offering as automating the function (implies leverage over manual headcount)",
      },
    ],
    negative: [
      {
        pattern: /one (consultant|lawyer|accountant|specialist) per (client|case|account)/i,
        weight: -3,
        label: "1:1 staffing model described",
      },
    ],
    missingHint: "Look for a stated ratio (e.g. '1 expert handles 10x the clients') or output-without-headcount-growth claim.",
  },

  workflow_repeatability: {
    positive: [
      {
        pattern: /(repeatable|standardi[sz]ed|structured)\s+(process|workflow|service)/i,
        weight: 3,
        label: "explicitly repeatable/standardised process",
      },
      {
        pattern: /\bworkflow\b/i,
        weight: 1.5,
        label: "uses explicit 'workflow' framing",
      },
      {
        pattern: /(full|entire|whole)\s+\w*\s*lifecycle/i,
        weight: 2,
        label: "structured lifecycle with discrete stages",
      },
      {
        pattern: /\b(find|finding|sourcing|intake|identify|identifying)\b/i,
        weight: 1.25,
        label: "names an intake/sourcing stage",
      },
      {
        pattern: /\b(analy[sz](e|ing|is)|assess(ing)?)\b/i,
        weight: 1.25,
        label: "names an analysis stage",
      },
      {
        pattern: /\b(generat(e|ing|es)|draft(ing)?|produc(e|ing))\b/i,
        weight: 1.25,
        label: "names a generation/drafting stage",
      },
      {
        pattern: /\b(submit(ting|s|ssion)?|deliver(ing|y)?|filing|support(ing)?\s+submission)\b/i,
        weight: 1.25,
        label: "names a delivery/submission stage",
      },
    ],
    negative: [
      {
        pattern: /(bespoke|case[- ]by[- ]case|open[- ]ended|tailored engagement)/i,
        weight: -3,
        label: "open-ended/bespoke engagement framing",
      },
    ],
    missingHint: "Look for discrete named steps (intake, analysis, generation, verification, delivery).",
  },

  market_wedge: {
    positive: [
      {
        pattern: /(fragmented|underserved|low[- ]NPS|hasn'?t digiti[sz]ed|haven'?t digiti[sz]ed|email[- ]and[- ]excel|email\/excel|spreadsheet[- ]driven)/i,
        weight: 3,
        label: "names a fragmented/underserved/non-digitised incumbent market",
      },
      {
        pattern: /(SMBs?|small (and|&) medium|can'?t afford|too small for)/i,
        weight: 2.5,
        label: "targets a segment priced out of premium incumbents",
      },
      {
        pattern: /PE[- ]backed/i,
        weight: 2,
        label: "names PE-backed incumbents",
      },
      {
        pattern: /\d{2,}\+?\s*(clients|cases|bids|claims|filings|contracts)/i,
        weight: 2,
        label: "high client/case count on one platform suggests serving a fragmented, hard-to-serve segment",
      },
    ],
    negative: [
      {
        pattern: /(enterprise[- ]only|fortune 500|premium clients only)/i,
        weight: -1,
        label: "targets premium/enterprise segment only",
      },
    ],
    missingHint: "Look for a description of the incumbent market's weaknesses (fragmented, low-NPS, manual/Excel-driven).",
  },

  pricing_model: {
    positive: [
      {
        pattern: /success fee/i,
        weight: 4,
        label: "success-fee pricing component",
      },
      {
        pattern: /%\s*of\s*(savings|contract|won|spend)/i,
        weight: 3,
        label: "percentage-of-outcome pricing",
      },
      {
        pattern: /subscription/i,
        weight: 3,
        label: "subscription pricing component",
      },
      {
        pattern: /(per[- ]outcome|outcome[- ]based pricing)/i,
        weight: 3,
        label: "explicit outcome-based pricing",
      },
    ],
    negative: [
      {
        pattern: /(hourly (rate|billing)|billable hours|per[- ]hour billing)/i,
        weight: -4,
        label: "purely hourly billing",
      },
    ],
    missingHint: "Look for subscription, success-fee, or % of savings/contract pricing language.",
  },

  data_moat_potential: {
    positive: [
      {
        pattern: /(proprietary|own)\s+data/i,
        weight: 3,
        label: "claims proprietary data accumulation",
      },
      {
        pattern: /benchmark/i,
        weight: 2.5,
        label: "mentions benchmarking across engagements",
      },
      {
        pattern: /(improves|gets better)\s+(the model|over time|with (each|every) (client|engagement|case))/i,
        weight: 3,
        label: "explicit improve-with-scale claim",
      },
      {
        pattern: /network effect/i,
        weight: 3,
        label: "explicit network effect claim",
      },
      {
        pattern: /training (data|signal)/i,
        weight: 2,
        label: "mentions training data/signal generation",
      },
      {
        pattern: /\bAI\b[^.]{0,60}(generat|produc|draft|creat)/i,
        weight: 2,
        label: "AI is described as the generation engine — each run produces new engagement-specific output (not stated as a moat, but a precondition for one)",
      },
      {
        pattern: /\d{2,},?\d{0,3}\+?\s*(bids|cases|filings|claims|documents|reports|engagements)\b/i,
        weight: 2,
        label: "meaningful transaction volume processed — a basis for an accumulating dataset, though not explicitly framed as a moat",
      },
      {
        pattern: /\b(verif(y|ies|ying)|review(s|ing)?|check(s|ing)?|approve(s|d|ing)?)\s+every\b/i,
        weight: 2,
        label: "every output is human-reviewed before delivery, implicitly creating a labeled correct/corrected feedback dataset",
      },
    ],
    negative: [],
    missingHint: "Look for claims that each engagement generates proprietary data, benchmarks, or training signal.",
  },
};

const INDUSTRY_KEYWORDS: { vertical: string; patterns: RegExp[] }[] = [
  { vertical: "Public procurement & tendering", patterns: [/procurement/i, /tender/i, /\bbid(s|ding)?\b/i] },
  { vertical: "Legal & compliance", patterns: [/legal/i, /contract review/i, /compliance/i, /law firm/i] },
  { vertical: "Accounting & audit", patterns: [/accounting/i, /\baudit/i, /bookkeeping/i, /reconcil/i] },
  { vertical: "Insurance claims", patterns: [/insurance/i, /\bclaims?\b/i, /underwrit/i, /adjuster/i] },
  { vertical: "HR & recruitment", patterns: [/recruit/i, /\bHR\b/, /hiring/i, /talent acquisition/i] },
  { vertical: "Healthcare administration", patterns: [/healthcare/i, /clinical/i, /\bpatient/i, /medical billing/i] },
  { vertical: "Marketing operations", patterns: [/marketing/i, /campaign/i, /content (creation|generation)/i] },
  { vertical: "Logistics planning", patterns: [/logistics/i, /supply chain/i, /freight/i, /route planning/i] },
  { vertical: "Real estate operations", patterns: [/real estate/i, /property management/i, /leasing/i] },
  { vertical: "Financial due diligence", patterns: [/due diligence/i, /financial diligence/i, /\bM&A\b/] },
];

const FRAMEWORK_INDUSTRIES = new Set(INDUSTRY_KEYWORDS.map((e) => e.vertical));

const COMPARABLES: Record<string, string[]> = {
  "Public procurement & tendering": ["Mimira", "Una Diligence", "GovSpend"],
  "Legal & compliance": ["EvenUp", "Robin AI", "Eve"],
  "Accounting & audit": ["Pilot", "Vic.ai", "Puzzle"],
  "Insurance claims": ["ClaimSorted", "Five Sigma", "Tractable"],
  "HR & recruitment": ["Mercor", "Paradox"],
  "Healthcare administration": ["Ambience Healthcare", "Nabla"],
  "Marketing operations": ["Jasper", "Copy.ai"],
  "Logistics planning": ["project44", "FourKites"],
  "Real estate operations": ["Doma", "Reonomy"],
  "Financial due diligence": ["Hebbia", "Eilla"],
};

function detectIndustryVertical(text: string): string {
  let best = { vertical: "Unclear / not specified", count: 0 };
  for (const entry of INDUSTRY_KEYWORDS) {
    const count = entry.patterns.filter((p) => p.test(text)).length;
    if (count > best.count) best = { vertical: entry.vertical, count };
  }
  return best.vertical;
}

function detectArchetype(text: string): { archetype: Archetype; reasoning: string } {
  if (/underserved|SMBs?|can'?t afford|fragmented|too small for/i.test(text)) {
    return {
      archetype: "segment_expander",
      reasoning: "Text describes serving an underserved/fragmented/price-sensitive segment that incumbents ignore.",
    };
  }
  if (/augment(s|ed)?|empowers? your team|copilot for|inside your (organi[sz]ation|company)/i.test(text)) {
    return {
      archetype: "capacity_multiplier",
      reasoning: "Text describes making an existing internal team more productive rather than replacing an external incumbent.",
    };
  }
  if (/replace(s|d)?|displaces?|instead of (hiring|a law firm|an agency|a consultant)/i.test(text)) {
    return {
      archetype: "challenger",
      reasoning: "Text describes displacing an incumbent category of professional service firms.",
    };
  }
  return {
    archetype: "unclear",
    reasoning: "Not enough explicit market-positioning language to confidently assign an archetype.",
  };
}

function detectPricingModel(matchedLabels: string[]): string {
  if (!matchedLabels.length) return "Not clearly specified";
  return matchedLabels.join(" + ");
}

function detectHumanRole(text: string): string {
  const match = text.match(
    /(team of |a |an )?(lawyer|attorney|accountant|procurement specialist|claims handler|underwriter|auditor|recruiter|case manager|clinician|adjuster)s?/i
  );
  return match ? match[2].toLowerCase() : "Not specified";
}

function roundRobinLabels(groups: Indicator[][], limit: number): string[] {
  const result: string[] = [];
  for (let i = 0; result.length < limit && groups.some((g) => g.length > i); i++) {
    for (const group of groups) {
      if (result.length >= limit) break;
      if (group[i]) result.push(group[i].label);
    }
  }
  return result;
}

export interface HeuristicResult {
  company_name?: string;
  industry_vertical: string;
  closest_archetype: Archetype;
  archetype_reasoning: string;
  pricing_model_detected: string;
  human_in_loop_role: string;
  verdict_summary: string;
  dimensions: Record<DimensionKey, { score: number; evidence: string; gaps: string }>;
  red_flags: string[];
  positive_signals: string[];
  missing_information: string[];
  comparable_companies: string[];
  investment_note: string;
}

export function evaluateHeuristically(text: string, companyName?: string): HeuristicResult {
  const dimensions = {} as Record<DimensionKey, { score: number; evidence: string; gaps: string }>;
  const outcomes = {} as Record<DimensionKey, DimensionOutcome>;
  const industry_vertical = detectIndustryVertical(text);

  for (const key of Object.keys(RULES) as DimensionKey[]) {
    const extraMatched: Indicator[] = [];
    if (key === "market_wedge" && FRAMEWORK_INDUSTRIES.has(industry_vertical)) {
      extraMatched.push({
        pattern: /^/,
        weight: 5,
        label: `operates in "${industry_vertical}", an industry the AIES framework names as typically having poor incumbents (fragmented, PE-backed, or non-digitised)`,
        evidenceText: `Detected industry: ${industry_vertical} — flagged by the framework's own "key industries" list as a typical AIES target market.`,
      });
    }
    const outcome = scoreDimension(text, RULES[key], extraMatched);
    outcomes[key] = outcome;
    dimensions[key] = { score: outcome.score, evidence: outcome.evidence, gaps: outcome.gaps };
  }

  const { archetype, reasoning } = detectArchetype(text);
  const human_in_loop_role = detectHumanRole(text);
  const pricingLabels = outcomes.pricing_model.matchedPositive.map((i) => i.label);
  const pricing_model_detected = detectPricingModel(pricingLabels);

  const positive_signals = roundRobinLabels(
    (Object.keys(outcomes) as DimensionKey[]).map((key) => outcomes[key].matchedPositive),
    10
  );

  const red_flags = (Object.keys(outcomes) as DimensionKey[]).flatMap((key) =>
    outcomes[key].matchedNegative.map((i) => i.label)
  );

  const missing_information = (Object.keys(outcomes) as DimensionKey[])
    .filter((key) => dimensions[key].score < 5)
    .map((key) => RULES[key].missingHint);

  const comparable_companies = COMPARABLES[industry_vertical] || [];

  const strongCount = (Object.keys(dimensions) as DimensionKey[]).filter(
    (k) => dimensions[k].score >= 7
  ).length;
  const weakCount = (Object.keys(dimensions) as DimensionKey[]).filter(
    (k) => dimensions[k].score < 4
  ).length;

  const verdict_summary =
    strongCount >= 5
      ? `The text shows strong, explicit evidence across most AI-Enabled Services dimensions, particularly around ${positive_signals[0] || "outcome delivery"}.`
      : weakCount >= 4
      ? `The text lacks explicit evidence for most AI-Enabled Services dimensions — it may describe a different business model (pure SaaS or traditional consulting).`
      : `The text shows partial evidence for an AI-Enabled Services model, with clear gaps in ${
          missing_information.length ? "some dimensions" : "supporting detail"
        }.`;

  const investment_note = [
    `Operating in ${industry_vertical}, this company's positioning maps to the "${archetype}" archetype.`,
    human_in_loop_role !== "Not specified"
      ? `The named ${human_in_loop_role} verification step suggests a structural (not cosmetic) human-in-the-loop requirement.`
      : `No named expert verification role was found in the text — confirm whether human oversight exists by design or is absent.`,
    `Key risk: this is a keyword/pattern-based read of the supplied text only, not independent diligence — verify all evidence points before making an investment decision.`,
  ].join(" ");

  return {
    company_name: companyName,
    industry_vertical,
    closest_archetype: archetype,
    archetype_reasoning: reasoning,
    pricing_model_detected,
    human_in_loop_role,
    verdict_summary,
    dimensions,
    red_flags,
    positive_signals,
    missing_information,
    comparable_companies,
    investment_note,
  };
}
