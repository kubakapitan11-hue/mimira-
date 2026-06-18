import "dotenv/config";
import path from "path";
import express from "express";
import { parseRawInput } from "./parser";
import { evaluateCompany } from "./evaluator";
import { saveReport } from "./report";

const app = express();
const PORT = Number(process.env.PORT) || 3333;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "web")));

app.post("/api/evaluate", async (req, res) => {
  try {
    const { text, name } = req.body as { text?: string; name?: string };
    if (!text || !text.trim()) {
      res.status(400).json({ error: "Field 'text' is required." });
      return;
    }

    const parsed = parseRawInput(text, name);
    const result = await evaluateCompany(parsed.cleanedText, parsed.detectedName, {
      sourceWebsite: parsed.sourceWebsite,
      sourceLinkedin: parsed.sourceLinkedin,
    });
    const { jsonPath, mdPath } = saveReport(result);

    res.json({ result, jsonPath, mdPath });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`AIES Evaluator web UI running at http://localhost:${PORT}`);
});
