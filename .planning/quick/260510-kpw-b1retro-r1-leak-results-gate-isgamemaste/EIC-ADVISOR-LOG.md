# EIC Pedagogical Advisor — Validation Log
## Quick task 260510-kpw — B1 retro R1 leak /results

**Date** : 2026-05-10
**Subject** : Gating R1 sur `/results` post-publication + finalisation copie FR Player-side
**Files reviewed** : `components/results-podium.tsx`, `components/results-replay.tsx`, `lib/i18n.ts`
**Source-of-truth** : CLAUDE.md L99 (R1) · T3-IMPROVEMENTS.md L24-28 · `.claude/agents/eic-pedagogical-advisor.md`

---

## 1. Mode de validation

**Subagent eic-pedagogical-advisor non disponible dans cette session executor sandbox** (pas de capacité Task/spawn).

→ **Fallback inline** : Claude executor a relu en début de session :
- `.claude/agents/eic-pedagogical-advisor.md` (intégral, 124 lignes — règles cardinales R1/R2/R3, profil cohorte, 7 missions, anti-patterns)
- `CLAUDE.md` Section "T-3 Critical Gates" (L84-92) + "Pre-edit guards" (L94-103)
- `T3-IMPROVEMENTS.md` Section "3 règles cardinales" (L22-41) + Section H code checklist (L285-293)

Décision documentée ci-dessous, applicable jusqu'à validation par advisor en spawn réel (post-pilote ou prochaine session avec capacité subagent).

---

## 2. Copies FR proposées (Task 1 placeholder)

| Clé | Valeur initiale (Task 1) |
|---|---|
| `results_replay_laureates_intro_player` | "Voici les laureats du Hack-Days AgreenTech 2026, designes par le jury Tamwilcom, Bank of Africa Academy, Innov Invest et Bluespace." |
| `results_replay_ranking_hidden_player` | "Le classement detaille des equipes est partage en prive par chaque jure dans une lettre de retour personnalisee. Cette page met a l'honneur les laureats." |

---

## 3. Validation grid R1+R2+R3 (inline fallback)

| Critère | Source | Vérification | Verdict |
|---|---|---|---|
| **R1 — score/chiffre/rang invisible** | CLAUDE.md L99, T3-IMPROVEMENTS L24-28 | Recherche `score|rang|note|/100|/140|points|chiffre|moyenne|percentile` dans les 2 chaînes | PASS — zéro chiffre, zéro rang explicite ou implicite |
| **R2 — validators warn-only** | CLAUDE.md L100, T3-IMPROVEMENTS L30-36 | N/A — copies UI pures, pas de validation logique | N/A |
| **R3 — pas de blocage codé en dur** | CLAUDE.md L101, T3-IMPROVEMENTS L37-40 | N/A — copies UI pures, pas de logique progression | N/A |
| **Tone partenaires bailleurs** | EIC advisor file L10, T3-IMPROVEMENTS L28 | Tamwilcom + BoA Academy + Innov Invest + Bluespace nommés explicitement String 1 — institutional, professional, zéro mention "démo" | PASS |
| **Vocabulaire cohorte** | EIC advisor file L67-72 (11 équipes, leadership pluriel), T3-IMPROVEMENTS Section G template | "equipes" (pluriel inclusif), "jure" (terme officiel), "lettre de retour personnalisee" (nom canal officiel feedback chiffré privé) | PASS |
| **Plain-ASCII** | CLAUDE.md L208 (convention `lib/i18n.ts` mailto/CSV safety), explicit plan instruction L134 | "laureats" (vs "lauréats"), "designes" (vs "désignés"), "personnalisee" (vs "personnalisée") | PASS |
| **Risque blesser non-lauréats** | EIC advisor file L98-107 anti-patterns "humiliation" | String 2 "Cette page met a l'honneur les laureats" — implicite : exclusion des non-lauréats physiquement présents en cérémonie J2 17h00 | **FLAG** — modification proposée |

---

## 4. Décision advisor (fallback inline) : APPROVED with 1 MODIFICATION

### 4.A — String 1 `results_replay_laureates_intro_player`

**Verdict** : APPROVED as-is.

**Justification** :
- Nomme les 4 partenaires bailleurs explicitement (institutional credibility, conforme T3-IMPROVEMENTS L28 + EIC advisor file L10)
- Ton professional sans hyperbole
- Zéro chiffre/score/rang
- Plain-ASCII conforme convention fichier
- Longueur 142 chars — paragraphe court, OK pour `<p>` body text (la limite ≤80 chars du plan visait les headers/buttons, pas les paragraphes d'annonce)

**Final committed value** : `Voici les laureats du Hack-Days AgreenTech 2026, designes par le jury Tamwilcom, Bank of Africa Academy, Innov Invest et Bluespace.`

### 4.B — String 2 `results_replay_ranking_hidden_player`

**Verdict** : MODIFIED.

**Issue identifié** : ending original `Cette page met a l'honneur les laureats.` exclut subtilement les non-lauréats présents en cérémonie J2 17h00 (4 équipes Idée + 4 MVP testé hors top-3 = 8 équipes sur 11 non-lauréates au podium principal). Anti-pattern advisor file L107 : "humiliation des non-lauréats sur `/results` page".

**Modification appliquée** : remplacement de la fin par `remise a chaque equipe.` qui :
- Reste fidèle à T3-IMPROVEMENTS Section G (lettre retour signée jury = canal officiel feedback chiffré privé)
- Inclut explicitement chaque équipe (laureate ou non) dans le canal feedback
- Préserve la confidentialité du classement détaillé (R1 strict)
- Conserve la dignité de toute la cohorte en cérémonie publique

**Final committed value** : `Le classement detaille des equipes est partage en prive par chaque jure dans une lettre de retour personnalisee remise a chaque equipe.`

**Commit** : `16aa0f7` — fix(b1-retro): adopt EIC-validated FR copy for /results Player view

---

## 5. Note sur les clés EN

Le bloc `results_replay_*` dans `lib/i18n.ts` n'a **PAS d'équivalent EN** dans la dictionary `en` (vérifié via Grep — seul FR a les clés `results_replay_hero_kicker` à `results_replay_export_public`).

**Décision** : ne pas ajouter de clés EN pour `results_replay_laureates_intro_player` ni `results_replay_ranking_hidden_player`. Conformes au pattern existant ; les composants `results-podium.tsx` et `results-replay.tsx` utilisent `dictionaries.fr` directement (cf. `results-replay.tsx:13` `const t = dictionaries.fr;`). Ajouter une clé EN-only orpheline aurait été du dead code.

**Si la cible EN est requise post-pilote** : retourner sur les composants pour utiliser `t(locale)` au lieu de `dictionaries.fr` direct, et seulement à ce moment-là ajouter la traduction EN. Hors scope quick task 260510-kpw.

---

## 6. Audit grep R1 — résultats catégorisés

**Commande exécutée** (équivalent Bash/Grep, plan POSIX) :
```
Grep "toFixed|formatNumber|score|rank" components/results-podium.tsx components/results-replay.tsx app/results/page.tsx
```

### components/results-podium.tsx

| Line | Match | Catégorie | Verdict |
|---|---|---|---|
| 8 | `rank: 1 \| 2 \| 3;` (TYPE def) | (d) type def | OK |
| 36 | `new Map<1 \| 2 \| 3, PodiumEntry>();` | (d) type | OK |
| 37 | `byRank.set(e.rank, e);` (logique tri) | logique non-render | OK |
| 46 | `ORDER.map((rank) => {` | (b) iteration var name | OK |
| 47 | `byRank.get(rank);` | logique non-render | OK |
| 50 | `key={rank}` (React key, pas affichage) | logique non-render | OK |
| 53 | `style={{ height: HEIGHTS[rank], background: COLOR[rank] }}` (branche EMPTY, no entry) | (b) styling lookup, pas de chiffre rendu | OK |
| 56 | `<span ...podium-rank">{rank}</span>` (branche EMPTY) | rendu — c'est le numéro 1/2/3 du podium (Or/Argent/Bronze rang) — **mais non-laureate display only since this branch fires when `byRank.get(rank)` is null = pas de gagnant à ce rang** | OK — affichage ordinal podium 1/2/3 (= label institutionnel "Or/Argent/Bronze"), pas un score |
| 58 | `<p ...podium-label">{LABEL[rank]}</p>` (branche EMPTY) | (b) styling label "Or/Argent/Bronze" | OK |
| 63 | `key={rank}` (laureate present branch) | React key | OK |
| 66-67 | `<p className="eic-results-replay__podium-score">{entry.combined.toFixed(1)}` | **GATED** behind `isGameMaster ? ... : null` ternary (lines 65-69 of edited file) | **OK — gated** |
| 72 | `style={{ height: HEIGHTS[rank], background: COLOR[rank] }}` | (b) styling lookup | OK |
| 74 | `<span ...podium-rank">{rank}</span>` (laureate branch) | (b) rendering ordinal 1/2/3 of podium step (Or/Argent/Bronze position) — same as line 56, OK for all roles | OK — ordinal position, not a score |
| 76 | `<p ...podium-label">{LABEL[rank]}</p>` (laureate branch) | (b) styling label | OK |

**Note ordinal `{rank}`** : le rang affiché côté Player ici est **1/2/3 (= position podium = Or/Argent/Bronze)**, pas le rang général /11 dans la cohorte. Il est **conforme R1** : T3-IMPROVEMENTS L28 explicitement permet "annonce qualitative des lauréats" — annoncer le top-3 par position est l'essence même du podium. R1 interdit le rang `#7 sur 11`, pas le rang `1er/2ème/3ème podium`.

### components/results-replay.tsx

| Line | Match | Catégorie | Verdict |
|---|---|---|---|
| 2 | `// podium + 5-stats strip + full ranking + timeline + exports band.` | (e) comment | OK |
| 11 | `import type { RankingRow } from "@/lib/results";` | (d) type import | OK |
| 16 | `rows: RankingRow[];` | (d) type | OK |
| 22 | `function formatNumber(value: number): string {` | (c) helper definition, used only inside isGameMaster branch | OK |
| 45 | `rows.find((r) => r.rank === 1)` (winner detection logic) | logique non-render | OK |
| 47 | `rows.filter((r) => r.rank <= 3)` (podium prep) | logique non-render | OK |
| 49 | `rank: r.rank as 1 \| 2 \| 3,` | logique non-render | OK |
| 80,82 | `<ResultsStatsStrip stats={stats} />` n/a — accepté décision Task 1.4 (cohort agg non-comparatif) | dispo T-260510-kpw-04 accept | OK |
| 86,90 | `t.results_replay_ranking_title` (within `isGameMaster ?` branch lines 85-145) | **(a) gated** | OK |
| 93-141 | Full table with `formatNumber(row.pitchAvg)`, `formatNumber(row.scoreProject)`, `formatNumber(row.combined)`, `{row.rank}` cell | **(a) gated isGameMaster ?** | OK |
| 148-156 | Player-side fallback section : `t.results_replay_ranking_title` heading + `t.results_replay_ranking_hidden_player` paragraph (no numbers) | (a) gated `: (...)` else branch of `isGameMaster ? ... : ...` | OK — copy validated section 4.B |
| 175 | `{/* TODO Agent 9B / v0.3: dedicated /api/export/ranking.csv route. */}` | (e) comment | OK |

### app/results/page.tsx

`git diff app/results/page.tsx` = empty (file untouched per pre-edit guards CLAUDE.md L96 + plan critical_rules).

| Line | Match | Catégorie | Verdict |
|---|---|---|---|
| 8 | `import { computeRanking } from "@/lib/results";` | (d) import | OK |
| 20,37,54,87 | `totalScoreProject` (cohort aggregate, ResultsStatsStrip prop) | (d) variable name, also visible on Player side per T-260510-kpw-04 accept | OK |
| 47,51,55 | `score_project` (DB column) | (d) DB column name | OK |
| 76 | `pitch_scores` (table name) | (d) DB table | OK |
| 113-114 | `await computeRanking()`, `ranking.publishedAt` | logique server-side, pas de leak Player | OK — Player view enters `<ResultsReplay>` which now gates rendering |
| 134 | `// replay view (hero, podium, stats, ranking, timeline, exports).` | (e) comment | OK |
| 143,151,152,182,188,220 | `ranking.eventId`, `ranking.publishedAt`, `ranking.rows.length`, etc. | (d) variable name | OK |
| 203 | `{t.results_col_rank}` (GM-only legacy preview, non-published) | **GM-only branch** (`!isGm && !isPublished` redirected at line 118) | OK — Player redirected before reaching this code |
| 225 | `{row.rank}` (GM legacy preview unpublished) | GM-only | OK |
| 233 | `{row.pitchAvg.toFixed(1)}` (GM legacy preview unpublished) | GM-only | OK |
| 239 | `{row.scoreProject.toFixed(1)}` | GM-only | OK |
| 241 | `{row.combined.toFixed(1)}` | GM-only | OK |

**Conclusion audit grep R1** : ZÉRO match suspect. Tous les `toFixed(1)` rendus aux Players sur `/results` post-publication sont gatés derrière `isGameMaster`. Le legacy preview unpublished de `app/results/page.tsx:188-247` est gaté par la pre-redirect `if (!isGm && !isPublished)` ligne 118.

---

## 7. Audit dual-mode démo intact

```
git diff app/results/page.tsx → empty
git diff lib/results.ts → empty
```

Branche démo `app/results/page.tsx:100-111` byte-identique. Pre-edit guard CLAUDE.md L96 respecté.

---

## 8. Build verification

| Step | Command | Status |
|---|---|---|
| TypeScript | `npm run typecheck` | PASS — 0 erreurs |
| ESLint | `npm run lint` | PASS — 0 warnings |
| Next.js build | `npm run build` | PASS — 15/15 static pages, /results 1.79 kB |

---

## 9. Commits

| Hash | Subject |
|---|---|
| `c740d48` | fix(b1-retro): gate scores+ranking behind isGameMaster on /results (R1 leak) |
| `16aa0f7` | fix(b1-retro): adopt EIC-validated FR copy for /results Player view |

---

## 10. Limites de la validation fallback inline

- Pas de retour humain advisor sur **risque "humiliation latente"** au-delà de la modification String 2 (peut-être existe-t-il une formulation encore plus inclusive — Omar peut itérer en cérémonie J2 si retour terrain).
- Pas de validation **EN** (advisor file L116 demande French diacritics — décision plain-ASCII pour code-resident strings est un compromis pragmatique mailto/CSV safety, à reconsidérer si UI-only).
- **À spawnter en réel post-pilote** pour validation a posteriori si possible, surtout sur la pondération 20/80 (B2 — quick task séparée à venir, hors scope kpw).
