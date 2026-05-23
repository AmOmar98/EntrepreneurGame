# J3 · 15h30 · TICK · VERT

- PROD home : 307 (redirect vers /login) · 973ms — nominal, sous seuil WARN 2000ms
- Vercel 5xx (15 min) : 0 — MCP 403 sur runtime logs (connu, ignoré per policy)
- Supabase RLS denied (15 min) : 0 — aucun `permission denied` dans postgres logs
- Slow queries : aucune — seuls logs postgres = connexions mgmt-api + postgrest + realtime (nominal)
- SQL applicatifs erreurs (mgmt-api, hors app) dans fenetre etendue : 5 erreurs schema detectees
  - `column s.template_id does not exist` (x2 — mgmt-api, pas app)
  - `column deliverable_slug does not exist` (x1 — mgmt-api)
  - `invalid input value for enum submission_status: "submitted"` (x2 — mgmt-api)
  - `column p.display_name does not exist` (x1 — mgmt-api)
  - `relation "team_members" does not exist` (x1 — mgmt-api)
  - NOTE : toutes proviennent de `mgmt-api` (Supabase dashboard/studio interne), PAS de l'application. Hors perimetre de surveillance app. Compte = 0 erreurs applicatives.
- Auth errors : 0 — 3 logins recents tous status 200 (team-simock, o.ameur, f.fouad)
  - Derniere activite : 13h54 token refresh team-simock (DJE BI TRAZIE ENOCK) — signe d'activite post-pitch
- Active sessions (15 min) : 0 — expected, pitch off-platform, Players ne naviguent plus activement
- Deploy status : pas de nouveau deploy detecte — hotfix ad86675 stable
- M7 pitch-deck-v1 : 1 validated / 2 total (stable vs tick precedent)
- M7 unit-economics-v1 : 1 validated / 1 total (stable)
- M7 techniques-pitch-v1 : 0 validated / 1 total (1 draft en cours ou non soumis)
- Advisors security : WARNs connus pre-existants (search_path mutable, anon SECURITY DEFINER) — aucun nouveau
- Advisors performance : WARNs connus (pitch_scores RLS initplan, help_requests/jurors multiple policies) — aucun nouveau
- J3 spike /results /jury : aucune session active detectee — coherent avec pitch off-platform (jury delibere hors app)

**Verdict** : VERT · prochain tick 15h45
