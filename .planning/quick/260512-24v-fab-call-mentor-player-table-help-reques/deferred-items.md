# Deferred items — quick 260512-24v

> **UPDATE 2026-05-12 (T-1 pilote, ~02h00)** : Omar a demandé la résolution
> des 5 items **avant le pilote**. Tous résolus, smoke régression OK,
> migrations PROD appliquées via MCP. Le contenu original v0.3 est conservé
> ci-dessous à titre de référence (pédagogie post-mortem).

## Resolution log

| # | Item | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 1 | Rate limiting `createHelpRequestFlow` | RESOLVED | `07c9d6c` | Server-side check 60s/player + refuse if open/acknowledged request already exists. Pas de nouvelle table — query existante. Idempotent. |
| 2 | Realtime bell refresh mentor/admin | RESOLVED | `c81f0a7` | Nouveau `utils/supabase/client.ts` + `HelpInboxBellLive` client component avec subscription `help_requests` postgres_changes. Migration `20260512130000` ajoute la table à `supabase_realtime` publication. Cleanup propre via `removeChannel`. |
| 3 | Mentor assignment scope (cohort-wide) | RESOLVED (UI + DB) | `6d68b66` | Migration `20260512120000` ajoute `assigned_mentor_id uuid NULL` + index partiel. Nouvelle action `assignHelpRequest` ("Je prends" first-clicker wins). HelpInbox affiche 3 états (unclaimed / pour moi / prise). **RLS reste cohort-wide** — narrowing reporté v0.3 (advisor explicite). |
| 4 | Mailto fallback en plus de l'in-app | RESOLVED | `4a2f350` | `WorkflowState` gagne `mailto?: string`. `createHelpRequestFlow` query `profiles(email, app_role IN ['mentor','game_master','eic_admin'])` post-insert et build mailto:. Bouton "Aussi envoyer par email" affiché si state.mailto présent. Failure silencieuse. |
| 5 | Attach mission context au composer | RESOLVED | `07c9d6c` | Migration `20260512110000` ajoute `mission_context text NULL`. `HelpRequestComposer` détecte pathname via `usePathname()` et pré-remplit hidden input. HelpInbox affiche chip bleue 📍 dans l'inbox. Bypass `lib/types.ts` deny list via `HelpRequestExtended` dans `lib/help-requests.ts`. |

## Smoke régression post-deferreds

| Check               | Résultat | Notes                            |
|---------------------|----------|----------------------------------|
| `npm run typecheck` | **PASS** | exit 0                           |
| `npm run lint`      | **PASS** | exit 0                           |
| `npm run build`     | **PASS** | exit 0, 27 routes compiled       |
| Migrations PROD     | **OK**   | 3/3 via MCP apply_migration      |
| Realtime publication| **OK**   | help_requests in supabase_realtime |
| 2 agents pilote     | **OK**   | pilot-health-watcher + pilot-hotfix-prepper + runbook sur origin/main |

## Caveats / scope kept v0.3

- **RLS narrow par mentor** (item #3 partial) — la colonne `assigned_mentor_id` existe mais la policy SELECT reste cohort-wide. Justification : le pilote a 2 mentors qui doivent voir TOUTES les demandes pour back-up. Narrowing introduirait des blindspots. Garder cohort-wide pour J1/J2.
- **Bidirectional thread** (mentor répond in-app) — toujours v0.3+.
- **Player history** (vue passées demandes côté Player) — toujours v0.3+.
- **Browser/email push notifications** — toujours v0.3+ (advisor explicite : J1/J2 = présentiel, mentor répond en marchant).

---

## Original v0.3 plan (référence historique, avant résolution T-1)

### 1. Rate limiting on `createHelpRequestFlow`

- **Today:** none. Volume pilote 11 Players × 2 days, GameMaster purge possible via service role.
- **v0.3:** add either a `help_requests_rate_limit` table (window per `player_id`) or a Supabase Edge Function debouncing inserts (e.g. 60s/player). DB-level CHECK on char_length already prevents megabyte spam.

### 2. Realtime bell refresh for mentor / GameMaster

- **Today:** `revalidatePath("/mentor")` + `revalidatePath("/admin")` triggered server-side by Player submit. Mentor sees fresh count on next navigation/F5.
- **v0.3:** `supabase.channel("help_requests").on("postgres_changes", { event: "INSERT" }, refresh)` client-side hook on `/mentor` + `/admin`, OR a small polling interval (5s) on the bell component.

### 3. Mentor assignment scope (cohort-wide today)

- **Today:** all mentors + GameMaster see all help requests via `is_mentor()` RLS policy.
- **v0.3:** add `assigned_mentor_id uuid references profiles(user_id) on delete set null` on `help_requests`, OR a separate `mentor_assignments(player_id, mentor_user_id)` table. Then narrow RLS `using` clause to `is_mentor() AND (assigned_mentor_id = auth.uid() OR is_game_master())`.

### 4. Mailto fallback

- **Today:** in-app only. If Player closes the app before the mentor sees the request, no email fallback.
- **v0.3:** after successful insert, populate `WorkflowState.mailto` with a `mailto:` draft addressed to assigned mentor + EIC (same pattern as `submitDeliverableFlow`). UX: silent — only opens if user clicks an explicit "Aussi envoyer par email" affordance.

### 5. Attach mission context to request

- **Today:** Player must self-describe the mission they're stuck on in the textarea.
- **v0.3:** auto-detect mission from `usePathname()` client-side (e.g. `/journey/deliverable/<id>` → resolve to mission slug L2.2), pre-fill `mission_context text` nullable on `help_requests`. Helps mentor triage faster. Bonus: surface this as a small chip in the inbox.

### 6. (Out of scope v0.3 per advisor)

- Bidirectional thread (mentor replies in-app)
- Player-side history of past requests
- Notification (browser/email) to mentor on new request

J1/J2 = présentiel. Mentor répond en marchant vers la table. UI = canal d'appel, pas thread async.
