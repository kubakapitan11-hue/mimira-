---
description: Evaluate the company in input/company.txt against the AI-Enabled Services framework and save a report
---

You are running the AIES Evaluator for this repo. Company name argument: $ARGUMENTS

Do the following now, without asking for confirmation:

1. Read `criteria/definition.md` in full — it contains the AI-Enabled Services definition, the 7-dimension scoring rubric with weights, verdict thresholds, archetype definitions, and the exact `EvaluationResult` JSON schema to produce.
2. Read `input/company.txt` — the company data to evaluate. If it's empty, stop and tell the user to paste company text into it first.
3. If `input/company.txt` contains mostly a bare URL with little or no other text, use the WebFetch tool to fetch that page yourself and use the fetched content as the company data — no separate script or code needed.
4. Evaluate the company against all 7 dimensions yourself, using your own reasoning. Do not run any script, call any API, or use regex/keyword matching — you are the evaluator.
5. Compute `overall_score` as the weighted sum of `score × weight × 10` across all 7 dimensions, rounded to 1 decimal place, and set `verdict` using the thresholds in `criteria/definition.md`.
6. Determine `company_name` from `$ARGUMENTS` if provided, otherwise infer it from `input/company.txt`.
7. Write the full `EvaluationResult` as JSON to `reports/<company-slug>-<today's date, YYYY-MM-DD>.json`.
8. Write a human-readable Markdown version (overall score, a dimension table with evidence/gaps, archetype, pricing model, human-in-loop role, red flags, positive signals, missing information, comparable companies, investor note) to `reports/<company-slug>-<today's date>.md`, where `<company-slug>` is the company name lowercased and hyphenated.
9. Add or update a row for this company in `reports/index.md` (create the file with a header row if it doesn't exist yet) — columns: Company, Score, Verdict, Date, Report (linking to the json/md files). If a row for the same company+date already exists, replace it rather than duplicating.
10. Show the user a formatted terminal-style summary of the result in your response.
