---
quick_id: 260517-rlh
artifact: ADVISOR-VERDICT (DRAFT — pending real eic-pedagogical-advisor spawn)
date: 2026-05-17
status: draft-pre-advisor
advisor_spawn: NOT YET — reserved for follow-up session with Omar present
review_target: AUDIT findings G-01 … G-10
cardinal_focus: R1 (score visibility) — G-02, G-03, G-04, G-08
---

# ADVISOR-VERDICT (DRAFT) — quick-260517-rlh

> **This is a draft prepared by the audit dispatch agent (Opus 4.7) for review
> by `eic-pedagogical-advisor` in the follow-up hardening session. It must
> NOT be treated as a real advisor verdict until the advisor agent has been
> spawned and produced its own output. Per CLAUDE.md pre-edit guards,
> advisor spawn is OBLIGATOIRE before any edit to `database/rls.sql`.**

## Classification draft

| ID    | Title                                                  | Draft verdict | Cardinal | Reason                                                                                                                                            |
| ----- | ------------------------------------------------------ | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-08  | `profiles.app_role` priv-esc via self-update           | **BLOCK**     | (admin)  | If exploitable from client, any Player can self-promote to game_master. Highest-impact gap in the audit. Verify reachability THEN BLOCK or downgrade. |
| G-02  | `events.pitch_order_json` exposed pre-publish          | **BLOCK**     | R1       | Migration `10-pitch-order.sql` docstring explicitly says column gates Player visibility — current RLS does NOT enforce. Direct R1 contract breach. |
| G-03  | `pitch_scores` own-team visible pre-`results_published_at` | **WARN**  | R1       | R1 says "score visible Player UNIQUEMENT sur détail livrable" — pitch scores are NOT deliverable scores. Should gate on `results_published_at`.    |
| G-06  | `bonus_events` mentor cross-overwrite                  | **WARN**      | (data)   | Loose contract; 2-mentor pilot keeps blast radius small but contract should tighten before scale.                                                  |
| G-04  | `evaluations` no draft/finalize state                  | **WARN**      | R1-adj   | Currently OK by design (mentor insert = final). Document assumption; revisit if v0.3 adds mentor draft workflow.                                  |
| G-09  | `player_members` Player doesn't see teammates          | **WARN**      | (UX)     | May silently break team-mate display. Confirm vs `app/journey/` rendering before tightening.                                                       |
| G-01  | Reference tables enumerate cross-cohort                | **WARN**      | (scope)  | Low impact in single-cohort pilot. Mandatory tighten before multi-event GA.                                                                       |
| G-05  | `is_mentor()` collapses mentor + GM                    | **PASS**      | —        | Intentional and consistent. Document.                                                                                                              |
| G-07  | `announcements` perf at scale                          | **PASS**      | —        | Pilot scale fine. Add index in v0.3 if needed.                                                                                                     |
| G-10  | No explicit anon SELECT denial test                    | **PASS**      | —        | `revoke usage on schema public from anon` already in place. Add a regression test, no policy change needed.                                       |

## Counts (draft)

- **BLOCK**: 2 (G-08, G-02) — both pending exploit confirmation
- **WARN**:  5 (G-03, G-04, G-06, G-09, G-01)
- **PASS**:  3 (G-05, G-07, G-10)

## Required follow-up actions (per draft)

1. **Verify G-08 reachability** (anon-key + Player JWT can `UPDATE profiles SET
   app_role`?) BEFORE any other action. If YES → hotfix immediately, then resume
   hardening per CLAUDE.md hotfix protocol.
2. **Patch G-02** with column-level revoke or a view: `pitch_order_json` MUST
   be invisible to Player until `pitch_order_published_at IS NOT NULL`.
3. **Patch G-03** by tightening `pitch_scores_member_or_mentor_select` USING to
   gate Player-side reads on `events.results_published_at IS NOT NULL`.
4. **One commit per table tightening** with smoke E2E (11P+2M+3J+4GM parity
   check) after each.
5. **Re-spawn advisor for each table commit** (per CLAUDE.md "Spawn
   eic-pedagogical-advisor AVANT chaque edit `database/rls.sql`").

## What the audit agent did NOT decide

- Whether G-08 is reachable from a Supabase client (requires runtime probe).
- Whether to tighten G-01 immediately or defer to multi-event milestone.
- Whether to introduce `is_juror()` helper now or wait.
- Whether to migrate to pgTAP or keep plain `do $$ raise $$` tests.

All of the above are advisor + Omar decisions.

## Inputs the advisor session should re-read

- `.planning/quick/260517-rlh-rls-hardening/260517-rlh-AUDIT.md`
- `.planning/quick/260511-sbt-fix-rls-evaluation-comments-bug-f-16-01/260511-sbt-SUMMARY.md` (recent RLS fix context)
- `database/rls.sql` HEAD
- `database/migrations/10-pitch-order.sql` (G-02 source)
- `lib/types.ts` (R1 surface contract)
- CLAUDE.md "Pre-edit guards" section (zones sensibles)
