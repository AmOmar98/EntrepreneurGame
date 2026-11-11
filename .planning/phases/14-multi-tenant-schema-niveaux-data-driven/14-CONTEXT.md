# Phase 14: Multi-tenant Schema + Niveaux data-driven - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Le schéma DB supporte la hiérarchie `organization → event → cohort → mission → deliverable_template`, les niveaux sont une table (plus d'enum PG `level_id`), et le RLS inter-org est strict — sans perte de données PROD.

Requirements : TENANT-01 (organizations), TENANT-02 (RLS inter-org), TENANT-03 (event actif explicite), TENANT-04 (archives lecture seule intactes), LEVELS-01 (niveaux en table), LEVELS-02 (migration enum→table sans perte), LEVELS-03 (UI lit labels/ordres depuis la DB, suppression triple miroir TS/Zod).

HORS scope phase 14 : l'éditeur GM (phase 15), grille jury + settings (phase 16), LEVELS-04 (édition niveaux = phase 15).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Contraintes verrouillées (Omar 2026-06-11 + leçons phase 13)
- **Migrations file-first** : auteur dans `supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql` (MANIFEST règle 1), idempotentes/transactionnelles (règle 2). `database/**` reste Write-deny pour les outils Write/Edit — Omar a autorisé le pattern « script Node » pour refléter la vue déclarative `database/schema.sql`/`triggers.sql`/`rls.sql` (règle 4) après revue ; chaque application de ce pattern doit être signalée dans le SUMMARY.
- **Apply PROD = checkpoint opérateur batché** : les outils MCP Supabase sont indisponibles (échec de propagation récurrent, cf. 13-01-SUMMARY). L'application PROD passe par `supabase db push --linked` (Omar) ou SQL Editor — REGROUPER les applies en un minimum de checkpoints. Le code applicatif doit tolérer l'état pré-migration (feature-detection ou déploiement coordonné) OU l'apply est un prérequis posé explicitement avant le merge/déploiement.
- **Aucune perte de données PROD** (cardinal) : migration enum `level_id` → table en étapes additives uniquement (add column → backfill → switch reads → drop old en phase ultérieure si jamais). Rollback documenté par étape. Les enums PG ne se rétrécissent pas — passer par colonne text/FK.
- **Archives intactes (TENANT-04)** : AgreenTech + Digi restent lisibles avec leurs classements — aucune migration de leurs données au-delà de l'ajout de colonnes nullable/default (org par défaut « EIC » les adopte sans les modifier).
- **Mono-org de fait au lancement** : une organisation par défaut « EIC / UEMF » adopte tous les events existants ; le RLS inter-org est posé structurellement (TENANT-02) mais il n'y a qu'une org en PROD pour l'event de juillet.
- **R1/R2/R3 + dual-mode demo préservés** : le fallback seed (`lib/seed/`, `hasSupabaseEnv()===false`) doit continuer de fonctionner — les nouveaux accessors niveaux/org ont un fallback demo. Jamais de `redirect("/login")` avant le check env. Audit grep R1 post-edit sur les zones touchées.
- **TENANT-03** : `events.is_active` (ou équivalent) + remplacement de la convention `order by starts_at desc limit 1` dans `lib/pitch-mode.ts` et tout équivalent (`lib/jury.ts`, `lib/results.ts`, etc. — grep `starts_at` pour les trouver tous).
- **LEVELS-03** : suppression des maps `LEVEL_LABELS`/`LEVEL_ORDS` (lib/journey.ts), `SHORT_LABELS`/`LEVEL_IDS` (lib/journey-progression.ts) et des `z.enum` miroirs (lib/schemas.ts désormais) — l'UI lit la table `levels`. `LevelId` TS devient `string` (ou type branded) — attention aux usages dans lib/types.ts, composants, et au tri par `ord`.
- **Filet qualité actif** : typecheck + lint + build + `npm run test:unit` (16 tests) + `npm run test:e2e` (15 tests) doivent rester verts à chaque commit — CI sur chaque push (gate).
- **Branche** : `milestone/v0.4-scale-foundation`, push réguliers (PR #1 ouverte). Pas de merge main.
</decisions>

<code_context>
## Existing Code Insights

- `database/schema.sql` : enum `public.level_id` (l.21-30, L0_diagnostic…), table `public.levels` (l.76-82 : id enum PK, ord, label, description) — la table existe déjà mais clé = enum. `missions.level_id` + `players.current_level` typés enum.
- Triple miroir TS : `lib/types.ts` (LevelId union), `lib/journey.ts:71-95` (LEVEL_LABELS/LEVEL_ORDS), `lib/journey-progression.ts:22-44` (LEVEL_IDS/SHORT_LABELS), Zod z.enum (désormais dans `lib/schemas.ts`).
- Drift connu (OPS-01-drift-report.md, phase 13) : `jurors`, `help_requests`, `announcements`, `evaluation_comments`, colonnes pitch_mode/pitch_order/is_active absents de la vue déclarative schema.sql — le refactor doit partir de PROD réel (= migrations cumulées), pas de schema.sql seul.
- RLS existant pilot-grade : helpers `is_game_master()`, `is_mentor()`, `is_my_player()`, `is_juror(event_id)` (SECURITY DEFINER, grants verrouillés kc2). Le scope org s'ajoute à ces helpers ou en policies dédiées. Patterns par défaut : `(SELECT auth.uid())` initplan, REVOKE FROM PUBLIC + GRANT authenticated sur secdef.
- Tests : `tests/unit/` (16), `tests/e2e/` (15, demo mode), CI 3 jobs.
</code_context>

<specifics>
## Specific Ideas

- Migration jouée en SQL idempotent + simulable : chaque étape re-exécutable, état intermédiaire fonctionnel.
- `organizations` : id uuid, slug, name, created_at ; `events.organization_id` FK NOT NULL avec default org backfillée.
- Seed demo (`lib/seed/`) doit refléter la nouvelle forme (org/levels dynamiques) pour les E2E.
</specifics>

<deferred>
## Deferred Ideas

- Suppression physique de l'enum `level_id` PG (DROP TYPE) — déférée post-event juillet (étape destructive, aucune urgence une fois les colonnes basculées).
- White-label branding par org — Phase D council (v0.5+).
</deferred>
