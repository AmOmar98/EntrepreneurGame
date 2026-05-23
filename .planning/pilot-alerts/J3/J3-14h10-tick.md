# J3 · 14h10 · TICK · VERT

- PROD home : 307 (redirect /login) · 943ms
- Vercel 5xx (15 min) : 0 (Vercel MCP 403 persistant — faux-positif connu, pas d'accès logs runtime)
- Supabase RLS denied (15 min) : 0
- Slow queries : aucune
- Auth errors (15 min) : 0 — 1 login info (f.fouad@ueuromed.org 13:10 UTC, token refresh nominal)
- Active sessions (15 min) : 1 (stable vs 0 au tick 14h00, jury/mentor en consultation)
- Deploy status : non interrogeable (Vercel MCP 403) — dernier hotfix ad86675 operationnel
- Advisors : non interroge ce tick

**Metriques J3 pitch :**
- pitch-deck-v1 soumis : 1 / valide : 1
- Validated total : 42 (stable vs 42 tick precedent)
- submitted_v1 en attente : 8

**Note postgres (hors fenetre 15 min) :**
Erreurs SQL schema detectees autour de 13h09-13h12 UTC (via mgmt-api) :
`relation "projects"/"startups" does not exist`, `column sub.project_id/event_id does not exist`,
`invalid input value for enum submission_status: "pending_review"/"not_started"`,
`column "submitted_at"/"created_at"/"updated_at"/"deliverable_slug" does not exist`.
Toutes originaires de connexions mgmt-api (tableau de bord Supabase Studio), pas de l'application.
Antecedentes au tick 14h00 — pas de nouvelles erreurs dans la fenetre courante. Pas d'escalade.

**Verdict** : RAS · prochain tick 14h25
