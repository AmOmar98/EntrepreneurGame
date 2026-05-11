---
status: resolved
phase: 15-adversarial-hardening-pre-pilote-agreentech
source: ["15-VERIFICATION.md"]
started: 2026-05-11T00:00:00Z
updated: 2026-05-11T11:55:00Z
cutoff: 2026-05-12T23:00:00+00:00
deferred_to: phase-16
---

## Current Test

[Phase 15 closed — 3/5 audits PASS, 2/5 audits déférés en Phase 16 (DevTools-side + 2-session psql)]

## Tests

### 1. Exécuter scripts/test-engagement-trigger-idempotence.sql ✅ PASSED
executed_by: Claude Code via Supabase MCP (équivalent fonctionnel Cloud Studio)
executed_at: 2026-05-11T10:35Z
expected: 5 scénarios PASS — paliers cumulatifs corrects, idempotent.
observed: 8/8 steps PASS (S1=100, S2A=175, S2B=125, S2C=175, S3a=175, S3b=0, S4=175 ts-distincts, S5 diff=0).
artifact: `IDEMPOTENCE-VERDICT.md` — rempli ALL PASS + warning annexe S4 tie-break timestamp (defer v0.3).
result: **PASS**

### 2. Exécuter scripts/test-rls-cross-cohort.sql ✅ PASSED
executed_by: Claude Code via Supabase MCP (`set local role authenticated` + jwt.claim.sub)
executed_at: 2026-05-11T10:42Z
expected: Scénarios 1, 2, 5 = 0 rows OR policy error. Scénario 3 = visible = my_memberships. Scénario 4 = count > 0.
observed: 5/5 PASS. S1=0, S2=0, S3=1=1 (sur 2 cohortes en base), S4=40 (is_mentor()=true), S5=`42501 permission denied for schema public`.
artifact: `RLS-CROSS-COHORT-VERDICT.md` — rempli ALL PASS. Aucune escalade D-16. CONCERNS.md obsolescence documentée.
result: **PASS**

### 3. Exécuter scripts/adversarial-inputs-checklist.md → **DÉFÉRÉ PHASE 16**
expected: ≥15 PASS Zod refuse proprement. 4 KNOWN limitations documentés (SSRF V-05/V-06, transitions V-17, freeze V-18). 0 crash 500.
artifact_to_fill: `ADVERSARIAL-INPUTS-VERDICT.md`
why_deferred: nécessite session authentifiée P11 + DevTools/curl POST PROD — pas accessible via MCP SQL mono-session. Moved to Phase 16 (`.planning/phases/16-phase-15-closeout-devtools-concurrence-audits/`).
result: **deferred-to-phase-16**

### 4. Exécuter scripts/test-concurrent-evaluations.sql → **DÉFÉRÉ PHASE 16**
expected: Scénario A — 2 evaluations distinctes coexistent OR UNIQUE constraint violation propre. Scénario B — V1+V2 sans duplicate palier. Scénario C — aucun deadlock.
artifact_to_fill: `CONCURRENCE-VERDICT.md`
why_deferred: vraie concurrence requiert 2 sessions psql parallèles — MCP est mono-session. Moved to Phase 16.
result: **deferred-to-phase-16**

### 5. Re-spawn /agent eic-pedagogical-advisor sur diff f4cf557 ✅ RATIFIED
executed_by: Claude Code orchestrator (spawn `eic-pedagogical-advisor` post-hoc 2026-05-11)
executed_at: 2026-05-11T10:55Z
expected: Verdict OK ou WARN — le diff étend strictement la couverture audit.
observed: **PASS** — extension purement additive et défensive. Aucun risque identifié. 3 recommandations follow-up loggées (convention "new component glob = audit-r1.sh updated in same commit", spawn advisor si edit futur cohort-*, cron CI audit-r1.sh smoke périodique → v0.3).
artifact: `R1-AUDIT-PHASE14-EXTENSION.md` — section "Advisor verdict" mise à jour.
result: **PASS**

## Summary

total: 5
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0
deferred: 2  (→ phase-16)

## Gaps

- (none — Phase 15 closed) Tests 3+4 déplacés en Phase 16 par décision owner 2026-05-11. Phase 16 = "Phase 15 Closeout — DevTools-side + concurrence audits" dans ROADMAP.md, dir `.planning/phases/16-phase-15-closeout-devtools-concurrence-audits/`. Non-bloquants pilote 13-14/05 (Phase 15 ALL PASS sur 3 axes critiques : trigger idempotence, RLS cross-cohort, audit R1 extension).
