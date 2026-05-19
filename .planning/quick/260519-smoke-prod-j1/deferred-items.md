# Deferred items — Smoke PROD J-1 2026-05-19

Items identifiés pendant le smoke mais NON traités (à décider par Omar avant ou après pilote).

## Avant J1 — décision Omar requise

- [ ] **H1 RLS evaluations** — corriger la policy pour autoriser auto-insert sur `fiches-entretien-v1` OU briefer les 5 mentors sur le fallback éval manuel (250 max par fiche). Cf. SMOKE-PROD-J1.md §H1.
- [ ] **H2 Wording AgreenTech** — décision : (a) quick-fix copy `/journey` Welcome Guide + `/admin` header Régie, OU (b) accepter le wording obsolète pour ce pilote.
- [ ] **H3 Doc creds GM** — mettre à jour `tests/fixtures/test-credentials.md` avec `o.ameur@ueuromed.org / Agreen2026!G01` (réel) au lieu de `omar.ameur98@gmail.com / EICGame2026!HackDays` (cassé).
- [ ] **H4 Assignment mentor↔équipes** — clarifier si voulu (mentors partagés sur 10 équipes) ou bug RLS. Si voulu, ajuster copy login mentor `"Trois équipes t'attendent"`.
- [ ] **Cleanup PROD** — delete 4 submissions test Simock + reset progression si visibilité demain (cf. SQL §Données injectées).

## Après J1 — backlog v0.3

- [ ] **W1 Seed M1 santé mentale ado** — vérifier que les 10 projets sont effectivement santé mentale (sinon généraliser la description seed).
- [ ] **W2 Typo "demotion"** — corriger seed bonus Design Thinking M1.
- [ ] **W3 Welcome Guide PDF 8/7** — Omar gère hors-code (coordination Welcome Guide).
- [ ] **W4 Mascotte "Pixel · L4"** — clarifier UX (niveau mascotte vs niveau Player).
- [ ] **W5 Redirect login Jury** — `/login` avec role=jury devrait amener vers `/jury`, pas `/mentor`. Probable manque de case dans le post-login redirect helper.
- [ ] **W6 Card Jury sur landing** — ajouter une 4e card "Jury" à côté de Joueur/Mentor/Maître du jeu, ou créer `/login?role=jury` valide.

## Items observés mais non-bloquants

- "Pitch · 17h00" + "Mentor disponible" affichés en navbar Player — copy timer/badge, vérifier que se met à jour selon état réel cohorte.
- "Pouls de la cohorte" affiche `Probleme 1/1` quand Simock a soumis persona — sémantique "Probleme" = niveau M1 (pas livrable), OK pédagogiquement.
- "Bonus optionnels" sur `/journey` n'est pas filtré par niveau (3 bonus M1 affichés en bas même quand Player est passé à L3) — possible UX à revoir post-pilote.
