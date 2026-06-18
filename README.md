# AIES Evaluator

Evaluates whether a company qualifies as an **AI-Enabled Services** (AIES) company against a precise 7-dimension definition framework.

**There is no application code, no API calls, no external models, and no npm packages.** Claude Code itself is the evaluation engine: it reads `criteria/definition.md` for the rubric and `input/company.txt` for the company data, reasons about the fit directly, and writes the report. `evaluate.sh` is just a small bash script that stages that request — it makes no calls anywhere; it only assembles the two files into one prompt and prints instructions for Claude Code to act on.

## Repo structure

```
criteria/definition.md   — the full AI-Enabled Services definition + 7-dimension scoring rubric + output JSON shape
input/company.txt        — paste raw company text here before each evaluation
evaluate.sh              — reads both files above and prints an evaluation request (optional — see below)
.claude/commands/evaluate.md — defines the /evaluate slash command
CLAUDE.md                — the same protocol, followed even without the slash command
reports/                 — where Claude Code writes <company-slug>-<date>.json and .md
reports/index.md         — running log of every company evaluated: score, verdict, date, links to its report
```

## Workflow

**Step 1.** Paste the company's raw text into `input/company.txt`, replacing whatever was there before, and save the file. This can be anything textual — website homepage copy, a LinkedIn page, a news article, a pitch deck, a funding announcement. You can also just paste a bare URL with nothing else: if the file is mostly just a link, Claude Code will fetch that page itself (using its built-in WebFetch tool — still no API calls, no code, no cost) and evaluate the fetched content.

You always replace the file's contents for the next company — it holds one company at a time. Nothing is lost by doing this: every past evaluation stays in `reports/` and in `reports/index.md` regardless of what's currently in `input/company.txt`.

**Step 2.** In a Claude Code session in this directory, type:
```
/evaluate Mimira
```
(or just plain text like `evaluate Mimira`, or even just `evaluate` and Claude Code will infer the name from the file). Claude Code reads `criteria/definition.md` and `input/company.txt`, scores the company against the 7 dimensions using its own reasoning, and writes:
```
reports/<company-slug>-<date>.json
reports/<company-slug>-<date>.md
```
It also shows a formatted summary directly in the conversation.

**Note on automation:** Claude Code cannot watch `input/company.txt` for file saves and trigger itself — it only acts when invoked. Saving the file is step 1; typing the command is what actually starts the evaluation. There's no API call or background script involved at any point, by design.

`evaluate.sh` is optional — it's a plain bash script that stages the same two files into one printed block, for cases where you want to copy that combined text elsewhere. It makes no calls anywhere and cannot evaluate anything by itself.

## How the scoring works

Every evaluation is scored 0–10 on 7 dimensions (outcome delivery, human-in-the-loop, asymmetric productivity, workflow repeatability, market wedge, pricing model, data moat potential), each with its own weight, summed into a 0–100 overall score. The full rubric, weights, and verdict thresholds (80+ strong fit, 60+ partial fit, 40+ borderline, below 40 does not fit) live in `criteria/definition.md` — that file is the single source of truth Claude Code reads before every evaluation.

## Tracking what's been evaluated

`reports/index.md` is a single running table — company, score, verdict, date, and links to that company's `.json`/`.md` report — updated automatically every time you run an evaluation. It's the closest thing to a "database" here: just one more flat file, no server, no query language. Open it anytime to see everything checked so far at a glance.

## Notes

- `reports/` (including `index.md`) is gitignored, so generated reports never get committed automatically — they're local-only history.
- `input/company.txt` is tracked as a working file — if you paste sensitive company text into it and don't want that committed, add it to `.gitignore` yourself before committing.
- Editing `criteria/definition.md` changes how every future evaluation is scored — it's the only "config" in this repo.
