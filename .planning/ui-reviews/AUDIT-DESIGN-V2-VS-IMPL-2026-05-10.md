# Audit Design v2 (bundle Anthropic Claude Design) ↔ Implementation

**Date** : 2026-05-10
**Source bundle** : `https://api.anthropic.com/v1/design/h/K51XAT4-oUPwu3nylq7W8A` (extracted in `.planning/design-v2/project/`)
**Auditor** : Claude Code (read-only, no edits)
**Purpose** : Identify what was implemented faithfully and what needs refinement before pilot AgreenTech 13-14 mai 2026.

---

## Bundle composition

- README + 3 chat transcripts (chat1 wireframes v2, chat2 landing rework, chat3 motion graphic 60s)
- 19 `.jsx` prototype files + 2 CSS (`eic-tokens.css`, `wf-base.css`) + assets
- README states explicitly: "recreate them pixel-perfectly in whatever technology" — not a 1:1 copy mandate
- Final design decisions in chat1 : barre verticale "charging" (mobile ascendant, desktop descendant) + hero CTA unique + drawer + glass + aurora

---

## Findings — fidélité haute (✅ done right)

| Zone | Design source | Implementation | Status |
|---|---|---|---|
| Tokens | `eic-tokens.css` | `app/eic-tokens.css` + `app/globals.css` | 1:1 |
| Charging bar | `player-screens.jsx:89-191` ChargingBar | `journey-track.tsx` + `.eic-track*` (globals.css 1560-1717) | 1:1 except shimmer cap |
| Glass + aurora | `wf-glass`, `wf-aurora`, `@supports` fallback | `.eic-glass*` (882-924), `.eic-aurora` (926-960) | 1:1 |
| Submission ticket | `player-flows.jsx` celebration overlay | `submission-ticket.tsx` | 1:1 |
| Pixel mascot 4 moods | `pixel-mascot.jsx` | `pixel-mascot.tsx` + `pixel-mascot-player.tsx` (extended w/ loading\|error) | Plus complete than design |
| System frames | `system-frames.jsx` | `components/system/Sys*.tsx` + `menu/SideMenu.tsx` + `app/settings/` | 1:1 on 6 frames |
| Mentor "no chat" async | chat1 explicit constraint | `mentor-link-card.tsx` + `mentor-comments-list.tsx` + composer + history | Cardinal preserved |
| GM live mode + radar | `admin-screens.jsx` | `admin-live-view.tsx` + `admin-radar.tsx` + `admin-team-circle.tsx` | 1:1 |
| GM team focus editorial | `admin-screens.jsx` AdminFocus | `admin-team-focus.tsx` | 1:1 |
| Jury pitch theater | `gm-flows.jsx` GMPitchJury | `jury-pitch-theater.tsx` + grid + timer + queue | 1:1 (form variant) |
| Results replay | `gm-flows.jsx` GMReplay | `results-podium.tsx` + stats + timeline + replay | 1:1 |
| Pitch prep H-2 | `player-extras.jsx` PitchPrep | `components/pitch-prep/PitchPrep.tsx` | 1:1 |
| Stuck help | `player-extras.jsx` StuckHelp | `components/help/StuckHelp.tsx` | 1:1 |
| Reduced motion | `wf-pulse` etc. | 15 occurrences `prefers-reduced-motion` covering 13 keyframes | Good a11y |
| Touch hit area | (not in design) | `.eic-track__node::before inset:-10px` under `@media (pointer:coarse)` | Better than design (WCAG 2.5.5) |

---

## Refinements — 13 items prioritized

### Wave A — CSS only, zero risk (no advisor required)

#### A1. Shimmer cap absent on `.eic-track__fill` top
- **Design** : `player-screens.jsx:118-125` ellipse radial `rgba(76,175,80,0.6)` at fill top
- **Code** : `globals.css:1577-1587` no `::after`
- **Refinement** : add `::after` with `radial-gradient` 10px ellipse at top of fill
- **Risk** : zero (visual only, no DOM change)
- **Files** : `app/globals.css`
- **Effort** : ~10 lines CSS

#### A2. Fill mount animation missing
- **Design** : "charging" metaphor implies build-up at first paint
- **Code** : `transition:height var(--transition-slow)` only on state change
- **Refinement** : add `@keyframes eic-track-charge` 0% → progressPct, 600ms ease-out, gated by `prefers-reduced-motion`
- **Risk** : zero
- **Files** : `app/globals.css` (add keyframe + class)
- **Effort** : ~15 lines CSS

#### A3. `.eic-track__node` first-paint stagger
- **Design implicit** : nodes appear sequentially as fill progresses
- **Code** : all nodes paint at once
- **Refinement** : add `--node-delay` custom prop set inline by `journey-level-node.tsx`, then CSS `animation-delay: var(--node-delay)` on nodes
- **Risk** : zero (CSS + 1 inline style)
- **Files** : `app/globals.css` + `components/journey-level-node.tsx` (add `style={{ '--node-delay': ... }}`)
- **Effort** : ~20 lines

#### A4. Topbar lite : pills `Pitch · 17h00` + `Mentor disponible` audit
- **Design** : `player-screens.jsx:68-87` two pills + avatar in topbar
- **Code** : `topbar-lite.tsx` to verify
- **Refinement** : audit only — verify both pills present, add if missing
- **Risk** : zero (one component edit)
- **Files** : `components/topbar-lite.tsx`
- **Effort** : audit + ~10 lines if missing

### Wave B — Animation / scroll layer, low risk

#### B1. Smooth-scroll to hero CTA after navigation
- **Design implicit** : "un seul CTA primaire visible à la fois"
- **Code** : no `scrollIntoView` anywhere in `app/`/`components/`
- **Refinement** : `useEffect` in `journey-client.tsx` triggering `heroRef.current?.scrollIntoView({ behavior:'smooth', block:'center' })` on `next.template.id` change
- **Risk** : low (1 ref + 1 effect)
- **Files** : `components/journey-client.tsx` + `journey-hero-next-step.tsx` (forward ref)
- **Effort** : ~25 lines

#### B2. Mobile track scroll-snap
- **Design** : 520px height on mobile, no snap
- **Code** : no scroll-snap on track container
- **Refinement** : `scroll-snap-type:y proximity` on `.eic-journey__track-col` mobile breakpoint + `scroll-margin-top:30vh` on `.eic-track__node.is-current`
- **Risk** : low (CSS only on mobile)
- **Files** : `app/globals.css`
- **Effort** : ~10 lines

#### B3. IntersectionObserver reveal on `/results`
- **Design** : podium → stats strip → timeline progressive reveal (Apple-style cf chat3)
- **Code** : no `IntersectionObserver` anywhere
- **Refinement** : `useInView` hook (no library, native API) on `results-podium`, `results-stats-strip`, `results-timeline-moments` ; CSS class `is-revealed` triggers fade+translate
- **Risk** : low-medium (3 components touched)
- **Files** : `hooks/use-in-view.ts` (new) + 3 components + globals.css
- **Effort** : ~80 lines

#### B4. GM radar : dashed lines between simultaneously-active teams
- **Design** : `admin-screens.jsx` AdminRoom mentions inter-team dashed connections
- **Code** : `admin-radar.tsx` — verify, likely missing
- **Refinement** : SVG `<line strokeDasharray="3 3">` between two team circles when both active in same 30s window
- **Risk** : low (SVG only)
- **Files** : `components/admin-radar.tsx`
- **Effort** : ~30 lines

#### B5. Hero CTA compact mode (mobile)
- **Design** : `HeroCTA({ compact=false })` two modes
- **Code** : `journey-hero-next-step.tsx` to verify
- **Refinement** : add `compact` prop wired to `<= 720px` breakpoint via CSS `@media`
- **Risk** : low
- **Files** : `components/journey-hero-next-step.tsx` + globals.css
- **Effort** : ~20 lines

### Wave C — Logic / UX, advisor REQUIRED

#### C1. Public landing page (3 role doors)
- **Design** : `landing.jsx` (chat2, "boring" reaction caused simplification but final 3-door layout still in source)
- **Code** : `app/page.tsx:4-8` only redirects ; no public landing
- **Refinement** : new `app/(public)/landing/page.tsx` with 3 role doors (Player blue / Mentor green / GM red), AgreenTech kicker, optional Pixel mascot bubble. Root `/` redirects to `/landing` if not authenticated (instead of `/login` directly).
- **Risk** : MEDIUM — touches auth flow root, must preserve middleware behavior
- **R1/R2/R3 check required** : Pixel mascot bubble OK (not score-bearing). 3 doors OK (no progression). AgreenTech kicker OK.
- **Files** : `app/page.tsx`, `app/landing/page.tsx` (new), `middleware.ts` (verify), `lib/i18n.ts` (copy keys)
- **Effort** : ~150 lines + CSS

#### C2. Dual-mode demo guard regression on `/journey`
- **CLAUDE.md Pre-edit guard** : "jamais redirect("/login") ou getCurrentUser() avant check hasSupabaseEnv()"
- **Code** : `app/journey/page.tsx:29-32` calls `getCurrentUser()` then `redirect("/login")` if null. In demo mode, `getCurrentUser()` returns null → redirect → demo broken.
- **Refinement** : audit + fix. Wrap with `if (hasSupabaseEnv()) { if (!user) redirect } else { use seed fallback }`
- **Risk** : MEDIUM — auth flow change
- **R1/R2/R3 check** : auth-related, not direct cardinal but reactivates demo mode (used for swarm test harness)
- **Files** : `app/journey/page.tsx` (verify ; possibly already correct via middleware delegation)
- **Effort** : ~10 lines after audit

#### C3. Locked-level click ignored (R3 conflict)
- **Design** : `player-screens.jsx:154` `onClick={()=> !locked && setOpened(l.id)}`
- **Code** : `journey-track.tsx:114` `onClick={() => state !== "locked" && onLevelClick?.(id)}` — clicks ignored on locked
- **R3 violation** : "pas de blocage inter-mission codé en dur — pas de `disabled` DOM"
- **Refinement** : allow click on locked → opens drawer with amber tooltip explanation, no progression but no hard-stop either
- **Risk** : MEDIUM (changes interaction model)
- **R1/R2/R3 check required** : explicit R3 fix
- **Files** : `components/journey-track.tsx` + `components/journey-drawer.tsx` (locked variant)
- **Effort** : ~40 lines

### Wave D — Cardinal rules audit

#### D1. Topbar XP display gating
- **Design source has potential R1 leak** : `player-screens.jsx:71-72` shows `TOTAL_XP_DONE / 2000` in topbar
- **Code** : `journey-client.tsx:122-124` shows `${totalEarnedXp} XP` (no rank, no /total)
- **Decision** : preserve current implementation. Do NOT port the design's `/2000` denominator (would imply ranking/comparison frame).
- **Refinement** : add explicit comment on `journey-client.tsx:122` warning future-Claude not to add `/totalXp` denominator. Reference R1.
- **Risk** : zero (comment only)
- **Files** : `components/journey-client.tsx`
- **Effort** : ~3 lines

---

## Cardinal rules summary on design source

The design bundle does NOT automatically enforce R1/R2/R3:
- **R1 leak risk** : `player-screens.jsx:71-72` `TOTAL_XP / 2000` in topbar — DO NOT PORT
- **R2 OK** : amber tooltip pattern matches warn-only
- **R3 conflict** : `cursor:not-allowed` + click ignored on locked — needs softening (cf. C3)

**Implication** : every refinement that touches Player-facing surfaces (`app/journey/`, `components/journey-*`, `components/results-*`, `app/page.tsx`) MUST be validated by `eic-pedagogical-advisor` before edit, per CLAUDE.md `Pre-edit guards`.

---

## Out of scope for Phase 11

- Variants jury (radar / dial / token allocation) : design explored 4 variants, only "form" implemented. User confirmed in chat1 "form is good". Document as choix produit.
- Motion graphic 60s spot (chat3) : promotional asset, not in-app feature. Out of scope.
- Hills SVG silhouette + AgreenTech leaf pattern (chat2 landing) : depends on C1 decision.
- Dog mascot (LandingDog SVG) : depends on C1 decision.

---

## References

- Bundle source : `.planning/design-v2/project/` (extracted from Anthropic Design API)
- Pre-edit guards : `CLAUDE.md` § Pre-edit guards (R1/R2/R3)
- Advisor agent : `.claude/agents/eic-pedagogical-advisor.md`
- Memory entries : `feedback_eic_cardinal_rules.md`, `feedback_dual_mode_demo_guard.md`
