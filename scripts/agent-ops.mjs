#!/usr/bin/env node
/**
 * scripts/agent-ops.mjs
 *
 * Cross-platform CLI for Agent-Managed Operations & Traceability across:
 *   - GitHub / Git (isolated worktrees, commit/branch inspection, pre-hotfix tags)
 *   - Vercel CLI (`prj_u3jR0YiNr2WnCFEoG6g1yDShikdH` / `entrepreneur-game`)
 *   - Public HTTP probes (`https://entrepreneur-game-six.vercel.app`)
 *   - Static & Cardinal Gates (R1, R2, R3, typecheck, lint, unit tests)
 *   - Traceability Ledger (`.planning/ops-ledger/ticks/` and `.planning/ops-ledger/incidents/`)
 *
 * Usage:
 *   node scripts/agent-ops.mjs gates [--with-tests]
 *   node scripts/agent-ops.mjs tick [--event-label <label>]
 *   node scripts/agent-ops.mjs worktree-create <slug> [--base <ref>]
 *   node scripts/agent-ops.mjs incident-init <slug> [--tier 1|2] [--trigger <tick-id>]
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const VERCEL_PROJECT_ID = "prj_u3jR0YiNr2WnCFEoG6g1yDShikdH";
const VERCEL_PROJECT_NAME = "entrepreneur-game";
const PROD_URL = "https://entrepreneur-game-six.vercel.app";
const SUPABASE_PROJECT_ID = "vzzbjxmfkmvqkaqxalhr";

const LEDGER_DIR = path.join(REPO_ROOT, ".planning", "ops-ledger");
const TICKS_DIR = path.join(LEDGER_DIR, "ticks");
const INCIDENTS_DIR = path.join(LEDGER_DIR, "incidents");

function ensureDirs() {
  fs.mkdirSync(TICKS_DIR, { recursive: true });
  fs.mkdirSync(INCIDENTS_DIR, { recursive: true });
}

function utcCompact(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

function runCmd(cmd, args, opts = {}) {
  const isWin = process.platform === "win32";
  const useShell = isWin && (cmd === "npm" || cmd === "npx" || cmd === "vercel");
  const safeArgs = useShell
    ? args.map((a) => (/[&|<>^ ]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a))
    : args;
  const res = spawnSync(cmd, safeArgs, {
    cwd: opts.cwd ?? REPO_ROOT,
    encoding: "utf8",
    shell: useShell,
    env: { ...process.env, ...(opts.env ?? {}) },
  });
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    stdout: (res.stdout ?? "").trim(),
    stderr: (res.stderr ?? "").trim(),
  };
}

function walkFiles(dir, exts = [".ts", ".tsx"]) {
  const results = [];
  const absDir = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(absDir)) return results;
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(path.join(dir, entry.name), exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function relPath(absPath) {
  return path.relative(REPO_ROOT, absPath).replace(/\\/g, "/");
}

function checkR1() {
  const files = [...walkFiles("app/journey", [".tsx"])];
  const compDir = path.join(REPO_ROOT, "components");
  if (fs.existsSync(compDir)) {
    for (const entry of fs.readdirSync(compDir)) {
      if (
        entry.endsWith(".tsx") &&
        (entry.startsWith("submission-") ||
          entry.startsWith("engagement-") ||
          entry.startsWith("cohort-"))
      ) {
        files.push(path.join(compDir, entry));
      }
    }
  }

  const r1Regex = /score|rank|note|\/100|\/140|points|toFixed/;
  const deliverableRankRegex = /rank|classement|percentile|leaderboard/i;
  const suspicious = [];

  for (const file of files) {
    const rel = relPath(file);
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

    // Deliverable detail page & SubmissionReadonly: score is allowed (R1 revised), rank is strictly forbidden
    if (rel.startsWith("app/journey/deliverable/") || rel === "components/submission-readonly.tsx") {
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("*") ||
          trimmed.startsWith("/*") ||
          trimmed.startsWith("{/*") ||
          trimmed.endsWith("*/}") ||
          trimmed.endsWith("*/")
        )
          return;
        if (deliverableRankRegex.test(line)) {
          suspicious.push(`${rel}:${idx + 1}: [rank forbidden on deliverable detail] ${trimmed}`);
        }
      });
      continue;
    }

    lines.forEach((line, idx) => {
      if (!r1Regex.test(line)) return;
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      if (/rewardXp|reward_xp|max_score/.test(line)) return;
      if (/:\s*Record<|:\s*number\s*;|:\s*number\s*\||as\s+|\.select\(|\.from\(/.test(line)) return;
      if (/isGameMaster|isGm\b/.test(line)) return;
      suspicious.push(`${rel}:${idx + 1}: ${trimmed}`);
    });
  }

  // Verify structural GM/Juror gates on /results and /results/ceremony
  const resultsPagePath = path.join(REPO_ROOT, "app", "results", "page.tsx");
  if (fs.existsSync(resultsPagePath)) {
    const content = fs.readFileSync(resultsPagePath, "utf8");
    if (!content.includes("if (!isGm && !isJuror && !isPublished)") || !content.includes("if (!isGm && !isJuror && isPublished)")) {
      suspicious.push("app/results/page.tsx: missing (!isGm && !isJuror) ThankYouScreen gate");
    }
    const thankYouIdx = content.indexOf("function ThankYouScreen");
    if (thankYouIdx >= 0) {
      const thankYouLines = content.slice(thankYouIdx).split(/\r?\n/);
      thankYouLines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
        if (r1Regex.test(line)) {
          suspicious.push(`app/results/page.tsx (ThankYouScreen+${idx}): ${trimmed}`);
        }
      });
    }
  }

  const ceremonyPagePath = path.join(REPO_ROOT, "app", "results", "ceremony", "page.tsx");
  if (fs.existsSync(ceremonyPagePath)) {
    const content = fs.readFileSync(ceremonyPagePath, "utf8");
    if (!content.includes('role !== "game_master"')) {
      suspicious.push('app/results/ceremony/page.tsx: missing role !== "game_master" gate');
    }
  }

  return {
    ok: suspicious.length === 0,
    suspicious,
  };
}

function checkR2() {
  const files = [
    ...walkFiles("app", [".ts", ".tsx"]),
    ...walkFiles("lib", [".ts", ".tsx"]),
    ...walkFiles("components", [".ts", ".tsx"]),
  ];
  const r2Regex = /severity\s*:\s*["']error["']/;
  const violations = [];

  for (const file of files) {
    const rel = relPath(file);
    if (rel === "app/actions.ts") continue; // Whitelisted WorkflowState markers
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      if (r2Regex.test(line)) {
        violations.push(`${rel}:${idx + 1}: ${trimmed}`);
      }
    });
  }

  return {
    ok: violations.length === 0,
    violations,
  };
}

function checkR3() {
  const actionsPath = path.join(REPO_ROOT, "app", "actions.ts");
  if (!fs.existsSync(actionsPath)) {
    return { ok: false, error: "app/actions.ts missing" };
  }
  const content = fs.readFileSync(actionsPath, "utf8");
  const hasSingleL2Exception =
    content.includes("HARD_BLOCK_DEPENDENCIES") &&
    content.includes('"fiches-entretien-v1": "prep-questions-v1"');
  return {
    ok: hasSingleL2Exception,
    detail: hasSingleL2Exception
      ? "HARD_BLOCK_DEPENDENCIES preserves single L2 exception (fiches-entretien-v1 -> prep-questions-v1)"
      : "HARD_BLOCK_DEPENDENCIES invariant missing or altered in app/actions.ts",
  };
}

async function runGates(withTests = false) {
  console.log("=== [agent-ops] Running Cardinal & Static Gates ===");
  const r1 = checkR1();
  console.log(`[R1] Score/Rank privacy gate: ${r1.ok ? "PASS" : "FAIL"}`);
  if (!r1.ok) r1.suspicious.forEach((s) => console.error(`  - ${s}`));

  const r2 = checkR2();
  console.log(`[R2] Warn-only validator gate: ${r2.ok ? "PASS" : "FAIL"}`);
  if (!r2.ok) r2.violations.forEach((v) => console.error(`  - ${v}`));

  const r3 = checkR3();
  console.log(`[R3] Prerequisite invariant gate: ${r3.ok ? "PASS" : "FAIL"} (${r3.detail})`);

  let allOk = r1.ok && r2.ok && r3.ok;

  if (withTests) {
    for (const script of ["typecheck", "lint", "test:unit"]) {
      console.log(`[npm run ${script}] running...`);
      const res = runCmd("npm", ["run", script], {
        env: {
          NEXT_PUBLIC_SUPABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
        },
      });
      console.log(`[npm run ${script}] ${res.ok ? "PASS" : "FAIL"}`);
      if (!res.ok) {
        console.error(res.stdout || res.stderr);
        allOk = false;
      }
    }
  }

  return { ok: allOk, r1, r2, r3 };
}

async function probeHttp(url, marker = null) {
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual" });
    const ms = Date.now() - start;
    const status = res.status;
    let markerOk = true;
    if (marker && status >= 200 && status < 400) {
      const body = await res.text();
      markerOk = body.includes(marker);
    }
    return {
      ok: status >= 200 && status < 400 && markerOk,
      status,
      ms,
      markerOk,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - start,
      error: err.message,
    };
  }
}

function fetchVercelDeployments() {
  const res = runCmd("vercel", [
    "api",
    `/v6/deployments?app=${VERCEL_PROJECT_NAME}&limit=5`,
    "--method",
    "GET",
  ]);
  if (!res.ok) {
    return { ok: false, error: res.stderr || res.stdout };
  }
  try {
    const jsonStart = res.stdout.indexOf("{");
    const payload = JSON.parse(jsonStart >= 0 ? res.stdout.slice(jsonStart) : res.stdout);
    const deployments = (payload.deployments ?? []).map((d) => ({
      uid: d.uid,
      state: d.state,
      readySubstate: d.readySubstate ?? null,
      target: d.target ?? "preview",
      url: d.url,
      branch: d.meta?.githubCommitRef ?? null,
      sha: d.meta?.githubCommitSha?.slice(0, 7) ?? null,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    }));
    return { ok: true, deployments };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function getGitContext() {
  const branch = runCmd("git", ["branch", "--show-current"]).stdout;
  const headSha = runCmd("git", ["rev-parse", "--short", "HEAD"]).stdout;
  const mainSha = runCmd("git", ["rev-parse", "--short", "main"]).stdout;
  const dirtyCount = runCmd("git", ["status", "--porcelain"])
    .stdout.split(/\r?\n/)
    .filter(Boolean).length;
  return { branch, headSha, mainSha, dirtyCount };
}

async function runTick(eventLabel = "LIVE-OPS") {
  ensureDirs();
  const now = new Date();
  const stamp = utcCompact(now);
  const tickId = `TICK-${stamp}`;

  const [homeProbe, loginProbe] = await Promise.all([
    probeHttp(`${PROD_URL}/`),
    probeHttp(`${PROD_URL}/login`, "Entrepreneur Game"),
  ]);

  const vercel = fetchVercelDeployments();
  const git = getGitContext();
  const gates = await runGates(false);

  const prodDeploy = vercel.ok
    ? vercel.deployments.find((d) => d.target === "production") ?? vercel.deployments[0]
    : null;
  const latestDeploy = vercel.ok ? vercel.deployments[0] : null;

  let verdict = "VERT";
  const warnings = [];
  const hardTriggers = [];

  if (!homeProbe.ok || !loginProbe.ok) {
    hardTriggers.push(
      `HTTP probe failed (/: ${homeProbe.status} in ${homeProbe.ms}ms, /login: ${loginProbe.status} in ${loginProbe.ms}ms)`
    );
  } else if (homeProbe.ms > 3000 || loginProbe.ms > 3000) {
    hardTriggers.push(`HTTP latency > 3000ms (/: ${homeProbe.ms}ms, /login: ${loginProbe.ms}ms)`);
  } else if (homeProbe.ms > 1500 || loginProbe.ms > 1500) {
    warnings.push(`HTTP latency > 1500ms (/: ${homeProbe.ms}ms, /login: ${loginProbe.ms}ms)`);
  }

  if (!vercel.ok) {
    warnings.push(`Vercel API check warning: ${vercel.error}`);
  } else if (latestDeploy && latestDeploy.state === "ERROR") {
    hardTriggers.push(`Latest Vercel deployment ${latestDeploy.uid} (${latestDeploy.sha}) is in state ERROR`);
  }

  if (!gates.ok) {
    hardTriggers.push("Cardinal static gate (R1/R2/R3) failed on local checkout");
  }

  if (hardTriggers.length > 0) verdict = "HARD";
  else if (warnings.length > 0) verdict = "WARN";

  const record = {
    tickId,
    timestamp: now.toISOString(),
    eventLabel,
    verdict,
    supabaseProjectId: SUPABASE_PROJECT_ID,
    vercelProjectId: VERCEL_PROJECT_ID,
    http: { home: homeProbe, login: loginProbe },
    vercel: {
      ok: vercel.ok,
      productionDeployment: prodDeploy,
      latestDeployment: latestDeploy,
    },
    git,
    cardinalGates: {
      r1: gates.r1.ok,
      r2: gates.r2.ok,
      r3: gates.r3.ok,
    },
    warnings,
    hardTriggers,
  };

  const mdLines = [
    `# ${tickId} · ${eventLabel} · ${verdict}`,
    ``,
    `- **Timestamp (UTC)** : \`${record.timestamp}\``,
    `- **Prod URL (\`/\`)** : status \`${homeProbe.status}\` · \`${homeProbe.ms}ms\``,
    `- **Prod Login (\`/login\`)** : status \`${loginProbe.status}\` · \`${loginProbe.ms}ms\` · marker \`${loginProbe.markerOk ? "OK" : "MISSING"}\``,
    `- **Vercel Prod Deployment** : ${
      prodDeploy
        ? `\`${prodDeploy.uid}\` (\`${prodDeploy.state}\` / \`${prodDeploy.readySubstate}\`) · branch \`${prodDeploy.branch}\` @ \`${prodDeploy.sha}\``
        : "unavailable"
    }`,
    `- **Vercel Latest Deployment** : ${
      latestDeploy
        ? `\`${latestDeploy.uid}\` (\`${latestDeploy.state}\` / target=\`${latestDeploy.target}\`) · branch \`${latestDeploy.branch}\` @ \`${latestDeploy.sha}\``
        : "unavailable"
    }`,
    `- **Local Git Context** : branch \`${git.branch}\` @ \`${git.headSha}\` (\`main\` @ \`${git.mainSha}\`, dirty files: ${git.dirtyCount})`,
    `- **Cardinal Static Gates** : R1=\`${gates.r1.ok ? "PASS" : "FAIL"}\` · R2=\`${gates.r2.ok ? "PASS" : "FAIL"}\` · R3=\`${gates.r3.ok ? "PASS" : "FAIL"}\``,
    `- **Supabase Project** : \`${SUPABASE_PROJECT_ID}\` (enrich with MCP \`query_logs\` / \`execute_sql\` / \`get_advisors\` during live ticks)`,
  ];

  if (warnings.length > 0) {
    mdLines.push(``, `## Warnings`, ...warnings.map((w) => `- ${w}`));
  }
  if (hardTriggers.length > 0) {
    mdLines.push(``, `## HARD Triggers`, ...hardTriggers.map((t) => `- ${t}`));
  }

  const mdPath = path.join(TICKS_DIR, `${tickId}.md`);
  const jsonPath = path.join(TICKS_DIR, `${tickId}.json`);
  fs.writeFileSync(mdPath, mdLines.join("\n") + "\n", "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify(record, null, 2) + "\n", "utf8");

  console.log(`[agent-ops] Tick recorded: ${relPath(mdPath)} (${verdict})`);
  return record;
}

function createHotfixWorktree(slug, baseRef = "main") {
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  const stamp = utcCompact();
  const worktreeDir = path.resolve(REPO_ROOT, "..", `eg-hotfix-${stamp}-${safeSlug}`);
  const branchName = `hotfix/${stamp.toLowerCase()}-${safeSlug}`;

  const res = runCmd("git", ["worktree", "add", "-b", branchName, worktreeDir, baseRef]);
  if (!res.ok) {
    console.error(`[agent-ops] Failed to create worktree: ${res.stderr || res.stdout}`);
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        worktreeDir,
        branchName,
        baseRef,
        cleanupCommand: `git worktree remove "${worktreeDir}"`,
      },
      null,
      2
    )
  );
}

function initIncident(slug, tier = "1", triggerTick = "manual") {
  ensureDirs();
  const now = new Date();
  const stamp = utcCompact(now);
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  const incId = `INC-${stamp}-${safeSlug}`;
  const git = getGitContext();

  const md = `# ${incId}

- **Created (UTC)** : \`${now.toISOString()}\`
- **Trigger Tick / Source** : \`${triggerTick}\`
- **Tier Classification** : \`Tier ${tier}\` (${
    tier === "1"
      ? "Auto-Fix Eligible: non-cardinal, <=2 files, zero SQL DDL"
      : "Human-Gated: touches R1/R2/R3 cardinal surface, scoring, auth, or SQL"
  })
- **Supabase Project** : \`${SUPABASE_PROJECT_ID}\`
- **Vercel Project** : \`${VERCEL_PROJECT_ID}\` (\`${PROD_URL}\`)
- **Base Git Revision** : \`${git.headSha}\` (branch \`${git.branch}\`, \`main\` @ \`${git.mainSha}\`)

## 1. Symptom & Root Cause

- **Observed Symptom** : TBD
- **Affected Surface / Route** : TBD
- **Root Cause** : TBD

## 2. Cardinal & Safety Verification

- [ ] **R1 (Score/Rank Privacy)** : Verified via \`node scripts/agent-ops.mjs gates\`
- [ ] **R2 (Warn-Only Validation)** : Verified via \`pwsh ./scripts/check-r2-severity.ps1\`
- [ ] **R3 (Soft Prerequisites + L2 Exception)** : Verified via \`node scripts/agent-ops.mjs gates\`
- [ ] **Build & Unit Gates** : \`npm run typecheck && npm run lint && npm run test:unit && npm run build\`

## 3. Change & Deployment Traceability

- **Isolated Worktree / Branch** : \`hotfix/${stamp.toLowerCase()}-${safeSlug}\`
- **Pre-Hotfix Git Tag** : \`pre-hotfix-${stamp.toLowerCase()}\`
- **Fix Commit SHA** : \`PENDING\`
- **Vercel Deployment UID** : \`PENDING\`
- **Post-Deploy Smoke Check** : \`PENDING\`

## 4. Rollback Command

\`\`\`bash
# Option A — Git revert on main:
git revert <FIX_COMMIT_SHA> --no-edit && git push origin main

# Option B — Instant Vercel production rollback:
vercel rollback <PREVIOUS_PROD_DEPLOYMENT_UID> --yes
\`\`\`
`;

  const filePath = path.join(INCIDENTS_DIR, `${incId}.md`);
  fs.writeFileSync(filePath, md, "utf8");
  console.log(`[agent-ops] Incident initialized: ${relPath(filePath)}`);
}

const [, , subcommand, ...rest] = process.argv;

if (subcommand === "gates") {
  const withTests = rest.includes("--with-tests");
  const res = await runGates(withTests);
  process.exit(res.ok ? 0 : 1);
} else if (subcommand === "tick") {
  const idx = rest.indexOf("--event-label");
  const label = idx >= 0 && rest[idx + 1] ? rest[idx + 1] : "LIVE-OPS";
  const rec = await runTick(label);
  process.exit(rec.verdict === "HARD" ? 2 : 0);
} else if (subcommand === "worktree-create") {
  const slug = rest[0] || "hotfix";
  const baseIdx = rest.indexOf("--base");
  const baseRef = baseIdx >= 0 && rest[baseIdx + 1] ? rest[baseIdx + 1] : "main";
  createHotfixWorktree(slug, baseRef);
} else if (subcommand === "incident-init") {
  const slug = rest[0] || "live-issue";
  const tierIdx = rest.indexOf("--tier");
  const tier = tierIdx >= 0 && rest[tierIdx + 1] ? rest[tierIdx + 1] : "1";
  const trigIdx = rest.indexOf("--trigger");
  const trigger = trigIdx >= 0 && rest[trigIdx + 1] ? rest[trigIdx + 1] : "manual";
  initIncident(slug, tier, trigger);
} else {
  console.log(`Usage:
  node scripts/agent-ops.mjs gates [--with-tests]
  node scripts/agent-ops.mjs tick [--event-label <label>]
  node scripts/agent-ops.mjs worktree-create <slug> [--base <ref>]
  node scripts/agent-ops.mjs incident-init <slug> [--tier 1|2] [--trigger <tick-id>]`);
}
