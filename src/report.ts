import fs from "fs";
import path from "path";
import chalk from "chalk";
import {
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  EvaluationResult,
} from "./types";
import { verdictLabel } from "./scorer";

const REPORTS_DIR = path.join(process.cwd(), "reports");

function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "company";
}

export function reportId(result: EvaluationResult): string {
  const datePart = result.evaluation_date.slice(0, 10);
  return `${slugify(result.company_name)}-${datePart}`;
}

function bar(score: number, width = 20): string {
  const filled = Math.round((score / 10) * width);
  return "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
}

function scoreColor(score: number) {
  if (score >= 80) return chalk.green;
  if (score >= 60) return chalk.yellow;
  if (score >= 40) return chalk.hex("#ffa500");
  return chalk.red;
}

export function printReport(result: EvaluationResult): void {
  const line = "━".repeat(42);
  const color = scoreColor(result.overall_score);

  console.log(chalk.bold(line));
  console.log(chalk.bold("  AI-ENABLED SERVICES EVALUATOR"));
  console.log(`  Company: ${chalk.cyan(result.company_name)}`);
  if (result.source_website) console.log(`  Website: ${result.source_website}`);
  if (result.source_linkedin) console.log(`  LinkedIn: ${result.source_linkedin}`);
  console.log(`  Evaluated: ${result.evaluation_date}`);
  console.log(chalk.bold(line));
  console.log();
  console.log(
    `  OVERALL SCORE: ${color.bold(`${result.overall_score}/100`)}  ${verdictLabel(
      result.verdict
    )}`
  );
  console.log();
  if (result.verdict_summary) {
    console.log(`  ${chalk.italic(result.verdict_summary)}`);
    console.log();
  }

  console.log(chalk.bold(line));
  console.log(chalk.bold("  DIMENSION SCORES"));
  console.log(chalk.bold(line));
  console.log();
  for (const key of DIMENSION_KEYS) {
    const dim = result.dimensions[key];
    const label = DIMENSION_LABELS[key].padEnd(23, " ");
    console.log(
      `  ${label} ${scoreColor(dim.score * 10)(bar(dim.score))}  ${dim.score.toFixed(1)}/10`
    );
  }
  console.log();

  console.log(chalk.bold(line));
  console.log(`  ARCHETYPE: ${result.closest_archetype}`);
  console.log(`  VERTICAL: ${result.industry_vertical}`);
  console.log(`  PRICING: ${result.pricing_model_detected}`);
  console.log(`  EXPERT ROLE: ${result.human_in_loop_role}`);
  console.log(chalk.bold(line));
  console.log();

  if (result.positive_signals.length) {
    console.log(chalk.green.bold(`  ✅ POSITIVE SIGNALS (${result.positive_signals.length})`));
    for (const s of result.positive_signals) console.log(`    • ${s}`);
    console.log();
  }

  if (result.red_flags.length) {
    console.log(chalk.red.bold(`  ⚠️  RED FLAGS (${result.red_flags.length})`));
    for (const s of result.red_flags) console.log(`    • ${s}`);
    console.log();
  }

  if (result.missing_information.length) {
    console.log(
      chalk.yellow.bold(`  ❓ MISSING INFORMATION (${result.missing_information.length})`)
    );
    for (const s of result.missing_information) console.log(`    • ${s}`);
    console.log();
  }

  if (result.comparable_companies.length) {
    console.log(chalk.bold("  📊 COMPARABLE COMPANIES"));
    console.log(`    • ${result.comparable_companies.join(", ")}`);
    console.log();
  }

  if (result.investment_note) {
    console.log(chalk.bold("  💼 INVESTOR NOTE"));
    console.log(`    ${result.investment_note}`);
    console.log();
  }

  console.log(chalk.bold(line));
}

export function saveReport(result: EvaluationResult): { jsonPath: string; mdPath: string } {
  ensureReportsDir();
  const id = reportId(result);
  const jsonPath = path.join(REPORTS_DIR, `${id}.json`);
  const mdPath = path.join(REPORTS_DIR, `${id}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf-8");
  fs.writeFileSync(mdPath, toMarkdown(result), "utf-8");

  return { jsonPath, mdPath };
}

function toMarkdown(result: EvaluationResult): string {
  const lines: string[] = [];
  lines.push(`# AI-Enabled Services Evaluation: ${result.company_name}`);
  lines.push("");
  if (result.source_website) lines.push(`**Website:** ${result.source_website}`);
  if (result.source_linkedin) lines.push(`**LinkedIn:** ${result.source_linkedin}`);
  lines.push(`**Evaluated:** ${result.evaluation_date}`);
  lines.push(`**Overall score:** ${result.overall_score}/100`);
  lines.push(`**Verdict:** ${verdictLabel(result.verdict)}`);
  lines.push("");
  if (result.verdict_summary) {
    lines.push(`> ${result.verdict_summary}`);
    lines.push("");
  }

  lines.push("## Dimension scores");
  lines.push("");
  lines.push("| Dimension | Score | Weight | Weighted | Evidence | Gaps |");
  lines.push("|---|---|---|---|---|---|");
  for (const key of DIMENSION_KEYS) {
    const dim = result.dimensions[key];
    lines.push(
      `| ${DIMENSION_LABELS[key]} | ${dim.score}/10 | ${(dim.weight * 100).toFixed(
        0
      )}% | ${dim.weighted_score} | ${dim.evidence.replace(/\|/g, "/")} | ${dim.gaps.replace(
        /\|/g,
        "/"
      )} |`
    );
  }
  lines.push("");

  lines.push("## Classification");
  lines.push("");
  lines.push(`- **Archetype:** ${result.closest_archetype} — ${result.archetype_reasoning}`);
  lines.push(`- **Industry vertical:** ${result.industry_vertical}`);
  lines.push(`- **Pricing model:** ${result.pricing_model_detected}`);
  lines.push(`- **Human-in-loop role:** ${result.human_in_loop_role}`);
  lines.push("");

  if (result.positive_signals.length) {
    lines.push("## Positive signals");
    lines.push("");
    for (const s of result.positive_signals) lines.push(`- ${s}`);
    lines.push("");
  }

  if (result.red_flags.length) {
    lines.push("## Red flags");
    lines.push("");
    for (const s of result.red_flags) lines.push(`- ${s}`);
    lines.push("");
  }

  if (result.missing_information.length) {
    lines.push("## Missing information");
    lines.push("");
    for (const s of result.missing_information) lines.push(`- ${s}`);
    lines.push("");
  }

  if (result.comparable_companies.length) {
    lines.push("## Comparable companies");
    lines.push("");
    lines.push(result.comparable_companies.join(", "));
    lines.push("");
  }

  if (result.investment_note) {
    lines.push("## Investor note");
    lines.push("");
    lines.push(result.investment_note);
    lines.push("");
  }

  return lines.join("\n");
}

export function listReports(): { id: string; company_name: string; overall_score: number; verdict: string; evaluation_date: string }[] {
  ensureReportsDir();
  return fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const content = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, f), "utf-8"));
      return {
        id: f.replace(/\.json$/, ""),
        company_name: content.company_name,
        overall_score: content.overall_score,
        verdict: content.verdict,
        evaluation_date: content.evaluation_date,
      };
    })
    .sort((a, b) => (a.evaluation_date < b.evaluation_date ? 1 : -1));
}

export function loadReport(id: string): EvaluationResult {
  const jsonPath = path.join(REPORTS_DIR, `${id}.json`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`No report found with id "${id}".`);
  }
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}
