# J1 · 10h21 · TICK · WARN

## Checks

| # | Check | Résultat | Statut |
|---|---|---|---|
| 1 | PROD home | 307 · 222ms (redirect normal /, auth gère) | OK |
| 2 | Vercel 5xx (15 min) | 0 — aucun error-level sur 15 min | OK |
| 3 | Vercel build / deploy | READY · commit d601409 · deploy ~09h10 ce matin | OK |
| 4 | Supabase RLS denied | NON DISPONIBLE — Supabase MCP permission denied | WARN |
| 5 | Slow queries | NON DISPONIBLE — Supabase MCP permission denied | WARN |
| 6 | Auth errors Supabase | NON DISPONIBLE — Supabase MCP permission denied | WARN |
| 7 | Active sessions | NON DISPONIBLE — Supabase MCP permission denied | WARN |
| 8 | Advisors | NON DISPONIBLE — Supabase MCP permission denied | WARN |

## Notes

- PROD home : la racine `/` retourne 307 (redirect vers /login ou /journey selon auth) — comportement attendu, pas une erreur.
- Vercel runtime logs (1h écoulée) : 2 entrées `AuthApiError: Invalid` sur GET `/` et GET `/login` à 08h33. Probablement un utilisateur avec token expiré ou mauvais password. Volume = 2 en 1h, seuil WARN = 1-4 sur 15 min — non dépassé sur la fenêtre 15 min, anodin.
- Deploy PROD : dernière mise en prod = commit d601409 (smoke docs jury V4 verdict pills), sha signé Omar, région cdg1, état READY. Aucun build en cours.
- Supabase MCP : toutes les calls (`get_logs`, `get_advisors`, `execute_sql`) retournent `MCP error -32600: You do not have permission to perform this action`. Cela empêche la surveillance des checks 4-8. Il ne s'agit pas d'une panne PROD visible (l'app répond), mais d'une dégradation de l'observabilité du watcher.

## ⚠️ Warnings

- **Supabase MCP inaccessible** : checks 4-8 non exécutables ce tick. Causes possibles : token MCP expiré, changement de permissions projet Supabase, ou problème transitoire. L'app semble fonctionnelle (Vercel répond, 0 erreurs 5xx), mais RLS denied / slow queries / sessions ne peuvent pas être confirmés.
  → Vérifier que le MCP Supabase est correctement authentifié (token valide). Si le prochain tick montre le même problème, escalade HARD.
- **AuthApiError x2 à 08h33** : 2 erreurs auth en 1h sur `/` et `/login` — volume faible, probablement un utilisateur avec session expirée ou mauvais credentials. A surveiller au prochain tick.

## Verdict

**WARN** — Vercel PROD sain, 0 erreur 5xx, deploy READY. Observabilité Supabase dégradée (MCP permission denied sur tous les outils). Pas de signe de panne visible côté app.

Prochain tick : J1-10h36.

---
*Watcher invoqué : 2026-05-20 10h21 | SHA deploy actif : d601409*
