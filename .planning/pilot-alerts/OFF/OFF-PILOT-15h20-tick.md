# OFF-PILOT · 15h20 · TICK · WARN

> Date : 2026-05-23 (hors fenetre pilote J1/J2/J3 — post-Digi-Hackathon)
> Tick #6 de la session advisors triple migration (quick C + D1 + D2 + D3)

---

## Checks

| # | Check | Resultat | Statut |
|---|---|---|---|
| 1 | PROD home HTTP | 307 redirect → login · 0.80s total | VERT (< 1.5s ; 307 attendu) |
| 1b | /login direct | 200 · 1.62s | WARN limite (entre 1.5s et 3s) |
| 1c | /results | 307 redirect · 0.22s | VERT |
| 1d | /jury | 307 redirect · 0.25s | VERT |
| 2 | Vercel 5xx (15 min) | MCP 403 — non evaluable | DEGRADE |
| 3 | Vercel deploy status | MCP 403 — non evaluable | DEGRADE |
| 4 | Supabase RLS denied | MCP -32600 — non evaluable | DEGRADE |
| 5 | Slow queries | MCP -32600 — non evaluable | DEGRADE |
| 6 | Auth errors | MCP -32600 — non evaluable | DEGRADE |
| 7 | Active sessions | MCP -32600 execute_sql — non evaluable | DEGRADE |
| 8a | Advisors security | MCP -32600 — non evaluable | DEGRADE |
| 8b | Advisors performance | MCP -32600 — non evaluable | DEGRADE |

Note /login a 1.62s : legere degradation vs tick precedent (1.02s total avec redirect). Reste sous seuil HARD (3s). Probablement variabilite reseau normale.

---

## Etat MCP ce tick (6e iteration)

### Supabase MCP
- `get_logs` postgres → MCP -32600 permission denied
- `get_logs` auth → MCP -32600 permission denied
- `execute_sql` sessions count → MCP -32600 permission denied
- `get_advisors` security → MCP -32600 permission denied

**Token Supabase MCP toujours expire.** 6e tick consecutif en degradation Supabase.

### Vercel MCP
- `list_deployments` → 403 Forbidden (re-authenticate required)

**Token Vercel MCP toujours expire.**

---

## Tableau de bord session complete

| Tick | Heure | PROD | Vercel MCP | Supabase MCP | Verdict |
|---|---|---|---|---|---|
| #1 | 12h46 | OK | KO | KO | WARN |
| #2 | 12h51 | OK | KO | OK (partiel) | WARN |
| #3 | 14h33 | OK | OK | KO (expire ~1h) | WARN |
| #4 | 15h01 | OK | KO | KO | WARN |
| #5 | 15h11 | OK | KO | KO | WARN |
| #6 | 15h20 | OK (1.62s /login) | KO | KO | WARN |

Pattern confirme : duree de vie des tokens independante, ~1h. Les deux MCP sont expires depuis le tick #4 (15h01).

---

## Objectifs session (toujours en attente)

| Objectif | Attendu | Statut |
|---|---|---|
| Advisors security post-D3 | <= 12 WARN (11 `authenticated_secdef` + 1 `leaked_pwd`) | **IMPOSSIBLE — Supabase MCP expire** |
| Advisors perf post-D2 | 0 `auth_rls_initplan` | **IMPOSSIBLE — Supabase MCP expire** |
| Zero `permission denied for table announcements` post-C | 0 erreur | **IMPOSSIBLE — postgres logs MCP expire** |

---

## Recommandation finale

Les deux MCP (Supabase + Vercel) doivent etre reconnectes simultanement via Settings > MCP avant que ces verifications puissent aboutir. C'est le seul deblocage disponible — il n'y a aucune degradation PROD observable, uniquement une incapacite a valider les objectifs de session.

**Sequence de reconnexion conseillée :**
1. Settings > MCP > Supabase — se reconnecter
2. Settings > MCP > Vercel — se reconnecter
3. Lancer immediatement le prochain tick sans delai (tokens valides ~1h)

**Apres reconnexion, verifier dans l'ordre :**
- `get_advisors security` → total <= 12 et categorie = `authenticated_secdef` uniquement + 1 `leaked_pwd`
- `get_advisors performance` → zero `auth_rls_initplan`
- `get_logs postgres` → zero `permission denied for table announcements` dans les 24h

---

**Verdict** : WARN · Les deux MCP expires (checks #2-#8 indisponibles) · PROD reachable (307/200, temps corrects) · Aucune degradation fonctionnelle visible
**Prochain tick** : apres reconnexion simultanee Supabase + Vercel MCP (action requise de Omar).
