# OFF-PILOT · 14h33 · TICK · WARN

> Date : 2026-05-23 (post Digi-Hackathon J3). Hors fenêtre pilote J1/J2/J3.
> 3e tick de la journée. Contexte : fix-C appliqué (commit `e4416ee`) — policy
> `announcements_anon_select` + grants anon USAGE+SELECT.

---

## Résultats checks

| # | Check | Résultat | Statut |
|---|---|---|---|
| 1 | PROD home | 307 · 1134ms (redirect /login) | VERT |
| 2 | Vercel 5xx (15 min) | 0 erreur | VERT |
| 3 | Vercel build status | READY · commit `ad86675` (hotfix j2-bmc-access) · deploy il y a ~38h | VERT |
| 4 | Supabase RLS denied | MCP KO — token expiré (3e expiration consécutive) | WARN (infra) |
| 5 | Slow queries | MCP KO — non vérifiable | WARN (infra) |
| 6 | Auth errors | MCP KO — non vérifiable | WARN (infra) |
| 7 | Active sessions | MCP KO — non vérifiable | WARN (infra) |
| 8 | Advisors security/perf | MCP KO — non vérifiable | WARN (infra) |

---

## Detail check #1 — PROD home

- `GET /` → 307 redirect vers `/login` : comportement attendu (utilisateur non-auth).
- Temps : 1134ms — sous seuil WARN (1500ms). VERT.
- `GET /login` confirmé 200 · 1119ms (vérification secondaire tick précédent).

## Detail check #3 — Vercel build

- Dernier deploy : `dpl_8rMqSfx9ZkMLngTyYCy2EvcSbyN2`
- Commit : `ad86675` — "hotfix(j2-bmc-access): show past+today missions in Player journey"
- State : READY · région cdg1 · pusché ~2026-05-21
- Aucun deploy en cours ou failed détecté.

## Detail check #2 + #2b — Vercel runtime logs (2h window)

- Aucun log `error` / `fatal` / `warning` sur fenêtre 11h33–13h33 UTC.
- Aucun match `permission denied` sur fenêtre 11h33–13h33 UTC.
- Aucun match `announcements` sur fenêtre 11h33–13h33 UTC.
- **Conclusion fix-C** : zéro nouvelle erreur `permission denied for table announcements`
  détectée côté Vercel après 13h00 UTC. Fix tient sur la surface observable.

---

## Supabase MCP — statut token (contexte inter-ticks)

| Tick | Heure | Supabase MCP | Vercel MCP |
|---|---|---|---|
| T1 | 12h46 | KO (token expiré) | KO (team scope) |
| T2 | 12h51 | OK (reconnecté) | KO (team scope) |
| T3 | 14h33 | KO (ré-expiré) | OK (fonctionne) |

Le token Supabase MCP a une durée de vie très courte (~1h). La reconnexion effectuée au tick T2
a de nouveau expiré. Checks #4–#8 sont donc non-vérifiables ce tick.

Vercel MCP : contrairement à T1 et T2, le token Vercel fonctionne maintenant — les calls
`get_deployment` et `get_runtime_logs` ont répondu correctement. Le fix "team scope" semble
avoir été résolu entre T2 et T3, ou le token utilisé est différent.

---

## Bilan fix-C (`e4416ee` — policy `announcements_anon_select`)

**Vérification possible** : Vercel runtime logs (2h) — 0 nouvelle erreur.
**Non vérifiable** : Supabase postgres logs (MCP KO) — impossible de confirmer côté DB.

Les 2 erreurs historiques `permission denied for table announcements` (timestamps Unix
1779491137 et 1779488471, J3 matin ~10h-11h UTC) restent dans la fenêtre 24h des logs mais
sont antérieures au fix (`e4416ee` pushé post-13h00 UTC). Aucune nouvelle occurrence détectée
sur la surface Vercel.

Verdict partiel : fix-C apparaît stable sur observable Vercel. Confirmation DB-side nécessite
reconnexion token Supabase MCP.

---

## Warnings actifs (non-bloquants)

- **Supabase MCP token expiré** : 4 checks sur 8 non-vérifiables (RLS denied, slow queries,
  auth errors, sessions actives, advisors). Pas de signal HARD détecté côté Vercel en
  compensation.
- **Pilote clos** : on est OFF-PILOT — pas d'utilisateurs actifs attendus, donc l'absence
  de sessions n'est pas une anomalie.

---

## Verdict

**WARN** — infra monitoring dégradé (Supabase MCP KO), mais aucun signal HARD détecté sur
les surfaces observables (Vercel PROD, runtime logs 2h, build status).

---

## Recommandation prochaine action

| Option | Description | Priorité |
|---|---|---|
| **B — Reconnexion Supabase MCP** | Re-générer/re-coller le token Supabase MCP pour rétablir les checks #4–#8. Permet de confirmer fix-C côté DB (postgres logs). | **Recommandé maintenant** |
| **D — Stop monitoring** | Hackathon clos, aucun utilisateur actif. Arrêter les ticks jusqu'au prochain event. | Acceptable si Omar considère fix-C validé par Vercel logs seuls |
| **Attente passif** | Laisser le token expirer, reprendre au prochain event avec reconnexion fraîche. | Acceptable |

**Recommandation Omar** : si tu veux confirmer fix-C côté DB avant de considérer le dossier
clos, relancer la reconnexion Supabase MCP (option B) et faire un 4e tick ciblé uniquement
sur les postgres logs post-13h00 UTC. Sinon, les Vercel logs (0 erreur sur 2h) sont un signal
suffisamment fort pour considérer fix-C validé — option D.

Prochain tick si continue : OFF-PILOT-14h48.
