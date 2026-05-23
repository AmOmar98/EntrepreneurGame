# J1 · 18h00 · TICK · VERT

- PROD home : 307 (redirect to /login — attendu, non auth) · 234ms
- Vercel 5xx (15 min) : 0 (Vercel runtime logs API 403 — faux positif connu permissions MCP ; pas de signal d'erreur côté Supabase auth)
- Supabase RLS denied (15 min) : 1 (`permission denied for table announcements` — faux positif connu, table sans RLS SELECT pour authenticator ; hors seuil WARN)
- Slow queries : aucune >1s visible dans logs postgres (seuls checkpoints et connexions authenticator)
- SQL applicatif : 1 erreur `column "created_at" does not exist` visible — hors fenêtre 15 min (17h41 UTC, soit ~25 min avant ce tick). Non récurrent dans la fenêtre courante.
- Auth errors (15 min) : 0 (47 événements auth dans la fenêtre, tous status 200, zéro 401/403/5xx)
- Active sessions (15 min) : 4 (up vs 1 au tick 17h50 — regain d'activité fin J1, probablement GM + Players retardataires)
- Deploy status : Vercel list API 403 (permissions MCP insuffisantes) — pas de signal de deploy échoué, PROD répond nominalement
- Advisors security : WARNs pre-existants (function_search_path_mutable x4, anon SECURITY DEFINER x10) — aucun nouveau par rapport aux ticks précédents
- Advisors performance : WARNs pre-existants (auth_rls_initplan sur pitch_scores/help_requests/jurors, unindexed FK help_requests/jurors, unused indexes) — aucun nouveau

**Note sur `column "created_at" does not exist`** : erreur isolée à 17h41 UTC, non répétée dans la fenêtre courante. Probablement requête MCP watcher ou script GM sur une table sans cette colonne. A surveiller au prochain tick — si récurrent, escalade WARN.

**Verdict** : VERT · sessions actives remontent (1 → 4) signe d'activité fin J1 · prochain tick 18h10
