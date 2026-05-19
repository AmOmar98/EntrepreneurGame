---
phase: "12-quick-260510-t3x"
plan: "12-06"
subsystem: "server-actions"
tags: [t3x-expansion, bonus-events, moscow-kanban, server-actions, i18n, wave-2]
requirements: [T3X-EXPANSION-SERVER-ACTIONS]
provides:
  - "app/actions.ts: 7 nouvelles server actions Bonus + MoSCoW"
  - "lib/i18n.ts: 42 keys FR ASCII pur bonus_* / moscow_*"
requires:
  - "12-02 (bonus_events DDL applique)"
  - "12-03 (moscow_cards DDL applique)"
  - "12-05 (lib/types.ts BONUS_DEFAULTS / BONUS_MULTIPLIER_CAP / MoscowBucket)"
affects:
  - "Plan 12-07: lib/score.ts consumera bonus_events validated rows"
  - "Plans 12-08/09/10: UI Player + Mentor consume actions via useActionState"
tech-stack:
  added: []
  patterns:
    - "WorkflowState shape: zod safeParse + ok/message return, no throw"
    - "Ownership defense-in-depth via player_members + profiles.app_role"
    - "snake_case DB INSERT/UPDATE <-> camelCase TS types"
    - "Batch UPDATE par boucle (supabase-js sans bulk update conditionnel)"
    - "Warn-only suffix dans message FR (R2/R3) au lieu de blocage"
key-files:
  created: []
  modified:
    - "app/actions.ts (+~400 lignes, imports + 7 actions)"
    - "lib/i18n.ts (+44 lignes, 42 keys + 2 commentaires section)"
decisions:
  - "Re-claim apres rejet autorise (pas de unique constraint TS); seul blocage = pending submitted (UX clarity, pas R3 violation)"
  - "snapshot URL hardcodee vers https://entrepreneur-game-six.vercel.app/journey/deliverable/:id/moscow-snapshot?p=:playerId (Plan 10 implementera la route SSR)"
  - "moscow ord cap a 999 (smallint DB, defense-in-depth applicative)"
  - "Reorder batch via boucle UPDATE eq(id) plutot que upsert (RLS check avec WHERE id evite probleme de re-INSERT defaults)"
  - "ASCII pur dans messages WorkflowState (cf CLAUDE.md convention), accents tolerees uniquement dans i18n consomme via render React"
metrics:
  duration: "~25 min"
  completed: "2026-05-10"
---

# Phase 12 Plan 06: T3X-EXPANSION Wave 2 Server Actions Summary

**One-liner :** 7 nouvelles server actions Bonus Events (claim/review) + MoSCoW Kanban (CRUD + reorder DnD + submit) sur le pattern Flow existant, avec 42 keys i18n FR ASCII et preservation stricte R1/R2/R3.

## 7 Server Actions Exposees

| Action | Signature | Scope CRUD | Acteur | Tables touchees |
|--------|-----------|------------|--------|------------------|
| `claimBonusEventFlow` | `(_prev, FormData) => WorkflowState` | INSERT | Player (player_members) | bonus_events |
| `reviewBonusEventFlow` | `(_prev, FormData) => WorkflowState` | UPDATE | Mentor / GameMaster | bonus_events |
| `createMoscowCardFlow` | `(_prev, FormData) => WorkflowState` | INSERT | Player | moscow_cards |
| `updateMoscowCardFlow` | `(_prev, FormData) => WorkflowState` | UPDATE | Player (RLS-gated) | moscow_cards |
| `deleteMoscowCardFlow` | `(_prev, FormData) => WorkflowState` | DELETE | Player (RLS-gated) | moscow_cards |
| `reorderMoscowCardsFlow` | `(_prev, FormData) => WorkflowState` | batch UPDATE | Player | moscow_cards |
| `submitMoscowDeliverableFlow` | `(_prev, FormData) => WorkflowState` | INSERT submission + SELECT counts | Player | submissions, moscow_cards (lecture) |

## R1 / R2 / R3 Audit (8 points checklist)

| Point | Resultat | Detail |
|-------|----------|--------|
| 1. R1 — multiplier_factor invisible message | OK | 0 hit `multiplier_factor.*\$` / `toFixed` / `/100` / `/140` / `score.*\$` dans diff |
| 2. R2 — pas de throw | OK | 0 hit `throw ` dans les ajouts; toutes erreurs via `{ok:false, message}` |
| 3. R2 — submitMoscowDeliverableFlow warn-only | OK | `counts.must < 2` -> warningSuffix dans message, `ok:true` quand meme |
| 4. R3 — pas de blocage inter-mission | OK | Re-claim post-rejet autorise (seul gate = pending submitted, UX). 0 hit `blocks_progression` / `status.*draft.*reject` |
| 5. Ownership defense-in-depth | OK | claim/create/submit moscow check `player_members`, review check `profiles.app_role IN ('mentor','game_master')` |
| 6. revalidatePath par action | OK | min 1 revalidate par action (`/journey`, `/mentor`, `/journey/deliverable/:id`, `/journey/bonus/:type`, `/mentor/bonus/:id`) |
| 7. httpsUrl reuse | OK | `claimBonusEventFlow` reutilise shared `httpsUrl` schema lignes 161-164 |
| 8. ASCII pur dans messages | OK | Tous les messages action: `valide` / `Soumis` / `Carte ajoutee` / `Bonus rejete` (pas d'accents). i18n keys ASCII pur en valeurs aussi. |

## i18n Keys Added (42 keys FR ASCII pur)

**Bonus events (22 keys)** : `bonus_section_title`, `bonus_section_subtitle`, `bonus_card_verbatims_terrain`, `bonus_card_dev_plan`, `bonus_card_prototype_draft`, `bonus_claim_url_label`, `bonus_claim_url_placeholder`, `bonus_claim_title_label`, `bonus_claim_description_label`, `bonus_claim_submit`, `bonus_claim_submitting`, `bonus_claim_success`, `bonus_claim_pending`, `bonus_status_submitted`, `bonus_status_validated`, `bonus_status_rejected`, `bonus_review_title`, `bonus_review_validate`, `bonus_review_reject`, `bonus_review_feedback_label`, `bonus_review_success_validated`, `bonus_review_success_rejected`.

**MoSCoW Kanban (20 keys)** : `moscow_kanban_title`, `moscow_kanban_subtitle`, `moscow_bucket_must`, `moscow_bucket_should`, `moscow_bucket_could`, `moscow_bucket_wont`, `moscow_card_add`, `moscow_card_feature_label`, `moscow_card_pourquoi_label`, `moscow_card_contrainte_label`, `moscow_card_save`, `moscow_card_delete`, `moscow_card_created`, `moscow_card_updated`, `moscow_card_deleted`, `moscow_reorder_saved`, `moscow_submit_deliverable`, `moscow_submit_warn_must`, `moscow_submit_warn_wont`, `moscow_submit_success`.

Toutes ajoutees dans le dictionnaire `fr` uniquement (locale primaire produit per CLAUDE.md). Pas de doublon en `en` (a faire Plan UI si necessaire, non bloquant).

## httpsUrl Reused

`claimBonusEventFlow` reutilise le shared schema `httpsUrl` defini ligne 161-164 d'`app/actions.ts` :
```ts
const httpsUrl = z.string().url().refine(u => u.startsWith("https://"), "URL doit commencer par https://");
```
Pas de redefinition locale. URLs `docUrl` du bonus garanties `https://`.

## Ownership Defense-in-depth

| Action | Check applicatif | RLS gate DDL |
|--------|------------------|---------------|
| `claimBonusEventFlow` | `player_members.user_id = auth.uid()` -> player_id | `bonus_events_player_insert` (is_my_player + claimed_by=uid) |
| `reviewBonusEventFlow` | `profiles.app_role IN ('mentor','game_master')` | `bonus_events_mentor_update` (is_mentor or is_game_master) |
| `createMoscowCardFlow` | `player_members.user_id = auth.uid()` -> project_id | `moscow_cards_player_insert` (is_my_player + created_by=uid) |
| `updateMoscowCardFlow` | (delegue a RLS) | `moscow_cards_player_update` |
| `deleteMoscowCardFlow` | (delegue a RLS) | `moscow_cards_player_delete` |
| `reorderMoscowCardsFlow` | (delegue a RLS) | `moscow_cards_player_update` |
| `submitMoscowDeliverableFlow` | `player_members.user_id = auth.uid()` -> player_id | submissions RLS standard Phase 5 |

## submitMoscowDeliverableFlow snapshot URL

Genere une URL pointant vers une route SSR a implementer Plan 10 :
```
https://entrepreneur-game-six.vercel.app/journey/deliverable/{templateId}/moscow-snapshot?p={playerId}
```
Hardcodee sur la prod Vercel (slug `entrepreneur-game-six` per CLAUDE.md). Plan 10 implementera la route SSR `/journey/deliverable/[id]/moscow-snapshot` qui rendra une vue read-only des cartes pour le Mentor reviewer.

Warn-only suffix R2/R3 quand `counts.must < 2` ou `counts.wont < 1` :
- Message succes : `"Kanban MoSCoW soumis V1. (recommandation : >=2 cartes MUST ; recommandation : >=1 carte WONT (anti scope-creep)) Le Mentor va le valider."`
- `ok: true` quand meme (pas de blocage R3).

## revalidatePath Strategy

| Route revalidee | Actions qui revalident |
|------------------|------------------------|
| `/journey` | claim, review, createCard, updateCard, deleteCard, reorder, submitMoscow |
| `/journey/bonus/:type` | claim |
| `/journey/deliverable/:templateId` | createCard, reorder, submitMoscow |
| `/mentor` | claim, review, submitMoscow |
| `/mentor/bonus/:id` | review |

Strategie : invalidations larges sur `/journey` (Player retour landing) + ciblees sur sous-routes pour limiter le SSR cost.

## Files Modified

- `app/actions.ts` : +~400 lignes (imports BONUS_DEFAULTS/BONUS_MULTIPLIER_CAP/BonusType/MoscowBucket + 7 actions + zod schemas)
- `lib/i18n.ts` : +44 lignes (42 keys FR + 2 commentaires de section)

## Next Consumers

- **Plan 12-07 (lib/score.ts)** : SELECT `bonus_events` WHERE status='validated' AND multiplier_consumed_at IS NULL pour appliquer multiplier au prochain score evaluations.
- **Plans 12-08/09/10 (UI)** : `useActionState(claimBonusEventFlow, initialState)` cote Player /journey/bonus/:type ; idem pour Mentor /mentor/bonus/:id ; CRUD + DnD MoSCoW via `useActionState(create/update/delete/reorder)`.

## Verification

- `npm run typecheck` : exit 0 OK
- `npm run lint` : 6 erreurs PRE-EXISTANTES dans `.cjs` scripts (cf SUMMARY 12-05), 0 erreur dans `app/actions.ts` + `lib/i18n.ts`
- 7 `export async function` matches grep
- 42 `bonus_/moscow_` keys count
- R1/R2/R3 audit 8/8 points OK
- Commit atomique `f6905e5`

## Deviations from Plan

None - plan executed exactly as written, with two minor implementation refinements:

1. **MoscowBucket typing renforce** dans `submitMoscowDeliverableFlow` : `counts` typed `Record<MoscowBucket, number>` au lieu de `{must, should, could, wont}` litteral, pour coherence type-safety (changement neutre, meme runtime).
2. **`/mentor` revalidate ajoute** dans `submitMoscowDeliverableFlow` : non explicite dans le plan mais coherent avec submitDeliverable existant (Mentor doit voir la nouvelle soumission sur sa liste).

## Self-Check: PASSED

- [x] `app/actions.ts` exists, modified, contains 7 export async function lines (lignes 1349, 1427, 1501, 1563, 1606, 1640, 1682)
- [x] `lib/i18n.ts` exists, modified, contains 42 `bonus_/moscow_` keys
- [x] Commit `f6905e5` exists in `git log --oneline`
- [x] Typecheck clean
- [x] Lint clean on scope files
- [x] R1/R2/R3 grep audit 0 hits
