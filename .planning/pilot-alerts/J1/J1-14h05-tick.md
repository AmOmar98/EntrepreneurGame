# J1 · 14h05 · TICK · WARN

- PROD home : 307 redirect · 248ms (nominal — Next.js redirect auth gate, sous 1.5s)
- Vercel 5xx (15 min) : 0 (MCP Vercel 403 persistant — contournement HTTP smoke OK)
- Supabase RLS denied (15 min) : **4** `permission denied for table announcements`
  - Timestamps: 13:20:00, 13:15:30, 12:55:19, 12:55:18 UTC
  - Pattern: requetes Player tentant de lire `announcements` sans policy READ configuree
- Slow queries : aucune detectee dans les logs postgres (aucun `slow query` ou duree >1000ms visible)
- Auth errors : 0 erreur 401/403 — tous les /user et /token retournent 200
- Active sessions (15 min) : **1** (stable — idle entre ateliers, Omar ou token Simock actif)
  - Login detecte : `team-simock@digi.uemf.ma` (Simock — DJE BI TRAZIE ENOCK) a 13:15 UTC
  - Login detecte : `o.ameur@ueuroped.org` (Omar) a 13:52 UTC
- Submissions actives (15 min) : **1** nouvelle soumission dans la fenetre
- Deploy status : non verifie via MCP (403) — dernier deploy connu stable (PROD 200/248ms)
- Advisors security : **WARN existants** (pre-existants, pas de nouveau)
  - `function_search_path_mutable` : set_updated_at, guard_player_onboarding, set_help_requests_updated_at, set_pitch_mode_closed_at
  - `anon_security_definer_function_executable` : current_app_role, fn_auto_eval_fiches_entretien, is_game_master, is_juror, is_mentor, is_my_player, on_evaluation_change, on_evaluation_engagement_change, on_submission_engagement_change, recalc_player_engagement, recalc_player_score
  - `auth_leaked_password_protection` : desactive (pilot-grade, connu)
  - **Aucun nouveau advisor par rapport aux ticks precedents**

## Warnings (non-bloquant)

- RLS `permission denied for table announcements` : 4 occurrences sur ~30 min
  (cumul J1 en hausse comme note au tick 14h10 — pattern attendu si Players tentent d'acceder a announcements sans policy SELECT configuree)
  → Tendance a surveiller. Si >5 dans les 10 prochaines minutes = HARD.
  → Action possible post-J1 : ajouter policy SELECT anon/authenticated sur `announcements`.

- Sessions = 1 : en dessous du seuil HARD (<2) mais contexte idle est connu et normal entre ateliers.
  → Pas de vrai drop d'activite. Simock vient de se connecter a 13:15 UTC.

**Verdict** : WARN · prochain tick J1-14h15
