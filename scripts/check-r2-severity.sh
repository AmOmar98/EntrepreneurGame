#!/usr/bin/env bash
# scripts/check-r2-severity.sh — R2 cardinal gate (validator severity).
#
# Cardinal R2 (cf. CLAUDE.md "Pre-edit guards") :
#   Player deliverable validators MUST be `severity: "warn"`, never `"error"`.
#   An `"error"` value on a Player-content validator must trigger human review,
#   not an automatic block.
#
# Baseline + rationale: docs/validator-severity-baseline.md
# Audit history: .planning/quick/260517-vsa-validator-severity-audit/
#
# Whitelist (allowed `severity: "error"` occurrences) :
#   - app/actions.ts  — single `"use server"` module. All matches are
#                        WorkflowState markers for server-action failure modes
#                        (Zod parse, auth, infra, DB, GameMaster gates),
#                        not Player deliverable validators.
#
# Exit codes:
#   0 — clean (no non-whitelisted `severity: "error"`)
#   1 — at least one non-whitelisted match (likely R2 regression — review)
#
# Usage:
#   ./scripts/check-r2-severity.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PATTERN='severity[[:space:]]*:[[:space:]]*["'"'"']error["'"'"']'

# Collect matches across the three surfaces R2 cares about.
# `|| true` so set -e does not abort on a zero-match grep.
matches="$(grep -RInE "$PATTERN" \
  --include='*.ts' --include='*.tsx' \
  app/ lib/ components/ 2>/dev/null || true)"

if [ -z "$matches" ]; then
  echo "[check-r2-severity] OK — no severity: \"error\" matches found."
  exit 0
fi

# Strip whitelisted paths.
filtered="$(echo "$matches" | grep -vE '^app/actions\.ts:' || true)"

if [ -z "$filtered" ]; then
  count="$(echo "$matches" | wc -l | tr -d '[:space:]')"
  echo "[check-r2-severity] OK — $count match(es), all in whitelisted paths (app/actions.ts WorkflowState markers)."
  exit 0
fi

echo "[check-r2-severity] FAIL — non-whitelisted severity: \"error\" match(es):"
echo "$filtered"
echo
echo "If these are legitimate WorkflowState markers, update the whitelist in"
echo "  scripts/check-r2-severity.sh, scripts/check-r2-severity.ps1, and"
echo "  docs/validator-severity-baseline.md."
echo "If these are Player deliverable validators, flip them to severity: \"warn\""
echo "  (cardinal R2) before committing."
exit 1
