---
phase: 7
status: verified
verified_at: 2026-05-10
human_review_validated_at: 2026-05-11
human_reviewer: Omar (operator)
must_haves_verified: 8
must_haves_total: 8
closure_evidence:
  - "Visual review v2 éditoriale validée par Omar (italiques Baskervville, sunburst, ticket rotated)"
  - "Smoke swarm PROD 2026-05-10 — 27 livrables soumis P01/P02/P04 sur cohorte AgreenTech finalisée"
  - "Pilot-ready state 2026-05-11 — 20 auth.users finaux (11P + 2M + 3J + 4GM) provisionnés"
---

# Phase 7 Verification — Joueur EIC Design v2

## Summary

Phase 7 livre PLR-01..PLR-08 (8/8) sur 4 plans, 7 commits totaux (3 commits Plan 07-01 d'avant cette session + 4 commits cette session).

**Status `human_needed`** : la conformité technique est passée (typecheck / lint / build clean), mais le visuel doit être validé manuellement par Omar avant clôture définitive — la nature éditoriale du design v2 (italiques Baskervville, sunburst rays, ticket rotated, gradients, pédagogie révision) ne peut être auditée qu'à l'œil humain.

## Plans livrés

| Plan | Title | Commit | PLR couverts |
|---|---|---|---|
| 07-01 | JourneyTrack + Drawer + Hero + DeliverableCard | `7a8f507` (+ `660ab51` `5e82cb8`) | PLR-01, PLR-02, PLR-03, PLR-04, PLR-08 |
| 07-02 | Onboarding 3 editorial steps | `c85446f` | PLR-05 |
| 07-03 | Submission ticket post-V1 | `adb54e8` | PLR-06 |
| 07-04 | Revision V2 panel | `dba9c74` | PLR-07 |
| cleanup | Remove unused v0.1 components | `5ab843a` | — |

## Must-haves verification

| # | Must-have (de ROADMAP / 07-CONTEXT) | Status | Evidence |
|---|---|---|---|
| 1 | Barre verticale L0→L7 desktop descendante / mobile ascendante (PLR-01) | ✓ TECH | `components/journey-track.tsx` + responsive CSS — visuel à valider Omar |
| 2 | Niveau courant pulsé bleu, faits verts, locked grisés/dashed (PLR-02) | ✓ TECH | `components/journey-level-node.tsx` + CSS keyframes avec `prefers-reduced-motion` guard |
| 3 | Hero unique « Prochaine étape » (UN seul CTA primaire) (PLR-03) | ✓ TECH | `components/journey-hero-next-step.tsx` — 1 CTA `<Link>` primaire visible |
| 4 | Drawer latéral 400px desktop / full-width mobile avec missions, code Mx.y, statut, reward XP (PLR-04) | ✓ TECH | `components/journey-drawer.tsx` + `journey-deliverable-card.tsx` ; ESC close + body scroll lock |
| 5 | Onboarding 3 étapes éditoriales (BIENVENUE / TON ÉQUIPE / LES RÈGLES) (PLR-05) | ✓ TECH | `components/onboarding-stepper.tsx` + `onboarding-step-{1,2,3}.tsx` ; data flow KYC inline étape 3 → `saveOnboarding` action → redirect /journey |
| 6 | Ticket SOUMIS éditorial post-V1 (sunburst, +XP gradient, stamp rotated) (PLR-06) | ✓ TECH | `components/submission-ticket.tsx` ; CSS rotate -8deg + stamp rotate -12deg + `prefers-reduced-motion` guard |
| 7 | Écran révision V2 pédagogique (PLR-07) | ✓ TECH | `components/revision-panel.tsx` ; checklist parsing heuristique sur `evaluations.feedback_text` (✓/⚠) avec fallback texte libre ; bandeau vert « Aucune perte d'XP » |
| 8 | Drawer affiche « En revue · X min · Mentor Y. » (PLR-08) | ✓ TECH | `components/journey-deliverable-card.tsx` `getHint()` retourne `t.journey_v2_hint_in_review` pour `submitted_v1`/`submitted_v2` ; placeholder mentor name à remplacer Phase 8 |

**Légende** : ✓ TECH = la conformité technique est validée (composant en place, props connectées, typecheck/lint/build clean) ; le rendu pixel-perfect doit être confirmé par Omar.

## Tests

```
npm run typecheck   ✓ clean (0 errors)
npm run lint        ✓ clean (0 errors / 0 warnings)
npm run build       ✓ clean (13/13 routes generated, no compile errors)
```

Routes affectées (build size delta vs baseline) :
- `/journey` 4.11 kB
- `/journey/deliverable/[id]` 3.2 kB (+1 kB vs ticket-only build, due to RevisionPanel)
- `/onboarding` 3.65 kB

Routes non-Joueur (`/login`, `/mentor`, `/admin`, `/jury`, `/results`) — aucun import touché, aucun changement de comportement attendu. Build passe sans erreurs.

## Components créés (Phase 7 totale)

Plan 07-01 (commits précédents):
- `lib/journey-progression.ts`
- `components/journey-track.tsx`
- `components/journey-level-node.tsx`
- `components/journey-hero-next-step.tsx`
- `components/journey-drawer.tsx`
- `components/journey-deliverable-card.tsx`
- `components/journey-client.tsx`

Plan 07-02 (cette session):
- `components/onboarding-stepper.tsx` (client)
- `components/onboarding-step-1.tsx`
- `components/onboarding-step-2.tsx`
- `components/onboarding-step-3.tsx`

Plan 07-03 (cette session):
- `components/submission-ticket.tsx`

Plan 07-04 (cette session):
- `components/revision-panel.tsx` (client)

## Components supprimés (cleanup)

- `components/journey-header.tsx`
- `components/journey-timeline.tsx`
- `components/journey-deliverables.tsx`
- `components/onboarding-form.tsx`

Vérification : zero import `from .* journey-header|journey-timeline|journey-deliverables|onboarding-form` dans `app/` + `components/` (grep clean).

## Pages modifiées (cette session)

- `app/onboarding/page.tsx` — délègue à `<OnboardingStepper>`, résolution mentor + first name + members côté serveur
- `app/journey/deliverable/[id]/page.tsx` — route `submitted_v1` → `SubmissionTicket`, route `feedback_received` (avec evaluation) → `RevisionPanel`, fallback `SubmissionReadonly` pour V2/validated/rejected

## Items « human verification » (à valider par Omar)

1. **/onboarding desktop + mobile** — vérifier que les 3 étapes s'affichent correctement (kicker amber + titre Baskervville + italique coloré + stats grid 3 col → 1 col mobile + encart mentor + chips équipe + numéros 01/02/03 colorés sur les règles).
2. **/journey/deliverable/[id]** après soumission V1 — vérifier que le ticket SOUMIS rotated affiche bien sunburst + +XP gradient + stamp rotated -12deg, et que `prefers-reduced-motion` désactive bien la rotation (tester avec OS setting).
3. **/journey/deliverable/[id]** après verdict request_v2 — vérifier que le mentor quote + checklist + bandeau vert + form V2 + V1 collapsible s'affichent correctement, et que la heuristique de parsing `feedback_text` se comporte raisonnablement avec du texte libre Mentor (sans markers ✓/⚠).
4. **PLR-08 hint** — confirmer le wording « En revue · Mentor assigné » dans le drawer pour livrable submitted_v1 ; le placeholder « Mentor assigné » sera remplacé par le vrai nom assigné en Phase 8 (TODO documenté).
5. **Backward compat** — smoke test rapide sur `/login`, `/mentor`, `/admin`, `/jury`, `/results` pour confirmer qu'aucune régression visuelle/fonctionnelle.

## Décisions / TODOs Phase 8

- **Mentor assignment** : la résolution du mentor est aujourd'hui un best-effort (premier profile.app_role=mentor par created_at). Phase 8 doit introduire une vraie table d'assignation `mentor_assignments` (player_id, mentor_user_id) + UI GameMaster pour les paramétrer. TODO commenté dans `app/onboarding/page.tsx` et `components/journey-deliverable-card.tsx`.
- **Feedback parsing structuré** : RevisionPanel parse `evaluations.feedback_text` heuristiquement (lignes `✓` / `⚠`). Phase 8 doit introduire une convention structurée (table `feedback_items` ou champ JSONB rubric-driven) pour des checklists fiables. TODO commenté dans `components/revision-panel.tsx`.
- **Onboarding split B** (étape 2 = team data, étape 3 = règles + diagnostic) : abandonné au profit de l'option A (KYC complet inline dans étape 3 sous les règles). Cohérent avec le wireframe player-flows.jsx (OnboardC) et simplifie le data flow (pas de state intermédiaire client → serveur).

## Sign-off

- [x] PLR-01 à PLR-08 livrés (8/8)
- [x] Tests automatisés clean (typecheck / lint / build)
- [x] v0.1 components retirés sans casser les routes existantes
- [ ] Validation visuelle humaine par Omar (5 items ci-dessus)

Une fois la validation humaine OK → status passe à `passed`.
