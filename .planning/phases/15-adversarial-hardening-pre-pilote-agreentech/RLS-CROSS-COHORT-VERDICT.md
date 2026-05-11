# Phase 15-02 — Verdict RLS cross-cohort

**Date exécution** : 2026-05-11 10:42 UTC
**Exécuté par** : Claude Code via Supabase MCP `execute_sql` (projet `vzzbjxmfkmvqkaqxalhr`)
**Script source** : `scripts/test-rls-cross-cohort.sql` (adapté procéduralement — voir Notes §exécution)
**RLS policies auditées** : `database/rls.sql`

## UUIDs utilisés

| Acteur | user_id (auth.uid) | player.id |
|---|---|---|
| P01 (Adil Tadarti, tadarti2004@gmail.com) | `8d5fa915-eee6-4a56-9647-ae4c70a92fc7` | `51fe7e90-1e05-4ac2-9dc2-0dab699ac181` (slug `p01`) |
| P02 (Houenha Ange-Herson, 2hangeevaeme@gmail.com) | `9c0b65e2-1e3a-4e56-8840-73311d5a8807` | `4fab6132-0642-47d8-8685-05bdfee52417` (slug `p02`) |
| M01 (mentor1.agreentech@smoke.entrepreneurgame.local) | `8676f6c5-e94d-41f6-b080-1bb43c0c11d8` | — (app_role=`mentor`) |

**Cohortes en base** : 2 (cross-cohort test pleinement applicable).

## Mécanisme d'authentification simulée

Chaque scénario applique :
```sql
set local role authenticated;
select set_config('request.jwt.claim.sub', '<uuid>', true);
select set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true);
```

Cela force le rôle Postgres à `authenticated` (sortie de service_role bypass) et alimente `auth.uid()` qui résout via `current_setting('request.jwt.claim.sub')`. Vérifié dans S1 : `auth.uid()` retourne bien `8d5fa915-eee6-4a56-9647-ae4c70a92fc7` (P01).

## Résultats

| # | Scénario | Rows attendues | Rows observées | PASS/FAIL |
|---|----------|----------------|----------------|-----------|
| 1 | P01 → submissions de P02 | 0 (RLS `is_my_player`) | **0** | ✅ **PASS** |
| 2 | P01 → evaluations de P02 (join submissions) | 0 (RLS `is_my_player` via join) | **0** | ✅ **PASS** |
| 3 | P01 → players visibles vs ses memberships | visible = my_member_count | **visible=1, my_member=1** (sur 2 cohortes en base) | ✅ **PASS** |
| 4 | M01 → toutes submissions (visibilité Mentor légitime) | > 0 (`is_mentor()` = true) | **40 submissions, is_mentor()=true** | ✅ **PASS** |
| 5 | anon → submissions | erreur `permission denied` OR 0 rows | **`42501: permission denied for schema public`** | ✅ **PASS** |

## Verdict global

✅ **ALL PASS (5/5).** RLS pilot-grade fonctionne correctement :
- Aucune fuite cross-cohort active (S3 cross-cohort scope correct malgré 2 cohortes en base).
- Aucune fuite cross-Player (S1+S2 P01 invisible vers P02).
- Visibilité Mentor légitime préservée (S4).
- anon strictement bloqué au niveau schéma (S5 — revoke `usage on schema public from anon` en place).

**Aucune escalade D-16.** Pas de go/no-go pilote sur ce front. Ready for AgreenTech 13-14/05/2026.

## Findings annexes / Documentation à jour

### CONCERNS.md obsolète (constat, non-bloquant)

`.planning/codebase/CONCERNS.md` §"Pilot-grade RLS — known weak policies" référence :
- **`members_same_project_or_staff_select`** : N'EXISTE PAS dans `database/rls.sql` actuel. Le schéma utilise `player_members_self_or_mentor_select` (ligne 147) avec un modèle différent basé sur `player_members.user_id = auth.uid()` — pas un self-join bug.
- **`bootcamp_deliverables_all_authenticated_select`** : N'EXISTE PAS. Le schéma utilise `deliverable_templates_authenticated_select` (ligne 91) avec `using (true)` — tous les authenticated voient le catalogue de templates. **Par design** (catalogue partagé du Hack-Days), pas un leak.

CONCERNS.md référence un schéma "projects" antérieur (avant le refactor v0.1 → renaming projects → players). **À mettre à jour post-pilote v0.3** (defer SEED-002).

### Notes architecturales

- **`cohorts_authenticated_select using (true)`** (`database/rls.sql:96-97`) : tous les authenticated voient toutes les cohortes (count + slugs). Par design pour le picker EIC ; pas un leak (les players des autres cohortes restent filtrés via S3 PASS).
- **Bypass `service_role`** (`database/rls.sql:279-285`) : grant explicit `select/insert/update/delete on all tables to service_role`. Code-side, à vérifier que les server actions Player utilisent BIEN `createClient()` SSR (cookie-aware = `authenticated` role) et NON `service_role`. Vérification code-side hors scope Phase 15 — defer SEED-002 v0.3.

## Notes §exécution

- Le script source `scripts/test-rls-cross-cohort.sql` est conçu pour exécution manuelle Cloud Studio. L'exécution via MCP a nécessité de remplacer les variables psql `:'xxx'` par des UUIDs littéraux dans chaque transaction.
- `NOTICE` messages (raise notice) ne reviennent pas via l'API REST MCP. Verdicts capturés via SELECT direct dans la transaction (avant rollback).
- S5 a nécessité une approche directe (laisser l'erreur `42501` remonter à MCP) car même les inserts dans temp tables sont bloqués pour le rôle `anon`.

## Cross-références

- `database/rls.sql` (toutes policies + helpers `is_mentor`, `is_my_player`, `current_app_role`)
- `database/schema.sql` (tables `players`, `player_members`, `submissions`, `evaluations`, `cohorts`)
- `.planning/codebase/CONCERNS.md` §"Pilot-grade RLS" (à mettre à jour v0.3 — terminologie obsolète)
- Cohorte AgreenTech : `cohorte-agreentech-creds.csv` (gitignored)
