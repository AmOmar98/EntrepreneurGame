# Database

Phase 1 schema + Phase 2 seed for Entrepreneur Game (pilot Hack-Days Mai 2026).

## Apply order summary

```
schema.sql -> triggers.sql -> rls.sql -> seed_event_hackdays.sql
```

`seed_bootcamp.sql` is **legacy / demo** and **MUST NOT** be applied on Supabase
prod (BRAND-05 / DATA-03 — partner credibility, no leak of demo names).

## Fresh apply (Phase 1 + Phase 2)

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
5. Apply `seed_event_hackdays.sql` (Phase 2 / Plan 04, EVENT-01) :
   - Levels L0..L7.
   - Event `hack-days-fes-meknes-mai-2026` + cohort `cohorte-mai-2026`.
   - 6 missions alignees sur le programme 13-14 mai 2026 (UTC+1).
   - 9 deliverable_templates avec rubric JSONB (4 criteres x 25 = 100).
   - **Idempotent** : re-application sans erreur ni duplication (ON CONFLICT DO UPDATE).
6. **NE PAS** appliquer `seed_bootcamp.sql` en prod — fichier legacy demo.

## Bootstrap your first GameMaster profile

After step 5, create the first user via Supabase Auth (email/password), then
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

## Re-seeding the event

`seed_event_hackdays.sql` is safe to re-run — every INSERT uses `ON CONFLICT
... DO UPDATE`. If the program changes (titles, scheduled_at, rubrics), edit
the file and re-execute it on the Supabase SQL editor.

## DATA-03 — anti-leak guarantee

The TS layer (`lib/seed/index.ts`) returns `[]` for all demo accessors when
`hasSupabaseEnv()` is true. Demo data in `lib/seed/players.ts`,
`lib/seed/missions.ts`, `lib/seed/deliverableTemplates.ts` is neutral
(`Demo Team Alpha`, `Demo - Atelier Probleme`, ...) and never references
partners (Tamwilcom, Bank of Africa, Innov Invest, Bluespace) nor `atlas-soil`.
