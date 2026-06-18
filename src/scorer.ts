import {
  DIMENSION_KEYS,
  DIMENSION_WEIGHTS,
  DimensionKey,
  DimensionScore,
  Verdict,
} from "./types";

export function verdictFromScore(overallScore: number): Verdict {
  if (overallScore >= 80) return "strong_fit";
  if (overallScore >= 60) return "partial_fit";
  if (overallScore >= 40) return "borderline";
  return "does_not_fit";
}

export function verdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case "strong_fit":
      return "✅ Strong AI-Enabled Services Fit";
    case "partial_fit":
      return "⚠️ Partial Fit";
    case "borderline":
      return "🔶 Borderline";
    case "does_not_fit":
      return "❌ Does Not Fit";
  }
}

/**
 * Recomputes weighted_score/overall_score deterministically from raw 0-10
 * dimension scores, so the final numbers never depend on the model's own
 * arithmetic (LLMs are unreliable at multiplying weights correctly).
 */
export function normalizeDimensions(
  rawDimensions: Record<string, Partial<DimensionScore>>
): { dimensions: Record<DimensionKey, DimensionScore>; overallScore: number } {
  const dimensions = {} as Record<DimensionKey, DimensionScore>;
  let overallWeighted = 0;

  for (const key of DIMENSION_KEYS) {
    const raw = rawDimensions[key] ?? {};
    const score = clamp(Number(raw.score) || 0, 0, 10);
    const weight = DIMENSION_WEIGHTS[key];
    const weighted_score = score * weight * 10;

    dimensions[key] = {
      score,
      weight,
      weighted_score: round1(weighted_score),
      evidence: raw.evidence?.trim() || "Not addressed in source text.",
      gaps: raw.gaps?.trim() || "",
    };

    overallWeighted += weighted_score;
  }

  return { dimensions, overallScore: round1(overallWeighted) };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
