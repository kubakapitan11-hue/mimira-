#!/usr/bin/env bash
# Stages an AI-Enabled Services evaluation request for Claude Code.
# This script makes NO API calls and uses NO external models — it just
# assembles the criteria + the pasted company input into one prompt and
# prints instructions. Claude Code (this session) reads that output,
# performs the evaluation itself, and writes the report files.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRITERIA_FILE="$SCRIPT_DIR/criteria/definition.md"
INPUT_FILE="$SCRIPT_DIR/input/company.txt"
REPORTS_DIR="$SCRIPT_DIR/reports"

if [ ! -f "$CRITERIA_FILE" ]; then
  echo "Error: $CRITERIA_FILE not found." >&2
  exit 1
fi

if [ ! -s "$INPUT_FILE" ]; then
  echo "Error: $INPUT_FILE is empty. Paste the company's raw text into it first." >&2
  exit 1
fi

mkdir -p "$REPORTS_DIR"

DATE_STR="$(date +%F)"

cat <<EOF
================================================================
AIES EVALUATION REQUEST
Claude Code: evaluate the company below against the criteria
below, then follow the instructions at the end of this output.
================================================================

----------------- CRITERIA (criteria/definition.md) -----------------
$(cat "$CRITERIA_FILE")

----------------- COMPANY INPUT (input/company.txt) -----------------
$(cat "$INPUT_FILE")

----------------------------- INSTRUCTIONS -----------------------------
1. Read the company input above and evaluate it against the AI-Enabled
   Services definition and 7-dimension rubric in the criteria section.
   Use your own judgment — do not run any script, call any API, or use
   any external model. You are the evaluator.
2. Produce a single JSON object matching the EvaluationResult shape
   defined at the end of criteria/definition.md.
3. Compute overall_score as the weighted sum of the 7 dimension scores
   (score x weight x 10), rounded to 1 decimal place, and set verdict
   using these thresholds: >=80 strong_fit, >=60 partial_fit,
   >=40 borderline, else does_not_fit.
4. Save the JSON to:
     reports/<company-slug>-${DATE_STR}.json
   and a human-readable Markdown report (overall score, a table of the
   7 dimension scores with evidence/gaps, archetype, pricing model,
   human-in-loop role, red flags, positive signals, missing information,
   comparable companies, and the investor note) to:
     reports/<company-slug>-${DATE_STR}.md
   where <company-slug> is the company name, lowercased and hyphenated.
5. Show the user a formatted terminal-style summary of the result.
================================================================
EOF
