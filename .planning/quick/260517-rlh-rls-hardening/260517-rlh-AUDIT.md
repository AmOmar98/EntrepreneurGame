---
quick_id: 260517-rlh
artifact: AUDIT
date: 2026-05-17
scope: audit-only (no rls.sql edit; advisor spawn reserved for follow-up)
sources:
  - database/rls.sql @ HEAD (worktree-260517-deferred-skeletons)
  - database/schema.sql (table definitions)
  - database/bonus_events.sql (extra table + 4 policies)
  - database/moscow_cards.sql (extra table + 4 policies)
  - database/migrations/08-mentor-comments.sql (evaluation_comments + 3 policies)
  - database/migrations/09-gamemaster-live.sql (announcements + 4 policies)
  - database/migrations/10-pitch-order.sql (events column add only — no new policy)
  - database/migrations/202605111923_fix_evaluation_comments_grants.sql (F-16-01 fix)
  - database/migrations/202605121200_rls_initplan_fix.sql
  - database/migrations/202605121201_multiple_permissive_fix.sql
git_log_rls_sql:
  - 7bcf666 fix(db): restore service_role grants on public schema (Finding 1 root cause)
  - f53de0d feat(01-01): fresh schema + triggers + RLS aligned on brief primitives
  - 7f18b69 chore: baseline source snapshot before phase 01 execution
---

# AUDIT — quick-260517-rlh — RLS policies inventory + gap analysis

## 0. Scope notes

- **Audit-only.** No SQL was executed. No file under `database/` was edited.
- **Only 3 application roles** exist in DB (`app_role` enum: `player`,
  `mentor`, `game_master`). PLAN's mention of 5 roles
  (founder/mentor/reviewer/committee_member/eic_admin) reflects the legacy
  Phase 0–3 type system (`AppRole` in `lib/types.ts`) — the v0.2 DB schema
  collapsed them. Audit treats `player = founder`, `mentor =
  mentor+reviewer+committee_member`, `game_master = eic_admin`.
- Helpers used in policies: `current_app_role()`, `is_mentor()` (mentor OR
  game_master), `is_game_master()`, `is_my_player(p_player_id uuid)`. All
  `security definer`, `stable`, `search_path = public`.
- Tables sourced from `rls.sql`, `bonus_events.sql`, `moscow_cards.sql`,
  and migrations `08`, `09`, `10`.

## 1. Policy inventory (per table)

### 1.1 Reference / catalog tables (`events`, `levels`, `missions`, `deliverable_templates`, `cohorts`)

All 5 share an identical pattern:

| Policy                                 | Cmd    | USING                  | WITH CHECK              | Role gate |
| -------------------------------------- | ------ | ---------------------- | ----------------------- | --------- |
| `<table>_authenticated_select`         | SELECT | `true`                 | —                       | any auth  |
| `<table>_gm_all`                       | ALL    | `is_game_master()`     | `is_game_master()`      | GM only   |

Read: **any authenticated user** (Player included) sees every row.
Write: **GM-only**.

### 1.2 `profiles`

| Policy                              | Cmd    | USING                                    | WITH CHECK                               |
| ----------------------------------- | ------ | ---------------------------------------- | ---------------------------------------- |
| `profiles_self_or_mentor_select`    | SELECT | `user_id = auth.uid() or is_mentor()`    | —                                        |
| `profiles_self_or_gm_insert`        | INSERT | —                                        | `user_id = auth.uid() or is_game_master()` |
| `profiles_self_or_gm_update`        | UPDATE | `user_id = auth.uid() or is_game_master()` | same                                     |
| `profiles_gm_delete`                | DELETE | `is_game_master()`                       | —                                        |

### 1.3 `players`

| Policy                              | Cmd    | USING                                    | WITH CHECK                               |
| ----------------------------------- | ------ | ---------------------------------------- | ---------------------------------------- |
| `players_member_or_mentor_select`   | SELECT | `is_my_player(id) or is_mentor()`        | —                                        |
| `players_member_or_gm_update`       | UPDATE | `is_my_player(id) or is_game_master()`   | same                                     |
| `players_gm_insert`                 | INSERT | —                                        | `is_game_master()`                       |
| `players_gm_delete`                 | DELETE | `is_game_master()`                       | —                                        |

### 1.4 `player_members`

| Policy                                       | Cmd    | USING                                       | WITH CHECK              |
| -------------------------------------------- | ------ | ------------------------------------------- | ----------------------- |
| `player_members_self_or_mentor_select`       | SELECT | `user_id = auth.uid() or is_mentor()`       | —                       |
| `player_members_gm_insert`                   | INSERT | —                                           | `is_game_master()`      |
| `player_members_gm_update`                   | UPDATE | `is_game_master()`                          | `is_game_master()`      |
| `player_members_gm_delete`                   | DELETE | `is_game_master()`                          | —                       |

### 1.5 `submissions`

| Policy                                | Cmd    | USING / WITH CHECK                                                                   |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| `submissions_member_or_mentor_select` | SELECT | `is_my_player(player_id) or is_mentor()`                                             |
| `submissions_member_self_insert`      | INSERT | WITH CHECK `(is_my_player(player_id) AND submitted_by = auth.uid()) or is_game_master()` |
| `submissions_member_self_update`      | UPDATE | both = same as insert                                                                |
| `submissions_gm_delete`               | DELETE | `is_game_master()`                                                                   |

### 1.6 `evaluations`

| Policy                                  | Cmd    | USING / WITH CHECK                                                                                                 |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| `evaluations_member_or_mentor_select`   | SELECT | `is_mentor() OR exists(submissions s WHERE s.id = submission_id AND is_my_player(s.player_id))`                    |
| `evaluations_mentor_self_insert`        | INSERT | WITH CHECK `(is_mentor() AND evaluator_id = auth.uid()) or is_game_master()`                                       |
| `evaluations_mentor_self_update`        | UPDATE | both = same as insert                                                                                              |
| `evaluations_gm_delete`                 | DELETE | `is_game_master()`                                                                                                 |

### 1.7 `pitch_scores`

| Policy                                   | Cmd    | USING / WITH CHECK                                                                |
| ---------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `pitch_scores_member_or_mentor_select`   | SELECT | `is_my_player(player_id) or is_mentor()`                                          |
| `pitch_scores_mentor_self_insert`        | INSERT | WITH CHECK `(is_mentor() AND juror_id = auth.uid()) or is_game_master()`          |
| `pitch_scores_mentor_self_update`        | UPDATE | both = same as insert                                                             |
| `pitch_scores_gm_delete`                 | DELETE | `is_game_master()`                                                                |

### 1.8 `bonus_events` (from `database/bonus_events.sql`)

| Policy                            | Cmd    | USING / WITH CHECK                                                                                                                   |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `bonus_events_select`             | SELECT | `is_my_player(project_id) or is_mentor()`                                                                                            |
| `bonus_events_player_insert`      | INSERT | `(is_my_player(project_id) AND claimed_by = auth.uid() AND status='submitted' AND reviewed_by IS NULL AND reviewed_at IS NULL) or is_game_master()` |
| `bonus_events_mentor_update`      | UPDATE | both = `is_mentor() or is_game_master()`                                                                                             |
| `bonus_events_gm_delete`          | DELETE | `is_game_master()`                                                                                                                   |

### 1.9 `evaluation_comments` (from `migrations/08-mentor-comments.sql`)

| Policy                                          | Cmd    | USING / WITH CHECK                                                                                                                                                                     |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `evaluation_comments_member_or_mentor_select`   | SELECT | `is_mentor() OR exists(submissions s WHERE s.id = submission_id AND is_my_player(s.player_id))`                                                                                        |
| `evaluation_comments_mentor_self_insert`        | INSERT | `(is_mentor() AND author_user_id = auth.uid()) OR exists(submissions s WHERE s.id = submission_id AND is_my_player(s.player_id) AND author_user_id = auth.uid())`                      |
| `evaluation_comments_gm_delete`                 | DELETE | `is_game_master()`                                                                                                                                                                     |

NOTE: **No UPDATE policy** — append-only ledger by design (correct).

### 1.10 `announcements` (from `migrations/09-gamemaster-live.sql`)

| Policy                              | Cmd    | USING / WITH CHECK                                                                                                                                                                         |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `announcements_audience_select`     | SELECT | `is_game_master() OR (is_mentor() AND target_kind IN ('all','mentors')) OR target_kind='all' OR (target_kind='level' AND <player.current_level matches>) OR (target_kind='teams' AND <member>)` |
| `announcements_gm_insert`           | INSERT | WITH CHECK `is_game_master() AND (created_by_user_id IS NULL OR created_by_user_id = auth.uid())`                                                                                          |
| `announcements_gm_update`           | UPDATE | both = `is_game_master()`                                                                                                                                                                  |
| `announcements_gm_delete`           | DELETE | `is_game_master()`                                                                                                                                                                         |

### 1.11 `moscow_cards` (from `database/moscow_cards.sql`)

| Policy                            | Cmd    | USING / WITH CHECK                                                                              |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `moscow_cards_select`             | SELECT | `is_my_player(project_id) or is_mentor()`                                                       |
| `moscow_cards_player_insert`      | INSERT | WITH CHECK `(is_my_player(project_id) AND created_by = auth.uid()) or is_game_master()`         |
| `moscow_cards_player_update`      | UPDATE | both = `is_my_player(project_id) or is_game_master()`                                           |
| `moscow_cards_player_delete`      | DELETE | `is_my_player(project_id) or is_game_master()`                                                  |

## 2. Schema-level grants (rls.sql lines 263-285)

```sql
revoke all on schema public from anon;                                       -- anon hard-blocked at schema level
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- service_role: bypasses RLS (full grants, restored after schema reset).
grant ... to service_role;
alter default privileges in schema public grant ... to service_role;
```

Post-F-16-01 hardening (migration `202605111923`) also adds:

```sql
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
```

→ Future tables auto-inherit `authenticated` grants. **Good.**

## 3. Gap analysis

Findings classified by severity at end of file. Numbered `G-NN`.

### G-01 — Reference catalog leaks pre-event content to Players (LOW / WARN)

`events`, `missions`, `deliverable_templates`, `cohorts`: SELECT = `true`
for any `authenticated`. A Player can SELECT **future events / future
mission titles / deliverable rubrics for all cohorts**. Multi-event readiness
(`events.id` cardinality > 1, per S3) means Player A can enumerate Cohort B's
roadmap.

Risk pre-pilot: low (single cohort AgreenTech). Risk post-pilot when
multi-event lands: medium — enumeration leak.

Mitigation idea (defer to advisor): scope SELECT by
`exists(player_members pm join cohorts c using event_id where pm.user_id = auth.uid())`.

### G-02 — `events.pitch_order_json` exposed before `pitch_order_published_at` (MEDIUM / WARN, R1-adjacent)

Migration `10-pitch-order.sql` added two columns but **no
column-level masking**. The R1 docstring in that migration
(`pitch_order_published_at` gates Player visibility) is enforced only by
application code, not RLS. A Player can SELECT `events` row and read
`pitch_order_json` directly via the Supabase JS client even when
`pitch_order_published_at IS NULL`, leaking the GameMaster's draft slot
assignment + anchor positioning.

This is the closest thing to an **R1 leak via RLS** found in the audit.

Mitigation idea (defer to advisor): split into a view
`public.events_public` that returns `pitch_order_json` only when
`pitch_order_published_at IS NOT NULL`, or use a column-level `revoke select
(pitch_order_json) on public.events from authenticated` + a GM-only view.

### G-03 — `pitch_scores` SELECT permissive to all team members (MEDIUM / WARN, R1)

`pitch_scores_member_or_mentor_select` allows `is_my_player(player_id)`.
A Player can SELECT **their own team's pitch scores** as soon as a juror
writes them, before `events.results_published_at` is set. Per CLAUDE.md
R1 (revised 2026-05-11): "score visible Player UNIQUEMENT sur le détail
livrable" — pitch scores are NOT deliverable scores, and the
`results_published_at` event-level gate is the canonical reveal moment.

Mitigation idea (defer to advisor): tighten USING to
`is_mentor() or (is_my_player(player_id) AND exists(select 1 from events e
where e.id = event_id AND e.results_published_at IS NOT NULL))`.
**This is the highest-impact R1 finding.**

### G-04 — `evaluations` SELECT does not gate on `verdict` reveal (LOW / WARN)

Player sees their own evaluation rows as soon as a mentor inserts them.
That matches the Player-side deliverable detail page (R1-compliant) — OK
for the design. But the policy also exposes the **rubric scores jsonb**
and `total_score` of evaluations created by mentors during a "draft" /
"pending v2" workflow, since there is no `published_at` analog on
evaluations. Low risk because v0.2 design assumes mentor evaluation is
final once inserted.

Mitigation idea (defer to advisor): document the assumption as a comment
or add `evaluations.published_at` if mentor draft workflow is on the v0.3
roadmap.

### G-05 — `is_mentor()` collapses mentor + game_master roles (LOW / informational)

Helper definition (line 38): `current_app_role() in ('mentor', 'game_master')`.
Every policy that says "mentor read-all" therefore also grants GM read-all.
Intentional and consistent, but means there is **no policy distinguishing
"juror-only" from "mentor-only" reads**. If a future jury-specific table
(e.g., scoring drafts) lands, the helper will need a sibling `is_juror()`.

### G-06 — `bonus_events_mentor_update` allows any mentor to overwrite any other mentor's review (MEDIUM / WARN)

USING `is_mentor() or is_game_master()` with no `reviewed_by = auth.uid()`
constraint. Mentor A can update a bonus_event already reviewed by Mentor B,
silently overwriting `reviewed_by`. Mentor count is 2 in the pilot, so blast
radius is small — but contract is loose.

Mitigation: tighten WITH CHECK to also assert `reviewed_by IS NULL OR
reviewed_by = auth.uid() OR is_game_master()`.

### G-07 — `announcements_audience_select` regex on `target_ids` text array is unindexed (PERF / LOW)

USING clause runs `current_level::text = any (target_ids)` and a join on
`player_members` per row. With current scale (≤ 20 announcements) this is
fine. Document for v0.3.

### G-08 — No `app_role` change protection on `profiles_self_or_gm_update` (HIGH / BLOCK candidate)

WITH CHECK `user_id = auth.uid() or is_game_master()`. A Player can `UPDATE
profiles SET app_role = 'game_master' WHERE user_id = auth.uid()` because
the policy gates on **row ownership**, not on which columns changed. This
is a **privilege escalation primitive**: any Player who hits the DB
directly via the anon-key + their JWT can self-promote to game_master.

Mitigation (URGENT — advisor MUST review before pilot day 2 if this is
exploitable from client): add a column-level UPDATE gate OR a trigger
preventing `app_role` modification unless `current_app_role() =
'game_master'`. Likely cheapest: a `before update` trigger raising
exception when `NEW.app_role IS DISTINCT FROM OLD.app_role AND NOT
is_game_master()`.

Caveat: needs verification — depending on the Supabase setup, the
client may not be able to issue arbitrary UPDATEs to `profiles` outside
server actions. The audit can't confirm from static SQL alone whether the
anon-key + JWT flow exposes this. **Flag for advisor.**

### G-09 — `player_members_self_or_mentor_select` exposes ALL members of ALL teams to mentors (LOW / WARN)

A mentor sees the full membership of every team (intended). But a Player
sees ONLY their own row, not teammates' user_ids — which may BREAK the
Player UI if it tries to display team-mate names. Confirm vs.
`app/journey/` rendering.

Mitigation idea: widen Player visibility to teammates only:
`exists(select 1 from player_members me where me.user_id = auth.uid() and
me.player_id = player_members.player_id)`.

### G-10 — No `anon`-targeted SELECT denial test (LOW / docs)

`revoke all on schema public from anon` is the only barrier. No
explicit `revoke select on all tables in schema public from anon`. In
practice, `revoke usage on schema` should be sufficient (anon can't
even resolve the table), but RLS test harness should assert this to
catch a future accidental `grant usage to anon` regression.

## 4. R1 cardinal cross-check matrix

| Surface                           | R1 expected            | RLS enforces?              | Verdict |
| --------------------------------- | ---------------------- | -------------------------- | ------- |
| `evaluations` cross-team SELECT   | Player sees own only   | YES (via `is_my_player`)   | OK      |
| `pitch_scores` cross-team SELECT  | Player sees own only   | YES                        | OK      |
| `pitch_scores` own-team pre-reveal | Hidden until publish   | **NO** (G-03)              | WARN    |
| `events.pitch_order_json` pre-publish | Hidden until publish | **NO** (G-02)              | WARN    |
| `evaluations.scores` draft mentor | Hidden until finalize  | NO (G-04)                  | INFO    |
| `profiles.app_role` self-edit     | Player cannot promote  | **NO** (G-08)              | BLOCK?  |

## 5. Findings summary by severity

| Severity      | Count | IDs                                              |
| ------------- | ----- | ------------------------------------------------ |
| BLOCK         | 1     | G-08 (priv-esc via profiles.app_role)            |
| WARN          | 5     | G-02, G-03, G-06, G-09, G-04                     |
| LOW / INFO    | 4     | G-01, G-05, G-07, G-10                           |
| PASS (no gap) | —     | core team isolation via `is_my_player` is sound  |

**Cross-table totals (15 tables audited):**

| Table                  | Policies | SELECT | INSERT | UPDATE | DELETE | Gaps |
| ---------------------- | -------- | ------ | ------ | ------ | ------ | ---- |
| events                 | 2        | ✓      | (gm)   | (gm)   | (gm)   | G-02 |
| levels                 | 2        | ✓      | (gm)   | (gm)   | (gm)   | —    |
| missions               | 2        | ✓      | (gm)   | (gm)   | (gm)   | G-01 |
| deliverable_templates  | 2        | ✓      | (gm)   | (gm)   | (gm)   | G-01 |
| cohorts                | 2        | ✓      | (gm)   | (gm)   | (gm)   | G-01 |
| profiles               | 4        | ✓      | ✓      | ✓      | ✓      | G-08 |
| players                | 4        | ✓      | ✓      | ✓      | ✓      | —    |
| player_members         | 4        | ✓      | ✓      | ✓      | ✓      | G-09 |
| submissions            | 4        | ✓      | ✓      | ✓      | ✓      | —    |
| evaluations            | 4        | ✓      | ✓      | ✓      | ✓      | G-04 |
| pitch_scores           | 4        | ✓      | ✓      | ✓      | ✓      | G-03 |
| bonus_events           | 4        | ✓      | ✓      | ✓      | ✓      | G-06 |
| evaluation_comments    | 3        | ✓      | ✓      | (n/a)  | ✓      | —    |
| announcements          | 4        | ✓      | ✓      | ✓      | ✓      | G-07 |
| moscow_cards           | 4        | ✓      | ✓      | ✓      | ✓      | —    |

## 6. Notes for follow-up hardening session

1. Spawn `eic-pedagogical-advisor` BEFORE the first `database/rls.sql` edit
   (CLAUDE.md pre-edit guards). Feed this AUDIT.md + ADVISOR-VERDICT.md
   drafts as input.
2. Verify G-08 exploitability against PROD (anon-key + Player JWT, try
   `update profiles set app_role='game_master' where user_id=...`) BEFORE
   pilot day 2 (14/05) if pilot is still active when this work starts.
   If reproducible → escalate to hotfix per CLAUDE.md hotfix protocol.
3. Move `.planning/quick/260517-rlh-rls-hardening/rls-tests-proposed/` →
   `database/rls-tests/` after advisor PASS.
4. One commit per table tightening (per PLAN row "1 commit = 1 table").
5. Re-test pilot data parity (11P + 2M + 3J + 4GM) after each tightening.
