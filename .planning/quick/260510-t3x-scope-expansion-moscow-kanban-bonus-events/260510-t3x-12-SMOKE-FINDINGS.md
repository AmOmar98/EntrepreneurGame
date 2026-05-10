# Smoke E2E Findings — T3X EXPANSION (2026-05-10 auto-portion / 2026-05-12 manual-portion TBD)

Date : 2026-05-10 (automated audits) — manual UI smoke pending Omar before deploy 2026-05-12 23h cutoff.
Plan : `.planning/phases/12-quick-260510-t3x/12-12-PLAN.md`
Migrations applied PROD : `bonus_events_recreate_t3x` + `moscow_cards_t3x` (via MCP apply_migration on project `vzzbjxmfkmvqkaqxalhr`, verified 2026-05-10).

## Methodologie

**Auto-portion (Claude orchestrator, 2026-05-10)** : audits statiques source + verification structurelle PROD (schema, RLS policies, build, typecheck).

**Manual-portion (Omar, AVANT cutoff 2026-05-12 23h00)** : smoke UI 40+ screenshots multi-session (Player A / Player B / Mentor / GM) selon plan 12-12 sections A-G.

---

## Automated audits — RESULTS

### A. Build + Typecheck

| Check | Status | Detail |
|---|---|---|
| `npm run typecheck` | PASS | tsc --noEmit exit 0 |
| `npm run build` | PASS | All 22 routes compile, 3 nouvelles routes Phase 12 présentes : `/journey/bonus/[type]`, `/mentor/bonus/[id]`, `/journey/deliverable/[id]/moscow-snapshot`, `/api/export/moscow/[deliverableId].csv` |
| `npm run lint` | PARTIAL | Cible Phase 12 clean ; 6 erreurs pré-existantes dans `scripts/*.cjs` + `smoketest/scripts/*.cjs` (out of scope, non-touchées par Phase 12) |

### B. PROD Supabase schema verification

Query : `select counts(tables/enums/policies/triggers) ...` (cf. SUMMARY 12-04).

Résultat : `{tables_count: 2, enums_count: 4, policies_count: 8, triggers_count: 2}` — tous les attendus rencontrés.

### C. RLS policies present in PROD (8 total, verified via pg_policies)

**bonus_events (4)** :
- `bonus_events_select` (USING: `is_my_player(project_id) OR is_mentor()`)
- `bonus_events_player_insert` (CHECK strict: `is_my_player AND claimed_by=auth.uid() AND status='submitted' AND reviewed_by IS NULL AND reviewed_at IS NULL`)
- `bonus_events_mentor_update` (USING+CHECK: `is_mentor() OR is_game_master()`)
- `bonus_events_gm_delete` (USING: `is_game_master()`)

**moscow_cards (4)** :
- `moscow_cards_select` (USING: `is_my_player(project_id) OR is_mentor()`)
- `moscow_cards_player_insert` (CHECK: `is_my_player AND created_by=auth.uid()`)
- `moscow_cards_player_update` (USING+CHECK: `is_my_player OR is_game_master()`)
- `moscow_cards_player_delete` (USING: `is_my_player OR is_game_master()`)

**Verdict structurel** : RLS isolation cross-team garantie par `is_my_player(project_id)` helper. **Pending manual verification** : 2 sessions Player distinctes (étapes C.2/C.3 plan 12-12).

### D. R1 STRICT static audit zone Player (new surfaces Phase 12)

Grep zone : `components/bonus-*`, `components/moscow-*`, `app/journey/bonus/`, `app/journey/deliverable/[id]/moscow-snapshot/`.

| Surface | Pattern | Hits | Verdict |
|---|---|---|---|
| components/bonus-claim-form.tsx | `/100|/140|toFixed|multiplier_factor|points|score|rank` | 0 (excl. comments) | PASS |
| components/bonus-status-badge.tsx | idem | 0 | PASS |
| components/moscow-card.tsx | idem | 0 | PASS |
| components/moscow-kanban.tsx | idem | 0 | PASS |
| components/mentor-bonus-review-form.tsx | idem | 0 (gated mentor view, mais aucun numeric leak intentionnel) | PASS |
| app/journey/bonus/[type]/page.tsx | idem | 0 | PASS |
| app/journey/deliverable/[id]/moscow-snapshot/page.tsx | idem | 0 | PASS |

**Hits pré-existants (NON-Phase 12)** :
- `app/journey/deliverable/[id]/page.tsx` : `max_score`, `total_score`, `scores` — rubric system existant (v0.1), exposé mentor/GM par design, non-régression.
- `app/results/page.tsx` : `pitchAvg.toFixed(1)`, `scoreProject.toFixed(1)` — ranking GM-gated (Phase 11 B1 fix, commit `c740d48`), non-régression.

### E. R2 audit warn-only on new actions

Grep `throw new Error|throw new` dans `app/actions.ts` sur 7 nouvelles actions (commit `f6905e5`) : **0 hit** PASS.

Toutes les nouvelles actions retournent `WorkflowState { ok, message }` jamais throw — pattern conforme.

### F. R3 audit no inter-mission blocking

Grep `blocks_progression_to|disabled.*because.*mission` dans `app/` + `components/` : 1 hit doc-comment dans `components/bonus-claim-form.tsx` (préservation note) + 0 hit logique réelle. PASS.

`disabled={pending}` sur boutons submit pendant `useTransition` est la seule occurrence DOM disabled, conforme convention UX standard.

---

## Findings table

| ID | Severity | Step | Description | Repro | Status |
|----|----------|------|-------------|-------|--------|
| T3X-SMK-AUTO-01 | LOW (info) | Auto-A | npm run lint a 6 erreurs pré-existantes dans .cjs scripts hors scope | Constatation, non-blocker | Open (déjà tracé Plan 12-05 SUMMARY) |
| _(manual smoke pending)_ | | | | | |

**Aucun blocker détecté côté audits automatisés.** Le go-live 13/05 nécessite encore le manual smoke complet (étapes A-G plan 12-12).

---

## Migrations apply log

| Migration | Applied | Status |
|---|---|---|
| `bonus_events_recreate_t3x` (= `20260510170000_bonus_events_recreate.sql`) | 2026-05-10 via MCP `apply_migration` | success |
| `moscow_cards_t3x` (= `20260510170100_moscow_cards.sql`) | 2026-05-10 via MCP `apply_migration` | success |

Idempotency garantie par DDL : DO block (enums), IF NOT EXISTS (tables/indexes), DROP+CREATE (policies/triggers).

---

## Go/No-Go decision

**Status au 2026-05-10** : audits automatisés tous PASS. Schema PROD prêt. Build/typecheck OK. Cardinaux R1/R2/R3 préservés structurellement.

**Pending Omar** :
- [ ] Manual UI smoke 40+ screenshots multi-session (étapes A-G plan 12-12, 4-6h)
- [ ] R1 audit visuel HTML rendu via DevTools (étape B.11)
- [ ] RLS isolation runtime test 2 sessions Player distinctes (étapes C.2/C.3)
- [ ] Bonus claim → mentor validate → "Boost actif" badge end-to-end (étapes B.9 → D.7 → D.8)

**Décision conditionnelle** : SI manual smoke 0 blocker → **go-live 13/05 8h30 unblocked**. SI 1+ blocker → triage hot-fix séparé, re-smoke, décision Omar.

---

## Hot-fix queue

Vide à ce stade.

---

## Next steps

1. Omar exécute manual smoke (cf. plan 12-12 étapes A-G) avant cutoff merge `main` 2026-05-12 23h00
2. Si OK → tag `v0.2.X-post-phase12` + deploy Vercel
3. Smoke prod URL `https://entrepreneur-game-six.vercel.app` post-deploy
4. Go-live 2026-05-13 08h30 AgreenTech Hack-Days
