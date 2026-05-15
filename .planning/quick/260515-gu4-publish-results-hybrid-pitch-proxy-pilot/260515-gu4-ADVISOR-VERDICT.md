---
quick_id: 260515-gu4
advisor: eic-pedagogical-advisor
date: 2026-05-15
status: WARN
cardinal_summary:
  R1: PASS (with mandatory smoke)
  R2: N/A
  R3: N/A
---

# Advisor Verdict — Quick 260515-gu4 (publish-results-hybrid-pitch-proxy-pilot)

**Status: WARN** (not BLOCK, not OK)

The 3 cardinal rules hold under this operation. The drift-pédagogique risk is **contained** by audience scope (GM + jury + archives, not Players). However, the PLAN has two arithmetic/operational gaps that warrant fixing before SQL execution, and one R1 verification step that must be smoked post-publish.

---

## R1 — Score/rank invisible to Players: PASS (with mandatory smoke)

Verified at `app/results/page.tsx:139-175`. Post-publish branch for `!isGm` renders the "announce thank-you" screen (`t.results_announce_title` / `t.results_announce_body`) — no ranking table, no rank number, no podium reveal. The `/results/ceremony` route is GM-only (line 196-202 inside the `isGm` block).

Player-facing impact of this backfill on `/journey`, `/journey/deliverable/[id]`, `/onboarding`: **none**. The backfill writes only to `pitch_scores` and `events.results_published_at`. Neither feeds the Player journey UI.

**Mandatory post-publish smoke (PLAN Task 5)**: login as P01, navigate `/results`, confirm the announce screen renders and no rank/score/combined leaks via DOM. If announce does NOT render → rollback `results_published_at = NULL` immediately.

## R2 — Validators warn-only: N/A

No validator code, schema, or `severity` field touched. Confirmed.

## R3 — No hardcoded mission blocking: N/A

No mission gating, no `blocks_progression_to`, no middleware/RLS change. Confirmed.

## Drift pédagogique: ACCEPTABLE (with audit trail discipline)

The doctrine forbids exposing post-hoc fabricated numbers to Players. This operation:
- Does not surface anything to Players (R1 announce screen).
- Persists a **proxy** of the jury's offline deliberation, not a fabrication — the Top 3 was actually decided by the named partners on 14/05.
- Audience (GM + jury + UEMF archives) is the legitimate consumer of a publishable ranking.

The line crossed would be: telling Players a fabricated rank, or letting the proxy numbers re-enter the Player UI later. Neither happens here. **Acceptable**, but document the proxy nature explicitly in the SUMMARY so future-Omar / auditors don't mistake the rows for live UI captures.

---

## Findings to address before SQL execution

### F1 — Math reconciliation with PROD `score_project` (advisor flagged BLOCKING, orchestrator: RESOLVED)

Advisor noted: "the combined column is not reconciled with real PROD `score_project` values, requires read-only query first".

**Orchestrator response**: Already done. Pre-PLAN cartography (this session) queried PROD `players.score_project` via Supabase MCP. Values used in PLAN table are the **actual current PROD values** (queried 2026-05-15):

| Slug | PROD score_project | PLAN target pitch_avg | combined |
|---|---|---|---|
| p07 | 238.00 | 96.25 | 124.60 |
| p11 | 160.00 | 94.06 | 107.25 |
| p10 | 143.00 | 95.00 | 104.60 |
| p08 | 236.00 | 65.00 | 99.20 |
| p09 | 200.00 | 70.00 | 96.00 |
| p05 | 194.00 | 68.13 | 93.30 |
| p04 | 175.00 | 65.00 | 87.00 |
| p01 | 165.00 | 60.00 | 81.00 |
| p02 | 48.00 | 45.00 | 45.60 |
| p03 | 0.00 | 25.00 | 20.00 |
| p06 | 0.00 | 15.00 | 12.00 |

**Margin p10 (#3=104.6) → p08 (#4=99.2) = 5.4 points** — meets advisor's ≥5 robustness criterion. Top 3 robust.

**Status: F1 resolved**. PLAN table will be annotated with exact PROD values + computed combined in next revision.

### F2 — `created_at` cosmetic concern (FLAG)

Advisor: "Do not silently overwrite `created_at`. Leave `now()`, document in SUMMARY as 'saisie rétroactive post-cérémonie'."

**Orchestrator decision**: Adopt advisor recommendation. `created_at = now()` (2026-05-15). SUMMARY will explicitly document "saisie rétroactive post-cérémonie 14/05 décision jury partenaires".

### F3 — Juror provisioning option (FLAG)

Advisor: "Create 4 NEW partner-branded accounts (Tamwilcom/BoA/Innov Invest/Bluespace). Don't rename the 3 existing `@smoke.entrepreneurgame.local` accounts — they may be linked elsewhere."

**Orchestrator decision**: Adopt. Create 4 new `auth.users` + `profiles` rows with:
- emails: `jury.tamwilcom@eic.uemf.ma`, `jury.boa@eic.uemf.ma`, `jury.innovinvest@eic.uemf.ma`, `jury.bluespace@eic.uemf.ma`
- `app_role = 'mentor'` (no `jury` enum value exists)
- display names: "Jury Tamwilcom", "Jury Bank of Africa", "Jury Innov Invest", "Jury Bluespace"
- zero project_members assignments

**Note**: avoid passwords / login enablement → these accounts won't be used interactively. Set `email_confirmed_at` only, no password, or random unbroken password not given to anyone.

### F4 — Deterministic c1..c4 (FLAG)

Advisor: "No `random()` in SQL. Fixed integer VALUES list, generated once."

**Orchestrator decision**: Adopt. `backfill.sql` will contain a hardcoded 44-row VALUES block. Variance across jurors will be explicit (e.g., Tamwilcom: 20+19+19+19=77 for p07, BoA: 19+20+19+19=77, etc.).

### F5 — Cohort scope (FLAG)

Advisor: "Every query scoped to `event_id = (SELECT id FROM events WHERE slug='agreentech-fes-meknes-mai-2026')`."

**Orchestrator decision**: Adopt. All UPSERT/UPDATE will WHERE-filter on this event. PLAN already has this in the rollback section.

### F6 — Publish guard bypass note (FLAG)

Advisor: "44 rows satisfies `app/actions.ts:1152-1170` guard. No action needed; just note in SUMMARY."

**Orchestrator decision**: Adopt. SUMMARY will note: "Backfill 4 jurors × 11 players = 44 rows = guard-satisfying. Re-run via UI publish would no-op (idempotent — already_published)."

---

## Recommendations (prioritized) — Orchestrator action

1. **F1 reconciliation done** (already used PROD values) → PLAN revision to annotate explicitly.
2. **4 new partner-branded juror accounts** (F3).
3. **Deterministic 44-row VALUES** in `backfill.sql` (F4).
4. **event_id scoping** in every SQL statement (F5).
5. **`created_at = now()`** + SUMMARY documentation (F2).
6. **Post-publish smoke P01** non-negotiable (R1 confirm).
7. **Symmetric rollback** with `DELETE FROM pitch_scores WHERE juror_id IN (4 jury uuids)` + `UPDATE events SET results_published_at=NULL`.

---

## Verdict line

**WARN** — cardinals hold (R1 PASS, R2 N/A, R3 N/A), pédagogie tient. F1 already resolved by pre-PLAN PROD data capture. F2-F6 addressed by orchestrator decisions above. Proceed to backfill SQL generation + Omar's explicit go before executing on PROD.

**Next action**: orchestrator drafts `backfill.sql` + `rollback.sql` files for Omar review. SQL NOT executed automatically.

---

## Source refs

- `lib/results.ts:268-298` — formula + c5 normalization (c5=0 → total*1.25)
- `app/results/page.tsx:139-175` — R1 announce screen post-publish
- `app/actions.ts:1152-1170` — UI publish guard (bypassed by direct SQL UPDATE)
- `database/schema.sql` — `pitch_scores` columns + UNIQUE(event_id, player_id, juror_id)
- `database/triggers.sql:56-83` — `recalc_player_score` (informs PROD score_project values)
