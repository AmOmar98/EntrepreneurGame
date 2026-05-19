// Flatten MCP execute_sql JSON result -> CSV (1 row per porteur)
// Input  : tool-results file path (env INPUT)
// Output : .planning/exports/26MMDD-cohorte-agreentech-consolide.csv
//
// Usage: node tools/export-cohort-flatten.cjs <input-file>

const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node tools/export-cohort-flatten.cjs <input-file>");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");
const outer = JSON.parse(raw);
const resultStr = outer.result;

const m = resultStr.match(/<untrusted-data-[a-f0-9-]+>\n([\s\S]+?)\n<\/untrusted-data-[a-f0-9-]+>/);
if (!m) {
  console.error("Could not find untrusted-data block");
  process.exit(2);
}
const rows = JSON.parse(m[1]);

const SLUGS = [
  "probleme-v1",
  "personae-v1",
  "esquisse-solution-v1",
  "fiche-produit-plan-dev-v1",
  "etude-marche-v1",
  "tam-sam-som-v1",
  "bmc-v1",
  "couts-previsions-v1",
  "strategie-commerciale-v1",
  "pitch-deck-v1",
];

const VERSION_FIELDS = ["proof_url", "status", "submitted_at", "mentor_score_avg", "n_evaluators", "verdicts", "feedbacks"];

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  let s = typeof v === "string" ? v : (typeof v === "object" ? JSON.stringify(v) : String(v));
  s = s.replace(/\r?\n/g, " ").replace(/\r/g, " ");
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Build header
const meta = [
  "player_slug",
  "player_name",
  "owner_email",
  "owner_full_name",
  "idea_seed",
  "current_level",
  "player_status",
  "score_project",
  "score_engagement",
  "onboarded_at",
  "created_at",
  "updated_at",
  "cohort_slug",
  "n_submissions",
  "n_validated",
  "n_rejected",
];

const deliverableCols = [];
for (const slug of SLUGS) {
  for (const v of ["v1", "v2"]) {
    for (const f of VERSION_FIELDS) {
      deliverableCols.push(`${slug}__${v}__${f}`);
    }
  }
}

const pitch = [
  "pitch_mean_total",
  "pitch_n_jurors",
  "pitch_detail_json",
];

const computed = [
  "mentor_mean_last_version_on_100",
  "final_weighted_20_80_on_100",
];

const header = [...meta, ...deliverableCols, ...pitch, ...computed];

const outRows = [header.map(csvEscape).join(";")];

for (const r of rows) {
  const line = [];
  for (const k of meta) {
    line.push(csvEscape(r[k]));
  }
  // Deliverable cols
  const deliv = r.deliverables || {};
  const lastVersionScores = []; // for mentor mean
  for (const slug of SLUGS) {
    const payload = deliv[slug] || {};
    const v1 = payload.v1 || null;
    const v2 = payload.v2 || null;
    for (const v of ["v1", "v2"]) {
      const obj = v === "v1" ? v1 : v2;
      for (const f of VERSION_FIELDS) {
        line.push(csvEscape(obj ? obj[f] : null));
      }
    }
    // last version score for aggregate
    const last = v2 || v1;
    if (last && last.mentor_score_avg !== null && last.mentor_score_avg !== undefined) {
      lastVersionScores.push(Number(last.mentor_score_avg));
    }
  }
  // Pitch
  line.push(csvEscape(r.pitch_mean_total));
  line.push(csvEscape(r.pitch_n_jurors));
  line.push(csvEscape(r.pitch_detail));

  // Computed: mentor mean /100 (each score on 25 max -> *4) over the 10 last-version submissions
  let mentorOn100 = null;
  if (lastVersionScores.length > 0) {
    const meanOn25 = lastVersionScores.reduce((a, b) => a + b, 0) / lastVersionScores.length;
    mentorOn100 = Math.round(meanOn25 * 4 * 100) / 100;
  }
  line.push(csvEscape(mentorOn100));

  // Final weighted: 0.20*mentor + 0.80*jury (both /100)
  let final = null;
  const jury = r.pitch_mean_total !== null && r.pitch_mean_total !== undefined ? Number(r.pitch_mean_total) : null;
  if (mentorOn100 !== null && jury !== null) {
    final = Math.round((0.20 * mentorOn100 + 0.80 * jury) * 100) / 100;
  }
  line.push(csvEscape(final));

  outRows.push(line.join(";"));
}

const today = new Date();
const yy = String(today.getFullYear()).slice(2);
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const outDir = path.resolve(__dirname, "..", ".planning", "exports");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${yy}${mm}${dd}-cohorte-agreentech-consolide.csv`);
fs.writeFileSync(outPath, "﻿" + outRows.join("\n") + "\n", "utf8");

console.log(JSON.stringify({
  ok: true,
  rows: rows.length,
  columns: header.length,
  output: outPath,
}, null, 2));
