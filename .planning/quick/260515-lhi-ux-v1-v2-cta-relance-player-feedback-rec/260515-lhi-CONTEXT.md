# Quick Task 260515-lhi: UX V1→V2 CTA relance Player — Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Task Boundary

Sur `/journey`, le CTA des livrables en statut `feedback_received` est actuellement "Voir le feedback" (passif). Pendant le pilote AgreenTech (13-14 mai 2026), 4 livrables V1 sont restés bloqués sans V2 remise (p01 ×2 BMC + persona, p02 ×2 BMC + persona) — signal que le CTA actuel n'est pas assez action-oriented pour pousser le porteur à compléter sa V2.

**Hotfix scope** (chirurgical, 3 lignes effectives) :
- `components/journey-deliverable-card.tsx:56` : changer `actionLabel` du statut `feedback_received` pour utiliser une nouvelle clé i18n action-oriented
- `components/journey-deliverable-card.tsx:96-100` : ajouter un cas dans `getHint(status)` pour `feedback_received` retournant un hint "Mentor attend ta V2"
- `lib/i18n.ts` : 2 nouvelles clés (FR + EN) — label CTA + hint

**Pas de changement** : status enum, server actions, RLS, scoring, types `JourneyDeliverable`, route `/journey/deliverable/[id]` (déjà fonctionnel pour V2 via `RevisionPanel`).

</domain>

<decisions>
## Implementation Decisions

### CTA label
- **"Compléter ma V2"** (FR) / **"Complete my V2"** (EN). Action-oriented + possessif (« ma » = appropriation). Court, lit bien à côté du pill ambre.
- Nouvelle clé i18n: `journey_v2_action_complete_v2`

### Hint contextuel
- **"Mentor attend ta V2"** (FR) / **"Mentor is waiting for your V2"** (EN). Pression sociale douce, court.
- Nouvelle clé i18n: `journey_v2_hint_mentor_waiting_v2`

### Smoke validation
- **Smoke manuel local** via `npm run dev` + login P01 (ou compte test demo) → vérifier que le CTA + hint s'affichent sur les 2 BMC/persona en `feedback_received`. ~5 min.

### Claude's Discretion
- Conserver `actionVariant: "amber"` (tonalité ambre = "à toi de jouer", cohérent avec memory `[[feedback_eic_cardinal_rules]]` qui prescrit ambre pour les états Player-actionables).
- Conserver `showAction: true`, `tone: "amber"`.
- Pas de changement du wording du pill (`journey_status_feedback_received` reste "Feedback reçu" / "Feedback received").

</decisions>

<specifics>
## Specific Ideas

- Référence du bug : 4 evaluations en `verdict='request_v2'` non resoumises observées sur PROD durant J1/J2 (cf. quick `260515-gu4` cartographie).
- Cible : éviter ce blocage lors du prochain event (post-pilote AgreenTech, milestone v0.3).

</specifics>

<canonical_refs>
## Canonical References

- `[[feedback_eic_cardinal_rules]]` (memory) — R1/R2/R3 cardinaux
- `[[feedback_dual_mode_demo_guard]]` (memory) — pas de redirect/getCurrentUser avant `hasSupabaseEnv()`
- `lib/journey.ts` — type `JourneyDeliverable.status`
- `components/journey-deliverable-card.tsx:31-81` — `STATUS_META` map
- `components/journey-deliverable-card.tsx:95-100` — `getHint(status)` helper
- `lib/i18n.ts:203, 214-215, 944, 955-956` — clés existantes journey_status_* / journey_v2_action_*

</canonical_refs>
