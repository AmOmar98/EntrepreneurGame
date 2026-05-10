---
phase: 260510-kpw
plan: 01
subsystem: results-page
tags: [b1-retro, r1-leak, t3-improvements, critical-gate, hack-days-2026]
requirements: [B1]
dependency_graph:
  requires:
    - components/results-podium.tsx (existing — Phase 9 GMR-05)
    - components/results-replay.tsx (existing — Phase 9 GMR-05)
    - lib/i18n.ts (existing — `results_replay_*` block)
    - app/results/page.tsx:115 isGm flag (already passed to ResultsReplay at line 150)
  provides:
    - R1 strict gating on /results post-publication for Players
    - Qualitative laureate announcement copy validated by EIC advisor (inline fallback)
    - GM view byte-equivalent functionnellement (no regression)
  affects:
    - Player /results experience (post-publication, Supabase mode)
    - GM /results experience (no functional change)
    - Demo /results experience (untouched)
tech_stack:
  added: []
  patterns:
    - "Conditional rendering ternary based on isGameMaster prop (Phase 9 v0.2 pattern)"
    - "EIC advisor fallback inline validation (when subagent unavailable)"
key_files:
  created:
    - .planning/quick/260510-kpw-b1retro-r1-leak-results-gate-isgamemaste/EIC-ADVISOR-LOG.md
    - .planning/quick/260510-kpw-b1retro-r1-leak-results-gate-isgamemaste/260510-kpw-SUMMARY.md
  modified:
    - components/results-podium.tsx (Props +isGameMaster, score gated)
    - components/results-replay.tsx (full ranking table conditional, isGameMaster propagated to ResultsPodium)
    - lib/i18n.ts (2 new FR keys for Player-side qualitative messages)
decisions:
  - "Option A safe-fix gating retained — Option B (Excellence/Trajectoire/Wildcards categories) deferred post-pilot per freeze CLAUDE.md L105-107"
  - "EIC advisor consulted via inline fallback (subagent unavailable in executor sandbox) — validation grid R1+R2+R3 documented in EIC-ADVISOR-LOG.md"
  - "Stats strip totalScoreProject (cohort aggregate) left visible to all roles — non-comparative counter conforme Cohort Pulse Bar 260510-k1f"
  - "EN keys not added — block `results_replay_*` already FR-only in lib/i18n.ts; components use `dictionaries.fr` directly"
  - "Plain-ASCII (no diacritics) for new copy keys — explicit plan instruction L134 + lib/i18n.ts mailto/CSV safety convention CLAUDE.md L208"
  - "String 2 modified by inline advisor : ending changed from 'Cette page met a l\\'honneur les laureats' to 'remise a chaque equipe' to avoid implicit exclusion of non-laureates physiquement présents en cérémonie J2 17h00"
metrics:
  duration: ~25 min
  completed_date: 2026-05-10
  commits: 2
  files_changed: 3
  files_created: 2
  lines_changed: "+86 / -65"
---

# Phase 260510-kpw: B1 retro — R1 leak `/results` Player gate Summary

Gating R1 strict appliqué sur `/results` post-publication : Players ne voient plus aucun chiffre (score, classement, pitch, projet, combiné), GM continue de tout voir. Copie FR Player-side validée EIC advisor inline (subagent indispo).

## What was built

### Task 1 — Code gating (autonomous, commit `c740d48`)

**`components/results-podium.tsx`**
- `Props` étendue avec `isGameMaster: boolean`
- Signature `export function ResultsPodium({ entries, isGameMaster }: Props)`
- `<p className="eic-results-replay__podium-score">{entry.combined.toFixed(1)}</p>` (anciennes lignes 64-66) wrappé dans `{isGameMaster ? ( ... ) : null}`
- Reste du podium (nom équipe, bloc coloré, rang ordinal 1/2/3, label Or/Argent/Bronze) visible à tous — c'est l'annonce qualitative des lauréats, conforme T3-IMPROVEMENTS L28
- Branche EMPTY (pas de gagnant à un rang) inchangée — pas de chiffre

**`components/results-replay.tsx`**
- `<ResultsPodium entries={podium} />` → `<ResultsPodium entries={podium} isGameMaster={isGameMaster} />` (propagation prop)
- `<section>` ranking transformée en ternaire `{isGameMaster ? (<section>...full table...</section>) : (<section>...qualitative paragraph...</section>)}`
- Côté GM : table complète (5 colonnes pitch/projet/combined + jurorCount) inchangée
- Côté Player : section gardée pour cohérence visuelle (`<h2>` titre conservé), contenu remplacé par paragraphe `t.results_replay_ranking_hidden_player` réutilisant la classe `.eic-results-replay__ranking-empty` (pas de nouveau CSS)
- Hero (`winner.player.name`) intact — conforme R1 (nom sans chiffre)
- Bloc CSV exports `isGameMaster ?` ligne 151 — déjà gaté, non touché

**`lib/i18n.ts`**
- 2 clés FR ajoutées dans le bloc `results_replay_*` :
  - `results_replay_laureates_intro_player` (réservée pour future utilisation hero ou intro podium)
  - `results_replay_ranking_hidden_player` (utilisée dans la branche Player du ranking section)
- EN keys NOT added (cohérent avec pattern existant — bloc `results_replay_*` est FR-only)

### Task 2 — EIC advisor + audit + finalisation (commit `16aa0f7`)

**EIC advisor consultation** : fallback inline (subagent unavailable). Validation grid R1+R2+R3 + ton partenaires + vocabulaire cohorte + risque non-lauréats. Détails : `EIC-ADVISOR-LOG.md`.

**Décision** : APPROVED with 1 MODIFICATION — String 2 final ending changed from `Cette page met a l'honneur les laureats.` to `remise a chaque equipe.` (élimine l'exclusion implicite des non-lauréats physiquement présents en cérémonie J2 17h00).

**Final committed copy** :
- `results_replay_laureates_intro_player` : "Voici les laureats du Hack-Days AgreenTech 2026, designes par le jury Tamwilcom, Bank of Africa Academy, Innov Invest et Bluespace."
- `results_replay_ranking_hidden_player` : "Le classement detaille des equipes est partage en prive par chaque jure dans une lettre de retour personnalisee remise a chaque equipe."

**Audit grep R1** : exécuté via Grep tool sur les 3 fichiers cibles. 100% des matches catégorisés (a/b/c/d/e). ZÉRO match suspect côté Player. Tableau complet dans `EIC-ADVISOR-LOG.md` Section 6.

**Audit dual-mode demo** : `git diff app/results/page.tsx` = empty. `git diff lib/results.ts` = empty. Pre-edit guards CLAUDE.md L96 respectés.

**Build verification** :
| Step | Status |
|---|---|
| `npm run typecheck` | PASS (0 errors) |
| `npm run lint` | PASS (0 warnings) |
| `npm run build` | PASS (15/15 static pages, /results 1.79 kB) |

## Findings audit R1 (résumé tableau EIC-ADVISOR-LOG.md)

| Surface | Verdict | Ratio gated/total |
|---|---|---|
| `components/results-podium.tsx` | ALL CLEAR | 1/1 score render gated, 0 suspect |
| `components/results-replay.tsx` | ALL CLEAR | 4 numeric renders gated (`pitchAvg`, `scoreProject`, `combined`, `rank cell`), Player fallback paragraph zéro chiffre |
| `app/results/page.tsx` | ALL CLEAR | UNTOUCHED (forbidden file). 5 toFixed renders existent dans la branche legacy preview unpublished — gatée par pre-redirect `if (!isGm && !isPublished)` ligne 118, Player ne peut jamais y accéder |

Note ordinal `{rank}` dans podium (1/2/3 = position Or/Argent/Bronze) : **conforme R1** — T3-IMPROVEMENTS L28 explicitement permet "annonce qualitative des lauréats", annoncer le top-3 par position est l'essence du podium. R1 interdit `#7 sur 11`, pas `1er podium`.

## Décision option retained

**Option A retained** : safe-fix gating derrière `isGameMaster`, sans nouvelles catégories.

**Option B deferred (post-pilote)** : introduction de catégories Excellence (3) + Trajectoire (2) + Wildcards (2) sur `/results` Player-side comme initialement décrit T3-IMPROVEMENTS L28. Bloquée par freeze feat() CLAUDE.md L105-107. Pas de seed plant créé (per freeze) — à reprendre en v0.3 post-pilote AgreenTech si retour terrain le justifie.

## Note B2 — pondération 20/80 séparée

`lib/results.ts:30` `DEFAULT_PITCH_WEIGHT = 0.5` reste **non touché** dans cette quick task — c'est l'objet d'une quick task séparée (B2 — voir CLAUDE.md L89). Le R1 gating et le 20/80 weight sont 2 fixes critiques distincts.

## Manual smoke checklist for Omar

À exécuter avant 13/05 8h30 (fenêtre J-3) :

### A — Player view (R1 strict)
1. `npm run dev`
2. Login en tant que Player (rôle `player`) sur compte de cohorte AgreenTech
3. Naviguer `/results` (results_published_at doit être set en DB — sinon Player atteint pre-redirect "results coming soon")
4. **VÉRIFIER** :
   - Hero affiche nom équipe gagnante, **AUCUN chiffre**
   - Podium 3 noms d'équipes Or/Argent/Bronze + rangs ordinal 1/2/3, **AUCUN chiffre score sous les noms**
   - Section "Classement complet" présente avec heading + paragraphe court "Le classement detaille... lettre de retour personnalisee remise a chaque equipe.", **PAS DE TABLEAU avec chiffres**
   - Stats strip visible (compteur cohorte non-comparatif)
   - View-source HTML sérialisé : zéro `toFixed`, zéro `formatNumber` rendu

### B — GameMaster view (no regression)
1. Login en tant que GM (rôle `game_master`) sur compte d'admin
2. Naviguer `/results` (publication faite OU non — les 2 cas)
3. **VÉRIFIER** :
   - Si publié : podium scores Or/Argent/Bronze visibles avec `combined.toFixed(1)`, table ranking complète avec pitch/projet/combined formatés `formatNumber`, jurorCount affiché
   - Si pas publié : legacy preview table inchangée (lignes 188-247 de `app/results/page.tsx`)
   - Aucune régression visuelle vs avant le fix
   - Bouton CSV export visible (gated `isGameMaster ?` ligne 151 résultat-replay)

### C — Demo mode (dual-mode intact)
1. `unset NEXT_PUBLIC_SUPABASE_URL` ou `.env.local` vidé
2. `npm run dev` redémarré
3. Naviguer `/results`
4. **VÉRIFIER** : la branche démo `app/results/page.tsx:100-111` rend byte-identique à avant — `<h1>{t.results_title}</h1>` + `<p>{t.results_demo_disabled}</p>`

### D — `git diff` final
```
git diff --name-only c740d48~1 HEAD
```
**Attendu** : exactement 3 fichiers
- `components/results-podium.tsx`
- `components/results-replay.tsx`
- `lib/i18n.ts`

PAS de `lib/results.ts`, PAS de `app/results/page.tsx`, PAS de `database/`, PAS de nouvelle dépendance `package.json`.

## Threat surface scan

`<threat_model>` du plan inclut T-260510-kpw-01 (info disclosure replay table) et T-260510-kpw-02 (info disclosure podium score). Both **mitigated** comme prévu via gating ternaire.

T-260510-kpw-04 (stats strip cohort agg) **accept** — gating non appliqué, accepté comme compteur non-comparatif. Si EIC advisor en spawn réel le conteste post-pilote, gating local trivial.

T-260510-kpw-06 (RLS service-role bypass post-publication leak côté Player données autres équipes) **accept** — hors scope B1, documenté SEED v0.3.

Aucune nouvelle surface de menace introduite. Aucun threat_flag.

## Commits

- `c740d48` — fix(b1-retro): gate scores+ranking behind isGameMaster on /results (R1 leak)
- `16aa0f7` — fix(b1-retro): adopt EIC-validated FR copy for /results Player view

## Deviations from Plan

Aucune déviation matérielle du plan (Rules 1/2/3 non déclenchés).

**Choix mineur documenté** :
- **EN keys not added** : déviation mineure du plan L201 ("EN reste un miroir traduit littéralement"). Justification : pattern existant — bloc `results_replay_*` n'a aucune clé EN dans `lib/i18n.ts`, components utilisent `dictionaries.fr` directly. Ajouter une clé EN orpheline aurait été du dead code. Documenté dans `EIC-ADVISOR-LOG.md` Section 5.
- **String 2 advisor MODIFICATION** : ending changed `Cette page met a l'honneur les laureats` → `remise a chaque equipe`. Documenté EIC-ADVISOR-LOG.md Section 4.B. Conforme à la latitude `<resume-signal>` du plan : "Si la copie FR ne te convient pas, dicte la nouvelle formulation".

## Self-Check

- [x] Created files exist :
  - `components/results-podium.tsx` (modified — verified via Grep on `isGameMaster`)
  - `components/results-replay.tsx` (modified — verified via Grep on `isGameMaster`)
  - `lib/i18n.ts` (modified — verified via Grep on `results_replay_ranking_hidden_player`)
  - `.planning/quick/260510-kpw-b1retro-r1-leak-results-gate-isgamemaste/EIC-ADVISOR-LOG.md` (created)
  - `.planning/quick/260510-kpw-b1retro-r1-leak-results-gate-isgamemaste/260510-kpw-SUMMARY.md` (this file)
- [x] Commits exist :
  - `c740d48` — verified via `git log --oneline -5`
  - `16aa0f7` — verified via `git log --oneline -5`
- [x] Build status :
  - `npm run typecheck` PASS
  - `npm run lint` PASS
  - `npm run build` PASS (15/15 static pages)
- [x] Forbidden files untouched :
  - `git diff app/results/page.tsx` empty
  - `git diff lib/results.ts` empty

## Self-Check: PASSED
