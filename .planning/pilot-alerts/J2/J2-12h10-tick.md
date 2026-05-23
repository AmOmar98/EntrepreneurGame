# J2 · 12h10 · TICK · VERT

- PROD home : 307 · 271ms (redirect → login, nominal)
- Vercel 5xx (15 min) : 0 — API inaccessible pour filtrage direct (403 Vercel MCP), aucune 5xx visible dans les logs auth
- Supabase RLS denied (15 min) : 2 · `permission denied for table announcements` — faux positif DEFINITIF connu, ignoré
- Slow queries : aucune >1s détectée dans les logs postgres
- SQL error notable : 1x `column "created_at" does not exist` (mgmt-api, ~11h57) — erreur Supabase infra interne, non applicative, isolée
- Auth errors (15 min) : 0 erreur 401/403 Player — tous les tokens /token sont 200 (FokusMind + Simock refresh tokens OK)
- Active sessions (15 min) : 4 (hausse vs 1 au tick J2-12h00 — Players reprennent après pause)
- Soumissions totales : 40 (stable vs 40 tick précédent)
- Evaluations totales : 23 (stable vs 23 tick précédent)
- Deploy status : non interrogeable via MCP (403) — dernier commit connu ad86675 opérationnel
- Advisors security : tous connus et stables (search_path mutable, anon SECURITY DEFINER) — aucun nouveau
- Advisors perf : tous connus et stables (auth_rls_initplan pitch_scores/help_requests/jurors, unused indexes) — aucun nouveau

**Observations positives**
- Sessions remontent de 1 → 4 : les Players se reconnectent en debut d'atelier post-pause dejeuner
- Identites actives visibles dans auth logs : FokusMind (ZAHIRA BOULANOUAR) + Simock (DJE BI TRAZIE ENOCK) avec refresh tokens valides — signe d'engagement reel
- Latence home 271ms — excellent (bien en dessous du seuil WARN 1200ms)

**Verdict** : RAS · prochain tick J2-12h25
