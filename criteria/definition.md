# AI-Enabled Services — Definition & Scoring Rubric

Claude Code: read this entire file as context before evaluating any company. Apply it precisely and skeptically — do not assume facts not present or reasonably implied by the source text in `input/company.txt`.

## Definition of AI-Enabled Services

An AI-Enabled Services company is a firm that:

1. **Delivers an outcome, not software** — the customer pays for a result (a won tender, a reviewed contract, a resolved claim, a reconciled balance sheet), not for a software licence. AI is the production engine, invisible to the client.
2. **Has a human-in-the-loop** — a domain expert (lawyer, accountant, procurement specialist, claims handler) verifies, signs off, or makes the final judgment. The company is not fully autonomous.
3. **Breaks the linear headcount-to-revenue link** — the firm can grow output significantly faster than it grows its team. One expert can now do the work of five, ten, or more.
4. **Operates in a repeatable, structured workflow** — the service involves steps that can be codified: document intake, analysis, generation, verification, delivery. Not open-ended consulting.
5. **Targets a market with poor incumbents** — typically: PE-backed fragmented markets with low NPS, industries that haven't digitised (still email/Excel-driven), or underserved segments that can't afford premium players.
6. **Has a hybrid or outcome-based pricing model** — subscription AND/OR success fee (% of contract won, % of savings, per-outcome pricing). Not purely hourly billing.
7. **Builds a data moat over time** — every engagement generates proprietary data (patterns, benchmarks, domain-specific training signal) that makes the service better and harder to replicate.

### What it is NOT
- Pure SaaS (sells access to a tool; client does the work)
- Traditional consulting (sells senior human hours with no AI leverage)
- AI infrastructure / AIaaS (sells models, APIs, compute)
- Fully autonomous AI agent with no human oversight (different risk profile)

### Key industries where this applies
Legal & compliance, accounting & audit, public procurement & tendering, insurance claims, HR & recruitment, healthcare administration, marketing operations, logistics planning, real estate operations, financial due diligence.

## Scoring rubric — score each dimension 0–10

| # | Dimension | Key | Weight | What to look for |
|---|-----------|-----|--------|-------------------|
| 1 | Outcome delivery | `outcome_delivery` | 20% | Does the company deliver a result, not a tool? Is the output a document, decision, filing, or completed task? |
| 2 | Human-in-the-loop | `human_in_the_loop` | 15% | Is there a named expert role that verifies or signs off? Is this by design or by regulatory necessity? |
| 3 | Asymmetric productivity | `asymmetric_productivity` | 15% | Is there evidence that output scales faster than headcount? Any ratio claims (1 person = X clients)? |
| 4 | Workflow repeatability | `workflow_repeatability` | 15% | Is the core service a repeatable, structured process? Can it be decomposed into discrete steps? |
| 5 | Market wedge | `market_wedge` | 15% | Is the incumbent market PE-dominated, low-NPS, email/Excel-driven, or serving only premium clients? |
| 6 | Pricing model | `pricing_model` | 10% | Is there a subscription, success fee, or outcome-based component? Or is it purely hourly/FTE billing? |
| 7 | Data moat potential | `data_moat_potential` | 10% | Does each engagement generate proprietary training data or benchmarks? Is there a network effect in the data? |

**Overall score** = sum over all dimensions of `score × weight × 10`, rounded to 1 decimal place (0–100 scale).

**Verdict thresholds:**
- `strong_fit` — overall score 80–100 ✅
- `partial_fit` — overall score 60–79 ⚠️
- `borderline` — overall score 40–59 🔶
- `does_not_fit` — overall score 0–39 ❌

Score conservatively. If information for a dimension is absent, score it low (1–4) and say so explicitly in `gaps`. Do not invent revenue figures, client counts, or claims not present in the source text.

## Archetypes

- `challenger` — directly displaces an incumbent category of professional service firms
- `segment_expander` — serves a segment the incumbents ignore (too small, too cheap)
- `capacity_multiplier` — makes existing professionals inside a client org dramatically more productive
- `unclear` — not enough evidence to assign an archetype confidently

## Output schema (EvaluationResult)

Produce exactly this JSON shape:

```typescript
interface EvaluationResult {
  company_name: string;
  evaluation_date: string;            // ISO timestamp
  overall_score: number;              // 0–100
  verdict: "strong_fit" | "partial_fit" | "borderline" | "does_not_fit";
  verdict_summary: string;            // 1–2 sentence plain English summary
  dimensions: {
    outcome_delivery: DimensionScore;
    human_in_the_loop: DimensionScore;
    asymmetric_productivity: DimensionScore;
    workflow_repeatability: DimensionScore;
    market_wedge: DimensionScore;
    pricing_model: DimensionScore;
    data_moat_potential: DimensionScore;
  };
  closest_archetype: "challenger" | "segment_expander" | "capacity_multiplier" | "unclear";
  archetype_reasoning: string;
  industry_vertical: string;
  pricing_model_detected: string;
  human_in_loop_role: string;
  red_flags: string[];
  positive_signals: string[];
  missing_information: string[];
  comparable_companies: string[];
  investment_note: string;            // 2–3 sentence investor-perspective note
}

interface DimensionScore {
  score: number;            // 0–10
  weight: number;           // 0.0–1.0
  weighted_score: number;   // score * weight * 10
  evidence: string;         // what in the text supports this score
  gaps: string;              // what information is missing or contradicts
}
```
