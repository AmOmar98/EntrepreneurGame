# Phase 11 — UI Check Verdict (gsd-ui-checker)

**Date** : 2026-05-10
**Plan** : `.planning/phases/11-design-audit-refinements/11-01-PLAN.md`
**Audit source** : `.planning/ui-reviews/AUDIT-DESIGN-V2-VS-IMPL-2026-05-10.md`
**Framework** : 6 dimensions (hierarchy, density, affordance, consistency, a11y, perf)
**Mode** : pre-execution audit, read-only

---

## Per-item verdict

### Wave A — CSS-only

| ID | Verdict | Rationale (1 line) |
|---|---|---|
| A1 | PASS | Shimmer cap = pure decorative `::after`, design source `player-screens.jsx:122-129` matches; align with existing `.eic-track__fill` (globals.css:1577) — token consistency OK. |
| A2 | FLAG | Mount keyframe must be guarded by `@media (prefers-reduced-motion: no-preference)` AND not loop (one-shot via `animation-fill-mode: forwards`) — plan mentions guard but missing fill-mode constraint. |
| A3 | FLAG | Stagger via `--node-delay` adds N inline styles (1 per node × ~7 nodes); confirm tab-order unaffected (visual delay must NOT delay focusability — use `animation-delay`, never `transition-delay` on opacity that hides from AT). |
| A4 | PASS | `topbar-lite.tsx` confirmed missing both pills (`Pitch · 17h00` + `Mentor disponible`) — verified by direct read. Add as static for v0.2 then dynamicize in v0.3. |

### Wave B — Animation / scroll

| ID | Verdict | Rationale |
|---|---|---|
| B1 | FLAG | `scrollIntoView({ behavior:'smooth' })` ignores `prefers-reduced-motion` natively in Safari < 17 — wrap with `matchMedia` check or pass `behavior: motionOK ? 'smooth' : 'auto'`. Also: keyboard users on Tab should NOT trigger scroll-to-hero (effect must depend on `next.template.id` not focus). |
| B2 | PASS | `scroll-snap-type: y proximity` (not `mandatory`) preserves keyboard nav; `scroll-margin-top:30vh` is correct for sticky-topbar offset. Mobile-only via `@media (max-width:720px)` — zero desktop impact. |
| B3 | FLAG | IntersectionObserver is the right call (CSS `view()` timeline is Chrome 115+ only, Safari 18 partial — NOT safe for pilot 13/05). Reveal threshold should be `0.15` not `0.5` (mobile 390px = small viewport, half-section reveal too late). Hook MUST fall-back to `is-revealed` immediately when `prefers-reduced-motion: reduce` — no observer attached. Bundle cost: ~0.5KB, negligible. |
| B4 | PASS | SVG dashed lines between concurrent teams = data-driven, no perf risk on 6-15 teams. R1-safe (no score visible, just activity correlation). |
| B5 | PASS | `compact` prop on hero CTA via CSS `@media` is correct pattern; design source `player-screens.jsx` HeroCTA prop confirms the intent. |

### Wave C — Logic / UX

| ID | Verdict | Rationale |
|---|---|---|
| C1 | **BLOCK** | **No `landing.jsx` exists in `.planning/design-v2/project/`** — verified via `ls`. Audit cites `landing.jsx (chat2)` but only `chat1.md` exists in `.planning/design-v2/chats/`. The "3 doors + AgreenTech kicker" layout is reconstructed from chat memory, not a source artifact. At T-1 (2.5 days to pilot), 150 lines of new public landing UX without a pixel reference is high-risk for design drift. **Defer to v0.3** OR ship a minimal text-only landing (2 paragraphs + "Connexion" CTA) without 3 doors / mascot / hills. Auth-flow change (root `/` redirect chain) also requires `middleware.ts` smoke test on Vercel preview — not in PLAN. |
| C2 | PASS | `app/journey/page.tsx:29-32` confirmed via direct read: `getCurrentUser()` then `redirect("/login")` — exact regression pattern flagged in CLAUDE.md `feedback_dual_mode_demo_guard.md`. Wrap with `if (hasSupabaseEnv())` is the correct fix. Low UI surface impact, high demo-mode value. |
| C3 | FLAG | Locked-level softening is a genuine R3 affordance improvement vs current `cursor:not-allowed` (which violates affordance — appears clickable from hover scale). Existing tooltip CSS already in place (`.eic-track__node-tooltip`, globals.css:1689-1726) — just needs JS click handler to open drawer in read-only mode. Confirm drawer "locked variant" copy via advisor (R2 warn-only, no `disabled` button). Risk: if drawer animation overlays current focus ring, keyboard users lose anchor. |

### Wave D

| ID | Verdict | Rationale |
|---|---|---|
| D1 | PASS | Comment-only, R1 protective. Cite `feedback_eic_cardinal_rules.md` + design leak source line (`player-screens.jsx:71-72`) in the comment for future-Claude traceability. |

---

## Cross-cutting findings

1. **a11y guards inconsistent** : A2/B1/B3 all need explicit `prefers-reduced-motion` handling; PLAN says "reduced-motion guards on every new keyframe" but doesn't specify the JS-side `matchMedia` for `scrollIntoView` (B1) or observer fallback (B3). Add to acceptance criteria.
2. **Token consistency OK** : Wave A reuses `var(--eic-blue)`, `var(--eic-green)` tokens already defined; no new tokens introduced. Existing `.eic-track*` namespace preserved.
3. **Performance** : Wave A+B combined adds ~0.8KB CSS + ~30 lines JS. Negligible on Lighthouse. No layout thrash if observer uses `transform`+`opacity` only (not `height`/`top`).
4. **Information density mobile 390px** : B3 reveal animations + B5 compact hero are net positive (less simultaneous content); B2 scroll-snap reduces cognitive load. Combined Wave B mobile DX = improvement.
5. **Hierarchy preserved** : No item changes primary-CTA visibility, focal point, or color hierarchy. R1 (no score Player-side) intact across all 13 items.

---

## Global verdict

**Status** : **APPROVED with 1 BLOCK + 5 FLAGs**

- **A1, A4, B2, B4, B5, C2, D1** → execute as-planned (PASS, 7 items).
- **A2, A3, B1, B3, C3** → execute with the FLAG remediations folded into acceptance criteria (5 items).
- **C1** → **BLOCK**. Defer to v0.3 OR downscope to text-only minimal landing within Phase 11. Source artifact missing, T-1 risk too high for 150-line greenfield UX without pixel reference.

**Recommended execution** : Waves A + B + D + C2 + C3 = 12/13 items shipped. C1 deferred to `deferred-items.md` per PLAN risk-gating clause 5.

