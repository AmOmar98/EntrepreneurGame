# Phase 6 SMOKE — EIC Design v2 Foundation

**Run AFTER all 4 plans (06-01..06-04) execute and commit.**
Operator: Omar. Time budget: ~10 minutes on local dev.

## Setup

```bash
npm run dev
# Wait for "Ready on http://localhost:3000"
```

## Checklist

### /login (DSY-06)
- [ ] Background is ivory/cream (#F6F1E8 family), not white, not slate
- [ ] EICLogo lockup top-left: square blue mark with white serif "E" + green dot bottom-right, then "EIC" + "INNOVATION CENTER" kicker
- [ ] Title in serif (Baskervville) — NOT Inter/system sans
- [ ] Subtitle (.lead class) in Montserrat 20px muted
- [ ] Glass card centered, max-width 460px, slightly translucent (aurora visible behind it)
- [ ] Submit button is solid blue (#1B3A5C), full-width, label "Se connecter"
- [ ] Partner banner anchored bottom: 6 names in serif uppercase (TAMWILCOM / BANK OF AFRICA ACADEMY / INNOV INVEST / BLUESPACE / EIC / UEMF)
- [ ] Caption below banner in green uppercase tracking
- [ ] Submit a credential — login behavior identical to v0.1 (correct redirect or i18n error message)

### /journey — Player variant (DSY-05)
- [ ] NO sidebar visible — TopbarLite at top with EICLogo + brand text + "Mon parcours" link + logout button
- [ ] Resize browser to <1100px → bottom tab bar appears with single "Parcours" tab
- [ ] Resize back >=1100px → bottom tab bar disappears

### /onboarding — Player variant + hideTabBar (DSY-05)
- [ ] TopbarLite visible at top
- [ ] NO bottom tab bar even at viewport <1100px

### /admin, /mentor, /jury, /results — Staff variant (DSY-05)
- [ ] Sidebar visible (left column 276px)
- [ ] Sidebar background = deep blue #1B3A5C (--eic-blue), NOT slate #0B2545 (--brand-primary)
- [ ] All v0.1 page contents render unchanged (no functional regression)

### Backdrop-filter fallback (DSY-03)
- [ ] DevTools → Rendering → "Emulate CSS feature: backdrop-filter" → set to "unsupported" (or use Chrome <90 UA)
- [ ] Refresh /login → glass card becomes opaque white (~92%); form fully usable, no transparency-induced unreadability

### Font self-hosting (DSY-02)
- [ ] DevTools → Network tab → reload /login
- [ ] NO request to fonts.googleapis.com
- [ ] Font files served from /_next/static/media/...woff2 (Baskervville + Montserrat)

### Reduced motion (DSY-04)
- [ ] DevTools → Rendering → emulate prefers-reduced-motion: reduce
- [ ] (Phase 6 has no LevelBadge in production yet — this check applies once Phase 7 ships PLR-01-02. Note: when testable later, the LevelBadge.is-current pulse must NOT animate.)

### Build artifacts (DSY-07)
```bash
npm run typecheck   # exit 0
npm run lint        # no NEW warnings vs v0.1-pilot-ready baseline
npm run build       # succeeds
```

## Verdict

- [ ] All boxes ticked → Phase 6 PASS, proceed to /gsd-execute-phase 7
- [ ] Any unchecked → describe regression, run /gsd-plan-phase 6 --gaps
