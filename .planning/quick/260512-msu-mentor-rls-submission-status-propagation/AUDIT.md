# AUDIT — Quick 260512-msu

## Découverte du bug

Pendant le smoke manuel du polish `c1eca29 + 2864bd5` (deliverable score block UI), au statut 3 (`feedback_received`) :

1. Player P05 submit livrable L1 personae-v1 → `submissions.status = 'submitted_v1'` ✓
2. Mentor M01 évalue rubric (5×3,2 = 14/25) + feedback + verdict `request_v2` + expected_action via UI `/mentor/submission/<id>` → bouton "Enregistrer l'évaluation"
3. **Action serveur** `app/actions.ts:reviewSubmissionFlow` :
   - `evaluations` INSERT → ligne créée ✓ (vérifié SQL)
   - `submissions UPDATE { status: 'feedback_received' }` → **silencieusement 0 rows** (Supabase non-erreur)
4. **Player rechage** `/journey/deliverable/<id>` → toujours SubmissionTicket "SOUMISSION V1", pas de RevisionPanel

## Diagnostic root cause (en 2 niveaux)

### Niveau 1 — RLS policy mentor pas autorisé à UPDATE

`database/rls.sql:179-188` :

```sql
create policy "submissions_member_self_update" on public.submissions
  for update to authenticated
  using (
    (public.is_my_player(player_id) and submitted_by = auth.uid())
    or public.is_game_master()
  )
  with check (...même...);
```

`is_my_player(player_id)` exige que le caller soit dans `player_members`. Mentor M01 ne l'est pas. **Aucune policy n'autorise mentor à UPDATE submissions.**

Vérifié en simulation :
```sql
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"<M01 uuid>","role":"authenticated"}';
update public.submissions set status='feedback_received'
  where id='<P05 submission>' returning id, status;
-- Retour: 0 rows
```

### Niveau 2 — Bug PL/pgSQL `row IS NOT NULL` mal compris

Le trigger v1 ajouté pendant l'investigation ne propageait toujours pas. Logging dans table debug a montré l'`ENTRY` log mais pas le `MAP` log → le bloc `IF (tg_op IN ('INSERT','UPDATE')) AND new IS NOT NULL` ne s'entrait pas.

**Cause** : SQL standard `row IS NOT NULL` retourne TRUE uniquement si **TOUS** les champs sont non-null. `evaluations.expected_action` est NULLABLE et NULL pour 3 verdicts sur 4 (`validate_v1`/`validate_v2`/`reject`) → `new IS NOT NULL` = FALSE → branche skipped silencieusement.

**Fix** : retirer `AND new IS NOT NULL` (TG_OP est suffisant pour distinguer INSERT/UPDATE de DELETE).

### Niveau 1.5 — Bug PL/pgSQL simple CASE sur enum cross-type

Tentative v1 utilisait `CASE new.verdict WHEN 'validate_v1' THEN 'validated'::submission_status...`. PostgreSQL résout le type des WHEN literals en fonction de la cible d'assignation (`v_next_status submission_status`) → tente de caster `'validate_v1'` en `submission_status` enum → ERROR `"invalid input value for enum submission_status: validate_v1"`. Log Postgres confirmé.

**Fix** : utiliser IF/ELSIF avec cast explicite `new.verdict::text`.

## Fix appliqué (v5 final, PROD-vérifié)

`apply_migration` Supabase MCP sur projet `vzzbjxmfkmvqkaqxalhr` (EntrepreneurGame PROD) :

```sql
create or replace function public.on_evaluation_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_submission_id uuid;
  v_verdict text;
  v_next_status submission_status;
begin
  v_submission_id := coalesce(new.submission_id, old.submission_id);
  select s.player_id into v_player_id from public.submissions s where s.id = v_submission_id;
  if tg_op in ('INSERT', 'UPDATE') then
    v_verdict := new.verdict::text;
    if v_verdict = 'validate_v1' or v_verdict = 'validate_v2' then v_next_status := 'validated'::submission_status;
    elsif v_verdict = 'request_v2' then v_next_status := 'feedback_received'::submission_status;
    elsif v_verdict = 'reject' then v_next_status := 'rejected'::submission_status;
    else v_next_status := null; end if;
    if v_next_status is not null then
      update public.submissions set status = v_next_status
       where id = v_submission_id and status is distinct from v_next_status;
    end if;
  end if;
  if v_player_id is not null then perform public.recalc_player_score(v_player_id); end if;
  return coalesce(new, old);
end; $$;
```

Plus backfill 2× pour rattraper les évaluations pré-fix.

## Vérification (4/4 verdicts OK)

Test SQL end-to-end sur PROD via `mcp__plugin_supabase_supabase__execute_sql` :

| Verdict       | Status before  | Status after     | Expected         | PASS |
|---------------|----------------|------------------|------------------|------|
| validate_v1   | submitted_v1   | validated        | validated        | ✓    |
| request_v2    | submitted_v1   | feedback_received| feedback_received| ✓    |
| validate_v2   | submitted_v2   | validated        | validated        | ✓    |
| reject        | submitted_v1   | rejected         | rejected         | ✓    |

Test RLS contract (mentor cannot UPDATE directly) : 0 rows ✓ (sécurité préservée — seul le trigger SECURITY DEFINER bypasse RLS).

## Impact pilote 13-14/05

**Sans fix** :
- Mentor `Valider V1` → submission jamais `validated` → `recalc_player_score` (filtre `s.status='validated'`) reste à 0 → leaderboard / résultats vides
- Mentor `Demander V2` → Player jamais en `feedback_received` → cycle V2 impossible
- Mentor `Rejeter` → submission jamais `rejected` → traçabilité cassée

**Avec fix** :
- Tout le workflow mentor évaluation → propagation atomique status + recalc score
- Aucun code applicatif à changer (le UPDATE dans `app/actions.ts:525-528` reste no-op pour mentor — c'est cohérent avec la sémantique trigger-canonical)
