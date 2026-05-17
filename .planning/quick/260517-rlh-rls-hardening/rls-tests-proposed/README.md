# RLS test approach (skeleton — proposed, not applied)

Status: **draft / not executed** — produced by quick `260517-rlh` audit
dispatch (2026-05-17). This folder lives under `.planning/` (not
`database/`) because audit-only scope forbids writes under `database/`.
When the follow-up hardening session starts (post-pilote + advisor spawn),
the file tree below MUST be moved verbatim to `database/rls-tests/`.

## Goals

For every table with RLS — `events`, `levels`, `missions`,
`deliverable_templates`, `cohorts`, `profiles`, `players`, `player_members`,
`submissions`, `evaluations`, `pitch_scores`, `bonus_events`,
`evaluation_comments`, `announcements`, `moscow_cards` — prove four things
per role (`player`, `mentor`, `game_master`, plus implicit `anon`):

1. **Allowed reads succeed** (positive SELECT).
2. **Forbidden reads return zero rows** (negative SELECT — cross-team
   isolation, anon-blocked, etc.). RLS denies via empty result, not error.
3. **Allowed writes succeed** (positive INSERT/UPDATE/DELETE).
4. **Forbidden writes raise `42501` permission denied** (negative write).

## Mechanics

Tests run inside a single transaction that is **always rolled back** so they
can safely target a Supabase **branch** (never PROD). Pattern:

```sql
begin;

-- 1. Set up fixtures as service_role (bypasses RLS).
set local role service_role;
-- ... insert events, levels, cohorts, two players (alpha + beta),
--     three users (alice = player alpha, bob = mentor, carol = GM) ...

-- 2. Impersonate as authenticated + a specific user.
set local role authenticated;
set local "request.jwt.claim.sub" to '<alice-uuid>';

-- 3. Assertions via DO block — raise on contract breach.
do $$
begin
  if not exists (select 1 from public.players where id = '<alpha-uuid>') then
    raise exception 'EXPECTED alice can SELECT her own player';
  end if;
  if exists (select 1 from public.players where id = '<beta-uuid>') then
    raise exception 'CARDINAL R1 BREACH: alice sees beta team';
  end if;
end $$;

rollback;
```

Notes:

- `set local "request.jwt.claim.sub"` is how Supabase / PostgREST resolves
  `auth.uid()` inside SQL — mirrors the JWT claim PostgREST injects.
- `set local role authenticated` is required because the RLS helpers
  (`current_app_role`, `is_mentor`, `is_game_master`, `is_my_player`) only
  fire for `authenticated`; running as `service_role` bypasses RLS entirely.
- Wrap every test file in `begin; ... rollback;` so PROD-safe re-runs are
  guaranteed even if a developer mis-aims at the prod branch.

## Proposed file layout (target = `database/rls-tests/`)

```
database/rls-tests/
  README.md                       <- this file (moved verbatim)
  _fixtures.sql                   <- (TBD) seed alpha/beta/alice/bob/carol
  test_players_isolation.sql      <- example skeleton (this commit)
  test_evaluations_r1.sql         <- example skeleton (this commit)
  test_<table>.sql                <- one file per table (follow-up)
```

## R1 cardinal lock-in

The single most important assertion: **a Player MUST NOT see
`evaluations.scores` or `pitch_scores.total_score` for OTHER teams**.
`test_evaluations_r1.sql` encodes this as a hard `raise exception` so a
regression breaks CI loudly. Per CLAUDE.md pre-edit guards, R1 violations
are BLOCK-severity.

## Running tests (follow-up session, not now)

```bash
# Against a Supabase branch (NEVER --linked to PROD):
supabase db push --db-url "$BRANCH_URL"
for f in database/rls-tests/test_*.sql; do
  psql "$BRANCH_URL" -v ON_ERROR_STOP=1 -f "$f" || exit 1
done
```

Optional: convert to pgTAP for richer assertions if Omar wants a framework.
Plain SQL `do $$ ... raise exception ... $$` is sufficient for pilot+1
scope.

## Out of scope (this skeleton)

- Actual fixture UUIDs (generated in follow-up session).
- CI wiring (`gh actions`, branch DB URL secret).
- Performance regression tests (covered by quick `260512` initplan migration).
- pgTAP migration.
