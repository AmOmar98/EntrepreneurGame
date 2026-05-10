# R1 Audit Outcome

## Contexte

Pilote AgreenTech 13-14 mai 2026 — règle cardinale R1 (`T3-IMPROVEMENTS.md` + `EIC-MANAGER-ANSWERS-AGREENTECH.md`) : score INVISIBLE côté Player.
3 tâches : audit grep brut → gate eic-pedagogical-advisor → application patches confirmés.

## Patches appliqués (commits atomiques)

| # | Fichier | Ligne | Avant | Après | Commit SHA | Typecheck |
|---|---|---|---|---|---|---|
| 1 | `app/journey/deliverable/[id]/page.tsx` | 313 | `<strong>{c.label}</strong> ({c.max} pts)` | `<strong>{c.label}</strong>` | `1291f94` | OK |

## Faux positifs documentés (R1 non violée)

- `lib/i18n.ts:655` · `submission_rubric: "Scoring rubric"` (EN dictionary) — Justification advisor : locale active figée `fr` (`dictionaries.fr` en dur dans toutes les pages Player) ; valeur EN jamais rendue en production au pilote. La valeur FR (`"Criteres d'evaluation"`) est neutre R1.

## Laisser-tel-quel-documentés (chaîne nécessaire mais non visible Player)

Les 5 entrées ci-dessous proviennent de `components/submission-feedback-card.tsx`, composant **dead code** — non importé dans `app/` depuis Phase 7 (RevisionPanel l'a remplacé). Grep `SubmissionFeedbackCard` dans `app/` : 0 résultats.

- `components/submission-feedback-card.tsx:2` · `// Displays the latest Mentor evaluation (verdict, total score, per-criterion` — Preuve non-visibilité : commentaire `//`, jamais rendu en UI.
- `components/submission-feedback-card.tsx:10-11` · `scores: Record<string, number>` / `totalScore: number` — Preuve non-visibilité : déclarations de type TypeScript, jamais rendues en UI.
- `components/submission-feedback-card.tsx:78` · `{t.feedback_card_total} : {evaluation.totalScore.toFixed(1)}` — Preuve non-visibilité : composant non importé dans `app/` (dead code) ; si réactivé, ce serait une violation R1 confirmée (`"Note totale"` + valeur numérique).
- `components/submission-feedback-card.tsx:91` · `{t.feedback_card_scores}` / `{display} / {c.max}` — Preuve non-visibilité : idem dead code. `{display} / {c.max}` serait la fraction R1 la plus grave si rendu (ex : "12 / 20").
- `lib/i18n.ts:297-298` · `feedback_card_total: "Note totale"` / `feedback_card_scores: "Notes par critere"` — Preuve non-visibilité : clés consommées uniquement par `SubmissionFeedbackCard` (dead code). Grep confirmé 0 autres occurrences dans `app/` ou `components/`.

**Recommandation post-pilote** : supprimer `components/submission-feedback-card.tsx` + clés i18n associées (`feedback_card_*`, `feedback_verdict_*`) dans un sprint de nettoyage — hors scope R1.

## Patches échouées (revertées)

(vide — 1 patch appliquée avec succès)

## Anomalies / escalades à Omar

(vide — 0 cas ambigus, 0 escalades)

## Garde-fous respectés

- [x] Aucun edit dans `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`
- [x] `lib/data.ts` non modifié — ne s'applique pas (fichier n'existe pas dans ce projet ; logique métier dans `lib/types.ts`, `lib/score.ts`, etc. — tous non modifiés)
- [x] Dual-mode (demo + Supabase) intact (aucun changement `utils/supabase/`, `lib/supabase-status.ts`, `middleware.ts`)
- [x] `npm run typecheck` final : PASS (exit 0 avant et après patch)
- [x] Tous les commits posés sont atomiques (1 patch = 1 commit), message format `chore(r1): hide ... — file:Lxx`
- [x] Usages légitimes XP / progression / X/N champs / Cohort Pulse / SOUMIS conservés intacts — revision-panel.tsx (`{rewardXp} XP`), journey-level-node.tsx, submission-ticket.tsx : 0 touches

## Métriques finales

- Violations candidates initiales (Tâche 1) : 7 (1 active + 6 dead code)
- Violations candidates **actives** (rendu Player possible) : 1
- Confirmées par advisor : 1
- Patches appliqués avec succès : 1
- Faux positifs : 1
- Laisser-tel-quel-documentés : 5 (tous dead code `submission-feedback-card.tsx`)
- Commits posés : 1 patch `chore(r1):` + (1 SUMMARY docs commit à venir par orchestrator)

## Sanity check post-patch

Re-grep `\bpts\b` sur `app/journey/deliverable/[id]/page.tsx` après patch → ligne 313 ne contient plus `pts` (uniquement le label du critère). Les autres occurrences de `pts` dans le codebase sont dans des zones hors scope (admin, mentor, etc.).

## Suivi

- L'audit ne couvre que les chaînes textuelles UI. Les changements de logique scoring (formule 20/80, bonus AAP, Z-score mentor V0.3) sont hors scope — voir `T3-IMPROVEMENTS.md` section H.
- Schemas v2 (deliverable_templates avec `severity: "warn"`) NON seedés ici — tâche dédiée séparée (cf. T3-IMPROVEMENTS section F).
- Dead code `submission-feedback-card.tsx` : à supprimer post-pilote (sprint nettoyage). Contient des violations R1 latentes (`totalScore.toFixed(1)`, `{display} / {c.max}`) — inoffensives tant que le composant reste non-importé.
