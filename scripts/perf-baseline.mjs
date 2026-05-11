// scripts/perf-baseline.mjs
// Usage: node scripts/perf-baseline.mjs <output-path>
// Lance Lighthouse mobile sur 2 URLs prod et concatène les métriques clés.
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const URLS = [
  { name: "journey", url: "https://entrepreneur-game-six.vercel.app/journey" },
  { name: "admin", url: "https://entrepreneur-game-six.vercel.app/admin" },
];

const out = process.argv[2];
if (!out) {
  console.error("Usage: node scripts/perf-baseline.mjs <output-path>");
  process.exit(2);
}
mkdirSync(dirname(out), { recursive: true });

const results = [];
for (const { name, url } of URLS) {
  console.log(`[lighthouse] ${name} -> ${url}`);
  const tmp = `${out}.${name}.json`;
  const res = spawnSync("npx", [
    "-y", "lighthouse",
    url,
    "--quiet",
    "--chrome-flags=--headless=new --no-sandbox",
    "--preset=desktop",
    "--only-categories=performance",
    "--output=json",
    `--output-path=${tmp}`,
  ], { stdio: "inherit", shell: true });
  if (res.status !== 0) {
    console.error(`[lighthouse] FAILED for ${name}`);
    process.exit(res.status ?? 1);
  }
  const lhr = JSON.parse(readFileSync(tmp, "utf8"));
  results.push({
    name,
    url,
    measuredAt: new Date().toISOString(),
    lcpMs: Math.round(lhr.audits["largest-contentful-paint"].numericValue),
    fcpMs: Math.round(lhr.audits["first-contentful-paint"].numericValue),
    ttiMs: Math.round(lhr.audits["interactive"].numericValue),
    tbtMs: Math.round(lhr.audits["total-blocking-time"].numericValue),
    perfScore: Math.round(lhr.categories.performance.score * 100),
  });
}

writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`[perf-baseline] wrote ${out}`);
console.table(results);
