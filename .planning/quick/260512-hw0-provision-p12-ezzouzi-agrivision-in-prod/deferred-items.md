# Quick 260512-hw0 — Deferred Items

## Suspended pending Omar's cohort photo (2026-05-12)

All execution tasks T1-T8 from `260512-hw0-PLAN.md` are deferred until the final cohort photo confirms Ezzouzi remains in the AgreenTech 2026 pilot.

| # | Task | Why deferred | Resume condition |
|---|------|--------------|------------------|
| T1 | `git tag v0.2.1-pre-p12` | No mutation to anchor rollback for | When photo confirms Ezzouzi → run before T2 |
| T2 | apply_migration `provision_p12_ezzouzi_agrivision` | Irreversible PROD INSERT — must confirm cohort first | Photo confirms Ezzouzi P12 in cohort |
| T3 | UUID capture + roundtrip verification | Depends on T2 | After T2 succeeds |
| T4 | Insert P12 row in `cohorte-agreentech-creds.csv` | Need real UUIDs from T3 | After T3 |
| T5 | Write final SUMMARY.md (replace PAUSED version) | Current SUMMARY documents paused state | After T4 |
| T6 | Update STATE.md row from `Paused` → `Verified`/`Done` | Need final commit_hash | After T7 |
| T7 | Commit `feat(quick-260512-hw0): provision P12 ...` + push | Code commit follows execution | After T1-T6 |
| T8 | Update memory `project_prod_pilot_state.md` (20 → 21 users) + `reference_cohort_csvs.md` (note P12) | PROD count must change first | After T7 |

## External dependency

- **Omar to send photo of final 2026 AgreenTech project holders** (mentioned in chat, asynchronous)
  - Expected content : list of 11-12 final porteurs with names + projects
  - Decision matrix :
    - Ezzouzi P12 present → proceed with PLAN as-is
    - Ezzouzi absent, new porteur in her place → new quick to provision the substitute
    - HOUENHA P02 assigned Agrivision → drop Ezzouzi P12 from PLAN, update P02 idea_seed instead

## HOUENHA P02 idea_seed gap (separate from this quick)

The current PROD `players.idea` for slug `p02` is empty/unset, and `cohorte-agreentech-creds.csv` has empty `idea_seed` for P02. Once Omar's photo arrives :
- If HOUENHA's project is identifiable → spawn a separate quick `/gsd-quick "Set HOUENHA P02 idea_seed in PROD + CSV"`
- Out of scope for `260512-hw0`

## No deferred code

This quick involves zero application code changes. All deferred items are PROD DB mutations and CSV/docs updates only.
