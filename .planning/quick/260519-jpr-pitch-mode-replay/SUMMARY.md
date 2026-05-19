# SUMMARY — Quick 260519-jpr (pitch-mode + jurors + replay refresh)

**Date** : 2026-05-19 → 2026-05-20
**Spec** : `docs/superpowers/specs/2026-05-19-jury-pitch-replay-design.md` (5 itérations brainstorming, dernier commit `a09c98d`)
**Tag de sécurité** : `v0.2.2-pre-pitch-mode-jpr` sur `a09c98d`

## Commits livrés

| Wave | SHA | Type | Auteur |
|---|---|---|---|
| Pre | `a09c98d` | `docs(specs): pitch-mode spec v5 — append au CSV cohorte unique` | Brainstorming Omar+Claude |
| Pre | `dcac666` | `chore(quick-260519-jpr): PLAN.md + deferred-items + migration snapshot` | Orchestrateur |
| W1 | DB migration (3 apply_migration via MCP, pas de commit code) | Agent #1 (gsd-executor via MCP) |
| W1 | `8b4afc3` | `feat(types,i18n): PitchModeState + Juror + 19 keys FR` | Agent #2 |
| W2 | `5e9b550` | `feat(backend): pitch-mode visibility + jurors helpers + 3 actions` | Agent #3 |
| W2 | `407b9ff` | `feat(ui-jury): theater refresh matching mockup 1` | Agent #4 |
| W2 | `57541e3` | `feat(ui-results): replay + ceremony refresh + matrice` | Agent #5 |
| W3 | `e65069a` | `feat(admin,jurors): GM toggle + jurors manager + CSV + script` | Agent #6 |
| W3 | `60268e8` | `fix: align juror script to existing PROD format` | Orchestrateur |
| W3 | `7e51d05` | `fix: profiles column is full_name not display_name` | Orchestrateur |
| W3 | `<post>` | `chore(quick-260519-jpr): ADVISOR-VERDICT + AUDIT + SUMMARY` | Orchestrateur |

## Livré

### Backend
- **Table `jurors(event_id, user_id, invited_at, invited_by)`** + helper `is_juror(event_id)` SECURITY DEFINER
- **Enum `pitch_mode_state`** (`off|live|closed`) + colonnes `events.pitch_mode_state` + `pitch_mode_closed_at` + trigger
- **RLS pitch_scores refondue** (6 policies) : faille historique `is_mentor() permet SELECT all` corrigée
- **`lib/pitch-mode.ts`** : `getCurrentPitchModeState`, `canSeeOtherJurorsScores`, `canSeeFullRanking`
- **`lib/jurors.ts`** : `getJurorsForEvent`, `isCurrentUserJuror`, `addJurorByEmail`, `removeJuror`
- **3 server actions** : `setPitchModeStateFlow`, `addJurorFlow`, `removeJurorFlow`

### UI
- **`/jury?theater=1`** refresh visuel mockup 1 (split-view + bandeaux state + queue badges + timer 60s seuil)
- **`/jury`** garde "pas invité" pour mentor non-juror
- **`/results`** refactor matrice 6 branches (matrice section 3 spec) : Demo / non-GM-non-juror / juror-closed / juror-published / GM-non-published / GM-published
- **`/results/ceremony`** refresh théâtre sombre + reveal staggered 3→2→1 + confetti CSS + footer logos partenaires
- **`/admin`** : nouveaux `<AdminPitchModeToggle>` (3 boutons segmentés + confirm) + `<AdminJurorsManager>` (liste + add email + remove)
- **`/admin/export/results.csv`** : route GM-only, gate `closed` OU `published`, sinon 403

### Provisioning
- **Script `scripts/create-digi-hackathon-jurors.cjs`** : idempotent, append au CSV cohorte unique
- **4 jurys PROD** : J01..J04 (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace) liés à event Digi-Hackathon

### Doc
- **`CLAUDE.md`** : AppRole désync corrigée (3 rôles `player|mentor|game_master`)
- **`docs/superpowers/specs/2026-05-19-jury-pitch-replay-design.md`** : 5 itérations brainstorming

## Métriques

- **Durée totale** : ~5h (brainstorming spec ~2h + execution waves ~3h)
- **Commits** : 10 atomiques + 1 tag
- **Diff cumul** : ~1700 lignes ajoutées / ~600 retirées sur ~30 fichiers (5 nouveaux : lib/pitch-mode.ts, lib/jurors.ts, components/admin-pitch-mode-toggle.tsx, components/admin-jurors-manager.tsx, components/results-ranking-collapsible.tsx, app/admin/export/results.csv/route.ts, scripts/create-digi-hackathon-jurors.cjs)
- **DB** : 1 nouvelle table + 1 enum + 2 colonnes + 1 trigger + 6 policies + 4 rows jurors
- **Tests** : typecheck + lint + build verts. Smoke clic-driven à faire par Omar (cf. AUDIT.md).

## Découvertes notables

1. **Faille RLS historique corrigée** : `is_mentor()` permettait SELECT all sur `pitch_scores`. Avant ce quick, le filtre cross-juror était applicatif uniquement (`lib/jury.ts:160`) — un mentor pouvait bypass via curl. Le quick refait les policies pour enforce DB-side.
2. **`profiles.display_name` n'existe pas** : la colonne est `full_name`. Spec à corriger pour les prochains quicks.
3. **3 jurys placeholders pré-existants** : J01..J03 étaient déjà en `auth.users` + `profiles` (avec passwords dans CSV) mais absents de la nouvelle table `jurors`. Le script a INSERT les 3 + créé J04.
4. **CSV multi-sections** : `cohorte-digi-hackathon-creds.csv` a 3 sections (Players / Mentors / Jury) avec headers différents. J04 a été appendé au format Players (7 cols) — cosmétique only.
5. **Agent `eic-pedagogical-advisor` retiré** : commit `2fec455` antérieur. Audit R1/R2/R3 fait manuellement par orchestrateur (verdict OK).

## Out of scope reportés (cf. deferred-items.md)

- 47 PDF certificats joueur + PDF rapport global
- Replay vidéo automatique
- Page publique eic.ma/hack-26
- Mascotte Pixel state-aware
- Migration 0-20 → 1-5 étoiles
- Granularité per-pitch pointer
- `/admin/jurors` page autonome
- Notifications email invitation jurors
- Tests RLS automatisés (à exécuter manuellement post-deploy via SQL)

## Action Omar avant Digi-Hackathon

1. **Distribuer creds jurys** : imprimer les 4 lignes Jury du CSV (cf. AUDIT.md), une carte A6 par juror partenaire
2. **Smoke clic-driven** : checklist dans AUDIT.md (≈30 min)
3. **Tests RLS** : 3 queries via MCP execute_sql avec différents JWT (≈10 min)
4. **Bonus** : remplacer "TBD" dans CSV lead_name J04 par le vrai nom Bluespace si connu

## Tag final

`v0.2.3-jpr-pitch-mode` sur le dernier commit du quick (post-SUMMARY). Pushé sur origin.
