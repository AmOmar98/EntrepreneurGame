# Phase 16: Jury paramétrable + Scoring configurable - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Les critères du pitch, les règles XP, les paliers d'engagement et la pondération projet/pitch sont configurables par event par le GM — sans double hardcode entre TS et PL/pgSQL.

Requirements : JURY-06 (critères pitch par event en DB — remplace colonnes figées pitch_scores.c1..c5), JURY-07 (formulaire /jury dynamique), JURY-08 (classements absorbent critères dynamiques + rétro-compat archives 4/5 critères), JURY-09 (GM édite la grille jury), SETTINGS-01 (règles XP + paliers engagement en event_settings), SETTINGS-02 (pondération projet/pitch par event), SETTINGS-03 (triggers PL/pgSQL lisent les mêmes paramètres — zéro double hardcode), SETTINGS-04 (GM édite ces réglages).

HORS scope : provisioning juillet (phase 18), observabilité (phase 17).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — discuss skipped. Use ROADMAP success criteria + codebase conventions + phase 15 editor patterns.

### Contraintes verrouillées (Omar 2026-06-11 + héritage phases 13-15)
- **Archives intactes (cardinal)** : les classements AgreenTech (4 critères, hack c5=0 → ×1.25 normalisation lib/results.ts:272) et Digi doivent rester recalculables identiques. Approche additive : nouvelle table `pitch_criteria(event_id, key, label, max, ord)` + colonne `pitch_scores.scores jsonb` NULLABLE — les rows archivées gardent c1..c5 ; le calcul lit jsonb si présent, sinon colonnes legacy (chemin rétro-compat préservé). AUCUNE migration des rows archivées.
- **Migrations file-first** dans supabase/migrations/ (idempotentes, additives) ; apply PROD au checkpoint batché de fin de phase 16 (avec les 2 migrations en attente : 20260611220000 org-scope-enforce + 20260611230000 engine columns) via CLI `npx supabase db push --linked` (délégation Omar acquise) + smoke RLS + smoke 3 surfaces.
- **SETTINGS-03 zéro double hardcode** : `event_settings` (table ou jsonb sur events) lue PAR les triggers PL/pgSQL (recalc_player_score, recalc_player_engagement — version paramétrée dans une migration file-first) ET par les helpers TS (lib/score.ts, lib/journey.ts XP rules, lib/results.ts DEFAULT_PITCH_WEIGHT). Valeurs par défaut = valeurs actuelles (+100/+50/+100, paliers 100/25/50, pondération 0.2/0.8) — comportement inchangé sans réglage explicite. Fallbacks TS si table absente (pré-migration) ou demo.
- **R1 CARDINAL** : tout le travail jury/results est GM/Jury-facing — AUCUNE fuite Player (audit grep R1 post-edit obligatoire : zones lib/score.ts, lib/results.ts touchées = pre-edit guards CLAUDE.md). Le rang reste invisible Player partout.
- **R2/R3** : inchangés ; pas de validators bloquants ; éditeur de grille = même pattern UI que phase 15 (primitives EIC, i18n, aria-labels, demo read-only).
- **Jury form dynamique (JURY-07)** : rend les critères de l'event actif via pitch_criteria ; fallback legacy c1..c5 (labels lib/i18n.ts actuels) si pas de critères définis — les 3 surfaces jury existantes (saisie, replay, results) restent fonctionnelles pré-migration.
- **Filet qualité** : gate complet vert à chaque push (44 unit + 23 E2E minimum) ; nouveaux tests unitaires : calcul résultats dynamique + rétro-compat 4/5 critères + event_settings parsing ; E2E jury demo.
- **Branche** milestone/v0.4-scale-foundation, push par plan.
</decisions>

<code_context>
## Existing Code Insights

- `pitch_scores` : colonnes physiques c1..c5 smallint + total_score GENERATED STORED (c1+..+c5) — la colonne générée ne peut PAS être altérée pour lire un jsonb ; la nouvelle voie jsonb calcule total côté lecture (lib/results.ts) ou colonne total séparée. Contrainte : INSERT actuels spécifient c1..c5.
- `lib/results.ts` : DEFAULT_PITCH_WEIGHT=0.8 (l.33) ; hack rétro-compat 4-critères (l.74, l.280 : c5=0 → total×1.25) ; pondération combined = 0.8×pitch + 0.2×projet.
- `lib/jury.ts` : labels critères + levelRank maps (déjà rewirés phase 14) ; formulaire jury saisit 5 notes /20.
- Triggers PL/pgSQL : recalc_player_score (database/triggers.sql:57-84, somme best-per-template) — pas de constantes XP ; recalc_player_engagement (supabase/migrations/20260517224914 : +100 1ère soumission/+25/+50 paliers — vérifier le fichier) ; les règles XP TS +100/+50/+100 sont dans lib/journey.ts:349-361.
- Éditeur GM phase 15 : patterns établis (pages /admin/events, composer admin-*-editor, Flow actions, demo read-only) — la grille jury et les settings s'y intègrent (onglet/section de l'event).
- `getActiveEvent` (lib/active-event.ts) consommé par les actions phase 15.
</code_context>

<specifics>
## Specific Ideas

- `event_settings` : préférer colonnes jsonb `settings` sur events OU table dédiée — au choix du planner ; clés : xp_first_submission, xp_validate_v1, xp_validate_v2, engagement_thresholds, pitch_weight, bonus_cap.
- Grille jury éditable dans l'éditeur event (section « Grille jury » : lignes key/label/max + ord, même pattern que le rubric builder).
- PL/pgSQL paramétré : helper SQL `get_event_setting(p_event_id, p_key, p_default)` lu par les triggers.
</specifics>

<deferred>
## Deferred Ideas

- Migration des archives vers le format jsonb (interdit — lecture seule).
- Multi-jurys pondérés / coefficients par juré (v0.5+).
- Suppression des colonnes c1..c5 (destructive, post-juillet au plus tôt).
</deferred>
