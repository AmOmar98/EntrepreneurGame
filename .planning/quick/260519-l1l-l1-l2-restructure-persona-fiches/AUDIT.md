# AUDIT.md — quick 260519-l1l — Pre-edit zones sensibles

## État repo au lancement
- Branche : `main`
- HEAD : `3abb450 chore: clean repo — wrap untracked artifacts + extend gitignore`
- Tag rollback dispo : `v0.2-pilot-ready` (commit `ccdc2bc`)
- Status : 7 MD trackés-supprimés + `database/seed_event_digi_hackathon.sql` modifié (state from quick 260519-pyx — non commit)
- PROD : 13 deliverables actifs (sync 260519-pyx). `database/seed_event_digi_hackathon.sql` désync vs PROD.

## Pre-edit guards CLAUDE.md (zones touchées par ce quick)

### Files à éditer (estimation pré-discuss)

| Path | R1 risk | R2 risk | R3 risk | Mode |
|------|---------|---------|---------|------|
| `lib/types.ts` | NA | NA | LOW (ajout type) | Edit |
| `lib/seed/missions.ts` | NA | NA | NA | Edit (demo only) |
| `lib/seed/deliverableTemplates.ts` | NA | NA | NA | Edit (demo only) |
| `app/actions.ts` `submitDeliverable` | LOW (status validated direct) | MED (warn-only sur 10 URLs) | LOW | Edit |
| `app/journey/deliverable/[id]/page.tsx` | **HIGH (10 notes /25 affichées)** | NA | NA | Edit |
| `components/deliverable-score-block.tsx` | **HIGH (rendering breakdown)** | NA | NA | Edit |
| `components/journey-deliverable-card.tsx` | **HIGH (carte /journey index)** | NA | LOW | Read-only verify, NO score leak |
| `database/seed_event_digi_hackathon.sql` (NEW2 dans quick dir) | NA | NA | NA | Write workaround + MCP apply |
| `lib/score.ts` | NA | NA | NA | Read-only verify (normalisation 250pts) |
| `lib/results.ts` | **HIGH (résultats Player)** | NA | NA | Read-only verify, R1 grep |

### Hot zones légitimes (R1 exception)
- `app/journey/deliverable/[id]/` — affichage scores/breakdown OK
- `components/deliverable-score-block.tsx` — composant légitime

### Zones interdites (R1 strict)
- `app/journey/page.tsx` (index)
- `app/results/**` côté Player
- `components/journey-track.tsx`, `journey-level-node.tsx`
- `components/admin-*.tsx` (mais Admin/GM, donc OK — pas Player-facing)
- Mascot, milestones, navbar

## Audit grep prévu post-edit (R1)

```bash
# Côté Player hors page détail livrable, hors composant détail score
grep -rn "score\|rank\|note\|/100\|/140\|/250\|points\|toFixed" \
  app/journey app/results components/results-* components/submission-* \
  --include="*.tsx" \
  | grep -v "app/journey/deliverable/" \
  | grep -v "components/deliverable-score-block"
# Aucun match attendu

# Rang interdit même sur détail
grep -rn "rank\|classement\|percentile\|leaderboard" app/journey/deliverable/
# Doit rester vide
```

## Audit dual-mode demo
- `hasSupabaseEnv()` check requis avant tout `getCurrentUser()` ou `redirect("/login")`.
- Demo seed (`lib/seed/*`) reste accessible sans Supabase — DOIT inclure le nouveau template `fiches-entretien-10-v1` pour ne pas casser le mode démo.

## Audit DB

### Vérifications avant DELETE / UPDATE prod
```sql
-- Compter submissions existantes sur design-thinking-v1 avant suppression
select count(*) from submissions s
join deliverable_templates dt on dt.id = s.deliverable_template_id
where dt.slug = 'design-thinking-v1';
-- Si > 0 : MIGRATE (ne pas DELETE)

-- Compter submissions sur bmc-v1 (déplacé L2 → L3)
select count(*) from submissions s
join deliverable_templates dt on dt.id = s.deliverable_template_id
where dt.slug = 'bmc-v1';
-- Si > 0 : MIGRATE mission_id (UPDATE), pas DELETE+REINSERT
```

### FK risk
- `submissions.deliverable_template_id` → `deliverable_templates.id` avec `ON DELETE RESTRICT`. Tout DELETE casse si une submission existe.
- `evaluations.submission_id` → `submissions.id` ON DELETE CASCADE — pas de blocage.
- `xp_ledger.deliverable_template_id` (si présent) à vérifier.

### Trigger XP
- `trg_evaluation_recalc` recompute `players.score_project` quand une `evaluations` row est insérée. Si auto-validation skip `evaluations`, le score n'est jamais aggregé. **DOIT être corrigé** côté `submitDeliverable` (insérer une row eval auto) OU côté trigger (écouter aussi `submissions.status='validated'` direct).

## Decisions log
- 2026-05-19 : run discuss-only, pas d'edit code/SQL.
- Slug ID base36 = `l1l` (3 chars, libre dans `.planning/quick/`).
- Quick dir créé : `.planning/quick/260519-l1l-l1-l2-restructure-persona-fiches/`.

## Verdict pré-discuss
- ✅ Zones sensibles identifiées (10 files TS + 1 SQL).
- ✅ R1/R2/R3 risk-mapped.
- ✅ Risques DB cataloguées (R-01 trigger, R-02 size, R-03 cascade, R-04 bonus flag, R-05 FK, R-06 normalisation).
- ⏳ Spawn `eic-pedagogical-advisor` reporté à phase Execute (PLAN doit être finalisé avec réponses Omar d'abord).
- ⏳ Aucun edit autorisé tant que Q1..Q5 non tranchées.
