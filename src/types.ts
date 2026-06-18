export type Verdict = "strong_fit" | "partial_fit" | "borderline" | "does_not_fit";

export type Archetype = "challenger" | "segment_expander" | "capacity_multiplier" | "unclear";

export const DIMENSION_KEYS = [
  "outcome_delivery",
  "human_in_the_loop",
  "asymmetric_productivity",
  "workflow_repeatability",
  "market_wedge",
  "pricing_model",
  "data_moat_potential",
] as const;

export type DimensionKey = typeof DIMENSION_KEYS[number];

export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  outcome_delivery: 0.20,
  human_in_the_loop: 0.15,
  asymmetric_productivity: 0.15,
  workflow_repeatability: 0.15,
  market_wedge: 0.15,
  pricing_model: 0.10,
  data_moat_potential: 0.10,
};

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  outcome_delivery: "Outcome delivery",
  human_in_the_loop: "Human-in-the-loop",
  asymmetric_productivity: "Asymmetric productivity",
  workflow_repeatability: "Workflow repeatability",
  market_wedge: "Market wedge",
  pricing_model: "Pricing model",
  data_moat_potential: "Data moat potential",
};

export interface DimensionScore {
  score: number; // 0-10
  weight: number; // 0.0-1.0
  weighted_score: number; // score * weight * 10
  evidence: string;
  gaps: string;
}

export interface EvaluationResult {
  company_name: string;
  source_website?: string;
  source_linkedin?: string;
  evaluation_date: string;
  overall_score: number;
  verdict: Verdict;
  verdict_summary: string;
  dimensions: Record<DimensionKey, DimensionScore>;
  closest_archetype: Archetype;
  archetype_reasoning: string;
  industry_vertical: string;
  pricing_model_detected: string;
  human_in_loop_role: string;
  red_flags: string[];
  positive_signals: string[];
  missing_information: string[];
  comparable_companies: string[];
  investment_note: string;
}

export interface SavedReport {
  id: string;
  result: EvaluationResult;
}
