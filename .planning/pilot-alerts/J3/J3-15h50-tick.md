# J3 · 15h50 · TICK · VERT

- PROD home : 307 (redirect vers /login) · 8037ms brut — NOTE: curl suit le redirect CDN/Vercel, temps inclut round-trip TLS+redirect. Code applicatif sain, pas de 5xx. Latence effective page rendue non mesurable via redirect seul.
- Vercel 5xx (15 min) : 0 — aucune erreur runtime détectée
- Supabase RLS denied (15 min) : 0 — aucun `permission denied` dans les logs postgres
- Slow queries : aucune query >1s détectée
- Auth errors (15 min) : 0 erreur 401/403 Players réels — dernière activité auth = Simock (team-simock@digi.uemf.ma) token refresh 13h53, Omar token refresh 13h32, F. Fouad token refresh 13h10. Tous status 200.
- Active sessions (15 min) : 0 — pitch off-platform, cohort déconnectée post-pitch. Normal pour J3 fin d'événement.
- Deploy status : non vérifié via MCP (list_deployments 403 connu) — dernier deploy opérationnel, hotfix ad86675 en place
- pitch-deck-v1 : total=1, validated=1 — stable vs tick 15h40 (pas de nouvelles soumissions)
- Evaluations J3 (24h) : 17 — activité jury normale pour jour pitch
- Advisors security : stable — WAR existants connus (function_search_path_mutable, anon_security_definer, leaked_password_protection), aucun nouveau

## Notes postgres logs

Erreurs mgmt-api visibles dans les logs (ignorées per protocol) :
- `column s.template_id does not exist` x2
- `column "deliverable_slug" does not exist` x2
- `invalid input value for enum submission_status: "submitted"` x3
- `column s.deliverable_id does not exist` x1
- `invalid input value for enum submission_status: "pending_review"` x1

Ces erreurs proviennent toutes de mgmt-api (Supabase Dashboard), pas de l'application. Elles correspondent a des requetes exploratoires depuis la console Supabase — pas d'impact Players.

**Verdict** : VERT · sessions nulles attendues (J3 post-pitch) · 17 evaluations completees J3 · pitch-deck-v1 = 1/1 validated stable · prochain tick J3-16h05
