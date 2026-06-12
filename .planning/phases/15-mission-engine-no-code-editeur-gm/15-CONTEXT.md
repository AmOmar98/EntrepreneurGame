# Phase 15: Mission Engine no-code (éditeur GM) - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Un GameMaster peut créer, éditer et cloner un programme complet (event + missions + livrables + rubrics + paramètres) depuis `/admin` sans écrire une ligne de SQL, et tous les comportements par livrable (composer_kind, template_url, auto_validate, soft_recommends_before) sont data-driven.

Requirements : ENGINE-01 (CRUD missions), ENGINE-02 (CRUD deliverable_templates + éditeur de barème), ENGINE-03 (clonage event 1 clic), ENGINE-04 (création event+cohorte), ENGINE-05 (dé-hardcoding slugs → colonnes composer_kind/template_url/auto_validate), ENGINE-06 (soft_recommends_before hint ambre non bloquant), ENGINE-07 (calendrier simulable à date arbitraire), LEVELS-04 (édition niveaux du programme), VALID-01 (validation_rules warn-only structurel), VALID-02 (exception L2 unique non exposée).

HORS scope : grille jury + event_settings scoring (phase 16), provisioning juillet (phase 18).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped. Use ROADMAP goal, success criteria, UI-SPEC (à générer) and codebase conventions.

### Contraintes verrouillées (Omar 2026-06-11)
- **R3 CARDINAL** : l'éditeur n'expose JAMAIS de dépendance hard-block configurable. Seul `soft_recommends_before` existe (hint ambre côté Player, `eic-locked-hint--amber`, zéro `disabled` DOM). L'exception L2 `prep-questions-v1`→`fiches-entretien-v1` reste un littéral codé (HARD_BLOCK_DEPENDENCIES) non généralisable, INVISIBLE dans l'éditeur.
- **R2 CARDINAL structurel** : `validation_rules [{rule, severity, message}]` — `severity` est contrainte à `"warn"` par CHECK SQL et par le type TS/Zod (pas de valeur "error" possible côté Player). Tout dépassement = review humaine.
- **R1 CARDINAL** : l'éditeur est GM-only (`/admin`) — tout est permis côté GM ; aucune fuite de l'éditeur vers les surfaces Player.
- **Migrations file-first** dans `supabase/migrations/` (idempotentes) ; apply PROD batché au prochain checkpoint opérateur (avec la migration en attente `20260611220000_events_org_scope_enforce.sql` + smoke RLS). Le code tolère l'état pré-migration (colonnes absentes → fallback comportement actuel).
- **ENGINE-05 dé-hardcoding** : `composer_kind` (`simple`|`moscow`|`multi_url`), `template_url` (remplace lib/template-links.ts), `auto_validate` (remplace le flow spécial fiches-entretien + UUID G01 — ATTENTION : le trigger SQL `fn_auto_eval_fiches_entretien` contient un UUID utilisateur hardcodé, à paramétrer), `soft_recommends_before` (template_id nullable). Backfill des valeurs actuelles (13 templates Digi) dans la migration. Les slugs littéraux dans app/actions.ts + pages sont remplacés par lecture des colonnes.
- **Dual-mode demo** : l'éditeur en mode demo opère sur le seed in-memory (lecture seule acceptable avec message, ou state local) — ne JAMAIS casser les 15 E2E demo. Les nouvelles colonnes ont des défauts sûrs dans lib/seed/.
- **RLS** : policies `*_gm_all` existantes couvrent déjà l'écriture GM sur events/missions/deliverable_templates/cohorts/levels (levels_v2_gm_all créée en phase 14). Vérifier announcements du clonage.
- **ENGINE-07** : logique calendrier simulable — paramètre de date injectable (env/query GM-only) pour le smoke « à la date de l'event » (leçon incident BMC J1).
- **Filet qualité** : typecheck+lint+build+test:unit+test:e2e verts à chaque push ; nouveaux tests unitaires pour les schémas Zod de l'éditeur et le clonage ; E2E GM editor smoke en mode demo.
- **Branche** milestone/v0.4-scale-foundation, push par plan, pas de merge main.
- Server actions : module unique app/actions.ts, Zod, WorkflowState { ok, message }, revalidatePath, jamais throw.
- **UI** : suivre UI-SPEC (15-UI-SPEC.md généré par gsd-ui-phase) + design system EIC existant (tokens, primitives, AppShell) ; copy via lib/i18n.ts.

</decisions>

<code_context>
## Existing Code Insights

- Admin existant : `app/admin/` (dashboard GM), `app/admin/deliverables/` = table read-only + toggle is_active (`components/admin-deliverables-table.tsx`, action `toggleDeliverableActiveFlow`) — SEUL outil catalogue actuel, analog direct pour l'éditeur.
- Slugs hardcodés à remplacer (inventaire phase 13/14) : `HARD_BLOCK_DEPENDENCIES` + flow auto-validation `fiches-entretien-v1` (app/actions.ts), `MOSCOW_DELIVERABLE_SLUG` (app/journey/deliverable/[id]/page.tsx), `lib/template-links.ts` (13 URLs OneDrive → colonne template_url), UUID G01 dans trigger `fn_auto_eval_fiches_entretien`.
- `lib/active-event.ts` : accessors getActiveEvent/getActiveEventId prêts (non utilisés — Phase 15 les consomme pour l'action activate-event).
- `levels_v2` + `lib/levels.ts` (phase 14) : base de LEVELS-04 (CRUD niveaux du programme).
- Tables DB : events/cohorts/missions/deliverable_templates (rubric jsonb, max_score, ord, is_bonus, is_active) — RLS *_gm_all en place.
- Le clonage = INSERTs paramétrés (pattern seed_event_digi_hackathon.sql ON CONFLICT) côté server action.
</code_context>

<specifics>
## Specific Ideas

- Routes suggérées : `/admin/events` (liste + créer + cloner + activer), `/admin/events/[id]/missions` (CRUD missions + ord), éditeur template (rubric builder : critères label+max dynamiques), `/admin/levels` (LEVELS-04).
- Le clonage copie missions + templates + réglages avec nouveaux UUIDs, slugs suffixés, dates décalées optionnelles.
- ENGINE-07 : helper `getSimulatedNow()` lu d'un override GM (cookie/env) utilisé par les filtres scheduled_date.
</specifics>

<deferred>
## Deferred Ideas

- Drag-and-drop reorder (boutons up/down suffisent v0.4)
- Bibliothèque de blocs DE-24 (v0.5 Phase B)
- Suppression physique des templates (désactivation is_active suffit — pas de DELETE risqué)
</deferred>
