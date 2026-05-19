# AUDIT — Digi-Hackathon Reskin

**Date** : 2026-05-19
**Auteur** : Claude (orchestrateur quick-260519-dgh)
**Plan** : `.planning/quick/260519-dgh-digi-hackathon-reskin/PLAN.md`

## Cardinaux R1/R2/R3

**Verdict** : ✅ Préservés par construction.

Ce reskin ne touche **aucun code applicatif** (`app/**/*.tsx`, `lib/score.ts`, `lib/results.ts`, `lib/types.ts`, `database/schema.sql|triggers.sql|rls.sql`). Seuls 2 artefacts code modifiés/créés :
- `database/seed_event_digi_hackathon.sql` (nouveau, data uniquement, pas de logique)
- `lib/i18n.ts` (libellés FR uniquement, pas de logique)

→ R1 (score Player invisible hors détail livrable), R2 (validators warn-only), R3 (pas de blocage inter-mission) inchangés par définition.

## Grep R1 baseline (post-tag)

```
grep -rn "score|rank|note|/100|/140|points|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"
```

Matches existants (baseline acceptée, cf. memory `feedback_eic_cardinal_rules.md` + `project_smoke_findings.md`) :
- `app/journey/bonus/[type]/page.tsx:4` — commentaire `// R1 STRICT : no score / multiplier numerique render` (= garde-fou)
- `app/results/ceremony/page.tsx` — page **GM-only** (R1 autorise GM/jury)
- `app/results/page.tsx:48-56` — finding medium connu (smoke 2026-05-09), state baseline

Aucune nouvelle violation introduite par ce plan.

## Tag pré-reskin

- **Local + remote** : `v0.2.1-pre-digi` → SHA `cf92fd7c1439c10ad89bf13273a56308c3b83612`
- **Précédent stable** : `v0.2-pilot-ready` (commit `ccdc2bc`) — remote confirmé
- **Rollback distant** : `git push origin --force v0.2.1-pre-digi:main` (avec accord explicite Omar uniquement)
- **Rollback DB** : re-appliquer `database/seed_event_hackdays.sql` après wipe Digi

## Findings de schéma critiques (relevés Task 0)

Plan original Task 4.1 contient un SQL wipe **incorrect** :
- Énum `public.app_role` PROD = `{player, mentor, game_master}` uniquement
- Plan utilise `where role in ('founder', 'mentor', 'reviewer', 'committee_member')` → 4 valeurs invalides
- Colonne s'appelle `app_role` pas `role`
- Emails Players ne matchent pas `'%@agreentech.test'` (vrais emails gmail/icloud/ueuromed + smoke.entrepreneurgame.local pour jury/mentor sim)

→ Task 4.1 SQL **réécrit** au moment de l'exécution Task 4 (consigné dans SUMMARY.md final).

## Pré-condition Task 4 (wipe + reseed)

- Archive AgreenTech exportée → `.planning/exports/agreentech-2026-05-13-14/` (gitignored)
  - players.json (11), profiles.json (20), auth_users.json (20), bonus_events.json (1), evaluation_comments.json (5), evaluations.json (50 résumés), submissions.raw.txt (57k)
- ⚠️ Step 0.2 (CSV admin/export) non couvert agent — nécessite browser auth GM Omar
