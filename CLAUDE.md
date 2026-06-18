# AIES Evaluator — instructions for Claude Code

This repo has no application code. Claude Code (you) is the evaluation engine — there are no API calls, no external models, and no regex/heuristic scoring anywhere.

## Trigger

When the user types `/evaluate <company-name>` or a plain message like `evaluate <company-name>` (or just "evaluate" with no name), run the full evaluation protocol immediately, without asking for confirmation:

1. Read `criteria/definition.md` — the AI-Enabled Services definition, the 7-dimension scoring rubric with weights, verdict thresholds, archetype definitions, and the exact `EvaluationResult` JSON schema.
2. Read `input/company.txt` — the company data to evaluate. If it's empty, stop and tell the user to paste company text into it first.
3. If `input/company.txt` contains mostly a bare URL with little or no other text, use the WebFetch tool to fetch that page yourself and use the fetched content as the company data — no separate script or code needed. Otherwise treat the file's text as the company data directly (it can be a website's homepage copy, a LinkedIn page, a news article, a pitch deck, a funding announcement — anything textual, not just "articles").
4. Evaluate the company against all 7 dimensions yourself, using your own reasoning. Do not run any script, call any API, or use regex/keyword matching.
5. Compute `overall_score` as the weighted sum of `score × weight × 10` across all 7 dimensions, rounded to 1 decimal place, and set `verdict` per the thresholds in `criteria/definition.md`.
6. Determine `company_name` from the typed argument if given, otherwise infer it from `input/company.txt`.
7. Write the full `EvaluationResult` as JSON to `reports/<company-slug>-<today's date, YYYY-MM-DD>.json`.
8. Write a human-readable Markdown version (overall score, dimension table with evidence/gaps, archetype, pricing model, human-in-loop role, red flags, positive signals, missing information, comparable companies, investor note) to `reports/<company-slug>-<today's date>.md`, where `<company-slug>` is the company name lowercased and hyphenated.
9. Add or update a row for this company in `reports/index.md` (create it with a header row if missing) — columns: Company, Score, Verdict, Date, Report. If a row for the same company+date already exists, replace it rather than duplicating.
10. Show a formatted terminal-style summary of the result in the response.

## Important limitation

Claude Code cannot watch `input/company.txt` for OS-level file saves on its own — it only acts when invoked in a conversation. The workflow is: the user pastes text into `input/company.txt` and saves it in their editor, then types `evaluate <company-name>` (or `/evaluate <company-name>`) in the chat to trigger the steps above. There is no truly unattended/background trigger possible without an API call or external script, which this repo deliberately avoids.

## Re-running on the same company

If a report for `<company-slug>-<today's date>` already exists and the user re-runs the evaluation the same day (e.g. after editing `input/company.txt`), overwrite it — don't create a second file with a suffix.
