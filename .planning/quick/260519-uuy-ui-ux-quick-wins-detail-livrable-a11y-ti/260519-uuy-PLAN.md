---
phase: quick-260519-uuy
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/submission-readonly.tsx
  - app/journey/deliverable/[id]/page.tsx
  - components/submission-form.tsx
  - components/submission-ticket.tsx
  - components/fiches-entretien-composer.tsx
  - lib/i18n.ts
autonomous: true
requirements:
  - QW-UUY-01-feedback-mentor-visible
  - QW-UUY-02-a11y-submit-messages
  - QW-UUY-03-cta-hard-block-l2
must_haves:
  truths:
    - "Sur la page detail livrable, un Player voit le commentaire texte ('feedback') du mentor pour les statuts validated, rejected et submitted_v2 (feedback_received reste gere par RevisionPanel — pas de double rendu)."
    - "Le message de retour du formulaire de soumission (state.message) commence visuellement par un prefixe textuel '✓' (succes) ou '⚠' (erreur), pas uniquement par une couleur — WCAG 1.4.1."
    - "La carte ticket SOUMIS expose un aria-label descriptif lu par les screen readers ('Livrable soumis : <titre> — V<n> — <date>')."
    - "Quand prep-questions-v1 n'est pas validee, le composer fiches-entretien-v1 affiche un Link 'Revenir a la preparation 2A' pointant vers le deliverable prep-questions-v1, EN PLUS du message ambre existant."
    - "Aucun score / rang / percentile / leaderboard n'est ajoute cote Player en dehors de DeliverableScoreBlock deja en place (R1 preservee)."
    - "Aucun nouveau blocage inter-mission n'est introduit ; le hard-block L2 prep→entretien est conserve a l'identique (R3 exception signee Omar 19/05)."
  artifacts:
    - path: "components/submission-readonly.tsx"
      provides: "Render evaluation.feedback (et expectedAction quand verdict=request_v2) dans une carte 'Commentaire de votre mentor' pour statuts validated/rejected/submitted_v2"
      contains: "evaluation?.feedback"
    - path: "app/journey/deliverable/[id]/page.tsx"
      provides: "Pass prepQuestionsDeliverableId prop vers FichesEntretienComposer (deriva de la query prep-questions-v1 deja faite)"
      contains: "prepQuestionsDeliverableId"
    - path: "components/submission-form.tsx"
      provides: "Prefixe textuel ✓/⚠ sur state.message (WCAG 1.4.1 couleur+texte)"
    - path: "components/submission-ticket.tsx"
      provides: "aria-label descriptif sur la section ticket SOUMIS"
    - path: "components/fiches-entretien-composer.tsx"
      provides: "Link CTA 'Revenir a la preparation 2A' dans la banniere locked, pointant vers /journey/deliverable/<prepQuestionsDeliverableId>"
    - path: "lib/i18n.ts"
      provides: "Cles fr+en : mentor_feedback_card_title, mentor_feedback_expected_action_label, submission_form_success_prefix, submission_form_error_prefix, submission_ticket_aria_label_template, fiches_locked_cta_back_to_prep"
  key_links:
    - from: "components/submission-readonly.tsx"
      to: "evaluation.feedback (deja fetch dans page.tsx:latestEvaluation)"
      via: "props.evaluation.feedback (champ ajoute au type SubmissionReadonlyProps.evaluation)"
      pattern: "evaluation\\?\\.feedback"
    - from: "components/fiches-entretien-composer.tsx"
      to: "/journey/deliverable/[prepQuestionsDeliverableId]"
      via: "next/link Link (prop prepQuestionsDeliverableId: string | null)"
      pattern: "prepQuestionsDeliverableId"
    - from: "app/journey/deliverable/[id]/page.tsx"
      to: "FichesEntretienComposer.prepQuestionsDeliverableId"
      via: "hoist prepTpl.id from existing fichesGateLocked block to a local var, pass as prop"
      pattern: "prepQuestionsDeliverableId=\\{"
---

<objective>
Trois ameliorations UX/UI quick-wins sur la page detail livrable du Player :

1. **Feedback mentor visible** — Le texte de feedback du mentor est aujourd'hui invisible cote Player lorsque la soumission est en statut `validated`, `rejected` ou `submitted_v2`. Seul le statut `feedback_received` (V2 a refaire) le rend via `RevisionPanel`. On rend `evaluation.feedback` dans `SubmissionReadonly` pour fermer ce trou.
2. **A11y messages submit** — Le retour de soumission n'est differencie que par la couleur (vert/rouge). On ajoute un prefixe textuel ✓/⚠ (WCAG 1.4.1) et un aria-label explicite sur le ticket SOUMIS.
3. **CTA hard-block L2** — Quand `fiches-entretien-v1` est hard-block sur `prep-questions-v1`, la banniere ambre est statique : on ajoute un Link actionable « Revenir a la preparation 2A » pointant vers le deliverable bloquant.

Purpose : 3 trous UX detectes pendant le smoke pre-pilote Digi-Hackathon (J-1). Tous trois sans risque cardinal R1/R2/R3.

Output : 6 fichiers touches (3 composants + page + 2 chaines i18n), 3 commits atomiques distincts pour rollback granulaire.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@app/journey/deliverable/[id]/page.tsx
@components/submission-readonly.tsx
@components/submission-form.tsx
@components/submission-ticket.tsx
@components/fiches-entretien-composer.tsx
@lib/i18n.ts
@lib/types.ts

<interfaces>
<!-- Contrats extraits des fichiers a editer — l'executor n'a pas besoin d'explorer le codebase. -->

From lib/types.ts (l.149-157):
```typescript
export type Evaluation = {
  id: string;
  submissionId: string;
  evaluatorId: string;
  scores: Record<string, number>;
  totalScore: number;
  feedback: string;        // <-- champ a rendre cote Player (Task 1)
  verdict: Verdict;
};
// Note : la page detail compose son propre type inline `latestEvaluation`
// (cf. app/journey/deliverable/[id]/page.tsx:241-247) qui inclut DEJA
// `feedback: string` et `expectedAction: string | null`.
```

From app/journey/deliverable/[id]/page.tsx (l.241-272):
```typescript
let latestEvaluation: {
  scores: Record<string, number>;
  totalScore: number;
  feedback: string;
  verdict: Verdict;
  expectedAction: string | null;
} | null = null;
// ... fetch ...
// La query inclut deja: scores, total_score, feedback, verdict, expected_action.
// AUCUNE nouvelle requete SQL n'est necessaire pour Task 1.
```

From components/submission-readonly.tsx (l.30-47) — props actuels :
```typescript
export type SubmissionReadonlyProps = {
  submission: Submission;
  evaluation?: {              // <-- AJOUTER feedback + expectedAction + verdict ici
    totalScore: number;
    scores: Record<string, number>;
  } | null;
  maxScore?: number;
  rubric?: RubricCriterion[];
};
```

From components/fiches-entretien-composer.tsx (l.24-32) — props actuels :
```typescript
export function FichesEntretienComposer({
  deliverableTemplateId,
  locked = false,
  lockedReason,
}: {
  deliverableTemplateId: string;
  locked?: boolean;
  lockedReason?: string;
  // <-- AJOUTER : prepQuestionsDeliverableId?: string | null
});
```

From components/submission-form.tsx (l.125-136) — message rendu actuellement :
```typescript
{state.message ? (
  <p
    role={state.ok ? "status" : "alert"}
    style={{ color: state.ok ? "#15803d" : "#b91c1c" }}
  >
    {state.message}    // <-- prefixer par "✓ " ou "⚠ " cote affichage (Task 2)
  </p>
) : null}
```

From components/submission-ticket.tsx (l.59-63) — aria actuel :
```typescript
<section
  aria-label={t.submission_ticket_aria}   // <-- existe mais generique ; rendre descriptif (Task 2)
  className="eic-submission-ticket"
>
```

i18n.ts existing keys (fr block ~l.268-273, en block ~l.1011-1017) — DEJA presents :
```typescript
submission_locked_banner, submission_readonly_title, submission_readonly_kind,
submission_readonly_proof_url, submission_readonly_proof_text,
submission_readonly_status, submission_readonly_submitted_at,
submission_ticket_aria, evaluation_verdict_validate_v1/v2/request_v2/reject,
journey_status_feedback_received/validated/rejected/submitted_v2
```

Cles A AJOUTER (fr + en, dans les 2 blocs) :
```typescript
// FR
mentor_feedback_card_title: "Commentaire de votre mentor",
mentor_feedback_expected_action_label: "Action attendue",
submission_form_success_prefix: "✓ ",     // checkmark
submission_form_error_prefix: "⚠ ",       // warning sign
fiches_locked_cta_back_to_prep: "Revenir a la preparation 2A",

// EN
mentor_feedback_card_title: "Your mentor's comment",
mentor_feedback_expected_action_label: "Expected action",
submission_form_success_prefix: "✓ ",
submission_form_error_prefix: "⚠ ",
fiches_locked_cta_back_to_prep: "Back to preparation 2A",
```

Le `submission_ticket_aria` existant est conserve comme aria fallback ; on construit en plus un aria-label dynamique en clear (titre + V + date) directement dans le composant (pas besoin de nouvelle cle i18n template — date deja formatee `formatDateFr`).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Feedback mentor visible (statuts validated / rejected / submitted_v2)</name>
  <files>components/submission-readonly.tsx, lib/i18n.ts</files>
  <action>
Etendre `SubmissionReadonlyProps.evaluation` pour inclure `feedback: string` et `expectedAction: string | null` et `verdict: Verdict` (champs deja calcules dans `latestEvaluation` cote `app/journey/deliverable/[id]/page.tsx:241-272` — AUCUNE requete SQL ajoutee).

Dans `components/submission-readonly.tsx`, sous le bloc `<DeliverableScoreBlock>` existant (l.79-86, garde la condition `showScore`), ajouter une carte « Commentaire de votre mentor » rendue **si et seulement si** `evaluation?.feedback && evaluation.feedback.trim().length > 0`. Structure :

```tsx
{evaluation?.feedback && evaluation.feedback.trim().length > 0 ? (
  <section
    aria-label={t.mentor_feedback_card_title}
    className="eic-submission-readonly__mentor-feedback"
    style={{
      marginTop: 16,
      padding: 14,
      borderRadius: 8,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
    }}
  >
    <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
      {t.mentor_feedback_card_title}
    </h3>
    <p style={{ margin: 0, fontSize: 13, color: "#0f172a", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
      {evaluation.feedback}
    </p>
    {evaluation.expectedAction && evaluation.expectedAction.trim().length > 0 ? (
      <p style={{ margin: "10px 0 0", fontSize: 12, color: "#475569" }}>
        <strong>{t.mentor_feedback_expected_action_label}</strong> : {evaluation.expectedAction}
      </p>
    ) : null}
  </section>
) : null}
```

Importer `type Verdict` depuis `@/lib/types`. Pas de rendu de score / rang / classement — uniquement texte feedback + expectedAction (verdict n'est pas affiche, mais inclus dans le type pour symetrie avec la query — laisse l'option ouverte sans rendu).

Ajouter dans `lib/i18n.ts` les 2 cles dans le bloc `fr` (vers l.328 a cote des autres `evaluation_*`) ET dans le bloc `en` (vers l.1043) :
```typescript
mentor_feedback_card_title: "Commentaire de votre mentor",          // fr
mentor_feedback_expected_action_label: "Action attendue",           // fr
mentor_feedback_card_title: "Your mentor's comment",                // en
mentor_feedback_expected_action_label: "Expected action",           // en
```

Pas de modification de `app/journey/deliverable/[id]/page.tsx` requise pour Task 1 — `latestEvaluation` est deja passe en prop a `<SubmissionReadonly evaluation={latestEvaluation} ... />` (l.490), et son shape inclut deja `feedback` + `expectedAction`.

**R1 check** : aucun chiffre / score / rang / percentile ajoute. Le feedback est du texte pedagogique.
**R2 check** : composant lecture-seule, ne bloque rien.
**R3 check** : aucun gating ajoute.
**Dual-mode** : changement client-side / props only — fonctionne identiquement en mode demo (la branche demo de la page n'instancie pas `SubmissionReadonly`).

Commit message : `feat(quick-260519-uuy): render mentor feedback in submission-readonly`
  </action>
  <verify>
    <automated>npm run typecheck && npm run lint && npm run build</automated>
    Manual sanity grep : `grep -n "evaluation\?\.feedback" components/submission-readonly.tsx` retourne >=1 match. `grep -n "mentor_feedback_card_title" lib/i18n.ts` retourne 2 matches (fr + en).
  </verify>
  <done>
- `components/submission-readonly.tsx` : type `SubmissionReadonlyProps.evaluation` etendu, carte feedback rendue conditionnellement.
- `lib/i18n.ts` : 2 cles fr + 2 cles en ajoutees, build pass.
- `npm run typecheck && npm run lint && npm run build` exit 0.
- 1 commit atomique pushe origin/main.
  </done>
</task>

<task type="auto">
  <name>Task 2: A11y — prefixe textuel ✓/⚠ sur submit messages + aria-label descriptif ticket SOUMIS</name>
  <files>components/submission-form.tsx, components/submission-ticket.tsx, lib/i18n.ts</files>
  <action>
**Partie A — `components/submission-form.tsx` :**

Importer le dictionnaire (`const t = dictionaries.fr;` existe deja l.17). Dans le bloc `{state.message ? ... : null}` (l.125-136), prefixer `{state.message}` par `state.ok ? t.submission_form_success_prefix : t.submission_form_error_prefix`. Garder le `role` dynamique et la couleur — c'est de la defense en profondeur (couleur + texte = WCAG 1.4.1).

Changement chirurgical :
```tsx
{state.message ? (
  <p
    role={state.ok ? "status" : "alert"}
    style={{
      margin: 0,
      fontSize: 13,
      color: state.ok ? "#15803d" : "#b91c1c",
    }}
  >
    {state.ok ? t.submission_form_success_prefix : t.submission_form_error_prefix}
    {state.message}
  </p>
) : null}
```

**Partie B — `components/submission-ticket.tsx` :**

La section a aujourd'hui `aria-label={t.submission_ticket_aria}` (l.61). Remplacer par un aria-label dynamique descriptif construit inline (pas besoin de cle i18n template — le dictionnaire reste local ASCII-safe) :

```tsx
const ariaLabel = `${t.submission_ticket_aria} : ${deliverableTitle} - V${submission.version} - ${formatDateFr(submission.submittedAt)}`;
// ...
<section
  aria-label={ariaLabel}
  className="eic-submission-ticket"
>
```

Le tampon decoratif (`aria-hidden="true"` sur stamp + rays) reste inchange. Pas d'autre modification visuelle.

**Partie C — `lib/i18n.ts` :**

Ajouter dans bloc fr (a cote des autres `submission_*` ~l.268) :
```typescript
submission_form_success_prefix: "✓ ",    // U+2713 CHECK MARK
submission_form_error_prefix: "⚠ ",      // U+26A0 WARNING SIGN
```

Mirror identique dans bloc en (~l.1011).

**R1 check** : aucun score/rang.
**R2 check** : pas un validator.
**R3 check** : pas de gating.
**ASCII rule (CLAUDE.md i18n)** : on utilise les escape Unicode `✓` / `⚠` — code source reste ASCII pur. Affichage final UTF-8 ok (Next.js default).
**Dual-mode** : neutre — le formulaire fonctionne identique en demo et Supabase mode.

Commit message : `feat(quick-260519-uuy): a11y prefix submit messages + descriptive ticket aria`
  </action>
  <verify>
    <automated>npm run typecheck && npm run lint && npm run build</automated>
    Manual sanity : `grep -n "submission_form_success_prefix" components/submission-form.tsx lib/i18n.ts` retourne 3 matches (1 component + fr + en). `grep -n "ariaLabel" components/submission-ticket.tsx` retourne >=1 match.
  </verify>
  <done>
- `components/submission-form.tsx` : prefixe textuel ✓/⚠ rendu avant `state.message`.
- `components/submission-ticket.tsx` : aria-label dynamique descriptif (titre + version + date).
- `lib/i18n.ts` : 2 prefix keys fr + en ajoutees (escape Unicode ASCII-safe).
- `npm run typecheck && npm run lint && npm run build` exit 0.
- 1 commit atomique pushe origin/main.
  </done>
</task>

<task type="auto">
  <name>Task 3: CTA actionnable « Revenir a la preparation 2A » dans banniere locked fiches-entretien-v1</name>
  <files>components/fiches-entretien-composer.tsx, app/journey/deliverable/[id]/page.tsx, lib/i18n.ts</files>
  <action>
**Partie A — `app/journey/deliverable/[id]/page.tsx` :**

Le bloc `if (isFichesEntretienDeliverable) { ... const { data: prepTpl } = ... }` (l.186-209) fetch deja `prepTpl.id`. Hoist cette valeur dans une variable locale `prepQuestionsDeliverableId: string | null = null` declaree avant le bloc, assignee a l'interieur. La passer en prop a `<FichesEntretienComposer ... prepQuestionsDeliverableId={prepQuestionsDeliverableId} />` (l.551-555).

Patch minimal :
```typescript
// avant le bloc isFichesEntretien (l.182 environ) :
let prepQuestionsDeliverableId: string | null = null;
let fichesGateLocked = false;
let fichesGateReason: string | undefined;
if (isFichesEntretienDeliverable) {
  const { data: prepTpl } = await supabase
    .from("deliverable_templates")
    .select("id")
    .eq("slug", "prep-questions-v1")
    .maybeSingle();
  if (prepTpl) {
    prepQuestionsDeliverableId = (prepTpl as { id: string }).id;  // <-- hoist
    const { data: prepSubs } = await supabase
      .from("submissions")
      // ... rest unchanged ...
  }
}
// ...
// au render (l.551-555) :
<FichesEntretienComposer
  deliverableTemplateId={id}
  locked={fichesGateLocked}
  lockedReason={fichesGateReason}
  prepQuestionsDeliverableId={prepQuestionsDeliverableId}
/>
```

**Partie B — `components/fiches-entretien-composer.tsx` :**

Ajouter `prepQuestionsDeliverableId?: string | null` au type props (l.27-32). Importer `Link` depuis `next/link` (l.17 environ — ajouter `import Link from "next/link";`). Importer `dictionaries` depuis `@/lib/i18n` (NOTE : le composant n'utilise pas i18n aujourd'hui — l'introduction est minimale, uniquement pour la nouvelle cle CTA).

Dans la banniere locked (l.96-111), apres le texte du `lockedReason`, ajouter un `<Link>` actionnable conditionnel :

```tsx
{locked ? (
  <div
    role="status"
    style={{
      padding: "12px 14px",
      borderRadius: 8,
      background: "#fef3c7",
      border: "1px solid #f59e0b",
      color: "#92400e",
      fontSize: 13,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      alignItems: "flex-start",
    }}
  >
    <span>
      {lockedReason ??
        "Préparation à valider par votre mentor avant de débloquer les fiches d'entretien."}
    </span>
    {prepQuestionsDeliverableId ? (
      <Link
        href={`/journey/deliverable/${prepQuestionsDeliverableId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 6,
          background: "#92400e",
          color: "#fef3c7",
          fontSize: 12,
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        ← {t.fiches_locked_cta_back_to_prep}
      </Link>
    ) : null}
  </div>
) : null}
```

Avec `const t = dictionaries.fr;` ajoute en haut du module (apres les imports), aligne avec la convention employee dans les autres composants Player-facing.

**Partie C — `lib/i18n.ts` :**

Ajouter dans bloc fr (~l.275 a cote des autres `submission_*` ou apres `fiches` related — l'organisation libre) :
```typescript
fiches_locked_cta_back_to_prep: "Revenir a la preparation 2A",
```

Mirror identique dans bloc en (~l.1018) :
```typescript
fiches_locked_cta_back_to_prep: "Back to preparation 2A",
```

**R1 check** : aucun chiffre ajoute.
**R2 check** : composer reste warn-only au sens UI (le hard-block reste, mais le CTA aide a le franchir — pas a le contourner).
**R3 check** : aucun nouveau hard-block. On ameliore l'UX du hard-block existant signe Omar 2026-05-19. Le mecanisme `HARD_BLOCK_DEPENDENCIES` cote serveur reste intact.
**Defense in depth** : si `prepQuestionsDeliverableId` est null (cas edge : prep-questions-v1 absent du seed), la banniere reste affichee sans le Link — pas de crash.
**Dual-mode** : la page detail livrable redirige vers `submission_demo_disabled` quand `hasSupabaseEnv()` est false (l.126-135) — donc `FichesEntretienComposer` n'est jamais instancie en mode demo. Prop additionnel sans-effet.

Commit message : `feat(quick-260519-uuy): actionable CTA back-to-prep in fiches-entretien locked banner`
  </action>
  <verify>
    <automated>npm run typecheck && npm run lint && npm run build</automated>
    Manual sanity :
    - `grep -n "prepQuestionsDeliverableId" app/journey/deliverable/\[id\]/page.tsx components/fiches-entretien-composer.tsx` retourne >=3 matches (declaration + prop pass + prop type + usage Link).
    - `grep -n "fiches_locked_cta_back_to_prep" lib/i18n.ts` retourne 2 matches.
    - Audit R1 (CLAUDE.md pre-edit guards) : `grep -rn "score\|rank\|note\|/100\|/140\|points\|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"` ne montre aucune nouvelle ligne introduite par ce quick.
  </verify>
  <done>
- `app/journey/deliverable/[id]/page.tsx` : `prepQuestionsDeliverableId` hoiste et passe en prop.
- `components/fiches-entretien-composer.tsx` : prop ajoute, Link CTA rendu dans banniere locked, import Link + dictionaries.
- `lib/i18n.ts` : 1 cle fr + 1 cle en ajoutees.
- `npm run typecheck && npm run lint && npm run build` exit 0.
- Audit R1 grep clean (pas de nouveau leak introduit).
- 1 commit atomique pushe origin/main.
  </done>
</task>

</tasks>

<verification>
## Audit R1/R2/R3 final post-execution

1. **R1 (score invisible Player hors detail livrable)** :
   - Aucun ajout de chiffre/score/rang/percentile dans `SubmissionReadonly` (uniquement texte feedback).
   - Aucun ajout dans `SubmissionForm`, `SubmissionTicket`, `FichesEntretienComposer`.
   - Grep CLAUDE.md applicable inchange.
2. **R2 (validators warn-only)** : aucun validator touche.
3. **R3 (pas de blocage inter-mission code en dur)** : seul l'unique exception L2 prep→entretien signee Omar 2026-05-19 est touchee — uniquement pour ajouter un CTA d'aide. `HARD_BLOCK_DEPENDENCIES` (app/actions.ts) inchange.

## Smoke regression obligatoire (CLAUDE.md merge policy)

Apres les 3 commits :
- `npm run typecheck && npm run lint && npm run build` -> tous exit 0.
- Visuel local (`npm run dev`) sur 1 livrable de chaque statut Player :
  - `submitted_v1` : ticket SOUMIS avec aria-label dynamique audible NVDA/VoiceOver.
  - `feedback_received` : RevisionPanel inchange (carte feedback Task 1 ne s'affiche pas — gere par RevisionPanel deja).
  - `submitted_v2` : SubmissionReadonly avec nouvelle carte « Commentaire de votre mentor ».
  - `validated` : idem submitted_v2.
  - `rejected` : idem submitted_v2.
  - `fiches-entretien-v1` quand `prep-questions-v1` non-validee : banniere ambre + CTA Link vers prep-questions-v1.

## Dual-mode demo guard

Aucun ajout de `redirect("/login")`, `getCurrentUser()` ou query Supabase avant `hasSupabaseEnv()`. Aucun de ces 3 changes ne touche au flow auth ni a la branche demo.

## Convention quick (5 artefacts)

PLAN.md (ce fichier) -> AUDIT.md (executor pendant exec) -> ADVISOR-VERDICT.md (spawn `eic-pedagogical-advisor` orchestrator-side AVANT premier edit, zone Player-facing) -> SUMMARY.md (avec 3 SHA commits) -> deferred-items.md (probablement vide).
</verification>

<success_criteria>
- [ ] 3 commits atomiques pushes origin/main (1 par task, sequentiels mais independants — possibilite de revert chirurgical).
- [ ] `npm run typecheck && npm run lint && npm run build` exit 0 apres chaque commit.
- [ ] Aucun nouveau leak R1 / blocage R3 / validator bloquant R2.
- [ ] ADVISOR-VERDICT.md PASS sur les 3 regles cardinales (spawn orchestrator-side AVANT premier edit, requis par CLAUDE.md pre-edit guards pour `app/journey/`, `components/submission-*`).
- [ ] Visuel local valide sur 5 statuts Submission + cas locked fiches-entretien.
- [ ] SUMMARY.md livre avec SHA des 3 commits.
</success_criteria>

<output>
After completion, create `.planning/quick/260519-uuy-ui-ux-quick-wins-detail-livrable-a11y-ti/260519-uuy-SUMMARY.md` avec :
- 3 SHA commits + 1-liner par commit
- Statut audit R1/R2/R3 (PASS/WARN/BLOCK)
- Verdict ADVISOR (lien vers ADVISOR-VERDICT.md)
- Liste deferred-items (probablement vide)
- Smoke regression log (typecheck/lint/build OK + visual review)
</output>
