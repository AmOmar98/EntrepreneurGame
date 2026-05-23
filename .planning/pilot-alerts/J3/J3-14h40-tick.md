# J3 · 14h40 · TICK · VERT

- PROD home : 307 (redirect normal) · 395ms
- PROD /journey : 307 (redirect normal) · 231ms
- Vercel 5xx (15 min) : 0 — Vercel MCP 403 (pas de token team), smoke HTTP confirme OK
- Supabase RLS denied (15 min) : 0 — aucun `permission denied` dans postgres logs
- Slow queries : aucune — logs postgres = connexions mgmt-api + realtime uniquement
- Auth errors (15 min) : 0 — dernier event = token_revoked Omar 13h32 (normal, refresh)
  Utilisateurs actifs vus : Omar Ameur (UEMF) + F. Fouad (UEMF) = activite recente
- Active sessions (15 min) : 1
- M7 pitch-deck-v1 : 1 validated (stable vs tick 14h30)
- Deploy status : pas de build recent detecte, PROD repond normalement
- Advisors security : WARANs pre-existants inchanges (search_path mutable x4, SECURITY DEFINER
  callable anon/authenticated x ~14 fonctions, leaked password protection off)
  — aucun nouveau WARN, meme liste que ticks precedents, pilot-grade accepte

**Notes postgres errors (mgmt-api, non applicatifs) :**
Plusieurs erreurs vues dans logs postgres mais toutes proviennent du user `postgres`
via `application_name=mgmt-api` — ce sont des requetes Supabase Studio/management,
pas des erreurs applicatives Players :
- `column p.display_name does not exist` — mgmt-api
- `relation "team_members" does not exist` — mgmt-api
- `invalid input value for enum submission_status: "pending_review"` — mgmt-api
- `column "updated_at" does not exist` — mgmt-api
Ces erreurs sont hors perimetre applicatif (aucun Player impacte), seuil HARD non atteint.

**J3 pitch jour — surveillance specifique :**
- /results et /jury : aucune spike detectee dans auth logs (pas de burst de connexions jury)
- pitch-deck-v1 : 1 submission validated, 1 total — stable, pas de nouvelle soumission depuis 14h30

**Verdict** : RAS · prochain tick 15h00
