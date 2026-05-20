---
quick: 260520-124-jury-v1v3
date: 2026-05-20
status: shipped
commit_sha: 72e7b7f
branch: main
pushed: true
prod_urls:
  - https://entrepreneur-game-six.vercel.app/jury
  - https://entrepreneur-game-six.vercel.app/jury?ui=dial
---

# Summary — quick-260520-124 Jury V1/V3 UI variations

## TL;DR
2 variations UI scoring jury livrees : V1 sliders horizontaux 0-20 par defaut sur /jury, V3 molettes SVG via ?ui=dial. Toggle discret dans le header. Score total double affichage /100 (canonique DB) + /20 (moyenne ponderee). savePitchScoreFlow signature intacte. Dual-mode demo + theater mode + juror gate + aggregate cross-juror + R1 anonymat tous preserves. Scope extension : 5 accents francais corriges sur UI strings.

## Commit
- SHA : 72e7b7f
- Branch : main
- Pushed : origin/main OK
- Vercel auto-deploy declenche (~2 min)

## Fichiers touches (11)

### Jury V1/V3 (4)
- app/jury/jury-form.tsx - reecrit V1 (332 lignes) : 4 sliders horizontaux 0-20, pills Faible/Moyen/Bon/Excellent, recap droite /100+/20, aggregate cross-juror conserve, banner anonymat
- app/jury/jury-dial-form.tsx - nouveau V3 (391 lignes) : 4 molettes SVG 120x120, input range invisible + boutons +/-, top recap score, aggregate conserve
- app/jury/page.tsx - searchParams.ui lu, swap conditionnel V1<->V3, toggle header discret eic-button (label "Sliders" / "Molettes")
- app/globals.css - +20 lignes : .eic-jury-form-v1__layout (1fr 320px desktop / 1fr mobile), .eic-jury-form-v3__grid (4 cols desktop / 2 cols mobile)

### Scope extension accents FR UI (3)
- lib/i18n.ts:248 - cohort_pulse_label_template "equipes ont soumis" -> "equipes ont soumis" (avec accents)
- lib/journey-progression.ts:37-44 - SHORT_LABELS L1/L3/L4 (Probleme->Probleme, Marche->Marche, Modele eco.->Modele eco. avec accents)
- app/journey/page.tsx:185-186 - banner Welcome Guide (regles du bootcamp -> regles du bootcamp avec accent)

### Artefacts quick (4)
- 260520-124-PLAN.md
- ADVISOR-VERDICT.md (verdict WARN_NOTES, 5 notes incorporees)
- AUDIT.md (smoke + guards PASS)
- deferred-items.md (7 items deferes intentionnellement)

## Pre-edit guards (CLAUDE.md)
- R1 OK : grep "rank|classement|percentile|leaderboard" app/jury/ -> 0 match. Banner anonymat rendu V1 + V3.
- R2 OK : aucun nouveau validator Zod. pitchScoreSchema intact. savePitchScoreFlow(c1..c5) signature preservee.
- R3 : sans objet.
- Dual-mode demo guard OK : aucun redirect("/login") ajoute avant hasSupabaseEnv().
- Branding OK : grep "Atlas|Maraya" app/jury/ -> 0 match.

## Smoke
- npm run typecheck OK
- npm run lint OK
- npm run build OK (Compiled successfully 7.3s, 20/20 pages)

## URLs PROD
- V1 defaut : https://entrepreneur-game-six.vercel.app/jury
- V3 molettes : https://entrepreneur-game-six.vercel.app/jury?ui=dial
- V4 session : https://entrepreneur-game-six.vercel.app/jury?ui=session  (extension 2026-05-20)
- Theater (inchange) : https://entrepreneur-game-six.vercel.app/jury?theater=1

## Self-Check: PASSED

---

# V4 Extension scope (2026-05-20) — Mode session + Fixes F3/F4

## TL;DR
3eme variation UI scoring jury : V4 "session" via `?ui=session`. Layout dark theater 2-col inspire du mockup Omar (capture 2026-05-20 011729). Topbar live + timer + boutons Pause/Suivant (cosmetiques). Left = team header + timer principal + liens livrables par Player + file de passage. Right = juror card + 5 criteres /5 (mapping UI 1..5 -> DB 0/4/8/12/16/20) + commentaires courts par critere + commentaire global + CTA orange "Valider mes notes pour {team}" + progress autres jurors. Toggle 3-way header : Sliders/Molettes/Session (avec aria-current). F3 banner closed/live mapping branche sur `pitchModeState`. F4 separateur `·` entre /100 et score20 /20 dans V3.

## Fichiers touches (V4 extension)

### Code (8)
- `database/` (via .planning/quick/260520-124-jury-v1v3/NEW.sql) - ALTER pitch_scores ADD comment_c1..c5, comment_global (nullable). **NON applique** (deny zone) - voir deferred-items.md item 15.
- `lib/types.ts` - DENY ZONE - PitchScore type non touche directement (deny rule). Extension via lib/jury.ts.
- `lib/jury.ts` - PitchScoreWithComments + SubmissionRef types exportes. mapPitchScore lit comment_* tolerant. SELECT comments separe (tolerant: pas d'erreur si colonnes absentes). Submissions fetch + sort level ASC / ord ASC. JuryPlayerRow gagne `submissions: SubmissionRef[]`.
- `app/actions.ts` - pitchScoreSchema gagne commentC1..C5 + commentGlobal optional/nullable. Upsert payload conditionnel: comment_* envoyes uniquement si non-undefined (V1/V3 sans comments restent legacy-safe schema-wise meme avant migration).
- `lib/i18n.ts` - +24 keys `jury_session_*` FR uniquement (EN out-of-scope confirme).
- `app/jury/jury-session-form.tsx` - NOUVEAU 380 lignes : layout dark 2-col, topbar sticky, deliverable links (cliquables target=_blank), 5 criteres radio buttons orange, textareas commentaires, CTA "Valider mes notes pour {team}", autres jurors progress bars.
- `app/jury/jury-form.tsx` - V1 gagne prop `pitchModeState?: PitchModeState`. Banner mappe closed/live (F3 fix).
- `app/jury/jury-dial-form.tsx` - V3 gagne prop `pitchModeState?: PitchModeState`. F4 fix : separateur `·` (8px margin) entre score100 /100 et score20 /20 dans le recap top (le rendering compresse "0/1000.0 /20" smoke 04 est elimine). Banner mappe closed/live (F3 fix).
- `app/jury/page.tsx` - 3-way toggle Sliders/Molettes/Session (aria-current page). Variant union "slider"|"dial"|"session". JurySessionForm rendu avec juror/position/submissions/upNext (otherJurors=[] hors scope MVP). pitchModeState passe aux 3 formes.
- `app/globals.css` - +~400 lignes `.eic-jury-session__*` tokens dark + responsive grid 2-col->1-col <900px.

### Artefacts (3)
- `.planning/quick/260520-124-jury-v1v3/NEW.sql` - migration ready-to-apply (Supabase MCP execute_sql).
- `.planning/quick/260520-124-jury-v1v3/SUMMARY.md` - cette section V4 ajoutee.
- `.planning/quick/260520-124-jury-v1v3/deferred-items.md` - items #1, #6 marques FAIT, +8 nouveaux items V4 (items 8-15).

## Mapping UI /5 <-> DB /20
- Bouton UI 1 -> DB 4
- Bouton UI 2 -> DB 8
- Bouton UI 3 -> DB 12
- Bouton UI 4 -> DB 16
- Bouton UI 5 -> DB 20
- Existing rows en DB (0-20 continu) -> UI rounded Math.round(db/4) sur load.
- `lib/results.ts pitchAvg` inchange (operates on DB c1..c5 raw).

## Pre-edit guards (CLAUDE.md V4 extension)
- R1 OK : grep "rank|classement|percentile|leaderboard" app/jury/ -> 1 match (comment dans jury-session-form.tsx ligne 10). Aucun rendering rank/leaderboard.
- R2 OK : pitchScoreSchema commentC1..C5 + commentGlobal `.optional().nullable()` ; pas de severity:"error".
- R3 : sans objet (V4 dans /jury, pas de cross-mission gating).
- Dual-mode demo guard OK : page.tsx flow inchange (hasSupabaseEnv check preserve).
- Branding OK : grep "Atlas|Maraya" app/jury/ -> 0 match. V4 utilise `player.name` + `player.idea` reels en mode supabase.
- lib/types.ts deny respect : PitchScoreWithComments etendu dans lib/jury.ts (pas de modif lib/types.ts).

## Smoke V4 extension
- npm run typecheck OK
- npm run lint OK
- npm run build OK (Compiled successfully, /jury route 10.2 kB vs 8.5 kB pre-V4 = +1.7 kB grace au JurySessionForm)

## DB migration status
- **NEW.sql STAGED** in `.planning/quick/260520-124-jury-v1v3/NEW.sql` mais **PAS APPLIQUE** (executor n'a pas acces au MCP `apply_migration` / `execute_sql` dans cette session).
- **Action requise Omar** : appliquer via Supabase MCP avant tout test V4 PROD :
  ```sql
  ALTER TABLE pitch_scores
    ADD COLUMN IF NOT EXISTS comment_c1 text,
    ADD COLUMN IF NOT EXISTS comment_c2 text,
    ADD COLUMN IF NOT EXISTS comment_c3 text,
    ADD COLUMN IF NOT EXISTS comment_c4 text,
    ADD COLUMN IF NOT EXISTS comment_c5 text,
    ADD COLUMN IF NOT EXISTS comment_global text;
  ```
- V1/V3 restent **fonctionnels** sans la migration (upsert payload conditional bypass les comment_* keys quand undefined).
- Sans migration : V4 save retourne `column "comment_c1" does not exist` dans le banner d'erreur ; pas de regression V1/V3.

## Self-Check V4: PASSED
