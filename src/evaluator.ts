import { DIMENSION_KEYS, DIMENSION_WEIGHTS, EvaluationResult } from "./types";
import { normalizeDimensions, verdictFromScore } from "./scorer";
import { evaluateHeuristically } from "./heuristics";

/**
 * Runs entirely offline: scores the text against the AI-Enabled Services
 * framework using regex/keyword pattern matching (see heuristics.ts).
 * No API key or network call required. Kept as a single async entry
 * point so it can be swapped for an LLM-backed implementation later
 * without touching callers (CLI, web server).
 */
export async function evaluateCompany(
  rawText: string,
  companyName?: string,
  options?: { verbose?: boolean; sourceWebsite?: string; sourceLinkedin?: string }
): Promise<EvaluationResult> {
  const heuristic = evaluateHeuristically(rawText, companyName);

  if (options?.verbose) {
    console.log("\n--- MATCHED DIMENSION DATA ---");
    console.log(JSON.stringify(heuristic.dimensions, null, 2));
  }

  const { dimensions, overallScore } = normalizeDimensions(heuristic.dimensions);

  return {
    company_name: heuristic.company_name || "Unknown Company",
    source_website: options?.sourceWebsite,
    source_linkedin: options?.sourceLinkedin,
    evaluation_date: new Date().toISOString(),
    overall_score: overallScore,
    verdict: verdictFromScore(overallScore),
    verdict_summary: heuristic.verdict_summary,
    dimensions,
    closest_archetype: heuristic.closest_archetype,
    archetype_reasoning: heuristic.archetype_reasoning,
    industry_vertical: heuristic.industry_vertical,
    pricing_model_detected: heuristic.pricing_model_detected,
    human_in_loop_role: heuristic.human_in_loop_role,
    red_flags: heuristic.red_flags,
    positive_signals: heuristic.positive_signals,
    missing_information: heuristic.missing_information,
    comparable_companies: heuristic.comparable_companies,
    investment_note: heuristic.investment_note,
  };
}

export { DIMENSION_KEYS, DIMENSION_WEIGHTS };
