# OFF-PILOT · 12h46 · TICK · WARN (MCP auth degraded)

> Date reelle : 2026-05-23. Hors fenetre pilote J1/J2/J3 (clos le 22/05).
> Invocation : dry-run post-event / smoke test reconnexion MCP apres fix-A.

---

## Checks executes

| # | Check | Resultat | Statut |
|---|---|---|---|
| 1 | PROD home | **307 · 1.397s** | OK (redirect 307 attendu sur `/`, time < 1.5s) |
| 2 | Vercel 5xx runtime logs | **403 Forbidden** — token scope insuffisant | INDISPONIBLE |
| 3 | Vercel build status (list_deployments) | **403 Forbidden** — `Not authorized: scope team_pSzfPqCUMFSVOCzDhJTXxFHq` | INDISPONIBLE |
| 4 | Supabase RLS denied (postgres logs) | **MCP error -32600: permission denied** | INDISPONIBLE |
| 5 | Slow queries (postgres logs) | **MCP error -32600: permission denied** | INDISPONIBLE |
| 6 | Auth errors (auth logs) | **MCP error -32600: permission denied** | INDISPONIBLE |
| 7 | Active sessions (execute_sql) | **MCP error -32600: permission denied** | INDISPONIBLE |
| 8 | Advisors | Non tente (Supabase MCP inaccessible) | INDISPONIBLE |

---

## Diagnostic MCP

**Vercel MCP** : erreur 403 sur `list_deployments` ET `get_runtime_logs`.
Message exact : `"Not authorized: Trying to access resource under scope team_pSzfPqCUMFSVOCzDhJTXxFHq. You must re-authenticate to this scope or use a token with access to this scope."`
Cause probable : token Vercel MCP expire ou revoque — reauth requise via `vercel login` ou rotation du token dans les settings MCP.

**Supabase MCP** : erreur `-32600 permission denied` sur `get_logs` ET `execute_sql`.
Cause probable : token Supabase MCP (service role ou personal access token) expire ou revoque — a renouveler dans Supabase Dashboard > Settings > API.

**PROD Vercel direct** : repond normalement (307 redirect en 1.4s). L'application tourne. Ce n'est PAS une panne infra — c'est exclusivement un probleme de credentials MCP.

---

## Verdict smoke test fix-A

- **PROD accessible** : oui (curl direct OK)
- **Vercel MCP** : KO — token a renouveler
- **Supabase MCP** : KO — token a renouveler
- **Reconnexion MCP validee** : NON — fix-A insuffisant ou tokens expires independamment

---

## Actions requises (Omar)

1. **Vercel** : aller dans https://vercel.com/account/tokens → verifier/renouveler le token utilise par le MCP Claude Code. Puis redemarrer Claude Code pour recharger le token.
2. **Supabase** : aller dans https://supabase.com/dashboard/account/tokens → verifier/renouveler le personal access token MCP. Ou verifier `project_id` dans `.mcp.json` si change.
3. Relancer ce tick apres reauth pour confirmer le smoke.

**Verdict** : OFF-PILOT · MCP auth degraded · PROD alive · prochain tick apres fix tokens.
