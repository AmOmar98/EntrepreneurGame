# R1 Audit — Score Invisible Player (raw findings)

> Généré 2026-05-10T11:41:51Z · Tâche 1 / 3 · Aucun edit appliqué.
> Input pour Tâche 2 (gate eic-pedagogical-advisor).

## Scope audité

- Routes Player :
  - `app/journey/page.tsx`
  - `app/journey/deliverable/[id]/page.tsx`
  - `app/onboarding/page.tsx`
  - `app/page.tsx` (redirect pur — `redirect("/login")` + `redirectForRole()`, aucune branche Player)
  - `app/login/page.tsx`
  - `app/player/[slug]/page.tsx`

- Composants Player dérivés (imports confirmés via grep) :
  - `app/journey/page.tsx` → `components/app-shell.tsx`, `components/journey-client.tsx`, `components/player-announcement-strip.tsx`
  - `app/journey/deliverable/[id]/page.tsx` → `components/app-shell.tsx`, `components/mentor-comment-composer.tsx`, `components/mentor-comments-list.tsx`, `components/revision-panel.tsx`, `components/submission-form.tsx`, `components/submission-readonly.tsx`, `components/submission-ticket.tsx`
  - `app/onboarding/page.tsx` → `components/app-shell.tsx`, `components/onboarding-stepper.tsx`
  - `app/login/page.tsx` → `components/login-form.tsx`, `components/partner-banner.tsx`
  - Composants transitifs listés dans le scope hardcodé et vérifiés : `components/journey-level-node.tsx`, `components/journey-track.tsx`, `components/journey-hero-next-step.tsx`, `components/journey-deliverable-card.tsx`, `components/journey-drawer.tsx`, `components/topbar-lite.tsx`, `components/mobile-tab-bar.tsx`, `components/submission-feedback-card.tsx`, `components/revision-panel.tsx`

- Composants ajoutés découverts via dérivation : **aucun** (tous dans la liste hardcodée ou hors scope)

- Composants multi-rôles examinés :
  - `components/app-shell.tsx` — prop `variant` ("player" | "staff"). Aucun pattern R1 dans aucune branche.
  - `components/pixel-mascot.tsx` — uniquement instancié dans `components/admin-live-view.tsx` (admin, hors scope Player). Aucune branche Player identifiée.
  - `app/page.tsx` — redirect pur, aucun rendu conditionnel par rôle.

## Patterns recherchés

- Interdits (regex ripgrep, case-insensitive) :
  - `\bscore\b`
  - `\brank\b`
  - `\bnote(?:r|s|d|z)?\b`
  - `\bclassement\b`
  - `\bpercentile\b`
  - `/100\b`
  - `/140\b`
  - `/120\b`
  - `\bvous\s+.{0,5}#`
  - `#\d+\s+sur\s+\d+`
  - `\bpts\b` (à filtrer manuellement — contexte XP vs scoring)

- Autorisés (faux positifs attendus — non listés comme violations) :
  - `\bxp\b`, `\bprogression\b`, `\d+/\d+\s+(?:champs|livrables|équipes)`, `Cohort Pulse`, `SOUMIS`, `BROUILLON`

## Player Zone — violations candidates (à valider par advisor)

### `app/journey/deliverable/[id]/page.tsx`

- **L313** · pattern `\bpts\b` · snippet : `<strong>{c.label}</strong> ({c.max} pts)`
  - Contexte : rubric section affichée à tout Player qui accède à `/journey/deliverable/[id]` avant soumission (et pendant lecture-seule). La liste des critères d'évaluation avec leur valeur max en "pts" est rendue en JSX visible dans le navigateur. Il s'agit du barème de notation du Mentor (RubricCriterion[]).
  - Hypothèse premier-passage : **violation probable** — `c.max pts` exprime un points de scoring (ex : "Proposition de valeur (20 pts)") et non du XP gamification. La règle R1 interdit les fractions de notation `/20`, `/100`, etc. côté Player. Le libellé `pts` ici est synonyme de "points de notation" par rapport à un barème.
  - Note : le rubric provient de `deliverable_templates.rubric` (Supabase), champ JSON `{ key, label, max }`. En demo mode, `rubric.length === 0` donc cette section ne s'affiche pas. En prod avec données réelles, `rubric` pourrait avoir des entrées.

### `components/submission-feedback-card.tsx` (DEAD CODE — non importé en Player routes)

- **L2** · pattern `\bscore\b` · snippet : `// Displays the latest Mentor evaluation (verdict, total score, per-criterion`
  - Contexte : **commentaire JSX** (ligne de commentaire `//`). Jamais rendu en UI.
  - Hypothèse premier-passage : faux positif — commentaire de code, non visible Player.

- **L10** · pattern `\bscore\b` · snippet : `scores: Record<string, number>;`
  - Contexte : déclaration TypeScript de type (nom de propriété objet). Jamais rendu en UI.
  - Hypothèse premier-passage : faux positif (string technique TypeScript).

- **L11** · pattern `\bscore\b` · snippet : `totalScore: number;`
  - Contexte : déclaration TypeScript de type. Jamais rendu en UI.
  - Hypothèse premier-passage : faux positif (string technique TypeScript).

- **L78** · pattern `\bnote\b` via i18n key `feedback_card_total` → `"Note totale"` · snippet : `<p><strong>{t.feedback_card_total} :</strong> {evaluation.totalScore.toFixed(1)}</p>`
  - Contexte : **COMPOSANT DEAD CODE** — `SubmissionFeedbackCard` n'est importé dans aucune page `app/` (vérifié via grep exhaustif). Phase 7 (RevisionPanel) l'a remplacé. Ce rendu JSX ne sera jamais exécuté via une route Player.
  - Hypothèse premier-passage : laisser-tel-quel-documenté (dead code, jamais rendu côté Player).

- **L91** · pattern `\bscore\b` via i18n key `feedback_card_scores` → `"Notes par critere"` · snippet : `<h3>{t.feedback_card_scores}</h3>`
  - Contexte : **COMPOSANT DEAD CODE** — idem L78.
  - Hypothèse premier-passage : laisser-tel-quel-documenté (dead code).

- **L108** · pattern `/c.max` (fraction de scoring) · snippet : `<li key={c.key}><strong>{c.label}</strong> : {display} / {c.max}</li>`
  - Contexte : **COMPOSANT DEAD CODE** — idem. Jamais rendu côté Player.
  - Hypothèse premier-passage : laisser-tel-quel-documenté (dead code).

### `lib/i18n.ts` (clés utilisées uniquement par le dead code `SubmissionFeedbackCard`)

- **L297** · pattern `note` dans valeur string · snippet : `feedback_card_total: "Note totale",`
  - Contexte : clé i18n consommée uniquement par `SubmissionFeedbackCard` (grep confirmé). `SubmissionFeedbackCard` est dead code — non importé en routes Player. Cette clé n'est donc jamais rendue côté Player.
  - Hypothèse premier-passage : laisser-tel-quel-documenté (dead code — si `SubmissionFeedbackCard` était réactivé, ce serait une violation confirmée).

- **L298** · pattern `note` dans valeur string · snippet : `feedback_card_scores: "Notes par critere",`
  - Contexte : idem L297.
  - Hypothèse premier-passage : laisser-tel-quel-documenté (dead code).

- **L655** (EN) · pattern `score` dans valeur string · snippet : `submission_rubric: "Scoring rubric",`
  - Contexte : clé i18n utilisée par `app/journey/deliverable/[id]/page.tsx` L308 (`{t.submission_rubric}`) comme titre de section rubric. La locale par défaut est `fr` (i18n.ts L1, layout.tsx `<html lang="fr">`), la clé FR est `"Criteres d'evaluation"` (L176) — non-violante. La clé EN `"Scoring rubric"` serait visible si la locale basculait en `en`, mais l'app utilise `dictionaries.fr` en dur dans toutes les pages.
  - Hypothèse premier-passage : faux positif probable — uniquement valeur EN dans un dictionnaire FR/EN, jamais rendu en production (locale figée `fr`).

## Zone autorisée — matches ignorés (référence trace)

- `app/jury/` : 0 matches sur `\bscore\b` dans les pages — matches présents dans les composants jury (`jury-pitch-grid.tsx`, etc.) — non listés (hors scope)
- `app/admin/` : 0 matches `\bscore\b` dans les pages app/admin — matches dans composants admin (`admin-radar.tsx` : 0, etc.) — non listés (hors scope)
- `app/mentor/` : 0 matches `\bscore\b` dans les pages — non listés
- `app/results/` : 0 matches directs — non listés
- `lib/data.ts` : non audité (logique métier, hors scope — attendu N matches sur score_project, calculateBonusClaim, etc.)
- Composants admin/jury/mentor/results : `admin-radar.tsx`, `jury-pitch-grid.tsx`, etc. — non audités (hors scope)

## Métriques

- Fichiers Player audités : 17 (6 pages + 11 composants)
- Violations candidates totales : 1 rendu actif + 6 dead code
- Violations candidates **actives** (rendu Player possible) : **1** — `app/journey/deliverable/[id]/page.tsx` L313 (`{c.max} pts`)
- Faux positifs probables : 1 (i18n key EN `"Scoring rubric"` — locale FR figée)
- Composants dead code avec chaînes R1 : 1 (`submission-feedback-card.tsx` — remplacé par RevisionPanel Phase 7)
- Branches conditionnelles staff trouvées dans fichiers multi-rôles : 0 (pixel-mascot admin-only via admin-live-view, pas de prop Player branch)

## Notes pour l'advisor (Tâche 2)

- **Ambiguïté principale** : `app/journey/deliverable/[id]/page.tsx` L313 — `{c.max} pts` dans la liste des critères de la rubrique. Le contexte est : avant soumission, le Player voit "Critères d'évaluation : Proposition de valeur (20 pts), Preuve terrain (15 pts)..." — est-ce que montrer les barèmes max au Player sans montrer leur note obtenue viole R1 ? R1 interdit les fractions de scoring comme `/20`, `/100`, mais `c.max pts` dans un contexte pédagogique "voici les critères qui comptent" peut être ambigu. À trancher.
- **Dead code `submission-feedback-card.tsx`** : le composant contient des affichages `totalScore`, `{display} / {c.max}` qui seraient R1-violants si rendu. Puisque c'est du dead code (non importé, Phase 7 RevisionPanel l'a remplacé), faut-il le supprimer ou simplement le documenter ? Décision editorial de l'advisor.
- **Locale EN `"Scoring rubric"`** : si quelqu'un active la locale EN, la section titre dirait "Scoring rubric" visible Player. À l'état actuel du code (locale `fr` figée), non rendu. L'advisor peut confirmer faux positif ou recommander patch défensive.
- Composants multi-rôles : aucun problème identifié — pixel-mascot admin-only, app-shell sans strings R1 dans aucune branche.
