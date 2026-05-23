# J1 · 12h05 · TICK · WARN

## Checks

- PROD home (suivant redirects) : 200 · 441ms (nominal)
- PROD home (brute, avant redirect) : 307 · 361ms (redirect auth attendu)
- Vercel 5xx (15 min) : 0
- Vercel errors (15 min) : 2 x AuthApiError "Invalid..." sur GET /login + GET /journey ← normal (session expirée ou token invalide, non bloquant)
- Deploy status : READY · commit d601409 · "docs(quick-260520-124): smoke V4 verdict pills + Brouillon + V3 régression"
- Supabase RLS denied (15 min) : AVEUGLE — MCP -32600 (cécité connue, token à renouveler)
- Slow queries : AVEUGLE — MCP -32600
- Auth errors : AVEUGLE — MCP -32600
- Active sessions : AVEUGLE — MCP -32600
- Advisors : AVEUGLE — MCP -32600

## ⚠️ Warnings (non-bloquant)

- Supabase MCP bloqué : -32600 "You do not have permission to perform this action"
  Affecte : get_logs (postgres, auth), execute_sql (sessions), get_advisors.
  Statut : cécité DB totale depuis ~10h21 (8e tick consécutif, ~105 min cumulés).
  Situation connue d'Omar. Aucune escalade HARD — pas de nouveau trigger.
  Action requise : renouveler le token Supabase MCP dans la config Claude Code.

- Vercel runtime errors : 2 AuthApiError sur /login + /journey à 10h56
  Nature probable : session expirée d'un Player revenant en salle (normale en J1).
  Pas de 5xx, pas de timeout, pas de TypeError applicatif.

## Vercel deploy nominal

Dernier deploy READY : d601409 (docs quick-260520-124 smoke V4).
Aucun deploy en cours. Aucun deploy FAILED dans les 20 derniers.

**Verdict** : WARN (cécité Supabase persistante) · prochain tick 12h20

> Note J1 jury-readiness : /jury V4 + verdict pills + brouillon/valider en PROD depuis ce matin.
> pitch_mode_state actuel inconnu (MCP aveugle) — vérifier manuellement si pitch prévu aujourd'hui.
