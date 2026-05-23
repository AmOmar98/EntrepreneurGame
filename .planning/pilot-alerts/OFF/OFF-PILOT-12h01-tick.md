# OFF-PILOT · 12h01 · 2026-05-23 · TICK · VERT

> Watcher invoque hors fenetre pilote (J1=20/05, J2=21/05, J3=22/05). Monitoring residuel post-pilote actif.

## Checks

- PROD home : 307 redirect · 355ms (CDN redirect vers /login — nominal, aucun 5xx)
- Vercel 5xx (15 min) : 0 (MCP 403 sur runtime logs — canal indisponible ; smoke HTTP = OK)
- Vercel deploy status : non verifie (list_deployments 403 connu — ignore selon consigne)
- Supabase RLS denied (24h) : 2 x `permission denied for table announcements` — IGNORE (faux-positif connu)
- Supabase SQL errors (24h) :
  - `column "deliverable_slug" does not exist` : 3 occurrences (mgmt-api — acces administratif MCP, pas applicatif)
  - `column s.template_id does not exist` : 1 occurrence (mgmt-api)
  - `column "created_at" does not exist` : 1 occurrence (mgmt-api)
  - `invalid input value for enum submission_status: "pending_review"` : 1 occurrence (mgmt-api)
  - `relation "projects" does not exist` : 1 occurrence (mgmt-api)
  - Note : toutes ces erreurs viennent de `application_name=mgmt-api` (Supabase Studio/MCP), pas de requetes applicatives PostgREST. Aucune erreur applicative player-facing detectee.
- Slow queries : aucune mention dans les logs postgres
- Auth errors (24h) : 0 erreur 401/403. Derniers logins = token_revoked refresh OK :
  - FokusMind (ZAHIRA BOULANOUAR) · 22/05 23h05
  - NAFAS (AMRI Mohammed Ouassim) · 22/05 22h21
  - Simock (DJE BI TRAZIE ENOCK) · 22/05 13h54
  - Omar Ameur (UEMF) · 22/05 13h32
  - F. Fouad (UEMF) · 22/05 13h10
- Active sessions (15 min) : 0 (pilote termine — attendu)
- Advisors security : WARNs connus (SECURITY DEFINER functions + leaked password protection) — tous pre-existants, aucun nouveau

## Observations post-pilote

- Derniere activite reelle : J3 22/05 ~23h05 (FokusMind token refresh)
- Aucune session active depuis la cloture du pilote
- Infrastructure PROD en veille stable
- Erreurs mgmt-api dans postgres logs = artefacts d'exploration MCP/Studio post-pilote, non bloquantes

**Verdict** : VERT (OFF-PILOT) · Infrastructure stable · Pilote Digi-Hackathon clos proprement.
