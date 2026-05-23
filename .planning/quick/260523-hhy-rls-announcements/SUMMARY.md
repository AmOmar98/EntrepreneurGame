# SUMMARY — 260523-hhy-rls-announcements

**Date** : 2026-05-23
**Objectif** : Fixer la catégorie C du post-mortem Digi-Hackathon — éliminer le faux positif `permission denied for table announcements` en logs Postgres pendant les events.
**Scope final** : Policy `announcements_anon_select` + 2 GRANTs minimaux (USAGE schema, SELECT announcements). Le scope GRANT a été élargi par décision Omar suite à la Step 3b finding.

## Livrable

### PROD (project_id `vzzbjxmfkmvqkaqxalhr`)

3 instructions appliquées via `mcp__plugin_supabase_supabase__execute_sql` :

1. `CREATE POLICY "announcements_anon_select" ON public.announcements FOR SELECT TO anon USING (true);`
2. `GRANT USAGE ON SCHEMA public TO anon;`
3. `GRANT SELECT ON public.announcements TO anon;`

### Codebase

- `.planning/quick/260523-hhy-rls-announcements/NEW.sql` (nouveau, provenance des 3 instructions ci-dessus, justification Step 3b inline)
- `database/rls.sql` (mirror — bloc policy AVANT `-- Final grants`, bloc grants APRÈS `revoke all on schema public from anon`)

### Commit

- `e4416ee` — `quick(rls-announcements): allow anon SELECT on announcements`. 2 files changed, 42 insertions(+).

## Verifications

### Step 3 — pg_policies (pré → post)

| | Avant | Après |
|---|---|---|
| Total policies sur `announcements` | 4 | **5** |
| Roles `{anon}` | 0 | **1** (`announcements_anon_select`) |

### Step 3b — Grants pré → post

| Check | Avant | Après |
|---|---|---|
| `has_table_privilege('anon', 'announcements', 'SELECT')` | **false** | **true** |
| `has_schema_privilege('anon', 'public', 'USAGE')` | **false** | **true** |
| `anon_table_grants_total` (public schema) | 0 | **1** |
| Tables grantées à anon | aucune | `announcements` seulement |

Surface anon **strictement bornée** : USAGE schema + SELECT sur 1 table (announcements). Aucune autre table publique n'a de policy `anon` → aucune autre table n'est devenue lisible par anon.

### Atomicité commit

- `git log -1 --stat e4416ee` : 2 fichiers, 42 insertions, 0 deletions.
- Working tree pré-existant (.planning/pilot-alerts/J*-*-tick.md, EIC-MANAGER-*.md deleted, etc.) inchangé.

## Findings

### Step 3b — scope expansion required

Le planner a anticipé la trap `rls.sql:266 revoke all on schema public from anon`. Confirmé empiriquement : la policy seule était inerte (anon n'avait ni schema USAGE ni table SELECT). Omar a autorisé l'ajout des 2 GRANTs minimaux. Le post-mortem section C n'avait pas pré-autorisé cette extension de scope, mais l'esprit du fix est respecté (broadcast public content sans PII).

### Bruit logs adjacent (hors scope)

Les 3 erreurs mgmt-api restantes (`deliverable_slug`, `created_at`, `template_id`) sont la cible du fix B (à venir, nécessite ton clavier sur Supabase Studio).

## Suite

- Étape 8 orchestrator : commit séparé des artefacts planning (PLAN/BASELINE/SUMMARY/deferred-items + STATE.md).
- Smoke à valider au prochain event live (cf. `deferred-items.md`) — en OFF-PILOT, pas de trafic anon pour générer une nouvelle erreur permission denied.
- Cohérence post-mortem : 2 sur 4 catégories closes (A + C). Restent B (schema drift mgmt-api), D (advisors triple migration).
