# Deferred items — quick 260512-24v

Captured during execution, not in scope of the present quick. Each candidate is appropriate for v0.3 (post-pilote) or a follow-up quick if J1/J2 reveals a need.

## 1. Rate limiting on `createHelpRequestFlow`

- **Today:** none. Volume pilote 11 Players × 2 days, GameMaster purge possible via service role.
- **v0.3:** add either a `help_requests_rate_limit` table (window per `player_id`) or a Supabase Edge Function debouncing inserts (e.g. 60s/player). DB-level CHECK on char_length already prevents megabyte spam.

## 2. Realtime bell refresh for mentor / GameMaster

- **Today:** `revalidatePath("/mentor")` + `revalidatePath("/admin")` triggered server-side by Player submit. Mentor sees fresh count on next navigation/F5.
- **v0.3:** `supabase.channel("help_requests").on("postgres_changes", { event: "INSERT" }, refresh)` client-side hook on `/mentor` + `/admin`, OR a small polling interval (5s) on the bell component.

## 3. Mentor assignment scope (cohort-wide today)

- **Today:** all mentors + GameMaster see all help requests via `is_mentor()` RLS policy.
- **v0.3:** add `assigned_mentor_id uuid references profiles(user_id) on delete set null` on `help_requests`, OR a separate `mentor_assignments(player_id, mentor_user_id)` table. Then narrow RLS `using` clause to `is_mentor() AND (assigned_mentor_id = auth.uid() OR is_game_master())`.

## 4. Mailto fallback

- **Today:** in-app only. If Player closes the app before the mentor sees the request, no email fallback.
- **v0.3:** after successful insert, populate `WorkflowState.mailto` with a `mailto:` draft addressed to assigned mentor + EIC (same pattern as `submitDeliverableFlow`). UX: silent — only opens if user clicks an explicit "Aussi envoyer par email" affordance.

## 5. Attach mission context to request

- **Today:** Player must self-describe the mission they're stuck on in the textarea.
- **v0.3:** auto-detect mission from `usePathname()` client-side (e.g. `/journey/deliverable/<id>` → resolve to mission slug L2.2), pre-fill `mission_context text` nullable on `help_requests`. Helps mentor triage faster. Bonus: surface this as a small chip in the inbox.

## 6. (Out of scope v0.3 per advisor)

- Bidirectional thread (mentor replies in-app)
- Player-side history of past requests
- Notification (browser/email) to mentor on new request

J1/J2 = présentiel. Mentor répond en marchant vers la table. UI = canal d'appel, pas thread async.
