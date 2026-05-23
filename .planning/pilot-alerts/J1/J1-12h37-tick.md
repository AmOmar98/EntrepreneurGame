# J1 · 12h37 · TICK · WARN

## Etat MCP — restauration partielle

| MCP | Statut | Delta vs 12h22 |
|---|---|---|
| Vercel list_deployments | OK — token team_pvVKFJWG6CnjUNDRi6weZkLX valide | RESTAURE |
| Vercel runtime logs (error level) | OK — 0 erreur sur 15 min | RESTAURE |
| Supabase get_logs | BLOQUE — ZodError project_id format invalide | PERSISTE |
| Supabase execute_sql | BLOQUE — ZodError project_id format invalide | PERSISTE |

**Bilan** : Vercel MCP de retour. Supabase MCP toujours inaccessible (le project_id
`entrepreneur-game` est rejeté par le schema MCP — il attend un identifiant de 20
caractères lowercase). Cécité DB persistante : ~135 min depuis 10h21.

## Checks HTTP externes

| Route | HTTP | Latence | Verdict |
|---|---|---|---|
| `GET /` | 307 | 223ms | OK — redirect auth normale |
| `GET /login` | 200 | 271ms | OK |
| `GET /journey` | 307 | 222ms | OK — middleware auth actif |

Toutes latences bien sous le seuil WARN (1.5s). Pas de 5xx observable cote client.

## Checks Vercel instrumentes

| # | Check | Resultat |
|---|---|---|
| 2 | Vercel 5xx / erreurs runtime (15 min) | 0 — aucune erreur level=error sur la fenetre |
| 3 | Deploy status | READY — deploy `dpl_7XhvT3f9DHL8nebp4s3VWtztM3hB` · commit `d601409` |
| 3 (suite) | Dernier deploy | ~3h10 avant ce tick (depuis ~09h27 ce matin) · stable |

## Checks Supabase — INDISPONIBLES (Supabase MCP bloque)

| # | Check | Etat |
|---|---|---|
| 4 | RLS denied | inconnu — MCP bloque |
| 5 | Slow queries | inconnu — MCP bloque |
| 6 | Auth errors | inconnu — MCP bloque |
| 7 | Active sessions | inconnu — MCP bloque |
| 8 | Advisors | inconnu — MCP bloque |

## Classification

**WARN** — Vercel MCP restaure, 0 erreur runtime, PROD HTTP nominal.
Supabase MCP toujours bloque (cécite DB 135 min). Aucun seuil HARD triggere
sur les checks disponibles.

## Warnings actifs

- **Supabase MCP bloque** (15e tick consecutif ~135 min) : project_id
  `entrepreneur-game` est invalide pour le schema MCP Supabase (attend 20 chars
  lowercase). Omar doit verifier/corriger le project_id Supabase configure dans
  les settings MCP Claude Code. Ce n'est probablement pas une expiration de token
  mais un ID incorrect.
- **Checks DB aveugles** : RLS denied, slow queries, auth errors, sessions actives
  tous inconnus depuis 10h21. La surface HTTP PROD reste nominale — pas de signal
  d'alarme cote utilisateur, mais on vole sans visibilite DB.

## Contexte positif

- Vercel : 0 error log sur 15 min. Deploy READY stable depuis ~3h10. Pas de build
  en cours, pas de failed.
- HTTP PROD : latences <300ms stable sur les 3 derniers ticks.
- Aucun 5xx Client signale.

**Verdict** : WARN (Supabase MCP bloque — ID a corriger ; Vercel MCP restaure) · prochain tick 12h52
