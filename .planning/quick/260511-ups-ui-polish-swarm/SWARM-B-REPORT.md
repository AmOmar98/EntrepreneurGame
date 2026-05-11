# SWARM-B REPORT — Mentor Evaluation Velocity
Date: 2026-05-11  
Branch: worktree-agent-a9c6fc99dc1a35660 (swarm-ui-polish-B)

## Commits

| SHA | Item(s) | Description |
|-----|---------|-------------|
| `0934c30` | MNT-01 | Inbox view + team tab toggle on mentor page |
| `0e83247` | MNT-04 | Prev/next submission nav + J/K keyboard shortcuts |
| `274390a` | MNT-02/03/05/10 | Segmented rubric, sticky footer, history badges, locked CTA |

## Items

### MNT-01 — DONE ✅
**Inbox view** added to `/mentor` page.

- `lib/mentor.ts`: extended `SubRow` to fetch `submitted_at` + `deliverable_template_id`; resolves template titles in one extra query; builds `MentorPendingSubmission[]` per player with `submittedAt`, `missionTitle`.
- `MentorPendingSubmission` type exported from `lib/mentor.ts`.
- `components/mentor-inbox-view.tsx`: flat antichrono `<ul>` of pending submissions — player name, mission title, relative delay ("il y a Xh"), "Evaluer →" CTA link.
- `components/mentor-view-toggle.tsx`: client tab toggle "Inbox(N) / Vue par equipe" using `view` searchParam.
- `app/mentor/page.tsx`: reads `view` searchParam, shows inbox or existing table+filter accordingly. Inbox items sorted antichrono across all players. Demo mode path unchanged.

### MNT-02 — DONE ✅
**Segmented radio buttons** replace `<input type="number">` in rubric.

- Each criterion row renders `0..max` radio buttons as styled `<label>` squares (32×32px, active = blue fill).
- `handleSegmentKey` handler: pressing digit key `0`-`5` while row is focused updates score.
- Hidden `<input type="radio">` inside each label preserves semantic structure (`role="radiogroup"` on inner fieldset).
- `updateScore` simplified to accept `number` directly (no string coercion needed).

### MNT-03 — DONE ✅
**Sticky footer** wraps verdict selector + submit button.

- `position: sticky; bottom: 0; background: #fff; border-top: 1px solid #e2e8f0; z-index: 10` container holds verdict radiogroup + submit.
- Feedback textarea scrolls independently above; verdict + CTA always visible at bottom of panel on 1366×768.

### MNT-04 — DONE ✅ (depends on MNT-01 queue — executed after)
**Prev/Next nav** on `/mentor/submission/[id]`.

- `lib/mentor.ts`: `getPendingSubmissionQueue()` returns flat antichrono array of pending submission IDs by calling `getMentorPlayersOverview()` and flattening `pendingSubmissions`.
- `components/mentor-sub-nav.tsx`: client component with Precedent/Suivant `<Link>` buttons + position counter (N/total). `useEffect` registers `keydown` listener for `J`/`j`/`→` (next) and `K`/`k`/`←` (prev); skips when focus is inside input/textarea.
- Submission page: fetches queue, computes `prevId`/`nextId`/`queuePosition`, renders `<MentorSubNav>` after `<BackLink>` when queue is non-empty.

### MNT-05 — DONE ✅
**Evaluation history badges** on `MentorSubmissionHistory`.

- `MentorSubmissionHistoryEntry` extended with `evalVerdict?: string | null` and `evalExpectedAction?: string | null`.
- Submission page: fetches mentor's evaluations for all history submission IDs in one `IN` query; joins result into history entries.
- `mentor-submission-history.tsx`: color-coded verdict pill (green/amber/red) replaces the plain "remplacé" badge when verdict is known; `expected_action` rendered inline in italic below each entry.

### MNT-10 — DONE ✅
**Locked state CTAs** on already-evaluated submissions.

- Lock icon (`lucide-react <Lock size={14}/>`) added to yellow already-evaluated banner.
- "Demander revision GameMaster ✉" `<a href="mailto:omar.ameur98@gmail.com?...">` with pre-filled subject (`[Revision GM] {title} — {player}`) and structured body (player, livrable, submission ID, verdict, free text slot).
- "Prochaine soumission en attente →" `<Link>` to `nextId` (shown only when queue has a next item).

## Adapted / Notes

- MNT-10 GM email hardcoded to `omar.ameur98@gmail.com` (from `database/README.md` and test fixtures). If GM email changes, update `app/mentor/submission/[id]/page.tsx` locked state section.
- MNT-04 `getPendingSubmissionQueue()` makes a second full call to `getMentorPlayersOverview` on each submission page load. Acceptable for pilot volume (≤30 sessions, ≤15 players). Could be cached with `unstable_cache` post-pilot if needed.
- Rubric segmented control: `max` is respected dynamically — if a criterion has `max: 3`, only buttons 0/1/2/3 render. The digit shortcut is capped at `max` via `n <= max` check.

## Skipped

None — all 6 items delivered.

## typecheck + lint

Both passed clean before each commit.
