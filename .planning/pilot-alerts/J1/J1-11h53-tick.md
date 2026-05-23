# J1 · 11h53 · TICK · WARN

## Checks

- PROD home : 307 → 200 · 342ms (redirect auth → /login, nominal)
- Vercel 5xx (15 min) : 0 (aucun log error/warning/fatal sur 10h38→10h53 UTC)
- Deploy status : READY · commit d601409 (docs smoke V4 jury) · dernier deploy il y a ~1h45
- Supabase MCP : **BLOQUE** (erreur -32600 "permission denied" sur tous les outils MCP Supabase)
  - get_logs postgres : KO
  - get_logs auth : KO
  - execute_sql : KO
  - get_advisors : KO
  - Ceci est le **7e tick consécutif avec cécité DB** (depuis 10h21, ~92 min)
- Supabase RLS denied (15 min) : INCONNU — MCP hors service
- Slow queries : INCONNU — MCP hors service
- Auth errors : INCONNU — MCP hors service
- Active sessions : INCONNU — MCP hors service
- Advisors : INCONNU — MCP hors service

## Note IDs Vercel

IDs corrects confirmés (via .vercel/project.json) :
- projectId : prj_u3jR0YiNr2WnCFEoG6g1yDShikdH
- orgId/teamId : team_pvVKFJWG6CnjUNDRi6weZkLX

IDs précédents (prj_BO4bxfTMbRFWBYfpOFxAOjZb0bSH / team_ydPAFEpKvTMO2oFk78HkNoxW) → 403 Forbidden.
Vercel MCP maintenant fonctionnel avec les bons IDs.

## Contexte historique (ticks précédents)

- 10h21 WARN : Supabase MCP bloqué première fois
- 10h37 HARD : escalade (cécité DB + anomalie)
- 10h52 HARD : escalade (cécité DB persistante)
- 11h07 WARN : MCP toujours bloqué
- 11h22 WARN : MCP toujours bloqué
- 11h37 WARN : MCP toujours bloqué
- 11h53 : MCP toujours bloqué (token Supabase à renouveler — Omar notifié)

## Vercel Deployments (20 derniers)

Tous les 20 derniers deployments sont en état READY.
Aucun deployment FAILED ou building en cours.
Activite recente dense ce matin (quick-260520-124 jury V3/V4 : 10+ deploys entre ~08h30 et ~10h00 UTC).

## Verdict

WARN — Vercel nominal (0 erreur runtime, deploy READY), HTTP PROD 200 en 342ms.
Cécité DB Supabase MCP persistante (92 min, 7 ticks). Action requise Omar : renouveler token Supabase MCP.
Pas de re-spawn prepper (situation connue, deja escaladée).

**Prochain tick : J1-12h08**
