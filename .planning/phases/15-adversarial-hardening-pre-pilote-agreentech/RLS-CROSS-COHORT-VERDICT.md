# Phase 15-02 — Verdict RLS cross-cohort

**Date** : YYYY-MM-DD HH:MM (à remplir)
**Exécuté par** : Omar (Cloud Studio, role par défaut = postgres bypass RLS, simulation auth via `set local request.jwt.claim.sub`)
**Script** : `scripts/test-rls-cross-cohort.sql`

## Pré-requis

Avant exécution, récupérer les UUIDs ci-dessous depuis Supabase Auth :

```sql
-- Pour récupérer les UUIDs en mode service_role (Cloud Studio par défaut) :
select id as user_id, email from auth.users
 where email in (
   'p.player1@ueuromed.org',
   'p.player2@ueuromed.org',
   'm.mentor1@ueuromed.org'
 );

-- Pour récupérer le public.players.id du Player de P02 :
select p.id as player_id, pm.user_id, u.email
  from public.players p
  join public.player_members pm on pm.player_id = p.id
  join auth.users u on u.id = pm.user_id
 where u.email = 'p.player2@ueuromed.org';
```

Variables psql `\set` à pré-remplir :
- `p01_uuid` = user_id pour `p.player1@ueuromed.org`
- `p02_uuid` = user_id pour `p.player2@ueuromed.org`
- `m01_uuid` = user_id pour `m.mentor1@ueuromed.org`
- `p02_player_id` = `public.players.id` du Player de P02

Si Cloud Studio classique ne supporte pas `\set`, remplacer les `:'xxx'` dans le SQL par les littéraux UUID directement.

## Résultats

| # | Scénario | Rows attendues | Rows observées | PASS/FAIL/SKIP |
|---|----------|----------------|----------------|----------------|
| 1 | Player A (P01) → submissions Player B (P02) | 0 (RLS narrowing `is_my_player`) | _à remplir_ | _à remplir_ |
| 2 | Player A (P01) → evaluations Player B (P02) | 0 (join policy via is_my_player) | _à remplir_ | _à remplir_ |
| 3 | Player A → players d'une autre cohorte | 0 ou SKIP (n=1 cohorte AgreenTech) | _à remplir_ | _à remplir_ |
| 4 | Mentor M01 → submissions all | > 0 (visibilité mentor légitime) | _à remplir_ | _à remplir_ |
| 5 | anon → submissions | 0 ou erreur "permission denied" | _à remplir_ | _à remplir_ |

## Verdict global

_À remplir post-exécution._

Options :
- **ALL PASS** : RLS pilot-grade OK pour AgreenTech 13-14/05, pas de blocker.
- **FAIL scénarios 1/2/5** → **STOP D-16 escalade owner** (fuite cross-Player active = critique go/no-go pilote).
- **FAIL scénario 3 (cross-cohort)** : si une seule cohorte AgreenTech présente → non-applicable, défer SEED-002 v0.3 (multi-tenant refonte).
- **FAIL scénario 4** : visibilité mentor cassée = blocker workflow Mentor (escalade owner si trouvé).

## Cross-références CONCERNS.md

Policies known-weak documentées dans `.planning/codebase/CONCERNS.md` §"Pilot-grade RLS — known weak policies" :

- **`members_same_project_or_staff_select`** : **N'EXISTE PAS dans le schéma actuel** (`database/rls.sql` utilise `player_members_self_or_mentor_select` ligne 147, modèle différent basé sur `player_members.user_id = auth.uid()`). CONCERNS référence un schéma "projects" antérieur. → **À mettre à jour dans CONCERNS.md post-pilote** (defer SEED-002 v0.3).

- **`bootcamp_deliverables_all_authenticated_select`** : pas non plus dans `database/rls.sql` (le schéma actuel utilise `deliverable_templates_authenticated_select` ligne 91 avec `using (true)`). Tous les Players voient tous les `deliverable_templates` — par design (catalogue partagé du Hack-Days). Pas un leak ; documenter en CONCERNS comme "par design".

## Notes architecturales

- Bypass `service_role` : `database/rls.sql` ligne 279-285 grant explicit `select/insert/update/delete on all tables to service_role`. Vérifier que les server actions utilisent BIEN `createClient()` SSR (cookie-aware = `authenticated` role) et NON `service_role` côté Player. → audit code-side hors scope Phase 15, à valider via SEED-002.
- `cohorts_authenticated_select using (true)` (ligne 96-97) : tous les authenticated voient toutes les cohortes (count + slugs). Par design pour le picker EIC ; pas un leak.

## Cross-références

- `database/rls.sql` (toutes policies)
- `.planning/codebase/CONCERNS.md` §"Pilot-grade RLS"
- Cohorte AgreenTech : `cohorte-agreentech-creds.csv` (gitignored, mémoire `reference_cohort_csvs`)
