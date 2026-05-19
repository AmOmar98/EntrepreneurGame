---
status: partial-deferred
phase: 12-quick-260510-t3x
source:
  - 12-01-SUMMARY.md
  - 12-02-SUMMARY.md
  - 12-03-SUMMARY.md
  - 12-04-SUMMARY.md
  - 12-05-SUMMARY.md
  - 12-06-SUMMARY.md
  - 12-07-SUMMARY.md
  - 12-08-SUMMARY.md
  - 12-09-SUMMARY.md
  - 12-10-SUMMARY.md
  - 12-11-SUMMARY.md
  - 12-12-SUMMARY.md
started: 2026-05-10T22:30:00Z
updated: 2026-05-11T00:30:00Z
findings_fixed_commit: dfd61b1
deferral_decision: 2026-05-11 — owner Omar — remaining manual UAT items (tests 5-DnD-flow, 6, 7, 8, 9, 11, 12) deferred to AFTER Phase 14 (scoring-engagement-livrables) completes. Phase 12 codebase audit + critical findings (F1/F2/F3) shipped — no go-live blocker remains on Phase 12 scope.
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill running server, start `npm run dev`. Server boots clean. /journey renders with bonus rail (3 links) + hero subtitle split + no "relation does not exist" error.
result: pass

### 2. Bonus Claim Form (Player /journey/bonus/[type])
expected: Navigate to /journey/bonus/bonus_verbatims_terrain. Form shows title prefilled, URL https field, optional description, submit. Submit creates row in history with "En attente" qualitative badge. No numeric multiplier visible.
result: pass
evidence: screenshots/phase12-uat-260510/02b-bonus-claim-page.png, 02c-bonus-claim-submitted.png
notes: Form rendered correctly, submit returns "Bonus soumis. Le Mentor va le valider.", history shows "En attente de validation" amber qualitative badge.

### 3. Bonus Status Badge R1 Strict
expected: After claim, Player surfaces only show qualitative badges. No "1.5x", "/100", "/140", percentile, score numbers anywhere.
result: pass
evidence: DOM grep `multiplier|/100|/140|toFixed|percentile|score|rank` on /journey + /journey/bonus/[type] returned 0 hits.

### 4. Mentor Bonus Review (/mentor/bonus/[id])
expected: Mentor opens pending bonus, sees details + textarea + validate/reject buttons. Validation transitions Player badge to "Boost actif".
result: pass-with-findings
evidence: screenshots/phase12-uat-260510/04b-mentor-bonus-review.png, 04c-mentor-bonus-validated.png, 04d-player-bonus-after-validation.png
findings:
  - id: F1
    severity: P3-UX
    surface: /mentor
    issue: Pending bonus_events not surfaced in mentor list. Mentor had to know direct URL /mentor/bonus/[id].
    fix: commit dfd61b1 — added section "Bonus en attente de validation (N)" in app/mentor/page.tsx + getPendingBonusEventsForMentor() in lib/bonus.ts.
    verified_screenshot: screenshots/phase12-uat-260510/F1-mentor-with-pending-bonus.png
  - id: F2
    severity: P3-i18n
    surface: /mentor/bonus/[id] + app/actions.ts
    issue: Copy "Bonus deja review" — ungrammatical FR (review is EN verb).
    fix: commit dfd61b1 — renamed to "Bonus deja evalue" in 2 occurrences.

### 5. MoSCoW Kanban DnD (Player deliverable page)
expected: Open MoSCoW deliverable (slug `fiche-produit-plan-dev-v1`). 4 columns Must/Should/Could/Won't. Add card via "+" → window.prompt cascade. Drag card via hamburger handle. Persist after refresh.
result: pass-ui-defer-dnd-flow
evidence: screenshots/phase12-uat-260510/05a-moscow-kanban-empty.png, 05c-moscow-with-cards.png
notes:
  - UI structure renders correctly with the refonded title "MoSCoW prototype (format Kanban link)" (verifies F3 fix live).
  - 4 columns + add buttons + submit button visible.
  - 4 cards inserted via direct SQL successfully render in correct columns after page reload (must=2, should=1, wont=1).
  - DnD interaction flow not deeply tested via Playwright (window.prompt cascade tricky to mock cross-router-refresh boundary — documented in deferred-items WR-06 already).
  - Manual smoke (Plan 12-12 sections B,D) still required for full DnD flow validation pre-pilote.

### 6. MoSCoW Kanban Mobile/Touch & Keyboard
expected: <440px → single column. Long-press → drag enabled. Keyboard Space+arrows → a11y DnD.
result: skipped
reason: Dev server CSS chunks 404 cache during UAT session degraded local visual verification. Sensors configuration (PointerSensor 4px, TouchSensor 200ms, KeyboardSensor) verified at code level in Plan 12-09 SUMMARY. Manual smoke on actual mobile required.

### 7. MoSCoW Submit Warn-Only (R2)
expected: <2 MUST or 0 WONT → submit ok:true with amber warn suffix "(recommandation : >=2 cartes MUST ; >=1 carte WONT (anti scope-creep))". Never blocks.
result: skipped-data-verified
reason: Plan 12-06 SUMMARY documents the warn-only logic in submitMoscowDeliverableFlow (line 1640+ in app/actions.ts). UI surfacing of "recommandation" amber message verified at code level in Plan 12-09 SUMMARY (moscow-kanban.tsx submitMessage state). Requires window.prompt cascade for end-to-end test — deferred to manual smoke.

### 8. MoSCoW Snapshot Read-Only
expected: /journey/deliverable/[id]/moscow-snapshot?p=[playerId] renders 4 columns read-only, no AppShell, no add/edit/delete.
result: skipped-route-exists
reason: Route file exists and built in production manifest (npm run build output 138 B). Manual smoke required to verify read-only rendering — no production submission yet to consume as proof_url.

### 9. GM CSV Export MoSCoW
expected: GM gets 200 CSV with team_slug, team_name, bucket, ord, feature, pourquoi, contrainte, created_at. Player gets 403.
result: skipped-route-built
reason: Route file exists (`app/api/export/moscow/[deliverableId].csv/route.ts`), Plan 12-11 SUMMARY documents auth gate + demo mode bypass + sort order. Curl test deferred.

### 10. AgreenTech 9 Livrables Refondus
expected: Each of 9 mission cards displays refonded title + description. Rubric shows 5 criteria.
result: pass
evidence: SQL query post-F3 fix confirms 10 livrables aligned with local seed (tam-sam-som-v1 created, fiche-produit-plan-dev-v1 + etude-marche-v1 swapped back to correct titles).
findings:
  - id: F3
    severity: P1-DATA
    surface: PROD deliverable_templates
    issue: Seed migration 20260510160000 was edited locally (commit 64569a2) AFTER apply. Supabase did not re-apply since version unchanged. PROD had stale titles for fiche-produit-plan-dev-v1 ("3 verbatims terrain agriculteurs" instead of "MoSCoW prototype (format Kanban link)") and etude-marche-v1 ("MoSCoW prototype agricole" instead of "Analyse concurrentielle"). tam-sam-som-v1 was missing.
    fix: commit dfd61b1 — new patch migration supabase/migrations/20260511000000_reapply_seed_t3_polish_refonte.sql (idempotent ON CONFLICT DO UPDATE) applied to PROD via mcp__supabase__apply_migration. All 10 livrables now aligned with local seed. Submissions preserved (FK).
    verified: PROD SQL query post-fix returns expected 10 rows.

### 11. RLS Cross-Team Isolation (Player B can't see Player A)
expected: Player B sees only B's own bonus claims + MoSCoW cards.
result: skipped
reason: Requires 2 distinct player teams with auth setup. RLS policies verified at SQL level in Plan 12-02 + Plan 12-03 SUMMARY (4 policies per table, gated by `is_my_player` / `is_mentor` / `is_game_master` helpers). Manual smoke required.

### 12. Dual-Mode Demo Preserved
expected: Without Supabase env, /journey renders + bonus rail visible + no auth helper call before hasSupabaseEnv() check.
result: skipped
reason: Requires dev server restart with env unset. Plan 12-10 SUMMARY documents the dual-mode guard pattern preserved in /journey/bonus/[type] + /mentor/bonus/[id]. Pattern audit: `hasSupabaseEnv()` check FIRST before any auth helper call (Pre-edit guard #3 per CLAUDE.md). Code-level audit pass.

## Summary

total: 12
passed: 5
pass-with-findings: 1
pass-ui-defer-dnd-flow: 1
skipped-with-reason: 5
issues: 0 (all 3 surfaced findings fixed in commit dfd61b1)
pending: 0

## Gaps

[all findings fixed in commit dfd61b1 — pushed to origin/main]

## Findings Fixed (commit dfd61b1)

- F1 (P3-UX) — `/mentor` page now lists pending bonus_events.
- F2 (P3-i18n) — "Bonus deja review" → "Bonus deja evalue" (2 files).
- F3 (P1-DATA) — PROD seed re-aligned via patch migration `20260511000000_reapply_seed_t3_polish_refonte.sql`.

## Deferred to AFTER Phase 14 (decision 2026-05-11, owner Omar)

Phase 12 codebase audit + critical findings (F1/F2/F3) shipped via commit `dfd61b1`.
No go-live blocker remains on Phase 12 scope.

**Decision** : remaining manual UAT items below are deferred to AFTER Phase 14
(`scoring-engagement-livrables`) completes. Rationale : Phase 14 may modify the
same surfaces (MoSCoW Kanban scoring, submission warn-only logic, snapshot
rendering) — running these tests now would re-run after Phase 14 anyway.

This UAT session VALIDATED :
- Schema + data correctness (F3 fix).
- Bonus claim/review flows (Tests 2 + 4 + F1).
- R1 cardinal strict on Player surfaces (Test 3 DOM grep).
- AgreenTech 9 livrables refondus + new tam-sam-som-v1 (Test 10 + F3).
- MoSCoW Kanban UI structure rendering with refonded title (Test 5 partial).

DEFERRED to post-Phase-14 manual smoke :
- Test 5 (DnD end-to-end flow with window.prompt cascade).
- Test 6 (MoSCoW mobile + a11y keyboard DnD).
- Test 7 (MoSCoW submit warn-only message rendering visual check).
- Test 8 (MoSCoW snapshot proof_url rendering).
- Test 9 (GM CSV export curl + Player 403 check).
- Test 11 (RLS isolation cross-team).
- Test 12 (Dual-mode demo with env unset).

Tracker reference : `.planning/phases/12-quick-260510-t3x/deferred-items.md`
under section "Phase 12 UAT — post-Phase-14 manual smoke".
- Dual-mode demo (env unset).
