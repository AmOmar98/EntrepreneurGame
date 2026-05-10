# A1 + A4 — Audit + Proposition technique (input advisor)

> Genere 2026-05-10 · Tache 1 / 3 · Aucun edit code applique.

## AppShell variant=player layout

- Fichier : `components/app-shell.tsx:42-55`
- Composition : `<TopbarLite>` (top, hauteur 72px desktop / 64px mobile) + `<main className="eic-shell__main">` (flex 1 1 auto, children) + `<MobileTabBar>` (fixed bottom, display:none >= 1099px, visible < 1099px uniquement).
- **Pas de sidebar gauche** cote Player. Le brief T3-IMPROVEMENTS.md A4 mentionne "sidebar gauche" — incompatible avec l'arborescence reelle. Adaptation : proposer compteur en HEADER du `<form>` (au-dessus du `<fieldset kind>`), pastille A1 en FOOTER du `<form>` (sous le bouton Soumettre).
- La page deliverable (`app/journey/deliverable/[id]/page.tsx:286`) utilise `<AppShell role="player" variant="player">` + `<main style={SHELL_MAIN_STYLE}>` (padding: 24, maxWidth: 800). C'est dans ce `<main>` que le `<SubmissionForm>` est rendu (quand mode Supabase + aucune soumission existante ou V2 fallback).

## SubmissionForm — etat actuel

- Fichier : `components/submission-form.tsx:1-146`
- **Pas de `ref` form actuellement** — a introduire en Tache 3 via `useRef<HTMLFormElement>(null)` + `ref={formRef}` sur le `<form>`.
- `useActionState` (ligne 24) : `[state, formAction, pending] = useActionState(submitDeliverable, initialState)`.
- `useEffect` (lignes 28-32) : declenche `router.refresh()` quand `state.ok`. Extension prevue : appeler `clear()` (hook auto-save) AVANT `router.refresh()`.
- Etat `kind` (ligne 25) : `useState<"proof_url" | "proof_text">("proof_url")` — gere l'affichage conditionnel du champ de preuve.
- Champs requis visibles (analyse codebase) :
  - Radio `kind` (proof_url | proof_text) — EXCLU du compteur A4 (radio, toujours l'un selectionne, valeur ne varie pas via `.value.trim().length`).
  - Input url `proofUrl` (`type="url"`, `name="proofUrl"`, `required`, `pattern="https://.*"`) — INCLUS si `kind === "proof_url"`.
  - Textarea `proofText` (`name="proofText"`, `required`, `rows={10}`, `maxLength={4000}`) — INCLUS si `kind === "proof_text"`.
  - **Total dynamique** : 1 champ requis visible a tout moment selon le `kind` actif. Le compteur affichera donc 0/1 ou 1/1 — comportement attendu (compteur informatif, pas bloquant R2).
- Reutilise par `<RevisionPanel>` (`components/revision-panel.tsx:198`) avec `version=2` et meme `deliverableTemplateId` — A1+A4 fonctionneront transparently V1 + V2 (la cle localStorage change automatiquement selon `deliverableTemplateId`).
- **Inline styles** : tout le form utilise des `style={...}` React — la pastille A1 et le compteur A4 seront positionnes via des classes CSS `.eic-*` (cohérent avec le design system v2), PAS via inline styles.

## Page deliverable — branche demo vs Supabase

- Fichier : `app/journey/deliverable/[id]/page.tsx`
- **Branche demo** (lignes 107-116) : `!hasSupabaseEnv()` → retourne `<AppShell role="player" variant="player"><main style={SHELL_MAIN_STYLE}><BackLink /><p>{t.submission_demo_disabled}</p></main></AppShell>`. Le `<SubmissionForm>` n'est PAS rendu. A1/A4 ne s'instancient pas — comportement attendu.
- **Branche null supabase** (lignes 118-128) : `!supabase` → meme comportement que demo. Securite identique.
- **Branche Supabase normale** (lignes 130+) : flow complet V1 / V2 / readonly / ticket SOUMIS.
- Rendu `<SubmissionForm>` concerne :
  - Ligne 381 : `<SubmissionForm deliverableTemplateId={id} />` (V1 sans soumission precedente)
  - Ligne 378 : `<SubmissionForm deliverableTemplateId={id} version={2} />` (V2 fallback sans evaluation)
  - Ligne 198 (via RevisionPanel) : `<SubmissionForm deliverableTemplateId={deliverableTemplateId} version={2} />` (V2 normal avec revision panel)
- **Consequence pour tests visuels** : `npm run dev` SANS env vars Supabase → `/journey/deliverable/<id>` affiche le message demo, A1/A4 inertes. Pour tester A1/A4 : necessaire d'avoir un env Supabase actif (local `.env.local` ou preview Vercel avec env vars). Tests visuels Supabase peuvent etre differes a preview post-merge.

## Pre-existants a integrer / eviter conflit nom

- `hooks/` : **n'existe pas** a la racine du repo (Glob confirme : 0 resultats). A creer pour `hooks/use-auto-save.ts`.
- `components/auto-save-badge.tsx` : **n'existe pas** (Glob confirme : 0 resultats). Fichier a creer.
- `components/field-completion-counter.tsx` : **n'existe pas** (Glob confirme : 0 resultats). Fichier a creer.
- Aucun precedent technique `useRef`, `useActionState`, `localStorage`, `setInterval`, `MutationObserver` dans `components/*.tsx` ni `app/journey/**` (Grep confirme : 0 occurrences dans les composants existants). Seule occurrence `localStorage` dans le repo hors plan = `.planning/design-v2/project/design-canvas.jsx:270` (hors scope, fichier de reference design uniquement).
- **Collision cle localStorage** : aucune cle `eg_draft_*` existante dans le codebase. Namespace `eg_` libre.

## Proposition technique (a challenger par advisor)

### Position UI (CHANGEMENT vs brief T3-IMPROVEMENTS A4 "sidebar gauche")

- **Compteur A4** = HEADER du `<form>` dans `<SubmissionForm>` (entre le `<input type="hidden">` et le `<fieldset kind>`).
  - Justification : pas de sidebar gauche dans `AppShell variant="player"`. Header form = position immediate avant la saisie, visibilite < 3s sur l'avancement, logique UX evidente.
  - Alternative consideree : sticky en haut de `<main>` → rejetee car necessite de modifier la page serveur (hors scope Tache 3) et casse le maxWidth:800 existant.
  - Alternative consideree : sous le `<h1>` titre deliverable → rejetee car trop eloigne du form, la section description + rubric se trouve entre les deux.
- **Pastille A1** = FOOTER du `<form>` (sous le `<button>` Soumettre, avant le `state.message` ternaire).
  - Justification : conforme brief T3-IMPROVEMENTS A1 "pastille footer mission". Position discrete, informative, pas intrusif.

### Wording propose (FR — a valider advisor)

- Pastille A1 (3 etats) :
  - `lastSavedAt === null` → `"Pas encore sauvegarde"` (sans accents pour cohérence lib/i18n.ts existant qui evite les accents dans les chaines de code — ex: `"XP confirme"`, `"Preuve a valider"`)
  - `< 2 s` → `"Sauvegarde a l'instant"`
  - `>= 2 s` → `"Sauvegarde il y a Ns"` (N = Math.floor(secondes))
- Compteur A4 :
  - `total > 0` → `"Y/N champs remplis"` (proposition principale)
  - `total === 0` → render `null` (form sans champ requis visible — cas defensif)

**Note sur diacritiques** : lib/i18n.ts utilise majoritairement l'ASCII (`"Preuve a valider"`, `"XP confirme"`, `"Brouillon sauvegarde"`) pour eviter les problemes de transcodage dans les exports CSV/mailto. Pour les composants UI Player pur (DOM, pas CSV/mailto), les diacritiques sont techniquement surs. L'advisor doit trancher la convention pour ce sprint.

### Animation coche pop (A4)

- **Trigger** : transition vide → rempli sur >= 1 champ requis (etat `pulseKey` incremente).
- **Direction** : UNIQUEMENT en sens vide → rempli (pas de pop quand champ repasse vide → pas d'animation punitive).
- **Implantation CSS** : `::before` content `"✓"` + keyframe `eic-check-pop` 380ms ease-out (scale 0.6 → 1.15 → 1).
- **A11y** : `@media (prefers-reduced-motion: reduce)` desactive l'animation (`animation: none`). `aria-live="polite"` annonce le changement de count sans spam (debounce naturel : 1 annonce par saisie, pas par tick interval).
- **Caveat technique** : le `data-pulse` attribut qui s'incremente declenchera-t-il bien un replay du keyframe `::before` CSS ? Si le navigateur ne rejoue pas l'animation sur changement d'attribut, fallback avec `<span key={pulseKey}>✓</span>` inline dans le JSX a la place du `::before`. L'advisor peut confirmer le choix implementation — le squelette du plan utilise `data-pulse` + `::before`.

### Cle localStorage

- Cle : `` `eg_draft_${deliverableTemplateId}` `` (prefixe `eg_` = entrepreneur game, isolee par template, pas par Player — acceptable au pilote car 1 Player = 1 session browser).
- Cleanup au `state.ok` via fonction `clear` retournee par `useAutoSave`, appelee dans le `useEffect` existant avant `router.refresh()`.
- Hydrate au mount : `localStorage.getItem(key)` → `JSON.parse` → `form.elements.namedItem(name).value = value`. Try/catch partout (privacy mode, storage quota).

### Conformite R1 / R2 / R3 (auto-check avant advisor)

- **R1** : aucun chiffre note/score/rank/percentile dans wording, aria-live, aria-label, className. Le compteur compte des CHAMPS (UX form), pas des XP. Le "N" dans "Y/N champs remplis" = nombre de champs requis, pas un score. "Y" = champs remplis, pas un rang.
- **R2** : pastille A1 = statut sauvegarde locale uniquement, aucun warning de validation. Compteur A4 = information, pas warning. Bouton Soumettre INDEPENDANT du compteur — aucune logique `disabled={filled < total}` ou similaire. R2 strict preservee.
- **R3** : localStorage isole par `deliverableTemplateId`. Aucune logique de progression mission ajoutee. Aucun `blocks_progression_to`. Aucune logique "vous ne pouvez pas avancer tant que Y < N".

## Points a trancher par l'advisor (Tache 2)

1. **Wording exact FR** pastille (3 etats) + compteur — confirmer ou amender les propositions, trancher sur la convention diacritiques pour les strings DOM Player de ce sprint.
2. **Position UI compteur** : confirmer HEADER du `<form>` (proposition) ou proposer une alternative justifiee par le layout reel AppShell variant=player.
3. **Animation coche pop** : confirmer `::before` + `data-pulse` OU suggerer `<span key={pulseKey}>` inline si meilleur support inter-navigateurs. Confirmer que l'animation viole pas R3 (reponse attendue : non — c'est purement UX form, pas logique progression mission).
4. **Tests visuels demo mode** : confirmer que A1/A4 inertes en demo (message `t.submission_demo_disabled` affiche, pas de crash) = comportement attendu et suffisant pour ce sprint. Tests fonctionnels Supabase = differables sur preview Vercel post-merge.
5. **Verification R1/R2/R3 finale** : l'advisor fait un grep mental sur les wording/aria/className proposes et valide qu'aucune fuite R1 (score, rank, note, /100) n'est presente, que R2 est preservee (bouton soumettre independant), que R3 est preservee (pas de logique mission).
