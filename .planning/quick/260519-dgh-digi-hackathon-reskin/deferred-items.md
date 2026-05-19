# Deferred — Digi-Hackathon Reskin (quick-260519-dgh)

À traiter **post-22/05** ou plus tard :

## High priority (J1 ou post-J1)

- [ ] **Smoke fonctionnel browser** (5 items checklist SUMMARY.md) — Omar avant 20/05 09h00 ou en H-2 J1
- [ ] **Step 0.2 archive AgreenTech CSV** via `/admin/export/players.csv` — Omar browser GM (optionnel, raw déjà capturé)
- [ ] **Update `app/admin/players/import/page.tsx:10`** : `DEFAULT_COHORT_SLUG` hardcodé `'hack-days-mai-2026'` à paramétrer pour le bon slug Digi `cohorte-digi-mai-2026` si Omar veut utiliser l'UI CSV import (sinon SQL direct OK)
- [ ] **Confirmer pattern email M01** : `a.deguworkneh@ueuromed.org` provisionné suite à correction Omar 19/05. Si UEMF utilise autre pattern, update via SQL `UPDATE auth.users SET email=... WHERE id='b9f4ff32-3ac0-42a2-a27f-f9f058f8ad70'`

## Medium priority (v0.3 backlog)

- [ ] **Renommer slug event** `hack-days-fes-meknes-mai-2026` → `digi-hackathon-mai-2026` (refactor 15+ fichiers TS qui le référencent en dur) — cohérence reporting post-event
- [ ] **Confirmer équipes #1 et #11** (Omar a renuméroté 1-10 mais le brief original mentionnait peut-être 11/12) — re-provisionner si nouvelle équipe arrive
- [ ] **Cleanup chaînes hardcodées AgriTech/agriculteur hors lib/i18n.ts** — d'autres composants peuvent contenir des libellés narratifs non-i18n (grep ciblé)
- [ ] **Real jury emails** : J01/J02/J03 placeholders `@digi.uemf.ma`. Update via SQL ou UI quand Omar a les vrais emails J1
- [ ] **Mentor M01 multilingue** : Pr. Abebaw Degu Workneh est anglophone. UI EN locale existe mais incomplète (cf. dictionaries.en) — investiguer si bascule manuelle nécessaire

## Low priority

- [ ] **npm audit moderate** (relevé 19/05 post-reseed) : `postcss <8.5.10` XSS via `</style>` non échappé, tiré en transitive par next 15.5.15. **Non-exploitable** côté pilote (postcss build-time, pas runtime, aucun input user via CSS). Fix npm propose `next@9.3.3` (downgrade breaking massif, à rejeter). Vraie fix : `"overrides": {"postcss": "^8.5.10"}` dans package.json + `npm install` + smoke build/lint/typecheck — à faire post-22/05 hors fenêtre pilote
- [ ] **Migration bonus_events table** (pattern v0.3 déjà planifié pour AgreenTech). Les 5 livrables `is_bonus=true` peuvent rester dans deliverable_templates pour Digi — décision post-event
- [ ] **Region Vercel** : `cdg1` toujours OK pour Digi (Maroc + Europe). Pas de changement requis
- [ ] **Membres équipes secondaires** : actuellement 1 lead/team. Co-founders/contributors saisissables via `/admin/players/[id]` UI post-onboarding si Omar veut tracker tous les participants
- [ ] **Renommer cohort slug** : `cohorte-digi-mai-2026` reste si pas de conflit futur

## Note

Le pilote AgreenTech 13-14/05/2026 est archivé et opérationnel. Le tag `v0.2-pilot-ready` (ccdc2bc) reste rollback ultime. Le tag `v0.2.1-pre-digi` (cf92fd7) est rollback intermédiaire post-rebrand i18n.
