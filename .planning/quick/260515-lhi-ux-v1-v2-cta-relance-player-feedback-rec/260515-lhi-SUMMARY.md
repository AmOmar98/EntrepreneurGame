---
quick_id: 260515-lhi
slug: ux-v1-v2-cta-relance-player-feedback-rec
date: 2026-05-15
status: shipped
commit: 29e67ba
pushed: true
advisor_verdict: PASS
---

# Quick 260515-lhi — UX V1→V2 CTA relance Player : SHIPPED

## Context

Pendant le pilote AgreenTech 13-14/05, 4 V1 sont restées bloquées en `verdict='request_v2'` sans V2 remise (p01 ×2 BMC + persona, p02 ×2 BMC + persona). Cartographie 260515-gu4 a montré que le CTA `feedback_received` était "Voir le feedback" (`journey_v2_action_view_feedback`) — passif, descriptif, n'incite pas à la resoumission.

Hotfix surgical pour le prochain event (post-pilote, milestone v0.3).

## Decisions (via --discuss)

- **CTA** : "Completer ma V2" (FR) / "Complete my V2" (EN) — possessif "ma" = appropriation, verbe "completer" = continuation (pas "refaire" qui shame).
- **Hint** : "Mentor attend ta V2" / "Mentor is waiting for your V2" — pression sociale douce, factuelle.
- **Convention ASCII-safe** : pas d'accents (cohérent avec le bloc `journey_v2_*` voisin).
- **Smoke** : local manuel `npm run dev` + login P01.

## R1/R2/R3 (Advisor PASS)

- **R1** PASS : aucun token score/rang/percentile introduit. Lexical grep clean.
- **R2** N/A : pas de validator.
- **R3** PASS : `showAction: true` préservé, `actionVariant: "amber"` préservé, aucun `disabled` / `redirect` / blocage progression. Path V2 via `RevisionPanel` sur `/journey/deliverable/[id]` inchangé.
- **Pédagogie** : wording chaleureux (possessif "ma", verbe "completer"), pas de pression toxique.

Voir `260515-lhi-ADVISOR-VERDICT.md`.

## Execution

### Files changed (2 fichiers, 8 insertions / 1 deletion)

- `components/journey-deliverable-card.tsx`
  - Ligne 56 : `actionLabel: t.journey_v2_action_view_feedback` → `actionLabel: t.journey_v2_action_complete_v2`
  - Lignes 96-100 (`getHint`) : ajout d'un cas `feedback_received` → `t.journey_v2_hint_mentor_waiting_v2`
- `lib/i18n.ts`
  - FR dict (~ligne 215) : ajout `journey_v2_action_complete_v2: "Completer ma V2"` + `journey_v2_hint_mentor_waiting_v2: "Mentor attend ta V2"`
  - EN dict (~ligne 956) : ajout `journey_v2_action_complete_v2: "Complete my V2"` + `journey_v2_hint_mentor_waiting_v2: "Mentor is waiting for your V2"`

### Validation

- `npm run typecheck` : exit 0
- `npm run lint` : exit 0
- `npm run build` : exit 0 (toutes routes compilées, `/journey` 4.9 kB / 139 kB First Load JS)
- **Smoke local** : Omar confirme visuellement le CTA + hint sur `localhost:3004/journey` avec P01

### Commit & Push

- Commit `29e67ba` — `fix(journey): CTA action-oriented + hint sur livrable feedback_received`
- Push `67c027f..29e67ba main -> main` (origin main)
- Vercel auto-deploy déclenché

## Risks / Rollback

- **Risque** : nul. Modif purement copy + 1 cas dans `getHint`. Aucun changement de comportement DOM hors le texte affiché.
- **Rollback** : `git revert 29e67ba` (1 commit atomique).
- **Compat** : aucune migration DB, aucune breaking change i18n (clés ajoutées, pas modifiées).

## Deferred

Voir `deferred-items.md`. Les 2 autres hotfixes post-pilote (sync CLAUDE.md AppRole + audit onboarding p03/p06) restent à enchaîner via quicks séparés.

## Refs

- `components/journey-deliverable-card.tsx:53-58, 95-103`
- `lib/i18n.ts:215-217, 956-959`
- `260515-gu4-SUMMARY.md` (rétro pilote — origine du diagnostic)
- `260515-lhi-CONTEXT.md` (décisions discuss-phase)
- `260515-lhi-ADVISOR-VERDICT.md` (PASS)
