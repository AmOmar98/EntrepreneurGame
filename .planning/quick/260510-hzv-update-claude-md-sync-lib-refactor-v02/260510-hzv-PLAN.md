---
quick_id: 260510-hzv
type: execute
wave: 1
depends_on: []
files_modified:
  - CLAUDE.md
  - .planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/MAPPING.md
  - .planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/SUMMARY.md
autonomous: true
requirements:
  - QCK-260510-hzv: "Synchroniser CLAUDE.md avec la structure réelle de lib/ post-refactor v0.2 (remplacer toutes les références au fichier disparu lib/data.ts par les modules réels, ou retirer celles dont le helper a disparu)."

must_haves:
  truths:
    - "CLAUDE.md ne contient plus aucune référence textuelle au chemin `lib/data.ts` (sauf s'il a été légitimement recréé sous ce nom dans le repo)."
    - "Chaque domain type/helper encore listé dans CLAUDE.md (Stage, Checkpoint, MaturityPhase, DeliverableStatus, BonusStatus, BonusType, AppRole, TeamRole, Profile, Startup, Deliverable, BonusEvent, mailtoUrl, deliverableMailBody, calculateBonusClaim, bonusRules, journeyPhases, navItems, dashboardMetrics, xpSummary, committeeDossierRows) pointe vers un fichier qui existe réellement dans `lib/`, ou bien a été retiré si le helper n'existe plus."
    - "Les sections figées `## Project`, `### Constraints`, `## Developer Profile` ne sont pas modifiées (contenu et balises GSD intactes)."
    - "Le ton FR + ASCII existant et les mentions opérationnelles (`docs/DEPLOY.md`, `vercel.json`, `database/seed_bootcamp.sql`, URLs Vercel) restent inchangées sauf si elles étaient elles-mêmes erronées."
    - "Un commit atomique `docs(claude-md): sync lib/ refactor — replace stale lib/data.ts refs` consigne CLAUDE.md (et MAPPING.md / SUMMARY.md si suivis)."
  artifacts:
    - path: ".planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/MAPPING.md"
      provides: "Table d'audit reliant chaque occurrence textuelle de `lib/data.ts` (avec n° de ligne CLAUDE.md) ET chaque symbole référencé (Stage, mailtoUrl, …) à sa localisation réelle dans `lib/` (ou à la décision REMOVE si le symbole a disparu)."
      contains: "lib/data.ts"
    - path: "CLAUDE.md"
      provides: "Documentation projet à jour, alignée avec la structure `lib/` post v0.2 (~30 modules)."
      contains: "Architecture"
    - path: ".planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/SUMMARY.md"
      provides: "Récapitulatif quick task : nombre d'occurrences remappées, nombre retirées, hash du commit, liste des sections CLAUDE.md touchées."
      contains: "## Summary"
  key_links:
    - from: "CLAUDE.md"
      to: "lib/ (structure réelle)"
      via: "réécriture des chemins de fichiers et listes de symboles"
      pattern: "lib/(types|score|journey|jury|results|mentor|admin|i18n|csv|supabase-status|workflow-data)"
    - from: ".planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/MAPPING.md"
      to: "CLAUDE.md edits"
      via: "Chaque ligne du mapping correspond à un edit (ou suppression) appliqué dans la tâche 2."
      pattern: "REMAP|REMOVE"
---

<objective>
Mettre à jour `CLAUDE.md` pour refléter la structure réelle de `lib/` après le refactor v0.2 — supprimer les références obsolètes au fichier `lib/data.ts` (qui n'existe plus) et les remplacer par les bons chemins (ou les retirer si le helper a été supprimé).

Purpose: La documentation projet sert d'amorce de contexte à chaque nouvelle session Claude Code. Tant que `CLAUDE.md` pointe vers un fichier disparu, chaque session démarre avec une carte mentale fausse — risque réel sur un sprint pré-pilote (T-3 jours).

Output:
- `MAPPING.md` (audit traçable des changements)
- `CLAUDE.md` patché (atomique, ton + sections figées préservés)
- `SUMMARY.md` (récap quick task)
- 1 commit `docs(claude-md): sync lib/ refactor — replace stale lib/data.ts refs`
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@.planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/

<!-- Notes opérationnelles pour l'exécutant -->

<background>
- v0.1 (Phases 1-5) avait centralisé domain types + seed + helpers dans un seul `lib/data.ts` (~1285 lignes).
- v0.2 (Phases 6-9) a refactoré ce monolithe en ~30 modules ciblés sous `lib/` (admin*, journey, journey-progression, jury, mentor, results, score, hack-status, announcements, link-type, types probable, etc.). Le fichier `lib/data.ts` n'existe plus.
- Le quick task précédent (260510-heu) a noté le décalage côté audit R1 : `lib/data.ts` "ne s'applique pas" et `lib/types.ts`, `lib/score.ts` ont été flaggés comme localisations probables. C'est un signal, pas une vérité — l'audit complet de cette tâche le confirmera.
- CLAUDE.md contient des sections générées (balises HTML `<!-- GSD:...start/end -->`) issues de `codebase/STACK.md`, `CONVENTIONS.md`, `ARCHITECTURE.md`, `PROJECT.md`. On modifie ici uniquement le contenu textuel des sections concernées par `lib/data.ts`, sans toucher aux balises ni aux sections figées.
</background>

<sections_off_limits>
NE PAS éditer (préserver intégralement, balises GSD comprises) :
- `## Project` (lignes ~63-82)
- `### Constraints` (sous-section interne à Project)
- `## Developer Profile` (lignes ~333-338)
- `## GSD Workflow Enforcement` (lignes ~320-331)

Préserver aussi ton ASCII (pas d'accents nouveaux dans les payloads code), structure Markdown, ordre des sections, balises `<!-- GSD:* -->`.
</sections_off_limits>

<known_occurrences_to_audit>
Grep initial textuel "lib/data.ts" sur CLAUDE.md (référence — l'exécutant doit re-vérifier avec grep frais en tâche 1) :
- L22 : seed in `lib/data.ts`
- L25 : `lib/data.ts` must be reflected in the SQL schema
- L27 : single source of truth: `lib/data.ts`
- L144 : single-word libs ... `lib/data.ts`
- L155 : `import { type AppRole } from "@/lib/data"`
- L187 : Mirror domain enums from `lib/data.ts`
- L192 : helpers from `lib/data.ts`
- L220 : `lib/data.ts` — domain types, enums, seed data, helpers
- L236 : pages ... import data directly from `lib/data.ts`
- L238 : in-memory seed in `lib/data.ts`
- L240 : co-located in `lib/data.ts` (single source of truth)
- L248 : domain helpers from `lib/data.ts`
- L259-260 : Location: `lib/data.ts` (~1285 lignes) ... Contains: ...
- L266 : pull rows from `lib/data.ts` helpers
- L281 : TS source: `lib/data.ts`
- L285 : Location: `lib/data.ts` (`bonusRules`, `calculateBonusClaim`)
- L288 : Location: `lib/data.ts` (`mailtoUrl`, `deliverableMailBody`, `reviewReminderBody`)

Cette liste est indicative — tâche 1 doit produire le grep frais et faire foi.
</known_occurrences_to_audit>

<symbols_to_relocate>
Pour chaque symbole, l'audit doit produire SOIT (file + line) SOIT REMOVE :

Domain types / enums :
- `Stage`, `Checkpoint`, `MaturityPhase`, `DeliverableStatus`, `BonusStatus`, `BonusType`
- `AppRole`, `TeamRole`
- `Startup`, `Deliverable`, `BonusEvent`, `Profile`

Helpers :
- `mailtoUrl`, `deliverableMailBody`, `reviewReminderBody`
- `calculateBonusClaim`, `bonusRules`

Constants / aggregates :
- `journeyPhases`, `navItems`
- `dashboardMetrics`, `xpSummary`
- `committeeDossierRows`

Hint v0.2 (à confirmer) : `Stage` ressemble probablement à `level` (L0-L7) — peut-être renommé `Level` dans `lib/types.ts`. `committeeDossierRows` est probablement supprimé (Phase 4 avait retiré le flow committee). `navItems` peut vivre dans `lib/nav.ts` ou `components/app-shell.tsx`.
</symbols_to_relocate>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit double — CLAUDE.md occurrences + lib/ structure réelle → MAPPING.md</name>
  <files>.planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/MAPPING.md</files>
  <action>
Produire `MAPPING.md` avec **deux tables** + **plan d'action** :

**Étape 1.A — Inventaire CLAUDE.md** :
Exécuter `grep -n "lib/data" CLAUDE.md` (ou via outil Grep) et capturer chaque occurrence (numéro de ligne + extrait ~80 chars). Cible attendue : ~17 occurrences (cf. liste indicative dans `<known_occurrences_to_audit>`). Si écart, c'est l'audit qui fait foi.

**Étape 1.B — Inventaire lib/ réel** :
- `ls lib/` (liste plate, alphabétique). Coller le résultat brut dans MAPPING.md.
- Pour chaque symbole listé dans `<symbols_to_relocate>` : `grep -rn "export.*<symbole>" lib/` (variantes : `export const <symbole>`, `export function <symbole>`, `export type <symbole>`, `export interface <symbole>`, `export enum <symbole>`).
- Si un symbole n'apparaît nulle part dans `lib/`, étendre la recherche : `grep -rn "export.*<symbole>" components/ app/ utils/`. Si toujours rien → marquer REMOVE (helper retiré pendant v0.2).
- Pour `Stage` : tester aussi `Level` (renommage probable v0.2).

**Étape 1.C — Décision par occurrence** :
Pour chaque occurrence CLAUDE.md (Étape 1.A), produire une ligne dans le tableau de remap :

| CLAUDE.md L# | Extrait actuel | Décision | Nouveau texte (ou REMOVE) | Source (file:line) |
|---|---|---|---|---|
| L22 | `seed in lib/data.ts` | REMAP | `seed in lib/<remplaçant>` | lib/<remplaçant>:<line> |
| ... | ... | REMAP\|REMOVE\|REPHRASE | ... | ... |

Notes décision :
- **REMAP** : le symbole/concept existe encore mais a déménagé → réécrire la phrase avec le bon chemin.
- **REMOVE** : le concept (helper, aggregate) a été retiré pendant v0.2 → supprimer la phrase ou la sous-puce, en reformulant le contexte si besoin pour garder la grammaire propre.
- **REPHRASE** : le sens reste correct mais nécessite un remaniement (par ex. "single source of truth: lib/data.ts" devient "domain types co-located across lib/types.ts and lib/<x>.ts").

Pour les sections multi-symboles (ex. L260 "Contains: Stage, Checkpoint, ..., committeeDossierRows"), produire UNE entrée groupée résumant comment réécrire la liste (chaque symbole avec son nouveau home, ou une sous-table par modules).

**Étape 1.D — Plan d'action** :
À la fin de MAPPING.md, ajouter une section `## Edit Plan` qui ordonne les edits CLAUDE.md de la dernière à la première ligne (pour éviter les décalages d'offset lors de l'application séquentielle), avec une note explicite quand plusieurs lignes adjacentes seront réécrites en bloc.

Exigences de forme MAPPING.md :
- Frontmatter YAML minimal (`quick_id: 260510-hzv`, `task: 1`, `produced: <ISO date>`)
- Sections : `## Inventaire CLAUDE.md`, `## Inventaire lib/`, `## Symbol locations`, `## Remap table`, `## Edit Plan`
- ASCII pur (cohérent avec le ton CLAUDE.md actuel)
  </action>
  <verify>
    <automated>grep -c "lib/data" CLAUDE.md (note le count actuel pour comparer après tâche 2) ET test -s .planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/MAPPING.md ET grep -q "## Remap table" .planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/MAPPING.md ET grep -q "## Edit Plan" .planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/MAPPING.md</automated>
  </verify>
  <done>
- MAPPING.md existe, non vide, contient les 5 sections requises.
- Toutes les occurrences textuelles de `lib/data.ts` dans CLAUDE.md (résultat du grep frais) figurent dans la Remap table avec une décision claire (REMAP / REMOVE / REPHRASE) et une source vérifiable (file:line) ou la note REMOVED.
- Pour chaque symbole de `<symbols_to_relocate>`, une ligne existe dans `## Symbol locations` avec soit (file:line) soit `REMOVED` + courte justification (ex. "no export found in lib/, components/, app/, utils/ — feature retirée Phase 4 admin refactor").
- `## Edit Plan` ordonne les edits par ligne décroissante.
  </done>
</task>

<task type="auto">
  <name>Task 2: Apply edits CLAUDE.md depuis MAPPING.md + SUMMARY.md + commit atomique</name>
  <files>CLAUDE.md, .planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/SUMMARY.md</files>
  <action>
Appliquer le plan d'edits issu de `MAPPING.md`, écrire `SUMMARY.md`, puis commiter atomiquement.

**Étape 2.A — Préchecks (obligatoires)** :
- `cat CLAUDE.md | head -1` doit rendre `# CLAUDE.md` (intégrité de départ).
- Re-lister les balises GSD attendues (présentes dans CLAUDE.md) et noter leurs lignes :
  `<!-- GSD:project-start -->`, `<!-- GSD:project-end -->`,
  `<!-- GSD:stack-start -->`, `<!-- GSD:stack-end -->`,
  `<!-- GSD:conventions-start -->`, `<!-- GSD:conventions-end -->`,
  `<!-- GSD:architecture-start -->`, `<!-- GSD:architecture-end -->`,
  `<!-- GSD:skills-start -->`, `<!-- GSD:skills-end -->`,
  `<!-- GSD:workflow-start -->`, `<!-- GSD:workflow-end -->`,
  `<!-- GSD:profile-start -->`, `<!-- GSD:profile-end -->`.
  Aucune de ces balises ne doit être déplacée ni supprimée.

**Étape 2.B — Application** :
Suivre l'`## Edit Plan` de MAPPING.md du bas vers le haut (ligne décroissante), en utilisant l'outil **Edit** (pas Write — préservation maximale). Pour chaque entrée :
- Lire la ligne ciblée (Read avec offset/limit pour confirmer l'extrait courant).
- Appliquer l'edit : remplacer le chemin `lib/data.ts` par le bon module, ou retirer la phrase / sous-puce si décision = REMOVE.
- Ne JAMAIS toucher aux sections off-limits (`## Project`, `### Constraints` interne, `## Developer Profile`, `## GSD Workflow Enforcement`).
- Conserver le ton ASCII (pas de nouveaux accents introduits).

Cas particuliers à traiter :
- L25 ("type/shape changes in `lib/data.ts` must be reflected in the SQL schema") → REPHRASE pour pointer vers les modules lib/ qui contiennent les types côté TS, OU vers le module type unique (`lib/types.ts` si confirmé Tâche 1).
- L27 (titre `### Domain types (single source of truth: lib/data.ts)`) → réécrire l'ancre du titre proprement (ex. `### Domain types (lib/types.ts + helpers répartis)`) pour éviter une ancre Markdown cassée.
- L155 (`import { type AppRole } from "@/lib/data"`) → mettre à jour avec l'import réel (ex. `import { type AppRole } from "@/lib/types"`).
- L187 (`Mirror domain enums from lib/data.ts literally in z.enum([...])`) → réécrire vers le nouveau module source des enums.
- L259-L260 (bloc "Location:" + "Contains:" 1285 lignes) → réécrire en listant les ~30 modules réels (ou en groupant : "domain layer split across `lib/types.ts`, `lib/score.ts`, `lib/journey.ts`, ...") et en supprimant les helpers qui n'existent plus (REMOVE-marked dans MAPPING).
- Référence `~1285 lignes` → supprimer (chiffre obsolète).

**Étape 2.C — Vérifications post-édition** (avant commit) :
- `grep -c "lib/data" CLAUDE.md` doit rendre `0` (sauf si une occurrence représente intentionnellement le fichier historique dans une note de migration — improbable, à éviter).
- `grep -c "<!-- GSD:" CLAUDE.md` doit rendre exactement 14 (7 pairs start/end).
- `npm run lint` n'est PAS exigé (doc-only). Aucun typecheck.
- Diff visuel : `git diff CLAUDE.md` ne doit toucher AUCUNE ligne dans les sections off-limits (vérifier en filtrant le diff sur les balises off-limits — si une ligne entre `<!-- GSD:project-start -->` et `<!-- GSD:project-end -->` est modifiée, ROLLBACK + redresser).

**Étape 2.D — SUMMARY.md** :
Écrire `SUMMARY.md` avec :
- Frontmatter (`quick_id: 260510-hzv`, `completed: <ISO>`, `commit: <sha — placeholder, à remplir post-commit>`).
- `## Summary` : 2-3 phrases (FR) qui résument le décalage corrigé + l'impact (Claude Code repart de bonnes refs).
- `## Stats` : nombre d'occurrences `lib/data.ts` avant/après (avant ≈ 17, après = 0), nombre de symboles REMAP, nombre REMOVE.
- `## Sections touchées dans CLAUDE.md` : liste des H2/H3 modifiés (ex. `### Data layer dual-mode`, `### Domain types`, `## Conventions > Naming Patterns`, `## Architecture > Pattern Overview`, `## Architecture > Layers`, `## Architecture > Key Abstractions`).
- `## Sections préservées` : confirmation explicite que `## Project`, `### Constraints`, `## Developer Profile`, `## GSD Workflow Enforcement` n'ont pas bougé.
- `## Follow-ups` : note "Si le codebase map sous `.planning/codebase/` (ARCHITECTURE.md, CONVENTIONS.md, STACK.md) contient encore les mêmes refs `lib/data.ts`, prévoir un quick task séparé pour les régénérer (cf. balises `source:codebase/*` dans CLAUDE.md)."

**Étape 2.E — Commit atomique** :
- `git add CLAUDE.md .planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/MAPPING.md .planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/SUMMARY.md`
- Commit message exact :
  ```
  docs(claude-md): sync lib/ refactor — replace stale lib/data.ts refs

  - Audit dual : grep CLAUDE.md + cartographie lib/ post v0.2
  - Remap N occurrences vers les modules réels (~30 fichiers lib/)
  - Retire les helpers/aggregates supprimés pendant v0.2 (committeeDossierRows, …)
  - Sections figées intactes : Project, Constraints, Developer Profile, GSD Workflow

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- Mettre à jour SUMMARY.md frontmatter `commit:` avec le sha rendu (puis `git add` + `git commit --amend --no-edit` UNIQUEMENT si MAPPING.md/SUMMARY.md sont commités dans le même atomique — sinon laisser le placeholder et noter dans SUMMARY).

Note : ne PAS push (laisser à Omar).
  </action>
  <verify>
    <automated>grep -c "lib/data" CLAUDE.md | grep -q "^0$" ET grep -c "<!-- GSD:" CLAUDE.md | grep -q "^14$" ET head -1 CLAUDE.md | grep -q "^# CLAUDE.md$" ET test -s .planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/SUMMARY.md ET git log -1 --format=%s | grep -q "docs(claude-md): sync lib/ refactor"</automated>
  </verify>
  <done>
- `CLAUDE.md` ne contient plus aucune occurrence textuelle de `lib/data.ts` (`grep -c lib/data` → 0).
- Les 14 balises GSD (7 pairs) sont toutes intactes.
- Sections off-limits (`## Project`, `### Constraints`, `## Developer Profile`, `## GSD Workflow Enforcement`) sont byte-identiques au pré-édit (vérifié via `git diff` filtré).
- `SUMMARY.md` existe, contient stats avant/après et liste sections touchées + sections préservées.
- 1 commit atomique posé avec le message exact `docs(claude-md): sync lib/ refactor — replace stale lib/data.ts refs` (vérifiable via `git log -1`).
- Aucun push effectué.
  </done>
</task>

</tasks>

<verification>
**Verifications globales (post-tâches)** :

1. `grep -n "lib/data" CLAUDE.md` → vide (0 ligne).
2. Pour 5 symboles tirés au sort dans `<symbols_to_relocate>` (ex. `Stage`, `mailtoUrl`, `bonusRules`, `journeyPhases`, `Profile`) :
   - Lire la nouvelle référence dans CLAUDE.md.
   - `grep -rn "export.*<symbole>" lib/ components/ app/ utils/` doit pointer vers exactement le même fichier (sauf si décision = REMOVE, auquel cas le symbole ne doit plus apparaître dans CLAUDE.md).
3. Diff humain rapide sur sections off-limits : `git diff CLAUDE.md` ne montre rien entre balises `GSD:project-*`, sous `### Constraints`, ou entre balises `GSD:profile-*` / `GSD:workflow-*`.
4. `git log -1 --stat` montre seulement CLAUDE.md + MAPPING.md + SUMMARY.md modifiés, aucun fichier source touché.
5. `npm run lint` reste vert (smoke check non-régression — doc only mais bonne hygiène). Si lint était déjà rouge avant, tolérer mais le mentionner dans SUMMARY.
</verification>

<success_criteria>
- CLAUDE.md décrit fidèlement la structure `lib/` v0.2 (chaque module mentionné existe, chaque symbole listé est exporté à l'endroit indiqué).
- Aucune référence morte à `lib/data.ts` ne subsiste.
- Les sections figées (Project / Constraints / Developer Profile / GSD Workflow) sont byte-identiques.
- MAPPING.md fournit la traçabilité complète (audit reproductible).
- SUMMARY.md résume l'opération avec stats avant/après.
- 1 commit atomique avec le message standard, pas de push.
- Une nouvelle session Claude Code qui charge CLAUDE.md ne sera plus dirigée vers `@/lib/data`.
</success_criteria>

<output>
After completion, the quick task directory `.planning/quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/` contient :
- `260510-hzv-PLAN.md` (ce fichier)
- `MAPPING.md` (audit + plan d'edits, produit Tâche 1)
- `SUMMARY.md` (récap, produit Tâche 2)

Le commit atomique référence ces 3 artefacts + CLAUDE.md.

Pas de mise à jour STATE.md exigée (quick task — la table `Quick Tasks Completed` sera étendue par le orchestrateur `/gsd-quick` ou par Omar manuellement, selon la convention déjà appliquée pour 260510-heu).
</output>
