# J1 · 12h22 · TICK · WARN

## Etat MCP (persistant depuis tick 10h21)

| MCP | Statut |
|---|---|
| Vercel runtime logs | 403 Forbidden — token scope `team_NHfFqpSl6aqiWYVObGkxpUPh` non autorisé |
| Vercel list_deployments | 403 Forbidden — même cause |
| Supabase get_logs (auth) | -32600 You do not have permission |
| Supabase get_logs (postgres) | -32600 You do not have permission |
| Supabase execute_sql | -32600 You do not have permission |

**Cécité MCP totale** : ~120 min consécutifs (depuis 10h21). Aucun check DB ni Vercel instrumenté possible ce tick.

## Checks HTTP externes (actifs)

| Route | HTTP | Latence | Verdict |
|---|---|---|---|
| `GET /` | 307 (redirect auth) | 217ms | OK — redirect normale vers /login |
| `GET /journey` | 307 (redirect auth) | 278ms | OK — middleware auth actif |
| `GET /login` | 200 | 270ms | OK |

Toutes latences bien sous le seuil WARN (1.5s). Aucun code 5xx observable côté client.

## Checks instrumentes (MCP) — INDISPONIBLES

| # | Check | Etat |
|---|---|---|
| 2 | Vercel 5xx (15 min) | MCP 403 — inconnu |
| 3 | Vercel build/deploy status | MCP 403 — inconnu |
| 4 | Supabase RLS denied | MCP -32600 — inconnu |
| 5 | Slow queries | MCP -32600 — inconnu |
| 6 | Auth errors | MCP -32600 — inconnu |
| 7 | Active sessions | MCP -32600 — inconnu |
| 8 | Advisors | MCP -32600 — inconnu |

## Classification

**WARN** — cécité MCP prolongee (tokens Vercel + Supabase invalides), mais surface HTTP PROD nominale.

## Contexte historique

- Ticks precedents (11h07 → 12h07) : Vercel MCP nominal, 0 erreur runtime, deploy READY `d601409`.
- Supabase MCP bloqué sans interruption depuis 10h21 (9e tick consecutif).
- Ce tick : Vercel MCP aussi tombe en 403 — probable rotation/expiration du token Vercel.
- 2 AuthApiError benignes signalees tick precedent (sessions Players expirees — comportement normal J1).

## Warnings actifs

- **MCP Vercel 403** : nouveau ce tick — s'ajoute au bloc Supabase. Cause probable : token d'acces Vercel expire ou revoque. Action requise Omar : renouveler le token Vercel MCP dans les settings Claude Code.
- **MCP Supabase -32600** : 10e tick consecutif (~120 min). Action requise Omar : renouveler le token Supabase MCP.
- Sans MCP, les checks critiques (5xx, RLS denied, sessions actives) sont aveugles. La plateforme reste HTTP-reachable.

## Recommandation

Priorite 1 : renouveler les 2 tokens MCP (Vercel + Supabase) pour restaurer la visibilite DB + Vercel.
En attendant : surface HTTP PROD nominale, pas de signal d'alarme cote utilisateur.

**Verdict** : WARN (cécite MCP double — action token requise) · prochain tick 12h37
