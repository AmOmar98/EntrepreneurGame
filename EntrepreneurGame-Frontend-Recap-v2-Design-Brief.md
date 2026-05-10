# Entrepreneur Game — Frontend Codebase Recap for v2 Design

**Prepared:** May 8, 2026
**Project:** EIC Venture Journey — Gamified entrepreneurship platform for UEMF/EIC
**Purpose:** Give a designer full context on the current v1 codebase so they can design a v2 upgrade without needing to read code.

---

## 1. What the Product Is

The Entrepreneur Game is a gamified incubation platform built for the EIC (Espace d'Innovation et de Créativité) at UEMF (Université Euromed de Fès, Morocco). It turns a 2-day Hack-Days bootcamp into a game where student/researcher teams ("Players") progress through 8 levels (L0–L7), complete missions (workshops), submit deliverables, get scored by Mentors, and compete for a final ranking after a pitch jury on day 2.

**Target users:** 6–15 student teams, 2–4 Mentors, 1 GameMaster (admin), plus external jury members and partner stakeholders (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace).

**Primary language:** French (with English translations available in code but UI defaults to French).

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.5 |
| UI Library | React | 19.2 |
| Language | TypeScript | 6.0 |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) | Latest |
| Validation | Zod | 4.4 |
| Icons | lucide-react | 0.577 |
| Styling | Custom CSS (vanilla, CSS variables) | — |
| Hosting | Vercel | — |
| Package Manager | npm | — |

**Notable absences:** No Tailwind CSS, no component library (shadcn, MUI, etc.), no animation library, no state management (beyond React's built-in hooks), no testing framework.

---

## 3. Project Structure (Folder Tree)

```
EntrepreneurGame/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (html lang="fr", imports globals.css)
│   ├── page.tsx                  # Root "/" — redirects based on role
│   ├── globals.css               # ALL styles (743 lines, single file)
│   ├── actions.ts                # All server actions (auth, onboarding, submission)
│   ├── login/page.tsx            # Login page (email/password)
│   ├── onboarding/page.tsx       # Player onboarding (Level 0 diagnostic)
│   ├── journey/
│   │   ├── page.tsx              # Player dashboard (missions + deliverables)
│   │   └── deliverable/[id]/page.tsx  # Individual deliverable detail + submission
│   ├── mentor/page.tsx           # Mentor page (placeholder — "Phase 3")
│   ├── admin/page.tsx            # GameMaster admin (placeholder — "Phase 4")
│   ├── player/[slug]/page.tsx    # Player public profile (placeholder — "Phase 4")
│   └── auth/callback/route.ts    # OAuth/magic-link callback handler
├── components/                   # Shared React components
│   ├── app-shell.tsx             # Layout shell (sidebar + main content area)
│   ├── journey-header.tsx        # Team name, level, score card
│   ├── journey-timeline.tsx      # Today's missions with time + status badges
│   ├── journey-deliverables.tsx  # Deliverable cards with status + action links
│   ├── onboarding-form.tsx       # Team name, idea, Likert diagnostic, member confirmation
│   ├── submission-form.tsx       # V1 proof submission (URL or text)
│   └── submission-readonly.tsx   # Read-only view of submitted proof
├── lib/                          # Shared logic & types
│   ├── types.ts                  # All TypeScript types (mirrors DB enums)
│   ├── auth.ts                   # getCurrentUser, getCurrentRole, role-based routing
│   ├── journey.ts                # Journey data fetching & status computation
│   ├── i18n.ts                   # FR/EN translation dictionaries
│   ├── icons.ts                  # Level & status icon mappings (lucide-react)
│   ├── score.ts                  # Score computation helpers
│   ├── supabase-status.ts        # Env check for Supabase availability
│   └── seed/                     # Seed data for DB (missions, deliverables, players)
├── utils/supabase/               # Supabase client setup
│   ├── server.ts                 # Server-side Supabase client (cookie-based)
│   └── middleware.ts             # Session refresh middleware
├── database/                     # SQL files
│   ├── schema.sql                # Full DB schema (enums, 11 tables, indexes)
│   ├── triggers.sql              # Score recalculation triggers
│   ├── rls.sql                   # Row-Level Security policies
│   ├── seed_bootcamp.sql         # Bootcamp event seed data
│   └── seed_event_hackdays.sql   # Hack-Days event seed
├── middleware.ts                  # Next.js middleware (session refresh)
├── ops/                          # Docker/Caddy deployment configs
├── screenshots/                  # UI storyboard reference images (7 PNGs)
└── docs/                         # Design specs
```

---

## 4. Pages/Routes — What Each Does

### Fully Implemented

| Route | Role | What It Does |
|-------|------|-------------|
| `/login` | All | Email + password login form. Minimal centered layout, no branding. Redirects to role-appropriate page on success. |
| `/` | All | Invisible redirect page — checks auth, then sends user to `/journey`, `/mentor`, or `/admin` based on their role. |
| `/onboarding` | Player | Level 0 diagnostic. Team name input, project idea textarea (500 char limit), 5-question Likert scale (1–5), team member confirmation checkboxes. On submit, marks player as onboarded and redirects to `/journey`. |
| `/journey` | Player | Main player dashboard. Shows a header card (team name, current level, project score), a timeline of today's scheduled missions with time and status badges (upcoming/in-progress/past), and a list of deliverables with status badges and action buttons. |
| `/journey/deliverable/[id]` | Player | Deliverable detail page. Shows the deliverable title, description, and rubric criteria with point values. If no submission exists, shows a form to submit proof (URL or markdown text). If already submitted, shows a read-only view with locked status banner. |

### Placeholder Pages (Shell Only)

| Route | Role | Current State |
|-------|------|--------------|
| `/mentor` | Mentor | Shows user email and role. Label says "Implementation Phase 3 (EVAL-*)". No evaluation UI yet. |
| `/admin` | GameMaster | Shows user email and role. Label says "Implementation Phase 4 (ADMIN-*)". No dashboard yet. |
| `/player/[slug]` | All | Static text "Player detail — Implementation Phase 4." |
| `/auth/callback` | System | Handles magic-link/OAuth code exchange. Functional but rarely used in pilot. |

---

## 5. Key Components & Their Purpose

### `AppShell` (app-shell.tsx)
The main layout wrapper used on every authenticated page. Renders a **dark green sidebar** (276px wide, sticky) with brand name, navigation links (role-dependent), and the main content area. Navigation items change based on role: Player sees "Mon parcours", Mentor sees "Evaluations", GameMaster sees "Admin". Collapses to single-column on screens below 1100px.

### `OnboardingForm` (onboarding-form.tsx)
Client component with React 19 `useActionState`. Collects team name, project idea (with live character counter), 5 Likert-scale radio groups for initial diagnostic, and a checklist of team members. On success redirects to `/journey`.

### `JourneyHeader` (journey-header.tsx)
Simple server component card showing the team name prominently, with current level label and project score below. Light gray background with subtle border.

### `JourneyTimeline` (journey-timeline.tsx)
Renders today's missions as a vertical list. Each mission row shows: scheduled time (monospace), a colored status pill badge (upcoming = gray, in-progress = green, past = slate), and the mission title.

### `JourneyDeliverables` (journey-deliverables.tsx)
Renders deliverable cards in a vertical stack. Each card shows: title, status badge (7 possible states with distinct colors), description text, and an action button linking to the deliverable detail page. Button label changes contextually ("Soumettre", "Voir V1", "Voir feedback", etc.).

### `SubmissionForm` (submission-form.tsx)
Client component for submitting V1 proof. Radio toggle between URL proof (with https:// validation) and text proof (textarea, 4000 char max). Submit button with loading state. On success, triggers a page refresh to show the read-only view.

### `SubmissionReadonly` (submission-readonly.tsx)
Displays a submitted proof in read-only mode. Shows a blue "locked" banner when awaiting mentor feedback, plus a definition list with status, submission date, proof type, and the actual proof content (clickable link or pre-formatted text block).

---

## 6. Current Design & Styling Approach

### Styling Method
**Everything is in a single `globals.css` file (743 lines).** No CSS modules, no Tailwind, no CSS-in-JS. Many components also use inline `style={{}}` props directly in JSX (especially the journey and submission components). This creates a split personality: some styling is in the CSS file via class names, some is hardcoded inline.

### CSS Architecture
- **CSS custom properties (variables)** defined on `:root` for the color palette
- **Utility-style class names** (`.button`, `.badge`, `.panel`, `.grid`, `.stack`, etc.)
- **Component-specific classes** (`.app-shell`, `.sidebar`, `.journey-phase`, `.quest-card`, etc.)
- **Two responsive breakpoints**: 1100px (tablet) and 640px (mobile)
- **No CSS naming convention** (not BEM, not utility-first — ad hoc names)

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#f6f4ef` | Page background (warm off-white/cream) |
| `--surface` | `#fffefa` | Card backgrounds |
| `--surface-strong` | `#ffffff` | Prominent card backgrounds |
| `--ink` | `#17211c` | Primary text (very dark green-black) |
| `--muted` | `#5e6a64` | Secondary text |
| `--line` | `#d9ddd3` | Borders |
| `--line-strong` | `#bdc8bd` | Stronger borders |
| `--green` | `#116149` | Primary accent, CTA buttons, active states |
| `--green-soft` | `#d9eee5` | Green badges background |
| `--blue` | `#215d8f` | Secondary accent |
| `--blue-soft` | `#dcebf6` | Blue badges background |
| `--red` | `#a63d2f` | Error states, rejected badges |
| `--red-soft` | `#f4ded9` | Red badges background |
| `--gold` | `#91640e` | Warning states, "due" badges |
| `--gold-soft` | `#f3e8c8` | Gold badges background |
| `--teal` | `#096d75` | Progress bar gradient end |
| Sidebar BG | `#18251f` | Dark green sidebar |

**Note:** The journey/submission components largely ignore these CSS variables and hardcode Tailwind-like colors inline (e.g., `#0f172a`, `#64748b`, `#1d4ed8`, `#e2e8f0`). This creates visual inconsistency between the sidebar/shell (which uses the CSS variables) and the content area (which uses a different, more blue-slate palette).

### Typography
- **Font:** Inter (with system font fallbacks: ui-sans-serif, system-ui, etc.)
- **No font imports** — relies on the user's system having Inter installed, or falls back
- **Heading sizes:** h1 uses `clamp(30px, 4vw, 50px)`, h2 is 21px, h3 is 16px
- **Body text:** Defaults to the browser default (16px) via the body rule
- **Weight:** Regular (400) for body, Bold (700) for labels/badges/buttons

### Layout Patterns
- **App shell:** CSS Grid, 276px sidebar + fluid main area
- **Content grids:** CSS Grid with various column templates
- **Cards/panels:** White background, 1px border, 8px border-radius, subtle box-shadow
- **Badges:** Pill-shaped (border-radius: 999px), colored background + text, 12px bold uppercase
- **Buttons:** 40px min-height, 8px border-radius, bold text, subtle shadow
- **Spacing:** Generally 12–24px gaps, 14–18px padding

### Icons
Uses `lucide-react` for iconography. Each level (L0–L7) has an assigned icon (Compass, Target, Lightbulb, BarChart3, Wallet, Mic, Rocket, Trophy). Each submission status also maps to an icon. However, **icons are defined in `lib/icons.ts` but rarely rendered in the current UI** — they appear to be prepared for future use.

---

## 7. Features Currently Implemented

### Authentication & Authorization
- Email/password login via Supabase Auth
- Role-based routing (Player → `/journey`, Mentor → `/mentor`, GameMaster → `/admin`)
- Session refresh via Next.js middleware on every request
- OAuth callback handler (for future magic-link flow)
- Graceful degradation when Supabase env vars are missing ("demo mode")

### Player Onboarding (Level 0)
- Team name and project idea capture
- 5-question Likert diagnostic (self-assessment)
- Team member confirmation (checkboxes showing teammates from DB)
- +10 engagement score on completion
- Redirects to journey after onboarding

### Player Journey Dashboard
- Displays current level label and project score
- Fetches today's missions from DB (filtered by calendar date)
- Computes mission status in real-time (upcoming/in-progress/past based on scheduled time)
- Lists deliverables with 7 possible status states
- Contextual action buttons per deliverable status

### Deliverable Submission (V1)
- Detail page with deliverable description and rubric criteria display
- Proof type selection: URL (https:// validated) or text (markdown, 4000 char max)
- Server-side validation with Zod
- Duplicate submission prevention (blocks if V1 already exists)
- Ownership verification (checks player membership before insert)
- Locked read-only view after submission
- Status-aware rendering (form vs. readonly vs. "feedback pending" banner)

### Internationalization
- Full FR/EN dictionary with ~75 translation keys
- Hardcoded to French in current UI (locale switching not exposed)

### Database
- 11 tables with proper foreign keys, indexes, and constraints
- Enums mirrored between TypeScript and PostgreSQL
- Row-Level Security policies
- Score recalculation triggers
- Seed data for bootcamp events and missions

---

## 8. What's NOT Implemented Yet (Placeholders)

| Feature | Status | Notes |
|---------|--------|-------|
| **Mentor evaluation UI** | Placeholder page | No rubric scoring form, no feedback input, no verdict buttons |
| **V1→V2 feedback loop** | Partial | V2 submission blocked with "available in Phase 3" message |
| **GameMaster admin dashboard** | Placeholder page | No cohort overview, no player management, no CSV import |
| **Pitch jury scoring** | Not started | DB schema exists (pitch_scores table) but no UI |
| **Results/leaderboard page** | Not started | No `/results` route |
| **Player public profile** | Placeholder page | Shows static text only |
| **Bulk player creation** | Not started | Magic-link CSV import planned but not built |
| **Notifications** | Not started | No in-page notification system |
| **EIC branding** | Not started | No logo, no partner logos, no branded landing page |
| **Resources page** | Not started | Static templates (BMC, Personae) not built |

---

## 9. Data Model Summary (for Designer Context)

The game is structured around these core concepts:

- **Event** → A Hack-Days instance (e.g., "Hack-Days Fès-Meknès Mai 2026")
- **Level** → 8 progression levels (L0 Diagnostic → L7 Alumni)
- **Mission** → A workshop/session within an event, tied to a level (e.g., "Atelier Problem Discovery" at L1)
- **Deliverable Template** → What players must submit for a mission (with a scoring rubric)
- **Player** → A team (not an individual) with a name, idea, current level, and scores
- **Player Member** → Individual users belonging to a team (with team roles: owner, co-founder, contributor)
- **Submission** → A proof-of-work for a deliverable (V1 or V2), either a URL or text
- **Evaluation** → A Mentor's rubric scores + feedback + verdict on a submission
- **Pitch Score** → Jury scoring on day 2 (5 criteria x 20 points each = 100 max)

**Scoring:** Two score dimensions — Project Score (from evaluated deliverables) and Engagement Score (from participation actions like onboarding completion).

**User roles:** Player, Mentor, GameMaster (with Mentor doubling as Jury for the pilot).

---

## 10. What Works Well

- **Clean data model**: Well-thought-out schema with proper enums, constraints, and relationships. The Level → Mission → Deliverable hierarchy is solid.
- **Type safety**: TypeScript types mirror the DB schema exactly, reducing bugs.
- **Server actions pattern**: All mutations go through validated server actions with Zod schemas — good security posture.
- **Dual-mode architecture**: Graceful fallback when Supabase isn't configured (demo mode).
- **Role-based routing**: Clean, automatic redirection based on user role.
- **Status state machine**: Deliverable statuses (a_rendre → submitted_v1 → feedback_received → submitted_v2 → validated/rejected) are well-defined.
- **Responsive breakpoints**: The CSS has thoughtful responsive rules for the shell layout.

---

## 11. What Needs Improvement (Design-Relevant)

### Visual Consistency
The biggest issue is the **split between two visual languages**: the sidebar/shell uses CSS variables (warm greens, cream backgrounds) while the journey content uses hardcoded Tailwind-like colors (blue-600, slate-700, slate-200). A v2 should unify the palette.

### No Real Branding
There's no EIC/UEMF logo, no partner logos, no branded typography. The login page is barebones (plain text title, no visual identity). The app title "Entrepreneur Game" appears in plain bold text in the sidebar. For a pilot with external partners watching, this needs significant polish.

### Inline Styles Everywhere
The journey and submission components use extensive inline `style={{}}` props, making the design inconsistent and hard to maintain. A v2 should move to a proper design system (Tailwind, CSS modules, or a component library).

### Login Page is Minimal
The login page is just a centered form with no background art, no logo, no partner branding, no visual appeal. It's the first thing users and partners see.

### No Loading/Empty States
No skeleton loaders, no empty state illustrations, no transition animations. Pages either show content or a plain text fallback.

### No Gamification Visual Layer
Despite being called a "game," there are no visual game elements: no XP bars, no level-up animations, no achievement badges, no progress rings, no leaderboard. The journey page is a plain list. The scores are just numbers.

### Limited Navigation
The sidebar has only one link per role. There's no breadcrumb, no secondary navigation, no way to see the big picture of all 8 levels and where you are.

### No Dark Mode
Only a light theme exists.

### Mobile Experience
Responsive breakpoints exist but the mobile experience is basic — just stacking columns. No mobile-specific UX considerations (bottom nav, swipe gestures, etc.).

### Accessibility
- ARIA labels are used on sections and forms (good)
- No skip-to-content link
- Color contrast hasn't been audited
- Focus states are minimal (just outline)
- No reduced-motion media queries

---

## 12. Existing UI Reference Screenshots

The `screenshots/project-holder-process/` folder contains 7 reference mockups showing the intended UX flow:

1. **Journey Map** — Overall path from entry → onboarding → bootcamp → validation → committee → post-bootcamp
2. **Pre-Bootcamp Onboarding/KYC** — Founder identity verification before bootcamp
3. **Startup XP & Checkpoints** — Cockpit view with XP bars, pending XP, prestige XP, and Make it / Sell it / Look after it checkpoints
4. **Bootcamp Quest Board** — Active deliverables displayed as game quests
5. **Deliverables & Team** — Submitted deliverables with team members, coach info, and next action
6. **Submit Proof & Bonus XP** — Proof submission workflow with bonus XP claim
7. **Bonus History & Activity** — Activity trail for post-submission follow-up

These represent the **aspirational v2 vision** — the current v1 implements only a fraction of this.

---

## 13. Suggestions for v2 Design Upgrade

### Brand Identity
- Design a proper logo / wordmark for "Entrepreneur Game" or "EIC Venture Journey"
- Incorporate UEMF/EIC institutional colors alongside the game palette
- Create a branded login/landing page with partner logos (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace)

### Gamification Visual Layer
- **XP progress rings or bars** for Project Score and Engagement Score
- **Level progression visualization** — show all 8 levels as a horizontal track/path with the current position highlighted
- **Achievement badges** with unlock animations (even if just CSS)
- **Leaderboard component** with team rankings, score breakdown, and position changes
- **Mission cards as "quests"** — give them a game-quest visual treatment (icon, difficulty, reward preview)
- **Completion celebrations** — confetti, level-up modals, or similar feedback on deliverable validation

### Navigation & Information Architecture
- Expand the sidebar to show the full level progression (L0–L7) as a vertical journey rail
- Add breadcrumbs on inner pages (Journey → Deliverable → Submission)
- Create a "big picture" overview page showing all levels, missions, and completion status
- Add role-specific quick actions in the topbar

### Component Design System
- Move to a consistent design token system (colors, spacing, typography, shadows, radii)
- Standardize card components (mission card, deliverable card, score card, team card)
- Design proper form components (input, textarea, select, radio group, checkbox)
- Create a badge system with consistent size/color rules
- Design loading skeletons and empty state illustrations

### Key Screens to Design
1. **Login / Landing** — branded, with partner logos and event context
2. **Player Journey Dashboard** — the central screen with level progress, missions, deliverables, and scores
3. **Deliverable Detail + Submission** — the proof submission flow with rubric display
4. **Mentor Evaluation Panel** — rubric scoring, feedback input, verdict selection
5. **GameMaster Dashboard** — cohort overview table, player status at a glance
6. **Pitch Jury Scoring** — 5 criteria sliders or inputs, real-time total
7. **Results / Leaderboard** — final rankings with score breakdowns
8. **Onboarding Flow** — team setup, idea input, diagnostic questionnaire

### Responsive / Mobile
- Consider a bottom navigation bar on mobile instead of the sidebar
- Card-based layouts that stack well on narrow screens
- Touch-friendly form controls (larger radio buttons, tappable areas)

---

## 14. Technical Notes for the Designer

- **Framework:** Next.js App Router with Server Components — pages can fetch data on the server before rendering
- **Routing:** File-based routing. Each folder under `app/` becomes a URL path. Dynamic segments use `[brackets]`
- **Components:** Mix of Server Components (no interactivity, fetch data) and Client Components (forms, interactive UI marked with `"use client"`)
- **Data flow:** Server Actions handle all form submissions — the form posts to a server function, not a REST API
- **Auth:** Cookie-based sessions via Supabase. Middleware refreshes on every request
- **Deployment:** Vercel (serverless, auto-deploy from git)

Any design system or component library (Tailwind, shadcn/ui, Radix, etc.) can be adopted for v2 — the current codebase has no dependency on a specific approach.
