# Phase 1: Foundation (Schema + Types + Suppression code obsolète) - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Mode:** Auto (smart-discuss --auto, recommandations par défaut basées sur PROJECT.md Key Decisions)

<domain>
## Phase Boundary

Phase 1 livre la fondation technique du pilote :
1. Schema Postgres aligné sur le brief (events, levels, missions, deliverable_templates, cohorts, players, player_members, submissions, evaluations, pitch_scores) appliqué sur projet Supabase prod **fresh**
2. Types TS refactorés : `lib/data.ts` (1285 lignes monolithiques) → `lib/types.ts` + `lib/seed/*.ts` + `lib/score.ts` + `lib/icons.ts`
3. Code mort supprimé hard : `BonusEvent`, `bonusRules`, `prestige_xp`, `Checkpoint`, `MaturityPhase`, `Stage`, pages `/committee`, `/admin/game`, `/admin/startups`, mailto drafts, exports `committee/*`, `eml/*`, `kpi-snapshot.csv`
4. Renommage domain : `Startup`→`Player`, `coach`→`Mentor`, `eic_admin`→`GameMaster`
5. Login email/password sur `/login` qui marche en local sur Supabase prod fresh et redirige selon rôle (Player→`/journey`, Mentor→`/mentor`, GameMaster→`/admin`)
6. Lucide-react repinné, `npm run lint` + `npm run typecheck` clean

**Hors scope Phase 1** : implémentation des pages cibles (journey, mentor, admin) — ce sont des stubs pour vérifier le routing post-login. Phase 2-4 implémentent leur contenu.

</domain>

<decisions>
## Implementation Decisions

### Schema strategy
- **D-01 :** Projet Supabase **fresh** (nouvelle base, pas de migration depuis l'existant) — décision PROJECT.md Key Decisions ; pas de données prod à préserver, le pilote démarre vierge
- **D-02 :** SQL apply order : `database/schema.sql` → `database/triggers.sql` → `database/rls.sql` (existing convention conservée)
- **D-03 :** Tables nommées au pluriel snake_case ; FK chaudes indexées explicitement ; `created_at`/`updated_at` avec triggers `updated_at` automatiques
- **D-04 :** Énums Postgres mirror les enums TS (`player_role`, `submission_status`, `verdict`, etc.) — single source of truth côté DB, types TS dérivés
- **D-05 :** RLS **activée dès Phase 1** sur toutes les tables avec policies pilot-grade : Player ne voit que ses lignes, Mentor voit tout en lecture, GameMaster voit/écrit tout

### Types refactor strategy
- **D-06 :** `lib/data.ts` est **éclaté en 4 modules** :
  - `lib/types.ts` — domain types + enums (single source of truth TS)
  - `lib/seed/*.ts` — données démo (utilisées uniquement quand `hasSupabaseEnv()` est false ; sinon retournent `[]`)
  - `lib/score.ts` — helpers de calcul Score Projet, pondérations
  - `lib/icons.ts` — mapping enum → lucide icon
- **D-07 :** Types TS **réécrits manuellement** dans `lib/types.ts` (pas Supabase CLI codegen) — contrôle fin sur les types métier (Discriminated unions sur Submission V1/V2, etc.) ; codegen Supabase peut être ajouté en V2
- **D-08 :** Nommage TS : PascalCase types (`Player`, `Submission`, `Evaluation`), camelCase fields, mapping snake_case ↔ camelCase explicite dans les server actions (pattern existant conservé)

### Code deletion strategy
- **D-09 :** Hard delete (pas de deprecation/feature flag) — ROADMAP success criteria #3 est explicite, et c'est plus sûr de supprimer que laisser du code mort
- **D-10 :** Fichiers/symbols à supprimer (liste exhaustive) :
  - Types/enums : `BonusEvent`, `BonusType`, `BonusStatus`, `bonusRules`, `calculateBonusClaim`, `Checkpoint`, `MaturityPhase`, `Stage` enum, `prestige_xp` (db col + ts field), `committeeDossierRows`, `reviewReminderBody`
  - Pages : `app/committee/`, `app/admin/game/`, `app/admin/startups/`, `app/mailto/`
  - API routes : `app/api/export/committee/`, `app/api/export/eml/`, `app/api/export/kpi-snapshot.csv/`
  - Server actions : tout ce qui touche bonus/committee/mailto drafts dans `app/actions.ts`
  - Helpers : `mailtoUrl`, `deliverableMailBody` côté Player flow (kept uniquement si réutilisés ; sinon supprimés)
- **D-11 :** Tests de non-régression manuels : `npm run typecheck` + `npm run lint` + `npm run build` doivent passer après chaque batch de suppression

### Domain renaming strategy
- **D-12 :** Renommage en 3 vagues commitables séparément :
  1. DB : `startups` → `players`, `coach` role → `mentor`, `eic_admin` → `game_master` (migrations brutes puisque DB fresh)
  2. TS : `Startup` → `Player`, `Coach` → `Mentor`, `EicAdmin` → `GameMaster` (find-replace global avec validation typecheck)
  3. UI/routes : `app/startup/` → `app/player/`, `app/coach/` → `app/mentor/`, `app/admin/` reste mais role internal renommé
- **D-13 :** AppRole enum final : `'player' | 'mentor' | 'game_master'` (pas de pluriel, snake_case TS string union conservé)

### Auth & login
- **D-14 :** Email/password uniquement Phase 1 (magic link arrive en Phase 4 avec bulk import). Pas de signup public — comptes créés par GameMaster ou seed initial pour Phase 1 testing
- **D-15 :** Redirection post-login basée sur `players.role` lue dans Supabase :
  - `player` → `/journey`
  - `mentor` → `/mentor`
  - `game_master` → `/admin`
- **D-16 :** Middleware (`middleware.ts` + `utils/supabase/middleware.ts`) gardé tel quel ; ajustement des routes publiques whitelist : `/login`, `/api`, `/_next`, `/auth/callback`
- **D-17 :** Stubs minimaux pour `/journey`, `/mentor`, `/admin` Phase 1 : juste un `<h1>` "Player journey — Phase 2" pour valider le routing — pas de contenu réel

### Tooling
- **D-18 :** `lucide-react` repinné en version exacte stable (latest 0.x avant la pseudo-1.x). À vérifier en runtime — la version `^1.14.0` actuelle est suspecte, Lucide n'a pas atteint v1 stable.
- **D-19 :** Pas de tests automatisés ajoutés (PROJECT.md Constraints — tests V2)

### Claude's Discretion
- Détail des indexes secondaires (au-delà des FK chaudes) — choisir au cas par cas
- Format exact des migrations SQL (unique fichier vs multiples) — au choix selon ergonomie
- Nommage exact des fichiers seed (`lib/seed/players.ts`, `lib/seed/missions.ts`, etc.) — au choix
- Style et structure des stubs Phase 1 (`/journey`, `/mentor`, `/admin`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec produit
- `.planning/PROJECT.md` — vision, MUST/SHOULD requirements (M1-M12, S1-S4), Key Decisions, Out of Scope
- `.planning/REQUIREMENTS.md` — acceptance criteria détaillés (à lire si présent)
- `.planning/ROADMAP.md` §Phase 1 — success criteria
- `.planning/STATE.md` — risk watch (Refactor schema vs migration, lucide-react, magic link)

### Brief & spec design
- `entrepreneur_game_brief.md` (racine repo, fourni par Omar) — vision complète Niveaux 0-7, scoring multi-dim, rôles, V1→V2
- `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md` — spec de design pilote (référence ROADMAP.md ligne 4)
- `Programme Hack'Days 16&17 Avril 2026.pdf` — programme événement, mapping ateliers↔niveaux

### Codebase intel
- `.planning/codebase/CONCERNS.md` — dette technique connue (référencée PROJECT.md Context)
- `CLAUDE.md` — stack, conventions, dual-mode pattern, naming, server action pattern
- `database/schema.sql`, `database/triggers.sql`, `database/rls.sql` — schema actuel (à remplacer)
- `lib/data.ts` (1285 lignes) — source actuelle à éclater
- `app/actions.ts` — server actions à nettoyer
- `utils/supabase/server.ts`, `utils/supabase/middleware.ts` — clients Supabase SSR (gardés)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Supabase SSR setup** (`utils/supabase/*`) : à conserver tel quel, c'est le pattern correct
- **Middleware auth pattern** (`middleware.ts` + `updateSession`) : à conserver
- **Zod validation pattern** dans `app/actions.ts` (`httpsUrl` schema, `safeParse` + `WorkflowState` return) : à conserver pour les nouvelles actions
- **Path alias `@/*`** vers repo root : conservé
- **`hasSupabaseEnv()`** dans `lib/supabase-status.ts` : conservé, pivot du dual-mode
- **`lib/i18n.ts`** dictionnaires FR/EN : conservés, étendre

### Established Patterns
- **Server-first rendering** : pages async server components qui importent `lib/data.ts` ou Supabase client directement
- **Single `app/actions.ts`** pour toutes les mutations (pattern à conserver, mais nettoyer le contenu)
- **Server action shape** : `(_prevState: WorkflowState, formData: FormData) => Promise<WorkflowState>` pour les `Flow` variants
- **Mapping snake_case (DB) ↔ camelCase (TS)** explicite dans les actions
- **Dual mode demo/prod** via `hasSupabaseEnv()` : seed quand env absent, DB quand env présent

### Integration Points
- **`app/layout.tsx` + `components/app-shell.tsx`** : navigation persistante par rôle ; à mettre à jour pour nouvelles routes
- **`middleware.ts`** : auth gating ; ajuster les paths publics
- **`tsconfig.json`** : path alias `@/*` ; pas à changer
- **`next.config.ts`** : remoteImagePatterns whitelist `api.dicebear.com` ; conservé

### Dette technique à attaquer (extrait CONCERNS.md / PROJECT.md)
- Duplication actions `Flow` / non-Flow → garder uniquement `Flow` (les variants void-return sont legacy)
- `lib/data.ts` monolithique → éclatement décidé (D-06)
- Demo seed leak en mode Supabase → fix dans Phase 2 (DATA-03), Phase 1 prépare le terrain en supprimant les imports
- Server actions silencieuses (return; sans message) → forcer le shape `WorkflowState` partout
- RLS pilot-grade buggué → réécriture complète Phase 1 (D-05)
- Math XP côté client falsifiable → calcul serveur Phase 3 (SCORE-01)
- Lucide-react `^1.14.0` mauvais pin → fix (D-18)

</code_context>

<specifics>
## Specific Ideas

- Le projet Supabase prod existe déjà (PROJECT.md Constraints) — Phase 1 confirme s'il est utilisé fresh ou si on en crée un nouveau. Décision Omar requise au démarrage Phase 1 (cf STATE.md Risk Watch ligne 46).
- Login UI minimal mais branded EIC dès Phase 1 si possible (sinon Phase 4 BRAND-*) — pour éviter écran "démo" devant Omar lui-même pendant le dev.
- Stubs Phase 1 doivent afficher le rôle détecté pour faciliter le debug du routing.

</specifics>

<deferred>
## Deferred Ideas

- Magic link UI / bulk import — Phase 4 (M2, ADMIN-02)
- Implémentation contenu `/journey` — Phase 2 (JOURNEY-*)
- Implémentation contenu `/mentor` — Phase 3 (EVAL-*)
- Implémentation contenu `/admin` — Phase 4 (ADMIN-*)
- Onboarding form Niveau 0 — Phase 2 (ONBOARD-02)
- Branding complet (logo, partenaires, polish) — Phase 4 (BRAND-*)
- Tests RLS exhaustifs avec 2 comptes Player factices — Phase 5 (DATA-02)
- Codegen Supabase types automatique — V2 (Project B)
- Audit log writing — V2 (PROJECT.md Out of Scope)
- Score Engagement serveur — Phase 6 SHOULD (S2)

</deferred>

---

*Phase: 01-foundation-schema-types-suppression-code-obsol-te*
*Context gathered: 2026-05-08 (auto-mode, defaults from PROJECT.md Key Decisions)*
