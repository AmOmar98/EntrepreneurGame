# OFF-PILOT · 15h01 · TICK · WARN

> Date : 2026-05-23 (hors fenêtre pilote J1/J2/J3 — post-Digi-Hackathon)
> Tick #4 de la session advisors triple migration (quick C + D1 + D2 + D3)

---

## Checks

| # | Check | Resultat | Statut |
|---|---|---|---|
| 1 | PROD home HTTP | 307 · 1.45s | OK (307 = redirect /login, comportement attendu ; < 3s) |
| 2 | Vercel 5xx (15 min) | 0 | VERT |
| 3 | Vercel deploy status | INITIALIZING depuis 1.4 min (commit cd3efcd) | OK (< 5 min WARN) |
| 4 | Supabase RLS denied | MCP EXPIRE — impossible a evaluer | DEGRADE |
| 5 | Slow queries | MCP EXPIRE — impossible a evaluer | DEGRADE |
| 6 | Auth errors | MCP EXPIRE — impossible a evaluer | DEGRADE |
| 7 | Active sessions | MCP EXPIRE — execute_sql permission denied | DEGRADE |
| 8 | Advisors security | MCP EXPIRE — get_advisors permission denied | DEGRADE |
| 8b | Advisors performance | MCP EXPIRE — get_advisors permission denied | DEGRADE |

---

## Supabase MCP : token expire (4e fois)

- `get_logs` postgres → `MCP error -32600: You do not have permission to perform this action`
- `get_logs` auth → idem
- `get_advisors` security → idem
- `get_advisors` performance → idem
- `execute_sql` sessions count → idem

Pattern confirme : token Supabase MCP a duree de vie ~1h. Session courante > 1h depuis le tick 3 (14h33). Reconnexion via Settings > MCP requise avant prochain tick si verification Supabase necessaire.

---

## Vercel : deploy INITIALIZING en cours

- Deploy ID : `dpl_2Nq79EqiCysy5pRVZx2krik4bPgj`
- Commit : `cd3efcd` — `docs(quick-260523-kc2): advisors triple migration artifacts + STATE.md`
- Declenche a : 14h00:08 UTC (1.4 min avant ce tick)
- Build logs : vides (INITIALIZING, pas encore BUILDING)
- Previous READY : `dpl_8rMqSfx9ZkMLngTyYCy2EvcSbyN2` (commit `ad86675`, hotfix j2-bmc-access — il y a ~53.7h)
- Region : cdg1

Action : aucune — commit docs-only, build devrait passer en READY dans ~2-3 min. Surveiller au prochain tick.

---

## Contexte migrations post-14h30 (depuis tick 3)

Modifications PROD appliquees dans la session courante :

| Quick | Commit | Contenu | Statut verification |
|---|---|---|---|
| C `260523-hhy` | `e4416ee` | policy `announcements_anon_select` + grants USAGE/SELECT anon | MCP expire, non verifiable ce tick |
| D1 | `0c44b31` | SET search_path = '' sur 4 trigger functions | MCP expire, non verifiable ce tick |
| D2 | `2d09a52` | wrap auth.uid() en (SELECT) sur 5 RLS policies | MCP expire, non verifiable ce tick |
| D3 | `fe30c6b` | REVOKE EXECUTE FROM PUBLIC + GRANT TO authenticated sur 11 secdef functions | MCP expire, non verifiable ce tick |

Objectif declare (advisors attendus post-D3) :
- Security : <= 12 WARN (11 `authenticated_secdef` + 1 `leaked_pwd`) — **non verifiable ce tick**
- Performance : 0 `auth_rls_initplan` — **non verifiable ce tick**

---

## Warnings actifs

### W1 — Supabase MCP expire (4e token expiration ce jour)
- **Impact** : checks #4 #5 #6 #7 #8 impossibles. Toute regression post-migration D1/D2/D3 (RLS denied sur authenticated, slow query post-wrap) serait invisible.
- **Action recommandee** : reconnexion MCP avant prochain tick pour valider advisors security <= 12 et perf `auth_rls_initplan` = 0. C'est la verification cle de la session.
- **Risque** : FAIBLE — migrations sont des fixes de hardening (search_path, revoke execute), pas de changement logique applicatif. Probabilite de regression fonctionnelle basse.

### W2 — Deploy en cours, PROD sur ancienne version pendant ~3 min
- **Impact** : commit `cd3efcd` (docs-only, pas de changement code) — zero risque fonctionnel.
- **Action** : aucune.

---

## Comparaison tick 3 (14h33)

| Dimension | Tick 3 (14h33) | Tick 4 (15h01) |
|---|---|---|
| PROD home | OK | OK (307) |
| Vercel 5xx | 0 | 0 |
| Deploy | READY (`ad86675`) | INITIALIZING (`cd3efcd`, docs-only) |
| Supabase MCP | EXPIRE | EXPIRE (re-expire apres ~28 min) |
| Advisors | Non verifies (expire) | Non verifies (expire) |
| Verdict global | WARN (MCP expire) | WARN (MCP expire + deploy in-progress) |

Delta : aucune degradation applicative. Deploy docs-only in-progress benigni. Supabase MCP re-expire confirme le pattern ~1h.

---

**Verdict** : WARN · Supabase MCP expire (checks #4-#8 indisponibles) · Deploy INITIALIZING benigni
**Prochain tick recommande** : apres reconnexion MCP Supabase, pour valider advisors security/perf post-D3.
