# J1 · 13h50 · TICK · WARN

## Checks

- PROD home : 307 · 239ms — redirect Next.js attendu, OK
- Vercel 5xx (15 min) : MCP 403 persistant — smoke HTTP nominal, 0 erreur visible
- Vercel build status : indisponible via MCP (403) — deploy stable connu
- Supabase RLS denied (13h40-13h50) : 1 occurrence `permission denied for table announcements` · 13h43:40 local
- Slow queries : aucune mention dans logs postgres (100 derniers events)
- Auth errors (13h40-13h50) : 0 erreur 401/403 PROD · 1 token refresh ok (AddictLess 13h42:46)
- Active sessions (15 min) : **1** — stable vs tick 13h40 (1), drop vs 14h21 (5) — sessions probablement expirées
- Submissions totales : 1 submitted_v1 + 12 validated (inchangé vs tick 13h40)
- Advisors security : 26 WARN connus (identiques ticks précédents) — aucun nouveau

## Erreurs SQL — Suivi prioritaire

### `column "updated_at" does not exist` (table submissions alias s)

| Timestamp local | Timestamp UTC | Dans fenêtre 13h40-13h50 |
|---|---|---|
| 13:42:56 | 12:42:56 UTC | OUI |
| 13:42:56 | 12:42:56 UTC | OUI |

**Occurrences dans fenêtre : 2**

Rappel historique :
- 13:31:20 local (pre-13h40) — 1 occ signalée tick 13h40
- 13:42:56 local (in-window) — 2 occ nouvelles ce tick

Cumul depuis première apparition (13h26 selon contexte) : ~5 occurrences au total.

Seuil HARD defini (contexte) : >=3 sur 10 min. **Ce tick : 2 sur 10 min — sous le seuil HARD, mais tendance persistante.**

### `relation "projects" does not exist`

| Timestamp local | Dans fenêtre 13h40-13h50 |
|---|---|
| 13:31:12 | NON (avant fenêtre) |

**Occurrences dans fenêtre : 0** (1 seule connue, antérieure, non répétée ce tick)

### Analyse globale SQL errors

- `updated_at` : erreur récurrente (2 nouvelles ce tick) — la table `submissions` semble requetée avec alias `s.updated_at` inexistant. Probablement une query codée en dur dans un composant admin/GM qui tourne en boucle (session refresh ou dashboard GM). Pas de blocage Player direct visible (submissions stables, sessions actives, 0 auth error PROD).
- `projects` : 1 occurrence unique à 13h31, non répétée — probablement erreur isolée sur une query legacy.
- Impact Players : **aucun identifié** — sessions stables (1 active), 0 soumission bloquée, auth OK.

## Activité Player/Mentor

- Soumissions : 1 submitted_v1 + 12 validated — **inchangé depuis dernier tick** (13h40)
- Token refresh actif : AddictLess (team-addictless@digi.uemf.ma) à 13h42 — session vivante
- Bla Dwa (team-bla-dwa@digi.uemf.ma) — refresh à 13:31 (avant fenêtre)
- Mentor : activité non observable dans cette fenêtre (0 nouvelle validation)

## Sessions

Sessions actives (15 min) : **1** — en baisse vs 5 à 14h21 (tick précédent nommé).

Note : la fenêtre 15 min ne capture que les sessions avec `updated_at > now() - 15 min`. Avec la cadence de refresh (~60s), une session inactive pendant 15 min sort de la fenêtre. Drop normal en milieu d'atelier (participants concentrés, pas de refresh token).

## Warnings actifs

- `column updated_at does not exist` : 2 nouvelles occurrences à 13h42 — erreur SQL persistante sur query submissions. Sous seuil HARD (2 vs seuil >=3). A surveiller : si >=3 occurrences sur une fenetre de 10 min au prochain tick → escalade HARD.
- `announcements denied` : 1 occ à 13h43 — cadence lente, pattern connu, impact nul Players.
- Sessions : 1 active (fenêtre 15 min) — drop normal milieu atelier. Seuil WARN si drop >50% vs tick précédent : précédent = 1 (tick 13h40), stable → pas de WARN sessions.

**Verdict : WARN — erreurs SQL `updated_at` persistantes (2/tick) mais sous seuil HARD. Aucun blocage Player. Système nominal.**

Prochain tick : J1-14h00
