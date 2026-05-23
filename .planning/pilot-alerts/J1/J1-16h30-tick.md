# J1 · 16h30 · TICK · WARN

- PROD home : 307 (redirect) · 957ms — stable, dans les normes
- Vercel 5xx (15 min) : 0 — Vercel MCP 403 (droits token insuffisants), monitoring via Supabase auth seul
- Supabase RLS denied (15 min) : 2 (`permission denied for table announcements` a 14h38 et 14h38) — faux positif connu, table vide, ignoré
- Slow queries : aucune slow query detectee dans les logs postgres
- Auth errors (15 min) : 0 — uniquement logins reussis (200) et refreshes token
- Active sessions (15 min) : 0 — creux post-atelier 16h (idem creux 16h00)
- Deploy status : Vercel MCP 403 — dernier deploy connu fonctionnel (PROD 307 stable)
- Soumissions J1 cumul : 16 (stable vs tick 16h00) — derniere soumission a 14h38 UTC

## Activite Players identifiee dans auth logs (14h35-15h06 UTC)

Logins/refreshes detectes (referer localhost:3000) :
- team-simock@digi.uemf.ma (DJE BI TRAZIE ENOCK) — login password 14h47 UTC
- team-mindbot@digi.uemf.ma (El Mehdi Nali) — refresh token 14h45 UTC
- team-mednova@digi.uemf.ma (maski ghita) — refresh token 14h39 UTC
- team-bla-dwa@digi.uemf.ma (Jriria Zakariae) — refresh token 14h37 UTC
- Omar Ameur (UEMF) — refresh token 15h05 UTC (GM / local)

Vague d'activite 14h35-15h06 : au moins 4 equipes actives simultanement.

## ERRORs SQL a noter (source mgmt-api, non applicatifs)

1. `column "created_at" does not exist` — 2 occurrences (15h05 UTC et 14h38 UTC), application_name=mgmt-api. Origine : requetes Supabase Dashboard, PAS l'app Next.js. Pas d'impact Players.
2. `invalid input value for enum submission_status: "pending"` — 1 occurrence (14h38 UTC), application_name=mgmt-api. Meme origine dashboard. A surveiller si recurrence via app.

## Warnings (non-bloquant)

- Sessions actives = 0 sur 15 min : creux normal, les Players sont en atelier offline ou ont ferme leur onglet. Pas de drop brutal (etait deja a 1 au tick 16h00).
- ERRORs SQL ci-dessus : toutes issues de mgmt-api (Supabase Dashboard), pas de l'application PROD. Pas d'escalade.
- Advisors security : WARNs connus pre-existants (function_search_path_mutable, anon_security_definer). Aucun nouveau depuis le dernier tick. Pilot-grade accepte.

**Verdict** : WARN (sessions = 0 creux + 2 SQL errors mgmt-api non-bloquants) · prochain tick 16h40
