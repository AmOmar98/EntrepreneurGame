# A1 + A4 Advisor Verdict — eic-pedagogical-advisor

> Source de verite : `EIC-MANAGER-ANSWERS-AGREENTECH.md` + `T3-IMPROVEMENTS.md` (R1/R2/R3 + section A.A1 + A.A4)
> Input audite : `MAPPING.md` (Tache 1)
> Posture : tranchee, no-hedging.

## Verdicts wording / position

### Pastille A1 (auto-save badge)

- **Verdict wording** : amended (diacritiques actives — voir justification)
- **Wording final FR** :
  - Etat `lastSavedAt === null` → `"Pas encore sauvegarde"`
  - Etat `< 2 s` → `"Sauvegarde a l'instant"`
  - Etat `>= 2 s` → `"Sauvegarde il y a ${N}s"` (N = Math.floor(secondes))
- **Convention diacritiques** : SANS accents. La convention du projet (lib/i18n.ts : `"XP confirme"`, `"Preuve a valider"`, `"Brouillon sauvegarde"`) evite les accents dans les chaines resident dans le code source pour la securite des exports CSV/mailto. Meme si la pastille n'alimente pas CSV/mailto, la coherence avec le reste du dictionnaire fr est la priorite pour ce sprint. Si Omar veut des accents dans les strings DOM Player, c'est un arbitrage post-pilote lors de la consolidation i18n (SEED-001 ou sprint dedie).
- **Position** : approved — footer du `<form>`, sous le bouton Soumettre, avant le `state.message` ternaire.
- **Justification** : T3-IMPROVEMENTS.md A1 : "pastille footer mission" — position conforme au brief. Discrete, informative, ne compete pas avec le CTA principal.

### Compteur A4 (field completion counter)

- **Verdict wording** : approved as proposed
- **Wording final FR** :
  - Etat `total > 0` → `"${filled}/${total} champs remplis"`
  - Etat `total === 0` → `null` (no render — cas defensif si form sans champ requis visible)
- **Position** : approved — header du `<form>`, entre le `<input type="hidden" name="deliverableTemplateId">` et le `<fieldset kind>`.
  - Justification : AppShell variant=player n'a pas de sidebar gauche (verifie MAPPING.md). Header form = position immediat avant la saisie, lisibilite < 3s conforme au brief T3-IMPROVEMENTS A4. L'adaptation vs "sidebar gauche" du brief est correcte et necessaire.
- **Animation coche pop** : approved — 380ms ease-out scale 0.6 → 1.15 → 1, UNIQUEMENT en sens vide → rempli.
  - Implementation : preferer `<span key={pulseKey} className="eic-field-counter__check" aria-hidden="true">✓</span>` inline dans le JSX plutot que `::before` + `data-pulse`. Raison : les navigateurs ne re-jouent pas forcement l'animation CSS `::before` sur un simple changement d'attribut `data-*` sans layout recalculation. Le `key={pulseKey}` React garantit un remount du `<span>` et donc un replay d'animation garanti. Le `::before` CSS peut etre conserve pour le style statique (si total > 0 et filled === total, afficher une coche permanente) mais le trigger animation = `key` React.
  - Justification : R3 — l'animation est purement UX form (champ rempli = feedback immediat). Aucune logique progression mission, aucun `blocks_progression_to`, aucun lien avec XP ou scoring. R3 PASS.

### Conformite R1 / R2 / R3

- **R1 (score invisible Player)** : PASS.
  - Wording pastille : `"Pas encore sauvegarde"` / `"Sauvegarde a l'instant"` / `"Sauvegarde il y a Ns"` — aucun chiffre score, rank, note, percentile. Le "N" dans "il y a Ns" = secondes ecoulees depuis la sauvegarde, pas un score.
  - Wording compteur : `"Y/N champs remplis"` — Y = champs remplis (UX form), N = total champs requis visibles. Aucune ambiguite avec un score /N ou une note. Terme "champs" = UX, pas "points" ni "criteres de note".
  - aria-live : annonce le contenu textuel du compteur et de la pastille — aucune fuite de chiffre score car les strings elles-memes sont conformes R1.
  - aria-label / className : `.eic-autosave-badge`, `.eic-field-counter`, `.eic-field-counter__check` — aucun terme interdit.
- **R2 (validators warn non-bloquants)** : PASS.
  - La pastille affiche uniquement le statut de sauvegarde locale — aucun message de validation, aucun warning, aucune logique de blocage.
  - Le compteur affiche `Y/N champs remplis` — information, pas avertissement. Le bouton Soumettre reste 100% independant du compteur (aucun `disabled`, `onClick`, ni `preventDefault` lie au compteur). R2 strict preservee.
  - VERIFICATION CRITIQUE : Tache 3 NE DOIT PAS introduire `disabled={filled < total}` sur le bouton Soumettre. Ceci serait une violation R2. Le bouton reste always-enabled (sauf `pending` du `useActionState` existant).
- **R3 (no hardcoded mission blocking)** : PASS.
  - localStorage isole par `deliverableTemplateId` — aucun couplage entre missions.
  - Aucune logique de progression mission dans le hook ou les composants.
  - L'auto-save est une feature UX pure (anti-perte de donnees), pas une feature de gamification ou de gating.

### Tests visuels demo mode

- **Comportement attendu en demo** (`!hasSupabaseEnv()`) : la page `/journey/deliverable/<id>` retourne le message `t.submission_demo_disabled` et `<BackLink>` — le `<SubmissionForm>` n'est PAS rendu, donc `useAutoSave` et `FieldCompletionCounter` ne s'instancient pas. Aucun crash. Aucun `localStorage.getItem` non-desire. Comportement conforme.
- **Tests visuels Tache 3 obligatoires** :
  1. `npm run dev` (mode demo) → `/journey/deliverable/<un-id>` : confirmer que le message demo s'affiche et que la page ne plante pas (aucune erreur console liee a A1/A4 — ils ne sont pas montes en demo).
  2. `npm run dev` (mode demo) → `/login`, `/journey` : confirmer aucune regression sur les autres pages Player.
  3. Si env Supabase dispo (local ou preview Vercel) : `/journey/deliverable/<id>` Player authentifie → compteur visible header form `0/1 champs remplis` au mount → taper dans `proofText` → compteur passe `1/1 champs remplis` + coche pop → attendre 8s → pastille passe a `"Sauvegarde a l'instant"` → recharger la page → texte restaure depuis localStorage.
  4. Toggle radio kind (proof_url ↔ proof_text) → compteur reste `0/1` ou `1/1` (1 champ requis visible a la fois, pas 2).
  5. `prefers-reduced-motion: reduce` (DevTools Rendering) → coche apparait sans animation.
  6. Soumettre avec succes → localStorage cleane (cle `eg_draft_<id>` absente apres refresh) → pastille repasse `"Pas encore sauvegarde"` au prochain montage.

## Refus / hors-scope rappeles

- Aucun edit dans `lib/types.ts`, `app/actions.ts`, `lib/i18n.ts`, `database/`, `utils/supabase/`, `middleware.ts`, `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `components/revision-panel.tsx`.
- Aucun pre-cablage des schemas v2 (reserves v0.3 SEED-001).
- Aucun ajout de XP, badge, validator, ou logique de progression dans la pastille ou le compteur.
- Aucun `disabled={filled < total}` sur le bouton Soumettre — violation R2 explicite.
- Aucune mention "score", "rank", "note", "points", "/100", "/140", "percentile" dans les wording, aria-live, aria-label, ou className des 3 nouveaux composants.

## Implementation note technique (consequence du verdict animation)

L'advisor recommande le changement suivant par rapport au squelette du PLAN.md pour l'animation coche :

**Au lieu de** `::before` + `data-pulse` pour l'animation :
```tsx
// PLAN.md proposait :
<p aria-live="polite" className="eic-field-counter" data-pulse={pulseKey}>
  {filled}/{total} champs remplis
</p>
// + CSS ::before { content: "✓"; animation: eic-check-pop ... }
```

**Utiliser** un `<span key={pulseKey}>` React pour le trigger d'animation :
```tsx
<p aria-live="polite" className="eic-field-counter">
  {filled > 0 && (
    <span key={pulseKey} className="eic-field-counter__check" aria-hidden="true">✓ </span>
  )}
  {filled}/{total} champs remplis
</p>
```
```css
.eic-field-counter__check {
  display: inline-block;
  color: #15803d;
  animation: eic-check-pop 380ms ease-out;
}
@keyframes eic-check-pop {
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .eic-field-counter__check { animation: none; }
}
```
Le `key={pulseKey}` sur le `<span>` garantit un remount React = replay de l'animation a chaque transition vide → rempli. Pas d'affichage permanent de la coche quand `filled === 0` (le span n'est pas rendu si `filled === 0`).

Note : quand `filled > 0` mais que le champ repasse de rempli a vide, `filled` diminue — le span disparait (car `filled === 0`) mais la coche ne pop pas (animation only on positive transition). Si `filled` passe de 0 a 1 a nouveau, `pulseKey` est incremente → nouveau span → nouveau replay. Comportement conforme au brief.

## Cas escalades a Omar (si applicable)

Aucun. Les propositions de MAPPING.md sont conformes a T3-IMPROVEMENTS.md R1/R2/R3 et au brief A1/A4. L'adaptation "sidebar gauche → header form" est correcte et necessaire (validee par audit AppShell). L'amendement "animation via key React plutot que data-pulse CSS" est une correction technique interne, pas un changement de spec.
