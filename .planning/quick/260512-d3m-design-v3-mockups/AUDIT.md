# Quick 260512-d3m · AUDIT

## Cardinaux R1/R2/R3

### R1 — Score Player-facing
**Verdict** : ✅ PASS (zones touchées 100% GM)

Surfaces modifiées :
- `/admin?live=1` (GM seulement, redirect to /login si non-GM)
- `AdminTeamFocus` modal (ouvert depuis `/admin` uniquement)
- `AdminAchievementUnlocked` overlay (déclenché depuis `AdminTeamFocus`)

Aucun composant Player-facing touché (`app/journey/*`, `app/results/*`, `components/journey-*`, `components/results-*`, `components/submission-*`) — vérifié par scope du diff.

### R2 — Validators warn-only
**Verdict** : ✅ N/A (aucun validator ajouté)

### R3 — Blocage inter-mission
**Verdict** : ✅ N/A (aucun gating ajouté)

## Dual-mode demo

**Verdict** : ✅ PASS

Vérifié :
- `app/admin/page.tsx:42-46` `emptySnapshot` inclut `pendingQueue: []` → demo mode reste navigable sans Supabase.
- `lib/admin-live.ts:112-120` continue à retourner `empty` (avec `pendingQueue: []`) quand `createClient()` renvoie null.
- Pas de `redirect("/login")` ou `getCurrentUser()` ajouté avant un check `hasSupabaseEnv()`.

## Audit grep R1

```
grep -rn "score\|rank\|/100\|/140\|points" components/admin-leaderboard-live.tsx components/admin-review-queue.tsx components/admin-toast-stack.tsx components/admin-achievement-unlocked.tsx
```

Résultats attendus → tous dans des composants GM-only :
- `admin-leaderboard-live.tsx` : `team.scoreProject` rendu OK (GM-only)
- `admin-achievement-unlocked.tsx` : `rank` affiché OK (GM-only)
- `admin-review-queue.tsx` : pas de score/rank
- `admin-toast-stack.tsx` : pas de score/rank

## Diff stats

```
Wave 1 :  9 files changed, 957 insertions(+), 25 deletions(-)
Wave 2+3: 3 files changed, 573 insertions(+), 61 deletions(-)
TOTAL  : 12 files changed, 1530 insertions(+), 86 deletions(-)
```

## Performance

- `lib/admin-live.ts` ajoute **1 round-trip Supabase** (`SELECT id,title,slug FROM deliverable_templates WHERE id IN (...)`) seulement si `pendingTplIds.length > 0`. Volume pilote: max ~24 templates, négligeable.
- `AdminLiveView` rend 3 composants supplémentaires (Leaderboard, ReviewQueue, ToastStack) — purement client-side, pas d'overhead serveur.

## Risques résiduels

1. **CSS pollution** : +~630 lignes `app/globals.css`. Préfixes `eic-live-*`, `eic-achievement__*`, `eic-admin-focus--v3` isolent les nouveaux selectors. Aucune collision avec l'existant repéré.
2. **AdminLiveView nouveau layout pas testé en runtime** : build prod OK mais admin nécessite auth pour smoke visuel. À valider par Omar.
3. **Approximation Élan/Combo** : si une équipe a 0 entry dans `activity` last-hour, affiche `—` plutôt qu'un fake nombre. Comportement OK.
