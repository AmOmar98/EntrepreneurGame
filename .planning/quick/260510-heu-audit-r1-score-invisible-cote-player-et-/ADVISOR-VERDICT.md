# R1 Advisor Verdict — eic-pedagogical-advisor

> Source de vérité : `EIC-MANAGER-ANSWERS-AGREENTECH.md` (R1) + `T3-IMPROVEMENTS.md` (R1)
> Input audité : `AUDIT.md` (Tâche 1)
> Posture : tranché, no-hedging.

## Verdicts

### `app/journey/deliverable/[id]/page.tsx:313`

- **Verdict** : confirmé R1
- **Justification** : R1 (`T3-IMPROVEMENTS.md`) interdit toute fraction de scoring visible côté Player — "note /140, classement live, score pitch, Z-score, percentile". Afficher `(20 pts)` par critère de rubrique expose le barème de notation (ex : "Proposition de valeur — 20 pts, Preuve terrain — 15 pts") = fraction de scoring `/20` par critère. C'est du scoring visible, même si c'est le max théorique et non la note obtenue. Risk pilote : un Player voit "20 pts", calcule qu'il peut avoir 140 en tout, commence à optimiser stratégiquement — exactement ce que R1 cherche à éviter.
- **Snippet actuel** :
  ```tsx
  {rubric.map((c) => (
    <li key={c.key} style={{ marginBottom: 4 }}>
      <strong>{c.label}</strong> ({c.max} pts)
    </li>
  ))}
  ```
- **Patch proposée** : Retirer `({c.max} pts)` — afficher uniquement le label du critère. Preserves the pedagogical intent (Player knows the evaluation dimensions) without exposing the numeric weight.
  ```tsx
  {rubric.map((c) => (
    <li key={c.key} style={{ marginBottom: 4 }}>
      <strong>{c.label}</strong>
    </li>
  ))}
  ```
- **Notes** : Patch minimale — 1 caractère de suppression + 1 ligne de moins. Aucun impact TypeScript (c.max reste typé et utilisé côté Mentor/admin). Aucun impact i18n. `submission_rubric` section title `"Criteres d'evaluation"` (FR) reste intact — neutre R1.

---

### `components/submission-feedback-card.tsx:2` (commentaire `//`)

- **Verdict** : laisser-tel-quel-documenté
- **Justification** : Commentaire JSX `//` — jamais rendu en UI. Non-violation R1 par définition (R1 vise les chaînes affichées en UI, pas les commentaires de code).
- **Snippet actuel** :
  ```tsx
  // Displays the latest Mentor evaluation (verdict, total score, per-criterion
  ```
- **Patch proposée** : aucune — commentaire non visible Player.
- **Notes** : Le composant entier est dead code (non importé dans `app/` — Phase 7 RevisionPanel l'a remplacé). Le commentaire est inoffensif.

---

### `components/submission-feedback-card.tsx:10-11` (déclarations TypeScript)

- **Verdict** : laisser-tel-quel-documenté
- **Justification** : Noms de propriétés TypeScript (`scores: Record<string, number>`, `totalScore: number`) — strings techniques jamais rendues en UI. `laisser-tel-quel-documenté` per R1 brief plan ("nom de variable TypeScript, clé d'objet").
- **Snippet actuel** :
  ```tsx
  scores: Record<string, number>;
  totalScore: number;
  ```
- **Patch proposée** : aucune — dead code + types non affichés.
- **Notes** : Dead code confirmé — `SubmissionFeedbackCard` non importé dans `app/journey/`, `app/onboarding/`, `app/player/`, `app/login/`. RevisionPanel gère la révision V2.

---

### `components/submission-feedback-card.tsx:78` (totalScore rendu en JSX)

- **Verdict** : laisser-tel-quel-documenté
- **Justification** : Le rendu `evaluation.totalScore.toFixed(1)` est dans un composant **dead code** — `SubmissionFeedbackCard` n'est importé nulle part dans `app/`. Jamais exécuté côté Player. Si réactivé, ce serait une violation R1 confirmée (note totale visible Player = interdit). Mais au 2026-05-10, non rendu.
- **Snippet actuel** :
  ```tsx
  <p style={{ margin: "0 0 12px", fontSize: 14, color: "#0f172a" }}>
    <strong>{t.feedback_card_total} :</strong> {evaluation.totalScore.toFixed(1)}
  </p>
  ```
- **Patch proposée** : aucune maintenant. Recommandation : supprimer le fichier entier en sprint de nettoyage (post-pilote, hors scope R1).
- **Notes** : `t.feedback_card_total` = `"Note totale"` (FR) — violation latente si le composant était réactivé. Documenter dans SUMMARY.md sous "Known dead code with R1 violations".

---

### `components/submission-feedback-card.tsx:91` (scores par critère rendu en JSX)

- **Verdict** : laisser-tel-quel-documenté
- **Justification** : Idem L78 — dead code. `{t.feedback_card_scores}` = `"Notes par critere"` + `{display} / {c.max}` = fraction de scoring. Non rendu côté Player.
- **Snippet actuel** :
  ```tsx
  <h3>{t.feedback_card_scores}</h3>
  {rubric.map((c) => {
    const display = typeof value === "number" && !Number.isNaN(value) ? value : 0;
    return (
      <li key={c.key}>
        <strong>{c.label}</strong> : {display} / {c.max}
      </li>
    );
  })}
  ```
- **Patch proposée** : aucune. Même recommandation : supprimer le fichier post-pilote.
- **Notes** : `{display} / {c.max}` serait la fraction R1 la plus grave si rendu (ex : "12 / 20"). Dead code — pas de risque pilote.

---

### `lib/i18n.ts:297-298` (clés `feedback_card_total`, `feedback_card_scores`)

- **Verdict** : laisser-tel-quel-documenté
- **Justification** : Ces clés i18n (`"Note totale"`, `"Notes par critere"`) sont consommées **uniquement** par `SubmissionFeedbackCard` — dead code. Grep confirmé : aucune autre occurrence dans `app/` ou `components/` (hors `submission-feedback-card.tsx` lui-même). Jamais rendues côté Player.
- **Snippet actuel** :
  ```ts
  feedback_card_total: "Note totale",
  feedback_card_scores: "Notes par critere",
  ```
- **Patch proposée** : aucune — nettoyage post-pilote avec la suppression de `submission-feedback-card.tsx`.
- **Notes** : Si ces clés étaient consommées ailleurs en Player routes, verdict aurait été `confirmé R1` (car `"Note totale"` est une chaîne scoring directe). Au 2026-05-10, scope clair = dead code.

---

### `lib/i18n.ts:655` (clé EN `submission_rubric: "Scoring rubric"`)

- **Verdict** : faux positif
- **Justification** : La locale active est `fr` — `dictionaries.fr` est utilisé en dur dans toutes les pages Player (`const t = dictionaries.fr`). La valeur EN `"Scoring rubric"` n'est jamais rendue en production. La valeur FR `"Criteres d'evaluation"` (L176) est neutre R1.
- **Snippet actuel** :
  ```ts
  submission_rubric: "Scoring rubric",   // EN dictionary
  ```
- **Patch proposée** : aucune. Si la locale EN était activée, le label FR `"Critères d'évaluation"` ou `"Critères"` serait préférable à `"Scoring rubric"`. À corriger lors d'une future activation de la locale EN — hors scope pilote.
- **Notes** : Faux positif — locale figée FR. Aucun risque R1 au 2026-05-10.

---

## Synthèse

- Confirmés (à patcher Tâche 3) : **1**
  - `app/journey/deliverable/[id]/page.tsx:313` — `({c.max} pts)` dans rubric criteria Player view
- Faux positifs : **1**
  - `lib/i18n.ts:655` — clé EN `"Scoring rubric"` (locale FR figée)
- Laisser-tel-quel-documentés : **5** (détail dans SUMMARY.md final)
  - `submission-feedback-card.tsx:2` — commentaire code
  - `submission-feedback-card.tsx:10-11` — types TypeScript
  - `submission-feedback-card.tsx:78` — totalScore rendu (dead code)
  - `submission-feedback-card.tsx:91` — scores per criterion rendu (dead code)
  - `lib/i18n.ts:297-298` — clés `feedback_card_total` + `feedback_card_scores` (dead code)
- Cas escaladés à Omar (ambigu, hors brief) : **0**

## Refus / hors-scope rappelés

- Aucun patch ne touchera : `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `lib/data.ts` (n'existe pas — logique métier dans `lib/types.ts`, `lib/score.ts`, etc.).
- Aucun changement de logique scoring, formule 20/80, types XP/Score/Classement.
- Aucun ajout de feature, juste audit textuel R1.
- `components/submission-feedback-card.tsx` (dead code) : pas de suppression dans ce sprint — uniquement documentation. Nettoyage post-pilote.
