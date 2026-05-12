# Quick 260512-d3m · Design v3 mockups

**Branche** : `polish/design-v3-mockups`
**Date** : 2026-05-12 (T-1 pilote)
**Driver** : Omar
**Source** : 3 maquettes HTML fournies par l'utilisateur (snapshots Claude artifact)
- `Mode live _ toasts _ fil du jeu.html`
- `Accomplissement d_bloqu_.html`
- `Focus _quipe _ Atlas.html`

## Objectif

Aligner les 3 surfaces GameMaster (cockpit live, team-focus modal, accomplishment overlay) au plus proche des maquettes — **sans casser R1/R2/R3, sans modif schéma DB**.

## Scope (3 waves atomiques)

### Wave 1 — `/admin?live=1` (Mockup 1)

- `lib/admin-live.ts` : ajouter `pendingQueue: PendingReviewEntry[]` au snapshot (dérivé des submissions avec status `submitted_v1`/`submitted_v2`). **Global, non filtré par mentor assignment** (cf. spec utilisateur 2026-05-12).
- `components/admin-leaderboard-live.tsx` (nouveau) : liste classement col gauche
- `components/admin-review-queue.tsx` (nouveau) : liste file de revue col droite
- `components/admin-toast-stack.tsx` (nouveau) : 3 toasts top-right
- `components/admin-game-flow.tsx` : restyle vertical → horizontal scroll band
- `components/admin-live-view.tsx` : nouveau layout grid + insertion KPI strip + toast stack overlay
- `app/admin/page.tsx` : top bar pills "Pitch dans Xh Xmin / N équipes / N mentors en ligne" (via `hackStatus`)

### Wave 2 — `<AdminTeamFocus>` modal (Mockup 3)

- `components/admin-team-focus.tsx` : 
  - H1 split `{name}` + italic rose verb phrase dérivé `team.state` × rank
  - Stats grid 4 tuiles (XP / NIVEAU / ÉLAN / COMBO)
  - Activity entries en cards bordered par tone
  - Vertical level timeline watermark (decorative)
- `app/wf-components.css` : selectors restylés

### Wave 3 — Accomplishment unlocked overlay (Mockup 2)

- `components/admin-achievement-unlocked.tsx` (nouveau) : overlay full-screen
- Trigger : nouveau bouton dans `<AdminTeamFocus>` cta-row "🎉 Célébrer"
- Mascot bubble adaptée

## Skip explicite (cf. user message "fais sans si beaucoup de travail")

- ❌ Carte "Sami K. · mentor assigné" Mockup 3 → pas de champ `assignedMentor` dans `AdminLiveTeam`
- ❌ Auto-trigger Accomplishment Unlocked sur level-up event → manuel via bouton GM
- ❌ Numéros timeline level liés à entries activité spécifiques → timeline reste décorative
- ❌ Backend "Annoncer dans le live" sur Mockup 2 → bouton visuel uniquement, pas de wiring

## Cardinaux R1/R2/R3

- ✅ Surfaces GameMaster uniquement — pas de zone Player-facing touchée
- ✅ Score/rang visible OK ici (R1 autorise GM)
- ✅ Pas de validator ajouté → R2 N/A
- ✅ Pas de blocage inter-mission ajouté → R3 N/A

## Smoke

À chaque wave : `npm run typecheck && npm run lint && npm run build`
À la fin : smoke manuel `/admin?live=1` via Chrome MCP avec dev server local.

## Commits

1. `polish(design-v3): live mode dashboard restyle — Mockup 1`
2. `polish(design-v3): team focus modal restyle — Mockup 3`
3. `polish(design-v3): achievement unlocked overlay — Mockup 2`

## Push

Après smoke complet OK, push `origin polish/design-v3-mockups`. Merge sur main décidé par Omar après revue visuelle.
