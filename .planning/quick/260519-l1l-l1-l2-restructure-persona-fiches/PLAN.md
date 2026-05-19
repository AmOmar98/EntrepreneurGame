# PLAN.md — quick 260519-l1l — L1/L2 restructure (Persona + Préparation + 10 Fiches entretien)

> **STATUS : FINAL (post-Q1..Q5 Omar 2026-05-19)**
> Décisions Omar verbatim : "Q1 A mais garder link design thinking en bonus en bas de barre de progression; Q2 A avec 10 input url ; Q3 C le 2A sera validé par les mentor/game masters avant de lancer le 2B !; Q4 B ; Q5 A et ii"
> Précision critique : "pour ce cas il est obligatoire d'avoir le blocage impératif pédagogique" → HARD BLOCK 2A→2B (exception R3 signée Omar).

## Slug retenu
`260519-l1l-l1-l2-restructure-persona-fiches`

## Intent
Restructurer L1+L2 :
- L1 = Persona principal + Design Thinking en BONUS de fin de barre.
- L2 = M2 nouvelle "Préparation + Entretiens" avec 2 deliverables :
  - 2A `prep-questions-v1` (PDF 02a) — noté classique /25 par mentor
  - 2B `fiches-entretien-v1` (PDF 02b) — 10 URL HTTPS, auto-validé 10×25=250, **HARD-BLOCKED tant que 2A non `validated`**.
- Cascade M2..M7 (option B) : 6 missions → 7 missions.

## Nouvelle structure 7 missions

| New | Old | Mission title | Deliverables |
|-----|-----|---------------|--------------|
| M1 L1 ord=1 | M1 (inchangé) | Atelier 1 — Persona + Design Thinking (bonus) | `persona-v1` (ord=1, is_bonus=false), `design-thinking-v1` (ord=2, is_bonus=true) |
| M2 L2 ord=2 | NEW | Atelier 2 — Préparation entretiens + Fiches | `prep-questions-v1` (ord=1, is_bonus=false), `fiches-entretien-v1` (ord=2, is_bonus=false, hard-blocked) |
| M3 L3 ord=3 | M2 (BMC) | Atelier 3 — Business Model Canvas | `bmc-v1` (ord=1) |
| M4 L4 ord=4 | M3 | Atelier 4 — Étude marché & technique | `marche-technique-v1`, `moscow-v1`, `tam-sam-som-v1` (bonus), `positionnement-v1` (bonus), `comparaison-v1` (bonus) |
| M5 L4 ord=5 | M4 | Atelier 5 — Stratégie commercialisation | `commercialisation-v1`, `strategie-100-users-v1` (bonus) |
| M6 L5 ord=6 | M5 | Atelier 6 — Unit Economics | `unit-economics-v1` |
| M7 L5 ord=7 | M6 | Atelier 7 — Techniques pitch + Pitch jury | `techniques-pitch-v1`, `pitch-deck-v1` |

**Note Welcome Guide PDF désync** : programme initial 6 ateliers en 2 jours, structure passe à 7. Désync hors-code, gérée par Omar côté coordination Welcome Guide (mentionnée dans SUMMARY).

**Note level_id mapping** : L1=M1, L2=M2, L3=M3, L4=M4+M5, L5=M6+M7. Conforme schema actuel (multi-mission par level_id supporté, cf M4+M5 sur L4).

## Décisions Q1..Q5 → opérations

### Q1 (A modifiée) — Persona promu, Design Thinking bonus
- `persona-v1` : flip `is_bonus = false`, `ord = 1` (PROD actuel : `is_bonus=true ord=2`)
- `design-thinking-v1` : flip `is_bonus = true`, `ord = 2` (PROD actuel : `is_bonus=false ord=1`)
- PROD vérifiée : 0 submission sur les 2 slugs → flip propre sans migration data.
- Mission M1 title → "Atelier 1 — Persona + Design Thinking (bonus)".

### Q2 (A + 10 URL inputs) — `fiches-entretien-v1`
- 1 deliverable_template unique, `max_score = 250` (10 × 25).
- `proof_text` stocke JSON : `{ "fiches": [{ "url": "..." }, ..., 10 items] }` (`kind = 'proof_text'`).
- UI v1 : composer dédié 10 inputs URL (cf section "Implémentation" — fallback simple : textarea avec 10 lignes acceptée, composer multi-input prévu).

### Q3 (C + HARD BLOCK) — 2A→2B gate
- 2A `prep-questions-v1` : workflow standard mentor verdict (validate_v1 / request_v2 / etc.). `max_score = 25`, rubric simple.
- 2B `fiches-entretien-v1` : visible mais composer rendu mais "disabled-effect" si 2A pas validé. Server action `submitDeliverable` REJETTE backend (defense in depth) avec message "Préparation 2A à valider par votre mentor avant de débloquer les fiches d'entretien.".
- **R3 exception explicite signée Omar 2026-05-19 — uniquement entre 2A→2B sur L2. R3 reste actif partout ailleurs.**

### Q4 (B) — Full cascade M2..M7
- UPDATE missions ords (cf table ci-dessus). PK `(event_id, level_id, ord)` → renumeroter avec un offset temporaire pour éviter conflits.
- Stratégie SQL : `UPDATE missions SET ord = ord + 100 WHERE event_id = ...; -- shift away` puis `INSERT` nouvelle M2 ord=2, puis re-`UPDATE` chaque mission vers son ord cible.

### Q5 (A + ii) — Auto-validation note fixe 25
- À INSERT submission `fiches-entretien-v1` (Zod validation 10 URLs httpsUrl) :
  1. Insert `submissions` row : `kind='proof_text'`, `proof_text = JSON 10 URLs`, `status = 'validated'` (direct).
  2. Insert `evaluations` row : `evaluator_id = SYSTEM_AUTO_VALIDATOR_USER_ID` (Omar `59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334`), `verdict = 'validate_v1'`, `scores = { fiche_1: 25, ..., fiche_10: 25 }`, `total_score = 250`, `feedback = "Auto-validé : 10 fiches d'entretien soumises (25/25 par fiche, note fixe Q5-ii)."`
  3. Trigger `trg_evaluation_recalc` recompute `players.score_project` automatiquement.
- Mentor UI : consultation lecture-seule (verdict + scores), pas d'édition.

## Tasks atomiques (commits)

| # | Task | Files | Commit prefix |
|---|------|-------|---------------|
| T1 | Tag pré-edit | n/a | `git tag v0.2.1-pre-l1-l2-restructure` |
| T2 | SQL migration : missions M2..M7 + persona/DT flip + 2 new templates (prep-questions-v1 + fiches-entretien-v1) | `.planning/quick/260519-l1l-.../NEW2.sql` + apply PROD | `feat(seed-l1l): restructure missions + L1/L2 templates (apply PROD via MCP)` |
| T3 | Sync `database/seed_event_digi_hackathon.sql` (canonical, deny workaround : commit après MCP apply) | `database/seed_event_digi_hackathon.sql` | inclus dans T2 commit |
| T4 | Server action branches : hard-block 2A→2B + auto-validation `fiches-entretien-v1` | `app/actions.ts` | `feat(actions): hard-block fiches-entretien on prep-questions + auto-validate 250 XP` |
| T5 | Composer 10 inputs URL + DOM gate | `components/submission-form.tsx` (extension) + `app/journey/deliverable/[id]/page.tsx` (branch on slug) | `feat(ui): 10-URL composer + amber gating for fiches-entretien` |
| T6 | Template links : ajouter `prep-questions-v1` + `fiches-entretien-v1` | `lib/template-links.ts` | inclus dans T5 |
| T7 | CLAUDE.md : documente R3 exception L2 + nouvelle structure 7 missions | `CLAUDE.md` | `docs(claude): document M2 prep+entretiens + R3 exception L2` |
| T8 | SUMMARY + deferred-items + ADVISOR-VERDICT | quick dir | `docs(quick-260519-l1l): wrap with SUMMARY + verdict` |

## Smoke après chaque wave
```
npm run typecheck && npm run lint && npm run build
```
Plus grep R1 audit après T5 :
```bash
grep -rn "score\|rank\|note\|/100\|/140\|/250\|points\|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"
# DOIT être vide hors page détail livrable
grep -rn "rank\|classement\|percentile\|leaderboard" app/journey/deliverable/
# DOIT rester vide
```

## Risques résiduels & mitigations

| # | Risque | Mitigation |
|---|--------|-----------|
| R-A | Composer 10 inputs URL = nouveau composant client lourd | V1 fallback : textarea avec 10 lignes parseable côté server (R1 conservé). V2 composer dédié peut suivre dans quick séparé. |
| R-B | `submissions` schema PK `(player_id, deliverable_template_id, version)` — auto-validation insert direct vers `status=validated` peut court-circuiter cycle V1→eval→validated normal | Validé pédagogiquement : pas de cycle de feedback humain souhaité (Q5-A). Trigger XP fonctionne sur INSERT evaluations row, donc OK si on insère manuellement la ligne eval juste après. |
| R-C | Mailto length 10 URLs → > 2000 chars | Pas de mailto sur ce flow auto-validé (pas besoin de notifier mentor — auto-validation). Skip mailto entirely. |
| R-D | Cascade SQL avec offset temporaire = risque d'interruption mi-migration | Transaction explicite BEGIN/COMMIT. Si rupture, rollback automatique. |
| R-E | Hard-block exception R3 contamine reste codebase | Branche guard isolée par slug literal (`prep-questions-v1` / `fiches-entretien-v1`) — pas de mécanisme générique réutilisable. Documenté en CLAUDE.md. |
