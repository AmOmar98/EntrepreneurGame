# J2 · 10h10 · TICK · VERT

- PROD home : 307 (redirect) · 230ms — nominal
- Vercel MCP : 403 scope (faux positif connu) — skip check build status
- Vercel 5xx (15 min) : 0 — aucune erreur 5xx dans logs auth/postgres applicatifs
- Supabase RLS denied (15 min) : 3 x `permission denied for table announcements` — FAUX POSITIF DEFINITIF (connu, ignoré)
- Supabase SQL errors mgmt-api (15 min) : 2 erreurs mgmt-api (`column "created_at" does not exist`, `column "slug" does not exist`) — mgmt-api = FAUX POSITIF DEFINITIF, ignoré
- Slow queries : aucune slow query détectée dans les logs postgres
- Auth errors : 2 x `refresh_token_not_found` (400) sur IP 3.11.80.56 vers 08h22 — équipe MedNova au login, récupérée via password auth immédiatement après — normal cold-start J2
- Active sessions (15 min) : **2** (seuil min = 2 — atteint pile, stable)
- Deploy status : non vérifié (Vercel MCP 403 scope persistant) — PROD home répond 307/230ms, infra OK
- Advisors security : WARNs connus (function_search_path_mutable, anon_security_definer) — inchangés vs ticks précédents, pilot-grade accepté
- Advisors perf : WARNs connus (auth_rls_initplan sur pitch_scores/help_requests/jurors, multiple_permissive_policies) — inchangés, aucun nouveau

## Activite Players observee (auth logs)

Equipes vues actives depuis 08h21 :
- MedNova — maski ghita : login password 08h22 (fresh session)
- FokusMind — ZAHIRA BOULANOUAR : token refresh 08h42
- Bla Dwa — Jriria Zakariae : token refresh 08h45
- MindBot — El Mehdi Nali : token refresh 08h57

4 equipes actives confirmees. Montee normale en debut de J2.

**Verdict** : VERT · prochain tick 10h25
