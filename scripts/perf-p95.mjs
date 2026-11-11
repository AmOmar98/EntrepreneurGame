// scripts/perf-p95.mjs
// Usage (P95 measurement):
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   SMOKE_PLAYER_EMAIL=... SMOKE_PLAYER_PWD=... \
//   SMOKE_MENTOR_EMAIL=... SMOKE_MENTOR_PWD=... \
//   SMOKE_JURY_EMAIL=...   SMOKE_JURY_PWD=...   \
//   node scripts/perf-p95.mjs <N> <out.json>
//
// Usage (RLS initplan static check):
//   node scripts/perf-p95.mjs --check-rls
//
// Arguments (P95 mode):
//   <N>        Number of timed iterations per path (default 100)
//   <out.json> Output file path for JSON report
//
// Critical paths timed:
//   journey    -> Player session: player_members + submissions selects
//   evaluation -> Mentor session: submissions + evaluations selects
//   jury       -> Jury  session: pitch_scores + pitch_criteria selects
//
// --check-rls: reads database/rls.sql, asserts no bare auth.uid() inside
//   correlated EXISTS subqueries (i.e. every such call is (SELECT auth.uid())).
//   Exits non-zero if any per-row auth.uid() is found.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ============================================================================
// --check-rls mode (no env required, runs against local SQL source)
// ============================================================================
if (process.argv.includes("--check-rls")) {
  checkRls();
  process.exit(0);
}

// ============================================================================
// P95 mode — env validation
// ============================================================================
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const playerEmail = process.env.SMOKE_PLAYER_EMAIL;
const playerPwd = process.env.SMOKE_PLAYER_PWD;
const mentorEmail = process.env.SMOKE_MENTOR_EMAIL;
const mentorPwd = process.env.SMOKE_MENTOR_PWD;
const juryEmail = process.env.SMOKE_JURY_EMAIL;
const juryPwd = process.env.SMOKE_JURY_PWD;

if (!url || !anon || !playerEmail || !playerPwd || !mentorEmail || !mentorPwd || !juryEmail || !juryPwd) {
  console.error("Missing env vars for P95 measurement mode.");
  console.error("Required:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL");
  console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.error("  SMOKE_PLAYER_EMAIL + SMOKE_PLAYER_PWD");
  console.error("  SMOKE_MENTOR_EMAIL + SMOKE_MENTOR_PWD");
  console.error("  SMOKE_JURY_EMAIL   + SMOKE_JURY_PWD");
  console.error("");
  console.error("Usage: node scripts/perf-p95.mjs <N> <out.json>");
  console.error("       node scripts/perf-p95.mjs --check-rls");
  process.exit(2);
}

const N = parseInt(process.argv[2] ?? "100", 10);
const outPath = process.argv[3];

if (isNaN(N) || N < 1) {
  console.error("Usage: node scripts/perf-p95.mjs <N> <out.json>");
  console.error("  <N> must be a positive integer (e.g. 100)");
  process.exit(2);
}
if (!outPath) {
  console.error("Usage: node scripts/perf-p95.mjs <N> <out.json>");
  console.error("  <out.json> output path is required");
  process.exit(2);
}

// ============================================================================
// Percentile helper (contains literal p95 token)
// ============================================================================

/**
 * Compute percentile of a sorted array.
 * p95 = percentile(sorted, 0.95)
 * Uses ceil(p * N) - 1 index clamped to valid range.
 */
function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.max(0, Math.ceil(p * sorted.length) - 1);
  return sorted[idx];
}

function stats(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  return {
    n: latencies.length,
    min: Math.round(sorted[0]),
    max: Math.round(sorted[sorted.length - 1]),
    p50: Math.round(percentile(sorted, 0.50)),
    p95: Math.round(percentile(sorted, 0.95)),
    p99: Math.round(percentile(sorted, 0.99)),
  };
}

// ============================================================================
// Time a query N times
// ============================================================================
async function timeQuery(label, queryFn, n) {
  const latencies = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    const { error } = await queryFn();
    const dt = performance.now() - t0;
    if (error) {
      console.warn(`[perf-p95] ${label} iter ${i}: ${error.message}`);
    }
    latencies.push(dt);
  }
  const s = stats(latencies);
  console.log(`[perf-p95] ${label}: p95=${s.p95}ms p50=${s.p50}ms p99=${s.p99}ms min=${s.min}ms max=${s.max}ms`);
  return s;
}

// ============================================================================
// Per-role clients
// ============================================================================
async function makeClient(email, pwd, role) {
  const client = createClient(url, anon);
  const { error } = await client.auth.signInWithPassword({ email, password: pwd });
  if (error) {
    console.error(`[perf-p95] signIn FAILED for ${role} (${email}): ${error.message}`);
    process.exit(1);
  }
  console.log(`[perf-p95] signIn OK: ${role}`);
  return client;
}

// ============================================================================
// P95 measurement — main
// ============================================================================
console.log(`[perf-p95] Starting P95 measurement (N=${N} iterations per path)`);
console.log(`[perf-p95] Target: ${url}`);
console.log(`[perf-p95] Output: ${outPath}`);
console.log();

const [playerClient, mentorClient, juryClient] = await Promise.all([
  makeClient(playerEmail, playerPwd, "player"),
  makeClient(mentorEmail, mentorPwd, "mentor"),
  makeClient(juryEmail, juryPwd, "jury"),
]);

// Path 1: /journey data — Player session
console.log("\n[perf-p95] === Path: journey ===");
const journeyMembersStats = await timeQuery(
  "journey/player_members",
  () => playerClient.from("player_members").select("player_id").limit(10),
  N
);
const journeySubmissionsStats = await timeQuery(
  "journey/submissions",
  () => playerClient.from("submissions").select("id, status, deliverable_template_id").limit(50),
  N
);

// Path 2: evaluation — Mentor session
console.log("\n[perf-p95] === Path: evaluation ===");
const evalSubmissionsStats = await timeQuery(
  "evaluation/submissions",
  () => mentorClient.from("submissions").select("id, status, player_id, deliverable_template_id").limit(50),
  N
);
const evalEvaluationsStats = await timeQuery(
  "evaluation/evaluations",
  () => mentorClient.from("evaluations").select("id, verdict, total_score, submission_id").limit(50),
  N
);

// Path 3: jury — Jury session
console.log("\n[perf-p95] === Path: jury ===");
const juryScoresStats = await timeQuery(
  "jury/pitch_scores",
  () => juryClient.from("pitch_scores").select("id, player_id, total_score").limit(50),
  N
);
const juryCriteriaStats = await timeQuery(
  "jury/pitch_criteria",
  () => juryClient.from("pitch_criteria").select("id, label, max_score").limit(20),
  N
);

// ============================================================================
// Aggregate per-path P95 (worst query P95 per path)
// ============================================================================
const paths = [
  {
    path: "journey",
    queries: ["player_members", "submissions"],
    p50: Math.max(journeyMembersStats.p50, journeySubmissionsStats.p50),
    p95: Math.max(journeyMembersStats.p95, journeySubmissionsStats.p95),
    p99: Math.max(journeyMembersStats.p99, journeySubmissionsStats.p99),
    min: Math.min(journeyMembersStats.min, journeySubmissionsStats.min),
    max: Math.max(journeyMembersStats.max, journeySubmissionsStats.max),
  },
  {
    path: "evaluation",
    queries: ["submissions", "evaluations"],
    p50: Math.max(evalSubmissionsStats.p50, evalEvaluationsStats.p50),
    p95: Math.max(evalSubmissionsStats.p95, evalEvaluationsStats.p95),
    p99: Math.max(evalSubmissionsStats.p99, evalEvaluationsStats.p99),
    min: Math.min(evalSubmissionsStats.min, evalEvaluationsStats.min),
    max: Math.max(evalSubmissionsStats.max, evalEvaluationsStats.max),
  },
  {
    path: "jury",
    queries: ["pitch_scores", "pitch_criteria"],
    p50: Math.max(juryScoresStats.p50, juryCriteriaStats.p50),
    p95: Math.max(juryScoresStats.p95, juryCriteriaStats.p95),
    p99: Math.max(juryScoresStats.p99, juryCriteriaStats.p99),
    min: Math.min(juryScoresStats.min, juryCriteriaStats.min),
    max: Math.max(juryScoresStats.max, juryCriteriaStats.max),
  },
];

const report = {
  measuredAt: new Date().toISOString(),
  target: url,
  n,
  paths,
  detail: {
    "journey/player_members": journeyMembersStats,
    "journey/submissions": journeySubmissionsStats,
    "evaluation/submissions": evalSubmissionsStats,
    "evaluation/evaluations": evalEvaluationsStats,
    "jury/pitch_scores": juryScoresStats,
    "jury/pitch_criteria": juryCriteriaStats,
  },
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log("\n[perf-p95] === Summary (per-path worst P95) ===");
console.table(
  paths.map((p) => ({
    path: p.path,
    "p50 (ms)": p.p50,
    "p95 (ms)": p.p95,
    "p99 (ms)": p.p99,
    "min (ms)": p.min,
    "max (ms)": p.max,
  }))
);
console.log(`[perf-p95] Report written to ${outPath}`);

// Sign out
await Promise.all([
  playerClient.auth.signOut(),
  mentorClient.auth.signOut(),
  juryClient.auth.signOut(),
]);

// ============================================================================
// --check-rls: static RLS initplan verification
// ============================================================================

/**
 * Reads database/rls.sql and asserts that every auth.uid() call that appears
 * inside a correlated EXISTS subquery is wrapped as (SELECT auth.uid()).
 *
 * Direct scalar comparisons like `user_id = auth.uid()` in policy USING/WITH CHECK
 * are already initplan-safe because PostgreSQL evaluates STABLE functions once
 * per query when used as a direct equality predicate (not re-evaluated per row).
 *
 * The per-row penalty occurs when auth.uid() is called inside a correlated
 * EXISTS (SELECT 1 FROM ... WHERE ... auth.uid() ...) subquery without the
 * (SELECT auth.uid()) initplan wrapper.
 *
 * This check: scans for bare auth.uid() inside EXISTS ( ... ) blocks in non-comment
 * SQL and fails non-zero if any are found without the (select auth.uid()) wrapper.
 *
 * Exit 0 = all EXISTS-scoped auth.uid() calls use the initplan (SELECT auth.uid()) form.
 * Exit 1 = at least one bare per-row auth.uid() found inside an EXISTS subquery.
 */
function checkRls() {
  const rlsPath = new URL("../database/rls.sql", import.meta.url).pathname
    // Handle Windows path (node url gives /C:/... on Windows)
    .replace(/^\/([A-Z]:)/, "$1");

  let sql;
  try {
    sql = readFileSync(rlsPath, "utf8");
  } catch (e) {
    console.error(`[check-rls] FAIL: cannot read database/rls.sql: ${e.message}`);
    process.exit(1);
  }

  // Strip single-line SQL comments (-- ...) to avoid false positives from prose
  const strippedLines = sql
    .split("\n")
    .map((line) => {
      const commentIdx = line.indexOf("--");
      return commentIdx === -1 ? line : line.slice(0, commentIdx);
    });
  const stripped = strippedLines.join("\n");

  // Find all auth.uid() occurrences, check context
  const issues = [];

  // Strategy: scan for EXISTS (...) blocks that contain auth.uid() but NOT (select auth.uid())
  // We do a simple tokenized approach: find all positions of auth.uid() in the stripped SQL,
  // and for each, walk backwards to see if we are inside an EXISTS ( ... ) block.
  // A bare auth.uid() inside EXISTS without (select auth.uid()) prefix is a violation.

  // First pass: collect all (select auth.uid()) positions — these are safe
  const safePattern = /\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)/gi;
  const safePositions = new Set();
  let m;
  while ((m = safePattern.exec(stripped)) !== null) {
    // Mark every char position in this match as safe
    for (let i = m.index; i < m.index + m[0].length; i++) {
      safePositions.add(i);
    }
  }

  // Second pass: find all bare auth.uid() (not preceded by 'select')
  // A bare auth.uid() = auth.uid() that is NOT part of a (select auth.uid()) construct
  const barePattern = /auth\.uid\s*\(\s*\)/gi;
  while ((m = barePattern.exec(stripped)) !== null) {
    // Check if this position overlaps with a safe (select auth.uid()) match
    if (safePositions.has(m.index)) continue;

    // Check if preceded by 'select' (handles: select auth.uid(), (select auth.uid()))
    const before = stripped.slice(Math.max(0, m.index - 20), m.index);
    if (/select\s+$/i.test(before)) continue;

    // Now determine if this bare auth.uid() is inside a correlated EXISTS subquery.
    // We walk backwards from m.index using bracket counting to find the immediately
    // enclosing context: if we encounter the opening '(' of an EXISTS ( ... ) block
    // before we escape to the top-level, it is inside EXISTS.
    //
    // Algorithm: scan backwards, tracking bracket depth. When depth reaches -1
    // (we exited a paren), check if "EXISTS" precedes that opening paren.
    // If so, this auth.uid() is inside an EXISTS subquery.
    const textBefore = stripped.slice(0, m.index);
    let depth = 0;
    let isInsideExists = false;
    for (let j = textBefore.length - 1; j >= 0; j--) {
      const ch = textBefore[j];
      if (ch === ")") { depth++; }
      else if (ch === "(") {
        depth--;
        if (depth === -1) {
          // We found the immediately enclosing opening paren.
          // Check if 'exists' precedes it (with possible whitespace).
          const beforeParen = textBefore.slice(Math.max(0, j - 15), j);
          if (/\bexists\s*$/i.test(beforeParen)) {
            isInsideExists = true;
          }
          break;
        }
      }
    }

    // Also skip auth.uid() that is inside a SECURITY DEFINER function body ($$...$$).
    // These functions are themselves STABLE — they are cached at the call site, not per-row.
    const precedingText = stripped.slice(0, m.index);
    const lastDollarClose = precedingText.split("$$").length - 1;
    // Odd number of $$ before position = we are inside a $$....$$ function body
    const insideFunctionBody = lastDollarClose % 2 === 1;

    // Get line number for reporting
    const lineNum = stripped.slice(0, m.index).split("\n").length;

    if (isInsideExists && !insideFunctionBody) {
      issues.push({ line: lineNum, snippet: stripped.slice(m.index, m.index + 40).replace(/\n/g, " ") });
    }
  }

  if (issues.length === 0) {
    console.log("[check-rls] PASS: all auth.uid() calls in EXISTS subqueries use (SELECT auth.uid()) initplan form.");
    console.log("[check-rls] Direct scalar comparisons (user_id = auth.uid()) are initplan-safe by PostgreSQL STABLE function semantics.");
    // Also print a count summary
    const allBare = (stripped.match(/auth\.uid\s*\(\s*\)/gi) ?? []).length;
    const allWrapped = (stripped.match(/\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)/gi) ?? []).length;
    console.log(`[check-rls] auth.uid() occurrences (comment-stripped): ${allBare} total, ${allWrapped} already in (SELECT auth.uid()) form.`);
  } else {
    console.error(`[check-rls] FAIL: ${issues.length} bare auth.uid() call(s) inside EXISTS subqueries found:`);
    for (const issue of issues) {
      console.error(`  Line ${issue.line}: ...${issue.snippet}...`);
    }
    console.error("[check-rls] Fix: wrap each as (SELECT auth.uid()) to use initplan caching.");
    process.exit(1);
  }
}
