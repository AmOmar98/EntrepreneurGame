---
name: Phase 12 — Context (T-3 Scope Expansion: MoSCoW Kanban + Bonus Events Recreate)
phase: 12
slug: quick-260510-t3x
gathered: 2026-05-10
status: ready-for-execution
source: BRIEF.md (`.planning/quick/260510-t3x-scope-expansion-moscow-kanban-bonus-events/BRIEF.md`) + PLAN files draftés en session live 2026-05-10
---

# Phase 12 : T-3 Scope Expansion — MoSCoW Kanban + Bonus Events Recreate — Context

**Date** : 2026-05-10 (T-3, samedi avant pilote AgreenTech 13/05)
**Statut** : SCOPE EXPANSION — freeze T-3 explicitement override par owner (Omar)
**Cible go-live** : 2026-05-13 08h30 (mer) — risque de delai assumé
**Source** : décision live session 2026-05-10 (passe en revue 9 livrables → reframe pédagogique)

> Ce CONTEXT.md est dérivé du BRIEF.md captant l'INTENTION + SCOPE + RISQUES. Les 11 PLAN files détaillés (`12-01-PLAN.md` … `12-12-PLAN.md`, plan 04 supprimé) sont co-localisés dans ce dossier de phase.

<domain>
## Phase Boundary — Ce que livre la Phase 12

Cette phase introduit **trois capacités produit majeures** dans le pilote AgreenTech avant le go-live 13/05 :

1. **Bonus Events recréés** : mécanisme `bonus_events` (claim flow link-based + multiplier) reconstruit après suppression v0.2. Trois types initiaux : `bonus_verbatims_terrain`, `bonus_dev_plan`, `bonus_prototype_draft`. Multiplier scope `next_deliverable` ou `rest_of_event`, cap global 3.00x.
2. **MoSCoW Kanban web natif** : remplace l'ex-livrable #4 "fiche-produit-plan-dev-v1" (3 verbatims) par un Kanban interactif 4 colonnes (Must / Should / Could / Won't) avec drag-and-drop `@dnd-kit/core`. Persiste via nouvelle table `moscow_cards`. Export CSV GM-only.
3. **Polish des 9 livrables AgreenTech** : sections 5.1-5.9 du seed `seed_event_hackdays.sql` finalisées (3 déjà appliquées en live, 6 restantes à committer).

**Verbatims terrain** : pilier anti-fabrication B4-retro **migré du livrable obligatoire #4 vers un livrable BONUS optionnel** (`bonus_verbatims_terrain`). Trade-off pédagogique conscient (cf risques §3).

**Bonus livrables Bonus B (existant)** : conservé inchangé — ce nouveau mécanisme `bonus_events` est distinct du livrable obligatoire "Bonus B" du parcours.

</domain>

<decisions>
## Implementation Decisions (locked)

### A. Schema SQL nouveau

- **Table `bonus_events`** : `id`, `project_id` (uuid → players.id), `type` (enum `bonus_type`), `title`, `description`, `doc_url`, `status` (enum `bonus_status`), `multiplier_factor` (numeric(3,2)), `multiplier_scope` (enum `multiplier_scope`), `multiplier_consumed_at` (timestamptz nullable), `claimed_at`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`.
- **Enums nouveaux** :
  - `bonus_type` = `bonus_verbatims_terrain | bonus_dev_plan | bonus_prototype_draft` (3 valeurs initiales).
  - `bonus_status` = `draft | submitted | validated | rejected`.
  - `multiplier_scope` = `next_deliverable | rest_of_event`.
  - `moscow_bucket` = `must | should | could | wont`.
- **Table `moscow_cards`** : `id`, `project_id`, `deliverable_template_id`, `bucket`, `ord` (smallint), `feature`, `pourquoi`, `contrainte`, `created_by`, `created_at`, `updated_at`.
- **RLS pilote-grade** :
  - `bonus_events` : Player voit ses bonus, Mentor voit ceux du project assigné, GM voit tout. INSERT Player-only (status='submitted'). UPDATE Mentor-only (validation/rejet).
  - `moscow_cards` : Player CRUD ses cartes (project_id = player du user). Mentor SELECT ses projets. GM full access.
- **Triggers** : `updated_at` auto sur les deux tables, idempotence via `IF NOT EXISTS` + `DO blocks` enum + `ON CONFLICT DO UPDATE` seed.

### B. Multiplier mechanism

- **Constante** : `BONUS_MULTIPLIER_CAP = 3.00` (cap global, anti stacking abuse).
- **Applique le multiplier à la première submission validée après claim** (pour scope `next_deliverable`).
- **Pour scope `rest_of_event`** : persiste jusqu'à `event.endsAt`.
- **Multiplier `numeric` JAMAIS rendu Player en chiffre** (R1 strict) — UI affiche un badge qualitatif (`<BonusStatusBadge>`).
- `lib/score.ts` : nouvelle fonction pure `applyBonusMultiplier(rawScore, bonusEvents, submission) → {boostedScore, applied}`. **`sumPlayerScoreProject` signature inchangée** (backward-compat avec `lib/results.ts`).

### C. UI components nouveaux

- `components/bonus-claim-form.tsx` : `'use client'`, consomme `claimBonusEventFlow` via `useActionState`. Inputs : `docUrl` (URL https), `type` (hidden), `title` (required), `description` (textarea). Affiche `state.message` en `role="status"` ou `role="alert"`.
- `components/bonus-status-badge.tsx` : pure presentational badge **qualitatif** (Boost actif / En attente / Rejeté) — JAMAIS chiffre. R1 strict (grep `score|/100|toFixed|points|multiplier_factor|number = 0`).
- `components/moscow-card.tsx` + `components/moscow-kanban.tsx` : drag-and-drop avec `@dnd-kit/core@^6.1.0` + `@dnd-kit/sortable@^8.0.0` (PIN strict, éviter v9/v10 breaking) + `@dnd-kit/utilities@^3.2.2`.
- **Pas d'optimistic state update T-3** : `revalidatePath` + `router.refresh()` après chaque mutation (issue revision #7).

### D. Routes nouvelles

- `app/journey/bonus/[type]/page.tsx` : Player claim form + historique claims du player pour ce type.
- `app/mentor/bonus/[id]/page.tsx` : Mentor review form (POST `reviewBonusEventFlow`).
- `app/journey/deliverable/[id]/moscow-snapshot/page.tsx` : snapshot URL pointée par submission.
- `app/api/export/moscow/[deliverableId].csv/route.ts` : export CSV GM-only (`is_game_master()` gate, `dynamic='force-dynamic'`, header-only en demo mode).

### E. Server actions nouvelles (`app/actions.ts`)

- `claimBonusEventFlow` : Player submit URL preuve, INSERT row `status='submitted'`, multiplier_factor + scope copiés depuis `BONUS_DEFAULTS[type]`.
- `reviewBonusEventFlow` : Mentor validate/reject + feedback.
- `createMoscowCardFlow`, `updateMoscowCardFlow`, `deleteMoscowCardFlow`, `reorderMoscowCardsFlow` (batch UPDATE après DnD via FormData JSON).
- `submitMoscowDeliverableFlow` : INSERT submission `kind='proof_url'` pointant vers `/journey/deliverable/{templateId}/moscow-snapshot`.
- **Toutes les actions** : Zod `safeParse`, `httpsUrl` enforcement, `WorkflowState { ok, message, mailto? }` retour, **jamais throw** (R2 warn-only).

### F. Polish 9 livrables AgreenTech (Wave 0)

- 3 sections **déjà appliquées en session live (NON commitées)** : 5.1 Persona AgriTech, 5.2 Hypothèse VP, 5.3 BMC 9 blocs.
- 6 restantes à finaliser dans le seed (5.4 → 5.9) — Plan 01 commit single-shot live edits + sections restantes.
- **#5 (`etude-marche-v1`)** : conservé en l'état (option a — pas de doublon avec #4 MoSCoW car contenu différent).

### G. Cardinaux R1/R2/R3

- **R1 (score invisible Player)** : multiplier_factor numeric jamais rendu côté Player. `<BonusStatusBadge>` qualitatif uniquement. Audit grep R1 dans Plan 12 (smoke).
- **R2 (validators warn-only)** : `severity: "warn"` sur tous nouveaux validators, server actions `safeParse` + `{ok:false, message}` jamais throw.
- **R3 (no inter-mission blocking)** : aucun `disabled` DOM, aucun `pointer-events: none` sur missions verrouillées. Tooltip ambre via `eic-locked-hint--amber` si nécessaire.

### Claude's Discretion (à exécution)

- Ordre exact des migrations Supabase timestamp (cohérent avec convention `YYYYMMDDHHMMSS_xxx.sql`).
- Détails finitions UI (espacement, copywriting i18n keys exactes) — guidé par tokens existants `globals.css`.
- Cas limite RLS (Mentor essaie d'éditer un bonus déjà validé par autre Mentor) — `WHERE status='submitted'` clause sur RLS UPDATE.

</decisions>

<canonical_refs>
## Canonical References (downstream agents MUST read)

### Project guards & cardinaux
- `CLAUDE.md` § "T-3 Critical Gates" — statut B1-B5 post-rétro 2026-05-10.
- `CLAUDE.md` § "Pre-edit guards (zones sensibles)" — règles R1/R2/R3 + spawn `eic-pedagogical-advisor` obligatoire.
- `CLAUDE.md` § "Default = ship + push (no defer, no anxiety)" — policy 2026-05-10 pre-pilote.
- `RETROSPECTIVE-T3-2026-05-10.md` — rétro complète Worked / Didn't / How-to / Risks.

### Source brief & decisions
- `.planning/quick/260510-t3x-scope-expansion-moscow-kanban-bonus-events/BRIEF.md` — intention + scope items détaillé.

### Schema mirror & seeds
- `database/schema.sql` — schema canonique (mirror Supabase).
- `database/triggers.sql` — triggers XP + updated_at.
- `database/rls.sql` — helpers `has_role`, `is_staff`, `is_my_player`, `is_mentor`, `is_game_master`.
- `database/seed_event_hackdays.sql` — seed des 9 livrables AgreenTech.
- `supabase/migrations/20260510160000_seed_event_hackdays_agritech.sql` — mirror migration applied prod.

### Domain types & helpers (TS)
- `lib/types.ts` — single source of truth (à étendre : BonusType, BonusStatus, MultiplierScope, BonusEvent, MoscowBucket, MoscowCard, BONUS_DEFAULTS, BONUS_MULTIPLIER_CAP).
- `lib/score.ts` — scoring (à étendre : `applyBonusMultiplier`).
- `lib/results.ts` — pondération 0.20/0.80 (B2 fixé), `DEFAULT_PITCH_WEIGHT = 0.8`.
- `lib/csv.ts` — `csvResponse(filename, toCsv(rows))` réutilisé pour export MoSCoW.
- `lib/i18n.ts` — copy keys (à étendre : ~20 clés bonus + moscow).

### Patterns référence
- `app/admin/export/players.csv/route.ts` — pattern route handler CSV (auth gate + `dynamic='force-dynamic'` + demo mode bypass).
- `components/proof-workflow.tsx` — pattern client component `useActionState` + redirect mailto.
- `components/journey-level-node.tsx` — pattern locked-hint amber (R3 reference).

### Reviewers & advisors
- `.claude/agents/eic-pedagogical-advisor.md` — agent à spawn AVANT chaque édition zone sensible (R1/R2/R3 verdict).

</canonical_refs>

<specifics>
## Specifics (concrete file paths impacted)

```
database/schema.sql                                                (+ ~30 lignes : tables bonus_events + moscow_cards)
database/triggers.sql                                              (+ ~15 lignes : updated_at triggers)
database/rls.sql                                                   (+ ~40 lignes : policies 2 nouvelles tables)
database/seed_event_hackdays.sql                                   (modif sections 5.1→5.9 + 3 bonus seed)
database/bonus_events.sql                                          (NEW)
database/moscow_cards.sql                                          (NEW)
supabase/migrations/20260510170000_bonus_events_recreate.sql       (NEW ~ 100 lignes)
supabase/migrations/20260510170100_moscow_cards.sql                (NEW ~  50 lignes)
supabase/migrations/20260510160000_seed_event_hackdays_agritech.sql (modif sections 5.1-5.9 mirror)
lib/types.ts                                                       (+ BonusType, BonusStatus, MultiplierScope, BonusEvent, MoscowBucket, MoscowCard, BONUS_DEFAULTS, BONUS_MULTIPLIER_CAP)
lib/score.ts                                                       (+ applyBonusMultiplier pure fn)
lib/bonus.ts                                                       (NEW : helpers fetch + filter validated bonus by player)
lib/moscow.ts                                                      (NEW : helpers fetch + group by bucket)
lib/i18n.ts                                                        (+ ~20 keys)
app/actions.ts                                                     (+ 7 actions Flow : claimBonus, reviewBonus, createMoscowCard, updateMoscowCard, deleteMoscowCard, reorderMoscowCards, submitMoscowDeliverable)
app/journey/page.tsx                                               (modif rail bonus + subtitle hero ligne 85)
app/journey/deliverable/[id]/page.tsx                              (modif intégration moscow-kanban si template = MoSCoW)
app/journey/bonus/[type]/page.tsx                                  (NEW)
app/journey/deliverable/[id]/moscow-snapshot/page.tsx              (NEW)
app/mentor/bonus/[id]/page.tsx                                     (NEW)
app/api/export/moscow/[deliverableId].csv/route.ts                 (NEW)
components/bonus-claim-form.tsx                                    (NEW)
components/bonus-status-badge.tsx                                  (NEW)
components/moscow-card.tsx                                         (NEW)
components/moscow-kanban.tsx                                       (NEW)
package.json                                                       (+ @dnd-kit/core ^6.1.0, @dnd-kit/sortable ^8.0.0, @dnd-kit/utilities ^3.2.2)
package-lock.json                                                  (sync)
CLAUDE.md                                                          (Plan 01 commit live edits sections T-3 Gates + Pre-edit guards + Freeze)
```

**Effort estimé total** : 39-51h dev + 4-6h smoke = **43-57h sur 5 jours** (compatible uniquement Omar full-time + zéro blocker majeur).

</specifics>

<deferred>
## Deferred Ideas (out-of-scope Phase 12)

- **Multiplicateur vitesse X1/X2/X3 sous-livrables BMC** : feature future v0.3 — la phase 12 livre uniquement le mécanisme `bonus_events` avec multiplier de base.
- **Notation différée jury** (C1 du backlog Phase 11) — séparé.
- **Décomposition 5×/20 + σ** (C2) — séparé.
- **Lettre retour PDF signée** (C4) — séparé.
- **Schemas v2 architectural refacto** (T3-IMPROVEMENTS section F) — déjà planté en SEED-001 v0.3.
- **Multi-event readiness + Resources** (Phase 7 héritée v0.1) — post-pilote.
- **Notifications & Engagement** (Phase 6 héritée v0.1) — post-pilote.

</deferred>

<risks>
## Risques (acceptés par owner)

- ⚠️ **Cassure freeze T-3** consciente (CLAUDE.md ligne "Freeze feat() jusqu'au 14/05 soir" override).
- ⚠️ **Risque délai go-live 13/05** : si bug bloquant en prod le 12/05 soir, fallback non identifié.
- ⚠️ **Smoke regression compressé** : nominalement 1-2j, comprimé à 0.5j.
- ⚠️ **Triple casquette Omar** maintenue (dev + setup pilote + animation 13/05) — burnout risk.
- ⚠️ **Verbatims migration vers BONUS** : pilier anti-fabrication B4-retro recalé en bonus, peut affaiblir la pédagogie.
- ⚠️ **Partenaires Tamwilcom / BoA / Innov Invest / Bluespace** : aucune comm prévue sur scope expansion.

</risks>

<execution_notes>
## Notes pour /gsd-execute-phase

1. **Wave 0 (Plan 01)** — commit live edits T-3-polish atomique AVANT toute autre édition. Fichiers concernés :
   - `app/journey/page.tsx` ligne 85 (subtitle hero)
   - `database/seed_event_hackdays.sql` blocs 5.1, 5.2, 5.3 (déjà refondus, NON commités)
   - `supabase/migrations/20260510160000_seed_event_hackdays_agritech.sql` mirror
   - `CLAUDE.md` sections T-3 Gates + Pre-edit guards + Freeze
2. **Spawn `eic-pedagogical-advisor`** AVANT chaque édition en zone sensible (cf canonical_refs).
3. **`npm run typecheck && npm run lint && npm run build` clean** après chaque commit atomique.
4. **Dual-mode demo préservé** : ne jamais ajouter `redirect("/login")` ou `getCurrentUser()` avant check `hasSupabaseEnv()`.
5. **Push remote systématique** après chaque commit (policy "Default = ship + push").

</execution_notes>

---

*Phase 12 : `quick-260510-t3x` — Context gathered 2026-05-10 via promotion BRIEF.md → CONTEXT.md (mode `--auto`)*
*Source : `.planning/quick/260510-t3x-scope-expansion-moscow-kanban-bonus-events/BRIEF.md`*
