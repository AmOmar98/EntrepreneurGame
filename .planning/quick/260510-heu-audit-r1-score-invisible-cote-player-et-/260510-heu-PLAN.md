---
quick_id: 260510-heu
type: quick
description: Audit R1 (score invisible côté Player) + patches.
autonomous: false
files_modified: []  # populated in Task 3 after advisor gate confirms violations
must_haves:
  truths:
    - "Aucune chaîne textuelle de la liste interdite (`score`, `rank`, `note`, `/100`, `/140`, `percentile`, \"vous êtes #N\") n'apparaît dans une UI rendue côté Player"
    - "Les usages légitimes (`xp`, `progression`, `X/N champs remplis`, `points` au sens XP, `Cohort Pulse Bar`, stamp `SOUMIS`) sont conservés intacts"
    - "Les zones légitimement chiffrées (`/jury`, `/results`, `/admin`, `/mentor`, route handlers d'export CSV, `lib/data.ts` logique métier) ne sont PAS modifiées"
    - "Le gate `eic-pedagogical-advisor` a tranché chaque violation candidate avec verdict (confirmer / faux positif) + patch minimale (file:line) avant tout edit"
    - "`npm run typecheck` passe après chaque patch et le dual-mode (demo + Supabase) reste fonctionnel"
  artifacts:
    - path: ".planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/AUDIT.md"
      provides: "Liste brute des violations candidates (file:line:snippet) issue de Tâche 1, classée par zone Player vs zone autorisée"
      contains: "## Player Zone (à patcher)"
    - path: ".planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/ADVISOR-VERDICT.md"
      provides: "Verdict de l'advisor par violation candidate : confirmé / faux positif / laisser-tel-quel-documenté + patch minimale proposée"
      contains: "## Verdicts"
    - path: ".planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/SUMMARY.md"
      provides: "Récap final : fichiers patchés, faux positifs documentés, cas non patchés (ex: chaîne nécessaire mais non visible Player), commits posés"
      contains: "## R1 Audit Outcome"
  key_links:
    - from: "Tâche 1 (audit grep brut)"
      to: "Tâche 2 (gate advisor)"
      via: "AUDIT.md consommé en input par l'advisor"
      pattern: "AUDIT\\.md"
    - from: "Tâche 2 (gate advisor)"
      to: "Tâche 3 (patches + commits)"
      via: "ADVISOR-VERDICT.md = autorisation d'écrire — aucun edit avant ce fichier"
      pattern: "ADVISOR-VERDICT\\.md"
---

<objective>
Auditer la base de code pour la règle cardinale **R1** du pilote AgreenTech 13-14 mai 2026 : **aucun score / rank / note / chiffre comparatif visible côté Player**. Le score reste légitimement visible côté `/jury`, `/results` (vue qualitative), `/admin`, `/mentor`, et dans la logique métier `lib/data.ts` — ces zones NE SONT PAS dans le scope.

L'audit produit une liste brute de violations candidates (Tâche 1), passe **obligatoirement** par le gate `eic-pedagogical-advisor` qui filtre faux positifs et propose des patches minimales (Tâche 2), puis applique uniquement les patches confirmés avec `typecheck` après chaque edit (Tâche 3).

Purpose: Tenir R1 — règle non-négociable pilote. Faux positifs attendus (XP, progression, X/N champs, points-au-sens-XP) doivent être préservés intacts. Aucune modification de la logique scoring (`lib/data.ts` deliverable_templates, calculs XP, formules pondération 20/80) — ce sprint = UI Player only.

Output: 3 fichiers Markdown (AUDIT.md, ADVISOR-VERDICT.md, SUMMARY.md) + N commits atomiques (1 par patch confirmé) + `git status` clean au final.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@./T3-IMPROVEMENTS.md
@./EIC-MANAGER-ANSWERS-AGREENTECH.md
@.claude/agents/eic-pedagogical-advisor.md

<r1_rules>
**Mots / motifs INTERDITS dans toute UI rendue côté Player** :
- `score` (en tant que mot anglais affiché : labels, tooltips, copy, aria-label, alt)
- `rank` / `rang` / `classement` / `#N` / `vous êtes #`
- `note` / `noté` / `notation` (au sens grade)
- `/100` / `/140` / `/120` / `/20` / `/5` (fractions de scoring quand affichées)
- `percentile` / `top X%`
- chiffres comparatifs nominatifs ("équipe X 78pts vs vous 65pts")

**Mots / motifs AUTORISÉS** (faux positifs attendus — NE PAS patcher) :
- `XP` / `xp` (gamification non-comparative)
- `progression` / `progresse` / `avance` (lexique parcours)
- `X/N champs remplis` / `X/N livrables soumis` (compteurs perso ou Cohort Pulse anonymisé)
- `points` *au sens XP gamification* (ex : "+50 XP" peut s'écrire "+50 points" si contexte XP)
- `7/11 équipes ont soumis L2.1` (Cohort Pulse Bar — anonyme, non-nominatif)
- `SOUMIS` / `BROUILLON` / `EN ATTENTE` (stamps statut)
- niveau / level `L0..L7` (progression parcours)
- `score` à l'intérieur de strings techniques NON visibles (ex : nom de variable TypeScript, clé d'objet `score_project`, identifiant CSS class préfixée `score-` qui n'apparaît jamais en UI)

**Zones Player visibles à auditer** (scope actif) :
- `app/journey/page.tsx` + `app/journey/deliverable/[id]/`
- `app/onboarding/`
- `app/page.tsx` *uniquement la branche role=founder* (cockpit peut servir plusieurs rôles)
- `app/login/page.tsx` + `components/login-form.tsx`
- `app/player/[slug]/`
- Composants Player utilisés dans ces routes (à dériver via grep d'import) : `components/journey-*.tsx`, `components/onboarding-*.tsx`, `components/submission-form.tsx`, `components/submission-ticket.tsx`, `components/submission-readonly.tsx`, `components/submission-feedback-card.tsx`, `components/revision-panel.tsx`, `components/player-announcement-strip.tsx`, `components/topbar-lite.tsx`, `components/mobile-tab-bar.tsx`, `components/app-shell.tsx` (variant=player branch only), `components/partner-banner.tsx`, `components/pixel-mascot.tsx` (peut être Player ET admin — vérifier props/branche).

**Zones HORS SCOPE** (NE PAS toucher, même si grep matche) :
- `app/jury/`, `app/results/` (page jury + résultats — score visible légitime)
- `app/admin/` *toute la sous-arbre* (GameMaster — score pleinement visible)
- `app/mentor/` *toute la sous-arbre* (mentor voit scores bruts)
- Tout `route.ts` d'export CSV (admin only)
- `lib/data.ts` (logique XP/score métier — types, calculs, deliverable_templates)
- `lib/workflow-data.ts`, `lib/csv.ts`, `lib/i18n.ts` *sauf si une clé i18n consommée par UI Player viole R1*
- `database/*.sql` (DDL + RLS — pas d'UI)
- `components/admin-*.tsx`, `components/mentor-*.tsx`, `components/jury-*.tsx`, `components/results-*.tsx`, `components/evaluation-form.tsx`, `components/csv-import-form.tsx`
</r1_rules>

<known_codebase_facts>
- Composants suggérés par l'opérateur (`proof-workflow.tsx`, `project-card.tsx`, `mission-footer.tsx`, `guided-input-area.tsx`) **n'existent pas** dans `components/` au 2026-05-10. Adapter à l'arborescence réelle ci-dessus. Dossier `app/mission/` n'existe pas non plus.
- Le composant Player principal pour soumission = `components/submission-form.tsx` (et non `proof-workflow.tsx`). Card mission = `components/journey-deliverable-card.tsx`.
- `app/page.tsx` est le cockpit racine ; selon `lib/supabase-status.ts:hasSupabaseEnv()` il peut afficher rôles différents — auditer en supposant rôle Player et vérifier branche conditionnelle.
- `pixel-mascot.tsx` existe et est mentionné dans `T3-IMPROVEMENTS.md` A5 — il peut être affiché côté admin (live mode) ET Player ; auditer ses strings affichées en mode Player.
- `app-shell.tsx` a un prop `variant` ("player" | "staff") — l'audit doit considérer la branche `variant=player` uniquement.
</known_codebase_facts>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit grep + dérivation composants Player → AUDIT.md</name>
  <files>.planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/AUDIT.md</files>
  <action>
Produire un audit brut sans modifier aucun fichier source. Étapes :

1. **Grep pattern interdits** sur le scope Player. Utiliser le tool Grep (ripgrep) avec `output_mode: "content"`, `-n: true`, `-i: true`, `-C: 1`. Lancer un grep par pattern, en restreignant via `path` au scope actif :
   - Patterns à chercher : `\bscore\b`, `\brank\b`, `\bnote(?:r|s|d|z)?\b`, `\bclassement\b`, `\bpercentile\b`, `/100\b`, `/140\b`, `/120\b`, `\bvous\s+êtes\s+#`, `#\d+\s+sur\s+\d+`, `\bpts?\b` (pts hors contexte XP — à filtrer manuellement).
   - Scope (paths) à grepper :
     - `app/journey/`
     - `app/onboarding/`
     - `app/page.tsx`
     - `app/login/`
     - `app/player/`
     - `components/journey-*.tsx`, `components/onboarding-*.tsx`, `components/submission-*.tsx`, `components/revision-panel.tsx`, `components/player-announcement-strip.tsx`, `components/topbar-lite.tsx`, `components/mobile-tab-bar.tsx`, `components/app-shell.tsx`, `components/partner-banner.tsx`, `components/pixel-mascot.tsx`, `components/login-form.tsx`
2. **Grep contre-patterns autorisés** (pour aider à filtrer ensuite les faux positifs) — ne fait pas partie de la liste de violations, juste capturer pour contexte :
   - `\bxp\b`, `\bprogression\b`, `\d+/\d+\s+(?:champs|livrables|équipes)`, `Cohort Pulse`, `SOUMIS`, `BROUILLON`.
3. **Dériver imports Player** : pour chaque fichier sous `app/journey/`, `app/onboarding/`, `app/login/`, `app/player/`, lire les imports et confirmer la liste de composants effectivement consommés en arbre Player (via Grep `from "@/components/`). Lister tout composant supplémentaire découvert mais ABSENT de la liste hardcodée du scope. Ne PAS étendre l'audit à `lib/data.ts` même si importé.
4. **Pour `app/page.tsx`, `pixel-mascot.tsx`, `app-shell.tsx`** : si fichier est multi-rôle, examiner le code et n'inclure dans `AUDIT.md` que les littéraux dans une branche atteignable côté Player (ex : `variant === "player"`, `role === "founder"`, etc.) — sinon classer en "Hors scope (branche staff/admin)".
5. **Écrire `AUDIT.md`** avec cette structure :

```markdown
# R1 Audit — Score Invisible Player (raw findings)

> Généré $(date ISO) · Tâche 1 / 3 · Aucun edit appliqué.
> Input pour Tâche 2 (gate eic-pedagogical-advisor).

## Scope audité
- Routes Player : <liste>
- Composants Player dérivés (imports) : <liste après step 3>
- Composants ajoutés découverts via dérivation : <liste, ou "aucun">

## Patterns recherchés
- Interdits : <liste avec syntaxe regex utilisée>
- Autorisés (contexte) : <liste>

## Player Zone — violations candidates (à valider par advisor)
### `<file relative path>`
- L<line> · pattern `<matched>` · snippet : `<line content trimmed>`
  - Contexte : <1 phrase — ex "label visible UI" / "aria-label" / "comment JSX" / "string variable name jamais rendu">
  - Hypothèse premier-passage : violation | faux positif probable | branche conditionnelle staff
- L<line> · ...

### `<next file>`
- ...

## Zone autorisée — matches ignorés (référence trace)
- `app/jury/...` : <count> matches — non listés (hors scope)
- `app/admin/...` : <count> matches — non listés
- `app/mentor/...` : <count> matches — non listés
- `app/results/...` : <count> matches — non listés
- `lib/data.ts` : <count> matches — non listés (logique métier)

## Métriques
- Fichiers Player audités : <N>
- Violations candidates totales : <N>
- Faux positifs probables (XP/progression/X-sur-N) : <N>
- Branches conditionnelles staff trouvées dans fichiers multi-rôles : <N>

## Notes pour l'advisor (Tâche 2)
- Ambiguïtés à trancher : <liste — ex "`/20` apparaît dans <file:line> dans une fonction utilitaire — string never rendered, à confirmer">
- Composants multi-rôles (à examiner branche par branche) : <liste>
```

6. **Ne PAS appliquer de patch.** Ce fichier est read-only pour l'advisor.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs');const p='.planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/AUDIT.md';if(!fs.existsSync(p))process.exit(1);const c=fs.readFileSync(p,'utf8');if(!c.includes('## Player Zone'))process.exit(2);if(!c.includes('## Scope audité'))process.exit(3);if(!c.includes('## Métriques'))process.exit(4);console.log('AUDIT.md OK');"</automated>
  </verify>
  <done>
    `AUDIT.md` existe avec sections `## Scope audité`, `## Patterns recherchés`, `## Player Zone`, `## Zone autorisée`, `## Métriques`, `## Notes pour l'advisor`. Aucun fichier source modifié (`git status` n'affiche que ce nouveau fichier dans `.planning/quick/...`). Liste des violations candidates contient pour chaque match : path relatif, ligne, snippet, contexte, hypothèse premier-passage. Composants Player dérivés via imports cohérents avec scope hardcodé.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Gate eic-pedagogical-advisor → ADVISOR-VERDICT.md</name>
  <files>.planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/ADVISOR-VERDICT.md</files>
  <what-built>
Audit brut des violations R1 candidates (`AUDIT.md` posé en Tâche 1) couvrant les routes Player et leurs composants imports. Aucun edit appliqué — toutes les chaînes interdites éventuelles sont encore en place.
  </what-built>
  <how-to-verify>
**Cette tâche est un gate non-négociable** : avant tout patch, l'agent `eic-pedagogical-advisor` (cf. `.claude/agents/eic-pedagogical-advisor.md`) doit examiner `AUDIT.md` et trancher chaque violation candidate.

Procédure :

1. **Spawn de l'advisor** via Task tool avec `subagent_type="eic-pedagogical-advisor"`. Prompt suggéré : *"Audit R1 (score invisible côté Player) — pilote AgreenTech T-3. Examine `.planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/AUDIT.md`, lis les sources de vérité (`EIC-MANAGER-ANSWERS-AGREENTECH.md` + `T3-IMPROVEMENTS.md`), et pour chaque violation candidate listée sous `## Player Zone`, donne un verdict tranché avec patch minimale. Format imposé pour chaque entrée : `<file:line>` | verdict (confirmé / faux-positif / laisser-tel-quel-documenté) | justification (1 ligne, cite la règle R1) | patch proposée (diff inline, minimal — préserver le sens, ne pas étendre le scope). Refuse de toucher `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, ou `lib/data.ts`. Pour chaque faux positif (`xp`, `progression`, `X/N champs`, `points` au sens XP, `Cohort Pulse`, `SOUMIS`), justifie en 1 ligne pourquoi c'est conforme R1. Si la chaîne est techniquement nécessaire mais non rendue côté Player (ex : nom de prop, clé objet, classe CSS jamais affichée, commentaire JSX), classer en `laisser-tel-quel-documenté` avec preuve (snippet code montrant la non-visibilité). Écris ta réponse dans `.planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/ADVISOR-VERDICT.md` au format ci-dessous."*

2. **Format imposé pour `ADVISOR-VERDICT.md`** :

```markdown
# R1 Advisor Verdict — eic-pedagogical-advisor

> Source de vérité : `EIC-MANAGER-ANSWERS-AGREENTECH.md` (R1) + `T3-IMPROVEMENTS.md` (R1)
> Input audité : `AUDIT.md` (Tâche 1)
> Posture : tranché, no-hedging.

## Verdicts

### `<file:line>`
- **Verdict** : confirmé R1 | faux positif | laisser-tel-quel-documenté
- **Justification** : <1 ligne citant R1 du brief>
- **Snippet actuel** :
  ```tsx
  <ligne(s) actuelle(s)>
  ```
- **Patch proposée** (si confirmé) :
  ```tsx
  <ligne(s) cible>
  ```
- **Notes** : <ex : "Préserver le sens éditorial — remplacer `note` par `commentaire mentor`. Aucun impact i18n.">

### `<file:line>`
- ...

## Synthèse
- Confirmés (à patcher Tâche 3) : <N>
- Faux positifs : <N>
- Laisser-tel-quel-documentés : <N> (détail dans SUMMARY.md final)
- Cas escaladés à Omar (ambigu, hors brief) : <N — détail si >0>

## Refus / hors-scope rappelés
- Aucun patch ne touchera : `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `lib/data.ts`.
- Aucun changement de logique scoring, formule 20/80, types XP/Score/Classement.
- Aucun ajout de feature, juste audit textuel R1.
```

3. **Bloquer ici si l'advisor refuse ou escalade** : si l'advisor signale un cas hors brief (ex : violation qui requiert refonte de composant, pas juste edit textuel), passer en `checkpoint:decision` à Omar avant Tâche 3.

4. **Validation user** : Omar relit `ADVISOR-VERDICT.md`, confirme la liste "à patcher" ou amende. Tâche 3 ne démarre QUE sur signal explicite.
  </how-to-verify>
  <resume-signal>
Réponse attendue : `approved` (Omar a relu le verdict advisor, la liste des patches confirmés est OK, lancer Tâche 3) — OU description des amendements à apporter (ex : "patch sur `<file:line>` à reconsidérer parce que XYZ" → l'advisor reprend la main).
  </resume-signal>
</task>

<task type="auto">
  <name>Task 3: Application patches confirmés + typecheck + atomic commits → SUMMARY.md</name>
  <files>(N fichiers Player listés dans ADVISOR-VERDICT.md sous "confirmés"), .planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/SUMMARY.md</files>
  <action>
**Préconditions** :
- `AUDIT.md` et `ADVISOR-VERDICT.md` existent et `ADVISOR-VERDICT.md` contient une section `## Verdicts` avec au moins 1 entrée "confirmé" (ou explicitement 0 → SUMMARY.md de clôture sans commits).
- `git status` ne contient que les 2 fichiers planning ci-dessus (aucun edit source en cours).
- L'utilisateur a répondu `approved` au gate Tâche 2.

**Procédure** :

1. **Itérer sur chaque verdict "confirmé"** dans `ADVISOR-VERDICT.md`, dans l'ordre où ils apparaissent :
   - Lire le fichier source via `Read` tool.
   - Appliquer **exactement** la patch proposée par l'advisor (pas d'extension, pas d'optimisation collatérale, pas de refactor opportuniste). Utiliser le tool `Edit` avec un `old_string` qui contient assez de contexte pour matcher uniquement la zone ciblée.
   - **Lancer `npm run typecheck`** immédiatement après l'edit. Si erreur :
     - Si l'erreur est causée par la patch (ex : type devenu incohérent) → revert l'edit (réécriture inverse), documenter dans `SUMMARY.md` sous "Patches échouées" avec l'erreur tsc, et passer au suivant.
     - Si l'erreur préexiste (typecheck cassé avant le patch) → arrêter immédiatement, signaler à Omar, ne pas commit.
   - Si typecheck OK → `git add <file>` puis commit atomique avec message format :
     ```
     chore(r1): hide <descriptor> in Player UI — <file basename>:L<line>

     R1 cardinal rule (T3-IMPROVEMENTS.md) — score invisible côté Player.
     Replaced "<old snippet>" → "<new snippet>" per eic-pedagogical-advisor verdict.
     ```
     Une seule patch = un seul commit (atomique). Si l'advisor a groupé 2 lignes contiguës dans le même fichier en 1 patch, c'est 1 commit.

2. **Conserver dual-mode** : ne jamais toucher `lib/supabase-status.ts`, `utils/supabase/`, `middleware.ts`, ni introduire de dépendance Supabase dans une chaîne de rendu Player. L'audit est purement textuel UI.

3. **Cas spéciaux à gérer pendant l'application** :
   - Si une chaîne est dans `lib/i18n.ts` et l'advisor a confirmé violation : éditer la clé i18n, pas le composant. Vérifier que la clé n'est pas consommée hors UI Player avant edit (grep `t("<key>")` dans `app/admin/`, `app/mentor/`, `app/jury/`, `app/results/` → si oui, escalade Omar avant edit).
   - Si la chaîne est un `aria-label` / `alt` / `title` : patcher quand même (R1 vise toute UI, y compris assistive tech).
   - Si la chaîne est un commentaire JSX (`{/* ... */}`) : c'est un faux positif (jamais rendu) — l'advisor aurait dû classer "laisser-tel-quel-documenté", pas "confirmé". Si malgré tout c'est listé "confirmé", flagger dans SUMMARY.md "Anomalie verdict — non patché" et continuer.

4. **Écrire `SUMMARY.md`** au final (1 seul fichier, 1 commit dédié à la fin) :

```markdown
# R1 Audit Outcome

## Contexte
Pilote AgreenTech 13-14 mai 2026 — règle cardinale R1 (`T3-IMPROVEMENTS.md` + `EIC-MANAGER-ANSWERS-AGREENTECH.md`) : score INVISIBLE côté Player.
3 tâches : audit grep brut → gate eic-pedagogical-advisor → application patches confirmés.

## Patches appliqués (commits atomiques)
| # | Fichier | Ligne | Avant | Après | Commit SHA | Typecheck |
|---|---|---|---|---|---|---|
| 1 | `<file>` | <L> | `<old>` | `<new>` | `<sha>` | OK |
| ... |

## Faux positifs documentés (R1 non violée)
- `<file:line>` · `<snippet>` — Justification advisor : <1 ligne>
- ...

## Laisser-tel-quel-documentés (chaîne nécessaire mais non visible Player)
- `<file:line>` · `<snippet>` — Preuve non-visibilité : <ex "string variable name, jamais rendu en JSX" / "commentaire JSX">
- ...

## Patches échouées (revertées)
- `<file:line>` · raison tsc : <message>
- (idéalement vide)

## Anomalies / escalades à Omar
- <ex "Composant `<X>` requiert refonte (pas juste edit textuel) — escaladé avant Tâche 3">
- (idéalement vide)

## Garde-fous respectés
- [x] Aucun edit dans `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`
- [x] `lib/data.ts` non modifié (logique scoring intacte)
- [x] Dual-mode (demo + Supabase) intact (aucun changement `utils/supabase/`, `lib/supabase-status.ts`, `middleware.ts`)
- [x] `npm run typecheck` final : PASS
- [x] Tous les commits posés sont atomiques (1 patch = 1 commit), message format `chore(r1): hide ... — file:Lxx`
- [x] Usages légitimes XP / progression / X/N champs / Cohort Pulse / SOUMIS conservés intacts

## Métriques finales
- Violations candidates initiales (Tâche 1) : <N>
- Confirmées par advisor : <N>
- Patches appliqués avec succès : <N>
- Faux positifs : <N>
- Laisser-tel-quel-documentés : <N>
- Commits posés : <N + 1 (SUMMARY.md)>

## Suivi
- L'audit ne couvre que les chaînes textuelles UI. Les changements de logique scoring (formule 20/80, bonus AAP, Z-score mentor V0.3) sont hors scope — voir `T3-IMPROVEMENTS.md` section H.
- Schemas v2 (deliverable_templates) NON seedés ici — tâche dédiée séparée (cf. T3-IMPROVEMENTS section F).
```

5. **Lancer un dernier `npm run typecheck` global** après tous les patches + l'écriture de SUMMARY.md, et inclure son verdict dans la table "Garde-fous respectés".

6. **Commit final** : `git add .planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/SUMMARY.md` + commit message `docs(r1): audit summary — N patches, M false positives, K documented`.
  </action>
  <verify>
    <automated>cmd /c "cd /d C:\Users\omara\Desktop\EntrepreneurGame && npm run typecheck"</automated>
  </verify>
  <done>
    - `SUMMARY.md` existe avec sections `## Patches appliqués`, `## Faux positifs documentés`, `## Laisser-tel-quel-documentés`, `## Garde-fous respectés`, `## Métriques finales`.
    - `npm run typecheck` PASS au final (exit 0).
    - `git log --oneline -20` montre 1 commit atomique par patch confirmé (préfixe `chore(r1):`) + 1 commit final SUMMARY (`docs(r1):`).
    - `git status` clean.
    - Aucun fichier modifié sous `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `lib/data.ts`, `lib/workflow-data.ts`, `database/`, `utils/supabase/`, `middleware.ts` (vérifier via `git diff <base-sha-avant-tache3>..HEAD --stat | grep -E '(jury|results|admin|mentor|lib/data\.ts|database/|utils/supabase|middleware)'` doit être vide).
    - Toutes les chaînes interdites listées "confirmé" dans `ADVISOR-VERDICT.md` ont disparu des fichiers Player (re-grep rapide post-patch en mode sanity check, mentionné dans SUMMARY.md).
  </done>
</task>

</tasks>

<verification>
**Phase-level verification (manuelle, post-Tâche 3)** :

1. `npm run typecheck` — exit 0
2. `npm run lint` — pas de nouveau warning Player
3. **Re-grep manuel sanity** : pour chaque pattern interdit, lancer Grep sur scope Player → 0 match (ou uniquement matches classés "laisser-tel-quel-documenté" / "faux positif" dans `ADVISOR-VERDICT.md`)
4. **Smoke visuel local** (optionnel mais recommandé avant pilot) : `npm run dev` → ouvrir `/login`, `/onboarding`, `/journey`, `/journey/deliverable/<id>` en demo mode + en mode authentifié Player → confirmer aucune chaîne interdite ne s'affiche
5. **Dual-mode check** : démarrer le serveur sans `NEXT_PUBLIC_SUPABASE_*` (demo) puis avec → confirmer rendu Player identique (pas de fallback cassé)
6. **Hors-scope intégrité** : `git diff <base-sha>..HEAD --stat` ne contient AUCUN fichier sous `app/jury/`, `app/results/`, `app/admin/`, `app/mentor/`, `lib/data.ts`, `lib/workflow-data.ts`, `database/`, `utils/supabase/`, `middleware.ts`
7. **Granularité commits** : `git log --oneline <base-sha>..HEAD` = 1 commit par patch + 1 commit SUMMARY ; chaque commit `chore(r1):` ou `docs(r1):` ; aucun mega-commit groupant N patches
</verification>

<success_criteria>
- [x] AUDIT.md généré sans édit source (Tâche 1)
- [x] ADVISOR-VERDICT.md généré par l'agent eic-pedagogical-advisor avant tout patch (Tâche 2 — gate non-bypass)
- [x] Omar a confirmé la liste "à patcher" via signal `approved`
- [x] Pour chaque verdict "confirmé" : edit appliqué + typecheck PASS + commit atomique posé
- [x] `npm run typecheck` final PASS
- [x] `git status` clean
- [x] Aucun fichier hors scope modifié (jury/results/admin/mentor/lib/data.ts/database/utils-supabase/middleware)
- [x] Usages XP / progression / X/N champs / Cohort Pulse / SOUMIS / niveau Lx conservés intacts
- [x] SUMMARY.md final liste : patches appliqués (table), faux positifs documentés, laisser-tel-quel-documentés (avec preuve non-visibilité), garde-fous respectés, métriques
- [x] Total context usage du quick ≤ ~30% (3 tâches focused, scope textuel uniquement, pas de refactor)
</success_criteria>

<output>
3 fichiers Markdown dans `.planning/quick/260510-heu-audit-r1-score-invisible-cote-player-et-/` :
- `AUDIT.md` (Tâche 1 — read-only input pour advisor)
- `ADVISOR-VERDICT.md` (Tâche 2 — verdicts par violation, source de vérité des patches)
- `SUMMARY.md` (Tâche 3 — récap final + commits posés + garde-fous)

Plus N + 1 commits git atomiques (`chore(r1): ...` × N + `docs(r1): audit summary ...` × 1) sur la branche courante.

Aucun changement schéma DB, aucun changement logique scoring, aucun changement formule 20/80 — uniquement chaînes textuelles UI Player.
</output>
