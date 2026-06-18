# AIES Evaluator

A CLI + web tool that takes raw pasted text about a company and scores whether it qualifies as an **AI-Enabled Services** (AIES) company, against a precise 7-dimension definition framework. It runs **fully offline** — no API key, no network call — using a regex/keyword pattern-matching engine (`src/heuristics.ts`) scored against the same 7-dimension rubric an LLM judge would use, then renders the result in the terminal, a web UI, and saved JSON/Markdown reports.

> **Why offline instead of calling Claude?** This evaluator was originally spec'd to call the Anthropic Messages API, but that requires a separate pay-as-you-go API key (a Claude.ai Pro/Max subscription does not include API credits). To avoid that dependency, the scoring logic was rewritten as a deterministic, explainable rule-based engine. It's stricter and less nuanced than an LLM judge — it only credits literal phrasing it recognizes — but needs nothing but Node.js to run. `src/evaluator.ts` is the single integration point; swapping in a real LLM call later only means changing that one file.

## Prerequisites

- Node.js 20+
- No API key needed

## Setup

```bash
npm install
cp .env.example .env   # optional, only used to override the web server PORT
```

## CLI usage

```bash
# Evaluate from a text file
npm run cli -- evaluate --file ./company-data.txt

# Evaluate from pasted stdin text
npm run cli -- evaluate --paste

# Evaluate with a company name hint
npm run cli -- evaluate --file ./data.txt --name "Mimira"

# Print the matched dimension data (which indicators fired and why)
npm run cli -- evaluate --file ./data.txt --verbose

# List all saved reports
npm run cli -- list

# Show a specific saved report
npm run cli -- show --id mimira-2026-06-18
```

(`npm run cli` is an alias for `ts-node src/index.ts` — flags after `--` are passed through.)

## Web usage

```bash
npm run web        # one-off start
npm run dev         # auto-reload with nodemon
```

Open http://localhost:3333, paste any text about a company (website copy, LinkedIn about, news article, funding announcement, pitch deck text), optionally give a name hint, and click **Evaluate**. Results show an overall score, a verdict, per-dimension bars with expandable evidence/gaps, red flags, positive signals, comparable companies, and an investor note. Download buttons export the same report as JSON or Markdown. No login, no database — everything runs locally and reports are written to `/reports`.

## How the scoring works

Every evaluation is scored 0–10 on 7 dimensions by matching the pasted text against curated regex indicators (positive and negative) defined in `src/heuristics.ts`, then weighted and summed to a 0–100 overall score:

| Dimension | Weight | What it checks |
|---|---|---|
| Outcome delivery | 20% | Does the company sell a result, not a tool? |
| Human-in-the-loop | 15% | Is there a named expert who verifies/signs off? |
| Asymmetric productivity | 15% | Does output scale faster than headcount? |
| Workflow repeatability | 15% | Is the service a codified, repeatable process? |
| Market wedge | 15% | Are incumbents fragmented, low-NPS, or non-digitised? |
| Pricing model | 10% | Subscription/success-fee/outcome pricing vs. pure hourly? |
| Data moat potential | 10% | Does each engagement build proprietary data/benchmarks? |

Thresholds on the weighted overall score:

- **80–100** — Strong AI-Enabled Services fit ✅
- **60–79** — Partial fit ⚠️
- **40–59** — Borderline 🔶
- **0–39** — Does not fit ❌

The weighted math is recomputed deterministically in `src/scorer.ts` from each dimension's raw 0–10 score, so the final number is always exact and reproducible for the same input text.

**Limitations of the offline approach:** the engine only credits literal phrasing it recognizes (e.g. "success fee", "human-in-the-loop", "won contract"). It will under-score companies that describe the same qualities in different words, and the `comparable_companies` list is a small static lookup table by detected industry, not a researched comp set. Treat scores as a structured first pass, not a final verdict.

## Example: evaluating Mimira

```bash
cat > mimira.txt << 'EOF'
Mimira automates public procurement for companies in Poland and Europe. The platform
handles the full tender lifecycle: finding relevant tenders, analyzing requirements,
generating complete bid documentation, and supporting submission. AI generates the
documents; a team of procurement specialists verifies every bid before it goes out.
Clients pay a monthly subscription plus a success fee on won contracts. The company
has served 100+ clients, submitted nearly 1,000 bids, and won PLN 300M+ in contracts.
EOF

npm run cli -- evaluate --file ./mimira.txt --name "Mimira"
```

This produces a terminal report with dimension bars, an archetype classification, red flags/positive signals, and saves `reports/mimira-<date>.json` and `reports/mimira-<date>.md`.

## Adding new companies

Just paste their text — no setup required per company. Any of these work as input:

- Website "About" or product page copy
- LinkedIn company description
- A funding announcement or press release
- Pitch deck text (copy-pasted)

Use `--name` (CLI) or the name field (web) if you want to force a specific company name instead of letting the model detect it from the text.

## Workflow: evaluating from copied website/LinkedIn content in VS Code

A structured intake template lives at `templates/company-template.md`:

```markdown
# Company: 

Website: 
LinkedIn: 

---

(paste copied content here)
```

Everything above the `---` line is metadata only — it's stripped before scoring and just carried through into the saved report (terminal output, JSON, and Markdown all show the Website/LinkedIn line for traceability back to the source). Everything below `---` is the text actually evaluated.

**Fastest way to start a new one in VS Code:** a project snippet is set up in `.vscode/aies.code-snippets`. Open a new file, type `aies-company`, hit Tab — it expands the template with tab-stops for the name and links, and lands your cursor right after the `---` ready to paste.

**Or copy the template manually:**

```bash
mkdir -p companies
cp templates/company-template.md companies/mimira.md
# fill in Company / Website / LinkedIn, paste content below the ---, save
npm run cli -- evaluate --file ./companies/mimira.md
```

(`companies/` is already gitignored, same as `/reports`, so pasted company text never gets committed.)
