const DIMENSION_LABELS = {
  outcome_delivery: "Outcome delivery",
  human_in_the_loop: "Human-in-the-loop",
  asymmetric_productivity: "Asymmetric productivity",
  workflow_repeatability: "Workflow repeatability",
  market_wedge: "Market wedge",
  pricing_model: "Pricing model",
  data_moat_potential: "Data moat potential",
};

const DIMENSION_ORDER = Object.keys(DIMENSION_LABELS);

let lastResult = null;

const evaluateBtn = document.getElementById("evaluate-btn");
const errorBox = document.getElementById("error-box");
const resultsSection = document.getElementById("results");

evaluateBtn.addEventListener("click", runEvaluation);
document.getElementById("download-json").addEventListener("click", () => download("json"));
document.getElementById("download-md").addEventListener("click", () => download("md"));

async function runEvaluation() {
  const text = document.getElementById("company-text").value.trim();
  const name = document.getElementById("company-name").value.trim();

  hideError();

  if (!text) {
    showError("Please paste some company text first.");
    return;
  }

  evaluateBtn.disabled = true;
  evaluateBtn.textContent = "Evaluating...";

  try {
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, name: name || undefined }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Evaluation failed.");
    }

    lastResult = data.result;
    renderResult(lastResult);
  } catch (err) {
    showError(err.message || String(err));
  } finally {
    evaluateBtn.disabled = false;
    evaluateBtn.textContent = "Evaluate";
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

function scoreClass(score) {
  if (score >= 80) return "score-strong";
  if (score >= 60) return "score-partial";
  if (score >= 40) return "score-borderline";
  return "score-poor";
}

function verdictText(verdict) {
  return {
    strong_fit: "✅ Strong AI-Enabled Services Fit",
    partial_fit: "⚠️ Partial Fit",
    borderline: "🔶 Borderline",
    does_not_fit: "❌ Does Not Fit",
  }[verdict] || verdict;
}

function renderResult(result) {
  resultsSection.classList.remove("hidden");

  const overallEl = document.getElementById("overall-score");
  overallEl.textContent = `${result.overall_score}/100`;
  overallEl.className = `overall-score ${scoreClass(result.overall_score)}`;

  const verdictEl = document.getElementById("verdict");
  verdictEl.textContent = verdictText(result.verdict);
  verdictEl.className = `verdict ${scoreClass(result.overall_score)}`;

  document.getElementById("verdict-summary").textContent = result.verdict_summary || "";

  document.getElementById("meta-archetype").textContent = result.closest_archetype;
  document.getElementById("meta-vertical").textContent = result.industry_vertical;
  document.getElementById("meta-pricing").textContent = result.pricing_model_detected;
  document.getElementById("meta-role").textContent = result.human_in_loop_role;

  renderDimensions(result.dimensions);
  renderTags("positive-signals", result.positive_signals);
  renderTags("red-flags", result.red_flags);
  renderTags("missing-info", result.missing_information);
  renderTags("comparables", result.comparable_companies);

  document.getElementById("investment-note").textContent = result.investment_note || "";

  resultsSection.scrollIntoView({ behavior: "smooth" });
}

function renderDimensions(dimensions) {
  const container = document.getElementById("dimensions");
  container.innerHTML = "";

  for (const key of DIMENSION_ORDER) {
    const dim = dimensions[key];
    if (!dim) continue;

    const row = document.createElement("div");
    row.className = "dimension-row";

    const head = document.createElement("div");
    head.className = "dimension-head";
    head.innerHTML = `<span>${DIMENSION_LABELS[key]}</span><span>${dim.score.toFixed(1)}/10</span>`;

    const barWrap = document.createElement("div");
    barWrap.className = "dimension-bar";
    const fill = document.createElement("div");
    fill.className = "dimension-fill";
    fill.style.width = `${(dim.score / 10) * 100}%`;
    barWrap.appendChild(fill);

    const details = document.createElement("div");
    details.className = "dimension-details";
    details.innerHTML = `<strong>Evidence:</strong> ${escapeHtml(dim.evidence)}<br/><strong>Gaps:</strong> ${escapeHtml(dim.gaps || "None noted.")}`;

    head.addEventListener("click", () => details.classList.toggle("open"));

    row.appendChild(head);
    row.appendChild(barWrap);
    row.appendChild(details);
    container.appendChild(row);
  }
}

function renderTags(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  if (!items || !items.length) {
    container.innerHTML = '<span style="opacity:0.5">None</span>';
    return;
  }
  for (const item of items) {
    const tag = document.createElement("span");
    tag.textContent = item;
    container.appendChild(tag);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function download(format) {
  if (!lastResult) return;

  let content, mime, filename;
  const slug = (lastResult.company_name || "company").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (format === "json") {
    content = JSON.stringify(lastResult, null, 2);
    mime = "application/json";
    filename = `${slug}.json`;
  } else {
    content = buildMarkdown(lastResult);
    mime = "text/markdown";
    filename = `${slug}.md`;
  }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildMarkdown(result) {
  const lines = [];
  lines.push(`# AI-Enabled Services Evaluation: ${result.company_name}`);
  lines.push("");
  lines.push(`**Overall score:** ${result.overall_score}/100`);
  lines.push(`**Verdict:** ${verdictText(result.verdict)}`);
  lines.push("");
  lines.push(`> ${result.verdict_summary || ""}`);
  lines.push("");
  lines.push("## Dimension scores");
  lines.push("");
  for (const key of DIMENSION_ORDER) {
    const dim = result.dimensions[key];
    if (!dim) continue;
    lines.push(`- **${DIMENSION_LABELS[key]}**: ${dim.score}/10 — ${dim.evidence}`);
  }
  lines.push("");
  lines.push("## Investor note");
  lines.push("");
  lines.push(result.investment_note || "");
  return lines.join("\n");
}
