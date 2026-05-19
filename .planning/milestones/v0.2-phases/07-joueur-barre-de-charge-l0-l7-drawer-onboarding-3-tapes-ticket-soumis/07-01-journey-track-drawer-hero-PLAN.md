---
phase: 7
plan: 01
title: Journey Track + Drawer + Hero (PLR-01 + PLR-02 + PLR-03 + PLR-04 + PLR-08)
created: 2026-05-10
status: planned
---

# Plan 07-01 — JourneyTrack + DeliverableDrawer + HeroNextStep

## Goal

Refondre `/journey` selon le wireframe `.planning/design-v2/project/player-screens.jsx` :
- Barre verticale L0→L7 (responsive : descendante desktop ≥1100px, ascendante mobile <1100px)
- Hero unique « Prochaine étape » avec UN seul CTA primaire visible
- Drawer latéral (~400px desktop, full-width mobile) au clic d'un niveau
- État « En revue » dans le drawer (timestamp + mentor assigné) — PLR-08

**Couplage atomique** : PLR-03 (hero) + PLR-04 (drawer) = 1 commit unique.

## Requirements couverts

- PLR-01 : barre verticale responsive
- PLR-02 : niveau courant pulsé bleu, faits verts, locked grisés/dashed
- PLR-03 : hero unique (UN seul CTA primaire)
- PLR-04 : drawer latéral avec missions/livrables, code Mx.y, titre, statut, reward XP
- PLR-08 : état « En revue · X min · Mentor Y. » dans le drawer

## Components à créer

1. `components/journey-track.tsx` — client component, barre verticale + nodes + pulse anim
2. `components/journey-level-node.tsx` — node individuel (current/done/locked states)
3. `components/journey-drawer.tsx` — drawer latéral avec missions/cards
4. `components/journey-deliverable-card.tsx` — card livrable individuelle (statuts: a_rendre/submitted_v1/feedback_received/etc.)
5. `components/journey-hero-next-step.tsx` — hero unique « Prochaine étape »
6. `components/journey-track-mobile.tsx` — variant mobile (ascendante)
7. `lib/journey-progression.ts` — helper pour calculer next-step + level state

## Files modifiés

- `app/journey/page.tsx` : refonte complète utilisant les nouveaux composants
- `lib/journey.ts` : ajouter `getNextStep()` + `getMentorForPlayer()` helpers
- `lib/i18n.ts` : ajouter clés FR pour nouveaux libellés

## Files conservés (backward compat)

- `components/journey-header.tsx`, `journey-timeline.tsx`, `journey-deliverables.tsx` : restent en code mais ne sont plus importés sur `/journey`. Conservés au cas où autre page les utilise — à supprimer après vérif zero usage en plan 07-04.

## Verification

- `npm run typecheck` clean
- `npm run lint` clean
- `npm run build` produit bundle valide
- Visuel : `/journey` affiche barre L0→L7 + hero + drawer fonctionnel
- Responsive : desktop ≥1100px descendante, <1100px ascendante
- PLR-08 : drawer affiche timestamp + nom mentor pour livrables submitted_v1 (`En revue · X min · [Mentor]`)
- v0.1 préservé : `/login`, `/mentor`, `/admin`, `/jury`, `/results` continuent à marcher
