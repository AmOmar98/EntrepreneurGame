# Phase 13 — SUMMARY (Smoke Completion + Phase 11 Gates + Bug Annexes)

**Date close** : 2026-05-11
**Branche** : `ralph/pre-pilot-phases-13-14`
**Verdict global** : **PARTIAL CLOSED** — Wave B/C/D closed côté code/demo. Wave A (smoke PROD swarm) DEFERRED à ops manuelle Omar post-merge.

## Commits Phase 13 (SHA)

| Sub-task | Commit | Description |
|---|---|---|
| 13-07 W-C | `261b90b` | Fix logout `type="button"` via nouveau `LogoutButton` client component. |
| 13-08 W-C | `ba03741` | Fix Pouls L0 — `PULSE_LEVELS` passe de 6 à 5 (L1..L5), L0 onboarding sans livrable. |
| 13-05+06 W-B | `478e7ab` | G2 reduced-motion PASS (audit + Playwright shim) + G3 mobile 390 PASS post-fix CSS `@media (max-width: 420px)`. |
| 13-04 W-B | `31bf12b` | G1 visual review partial (2/4 routes capturées demo, 2 deferred) + G4 radar dashed code-PASS. |
| 13-09 W-D | `fcac3f9` | Smoke régression demo PASS — R1 audit Player-facing clean. |

## Sous-tâches DEFERRED → ops manuelle Omar

| Sub-task | Raison defer | Action Omar (post-merge) |
|---|---|---|
| 13-01 | SEED-002 M01 mentor batch — requiert Playwright MCP isolated + creds swarm | Spawn `mentor-evaluateur-agreentech` avec compte M01 via swarm-harness post-merge |
| 13-02 | G01 jury smoke + publication SQL — requiert session GM PROD | Login G01 PROD, soumettre pitch_score P01, exec SQL `update events set results_published_at = now()`, vérifier /results Player vs GM |
| 13-03 | Porteurs P03/P05/P09 swarm — requiert Playwright MCP isolated | Spawn 3 instances `porteur-projet-agreentech` (P03 Fès argan, P05 El Hajeb compostage, P09 Agadir aquaponie) |
| 13-04 G1 partial | `/results` + `/admin?live=1` non-testables demo (auth-gated) | Capture PROD GM 05-admin-radar.png |

## Bug fixes appliqués (résumé)

### 13-07 — Logout button type
**Symptôme smoke 2026-05-10** : selector générique `button[type="submit"]` ciblait accidentellement le bouton Se déconnecter et provoquait des logout intempestifs (P04 incident).

**Fix** : nouveau client component `LogoutButton` avec `type="button"` + `onClick={() => signOut()}` programmatique. Remplace les `<form action={signOut}>` dans `StaffShell` (`app-shell.tsx`) et `TopbarLite`.

### 13-08 — Pouls "Diagnostic 0/1"
**Symptôme smoke 2026-05-10** : cohort pulse affichait "Diagnostic 0/N" sans livrable possible.

**Diagnostic** : ni `database/seed_event_hackdays.sql` ni `lib/seed/missions.ts` ne définissent de mission/template à L0_diagnostic. L0 = onboarding/KYC stepper sans livrable.

**Fix** : `PULSE_LEVELS` dans `lib/cohort-pulse.ts` passe de `[L0..L5]` à `[L1..L5]`.

### 13-06 W-B — Topbar overflow 390px
**Finding** : `.eic-topbar` débordait de 22px à viewport 390 (scrollWidth=397>375).

**Fix** : `@media (max-width: 420px)` cache pills info+amber + brand-sub + resserre padding. Post-fix scrollWidth=clientWidth.

## Gates Phase 11 — état closeout

| Gate | Statut | Lien rapport |
|---|---|---|
| G1 visual review | PARTIAL (2/4 demo) — `/landing`+`/journey` PASS demo, `/results`+`/admin?live=1` deferred ops | `G1-G4-VISUAL-REVIEW.md` |
| G2 reduced-motion | PASS (13 guards CSS + 1 guard JS, Playwright shim runtime) | `G2-REDUCED-MOTION.md` |
| G3 mobile 390×844 | PASS post-fix CSS topbar | `G3-MOBILE-390.md` |
| G4 radar dashed lines | PASS code-vérifié (SVG `strokeDasharray="1.2 1.2"`), visual confirm PROD deferred | `G1-G4-VISUAL-REVIEW.md` §G4 |

## BLOCKED

Aucun élément bloqué côté code. 3 sub-tasks Wave A et 2 sous-éléments G1 deferred ops, documentés.

## Risques résiduels

| Risque | Mitigation |
|---|---|
| Smoke PROD E2E mentor + jury pas validé | Wave A à exécuter par Omar 12/05 dans la journée (~30-40 min total ops) |
| Cleanup `submission-feedback-card.tsx` dead code (cf. 13-09) | Post-pilote v0.3 (non blocker) |

---

**Conclusion** : Phase 13 livre 6 fix code (Wave B/C/D) sans régression, 3 rapports Phase 11 gates fermés (G2/G3/G4 + G1 partiel). Wave A reste à exécuter par Omar en mode ops — non-bloquant pour 13/05 8h30 si Omar dispose d'1h le 12/05 entre cleanup et tag.

**PHASE-13-PARTIAL-CLOSED.**
