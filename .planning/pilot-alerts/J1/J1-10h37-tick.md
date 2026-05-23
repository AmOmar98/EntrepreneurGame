# J1 · 10h37 · TICK · HARD

## Trigger
MCP permissions entierement bloquees (403 / permission denied) sur TOUS les outils de monitoring :
- Vercel `get_runtime_logs` : **403 Forbidden** — "You don't have permission to access this resource."
- Vercel `list_deployments` : **403 Forbidden** — "Not authorized"
- Supabase `get_logs` (postgres) : **MCP error -32600 — You do not have permission**
- Supabase `get_logs` (auth) : **MCP error -32600 — You do not have permission**
- Supabase `execute_sql` : **MCP error -32600 — You do not have permission**
- Supabase `get_advisors` (security) : **MCP error -32600 — You do not have permission**
- Supabase `get_advisors` (performance) : **MCP error -32600 — You do not have permission**

**Seuil HARD atteint** : escalade decidee au tick precedent (J1-10h21) — si meme erreur MCP au tick suivant => HARD.

## Ce qui a pu etre verifie (sans MCP)

| Check | Resultat | Methode |
|---|---|---|
| PROD home HTTP | **307 · 0.93s** — OK (redirect vers /login, comportement attendu) | curl direct |
| Vercel 5xx (15 min) | **INCONNU** — MCP bloque | - |
| Vercel deploy status | **INCONNU** — MCP bloque | - |
| Supabase RLS denied | **INCONNU** — MCP bloque | - |
| Slow queries | **INCONNU** — MCP bloque | - |
| Auth errors | **INCONNU** — MCP bloque | - |
| Active sessions | **INCONNU** — MCP bloque | - |
| Advisors | **INCONNU** — MCP bloque | - |

## Evaluation du risque

- Le site est joignable (HTTP 307 en 0.93s = normal, redirect auth Supabase).
- L'impossibilite de surveiller les logs pendant J1 live est un risque operationnel reel :
  - Aucune visibilite sur erreurs 5xx, timeouts, echecs auth, slow queries.
  - Si un bug silencieux impacte les Players, il sera detecte trop tard.
- La panne MCP est soit un probleme de credentials/token expire, soit un probleme de scope de permissions API.

## Cause probable

Tokens API Vercel et/ou Supabase MCP expires ou permissions insuffisantes. Ces tokens sont configures dans l'environnement Claude Code — ils ne se renouvellent pas automatiquement.

## Action prise

- PushNotification envoyee a Omar.
- Spawn pilot-hotfix-prepper avec ce contexte.

## Prochaine etape

Voir `.planning/pilot-alerts/J1-10h37-hotfix-prep.md` quand le prepper aura fini (~2 min).

**Verdict** : HARD · surveillance aveugle — intervention manuelle requise sur tokens MCP · prochain tick J1-10h52.
