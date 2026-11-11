# Deferred Items (`261111-db1`)

1. **Full Fresh-DB Disposable Replay (`DB-01` remainder):**
   - `database/triggers.sql` and `database/rls.sql` syntax and bootstrap guards are repaired and verified against Postgres 17, but a full end-to-end replay (`schema.sql -> triggers.sql -> rls.sql -> supabase db push`) on a separate empty disposable Supabase project remains recommended when a disposable project slot is available.
2. **Supabase Auth `auth_leaked_password_protection`:**
   - Enabling HaveIBeenPwned leaked-password protection in Supabase Auth settings requires a project dashboard / Auth config toggle (or Pro plan setting depending on Supabase tier).
