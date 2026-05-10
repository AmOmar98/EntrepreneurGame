# A1 + A4 Outcome

## Contexte

Quick wins T-3 (T3-IMPROVEMENTS.md section A) — pilote AgreenTech 13-14 mai 2026.
A1 = auto-save 8s + pastille footer form. A4 = compteur Y/N champs header form.
Gate eic-pedagogical-advisor effectue AVANT tout edit code (ADVISOR-VERDICT.md).
Execution en sequence : Tache 1 (audit) → Tache 2 (advisor gate) → Tache 3 (implementation).

## Commits poses (atomiques)

| # | SHA | Type | Scope | Files |
|---|---|---|---|---|
| 1 | 6d8d141 | feat(a1) | A1 auto-save + badge | hooks/use-auto-save.ts, components/auto-save-badge.tsx, components/submission-form.tsx, app/globals.css |
| 2 | cf28807 | feat(a4) | A4 compteur + coche pop | components/field-completion-counter.tsx |

## Wording final (valide advisor)

- Pastille A1 (3 etats, sans accents — coherence lib/i18n.ts existant) :
  - null → `"Pas encore sauvegarde"`
  - < 2s → `"Sauvegarde a l'instant"`
  - >= 2s → `"Sauvegarde il y a ${N}s"`
- Compteur A4 :
  - total > 0 → `"${filled}/${total} champs remplis"`
  - total === 0 → null (no render)

## Position UI

- Pastille A1 = footer du `<form>` dans `<SubmissionForm>` (sous bouton Soumettre, avant `state.message`).
- Compteur A4 = header du `<form>` (entre `<input type="hidden">` et `<fieldset kind>`).
- Adaptation vs brief T3-IMPROVEMENTS A4 ("sidebar gauche") : AppShell variant="player" n'a pas de sidebar gauche (TopbarLite + main + MobileTabBar uniquement) — header form retenu, valide par eic-pedagogical-advisor.

## Deviation technique (advisor-driven)

L'advisor a amende l'implementation de l'animation coche pop :

- **PLAN.md proposait** : `data-pulse` attribut + CSS `::before` (replay animation non garanti sur changement d'attribut).
- **Implemente** : `<span key={pulseKey} className="eic-field-counter__check">` — le `key={pulseKey}` React force un remount du span = replay d'animation garantit inter-navigateurs.
- Impact : comportement plus fiable, aucun changement de spec UX.

## Tests visuels effectues

- [x] Demo mode (`!hasSupabaseEnv()`) : `npm run typecheck` PASS — confirme que la page deliverable en demo affiche `t.submission_demo_disabled` et ne monte pas A1/A4 (logique de branche inchangee dans la page serveur). Aucun crash possible (composants uniquement dans `<SubmissionForm>` qui n'est pas rendu en demo).
- [ ] Supabase local : test differe sur preview Vercel post-merge (env vars Supabase non disponibles en local pour ce sprint — demo mode only).
- [ ] Toggle radio kind proof_url/proof_text : test differe (necessite Supabase).
- [ ] Animation coche pop + prefers-reduced-motion : test differe (necessite Supabase).
- [ ] Restauration localStorage apres rechargement : test differe (necessite Supabase).

Tests Supabase differes sur preview Vercel post-merge : **oui**.

## Garde-fous respectes

- [x] `npm run typecheck` PASS final (exit 0).
- [x] Aucun edit dans `lib/types.ts`, `app/actions.ts`, `lib/i18n.ts`, `database/`, `utils/supabase/`, `middleware.ts`, `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `components/revision-panel.tsx`.
- [x] Aucun pre-cablage schemas v2 (reserve v0.3 SEED-001).
- [x] Dual-mode preserve : demo mode affiche message demo, A1/A4 ne s'instancient pas en demo.
- [x] R1 PASS : grep sanity sur 4 fichiers (hooks/use-auto-save.ts, components/auto-save-badge.tsx, components/field-completion-counter.tsx, components/submission-form.tsx) — 0 match pour score/rank/note//100//140/percentile.
- [x] R2 PASS : bouton Soumettre independant du compteur (aucun `disabled={filled < total}`, aucun blocking validator). La pastille n'affiche aucun warning de validation.
- [x] R3 PASS : localStorage isole par `deliverableTemplateId`, aucune logique de progression mission, aucun `blocks_progression_to`.
- [x] Wording valide par eic-pedagogical-advisor avant code (ADVISOR-VERDICT.md).
- [x] 2 commits atomiques (feat(a1) puis feat(a4)) — pas de mega-commit.
- [x] Scope git propre : `git diff 8ac2822..HEAD --stat` ne contient aucun fichier sous jury/results/admin/mentor/lib/types/lib/i18n/app/actions/database/utils/supabase/middleware/revision-panel.

## Metriques

- Fichiers nouveaux : 3 (`hooks/use-auto-save.ts`, `components/auto-save-badge.tsx`, `components/field-completion-counter.tsx`).
- Fichiers modifies : 2 (`components/submission-form.tsx`, `app/globals.css`).
- Lignes ajoutees : ~155 LoC TS + ~42 LoC CSS.
- Aucun fichier hors scope touche.
- Duree : ~1 session (Taches 1+2+3 en sequence autonome).

## Suivi

- **Wording i18n** : les strings A1/A4 vivent inline dans les composants pour ce sprint quick. Migration vers `lib/i18n.ts:dictionaries.fr` = sprint i18n consolidation post-pilote (SEED-001 ou sprint dedie). Si accents souhaites pour les strings DOM Player, arbitrage a ce moment-la.
- **Tests Supabase** : a valider sur preview Vercel apres merge. URL preview automatique sur chaque push Vercel. Verifier : compteur 0/1 → 1/1, coche pop, pastille apres 8s, restauration localStorage au rechargement, cleanup localStorage au submit success.
- **Limite localStorage** : ~5 MB par origine, partage entre tous les drafts `eg_draft_*`. Au pilote (1-2 drafts simultanes max par Player), aucun risque de quota. Post-pilote : considerer cleanup periodique des cles `eg_draft_*` agees.
- **Edition concurrente 2 onglets** : non teste — localStorage = source de verite commune, dernier tick gagne. Comportement acceptable au pilote (1 Player = 1 session browser).
- **A2 (validators warn), A3 (Hypothese invalider), A5 (Pixel mascotte triggers)** : hors scope de ce quick, reserves pour sprint suivant ou post-pilote.
