# Database

Phase 1 schema for Entrepreneur Game (pilot Hack-Days Mai 2026).

## Fresh apply (Phase 1)

The pilot starts on a **fresh** Supabase project (D-01). No data is preserved.

1. In the Supabase SQL editor, run once to wipe `public`:

   ```sql
   drop schema public cascade;
   create schema public;
   grant usage on schema public to anon, authenticated, service_role;
   ```

2. Apply `schema.sql` (tables + enums + indexes).
3. Apply `triggers.sql` (`updated_at`, score recalc, onboarding guard).
4. Apply `rls.sql` (helper functions + per-table policies).
5. `seed_bootcamp.sql` is empty in Phase 1; Phase 2 (M4) will populate the
   Hack-Days event + missions + deliverable templates.

## Bootstrap your first GameMaster profile

After step 4, create the first user via Supabase Auth (email/password), then
elevate the profile:

```sql
-- Find the auth user id from auth.users (or Supabase dashboard).
insert into public.profiles (user_id, app_role, full_name, email)
values ('<your auth.uid()>', 'game_master', 'Omar', 'omar.ameur98@gmail.com')
on conflict (user_id) do update
  set app_role = excluded.app_role,
      full_name = excluded.full_name,
      email = excluded.email;
```

From there, use `/admin` (Phase 4) to create cohorts, players, members.

## Apply order summary

```
schema.sql -> triggers.sql -> rls.sql -> (seed_bootcamp.sql when populated)
```
