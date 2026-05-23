# J3 · 15h21 · TICK · VERT

- PROD home : 307 · 894ms (redirect attendu, nom stable)
- PROD /journey (3 mesures) : 621ms / 219ms / 205ms — RETOUR A LA NORMALE
  - Pic 4087ms du tick 15h10 confirme cold-start isole, non recurrent
- Vercel 5xx (15 min) : 0
- Supabase API (15 min) : 100% 200/101 — aucun 4xx/5xx applicatif
- Supabase RLS denied (15 min) : 0 (permission denied absent des logs postgres)
- Postgres ERRORs visibles (mgmt-api, hors-app) : quelques erreurs de schema
  exploration via mgmt-api (column s.template_id, deliverable_slug, invalid enum
  submitted/pending_review, relation team_members) — origine Supabase Studio /
  admin MCP, pas du trafic Players, non bloquant
- Slow queries (15 min) : aucune >1s detectee
- Auth errors (15 min) : 0 erreur 401/403 — logins et refresh token 200 OK
  Derniere activite : team-simock@digi.uemf.ma login 13h53 · Omar 13h32 · F.Fouad 13h10
- Active sessions (15 min) : 0 (normal — pitch off-platform, Players hors app)
- pitch-deck-v1 : 1 validated (stable vs tick precedent)
- Deploy status : pas de nouveau deploy depuis hotfix ad86675
- Advisors security : 28 WARNs — tous pre-existants (search_path mutable,
  anon/authenticated SECURITY DEFINER, leaked password protection) — aucun nouveau
  par rapport aux ticks precedents, pilot-grade accepte

**Verdict** : VERT · latence /journey resolue (3x sous 650ms) · systeme nominal en
phase off-platform post-pitch · prochain tick 15h36
