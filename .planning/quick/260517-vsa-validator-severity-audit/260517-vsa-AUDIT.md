---
quick_id: 260517-vsa
slug: validator-severity-audit
date: 2026-05-17
status: complete
audit_scope: severity:"error" occurrences in app/ lib/ components/
---

# 260517-vsa — Validator severity audit

## Method

Grep pattern: `severity\s*:\s*['"]error['"]` across `**/*.{ts,tsx}` under repo root.
Additional sweep on `severity` (any value) and `warns.push|validateDeliverable|deliverable.*valid` to
confirm no hidden validator surfaces.

## Inventory & classification

| # | File | Line | Snippet | Classification | R2-relevant? | Action |
|---|------|------|---------|---------------|--------------|--------|
| 1 | `app/actions.ts` | 1196 | `severity: "error"` inside publishResultsFlow — `Publication bloquee : N porteur sans note jury` | **WorkflowState legit** (server action guard, GameMaster surface) | No — GameMaster action, not Player deliverable | Keep |
| 2 | `app/actions.ts` | 1973 | `createHelpRequestFlow` Zod parse failure → returned to client toast | **WorkflowState legit** (Zod error surface) | No — form validation, not deliverable-content validator | Keep |
| 3 | `app/actions.ts` | 1985 | `createHelpRequestFlow` — `Backend non configuré` | **WorkflowState legit** (infra guard) | No | Keep |
| 4 | `app/actions.ts` | 1991 | `createHelpRequestFlow` — `Non authentifié` | **WorkflowState legit** (auth guard) | No | Keep |
| 5 | `app/actions.ts` | 2004 | `createHelpRequestFlow` — `Aucun Player rattaché à votre compte` | **WorkflowState legit** (membership guard) | No | Keep |
| 6 | `app/actions.ts` | 2037 | `createHelpRequestFlow` — Supabase insert error | **WorkflowState legit** (DB error surface) | No | Keep |

## Companion `severity: "warn"` and `"ok"` references

- `app/actions.ts:1844` — MoSCoW kanban submission validator: `severity: warns.length > 0 ? "warn" : "ok"`.
  **Canonical R2 pattern** — Player deliverable validator returns warn, never error. Reference implementation
  for any future Player-side deliverable validator.
- `app/actions.ts:1980, 2026` — help_request flow informational `warn` returns (rate limit, demo mode).
- `app/actions.ts:2071` — `severity: "ok"` on success path.

## Counts

| Bucket | Count |
|---|---|
| R2-relevant (Player deliverable validator using `"error"`) | **0** |
| WorkflowState legit (server-action guard / Zod parse / infra / auth / DB / GameMaster gate) | **6** |
| Zod schema literal `severity` field | 0 |
| Other | 0 |
| **Total `severity: "error"` matches** | **6** |

## Validator surfaces inspected (no severity = error found)

- `lib/score.ts` — scoring/derivation, no `severity` field.
- `lib/admin.ts` — admin aggregates, no `severity` field.
- `app/actions.ts` MoSCoW validator (line 1834-1845) — already warn-only per R2.
- No `lib/deliverable-validators.ts` exists. Deliverable validation is currently inline in `app/actions.ts`
  per-flow and follows the warn-only pattern when applied to Player-submitted content.

## Verdict

**All 6 `severity: "error"` occurrences are legitimate `WorkflowState` markers.** They flag
server-side action failures (guard rails, Zod parse, infra, auth, DB errors, GameMaster
publication gate) that the client UI styles as toasts. None is a Player-deliverable validator,
so **no R2 flip is required**.

The cardinal R2 invariant (`Player deliverable validators MUST be warn-only`) is currently
upheld. The MoSCoW kanban validator at `app/actions.ts:1834-1845` is the canonical
reference implementation for future Player-side validators.

## Pending advisor review

**None.** Because zero R2-relevant matches were found, no edits are proposed and the
mandatory `eic-pedagogical-advisor` spawn for R2 edits is **not triggered**. An
`ADVISOR-VERDICT.md` is NOT produced for this session (per PLAN: required only if flips
are proposed).

## Gate baseline

See `docs/validator-severity-baseline.md` for the whitelist + grep gate rationale and
`scripts/check-r2-severity.{sh,ps1}` for the executable check.
