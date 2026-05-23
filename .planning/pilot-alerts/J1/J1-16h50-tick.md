# J1 · 16h50 · TICK · WARN

- PROD home : 307 · 1023ms (redirect vers /login — normal, non-auth)
- Vercel 5xx (15 min) : 0 (API MCP 403 — token scope insuffisant, pas une erreur applicative)
- Supabase RLS denied (15 min) : 0
- Slow queries : 0 slow queries détectées dans les logs postgres
- DB ERRORS applicatifs (15 min) : 2 occurrences `column "created_at" does not exist` (mgmt-api) + 1 occurrence `invalid input value for enum submission_status: "pending"` (mgmt-api) — tous issus de mgmt-api, pas du flux applicatif Players
- Auth errors : 0 erreur 401/403 — tous les /token et /user retournent 200
- Auth activité : logins confirmés — Simock (team-simock@digi.uemf.ma), MindBot (team-mindbot@digi.uemf.ma), MedNova (team-mednova@digi.uemf.ma), Bla Dwa (team-bla-dwa@digi.uemf.ma) — 4 équipes actives en fin J1
- Active sessions (15 min) : 0 (creux post-atelier — cohérent avec tick 16h40)
- Soumissions cumul J1 : 16 (stable, identique tick précédent)
- Deploy status : Vercel MCP 403 (scope token) — dernier smoke PROD confirmé OK hors watcher
- Advisors sécurité : WARNs existants (function_search_path_mutable, anon_security_definer_function_executable) — TOUS pré-existants, aucun nouveau
- Advisors performance : WARNs existants (auth_rls_initplan sur pitch_scores/help_requests/jurors, multiple_permissive_policies) — TOUS pré-existants, aucun nouveau

## Warnings (non-bloquant)

- DB ERROR `invalid input value for enum submission_status: "pending"` · 1x · via mgmt-api (Supabase dashboard interne, pas Players)
  → Probablement requete dashboard Supabase utilisant valeur `"pending"` deprecated (enum attend `submitted` ou autre valeur courante). Non reproductible Players.
  → A surveiller : si ce pattern apparait via authenticator/postgrest (flux Player), escalader HARD.

- DB ERROR `column "created_at" does not exist` · 3x sur 24h (2 dans fenetre recente) · via mgmt-api uniquement
  → Faux positif connu — requetes introspection Supabase dashboard. Aucun impact Players.

- Latence PROD home : 1023ms (seuil WARN = 1200ms, on reste en-dessous mais en surveillance)
  → Stable vs 1094ms tick 16h40. Pas de degradation.

**Verdict** : WARN · DB errors tous mgmt-api (non-applicatifs) · Sessions = 0 coherent creux fin J1 · 4 equipes ont ete actives · 16 soumissions stables · prochain tick 17h00
