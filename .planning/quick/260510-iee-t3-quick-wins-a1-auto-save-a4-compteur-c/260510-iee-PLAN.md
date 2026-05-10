---
quick_id: 260510-iee
type: quick
description: Quick wins T-3 — A1 (auto-save 8s + pastille footer) + A4 (compteur X/N champs sidebar). NE PAS inclure A3 (déplacé phase v0.3 SEED-001).
autonomous: false
files_modified:
  # Authoritative list — Tâche 3 ne doit toucher QUE ces fichiers (+ ADVISOR-VERDICT peut élargir wording, jamais le scope).
  - hooks/use-auto-save.ts                  # nouveau — hook custom A1 (interval 8s + localStorage + lastSavedAt)
  - components/auto-save-badge.tsx          # nouveau — pastille footer A1 (FR, refresh secondes, aria-live polite)
  - components/field-completion-counter.tsx # nouveau — compteur X/N A4 (DOM walk required + filled, animation coche pop)
  - components/submission-form.tsx          # WIRE A1+A4 : ref form, hook, pastille footer, counter en header, hydrate localStorage au mount, clear localStorage au submit ok
  - app/globals.css                         # tokens locaux : .eic-autosave-badge, .eic-field-counter, keyframe @check-pop, @media prefers-reduced-motion guard
must_haves:
  truths:
    - "Le Player voit, sous le bouton Soumettre du <SubmissionForm>, une pastille FR qui indique la dernière sauvegarde locale (`Sauvegardé à l'instant` / `Sauvegardé il y a Ns` / `Pas encore sauvegardé`) — wording validé par l'advisor avant code."
    - "Toutes les 8 s, si la valeur d'un input visible du form a changé, le hook écrit `localStorage[eg_draft_<deliverableTemplateId>]` (JSON) et met à jour `lastSavedAt`. Aucune écriture si rien n'a changé."
    - "Au mount du <SubmissionForm>, si une entrée existe sous la clé pour ce deliverableTemplateId, les inputs sont hydratés depuis localStorage avant tout render visible (anti-FOUC textuel)."
    - "Au-dessus du form, le Player voit `Y/N champs remplis` (wording validé advisor) qui se met à jour à chaque saisie ; quand un champ requis passe vide → rempli, une animation coche pop joue (≤ 400 ms, no-op si `prefers-reduced-motion: reduce`)."
    - "Le compteur compte uniquement les inputs/textarea/select **visibles** ET **requis** (`required` ou `data-required`) — les radios `kind` (proof_url/proof_text) ne créent pas de double comptage selon l'option active."
    - "Aucun chiffre R1 (note/score/rank/percentile) n'apparaît dans la pastille, le compteur, leur aria-live, leur aria-label, ou leurs classes CSS visibles. R2 préservée : aucun blocking validator introduit. R3 préservée : aucune logique de progression mission ajoutée."
    - "La soumission finale reste exclusivement manuelle via `submitDeliverable` — le hook auto-save n'appelle JAMAIS de server action. Au retour `state.ok` côté client, `localStorage.removeItem(<key>)` est appelé."
    - "Demo mode (`hasSupabaseEnv()` false) : la page deliverable affiche le message `t.submission_demo_disabled` AVANT le form — A1+A4 ne s'instancient donc pas en demo. Auto-save reste fonctionnel UNIQUEMENT côté authentifié Supabase. Aucun crash en demo."
    - "`npm run typecheck` PASS après chaque commit. Aucun changement de signature de server action, aucun changement de type domaine, aucun changement de schéma DB."
    - "Le gate `eic-pedagogical-advisor` (Tâche 2) a tranché AVANT TOUT EDIT côté code : wording exact pastille + compteur, position UI (header form / footer form), aucune fuite R1/R2/R3."
  artifacts:
    - path: ".planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/MAPPING.md"
      provides: "Audit composants form Player + structure AppShell variant=player + position UI proposée pour pastille A1 et compteur A4 — input pour gate advisor."
      contains: "## AppShell variant=player layout"
    - path: ".planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/ADVISOR-VERDICT.md"
      provides: "Verdict eic-pedagogical-advisor sur wording (FR) + position UI + non-violation R1/R2/R3 — autorisation explicite avant Tâche 3."
      contains: "## Verdicts wording / position"
    - path: ".planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/260510-iee-SUMMARY.md"
      provides: "Récap final : commits posés (≥2 atomiques), tests visuels effectués (URLs + résolutions), garde-fous respectés, faux positifs documentés."
      contains: "## A1 + A4 Outcome"
    - path: "hooks/use-auto-save.ts"
      provides: "Hook custom React 19 — interval 8 s, lecture FormData via formRef, comparaison shallow JSON.stringify(prev) !== JSON.stringify(next), localStorage write si change, lastSavedAt setter."
      contains: "export function useAutoSave"
      min_lines: 40
    - path: "components/auto-save-badge.tsx"
      provides: "Composant client pur — props { lastSavedAt: Date | null }, recompute formattedAge à chaque render via setInterval 1 s, FR strings (À l'instant / il y a Ns / Pas encore sauvegardé)."
      contains: "export function AutoSaveBadge"
      min_lines: 30
    - path: "components/field-completion-counter.tsx"
      provides: "Composant client pur — props { formRef: RefObject<HTMLFormElement | null> }, MutationObserver + input event listener, état { filled: number, total: number }, render `Y/N champs remplis` + animation coche pop sur transition vide→rempli."
      contains: "export function FieldCompletionCounter"
      min_lines: 50
  key_links:
    - from: "Tâche 1 (audit + proposition tech) → Tâche 2 (gate advisor)"
      to: "MAPPING.md consommé en input par eic-pedagogical-advisor"
      via: "fichier markdown lu par l'agent advisor avant verdict"
      pattern: "MAPPING\\.md"
    - from: "Tâche 2 (gate advisor) → Tâche 3 (implémentation)"
      to: "ADVISOR-VERDICT.md = autorisation d'écrire code — aucun edit code avant ce fichier validé Omar"
      via: "checkpoint:human-verify avec resume-signal `approved`"
      pattern: "ADVISOR-VERDICT\\.md"
    - from: "components/submission-form.tsx (wired)"
      to: "hooks/use-auto-save.ts + components/auto-save-badge.tsx + components/field-completion-counter.tsx"
      via: "imports React + nouveaux composants, useRef<HTMLFormElement>, useEffect lifecycle pour hydrate + cleanup au state.ok"
      pattern: "useAutoSave|AutoSaveBadge|FieldCompletionCounter"
    - from: "components/submission-form.tsx state.ok"
      to: "localStorage.removeItem(eg_draft_<id>)"
      via: "useEffect existant (lignes 28-32) étendu avec cleanup avant router.refresh()"
      pattern: "localStorage\\.removeItem"
---

<objective>
Livrer **A1 (auto-save 8 s + pastille footer)** + **A4 (compteur X/N champs)** avant T-3 (mardi 12/05 23h, AgreenTech 13-14 mai 2026). Scope quick : composants UI client-side, aucune migration DB, aucun changement type/schéma, aucun changement server action.

Le travail est **gated** par `eic-pedagogical-advisor` qui valide AVANT toute écriture de code : wording FR exact des deux composants, position UI dans le layout Player (`AppShell variant="player"` n'a PAS de sidebar gauche — voir Tâche 1), et absence de fuite R1 (chiffres/note/rank), R2 (blocking validator), R3 (logique progression mission codée en dur).

Purpose : tuer l'angoisse "j'ai perdu ma persona" (A1) + lisibilité < 3 s sur l'avancement formulaire (A4) — quick wins ratio 20/80 figés par Omar 10/05 dans `T3-IMPROVEMENTS.md` section A.

Output : MAPPING.md (audit + proposition) + ADVISOR-VERDICT.md (gate) + SUMMARY.md (récap) dans `.planning/quick/260510-iee-...` ; 3 nouveaux fichiers code (`hooks/use-auto-save.ts`, `components/auto-save-badge.tsx`, `components/field-completion-counter.tsx`) ; 2 fichiers existants modifiés (`components/submission-form.tsx`, `app/globals.css`) ; ≥ 2 commits atomiques (`feat(a1): ...`, `feat(a4): ...`, et 1 `docs(quick):` final).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@./T3-IMPROVEMENTS.md
@.planning/STATE.md
@.planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/260510-heu-SUMMARY.md
@.planning/seeds/SEED-001-schemas-v2-architectural-refacto.md
@.claude/agents/eic-pedagogical-advisor.md
@components/submission-form.tsx
@components/revision-panel.tsx
@app/journey/deliverable/[id]/page.tsx
@components/app-shell.tsx

<known_codebase_facts>
**Player layout réel — vérifié 2026-05-10 :**
- `AppShell variant="player"` (`components/app-shell.tsx:42-55`) ne contient AUCUNE sidebar gauche. Layout = `<TopbarLite>` (top, lien `/journey` + logout) + `<main className="eic-shell__main">` (flex 1 1 auto) + `<MobileTabBar>` (fixed bottom mobile, ≥ 1100px desktop = invisible). Donc le brief "compteur sidebar gauche" doit s'adapter — proposition par défaut : compteur en **header du form** (au-dessus de `<fieldset kind>`), pastille auto-save en **footer du form** (sous le bouton Soumettre).
- `components/submission-form.tsx` (146 lignes) : client component, `useActionState(submitDeliverable, ...)`, 2 modes radio `proof_url | proof_text`, pas de ref form actuellement, useEffect ligne 28-32 fait `router.refresh()` au state.ok.
- `app/journey/deliverable/[id]/page.tsx` (386 lignes) : server component, gate role=player, **branche demo `!hasSupabaseEnv()`** affiche `t.submission_demo_disabled` AVANT le form (lignes 107-128) — donc A1/A4 ne s'instancient PAS en demo. Tests visuels demo = vérifier que le message demo s'affiche correctement, PAS que A1/A4 fonctionnent en demo.
- `components/revision-panel.tsx` ré-utilise `<SubmissionForm version=2>` (ligne 198) — A1+A4 doivent donc fonctionner pour V1 ET V2 sans configuration supplémentaire (le `deliverableTemplateId` change la clé localStorage automatiquement).
- Aucun dossier `hooks/` n'existe encore au repo root — créer le fichier en `hooks/use-auto-save.ts` (cohérent avec convention kebab-case TS de CLAUDE.md). Path alias `@/*` → repo root, donc import `@/hooks/use-auto-save`.
- `app/globals.css` contient déjà les utilitaires `.eic-shell__main`, `.eic-shell--player`, `.eic-revision__form`, `.eic-glass` — réutiliser ces tokens si pertinents pour la pastille / compteur (mais pas obligatoire — peut introduire `.eic-autosave-badge`, `.eic-field-counter` en respectant convention BEM `.eic-*`).
- Convention française du projet (CLAUDE.md "Internationalization") : éviter les diacritiques accentués dans les fichiers de code resident pour mailto/CSV safety. Pour A1/A4, les chaînes sont consommées dans le DOM Player → diacritiques OK MAIS rester cohérent avec dictionaries existants (FR sans accents : `Sauvegarde a l'instant` style ou avec accents normalisés). **Décision wording exacte = advisor.**
</known_codebase_facts>

<scope_boundaries>
**Hors scope strict (NE JAMAIS toucher) :**
- `lib/types.ts` — types domaine (DeliverableTemplate, RubricCriterion, Submission, etc.)
- `app/actions.ts` — server actions (`submitDeliverable*`, `claimBonusEvent*`, ...)
- `lib/i18n.ts` — dictionnaires copy (les strings A1/A4 vivent inline dans les nouveaux composants pour ce sprint quick — pas d'extension i18n.ts qui élargirait le scope ; SEED post-pilote pour i18n complet)
- `database/` — DDL, triggers, RLS, seeds
- `utils/supabase/`, `lib/supabase-status.ts`, `middleware.ts` — auth + dual-mode
- `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/` — autres rôles
- `components/revision-panel.tsx` — V2 panel (transparent à A1+A4 via SubmissionForm)
- Schemas v2 (`deliverable_templates.validation_rules`, types pédagogiques 5 variants) — **réservé v0.3 SEED-001**, ne PAS pré-câbler ici
- A2 (validators warn) + A3 (Hypothèse à invalider) + A5 (Pixel mascotte triggers) — autres lignes T3-IMPROVEMENTS, hors quick
- B1-B5, C1-C4, D, E, F, G — sections post-pilote ou jury, hors quick

**R1/R2/R3 reminders pour eic-pedagogical-advisor (Tâche 2) :**
- R1 : pas de `score`, `rank`, `note`, `/100`, `points` au sens score, `percentile` dans pastille / compteur / aria-live / aria-label / className visible. `XP` autorisé mais hors scope ici (le compteur compte des CHAMPS, pas des XP — ne PAS introduire d'XP dans le wording compteur).
- R2 : la pastille n'affiche AUCUN warning de validation — uniquement statut sauvegarde locale. Le compteur n'affiche AUCUN warning — uniquement Y/N. Si N=0 (form sans champs requis), le compteur ne se monte pas (skeleton vide ou `null`).
- R3 : aucune logique "vous ne pouvez pas soumettre tant que Y<N" — le bouton Soumettre du form est INDÉPENDANT du compteur (R2 strict : warnings non-bloquants).
</scope_boundaries>

<technical_proposal>
**A1 — Auto-save 8 s** (wording final = advisor)

```ts
// hooks/use-auto-save.ts
"use client";
import { useEffect, useRef, useState, type RefObject } from "react";

type Options = { intervalMs?: number; key: string };
type Result = { lastSavedAt: Date | null; clear: () => void };

export function useAutoSave(
  formRef: RefObject<HTMLFormElement | null>,
  { intervalMs = 8000, key }: Options,
): Result {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSerializedRef = useRef<string | null>(null);

  // Hydrate au mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const form = formRef.current;
    if (!form) return;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const stored = JSON.parse(raw) as Record<string, string>;
      for (const [name, value] of Object.entries(stored)) {
        const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el && "value" in el) {
          el.value = value;
        }
      }
      lastSerializedRef.current = raw;
      setLastSavedAt(new Date()); // approximation : on sait juste qu'il y a eu une save antérieure
    } catch { /* corrupted JSON → ignore */ }
  }, [formRef, key]);

  // Tick auto-save.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tick = () => {
      const form = formRef.current;
      if (!form) return;
      const data = new FormData(form);
      const obj: Record<string, string> = {};
      for (const [name, value] of data.entries()) {
        if (typeof value === "string") obj[name] = value;
      }
      const next = JSON.stringify(obj);
      if (next === lastSerializedRef.current) return;
      try {
        window.localStorage.setItem(key, next);
        lastSerializedRef.current = next;
        setLastSavedAt(new Date());
      } catch { /* quota exceeded → ignore silently per scope */ }
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [formRef, intervalMs, key]);

  const clear = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
      lastSerializedRef.current = null;
    } catch { /* noop */ }
  };

  return { lastSavedAt, clear };
}
```

```tsx
// components/auto-save-badge.tsx — wording FR final = advisor
"use client";
import { useEffect, useState } from "react";

export function AutoSaveBadge({ lastSavedAt }: { lastSavedAt: Date | null }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [lastSavedAt]);

  let label: string;
  if (!lastSavedAt) {
    label = /* TBD advisor */ "Pas encore sauvegarde";
  } else {
    const seconds = Math.max(0, Math.floor((Date.now() - lastSavedAt.getTime()) / 1000));
    if (seconds < 2) label = /* TBD advisor */ "Sauvegarde a l'instant";
    else label = /* TBD advisor */ `Sauvegarde il y a ${seconds}s`;
  }
  return (
    <p aria-live="polite" className="eic-autosave-badge" role="status">
      {label}
    </p>
  );
}
```

**A4 — Compteur X/N** (wording final = advisor)

```tsx
// components/field-completion-counter.tsx
"use client";
import { useEffect, useState, type RefObject } from "react";

export function FieldCompletionCounter({ formRef }: { formRef: RefObject<HTMLFormElement | null> }) {
  const [{ filled, total }, setCounts] = useState({ filled: 0, total: 0 });
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const isVisible = (el: Element) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.hasAttribute("hidden")) return false;
      // offsetParent === null = display:none ou removed
      return el.offsetParent !== null || el === document.activeElement;
    };
    const isRequired = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) =>
      el.required || el.dataset.required === "true";
    const recompute = () => {
      const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        "input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea,select",
      )).filter((el) => isVisible(el) && isRequired(el));
      const total = fields.length;
      const filled = fields.filter((el) => el.value.trim().length > 0).length;
      setCounts((prev) => {
        if (prev.filled !== filled || prev.total !== total) {
          if (filled > prev.filled) setPulseKey((k) => k + 1);
          return { filled, total };
        }
        return prev;
      });
    };
    recompute();
    const obs = new MutationObserver(recompute);
    obs.observe(form, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "required", "data-required"] });
    form.addEventListener("input", recompute);
    return () => {
      obs.disconnect();
      form.removeEventListener("input", recompute);
    };
  }, [formRef]);

  if (total === 0) return null;
  return (
    <p aria-live="polite" className="eic-field-counter" data-pulse={pulseKey}>
      {/* TBD advisor : "Y/N champs remplis" vs "Y sur N champs" vs "Champs : Y/N" */}
      {filled}/{total} champs remplis
    </p>
  );
}
```

**Wire dans `submission-form.tsx`** (squelette) :

```tsx
const formRef = useRef<HTMLFormElement>(null);
const { lastSavedAt, clear } = useAutoSave(formRef, { key: `eg_draft_${deliverableTemplateId}` });

useEffect(() => {
  if (state.ok) {
    clear();          // <-- nouveau : cleanup localStorage avant refresh
    router.refresh();
  }
}, [state.ok, clear, router]);

return (
  <form ref={formRef} action={formAction} ...>
    <FieldCompletionCounter formRef={formRef} />        {/* HEADER form */}
    {/* ... fieldset kind + champ proof_url|proof_text + bouton submit (existant) ... */}
    <AutoSaveBadge lastSavedAt={lastSavedAt} />         {/* FOOTER sous bouton */}
    {state.message ? <p ...>{state.message}</p> : null}
  </form>
);
```

**`app/globals.css`** : ajouter (≤ 30 lignes) :

```css
.eic-autosave-badge { font-size: 12px; color: #64748b; margin: 4px 0 0; }
.eic-field-counter { font-size: 13px; color: #475569; margin: 0 0 8px; font-weight: 500; }
.eic-field-counter[data-pulse]::before {
  content: "✓"; display: inline-block; margin-right: 6px; color: #15803d;
  animation: eic-check-pop 380ms ease-out;
}
@keyframes eic-check-pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .eic-field-counter[data-pulse]::before { animation: none; }
}
```

**Caveats à challenger en Tâche 2 (advisor)** :
1. Position du compteur : header form (proposition) vs sticky en haut de `<main>` (alternative) vs juste sous `<h1>` titre deliverable (autre alternative). L'advisor tranche en regardant `T3-IMPROVEMENTS.md` brief (`sidebar gauche` initialement).
2. Wording pastille FR : "Sauvegardé il y a 3s" (avec accents) vs sans accents (cohérence projet) — advisor confirme la convention d'écriture FR du projet pour ce sprint.
3. Wording compteur FR : "Y/N champs remplis" vs alternatives — advisor tranche.
4. Le `data-pulse` qui change déclenche re-mount du `::before` ? Ou besoin d'un keyframe explicit replayed ? Si nécessaire, fallback `<span key={pulseKey}>✓</span>` à la place de `::before`.
5. `formRef.current` peut être null à premier paint (SSR Player) — défensive guard partout (déjà en place dans le squelette).
</technical_proposal>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit composants form Player + AppShell variant=player + proposition tech → MAPPING.md</name>
  <files>.planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/MAPPING.md</files>
  <action>
Produire un audit qui sert d'**input pour le gate advisor (Tâche 2)**. Aucun edit code ne doit avoir lieu durant cette tâche. Étapes :

1. **Re-lire** (Read tool) les fichiers suivants pour confirmer l'état actuel : `components/submission-form.tsx`, `components/revision-panel.tsx`, `app/journey/deliverable/[id]/page.tsx`, `components/app-shell.tsx`, et top de `app/globals.css` (chercher prefixes `.eic-shell`, `.eic-revision__form`, `.eic-glass`).

2. **Vérifier** (Glob tool) qu'aucun dossier `hooks/` n'existe à la racine, et qu'aucun composant `auto-save-badge.tsx`, `field-completion-counter.tsx`, `mission-footer.tsx`, `validation-checklist.tsx` n'existe déjà dans `components/`. Si l'un existe, l'inclure dans MAPPING.md sous "Pré-existants à intégrer / éviter conflit nom".

3. **Grep** (Grep tool) `useRef|useActionState|localStorage|setInterval|MutationObserver` dans `components/*.tsx` et `app/journey/**` pour repérer tout précédent technique réutilisable. Ce n'est PAS bloquant — juste contextuel.

4. **Confirmer** que `app/journey/deliverable/[id]/page.tsx` rend bien `<SubmissionForm>` côté Supabase (mode authentifié) et `<p>{t.submission_demo_disabled}</p>` côté demo. Capturer les numéros de lignes exacts dans MAPPING.md.

5. **Écrire `MAPPING.md`** avec cette structure (FR, factuel, no-hedging) :

```markdown
# A1 + A4 — Audit + Proposition technique (input advisor)

> Généré <date ISO> · Tâche 1 / 3 · Aucun edit code appliqué.

## AppShell variant=player layout
- Fichier : `components/app-shell.tsx:42-55`
- Composition : `<TopbarLite>` (top) + `<main className="eic-shell__main">` (children) + `<MobileTabBar>` (fixed bottom mobile uniquement).
- **Pas de sidebar gauche** côté Player. Le brief T3-IMPROVEMENTS.md A4 mentionne "sidebar gauche" — incompatible avec l'arborescence réelle. Adaptation : proposer compteur en HEADER du form (au-dessus de `<fieldset kind>`).

## SubmissionForm — état actuel
- Fichier : `components/submission-form.tsx:1-146`
- Pas de `ref` form actuellement (à introduire en Tâche 3).
- `useEffect` (lignes 28-32) → `router.refresh()` au `state.ok` — extension prévue : `clear()` localStorage AVANT refresh.
- Réutilisé par `<RevisionPanel>` (`components/revision-panel.tsx:198`) avec `version=2` et même `deliverableTemplateId` → A1/A4 fonctionnent transparently V1 + V2.
- Champs visibles couverts par compteur :
  - radio `kind` (proof_url|proof_text) — exclu (radio, déjà toujours sélectionné default proof_url).
  - input url `proofUrl` (required, pattern https://) — INCLUS si kind=proof_url.
  - textarea `proofText` (required, maxLength 4000) — INCLUS si kind=proof_text.
  - **Total dynamique** : 1 champ requis visible quel que soit le kind. Le compteur affichera donc 0/1 ou 1/1.

## Page deliverable — branche demo vs Supabase
- Fichier : `app/journey/deliverable/[id]/page.tsx`
- Demo (lignes 107-128) : `!hasSupabaseEnv()` → message demo + `<BackLink>`, le form n'est PAS rendu. A1/A4 inertes en demo (= comportement attendu).
- Supabase (lignes 130+) : flow normal V1 / V2 / readonly / ticket SOUMIS.
- Conséquence pour tests visuels : `npm run dev` SANS env vars Supabase → page deliverable affiche message demo (vérification de non-régression). Pour tester A1/A4 en visuel localement : démarrer Supabase env (Omar dispose des creds prod) OU short-circuit demo en local pour ce sprint (NON RECOMMANDÉ — préférer test sur preview Vercel ou skip visuel A1/A4 si infra demo only en local).

## Pré-existants à intégrer / éviter conflit nom
- `hooks/` : <existe ? listing>
- `components/auto-save-badge.tsx` : <existe ? non>
- `components/field-completion-counter.tsx` : <existe ? non>
- (Si l'un existe : Tâche 3 doit Read avant Write pour ne pas écraser.)

## Précédents techniques utiles repérés
- `useActionState` déjà utilisé dans `submission-form.tsx`, `login-form.tsx`, `mentor-comment-composer.tsx` — pattern React 19 connu du projet.
- `MutationObserver` : aucune occurrence dans `components/` (greenfield pour ce sprint).
- `localStorage` : <count> occurrences trouvées — détailler si > 0 (pour ne pas collisionner les keys).

## Proposition technique (à challenger par advisor)

### Position UI (CHANGEMENT vs brief T3-IMPROVEMENTS A4 "sidebar gauche")
- Compteur A4 = HEADER du `<form>` dans `<SubmissionForm>` (au-dessus de `<fieldset kind>`).
  - Justification : pas de sidebar gauche dans `AppShell variant=player`. Header form = position la plus proche du contexte de saisie + visibilité immédiate < 3 s.
  - Alternative considérée : sticky en haut de `<main>` → rejeté car redondant avec le titre deliverable et casse le layout existant.
- Pastille A1 = FOOTER du `<form>` (sous le bouton Soumettre, avant le `<p>{state.message}>`).
  - Justification : conforme brief T3-IMPROVEMENTS A1 ("pastille footer mission"). Visible mais discrète.

### Wording proposé (FR — à valider advisor)
- Pastille A1 :
  - null → `"Pas encore sauvegarde"` (sans accents pour cohérence i18n.ts existant)
  - < 2 s → `"Sauvegarde a l'instant"`
  - ≥ 2 s → `"Sauvegarde il y a Ns"` (N = secondes entières)
- Compteur A4 :
  - Si total > 0 → `"Y/N champs remplis"` (proposition principale)
  - Si total = 0 → render null (pas de compteur si form sans required visible)

### Animation coche pop (A4)
- Trigger : transition vide → rempli sur ≥ 1 champ requis (état `pulseKey` incrémenté).
- Implémentation : `::before` content `"✓"` + keyframe `eic-check-pop` 380 ms ease-out (scale 0.6 → 1.15 → 1).
- A11y : `@media (prefers-reduced-motion: reduce)` désactive l'animation. `aria-live="polite"` annonce le changement de count.

### Clé localStorage
- `eg_draft_${deliverableTemplateId}` (préfixe `eg_` = entrepreneur game).
- Cleanup au `state.ok` côté `<SubmissionForm>` via fonction `clear` retournée par le hook.

### Conformité R1 / R2 / R3 (auto-check avant advisor)
- R1 : aucun chiffre note/score/rank/percentile dans wording/aria/className. Compteur compte CHAMPS (UX form), pas XP — ne PAS introduire d'XP dans wording compteur.
- R2 : pastille = statut sauvegarde locale uniquement. Compteur = info, pas warning. Bouton Soumettre indépendant du compteur (R2 strict).
- R3 : aucune logique de progression mission codée. localStorage est purement client-side, isolé par `deliverableTemplateId`.

## Points à trancher par l'advisor (Tâche 2)
1. **Wording exact FR** pastille (3 états) + compteur — y compris décision diacritiques.
2. **Position UI compteur** confirmée header form (proposition) ou alternative.
3. **Tests visuels demo mode** — accepter que A1/A4 ne se manifestent qu'en mode Supabase ; SUMMARY.md final documentera la limite.
4. **Aucune fuite R1/R2/R3** validée dans wording + className + aria-live + animation.
```

6. **Ne PAS** créer de fichier code, ne PAS éditer `submission-form.tsx` ou `globals.css`. Ce fichier est read-only pour l'advisor.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs');const p='.planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/MAPPING.md';if(!fs.existsSync(p))process.exit(1);const c=fs.readFileSync(p,'utf8');for(const s of ['## AppShell variant=player layout','## SubmissionForm','## Proposition technique','## Points a trancher par l','R1','R2','R3']){if(!c.includes(s)){console.error('Missing section:',s);process.exit(2);}}console.log('MAPPING.md OK');"</automated>
  </verify>
  <done>
    `MAPPING.md` existe avec sections : `## AppShell variant=player layout`, `## SubmissionForm — état actuel`, `## Page deliverable — branche demo vs Supabase`, `## Pré-existants à intégrer / éviter conflit nom`, `## Proposition technique`, `## Points à trancher par l'advisor`. Aucun fichier source modifié (`git status` ne montre que ce nouveau fichier sous `.planning/quick/...`). Numéros de lignes (`components/app-shell.tsx:42-55`, `components/submission-form.tsx:28-32`, `app/journey/deliverable/[id]/page.tsx:107-128`) sont exacts au commit courant.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Gate eic-pedagogical-advisor sur wording + position + R1/R2/R3 → ADVISOR-VERDICT.md</name>
  <files>.planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/ADVISOR-VERDICT.md</files>
  <what-built>
Audit + proposition technique (`MAPPING.md` posé en Tâche 1) qui couvre : layout réel `AppShell variant=player`, état actuel `<SubmissionForm>`, branches demo/Supabase de la page deliverable, position UI proposée (compteur header form / pastille footer form), wording FR proposé pour 3 états pastille + 1 état compteur, et auto-check R1/R2/R3.

Aucun edit code appliqué — toutes les chaînes proposées sont encore à valider.
  </what-built>
  <how-to-verify>
**Cette tâche est un gate non-négociable** : avant tout edit code (Tâche 3), l'agent `eic-pedagogical-advisor` (cf. `.claude/agents/eic-pedagogical-advisor.md`) doit examiner `MAPPING.md` et trancher.

Procédure :

1. **Spawn de l'advisor** via le Task tool avec `subagent_type="eic-pedagogical-advisor"`. Prompt suggéré :

   *"Quick wins T-3 AgreenTech 13-14 mai 2026 — A1 (auto-save 8s + pastille footer SubmissionForm) + A4 (compteur Y/N champs header SubmissionForm). Examine `.planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/MAPPING.md` et tranche :*

   1. *Wording exact FR pour pastille A1 (3 états : null, < 2 s, ≥ 2 s) — confirme ou amende les propositions `Pas encore sauvegarde` / `Sauvegarde a l'instant` / `Sauvegarde il y a Ns`. Décide la convention diacritiques pour ce sprint (cohérence avec `lib/i18n.ts:dictionaries.fr` existant).*
   2. *Wording exact FR pour compteur A4 — confirme ou amende `Y/N champs remplis` (alternatives possibles : `Y sur N champs`, `Champs : Y/N`).*
   3. *Position UI : confirme HEADER du `<form>` pour le compteur (vs sidebar gauche brief original — impossible car AppShell variant=player n'a pas de sidebar). Confirme FOOTER du `<form>` pour la pastille.*
   4. *Conformité R1 (score invisible Player) : aucun mot interdit dans pastille / compteur / aria-live / aria-label / className. R2 (validators warn-only) : pastille et compteur n'introduisent aucun blocking validator, le bouton Soumettre reste 100 % indépendant. R3 (no hardcoded mission blocking) : localStorage isolé par deliverableTemplateId, aucune logique progression mission ajoutée.*
   5. *Tests visuels en demo mode (`!hasSupabaseEnv()`) : confirme que la page deliverable affiche `t.submission_demo_disabled` et que A1/A4 ne s'instancient pas en demo (= comportement attendu). Aucun crash.*

   *Format imposé pour `ADVISOR-VERDICT.md` (sections fixes ci-dessous). Tranche, no-hedging. Refuse poliment et propose alternative si une proposition viole R1/R2/R3.*"

2. **Format imposé pour `ADVISOR-VERDICT.md`** :

```markdown
# A1 + A4 Advisor Verdict — eic-pedagogical-advisor

> Source de vérité : `EIC-MANAGER-ANSWERS-AGREENTECH.md` + `T3-IMPROVEMENTS.md` (R1/R2/R3 + section A.A1 + A.A4)
> Input audité : `MAPPING.md` (Tâche 1)
> Posture : tranchée, no-hedging.

## Verdicts wording / position

### Pastille A1 (auto-save badge)
- **Verdict wording** : <approved as proposed | amended>
- **Wording final FR** :
  - État `lastSavedAt === null` → `"<wording>"`
  - État `< 2 s` → `"<wording>"`
  - État `≥ 2 s` → `"<wording (avec placeholder Ns)>"`
- **Position** : <approved footer form | amended>
- **Justification** : <1 ligne citant T3-IMPROVEMENTS A1 ou règle FR projet>

### Compteur A4 (field completion counter)
- **Verdict wording** : <approved as proposed | amended>
- **Wording final FR** :
  - État `total > 0` → `"<wording>"`
  - État `total === 0` → `null` (no render)
- **Position** : <approved header form | amended>
- **Animation coche pop** : <approved 380 ms scale | amended timing | refuse pour cause R3>
- **Justification** : <1 ligne citant T3-IMPROVEMENTS A4>

### Conformité R1 / R2 / R3
- **R1 (score invisible Player)** : <PASS / FAIL + détails>
- **R2 (validators warn non-bloquants)** : <PASS / FAIL + détails>
- **R3 (no hardcoded mission blocking)** : <PASS / FAIL + détails>

### Tests visuels demo mode
- Comportement attendu en demo (`!hasSupabaseEnv()`) : <description>
- Tests visuels Tâche 3 obligatoires : <liste — ex "vérifier que /journey/deliverable/<id> en demo affiche le message demo et ne plante pas">

## Refus / hors-scope rappelés
- Aucun edit dans `lib/types.ts`, `app/actions.ts`, `lib/i18n.ts`, `database/`, `utils/supabase/`, `middleware.ts`, `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `components/revision-panel.tsx`.
- Aucun pré-câblage des schemas v2 (réservé v0.3 SEED-001).
- Aucun ajout d'XP, badge, validator, ou logique de progression dans pastille / compteur.

## Cas escaladés à Omar (si applicable)
- <description si l'advisor identifie un cas hors brief — sinon "aucun">
```

3. **Bloquer ici si l'advisor refuse** : si verdict R1/R2/R3 = FAIL ou wording rejeté sans alternative claire, passer en `checkpoint:decision` à Omar avant Tâche 3.

4. **Validation user** : Omar relit `ADVISOR-VERDICT.md`, confirme wording + position OK ou amende. Tâche 3 ne démarre QUE sur signal explicite `approved`.
  </how-to-verify>
  <resume-signal>
Réponse attendue : `approved` (Omar a relu le verdict advisor, wording + position OK, lancer Tâche 3) — OU description des amendements (ex : "wording compteur trop verbeux, préférer `Champs : Y/N`" → l'advisor amende ADVISOR-VERDICT.md, on relit, on signal `approved` après).
  </resume-signal>
</task>

<task type="auto">
  <name>Task 3: Implémentation A1 + A4 + tests visuels + ≥ 2 atomic commits → SUMMARY.md</name>
  <files>hooks/use-auto-save.ts, components/auto-save-badge.tsx, components/field-completion-counter.tsx, components/submission-form.tsx, app/globals.css, .planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/260510-iee-SUMMARY.md</files>
  <action>
**Préconditions** (vérifier avant tout Edit) :
- `MAPPING.md` et `ADVISOR-VERDICT.md` existent.
- `ADVISOR-VERDICT.md` contient verdict R1=PASS + R2=PASS + R3=PASS et wording final FR pour pastille (3 états) + compteur (1 état non-null + null) + position UI confirmée.
- L'utilisateur a répondu `approved` au gate Tâche 2.
- `git status` ne contient que les 2 fichiers planning ci-dessus (aucun edit source en cours).
- Lancer `npm run typecheck` baseline → noter exit code (doit être 0 ; si 1, escalade Omar — typecheck préexiste cassé, ne pas commit).

**Procédure (ordre strict) :**

### Étape 3.1 — Implémentation A1 (auto-save)

1. **Créer `hooks/use-auto-save.ts`** (Write tool) selon le squelette de `<technical_proposal>` ci-dessus, sans modifications de logique. Le fichier doit :
   - Commencer par `"use client";`
   - Exporter `useAutoSave(formRef, { intervalMs?, key }): { lastSavedAt, clear }`
   - Hydrate au mount via `localStorage.getItem(key)` + JSON.parse + `form.elements.namedItem(name).value = value`
   - Tick `setInterval(intervalMs ?? 8000)` qui sérialise `new FormData(form)` → `JSON.stringify` → écrit si différent du précédent
   - Try/catch autour de tous les accès `localStorage` (quota / privacy mode safe)
   - SSR-safe : `typeof window === "undefined"` early return

2. **Créer `components/auto-save-badge.tsx`** (Write tool) selon le squelette, en utilisant le **wording final FR** issu de `ADVISOR-VERDICT.md` (pas la proposition de Tâche 1). Le fichier doit :
   - Commencer par `"use client";`
   - Exporter `AutoSaveBadge({ lastSavedAt: Date | null })`
   - Recompute le label à chaque render via `setInterval(1000)` qui force un re-render léger
   - Render `<p aria-live="polite" className="eic-autosave-badge" role="status">{label}</p>`
   - Aucun chiffre R1 dans le label (uniquement secondes "il y a Ns")

3. **Wire dans `components/submission-form.tsx`** (Edit tool) :
   - Ajouter imports : `import { useAutoSave } from "@/hooks/use-auto-save";` + `import { AutoSaveBadge } from "@/components/auto-save-badge";` + extension import React `useRef`.
   - Ajouter `const formRef = useRef<HTMLFormElement>(null);`
   - Ajouter `const { lastSavedAt, clear } = useAutoSave(formRef, { key: \`eg_draft_${deliverableTemplateId}\` });`
   - Étendre le `useEffect(state.ok)` existant (ligne 28-32) avec `clear();` AVANT `router.refresh();`
   - Ajouter `ref={formRef}` sur le `<form>`.
   - Ajouter `<AutoSaveBadge lastSavedAt={lastSavedAt} />` JUSTE après le `</button>` Soumettre, AVANT le `state.message ?` ternaire.
   - Pas d'autre changement (préserver radio kind, fieldset, structure existante).

4. **Ajouter CSS dans `app/globals.css`** (Edit tool) : append à la fin du fichier (ou regrouper avec les autres `.eic-*` du shell — peu importe, choisir la fin pour atomicité commit) le bloc `.eic-autosave-badge` (font-size 12px, color #64748b, margin 4px 0 0). Pas de keyframes ici (réservées Étape 3.2).

5. **`npm run typecheck`** → doit PASS. Si erreur de typage liée au `RefObject<HTMLFormElement>` ou autre, corriger immédiatement (typage React 19 strict).

6. **Test visuel A1** :
   - `npm run dev` (mode demo, sans env vars Supabase) → ouvrir `http://localhost:3000/login`. Vérifier que la page se charge sans crash. Comme le mode demo de la page deliverable affiche le message demo (pas le form), A1 n'est pas testable en demo — c'est attendu.
   - Si Omar dispose des env vars Supabase localement (`.env.local`) : démarrer avec env vars, ouvrir `/journey/deliverable/<id>` Player, taper du texte dans `proofText` ou `proofUrl`, attendre 8 s, vérifier que la pastille passe de "Pas encore sauvegarde" à "Sauvegarde a l'instant". Recharger la page : le texte est restauré depuis localStorage.
   - Si Omar ne teste pas en local Supabase : documenter dans SUMMARY.md "Test visuel A1 = différé sur preview Vercel post-merge", ne PAS bloquer le commit.

7. **Commit atomique 1** :
   - `git add hooks/use-auto-save.ts components/auto-save-badge.tsx components/submission-form.tsx app/globals.css`
   - Commit message :
     ```
     feat(a1): auto-save 8s + badge footer (T3-IMPROVEMENTS A1)

     - hooks/use-auto-save.ts : interval 8s, localStorage key eg_draft_<id>, hydrate au mount.
     - components/auto-save-badge.tsx : pastille FR (3 états), aria-live polite.
     - components/submission-form.tsx : ref form, useAutoSave, clear localStorage au state.ok.
     - app/globals.css : .eic-autosave-badge style.

     Wording validé par eic-pedagogical-advisor (ADVISOR-VERDICT.md).
     R1/R2/R3 PASS. Aucun changement server action / type / DB.
     ```

### Étape 3.2 — Implémentation A4 (compteur)

1. **Créer `components/field-completion-counter.tsx`** (Write tool) selon le squelette, en utilisant le **wording final FR** issu de `ADVISOR-VERDICT.md`. Le fichier doit :
   - Commencer par `"use client";`
   - Exporter `FieldCompletionCounter({ formRef: RefObject<HTMLFormElement | null> })`
   - `useEffect` qui : sélectionne `input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea,select`, filtre `isVisible` (offsetParent !== null) + `isRequired` (`required` ou `data-required="true"`), compte `filled = el.value.trim().length > 0`.
   - Listener `input` sur le form + `MutationObserver` (childList + subtree + attributes filtrés sur `hidden`, `required`, `data-required`).
   - State `pulseKey` incrémenté quand `filled > prev.filled` (transition vide → rempli).
   - Render `null` si `total === 0`, sinon `<p aria-live="polite" className="eic-field-counter" data-pulse={pulseKey}>{wording}</p>`.

2. **Wire dans `components/submission-form.tsx`** (Edit tool) :
   - Ajouter import : `import { FieldCompletionCounter } from "@/components/field-completion-counter";`
   - Ajouter `<FieldCompletionCounter formRef={formRef} />` JUSTE après le `<input type="hidden" name="deliverableTemplateId" ...>` ligne 39, AVANT le `<fieldset kind>`.
   - Pas d'autre changement.

3. **Ajouter CSS dans `app/globals.css`** (Edit tool) : append le bloc `.eic-field-counter` + `@keyframes eic-check-pop` + `@media (prefers-reduced-motion: reduce)` selon la proposition technique. Le bloc doit être autonome (peut vivre à la suite de `.eic-autosave-badge` ajouté Étape 3.1).

4. **`npm run typecheck`** → doit PASS.

5. **Test visuel A4** :
   - Si Omar test local Supabase : ouvrir `/journey/deliverable/<id>` Player. Vérifier compteur "0/1 champs remplis" au mount. Taper dans `proofText` (ou `proofUrl`) → compteur passe à "1/1 champs remplis" et la coche pop joue. Vider le champ → compteur redescend à "0/1" sans pop (pop UNIQUEMENT en sens vide → rempli).
   - Toggle radio `kind` (proof_url ↔ proof_text) → le total reste 1 (un seul champ requis visible à la fois). Le compteur ne devrait pas montrer de discontinuité bizarre.
   - Vérifier `prefers-reduced-motion: reduce` (DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`) → la coche apparaît sans animation.
   - Si Omar ne teste pas en local Supabase : documenter dans SUMMARY.md "Test visuel A4 = différé sur preview Vercel post-merge".

6. **Commit atomique 2** :
   - `git add components/field-completion-counter.tsx components/submission-form.tsx app/globals.css`
   - Commit message :
     ```
     feat(a4): compteur Y/N champs header form + coche pop (T3-IMPROVEMENTS A4)

     - components/field-completion-counter.tsx : DOM walk required+visible, MutationObserver + input listener, animation coche pop sur transition vide → rempli.
     - components/submission-form.tsx : <FieldCompletionCounter formRef={formRef}> en header form.
     - app/globals.css : .eic-field-counter + keyframe eic-check-pop + prefers-reduced-motion guard.

     Wording validé par eic-pedagogical-advisor (ADVISOR-VERDICT.md).
     R1/R2/R3 PASS. Position adaptée (header form vs sidebar — pas de sidebar dans AppShell variant=player).
     ```

### Étape 3.3 — SUMMARY.md final + commit docs

1. **Écrire `260510-iee-SUMMARY.md`** :

```markdown
# A1 + A4 Outcome

## Contexte
Quick wins T-3 (T3-IMPROVEMENTS.md section A) — pilote AgreenTech 13-14 mai 2026.
A1 = auto-save 8s + pastille footer. A4 = compteur Y/N champs header form.
Gate eic-pedagogical-advisor effectué AVANT tout edit code (ADVISOR-VERDICT.md).

## Commits posés (atomiques)
| # | SHA | Type | Scope | Files |
|---|---|---|---|---|
| 1 | <sha> | feat(a1) | A1 auto-save + badge | hooks/use-auto-save.ts, components/auto-save-badge.tsx, components/submission-form.tsx, app/globals.css |
| 2 | <sha> | feat(a4) | A4 compteur + coche pop | components/field-completion-counter.tsx, components/submission-form.tsx, app/globals.css |
| 3 | <sha> | docs(quick) | SUMMARY | .planning/quick/260510-iee-.../260510-iee-SUMMARY.md |

## Wording final (validé advisor)
- Pastille A1 (3 états) : `<wording null>` / `<wording <2s>` / `<wording ≥2s>`
- Compteur A4 : `<wording total>0>` / null si total=0

## Position UI
- Pastille A1 = footer du `<form>` dans `<SubmissionForm>` (sous bouton Soumettre, avant `state.message`).
- Compteur A4 = header du `<form>` (au-dessus de `<fieldset kind>`).
- Adaptation vs brief T3-IMPROVEMENTS A4 ("sidebar gauche") : `AppShell variant="player"` n'a pas de sidebar gauche → header form retenu (validé advisor).

## Tests visuels effectués
- [ ] Demo mode (`!hasSupabaseEnv()`) : `npm run dev` → `/journey/deliverable/<id>` affiche `t.submission_demo_disabled`, no crash. A1/A4 inertes (= attendu).
- [ ] Supabase local (si applicable) : taper dans proofText, attendre 8s, pastille passe à "Sauvegarde a l'instant". Recharger page → texte restauré.
- [ ] Supabase local (si applicable) : compteur 0/1 → 1/1 avec coche pop, sens vide → rempli uniquement.
- [ ] Toggle radio kind : compteur reste cohérent (1 champ requis visible à la fois).
- [ ] `prefers-reduced-motion: reduce` (DevTools) : coche apparaît sans animation.
- [ ] Tests Supabase différés sur preview Vercel post-merge : <oui / non>.

## Garde-fous respectés
- [x] `npm run typecheck` PASS final (exit 0).
- [x] Aucun edit dans `lib/types.ts`, `app/actions.ts`, `lib/i18n.ts`, `database/`, `utils/supabase/`, `middleware.ts`, `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `components/revision-panel.tsx`.
- [x] Aucun pré-câblage schemas v2 (réservé v0.3 SEED-001).
- [x] Dual-mode préservé : demo mode affiche message demo, A1/A4 ne s'instancient pas en demo.
- [x] R1 PASS : aucun chiffre note/score/rank/percentile dans pastille / compteur / aria / className.
- [x] R2 PASS : aucun blocking validator introduit, bouton Soumettre indépendant du compteur.
- [x] R3 PASS : aucune logique progression mission codée, localStorage isolé par deliverableTemplateId.
- [x] Wording validé par eic-pedagogical-advisor avant code (ADVISOR-VERDICT.md).
- [x] Commits atomiques (1 commit par feature) + 1 docs final.

## Métriques
- Fichiers nouveaux : 3 (`hooks/use-auto-save.ts`, `components/auto-save-badge.tsx`, `components/field-completion-counter.tsx`).
- Fichiers modifiés : 2 (`components/submission-form.tsx`, `app/globals.css`).
- Lignes ajoutées (estimation) : ~150 LoC TS + ~30 LoC CSS.
- Aucun fichier hors scope touché.

## Suivi
- Schemas v2 (validators warn, types pédagogiques 5 variants, hypothese_invalider, hypothese_revisee) → v0.3 SEED-001.
- Wording pourrait migrer dans `lib/i18n.ts:dictionaries.fr` lors d'un sprint i18n consolidation post-pilote.
- Limite localStorage : ~5 MB par origine, partagé entre tous les drafts. Au pilote (1-2 drafts simultanés max par Player), aucun risque de quota. Post-pilote, considérer cleanup périodique des clés `eg_draft_*` âgées.
- Pas testé : édition concurrente même Player sur 2 onglets (localStorage = source de vérité commune, dernier tick gagne — comportement acceptable au pilote).
```

2. **Lancer `npm run typecheck`** une dernière fois pour s'assurer du PASS final, capturer la sortie.

3. **Commit final SUMMARY** :
   - `git add .planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/260510-iee-SUMMARY.md` (et `MAPPING.md`, `ADVISOR-VERDICT.md` s'ils ne sont pas encore commit — orchestrator gère normalement leur commit en aval, vérifier `git status` avant)
   - Commit message : `docs(quick): A1+A4 SUMMARY — 2 feat commits, R1/R2/R3 PASS, advisor-gated`

4. **Vérification finale** :
   - `git log --oneline -5` → doit montrer dans l'ordre : `docs(quick): A1+A4 SUMMARY ...`, `feat(a4): ...`, `feat(a1): ...`, et au-dessus le commit antérieur (audit R1 ou autre).
   - `git status` clean.
   - `git diff <base-sha>..HEAD --stat | grep -E '(jury|results|admin|mentor|lib/types|lib/i18n|app/actions|database/|utils/supabase|middleware|revision-panel)'` → doit être vide (aucun fichier hors scope touché).
  </action>
  <verify>
    <automated>node -e "const fs=require('fs');const ok=p=>fs.existsSync(p)||(console.error('Missing',p),process.exit(1));ok('hooks/use-auto-save.ts');ok('components/auto-save-badge.tsx');ok('components/field-completion-counter.tsx');ok('components/submission-form.tsx');ok('app/globals.css');ok('.planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/260510-iee-SUMMARY.md');const sf=fs.readFileSync('components/submission-form.tsx','utf8');for(const s of ['useAutoSave','AutoSaveBadge','FieldCompletionCounter','formRef']){if(!sf.includes(s)){console.error('submission-form missing:',s);process.exit(2);}}const css=fs.readFileSync('app/globals.css','utf8');for(const s of ['.eic-autosave-badge','.eic-field-counter','eic-check-pop','prefers-reduced-motion']){if(!css.includes(s)){console.error('globals.css missing:',s);process.exit(3);}}console.log('FILES OK');" && npm run typecheck</automated>
  </verify>
  <done>
    - 3 nouveaux fichiers créés : `hooks/use-auto-save.ts`, `components/auto-save-badge.tsx`, `components/field-completion-counter.tsx`.
    - 2 fichiers modifiés : `components/submission-form.tsx` (imports + ref + hook + 2 nouveaux composants wired), `app/globals.css` (3 nouveaux blocs CSS + keyframe + media query).
    - `260510-iee-SUMMARY.md` existe avec sections : `## Commits posés`, `## Wording final`, `## Position UI`, `## Tests visuels`, `## Garde-fous respectés`, `## Métriques`, `## Suivi`.
    - `npm run typecheck` PASS final (exit 0).
    - `git log --oneline -5` montre ≥ 2 commits feat (`feat(a1):`, `feat(a4):`) + 1 commit docs (`docs(quick):`).
    - `git status` clean.
    - Aucun fichier touché sous `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `lib/types.ts`, `lib/i18n.ts`, `app/actions.ts`, `database/`, `utils/supabase/`, `middleware.ts`, `components/revision-panel.tsx` (vérifier via `git diff` filtré).
    - Wording final dans `auto-save-badge.tsx` et `field-completion-counter.tsx` correspond exactement à celui validé dans `ADVISOR-VERDICT.md`.
    - Aucun chiffre R1 (note, score, rank, /100, /140, percentile) n'apparaît dans les 3 nouveaux fichiers (sanity grep final).
  </done>
</task>

</tasks>

<verification>
**Phase-level verification (manuelle, post-Tâche 3) :**

1. `npm run typecheck` — exit 0 (déjà vérifié dans `<verify>` Tâche 3, mais re-runner pour sanity).
2. `npm run lint` — pas de nouveau warning ESLint sur les 3 nouveaux fichiers ni sur `submission-form.tsx`.
3. **Re-grep R1 sanity** sur les 3 nouveaux fichiers + `submission-form.tsx` :
   - `Grep` patterns interdits : `\bscore\b`, `\brank\b`, `\bnote\b`, `/100\b`, `/140\b`, `\bpercentile\b`, `\bpts?\b` (au sens score, pas XP).
   - Doit retourner 0 match (ou uniquement matches dans des chaînes commentaires/types non-rendus, à documenter dans SUMMARY.md).
4. **Smoke visuel local** (recommandé avant pilot) :
   - `npm run dev` (demo mode) → `/login` charge, `/journey` charge, `/journey/deliverable/<id>` affiche message demo, no crash.
   - Si env Supabase dispo : `/journey/deliverable/<id>` authentifié Player → compteur visible header form, pastille visible footer form, taper texte → auto-save tick après 8s, recharger → restore depuis localStorage.
5. **Dual-mode check** : démarrer le serveur sans `NEXT_PUBLIC_SUPABASE_*` (demo) puis avec → Player rendu identique en demo (juste message demo, pas A1/A4 actifs — c'est attendu).
6. **Hors-scope intégrité** : `git diff <base-sha>..HEAD --stat` ne contient AUCUN fichier sous `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `lib/types.ts`, `lib/i18n.ts`, `app/actions.ts`, `database/`, `utils/supabase/`, `middleware.ts`, `components/revision-panel.tsx`.
7. **Granularité commits** : `git log --oneline <base-sha>..HEAD` = 2 commits feat (`feat(a1)`, `feat(a4)`) + 1 commit docs (`docs(quick)`) ; aucun mega-commit groupant A1+A4.
</verification>

<success_criteria>
- [x] MAPPING.md généré sans edit source (Tâche 1) — sections `## AppShell variant=player layout`, `## SubmissionForm`, `## Page deliverable`, `## Proposition technique`, `## Points à trancher par l'advisor`.
- [x] ADVISOR-VERDICT.md généré par l'agent eic-pedagogical-advisor avant tout edit code (Tâche 2 — gate non-bypass) — wording final FR pour pastille (3 états) + compteur (1 état non-null) + position UI confirmée + R1/R2/R3 = PASS.
- [x] Omar a confirmé `approved` au gate Tâche 2.
- [x] 3 nouveaux fichiers créés (`hooks/use-auto-save.ts`, `components/auto-save-badge.tsx`, `components/field-completion-counter.tsx`) avec wording final exact issu d'ADVISOR-VERDICT.md.
- [x] 2 fichiers modifiés (`components/submission-form.tsx`, `app/globals.css`) — imports + ref + hook + composants wired + CSS blocs ajoutés.
- [x] `npm run typecheck` PASS après chaque commit + final.
- [x] ≥ 2 commits atomiques (1 par feature : `feat(a1)`, `feat(a4)`) + 1 commit docs final (`docs(quick)`).
- [x] Aucun fichier hors scope modifié (jury/results/admin/mentor/lib types/lib i18n/app actions/database/utils-supabase/middleware/revision-panel).
- [x] R1 PASS : aucun chiffre note/score/rank/percentile dans nouveaux composants (re-grep sanity).
- [x] R2 PASS : aucun blocking validator introduit, bouton Soumettre 100% indépendant du compteur.
- [x] R3 PASS : localStorage isolé par deliverableTemplateId, aucune logique de progression mission ajoutée.
- [x] Dual-mode préservé : page deliverable en demo mode affiche `t.submission_demo_disabled`, A1/A4 ne s'instancient pas en demo (= attendu).
- [x] Tests visuels effectués (au moins demo mode + smoke local) — documentés dans SUMMARY.md, tests Supabase différés acceptés si infra locale demo only.
- [x] SUMMARY.md final liste : commits posés (table SHA), wording final, position UI, tests visuels effectués, garde-fous respectés, métriques, suivi (limites + reports v0.3).
- [x] Total context usage du quick ≤ ~35% (3 tâches focused, scope client-side UI uniquement, pas de refactor server / DB / type).
</success_criteria>

<output>
3 fichiers Markdown dans `.planning/quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/` :
- `MAPPING.md` (Tâche 1 — read-only input pour advisor)
- `ADVISOR-VERDICT.md` (Tâche 2 — wording + position validés, source de vérité du code Tâche 3)
- `260510-iee-SUMMARY.md` (Tâche 3 — récap final + commits posés + garde-fous)

3 nouveaux fichiers code :
- `hooks/use-auto-save.ts`
- `components/auto-save-badge.tsx`
- `components/field-completion-counter.tsx`

2 fichiers existants modifiés :
- `components/submission-form.tsx` (wire A1 + A4)
- `app/globals.css` (3 nouveaux blocs CSS + keyframe + media query)

≥ 2 commits feat atomiques (`feat(a1):` + `feat(a4):`) + 1 commit docs final (`docs(quick):`) sur la branche courante.

**Aucun changement** : schéma DB, type domaine (`lib/types.ts`), server action (`app/actions.ts`), i18n (`lib/i18n.ts`), middleware, supabase utils, ni fichiers Mentor/Jury/Admin/Results.
</output>
</content>
</invoke>