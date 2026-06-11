---
gsd_state_version: 1.0
milestone: v0.4
milestone_name: Scale Foundation
status: executing
last_updated: "2026-06-11T23:02:05.507Z"
last_activity: 2026-06-11
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 19
  completed_plans: 16
  percent: 50
---

# Project State

## Project Reference

**Core value**: Plateforme d'accompagnement entrepreneurial gamifiée EIC/UEMF, personnalisable par bootcamp/programme via un éditeur GameMaster no-code.

See: `.planning/PROJECT.md` (mis à jour 2026-06-11 — v0.4 Scale Foundation started)

## Current Position

Phase: 16 (Jury paramétrable + Scoring configurable) — IN PROGRESS
Plan: 2 of 5 (complete)
Status: Plan 16-02 complete — dynamic jury form + scoring wiring delivered
Last activity: 2026-06-12

```
[Phase 13] [Phase 14] [Phase 15] [Phase 16] [Phase 17] [Phase 18]
                           ▲
                         DONE
                  2/6 phases complete
```

## Deadline

Event début juillet 2026 — freeze/preflight J-2 ~2026-07-01 (~3 semaines de build à partir du 2026-06-11)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 6 |
| Phases complete | 0 |
| Plans total | TBD |
| Plans complete | 0 |
| Requirements mapped | 36/36 |
| Requirements complete | 0/36 |
| Phase 13 P02 | 15min | 2 tasks | 7 files |
| Phase 13 P03 | 10min | 2 tasks | 7 files |
| Phase 14 P01 | 5min | 3 tasks | 4 files |
| Phase 14 P02 | 7min | 2 tasks | 8 files |
| Phase 14 P03 | 17min | 3 tasks | 16 files |
| Phase 14 P14-04 | 12min | 2 tasks | 13 files |
| Phase 15 P15-01 | 12min | 3 tasks | 5 files |
| Phase 15 P15-02 | 6min | 3 tasks | 5 files |
| Phase 15 P03 | 7min | 3 tasks | 5 files |
| Phase 15 P15-04 | 9min | 3 tasks | 7 files |
| Phase 15 P15-05 | 15min | 3 tasks | 8 files |
| Phase 16 P01 | 20min | 3 tasks | 6 files |
| Phase 16 P16-02 | 35min | 3 tasks | 9 files |

## Accumulated Context

### Key Decisions (v0.4)

- OPS-01 (db-source-consolidation) est le premier travail — pré-requis avant tout refactor schéma
- QUAL-01/02/03 (test infra) atterrit en Phase 13 pour sécuriser tout le refactor schéma/RLS/scoring qui suit
- Phases 14-15-16 : schéma → engine GM → jury/scoring (séquence bloquante)
- QUAL-04/05/06 (Sentry/PostHog/perf) land en Phase 17 avant le freeze event
- R3 strict dans l'éditeur : `soft_recommends_before` uniquement, AUCUN hard-block configurable
- Exception L2 (`prep-questions-v1` → `fiches-entretien-v1`) reste unique cas codé, non exposée dans l'éditeur
- Archives AgreenTech + Digi gelées en lecture seule — classements intacts, 0 migration big-bang
- database/** est Write/Edit-denied dans settings.local.json — SQL via NEW.sql dans quick/phase dirs + Supabase MCP execute_sql
- Dual-mode demo (hasSupabaseEnv fallback) préservé dans toutes les phases
- 14-01 : levels_v2 (text PK) naming évite collision avec public.levels (enum PK) — enum retenu, suppression post-juillet
- 14-01 : PROD apply = checkpoint opérateur batché Plan 04 (supabase db push --linked) ; database/** non édité
- 14-01 : events.organization_id nullable + is_active DEFAULT false = état intermédiaire PROD tolérable (TS fallback Plan 02)
- 14-02 : LevelId = string (plain alias, DB text FK est l'integrity guard) ; z.enum mirror confirmé absent dans schemas.ts
- 14-02 : getActiveEvent() retourne null en pré-migration window ; callers Plan 03 doivent tolérer null
- 14-02 : getLevelStates(levels: Level[], currentLevel) — signature changée, LEVEL_IDS constant supprimée
- 14-03 : levelLabels: Record<string,string> prop shape pour client components (short label = label.split(' - ')[1] ?? label)
- 14-03 : LEVEL_IDS remplacé par Array.from(levelStates.keys()) dans JourneyTrack (Map insertion order = ord order)
- 14-03 : LEVELS-03 entièrement satisfait côté consumer ; quality gate restored (typecheck/lint/build/16 unit/15 e2e green)
- 14-04 : All 13 event-resolution sites rewired from starts_at-desc to is_active=true (TENANT-03 consumer side complete)
- 14-04 : lib/announcements.ts:76 confirmed as event-resolution site (swapped); announcement-row created_at ordering left intact
- 14-04 : W-3 dual-write: saveOnboardingKyc writes both current_level and current_level_text='L1_problem' to prevent enum/text FK drift post-migration
- 15-01 : DeliverableTemplate required fields (non-optional) — callers supply defensive defaults; journey.ts mapper demonstrates pre-migration pattern
- 15-01 : VALID-01 structural: z.literal("warn") + DB CHECK validation_rules_severity_warn_only — severity:error impossible at both TS and DB layers (defense in depth / R2)
- 15-01 : fn_auto_eval_fiches_entretien generalized to auto_validate column — slug literal removed (ENGINE-05); G01 UUID retained; PROD apply operator-gated
- 15-02 : activateEventFlow two-step UPDATE (deactivate-all-in-org then activate-target); null-org fallback deactivates all events (pre-migration safe)
- 15-02 : cloneEventFlow two-pass soft_recommends_before remap — pass1 null inserts, pass2 old->new UUID update (T-15-05 mitigated)
- 15-02 : ENGINE-03 (clone) + ENGINE-04 (create event+cohort) + TENANT-03 editor side (single-active) complete
- 15-04 : getSimulatedNow reads gsd_simulate_date cookie (server-only); GM-only via lib/admin.ts call sites
- 15-04 : isAutoValidate pre-migration dual-check: (composer_kind=multi_url && auto_validate) || (!column && slug===fiches-entretien-v1) so PROD works until migration applied
- 15-04 : LEVELS-04 + ENGINE-05 + ENGINE-06 + ENGINE-07 complete; HARD_BLOCK_DEPENDENCIES literal untouched (VALID-02)
- 15-05 : rubricSchema extracted to lib/schemas.ts; remapSoftRecommends to lib/clone-remap.ts; 44 unit / 23 e2e green; 15-VERIFICATION.md all 10 requirements + 6 SC traced; PROD migration apply deferred to Phase 16/18 operator checkpoint
- 16-01 : pitch_criteria table + scores jsonb (JURY-06); event_settings with bonus_multiplier_cap DEFAULT 3.0 (SETTINGS-01/02); get_event_setting_int + parameterized recalc_player_engagement (SETTINGS-03); dual-mode TS accessors with DEFAULT_EVENT_SETTINGS = current hardcoded values; 58 unit + 23 e2e green
- 16-02 : normalizePitchScore exported from lib/results.ts (dynamic jsonb + retro-compat c5=0->x1.25 preserved cardinal); XP literals replaced by settings.xpFirstSubmission/xpValidateV1/xpValidateV2; jury form dynamic criteria prop + positional c1..c4 + c5=0 always + scoresJson; pitchWeight from getEventSettings; 64 unit + 23 e2e green

### Phase Sequence Rationale

```
Phase 13: OPS-01 (drift) + QUAL-01/02/03 (test infra) — filet de sécurité AVANT tout refactor
Phase 14: TENANT + LEVELS — schéma multi-tenant + niveaux data-driven (délicat: enum→table migration)
Phase 15: ENGINE + VALID — éditeur GM complet + dé-hardcoding slugs
Phase 16: JURY-06..09 + SETTINGS — jury dynamique + scoring configurable
Phase 17: QUAL-04/05/06 — observabilité + perf avant freeze
Phase 18: JULY — event juillet sur le nouveau moteur + freeze + preflight J-2
```

### Tech Debt v0.3 Reporté

- **DIGI-08** : backfill pitch_scores post-event (→ OPS-02, Phase 13)
- **Catégorie B post-mortem** : schema drift mgmt-api Studio cleanup (→ OPS-01, Phase 13)
- **Smoke E2E post-event** : non joué (→ QUAL-02 Playwright base, Phase 13)

## Seeds Planted

| ID | Title | Trigger | Date |
|----|-------|---------|------|
| [SEED-001](./seeds/SEED-001-schemas-v2-architectural-refacto.md) | Schemas v2 architectural refacto | Post-pilote, milestone v0.4 | 2026-05-10 |

## Blockers

_None_

## Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260524-o7v | cleanup root dev-server logs + f2-fix screenshot + .playwright-mcp/ (3.5 MB reclaimed, gitignored noise) | 2026-05-24 | — (no code) | [260524-o7v-cleanup-root-dev-server-logs-f2-fix-scre](./quick/260524-o7v-cleanup-root-dev-server-logs-f2-fix-scre/) |

## Historique Milestones

- **v0.1** Pilot Hack-Days Fès-Meknès — archivé 2026-05-08 (tag `v0.1-pilot-ready`)
- **v0.2** EIC Design v2 Refresh — archivé 2026-05-11 (tag `v0.2-pilot-ready`)
- **v0.3** Digi-Hackathon — archivé 2026-05-23 (tag `v0.3-pilot-shipped`), event 20-22 mai 2026 livré 0 downtime

---

*Last updated: 2026-06-11 — Phase 15 COMPLETE (all 5 plans). Plan 05: rubricSchema + remapSoftRecommends extracted; 44 unit + 23 e2e tests green; 15-VERIFICATION.md all 10 requirements satisfied; PROD migration apply deferred to Phase 16/18 operator checkpoint.*
