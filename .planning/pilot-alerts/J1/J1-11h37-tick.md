# J1 · 11h37 · TICK · WARN

## Checks

- PROD home : 200 · 427ms (apres suivi redirect 307→200) · VERT
- PROD /login : 200 · 258ms · VERT
- Vercel 5xx (15 min) : 0 — aucune erreur ni warning runtime · VERT
- Vercel build status : READY — dernier deploy `d601409` (docs smoke V4) · VERT
- Supabase RLS denied : AVEUGLE — MCP -32600 (5e tick consecutif)
- Slow queries : AVEUGLE — MCP -32600
- Auth errors : AVEUGLE — MCP -32600
- Active sessions : AVEUGLE — MCP -32600 (SELECT non executable)
- Advisors : AVEUGLE — MCP -32600

## Etat deploiements Vercel

Dernier deploy production : `dpl_7XhvT3f9DHL8nebp4s3VWtztM3hB`
- SHA : `d601409` · docs(quick-260520-124) smoke V4 verdict pills
- State : READY · commit Omar Ameur · main
- Rollback candidate disponible : oui

## Avertissement persistant

Supabase MCP bloque -32600 depuis le tick 10h21 (5 ticks = 76 min de cecite DB).
- Checks #4 RLS denied, #5 slow queries, #6 auth errors, #7 sessions, #8 advisors = tous aveugles.
- Omar notifie depuis 10h37. Token Supabase MCP a renouveler.
- Pas de re-spawn hotfix-prepper (instruction explicite : cecite deja connue).

## Surface Vercel nominale

Vercel runtime : 0 log error/fatal/warning sur la fenetre 11h22→11h37.
PROD repond 200 en 427ms. Pas de spike detectable cote Vercel.

**Verdict** : WARN (cecite Supabase persistante, Vercel sain) · prochain tick J1-11h52
