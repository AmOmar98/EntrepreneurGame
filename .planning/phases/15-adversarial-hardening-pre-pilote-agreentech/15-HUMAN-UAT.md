---
status: partial
phase: 15-adversarial-hardening-pre-pilote-agreentech
source: ["15-VERIFICATION.md"]
started: 2026-05-11T00:00:00Z
updated: 2026-05-11T00:00:00Z
cutoff: 2026-05-12T23:00:00+00:00
---

## Current Test

[awaiting human testing — Omar to execute 5 audits via Cloud Studio + DevTools]

## Tests

### 1. Exécuter scripts/test-engagement-trigger-idempotence.sql (Cloud Studio SQL Editor)
expected: 5 scénarios PASS — `raise notice` avec verdicts attendus = observés. Wrappés `begin;...rollback;` donc PROD-safe.
artifact_to_fill: `IDEMPOTENCE-VERDICT.md` — colonnes Result / Notes
result: [pending]

### 2. Exécuter scripts/test-rls-cross-cohort.sql (Cloud Studio SQL Editor, role service_role)
expected: Scénarios 1, 2, 5 = 0 rows OR policy error. Scénario 3 = SKIP si cohorte unique. Scénario 4 = count > 0 (Mentor voit tout).
artifact_to_fill: `RLS-CROSS-COHORT-VERDICT.md`
stop_condition: D-16 — si FAIL critique sur scénarios 1, 2 ou 5, STOP + escalade owner (potentielle fuite cross-cohort active)
result: [pending]

### 3. Exécuter scripts/adversarial-inputs-checklist.md (DevTools / curl avec compte P11 PROD)
expected: ≥15 PASS Zod refuse proprement. 4 KNOWN limitations documentés (SSRF V-05/V-06, transitions V-17, freeze V-18). 0 crash 500.
artifact_to_fill: `ADVERSARIAL-INPUTS-VERDICT.md`
result: [pending]

### 4. Exécuter scripts/test-concurrent-evaluations.sql (2 onglets Cloud Studio simultanés)
expected: Scénario A — 2 evaluations distinctes coexistent OR UNIQUE constraint violation propre. Scénario B — V1+V2 sans duplicate palier. Scénario C — aucun deadlock.
artifact_to_fill: `CONCURRENCE-VERDICT.md`
result: [pending]

### 5. Re-spawn `/agent eic-pedagogical-advisor` sur diff `f4cf557` (extension audit-r1.sh)
expected: Verdict OK ou WARN with notes — le diff étend strictement la couverture audit, ne dégrade pas R1.
artifact_to_fill: `R1-AUDIT-PHASE14-EXTENSION.md` — section "Advisor verdict"
fallback: si verdict BLOCK, `git revert f4cf557` (commit isolable, ne casse pas les autres scripts)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

(none — tous pending exécution manuelle dans la fenêtre 2026-05-11 → 2026-05-12 23h00)
