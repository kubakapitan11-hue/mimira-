# AIES Evaluator

Evaluates whether a company qualifies as an **AI-Enabled Services** (AIES) company against a precise 7-dimension definition framework.

**There is no application code, no API calls, no external models, and no npm packages.** Claude Code itself is the evaluation engine: it reads `criteria/definition.md` for the rubric and `input/company.txt` for the company data, reasons about the fit directly, and writes the report. `evaluate.sh` is just a small bash script that stages that request — it makes no calls anywhere; it only assembles the two files into one prompt and prints instructions for Claude Code to act on.

## Repo structure

```
criteria/definition.md   — the full AI-Enabled Services definition + 7-dimension scoring rubric + output JSON shape
input/company.txt        — paste raw company text here before each evaluation
evaluate.sh              — reads both files above and prints an evaluation request
reports/                 — where Claude Code writes <company-slug>-<date>.json and .md
```

## Workflow

**Step 1.** Paste the company's raw text (website copy, LinkedIn about, pitch deck, funding announcement — whatever you have) into `input/company.txt`, replacing whatever was there before.

**Step 2.** Run:
```bash
./evaluate.sh
```
This prints the criteria, the company input, and instructions — it does not evaluate anything itself.

**Step 3.** Ask Claude Code to run it (or paste the output to it) — e.g. "run ./evaluate.sh and evaluate the company". Claude Code reads the staged output, scores the company against the 7 dimensions, and writes:
```
reports/<company-slug>-<date>.json
reports/<company-slug>-<date>.md
```
It will also show you a formatted summary directly in the conversation.

## How the scoring works

Every evaluation is scored 0–10 on 7 dimensions (outcome delivery, human-in-the-loop, asymmetric productivity, workflow repeatability, market wedge, pricing model, data moat potential), each with its own weight, summed into a 0–100 overall score. The full rubric, weights, and verdict thresholds (80+ strong fit, 60+ partial fit, 40+ borderline, below 40 does not fit) live in `criteria/definition.md` — that file is the single source of truth Claude Code reads before every evaluation.

## Notes

- `reports/` is gitignored, so generated reports never get committed automatically.
- `input/company.txt` is tracked as a working file — if you paste sensitive company text into it and don't want that committed, add it to `.gitignore` yourself before committing.
- Editing `criteria/definition.md` changes how every future evaluation is scored — it's the only "config" in this repo.
