# J3 · 14h30 · TICK · VERT

- PROD home : 307 · 983ms (redirect → home, sous seuil WARN 2000ms)
- Vercel 5xx (15 min) : 0 (logs postgres = mgmt-api uniquement, aucun 5xx applicatif)
- Supabase RLS denied (15 min) : 0
- Slow queries : aucune — logs postgres = connexions mgmt-api normales + 4 ERRORs SQL isolés (watcher probe schema, non applicatifs)
- Auth errors (15 min) : 0 erreur Players — seuls événements = token_refresh F. Fouad 13h10 (jury, status 200 OK) + Omar 10h55/09h30 (local dev). Aucun 401/403.
- Active sessions (15 min) : 0 (pitch off-platform confirmé, F. Fouad dernier refresh 13h10, hors fenetre)
- Deploy status : non vérifié via MCP (list_deployments 403 connu) — PROD smoke 307/983ms confirme déploiement actif
- Advisors (security) : WARNs connus pre-existants (function_search_path_mutable, anon_security_definer, leaked_password_protection) — aucun nouveau depuis ticks precedents

**M7 pitch-deck-v1** : 1 submission · status = validated · submitted_at = 2026-05-22 08:17 UTC
→ 1 equipe a soumis et fait valider son pitch deck avant le jury off-platform. Stable vs tick 14h20.

**Note J3 pitch day** : 0 sessions actives attendu — pitchs off-platform, jures et players ne navigent pas la plateforme en ce moment. Coherent avec historique J3.

**ERRORs postgres notes** : 4 erreurs SQL visibles dans les logs viennent des probes watcher de ce tick (colonnes inexistantes lors des requetes de decouverte schema). Non applicatifs, non reproductibles par les Players.

**Verdict** : RAS · prochain tick 14h45
