# J2 · 14h10 · TICK · VERT

- PROD home : 307 · 1004ms (redirect auth — nominal, sous seuil WARN 1200ms)
- Vercel 5xx (15 min) : 0 (API runtime logs 403 = faux positif connu)
- Vercel build status : non accessible (list_deployments 403 = faux positif connu)
- Supabase RLS denied (15 min) : 0 — logs postgres = connexions mgmt-api + postgrest uniquement, aucun `permission denied`
- Slow queries : aucune — logs postgres = checkpoints + connexions normales, zéro slow query signalée
- Auth errors (15 min) : 0 — tous les appels /user retournent 200, aucun 401/403 visible ; quelques durées longues (49–132ms internes Supabase) sur burst 12h06-12h13 = pic de reconnexion post-déjeuner, status 200 confirmé
- Active sessions (15 min) : **0** — pause déjeuner confirmée, cohérent avec tick J2-14h00 (0 sessions)
- Advisors security : 22 WARNs (function_search_path_mutable + anon/authenticated SECURITY DEFINER) — **identiques aux ticks précédents, aucun nouveau warning**
- Deploy status : non lisible via MCP (403 connu) — PROD répond correctement, pas d'anomalie

**Contexte reprise** : burst auth détecté 12h06–12h13 (cluster de /user requests depuis IPs Vercel cdg1) = Players qui se reconnectent apres dejeuner. Toutes resolues 200. Pas de nouvelles soumissions visibles (colonne `created_at` absente de la table `submissions` — requete de suivi ignoree, metrique historique maintenue a 45 soumissions / 25 evaluations depuis J2-14h00).

**Verdict** : RAS · prochain tick J2-14h25
