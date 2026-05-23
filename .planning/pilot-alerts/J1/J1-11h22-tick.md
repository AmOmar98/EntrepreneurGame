# J1 · 11h22 · TICK · WARN

## Checks

- PROD home : 307 redirect · 228ms (login wall — normal, middleware Supabase actif)
- PROD /login : 200 · 825ms (stable, en dessous du seuil WARN 1.5s)
- PROD /journey : 307 · 224ms (redirect auth — normal)
- Vercel 5xx (15 min) : 0 — aucune erreur niveau error/fatal dans les logs runtime
- Vercel build status : READY · dernier deploy d601409 (docs smoke V4, ~11h09 local) — nominal
- Supabase RLS denied : INCONNU — MCP -32600 toujours bloqué (4e tick consécutif)
- Slow queries : INCONNU — MCP -32600
- Auth errors : INCONNU — MCP -32600
- Active sessions : INCONNU — MCP -32600
- Advisors : INCONNU — MCP -32600

## Contexte deploy

Dernier deploy PROD : `d601409` "docs(quick-260520-124): smoke V4 verdict pills + Brouillon + V3 régression"
Avant-dernier : `95f8532` feat jury V3/V4 — tous READY, aucun failed dans les 20 derniers deploys.

## Statut MCP Supabase

Bloqué sur -32600 "You do not have permission to perform this action" depuis tick 10h37.
Tous les outils Supabase impactés : get_logs, execute_sql, get_advisors.
Cause probable : token MCP expiré ou session Supabase CLI perdue.
Action Omar requise : renouveler le token Supabase MCP (Settings > Access Tokens dans dashboard Supabase, puis recharger Claude Code).

## Latence HTTP

Tick précédent (11h07) : latence non documentée mais signalée >1s.
Ce tick (11h22) : /login 200 en 825ms — retour sous le seuil WARN. Amelioration confirmée.

## Warnings actifs

- Cecite Supabase (4e tick) : impossible de verifier sessions, RLS, slow queries, auth errors.
  La plateforme tourne (Vercel OK, HTTP OK) mais on est aveugle sur la DB.
  Non-escalade HARD car ce n'est pas une regression nouvelle (connu depuis 10h37, Omar notifié).

**Verdict** : WARN (cecite Supabase persistante — action token requise) · prochain tick 11h37
