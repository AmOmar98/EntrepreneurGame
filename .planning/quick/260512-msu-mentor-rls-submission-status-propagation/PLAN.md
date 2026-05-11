# PLAN — Quick 260512-msu

## Bug P0 pre-pilote AgreenTech 13-14/05

**Découvert** : 2026-05-12 pendant smoke manuel des 6 statuts deliverable score block sur dev local + Supabase PROD (cf. memo `polish-deliverable-score-pending-smoke`).

**Reproduction** :
1. P05 (player) soumet livrable L1 personae-v1 → `submissions.status = 'submitted_v1'` ✓
2. M01 (mentor) ouvre `/mentor/submission/<id>` → remplit rubric (5×3 puis 1×2 = 14/25) + feedback + verdict `request_v2` + expectedAction → submit
3. Action serveur `app/actions.ts:501-528` :
   - `evaluations` INSERT → ✓ ligne créée avec verdict=request_v2, total_score=14
   - `submissions UPDATE { status: 'feedback_received' }` → **0 rows affectées** (silent par RLS)
4. Player rechage `/journey/deliverable/<id>` → toujours SubmissionTicket "SOUMISSION V1", PAS de feedback panel → Player **NE PEUT JAMAIS** resoumettre v2.

## Root cause

`database/rls.sql:179-188` — policy `submissions_member_self_update` :

```sql
create policy "submissions_member_self_update" on public.submissions
  for update to authenticated
  using ((is_my_player(player_id) and submitted_by = auth.uid()) or is_game_master())
  with check (...même...);
```

`is_my_player(player_id)` exige que le user soit dans `player_members.user_id`. **Le mentor n'est PAS membre d'équipe → policy bloque l'UPDATE.** Supabase ne lève pas d'erreur sur 0-rows-update RLS → `updErr` reste `null` dans l'action serveur → Player ne sait jamais que rien n'a bougé.

`is_mentor()` n'est PAS dans la policy. Bug présent depuis `f53de0d feat(01-01): fresh schema + triggers + RLS aligned on brief primitives`.

## Impact pilote

Sans fix :
- Mentor `Demander V2` → Player figé sur submitted_v1 → cycle V2 impossible
- Mentor `Valider V1` → submission jamais `validated` → `recalc_player_score` (filtre `s.status='validated'`) reste à 0 → score projet pilote = 0 partout → cérémonie résultats vide
- Mentor `Rejeter` → submission jamais `rejected` → on ne sait pas distinguer rejected/in-progress

**Pilote AgreenTech non fonctionnel.**

## Fix

**Approche choisie : trigger SECURITY DEFINER (pas widening RLS).**

Étendre `on_evaluation_change` (déjà SECURITY DEFINER) pour propager `verdict → submissions.status` post-INSERT/UPDATE. Le trigger contourne RLS proprement.

**Rationale vs widening RLS** :
- Widening RLS = mentor peut UPDATE n'importe quelle colonne (proof_url, version, …) → faille
- Trigger SECURITY DEFINER = mentor ne touche jamais `submissions` directement ; le mapping verdict→status est canonique dans la DB

## Tasks

1. **Migration** : update `on_evaluation_change` pour propager verdict→status (via `apply_migration` Supabase MCP).
2. **Backfill** : 1 ligne `submissions` existante (P05 personae-v1 test) → status feedback_received (sera cleanup juste après).
3. **Source of truth** : mettre à jour `database/triggers.sql` (la fonction CREATE OR REPLACE) pour que `schema.sql + triggers.sql + rls.sql` reste l'apply-order canonique.
4. **Tests SQL RLS** : 4 scenarios documentés dans `tests/rls-mentor-status-update.sql` (mentor OK, player OK, GM OK, autre player BLOCK).
5. **Cleanup test data P05** : delete submission + eval + reset onboarded_at, idea, current_level.
6. **Commit hotfix sur main** (protocole pilote) — pas de Vercel redeploy car SQL-only.
7. **Stop dev server**.

## Out of scope

- Smoke des 6 statuts deliverable score block : REPORTÉ post-pilote (cf. memo). Le bug RLS bloquait le smoke ; après fix le smoke pourrait se reprendre, mais l'utilisateur a explicitement demandé "fix complet sans smoke".
- Refactor `app/actions.ts:525-528` (UPDATE devenu redondant pour mentor mais reste utile pour GM dans le cas `reviewSubmissionFlow`) : on laisse intact, le trigger devient autoritaire, le UPDATE direct devient un no-op pour mentor (RLS bloque) mais OK pour GM (policy l'autorise).
