---
quick_id: 260515-lhi
slug: ux-v1-v2-cta-relance-player-feedback-rec
date: 2026-05-15
status: ready-for-execution
advisor_verdict: PASS (R1 PASS / R2 N/A / R3 PASS)
must_haves:
  truths:
    - "CTA `feedback_received` actuel = 'Voir le feedback' (passif) → 4 V1 bloqués pendant le pilote"
    - "Convention i18n.ts = ASCII-safe (pas d'accents) — utiliser 'Completer ma V2' / 'Mentor attend ta V2'"
    - "Zone sensible /journey → advisor PASS obtenu"
    - "Path V2 (RevisionPanel sur /journey/deliverable/[id]) inchangé"
  artifacts:
    - "260515-lhi-PLAN.md"
    - "260515-lhi-CONTEXT.md"
    - "260515-lhi-ADVISOR-VERDICT.md (PASS)"
    - "260515-lhi-SUMMARY.md"
    - "deferred-items.md"
  key_links:
    - "components/journey-deliverable-card.tsx:56 (actionLabel)"
    - "components/journey-deliverable-card.tsx:95-100 (getHint)"
    - "lib/i18n.ts (FR + EN dictionaries)"
---

# Quick 260515-lhi — UX V1→V2 CTA relance Player

## Context

Voir `260515-lhi-CONTEXT.md`. Décisions verrouillées via discuss-phase :
- CTA "Completer ma V2" (ASCII-safe)
- Hint "Mentor attend ta V2"
- Smoke local manuel via `npm run dev`

## R1/R2/R3

Advisor verdict **PASS** (260515-lhi-ADVISOR-VERDICT.md). Aucun signal R1/R2/R3 introduit.

## Tasks

| # | Task | Files | Verify | Done |
|---|------|-------|--------|------|
| 1 | Ajouter 2 clés i18n FR | `lib/i18n.ts` (~ligne 215) | grep "Completer ma V2" + "Mentor attend ta V2" présents | OK |
| 2 | Ajouter 2 clés i18n EN | `lib/i18n.ts` (~ligne 956) | grep "Complete my V2" + "Mentor is waiting" présents | OK |
| 3 | Changer `actionLabel` feedback_received | `components/journey-deliverable-card.tsx:56` | grep `journey_v2_action_complete_v2` dans STATUS_META | OK |
| 4 | Ajouter cas `feedback_received` dans `getHint` | `components/journey-deliverable-card.tsx:95-100` | hint affiché pour ce statut | OK |
| 5 | `npm run typecheck && npm run lint && npm run build` | (CI checks) | exit 0 sur les 3 | OK |
| 6 | Smoke local `npm run dev` + login P01 → /journey | (manuel) | Player voit CTA "Completer ma V2" + hint sur 2 livrables `feedback_received` | OK |
| 7 | Commit atomique + push origin main | git | commit hash + push success | OK |

## Wording exact (ASCII-safe)

```ts
// FR (vers ligne 215, après journey_v2_action_view_feedback)
journey_v2_action_complete_v2: "Completer ma V2",
journey_v2_hint_mentor_waiting_v2: "Mentor attend ta V2",

// EN (vers ligne 956, après journey_v2_action_view_feedback)
journey_v2_action_complete_v2: "Complete my V2",
journey_v2_hint_mentor_waiting_v2: "Mentor is waiting for your V2",
```

## Code changes

### `components/journey-deliverable-card.tsx`

Ligne 56 :
```diff
   feedback_received: {
     label: t.journey_status_feedback_received,
     tone: "amber",
-    actionLabel: t.journey_v2_action_view_feedback,
+    actionLabel: t.journey_v2_action_complete_v2,
     actionVariant: "amber",
     showAction: true,
   },
```

Ligne 95-100 :
```diff
 // PLR-08 hint for in-review state. "Mentor assigne" is a Phase 7 placeholder.
 function getHint(status: Status): string | null {
   if (status === "submitted_v1" || status === "submitted_v2") {
     return t.journey_v2_hint_in_review;
   }
+  if (status === "feedback_received") {
+    return t.journey_v2_hint_mentor_waiting_v2;
+  }
   return null;
 }
```

## Smoke

```bash
npm run dev
# Open http://localhost:3000 → /login → P01 demo creds
# Navigate to /journey
# Confirm: BMC + persona cards (statut feedback_received) show:
#   - Pill ambre "Feedback recu"
#   - Button "Completer ma V2" (amber variant)
#   - Hint text "Mentor attend ta V2"
```

## Rollback

```bash
git revert <commit-sha>  # 1 commit atomique
```

Ou plus chirurgical : revert manuel des 3 emplacements (i18n.ts × 4 lignes + journey-deliverable-card.tsx × 2 endroits).

## Deferred

Aucun item différé. Autres hotfixes (sync CLAUDE.md AppRole + audit onboarding p03/p06) restent à enchaîner via quicks séparés (capturés dans `260515-gu4/deferred-items.md`).
