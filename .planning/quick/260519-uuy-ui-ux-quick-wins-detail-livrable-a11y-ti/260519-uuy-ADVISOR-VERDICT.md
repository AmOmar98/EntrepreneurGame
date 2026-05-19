# ADVISOR VERDICT — Quick 260519-uuy

**Date** : 2026-05-19
**Reviewer** : eic-pedagogical-advisor
**Verdict global** : PASS_CONDITIONAL

---

## Task 1 — Feedback mentor visible

**Fichiers** : `components/submission-readonly.tsx`, `lib/i18n.ts`

- **R1** : PASS_CONDITIONAL
  - Le plan rend uniquement `evaluation.feedback` (texte libre) et `evaluation.expectedAction` — pas de score, rang, percentile, classement. Le score reste exclusivement rendu par `DeliverableScoreBlock` déjà en place (`submission-readonly.tsx:79-86`). Le verdict est volontairement non rendu. Conforme R1 révisée 2026-05-11 (page détail livrable = seul lieu autorisé Player-facing).
  - **Faille mineure côté contenu mentor** : `feedback` est du texte libre. R1 protège le **code** contre l'injection de chiffres ordinaux, pas le **contenu mentor**. Un mentor qui écrirait "tu es top 3" leakerait du rang via prose. Hors-périmètre code mais signalé comme garde-fou pédagogique.
  - **Condition C1 (bloquante)** : Avant commit Task 1, grep `SubmissionReadonly` et confirmer que tous les call-sites passant `evaluation != null` sont sous `app/journey/deliverable/[id]/`. Sinon restreindre le render via flag `showMentorFeedback`.

- **R2** : PASS — composant lecture-seule, aucun validator touché, aucun blocage de soumission introduit.

- **R3** : PASS — aucun champ `blocks_progression_to`, `requires`, `dependsOn`, `prerequisite`, `lockedUntil` introduit. Aucun gating runtime.

---

## Task 2 — A11y submit messages (préfixe ✓/⚠ + aria-label ticket)

**Fichiers** : `components/submission-form.tsx`, `components/submission-ticket.tsx`, `lib/i18n.ts`

- **R1** : PASS — aucun chiffre/score/rang ajouté. L'aria-label dynamique du ticket SOUMIS expose `deliverableTitle + version + date`, jamais un score.

- **R2** : PASS — pas un validator, ne change pas la branche `severity`.

- **R3** : PASS — pas de gating.

- **FYI non-bloquant** : Les caractères `✓` (U+2713) et `⚠` (U+26A0) ne sont **pas ASCII pur** contrairement à ce que dit le plan. Convention codebase (CLAUDE.md i18n) demande "Avoid accented characters in code-resident strings". Le précédent `📋` à `fiches-entretien-composer.tsx:132` casse déjà cette convention donc précédent acquis. Pas de blocage — juste rectifier la rationale "ASCII safe" dans la `done` log.

---

## Task 3 — CTA hard-block L2 (Link retour prep-questions-v1)

**Fichiers** : `components/fiches-entretien-composer.tsx`, `app/journey/deliverable/[id]/page.tsx`, `lib/i18n.ts`

- **R1** : PASS — aucun chiffre ajouté dans la bannière locked. Le Link n'expose ni score ni progression numérique.

- **R2** : PASS — la bannière warn (ambre) reste un avertissement UX ; le hard-block server-side `HARD_BLOCK_DEPENDENCIES` (cf. memory `project_l2_prep_entretien_hard_block.md`) demeure l'unique mécanisme de blocage et n'est pas touché. Le CTA aide à franchir, ne contourne pas.

- **R3** : PASS_CONDITIONAL — **point critique**
  - Le plan ne touche ni à `HARD_BLOCK_DEPENDENCIES` ni à `lib/types.ts`. Confirmé par lecture du PLAN.
  - L'exception unique L2 signée Omar 2026-05-19 (literal slug `prep-questions-v1` → `fiches-entretien-v1`) reste figée. Le nouveau prop `prepQuestionsDeliverableId` est purement présentationnel (un href).
  - **Condition C3 (bloquante)** : L'executor NE DOIT PAS introduire de mécanisme générique de découverte du prerequisite (genre champ `requires` sur le template ou helper `getPrerequisite(slug)`). La page détail livrable doit lire `prep-questions-v1` en littéral, comme c'est déjà le cas. Si l'executor refacto en chemin, BLOCK immédiat.
  - **Condition C4 (bloquante)** : Le prop `prepQuestionsDeliverableId?: string | null` doit rester **optionnel et nullable**. Si l'executor le rend `required`, ça force tous les call-sites futurs à fournir une dépendance — c'est le début d'une généralisation R3-interdite.
  - **Condition C5 (non-bloquante)** : Ajouter dans le commentaire d'en-tête du composer une ligne explicite "ce prop existe pour la SEULE exception L2 prep→entretien" pour rappeler l'unicité aux futurs lecteurs.

---

## Conditions globales pour passer en exécution

1. **C1 (Task 1)** : Grep `SubmissionReadonly` call-sites Player-facing avant commit Task 1.
2. **C3 (Task 3)** : Aucune introduction de champ générique `requires`/`prerequisite`/`dependsOn` dans `lib/types.ts`, `DeliverableTemplate`, ou les seeds. Slug `prep-questions-v1` literal côté server ET côté page détail.
3. **C4 (Task 3)** : `prepQuestionsDeliverableId?: string | null` (optionnel + nullable). Fallback gracieux quand null (Link non rendu, bannière seule).
4. **Audit grep R1 post-execution obligatoire** (cf. CLAUDE.md pre-edit guards) :
   ```
   grep -rn "score|rank|note|/100|/140|points|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"
   ```
   Doit rester vide. Et :
   ```
   grep -rn "rank|classement|percentile|leaderboard" app/journey/deliverable/
   ```
   Doit rester vide.
5. **Smoke régression** : `npm run typecheck && npm run lint && npm run build` exit 0 après chacun des 3 commits atomiques (CLAUDE.md merge policy).

---

## Recommandations non-bloquantes (FYI executor)

- **Brief mentor opérationnel** (hors code) : rappeler aux mentors de ne pas écrire de rang/percentile dans `feedback`.
- **Task 2 rationale rectif** : la prose "ASCII pur" est inexacte — `✓` et `⚠` sont UTF-8 multi-octets. Garder l'intention (couleur+texte = WCAG 1.4.1) mais corriger le wording dans le SUMMARY post-exec.
- **Task 3 commentaire d'en-tête composer** : ajouter une ligne mentionnant que `prepQuestionsDeliverableId` matérialise l'exception unique L2 signée Omar 2026-05-19.
- **3 commits atomiques séparés** : confirmer ordre task1→task2→task3 (sans dépendance croisée) pour rollback chirurgical `git revert <sha>`.

---

**Verdict final** : PASS_CONDITIONAL — autoriser l'exécution sous les 5 conditions ci-dessus.
