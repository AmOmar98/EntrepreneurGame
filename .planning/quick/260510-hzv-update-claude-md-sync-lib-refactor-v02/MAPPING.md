---
quick_id: 260510-hzv
task: 1
produced: 2026-05-10T00:00:00Z
---

# MAPPING.md — Audit lib/data.ts references in CLAUDE.md

## Inventaire CLAUDE.md

Fresh grep `lib/data` on CLAUDE.md — 17 occurrences:

| Line | Extrait |
|------|---------|
| L22  | `all reads come from the in-memory seed in \`lib/data.ts\` (and workflow constants in \`lib/workflow-data.ts\`)` |
| L25  | `type/shape changes in \`lib/data.ts\` must be reflected in the SQL schema and vice versa` |
| L27  | `### Domain types (single source of truth: \`lib/data.ts\`)` |
| L144 | `Single-word libs: lowercase (e.g., \`lib/data.ts\`, \`lib/i18n.ts\`, \`lib/csv.ts\`)` |
| L155 | `import { type AppRole } from "@/lib/data"` (see \`components/app-shell.tsx:5\`)` |
| L187 | `Mirror domain enums from \`lib/data.ts\` literally in \`z.enum([...])` lists (e.g., Checkpoint, Stage, BonusType). Keep them in sync with \`lib/data.ts\`.` |
| L192 | `prefer the shared \`mailtoUrl\` / \`deliverableMailBody\` helpers from \`lib/data.ts\` when available` |
| L220 | `\`lib/data.ts\` — domain types, enums, seed data, helpers (\`mailtoUrl\`, \`deliverableMailBody\`, \`calculateBonusClaim\`)` |
| L236 | `Pages are server components that import data directly from \`lib/data.ts\`; client components...` |
| L238 | `Without env vars, the app reads the in-memory seed in \`lib/data.ts\`; with env vars, server actions...` |
| L240 | `Domain types and demo data are co-located in \`lib/data.ts\` (single source of truth).` |
| L248 | `Imports: domain helpers from \`lib/data.ts\`, layout from \`components/app-shell.tsx\`...` |
| L259 | `Location: \`lib/data.ts\` (~1285 lines), \`lib/workflow-data.ts\` (workflow constants)...` |
| L266 | `Pattern: \`GET\` handlers pull rows from \`lib/data.ts\` helpers and return \`csvResponse(...)` |
| L281 | `TS source: \`lib/data.ts\` (\`Stage\`, \`Checkpoint\`, \`MaturityPhase\`, \`BonusType\`).` |
| L285 | `Location: \`lib/data.ts\` (\`bonusRules\`, \`calculateBonusClaim\`).` |
| L288 | `Location: \`lib/data.ts\` (\`mailtoUrl\`, \`deliverableMailBody\`, \`reviewReminderBody\`).` |

Total: 17 occurrences. Note: L187 has two instances of `lib/data.ts` on the same line — counted as one line occurrence, two replacements needed.

## Inventaire lib/

```
lib/admin-deliverables.ts
lib/admin-export.ts
lib/admin-import.ts
lib/admin-live.ts
lib/admin-player-detail.ts
lib/admin-radar.ts
lib/admin.ts
lib/announcements.ts
lib/auth.ts
lib/csv.ts
lib/hack-status.ts
lib/icons.ts
lib/i18n.ts
lib/journey-progression.ts
lib/journey.ts
lib/jury.ts
lib/link-type.ts
lib/mentor.ts
lib/results.ts
lib/score.ts
lib/supabase-status.ts
lib/team-activity.ts
lib/types.ts
lib/seed/deliverableTemplates.ts
lib/seed/index.ts
lib/seed/missions.ts
lib/seed/players.ts
```

NOTE: `lib/data.ts` does NOT exist. `lib/workflow-data.ts` does NOT exist.

## Symbol locations

| Symbol | v0.1 location | v0.2 location | Status |
|--------|--------------|---------------|--------|
| `Stage` | lib/data.ts | — (renamed to `LevelId` in lib/types.ts) | REMOVED — replaced by `LevelId` type union in lib/types.ts:13 |
| `Checkpoint` | lib/data.ts | — | REMOVED — no export found in lib/, components/, app/, utils/ |
| `MaturityPhase` | lib/data.ts | — | REMOVED — no export found in lib/, components/, app/, utils/ |
| `DeliverableStatus` | lib/data.ts | lib/journey.ts:16 | REMAP → lib/journey.ts:16 |
| `BonusStatus` | lib/data.ts | — | REMOVED — no export found |
| `BonusType` | lib/data.ts | — | REMOVED — no export found |
| `AppRole` | lib/data.ts | lib/types.ts:7 (canonical) + components/app-shell.tsx:12 (re-export) | REMAP → lib/types.ts:7 |
| `TeamRole` | lib/data.ts | lib/types.ts:11 | REMAP → lib/types.ts:11 |
| `Startup` | lib/data.ts | — | REMOVED — no export found (concept replaced by Player+Cohort in lib/types.ts) |
| `Deliverable` | lib/data.ts | lib/types.ts:73 as `DeliverableTemplate`; lib/journey.ts:18 as `JourneyDeliverable` | REMAP — renamed/split |
| `BonusEvent` | lib/data.ts | — | REMOVED — no export found |
| `Profile` | lib/data.ts | lib/types.ts:95 | REMAP → lib/types.ts:95 |
| `mailtoUrl` | lib/data.ts | — | REMOVED — not exported from any lib/, components/, app/, utils/ file |
| `deliverableMailBody` | lib/data.ts | — | REMOVED — not exported from any lib/, components/, app/, utils/ file |
| `reviewReminderBody` | lib/data.ts | — | REMOVED — not exported from any lib/, components/, app/, utils/ file |
| `calculateBonusClaim` | lib/data.ts | — | REMOVED — not exported from any lib/, components/, app/, utils/ file |
| `bonusRules` | lib/data.ts | — | REMOVED — not exported from any lib/, components/, app/, utils/ file |
| `journeyPhases` | lib/data.ts | — | REMOVED — not exported as constant; journey levels now come from lib/seed/*.ts + lib/types.ts:LevelId |
| `navItems` | lib/data.ts | components/app-shell.tsx:15 (module-private const, not exported) | REMAP — lives inside app-shell.tsx, not a lib export |
| `dashboardMetrics` | lib/data.ts | — | REMOVED — no export found |
| `xpSummary` | lib/data.ts | lib/score.ts likely (unverified — no export named xpSummary found) | REMOVED — no export named xpSummary found |
| `committeeDossierRows` | lib/data.ts | — | REMOVED — committee flow retired in Phase 4 admin refactor |

## Remap table

| CLAUDE.md L# | Extrait actuel | Decision | Nouveau texte | Source |
|---|---|---|---|---|
| L22 | `the in-memory seed in \`lib/data.ts\` (and workflow constants in \`lib/workflow-data.ts\`)` | REPHRASE | `the in-memory seed in \`lib/seed/\` (players, missions, deliverable templates) and helpers across \`lib/\` modules` | lib/seed/index.ts, lib/types.ts |
| L25 | `type/shape changes in \`lib/data.ts\` must be reflected in the SQL schema` | REPHRASE | `type/shape changes in \`lib/types.ts\` must be reflected in the SQL schema` | lib/types.ts |
| L27 | `### Domain types (single source of truth: \`lib/data.ts\`)` | REPHRASE | `### Domain types (lib/types.ts — single source of truth)` | lib/types.ts |
| L144 | `Single-word libs: lowercase (e.g., \`lib/data.ts\`, \`lib/i18n.ts\`, \`lib/csv.ts\`)` | REMAP | `Single-word libs: lowercase (e.g., \`lib/types.ts\`, \`lib/i18n.ts\`, \`lib/csv.ts\`)` | lib/types.ts |
| L155 | `import { type AppRole } from "@/lib/data"` (see \`components/app-shell.tsx:5\`)` | REMAP | `import { type AppRole } from "@/lib/types"` (see \`lib/types.ts:7\`)` | lib/types.ts:7 |
| L187 | `Mirror domain enums from \`lib/data.ts\` literally in \`z.enum([...])` ... Keep them in sync with \`lib/data.ts\`.` | REMAP | `Mirror domain enums from \`lib/types.ts\` literally in \`z.enum([...])\` lists. Keep them in sync with \`lib/types.ts\`.` | lib/types.ts |
| L192 | `prefer the shared \`mailtoUrl\` / \`deliverableMailBody\` helpers from \`lib/data.ts\` when available` | REMOVE | Remove sentence (helpers no longer exist) | REMOVED |
| L220 | `\`lib/data.ts\` — domain types, enums, seed data, helpers (...)` | REMAP | Replace with correct module list (see Edit Plan below) | lib/types.ts, lib/score.ts, etc. |
| L236 | `Pages are server components that import data directly from \`lib/data.ts\`` | REPHRASE | `Pages are server components that import typed data from domain modules under \`lib/\`` | lib/*.ts |
| L238 | `the app reads the in-memory seed in \`lib/data.ts\`` | REPHRASE | `the app reads the in-memory seed from \`lib/seed/\`` | lib/seed/ |
| L240 | `Domain types and demo data are co-located in \`lib/data.ts\` (single source of truth)` | REPHRASE | `Domain types are defined in \`lib/types.ts\`; demo seed data lives in \`lib/seed/\`. The Postgres schema in \`database/schema.sql\` mirrors these shapes.` | lib/types.ts, lib/seed/ |
| L248 | `Imports: domain helpers from \`lib/data.ts\`` | REMAP | `Imports: domain types and helpers from \`lib/types.ts\` and role-specific modules (e.g., \`lib/journey.ts\`, \`lib/mentor.ts\`)` | lib/types.ts + role modules |
| L259 | `Location: \`lib/data.ts\` (~1285 lines), \`lib/workflow-data.ts\` (workflow constants), ...` | REPHRASE | Replace with v0.2 module list (see Edit Plan below) | lib/*.ts |
| L266 | `\`GET\` handlers pull rows from \`lib/data.ts\` helpers` | REPHRASE | `\`GET\` handlers pull rows via \`lib/admin-export.ts\` helpers` | lib/admin-export.ts |
| L281 | `TS source: \`lib/data.ts\` (\`Stage\`, \`Checkpoint\`, \`MaturityPhase\`, \`BonusType\`).` | REPHRASE | `TS source: \`lib/types.ts\` (\`LevelId\`, \`SubmissionStatus\`, \`AppRole\`, \`TeamRole\`). Note: Stage/Checkpoint/MaturityPhase/BonusType were v0.1 enums — replaced or removed in v0.2.` | lib/types.ts |
| L285 | `Location: \`lib/data.ts\` (\`bonusRules\`, \`calculateBonusClaim\`).` | REMOVE | Remove bullet (bonus rules engine removed in v0.2) | REMOVED |
| L288 | `Location: \`lib/data.ts\` (\`mailtoUrl\`, \`deliverableMailBody\`, \`reviewReminderBody\`).` | REMOVE | Remove bullet (mailto helpers removed in v0.2 — proof flow revised) | REMOVED |

## Edit Plan

Ordered bottom-to-top (highest line number first) to preserve offsets during sequential application:

### Edit 1 — L288: REMOVE mailto helpers bullet
Remove the line:
`- Location: \`lib/data.ts\` (\`mailtoUrl\`, \`deliverableMailBody\`, \`reviewReminderBody\`).`

### Edit 2 — L285: REMOVE bonusRules bullet
Remove the line:
`- Location: \`lib/data.ts\` (\`bonusRules\`, \`calculateBonusClaim\`).`

### Edit 3 — L281: REPHRASE domain enums TS source
Old: `- TS source: \`lib/data.ts\` (\`Stage\`, \`Checkpoint\`, \`MaturityPhase\`, \`BonusType\`).`
New: `- TS source: \`lib/types.ts\` (\`LevelId\`, \`SubmissionStatus\`, \`AppRole\`, \`TeamRole\`).`

### Edit 4 — L266: REPHRASE export route pull source
Old: `- Pattern: \`GET\` handlers pull rows from \`lib/data.ts\` helpers and return \`csvResponse(filename, toCsv(rows))\` from \`lib/csv.ts\`.`
New: `- Pattern: \`GET\` handlers pull rows via \`lib/admin-export.ts\` helpers and return \`csvResponse(filename, toCsv(rows))\` from \`lib/csv.ts\`.`

### Edit 5 — L259-L260: REPHRASE domain layer location block (two adjacent lines)
Old block (L259-L260):
```
- Location: `lib/data.ts` (~1285 lines), `lib/workflow-data.ts` (workflow constants), `lib/i18n.ts` (FR/EN copy keys), `lib/csv.ts` (CSV serializer + `csvResponse`), `lib/supabase-status.ts` (env probe).
- Contains: `Stage`, `Checkpoint`, `MaturityPhase`, `DeliverableStatus`, `BonusStatus`, `BonusType`, `AppRole`, `TeamRole`, `Startup`, `Deliverable`, `BonusEvent`, `Profile`, `bonusRules`, `calculateBonusClaim`, `journeyPhases`, `navItems`, `dashboardMetrics`, `xpSummary`, `mailtoUrl`, `deliverableMailBody`, `committeeDossierRows`.
```
New block:
```
- Location: domain layer split across ~22 modules under `lib/`: `lib/types.ts` (all TS domain types), `lib/score.ts` (scoring), `lib/journey.ts` (player journey), `lib/mentor.ts` (mentor evaluation), `lib/admin.ts` + `lib/admin-*.ts` (game master), `lib/jury.ts` (pitch), `lib/results.ts` (ranking), `lib/hack-status.ts` (live mode), `lib/announcements.ts`, `lib/seed/` (demo seed data). Shared utilities: `lib/i18n.ts` (copy keys), `lib/csv.ts` (CSV serializer), `lib/supabase-status.ts` (env probe).
- Contains: `LevelId`, `AppRole`, `TeamRole`, `Profile`, `Player`, `Mission`, `DeliverableTemplate`, `Submission`, `Evaluation`, `PitchScore` (lib/types.ts); role-specific aggregates in domain modules.
```

### Edit 6 — L248: REMAP page imports
Old: `- Imports: domain helpers from \`lib/data.ts\`, layout from \`components/app-shell.tsx\`, server actions from \`app/actions.ts\` (passed as \`action={...}\` to \`<form>\`).`
New: `- Imports: domain types and helpers from \`lib/types.ts\` and role-specific modules (e.g., \`lib/journey.ts\`, \`lib/mentor.ts\`, \`lib/admin.ts\`), layout from \`components/app-shell.tsx\`, server actions from \`app/actions.ts\` (passed as \`action={...}\` to \`<form>\`).`

### Edit 7 — L240: REPHRASE co-located sentence
Old: `- Domain types and demo data are co-located in \`lib/data.ts\` (single source of truth). The Postgres schema in \`database/schema.sql\` mirrors these enums and shapes.`
New: `- Domain types live in \`lib/types.ts\`; demo seed data in \`lib/seed/\`. The Postgres schema in \`database/schema.sql\` mirrors these shapes.`

### Edit 8 — L238: REPHRASE in-memory seed reference
Old: `- Dual-mode data layer guarded by \`lib/supabase-status.ts:hasSupabaseEnv()\`. Without env vars, the app reads the in-memory seed in \`lib/data.ts\`; with env vars, server actions write through \`utils/supabase/server.ts:createClient\` and middleware enforces auth.`
New: `- Dual-mode data layer guarded by \`lib/supabase-status.ts:hasSupabaseEnv()\`. Without env vars, the app reads in-memory seed data from \`lib/seed/\`; with env vars, server actions write through \`utils/supabase/server.ts:createClient\` and middleware enforces auth.`

### Edit 9 — L236: REPHRASE pattern overview import reference
Old: `- App Router server-first rendering. Pages are server components that import data directly from \`lib/data.ts\`; client components are introduced only where interactivity demands (e.g., \`components/proof-workflow.tsx\`, \`components/app-shell.tsx\`).`
New: `- App Router server-first rendering. Pages are server components that import typed data from domain modules under \`lib/\`; client components are introduced only where interactivity demands (e.g., \`components/proof-workflow.tsx\`, \`components/app-shell.tsx\`).`

### Edit 10 — L220: REMAP module design list
Old: `- \`lib/data.ts\` — domain types, enums, seed data, helpers (\`mailtoUrl\`, \`deliverableMailBody\`, \`calculateBonusClaim\`)`
New: `- \`lib/types.ts\` — all domain types and string-literal unions (single source of truth for TS shapes)`
And remove the line referencing `lib/workflow-data.ts` (it no longer exists).

### Edit 11 — L192: REMOVE mailto helpers mention in Server Action Return Shape
Old: `- \`mailto\` strings are built with \`encodeURIComponent\` for subject + body (\`app/actions.ts:160-173\`); prefer the shared \`mailtoUrl\` / \`deliverableMailBody\` helpers from \`lib/data.ts\` when available`
New: `- \`mailto\` strings are built with \`encodeURIComponent\` for subject + body (\`app/actions.ts\`).`

### Edit 12 — L187: REMAP validation pattern
Old: `- Mirror domain enums from \`lib/data.ts\` literally in \`z.enum([...])\` lists (e.g., \`Checkpoint\`, \`Stage\`, \`BonusType\`). Keep them in sync with \`lib/data.ts\`.`
New: `- Mirror domain string-literal unions from \`lib/types.ts\` literally in \`z.enum([...])\` lists (e.g., \`LevelId\`, \`SubmissionStatus\`, \`AppRole\`). Keep them in sync with \`lib/types.ts\`.`

### Edit 13 — L155: REMAP type import example
Old: `- Type-only imports use \`type\` keyword: \`import { type AppRole } from "@/lib/data"\` (see \`components/app-shell.tsx:5\`)`
New: `- Type-only imports use \`type\` keyword: \`import { type AppRole } from "@/lib/types"\` (see \`lib/types.ts:7\`)`

### Edit 14 — L144: REMAP single-word libs example
Old: `- Single-word libs: lowercase (e.g., \`lib/data.ts\`, \`lib/i18n.ts\`, \`lib/csv.ts\`)`
New: `- Single-word libs: lowercase (e.g., \`lib/types.ts\`, \`lib/i18n.ts\`, \`lib/csv.ts\`)`

### Edit 15 — L27: REPHRASE section heading
Old: `### Domain types (single source of truth: \`lib/data.ts\`)`
New: `### Domain types (lib/types.ts — single source of truth)`

### Edit 16 — L25: REPHRASE data flow note
Old: `When editing data flow, keep both modes working: type/shape changes in \`lib/data.ts\` must be reflected in the SQL schema and vice versa.`
New: `When editing data flow, keep both modes working: type/shape changes in \`lib/types.ts\` must be reflected in the SQL schema and vice versa.`

### Edit 17 — L22: REPHRASE demo seed reference
Old: `all reads come from the in-memory seed in \`lib/data.ts\` (and workflow constants in \`lib/workflow-data.ts\`).`
New: `all reads come from the in-memory seed in \`lib/seed/\` (players, missions, deliverable templates).`
