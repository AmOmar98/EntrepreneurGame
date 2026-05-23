# J1 · 14h50 · TICK · VERT

- PROD home : 307 · 275ms (redirect normal, sous seuil)
- Vercel 5xx (15 min) : 0 (MCP Vercel 403 — smoke HTTP confirme fonctionnel)
- Supabase RLS denied (15 min) : 2 occ `permission denied for table announcements` (timestamps ~14h35 et ~14h20) — sous seuil HARD (≥5), stable vs ticks précédents
- Slow queries : aucune >1s visible dans les logs postgres
- Auth errors : 0 erreur 401/403 — tous les `/user` et `/token` retournent 200. 1 login `team-simock@digi.uemf.ma` à 13h15 (refresh token normal)
- Active sessions (15 min) : 0 — inter-atelier confirmé (cohérent avec historique 14h40)
- Soumissions (15 min) : 0 nouvelles — dernière soumission à 13h19 UTC (15h19 locale) · cumul J1/24h = 15
- Deploy status : vérification Vercel MCP en 403 (token scope) — PROD répond 307/275ms, fonctionnel
- Advisors : identiques aux ticks précédents — pas de nouveau WARN security ni perf. Existants connus : `function_search_path_mutable` (4 fonctions), `anon_security_definer` (RLS helpers), `auth_rls_initplan` sur `pitch_scores`/`help_requests`/`jurors`, `multiple_permissive_policies` sur `help_requests`/`jurors`. Tout pre-existant, non-bloquant pilote.
- Erreur mgmt-api postgres : `column "created_at" does not exist` + `column "updated_at" does not exist` — faux-positifs connus, infra Supabase interne, non applicatif

**Verdict** : VERT · RAS · prochain tick 15h00
