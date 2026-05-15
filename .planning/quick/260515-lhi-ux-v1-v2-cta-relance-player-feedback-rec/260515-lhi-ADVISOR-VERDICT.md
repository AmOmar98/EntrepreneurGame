---
quick_id: 260515-lhi
advisor: eic-pedagogical-advisor
date: 2026-05-15
status: PASS
cardinal_summary:
  R1: PASS
  R2: N/A
  R3: PASS
---

# Advisor Verdict — Quick 260515-lhi (ux-v1-v2-cta-relance-player)

**Verdict: PASS**

Hotfix-eligible: YES — copy/UX fix on an existing CTA, no schema/validator/scoring change, addresses a real pilot incident (4 V1 stuck in `verdict='request_v2'` during AgreenTech 13-14/05).

## Files

- `components/journey-deliverable-card.tsx` (lines 56, 95-100)
- `lib/i18n.ts` (2 new keys × 2 locales)

## Porteur impact

CTA on `feedback_received` cards becomes action-oriented ("Compléter ma V2") + adds a soft hint "Mentor attend ta V2". Pushes V1→V2 completion **without gating**. No layout shift, same href, same `showAction: true`.

## R1 (score/rank invisible Player hors détail livrable)

**CHECKED — PASS.** Diff touches `actionLabel` (string), `getHint` (string), and 2 i18n keys. Zero numeric/score/rank/percentile token introduced. The card lives in `/journey` index (R1 hot zone) but the new strings carry no evaluation signal. Lexical grep on the proposed strings ("Compléter ma V2", "Mentor attend ta V2") = clean.

## R2 (validators warn-only)

**N/A.** No validator, no Zod schema, no server action touched. Submission flow unchanged.

## R3 (no hardcoded mission blocking)

**CHECKED — PASS.** `showAction: true` preserved, `actionVariant: "amber"` preserved, no `disabled`, no `redirect`, no `notFound`, no middleware gate, no RLS change. The `feedback_received → submitted_v2` path through `RevisionPanel` on `/journey/deliverable/[id]` is untouched. Forbidden field grep (`blocks_progression_to|requires|dependsOn|gatedBy|prerequisite|lockedUntil`) = clean.

7-mission structure: untouched. Scoring 0.20/0.80: untouched. Bonus amounts: untouched.

## Pedagogical risk review

- **"Compléter ma V2"** — possessive "ma" = ownership, verb "compléter" = continuation (not "refaire"/"corriger" which would shame). Tone OK for EIC.
- **"Mentor attend ta V2"** — soft social pressure, factual, no urgency/red flag. Comparable in tone to "En revue . Mentor assigné" already in use. Acceptable.

Non-blocking suggestion (FLAG-grade) : consider "Mentor a hâte de voir ta V2" for warmer register, but current wording is fine — keep it short to fit under the pill.

## Non-blocking nits

1. **Accent convention** : `lib/i18n.ts` line 217 ("assigne" without accent) is ASCII-safe per CLAUDE.md convention, BUT the `journey_v2_*` block uses accents on lines 220-224. Pick one and stay consistent within the namespace. **Decision orchestrator** : keep accents (consistent with `journey_v2_*` neighbors).
2. **EN parity** : ensure the `en` dictionary block in `lib/i18n.ts` gets both new keys with EN values, otherwise TS will fail typecheck (dictionaries typed as `Record<keyof fr, string>`).

## Suggested

Ship as proposed. Ship it.

## Verdict line

**PASS** — surgical 3-line + 2-key fix targeting a documented pilot failure mode (4 V1 abandoned). No cardinal rule touched. Matches the spirit of R3 (pull via hint, not push via lock).
