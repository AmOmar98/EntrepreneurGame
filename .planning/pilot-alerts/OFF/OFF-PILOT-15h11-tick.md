# OFF-PILOT · 15h11 · TICK · WARN

> Date : 2026-05-23 (hors fenetre pilote J1/J2/J3 — post-Digi-Hackathon)
> Tick #5 de la session advisors triple migration (quick C + D1 + D2 + D3)

---

## Checks

| # | Check | Resultat | Statut |
|---|---|---|---|
| 1 | PROD home HTTP | 307/redirect → 200 · 1.02s total | VERT (< 1.5s ; 307 attendu = redirect /login) |
| 2 | Vercel 5xx (15 min) | MCP 403 — non evaluable | DEGRADE |
| 3 | Vercel deploy status | MCP 403 — non evaluable | DEGRADE |
| 4 | Supabase RLS denied | MCP -32600 — non evaluable | DEGRADE |
| 5 | Slow queries | MCP -32600 — non evaluable | DEGRADE |
| 6 | Auth errors | MCP -32600 — non evaluable | DEGRADE |
| 7 | Active sessions | MCP -32600 execute_sql — non evaluable | DEGRADE |
| 8 | Advisors security | MCP -32600 — non evaluable | DEGRADE |
| 8b | Advisors performance | MCP -32600 — non evaluable | DEGRADE |

Signal positif : `/login` direct 200 · 0.22s (excellent). PROD servie et rapide.

---

## Etat MCP ce tick

### Supabase MCP
- `get_logs` postgres → `MCP error -32600: You do not have permission to perform this action`
- `get_logs` auth → idem
- `execute_sql` sessions count → idem
- `get_advisors` security → idem

5e expiration token Supabase MCP confirmee. Pattern stable : duree de vie ~1h. **Reconnexion via Settings > MCP requise.**

### Vercel MCP
- `get_runtime_logs` → 403 Forbidden
- `list_deployments` → 403 re-authenticate required
- `get_deployment` → 403 re-authenticate required

Token Vercel egalement expire. **Reconnexion Vercel MCP requise en meme temps.**

---

## Statut deploy tick precedent (cd3efcd, docs-only)

Deploy `dpl_2Nq79EqiCysy5pRVZx2krik4bPgj` etait INITIALIZING au tick 15h01.
- Verification directe impossible (Vercel MCP KO).
- Proxy : PROD `/login` repond 200 · 0.22s → la plateforme est servie, pas de degradation visible.
- Deploy docs-only (artefacts quick C+D1+D2+D3 + STATE.md) : zero risque fonctionnel meme si build echoue.

---

## Objectifs session non verifies (5e iteration consecutive)

| Objectif | Attendu | Statut verification |
|---|---|---|
| Advisors security post-D3 | ≤ 12 WARN (11 `authenticated_secdef` + 1 `leaked_pwd`) | **IMPOSSIBLE — MCP expire** |
| Advisors perf post-D2 | 0 `auth_rls_initplan` | **IMPOSSIBLE — MCP expire** |
| Zero `permission denied for table announcements` post-C | 0 erreur | **IMPOSSIBLE — postgres logs MCP expire** |

Ces 3 verifications sont le coeur de la session. Elles n'ont pas pu etre executees depuis le tick 14h33 (4 ticks consecutifs en degradation MCP).

---

## Comparaison session

| Tick | Heure | PROD | Vercel MCP | Supabase MCP | Verdict |
|---|---|---|---|---|---|
| #1 | 12h46 | OK | KO | KO | WARN |
| #2 | 12h51 | OK | KO | OK (partiel) | WARN |
| #3 | 14h33 | OK | OK | KO (expire ~1h) | WARN |
| #4 | 15h01 | OK | KO | KO | WARN |
| #5 | 15h11 | OK | KO | KO | WARN |

Pattern : les deux MCP ont une duree de vie independante (~1h). Jamais les deux simultanément disponibles depuis tick #3.

---

## Recommandation

Reconnexion simultanee des deux MCP (Settings > MCP > Supabase + Vercel) avant le prochain tick. C'est la seule action bloquante pour conclure la session de validation post-D3.

**Advisors attendus post-reconnexion** :
- Security : exactement 12 WARN ou moins (11 `authenticated_secdef` residuels + 1 `leaked_pwd`) — tout chiffre > 12 ou nouvelle categorie = flag immediate.
- Performance : `auth_rls_initplan` = 0 — la moindre occurrence = regression D2 a investiguer.
- Zero `permission denied for table announcements` dans postgres logs = validation quick C.

---

**Verdict** : WARN · Les deux MCP expires (checks #2-#8 indisponibles) · PROD reachable et rapide (200 · 1.02s) · Aucune degradation fonctionnelle visible
**Prochain tick** : apres reconnexion simultanee Supabase + Vercel MCP.
