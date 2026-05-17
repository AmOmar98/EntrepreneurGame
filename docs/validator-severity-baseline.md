# Validator severity baseline

**Quick:** `260517-vsa` · **Date:** 2026-05-17 · **Owner:** Omar
**Cardinal rule guarded:** R2 — Player deliverable validators MUST be `warn`, never blocking.

## Why a baseline (not a blind grep gate)

A naive `grep -r 'severity: "error"'` produces false positives. The codebase uses
the `WorkflowState` shape `{ ok, message, severity?: "ok" | "warn" | "error" }` as
the return contract for **every** server action (`app/actions.ts`). The `"error"`
value there flags *server-side action failures* (Zod parse, auth, infra, DB) —
not Player content validation.

R2 governs a different surface: **validators that evaluate Player-submitted
deliverables and could block progression**. Those MUST emit `warn` so a human
mentor reviews, never an automatic block.

This baseline distinguishes the two surfaces and whitelists the legitimate ones.

## Whitelist — `severity: "error"` is allowed here

The following file paths and patterns are pre-approved to carry `severity: "error"`
because they describe **server action failure modes** returned via `WorkflowState`,
not Player deliverable validators:

| Path pattern | Reason |
|---|---|
| `app/actions.ts` | Single `"use server"` module. All `severity: "error"` here are `WorkflowState` markers for Zod parse failure, missing backend, missing auth, missing membership, DB error, or GameMaster publication guards (e.g., publication blocked because jury votes are missing). Not Player deliverable validators. |

## Forbidden surfaces — `severity: "error"` MUST NOT appear here

| Path pattern | Reason |
|---|---|
| `lib/*-validators.ts` | If a deliverable-validator module is introduced, it evaluates Player content. R2 = warn-only. |
| `lib/score.ts` | Scoring derives values; does not validate Player input. No severity field expected. |
| Inline validators within `app/actions.ts` that inspect **Player-submitted deliverable content** (e.g., MoSCoW kanban `warns.push(...)` block at line ~1834) | Canonical reference pattern: `severity: warns.length > 0 ? "warn" : "ok"`. Never `"error"`. |

## Canonical reference

`app/actions.ts:1833-1845` (MoSCoW kanban submission, V1):

```ts
// R2/R3 : warn-only message si recommandations non remplies
const warns: string[] = [];
if (counts.must < 2) warns.push("recommandation : >=2 cartes MUST");
if (counts.wont < 1) warns.push("recommandation : >=1 carte WONT (anti scope-creep)");
return {
  ok: true,
  message: `Kanban MoSCoW soumis V1.${warningSuffix} Le Mentor va le valider.`,
  severity: warns.length > 0 ? "warn" : "ok",
};
```

Any future Player-content validator MUST mirror this shape: `severity` is `"warn"` or
`"ok"`, never `"error"`. Submission still proceeds (`ok: true`); the mentor sees the
warns in their review queue.

## Gate script

`scripts/check-r2-severity.sh` (bash) and `scripts/check-r2-severity.ps1`
(PowerShell) implement the gate:

1. Grep for `severity: "error"` across `app/`, `lib/`, `components/`.
2. Strip occurrences from whitelisted paths (currently `app/actions.ts` only).
3. Exit `1` if any non-whitelisted match remains; exit `0` otherwise.

The gate is **not yet wired** into CI/pre-commit — that is a separate decision.
Run manually:

```bash
# bash
./scripts/check-r2-severity.sh

# PowerShell
./scripts/check-r2-severity.ps1
```

Both scripts exit `0` on the current `HEAD`.

## Reviewing the whitelist

When the orchestrator extracts deliverable validation out of `app/actions.ts` into a
dedicated `lib/deliverable-validators.ts` module, **remove** `app/actions.ts` from the
whitelist (or narrow the rule by line range) and ensure the new module produces only
`warn` / `ok`. Until then, the whole `app/actions.ts` file is exempted because every
match observed in the 2026-05-17 audit is a `WorkflowState` server-action guard.

## Audit history

| Date | Audit doc | Matches | R2 flips |
|---|---|---|---|
| 2026-05-17 | `.planning/quick/260517-vsa-validator-severity-audit/260517-vsa-AUDIT.md` | 6 (all `app/actions.ts`) | 0 |
