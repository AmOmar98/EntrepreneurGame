---
review_scope: phases 7+8+9 (commits 58345c5..HEAD)
review_date: 2026-05-10
findings_critical: 0
findings_high: 2
status: findings_present
---

# Focused Code Review — v0.2 (Phases 7+8+9)

**Reviewed:** 28 commits, 63 files, ~11k LOC added.
**Scope:** server actions, SQL migrations, refondues pages, data layer, composants client critiques.

Outcome: **2 HIGH findings**, **0 CRITICAL**. The pilot path (login → onboarding → journey → submission → mentor evaluation → jury → results) is functionally and security-wise solid. The two HIGH issues are non-blocking for the 13 mai launch but should be patched before Omar applies the migrations to prod, because one is a silent data bug in `/admin?live=1` and the other is an info-disclosure that a curious Player could exploit through the browser console.

---

## REV-HIGH-01 — Wrong column name in admin live snapshot query

**Severity:** HIGH
**File:** `lib/admin-live.ts:179` (also type at lines 86–91)
**Description:** `getAdminLiveSnapshot()` queries `evaluation_comments` with `.select("id, submission_id, user_id, created_at")`, but the column created by `database/migrations/08-mentor-comments.sql` is named `author_user_id` (no `user_id` column exists on this table). Supabase returns an error; the code falls back to `commentRows ?? []` so the page does not crash — but comments never feed into the game-flow ticker nor into `latestActivityMs`, which means teams that have only commented (no submissions/evals) since the last sub appear permanently `stale` on the radar.
**Impact:** Admin live mode (`/admin?live=1`) silently mis-reports activity. The "messages mentor" entries never appear in `<AdminGameFlow>`; teams in active comment threads can be wrongly flagged stale, which feeds the wrong narrative into Pixel mascot + status banner (GMR-07/08).
**Suggested fix:** Replace `user_id` with `author_user_id` in both the `select()` (line 179) and the `CommentRow` type (line 89). Three lines total. Verify with `npm run typecheck && npm run lint`.

---

## REV-HIGH-02 — Announcements RLS leaks targeted broadcasts to all authenticated users

**Severity:** HIGH (info disclosure)
**File:** `database/migrations/09-gamemaster-live.sql:73-76`
**Description:** The `announcements_authenticated_select` policy is `using (auth.uid() is not null)` — any authenticated user can `SELECT *` from `announcements`, including rows where `target_kind='teams'` and `target_ids=[other_player_id]`. Audience filtering exists only in `lib/announcements.ts:filterAnnouncementsForAudience`, executed inside Next.js. A Player typing 4 lines in the browser console (`supabase.from('announcements').select('*')`) bypasses the filter and reads every GameMaster broadcast — encouragements meant for rival teams, "appel" reminders, etc.
**Impact:** Pilot-grade — the data isn't a hard secret, but it weakens the GameMaster's ability to send team-specific nudges and breaks the surprise factor on `celebration` announcements. Could embarrass on screen if a Player shows a competitor's private message during the Hack-Days.
**Suggested fix:** Tighten the SELECT policy to enforce audience server-side in SQL. Replacement:
```sql
create policy "announcements_audience_select" on public.announcements
  for select to authenticated
  using (
    public.is_game_master()
    or public.is_mentor() and target_kind in ('all','mentors')
    or target_kind = 'all'
    or (target_kind = 'level' and exists (
        select 1 from public.players p
        join public.player_members pm on pm.player_id = p.id
        where pm.user_id = auth.uid() and p.current_level::text = any (target_ids)))
    or (target_kind = 'teams' and exists (
        select 1 from public.player_members pm
        where pm.user_id = auth.uid() and pm.player_id::text = any (target_ids)))
  );
```
Apply alongside or shortly after the migration; then remove the redundant audience filter on the read path (or keep it as defense in depth).

---

## Priorité Basse (non-bloquants, signalés pour plus tard)

- **`app/actions.ts:794`** — `importPlayersCsv` calls `adminClient.auth.admin.listUsers({ page:1, perPage:1000 })` once per email, producing an O(emails) scan of the whole users table. Pilot scale (<60 emails) is fine; cache the page once before the loop for cleanliness.
- **`components/admin-team-focus.tsx:42-46`** — Activity feed for a focused team is matched by `entry.team === focusedTeam.name`; team names are unique in pilot, but if two teams share a name across cohorts (or the GameMaster renames mid-event) the wrong feed appears. Switch to `team_id` once GameFlowEntry carries it.
- **`app/results/page.tsx:97`** — No role redirect for non-staff once `isPublished`; this is intended (results are public to authenticated users post-publication), but worth a comment so future readers don't add a redirect by mistake.
- **`evaluations_expected_action_required_for_request_v2`** CHECK is added `not valid` (migration 08, line 109) — confirmed intentional (legacy rows tolerated). After 13 mai, run `validate constraint` to enforce strictly.

---

_Reviewed: 2026-05-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep (cross-file, server actions + SQL + page wiring)_
