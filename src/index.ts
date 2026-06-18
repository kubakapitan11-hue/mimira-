import "dotenv/config";
import fs from "fs";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { parseRawInput } from "./parser";
import { evaluateCompany } from "./evaluator";
import { printReport, saveReport, listReports, loadReport } from "./report";

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

const program = new Command();

program
  .name("aies-evaluator")
  .description("Evaluate whether a company qualifies as an AI-Enabled Services company");

program
  .command("evaluate")
  .description("Evaluate a company from a file or pasted stdin text")
  .option("--file <path>", "path to a text file with company info")
  .option("--paste", "read company text from stdin")
  .option("--name <name>", "company name hint")
  .option("--verbose", "print the raw prompt sent to Claude")
  .action(async (opts) => {
    try {
      let raw: string;
      if (opts.file) {
        raw = fs.readFileSync(opts.file, "utf-8");
      } else if (opts.paste) {
        console.log(chalk.dim("Paste company text, then press Ctrl+D (or Ctrl+Z on Windows) to finish:"));
        raw = await readStdin();
      } else {
        console.error(chalk.red("Error: provide --file <path> or --paste."));
        process.exitCode = 1;
        return;
      }

      const parsed = parseRawInput(raw, opts.name);

      const spinner = ora("Evaluating against AI-Enabled Services framework...").start();
      try {
        const result = await evaluateCompany(parsed.cleanedText, parsed.detectedName, {
          verbose: opts.verbose,
          sourceWebsite: parsed.sourceWebsite,
          sourceLinkedin: parsed.sourceLinkedin,
        });
        spinner.succeed("Evaluation complete.");

        printReport(result);
        const { jsonPath, mdPath } = saveReport(result);
        console.log(`\n  Report saved: ${jsonPath}`);
        console.log(`  Report saved: ${mdPath}\n`);
      } catch (err) {
        spinner.fail("Evaluation failed.");
        throw err;
      }
    } catch (err) {
      console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
      process.exitCode = 1;
    }
  });

program
  .command("list")
  .description("List all saved reports")
  .action(() => {
    const reports = listReports();
    if (!reports.length) {
      console.log(chalk.dim("No reports saved yet."));
      return;
    }
    for (const r of reports) {
      console.log(
        `${chalk.cyan(r.id)}  ${r.overall_score}/100  ${r.verdict}  ${r.evaluation_date}`
      );
    }
  });

program
  .command("show")
  .description("Show a specific saved report")
  .requiredOption("--id <id>", "report id")
  .action((opts) => {
    try {
      const result = loadReport(opts.id);
      printReport(result);
    } catch (err) {
      console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
      process.exitCode = 1;
    }
  });

program.parse();
