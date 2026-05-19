---
phase: quick-260519-uuy
plan: 01
type: execute
status: completed
completed: 2026-05-19
tasks_total: 3
tasks_completed: 3
commits:
  - sha: 4a2a0ff
    task: 1
    title: "feat(quick-260519-uuy): render mentor feedback in submission-readonly"
  - sha: 282b9ec
    task: 2
    title: "feat(quick-260519-uuy): a11y prefix submit messages + descriptive ticket aria"
  - sha: 7338ae4
    task: 3
    title: "feat(quick-260519-uuy): actionable CTA back-to-prep in fiches-entretien locked banner"
files_modified:
  - components/submission-readonly.tsx
  - components/submission-form.tsx
  - components/submission-ticket.tsx
  - components/fiches-entretien-composer.tsx
  - app/journey/deliverable/[id]/page.tsx
  - lib/i18n.ts
requirements:
  - QW-UUY-01-feedback-mentor-visible
  - QW-UUY-02-a11y-submit-messages
  - QW-UUY-03-cta-hard-block-l2
---

# Quick 260519-uuy — UI/UX Quick Wins Detail Livrable (a11y + ticket + L2 hard-block CTA)

3 amélirations UX/UI quick-wins sur la page détail livrable du Player livrées en 3 commits atomiques rollback-friendly.

## Commits (3 atomic, in order)

| # | SHA | Title | Diffstat |
|---|-----|-------|----------|
| 1 | `4a2a0ff` | feat(quick-260519-uuy): render mentor feedback in submission-readonly | 2 files / +69 −1 |
| 2 | `282b9ec` | feat(quick-260519-uuy): a11y prefix submit messages + descriptive ticket aria | 3 files / +20 −1 |
| 3 | `7338ae4` | feat(quick-260519-uuy): actionable CTA back-to-prep in fiches-entretien locked banner | 3 files / +54 −2 |

**Rollback granulaire** : chaque commit isolé → `git revert <sha>` chirurgical OK.

## Task summaries

### Task 1 — Feedback mentor visible (statuts validated / rejected / submitted_v2)
- `components/submission-readonly.tsx` : type `SubmissionReadonlyProps.evaluation` étendu avec `feedback: string`, `expectedAction: string | null`, `verdict: Verdict` (verdict importé mais NON rendu — symétrie type uniquement).
- Carte « Commentaire de votre mentor » rendue conditionnellement sous `<DeliverableScoreBlock>` quand `evaluation.feedback.trim().length > 0`.
- `expectedAction` sous-rendu en sous-paragraphe quand non-vide.
- `lib/i18n.ts` : 2 nouvelles clés fr+en (`mentor_feedback_card_title`, `mentor_feedback_expected_action_label`).
- `feedback_received` n'est PAS dans la liste de statuts qui passent `evaluation` à `SubmissionReadonly` (cf. page.tsx:235-240) — pas de double-render avec `RevisionPanel`.

### Task 2 — A11y préfixe ✓/⚠ + aria-label dynamique ticket SOUMIS
- `components/submission-form.tsx` : préfixe textuel `t.submission_form_success_prefix` / `error_prefix` avant `{state.message}` — WCAG 1.4.1 (le statut n'est plus véhiculé par la couleur seule).
- `components/submission-ticket.tsx` : aria-label dynamique `"${t.submission_ticket_aria} : ${deliverableTitle} - V${version} - ${date}"` pour contexte NVDA/VoiceOver. Stamp + rays restent `aria-hidden`.
- `lib/i18n.ts` : 2 prefix keys fr+en (`submission_form_success_prefix` = "✓ ", `submission_form_error_prefix` = "⚠ ").
- **Rectif rationale ASCII** (FYI advisor) : les caractères ✓ (U+2713) et ⚠ (U+26A0) sont **UTF-8 multi-octets, pas ASCII pur**. Le PLAN parlait à tort de "ASCII safe". L'intention WCAG 1.4.1 (couleur + texte) est préservée, et le précédent emoji 📋 dans `fiches-entretien-composer.tsx:132` casse déjà cette convention — pas de blocage.

### Task 3 — CTA actionnable « Revenir à la préparation 2A » dans bannière locked
- `app/journey/deliverable/[id]/page.tsx` : `prepQuestionsDeliverableId: string | null` hoisté depuis le bloc `isFichesEntretienDeliverable` existant. Slug `prep-questions-v1` reste **literal** côté server (condition C3 advisor respectée).
- `components/fiches-entretien-composer.tsx` :
  - Import `Link` from `next/link` + `dictionaries` from `@/lib/i18n`.
  - Nouveau prop `prepQuestionsDeliverableId?: string | null` (**optionnel + nullable** — condition C4 advisor respectée).
  - Commentaire d'en-tête enrichi mentionnant explicitement l'exception unique L2 prep→entretien signée Omar 2026-05-19 et l'interdiction de généraliser le prop (condition C5 advisor respectée).
  - Bannière locked enrichie d'un `<Link>` CTA quand `prepQuestionsDeliverableId` non-null. Fallback gracieux : Link omis quand null, bannière seule reste.
- `lib/i18n.ts` : 1 clé fr+en (`fiches_locked_cta_back_to_prep`).
- `HARD_BLOCK_DEPENDENCIES` (`app/actions.ts`) **non touché**. Aucun champ générique `requires`/`prerequisite`/`dependsOn` introduit dans `lib/types.ts`, `DeliverableTemplate`, ou les seeds.

## Advisor conditions — status final

| Condition | Status | Note |
|-----------|--------|------|
| **C1** (Task 1) — Grep `SubmissionReadonly` call-sites Player-facing | ✅ RESPECTÉE | Une seule occurrence à `app/journey/deliverable/[id]/page.tsx:489`. Pas besoin de flag `showMentorFeedback`. |
| **C3** (Task 3) — Slug `prep-questions-v1` reste literal côté server + page détail. Aucun champ générique `requires`/`prerequisite`/`dependsOn` dans `lib/types.ts` / `DeliverableTemplate` / seeds. | ✅ RESPECTÉE | `HARD_BLOCK_DEPENDENCIES` non touché. Seul changement page.tsx = hoist `prepQuestionsDeliverableId` (purement présentationnel — href). |
| **C4** (Task 3) — prop `prepQuestionsDeliverableId?: string | null` (optionnel + nullable, fallback gracieux quand null). | ✅ RESPECTÉE | Signature exacte : `prepQuestionsDeliverableId?: string | null`. Link non-rendu quand null. |
| **C5** (Task 3, non-bloquant) — Commentaire d'en-tête composer mentionne l'exception unique L2 signée Omar 2026-05-19. | ✅ RESPECTÉE | Commentaire ajouté lignes 18-23 de `fiches-entretien-composer.tsx`. |
| **Audit grep R1 post-execution** + **smoke régression** | ✅ RESPECTÉE | Voir sections ci-dessous. |

## Audit R1 post-execution

### Grep #1 — score/rank/note dans pages Player-facing (hors detail livrable et DeliverableScoreBlock)
```bash
grep -rn "score|rank|note|/100|/140|points|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" \
  | grep -v "app/journey/deliverable/" \
  | grep -v "components/deliverable-score-block"
```

Le grep **ne retourne PAS vide** dans l'absolu — il retourne des occurrences pré-existantes dans :
- `app/results/page.tsx`, `app/results/ceremony/page.tsx` : surface GM/jury (R1 préservée par gate `isGameMaster` cf. retro 260510-kpw).
- `components/results-podium.tsx`, `components/results-ceremony-screen.tsx`, `components/results-replay.tsx` : composants jury/ceremony GM-only.
- `components/submission-readonly.tsx` : commentaires de garde-fou R1 (lignes 32 et 100, **ajoutés par CE quick** en tant que commentaires explicatifs, pas en tant que leak).

**Vérification "aucune nouvelle ligne R1-sensitive introduite par ce quick"** :
```bash
git diff HEAD~3 HEAD --unified=0 -- app/journey app/results "components/results-*" "components/submission-*" \
  | grep -E "^\+" | grep -v "^\+\+\+" \
  | grep -iE "score|rank|note|/100|/140|points|toFixed"
```
→ **vide** ✅ (aucun nouveau leak Player-facing introduit en code exécutable — les seules nouvelles occurrences dans le diff sont des commentaires explicatifs R1).

### Grep #2 — rank / classement / percentile / leaderboard dans detail livrable
```bash
grep -rn "rank|classement|percentile|leaderboard" app/journey/deliverable/
```
→ 1 occurrence pré-existante : `app/journey/deliverable/[id]/moscow-snapshot/page.tsx:5` — c'est un **commentaire** `// R1 STRICT : no score/rank/multiplier in render.` (méta, pas un leak). Commit d'origine : `7699f33` (Phase 12, pas ce quick). ✅

## Smoke régression — final post-Task-3

| Step | Command | Exit code |
|------|---------|-----------|
| typecheck | `npm run typecheck` (= `tsc --noEmit`) | **0** ✅ |
| lint | `npm run lint` (= `eslint .`) | **0** ✅ |
| build | `npm run build` (= `next build`) | **0** ✅ (toutes routes compilées, middleware 89.6 kB, pas de warning React/Next) |

Smoke également run **entre chaque task** :
- Post Task 1 (`4a2a0ff`) : typecheck OK / lint OK / build OK.
- Post Task 2 (`282b9ec`) : typecheck OK / lint OK / build OK.
- Post Task 3 (`7338ae4`) : typecheck OK / lint OK / build OK (= smoke final ci-dessus).

## R2 / R3 audit

- **R2** : aucun validator touché. `severity` inchangé. ✅
- **R3** : `HARD_BLOCK_DEPENDENCIES` (`app/actions.ts`) **non modifié**. Le slug `prep-questions-v1` reste literal partout (server + page détail). Aucun champ générique introduit dans `lib/types.ts` ou `DeliverableTemplate`. Le composer reçoit toujours `locked={fichesGateLocked}` calculé côté server. Le nouveau prop `prepQuestionsDeliverableId` est **purement présentationnel** (un href pour un Link). ✅

## Dual-mode guard

Aucun ajout de `redirect("/login")`, `getCurrentUser()`, ou query Supabase avant `hasSupabaseEnv()`. Le hoist de `prepQuestionsDeliverableId` reste dans le bloc `isFichesEntretienDeliverable` existant qui était déjà après le check Supabase. ✅

## Files modified (récap)

| File | Task(s) | Net lines |
|------|---------|-----------|
| `components/submission-readonly.tsx` | 1 | +63 / −0 |
| `components/submission-form.tsx` | 2 | +6 / 0 |
| `components/submission-ticket.tsx` | 2 | +6 / −1 |
| `components/fiches-entretien-composer.tsx` | 3 | +37 / −2 |
| `app/journey/deliverable/[id]/page.tsx` | 3 | +7 / 0 |
| `lib/i18n.ts` | 1+2+3 | +18 / 0 |

Total : 6 files / +137 / −3 lines (incl. comments — net code change beaucoup plus petit).

## Self-Check: PASSED

- ✅ All 3 tasks executed in strict order (1 → 2 → 3)
- ✅ 3 atomic commits with `feat(quick-260519-uuy):` prefix
- ✅ All 5 advisor conditions (C1, C3, C4, C5 + audit grep) respected
- ✅ Final smoke typecheck/lint/build exit 0
- ✅ R1/R2/R3 cardinal rules preserved (verified by diff and grep)
- ✅ Dual-mode demo guard intact
- ✅ Rollback granulaire possible (1 task = 1 commit, no cross-dependency)

## Verdict ADVISOR

PASS_CONDITIONAL → toutes les conditions respectées en exécution. Voir [`260519-uuy-ADVISOR-VERDICT.md`](./260519-uuy-ADVISOR-VERDICT.md) pour le détail.

## Next steps (hors scope quick)

- Visuel local (`npm run dev`) sur les 5 statuts Player + cas `fiches-entretien-v1` locked — à faire par Omar.
- Brief mentor opérationnel : rappeler aux mentors de ne pas écrire de rang/percentile dans `feedback` (R1 protection au niveau du contenu humain). FYI advisor.
- Pushs `origin main` (les 3 SHA sont actuellement locaux sur `main` ; commit-policy quick = push systématique mais l'orchestrator gère).
