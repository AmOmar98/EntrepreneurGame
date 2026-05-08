# Roadmap — Entrepreneur Game Pilot 13-14 mai 2026

**Project A** — strict nécessaire pour onboarding + workshop avec 6-15 startups réelles.
**Source** : spec `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md` §5.

5 phases, 1 par jour de dev. Chaque phase produit un état déployable et testable.

---

## 🚧 **v0.1 Pilot Hack-Days Fès-Meknès** — Phases 1-5 (in progress)

---

## Phase 1: Foundation (Schema + Types + Suppression code obsolète)

**Quand** : 2026-05-09 (J1)
**Goal:** avoir un schema Postgres aligné sur le brief, des types TS cohérents, le code obsolète supprimé, et un login qui marche en local sur Supabase prod fresh.
**Depends on:** —
**UI hint** : non

**Requirements couverts** : DATA-01, DATA-04, DATA-05, DATA-06, AUTH-01, AUTH-02, AUTH-03, AUTH-04, EVENT-03, EVENT-04 *(schema)*, BRAND-05 *(suppression atlas-soil etc.)*

**Success Criteria:**
1. Schema Postgres appliqué sur projet Supabase prod fresh, comprenant : events, levels, missions, deliverable_templates, cohorts, players, player_members, submissions, evaluations, pitch_scores + index sur FK chaudes
2. Types TS regénérés ou réécrits dans `lib/types.ts` ; `lib/data.ts` éclaté en `lib/types.ts` + `lib/seed/*.ts` + `lib/score.ts` + `lib/icons.ts`
3. Code mort supprimé du repo (BonusEvent, Checkpoint, MaturityPhase, prestige_xp, pages committee/admin-game/admin-startups, mailto drafts, exports committee/eml/kpi-snapshot)
4. Login email/password sur `/login` fonctionne en local et redirige vers le bon dashboard selon rôle
5. Lucide-react repinné, build npm passe sans warning suspect, `npm run lint` et `npm run typecheck` clean

**Plans:** 6 plans

Plans:
- [x] 01-01-PLAN.md — Fresh Postgres schema + triggers + RLS
- [x] 01-02-PLAN.md — Hard-delete obsolete pages, exports, components, server actions
- [x] 01-03-PLAN.md — Split lib/data.ts into types/seed/score/icons
- [x] 01-04-PLAN.md — Move route folders coach->mentor, startup->player
- [x] 01-05-PLAN.md — Login email/password + role-based redirect + role-aware stub pages
- [x] 01-06-PLAN.md — Repin lucide-react, clean lint/typecheck/build, phase summary

---

## Phase 2: Player Flow (Onboarding + Journey + Submission)

**Quand** : 2026-05-10 (J2)
**Goal:** un Player peut se logger, faire son onboarding (Niveau 0), voir sa progression, et soumettre un livrable V1 sur un DeliverableTemplate.
**Depends on:** Phase 1
**UI hint** : oui

**Requirements couverts** : ONBOARD-02, ONBOARD-03, EVENT-01, EVENT-02, JOURNEY-01, JOURNEY-02, JOURNEY-03, SUBMIT-01, SUBMIT-02, SUBMIT-04, DATA-03 *(suppression seed leak)*

**Success Criteria:**
1. Au premier login d'un Player sans `onboarded_at`, redirect vers `/onboarding` et formulaire complet (nom équipe, idée, diagnostic 5 questions, membres) ; soumission sets `onboarded_at`
2. Sur `/journey`, Player voit header (équipe, niveau, score), timeline ateliers du jour, liste des DeliverableTemplates avec statuts corrects
3. Sur `/journey/deliverable/[id]`, Player peut soumettre une Submission V1 (proof_url ou proof_text) ; après soumission, statut = `submitted_v1` et formulaire se verrouille
4. Player ne peut pas accéder à `/journey/deliverable/[id]` d'un autre Player (RLS + check applicatif) ni soumettre pour un autre Player
5. En mode Supabase prod, aucune fuite du seed (`atlas-soil`, etc.) — `lib/seed/index.ts` retourne tableaux vides quand env Supabase est present

**Plans:** 5 plans

Plans:
- [x] 02-01-PLAN.md — Onboarding Niveau 0 form + saveOnboarding action + middleware redirect
- [x] 02-02-PLAN.md — /journey page (header + timeline + deliverables list with status)
- [x] 02-03-PLAN.md — /journey/deliverable/[id] page + submitDeliverable V1 action
- [x] 02-04-PLAN.md — Seed Event Hack-Days SQL idempotent + DATA-03 anti-leak audit
- [x] 02-05-PLAN.md — Polish i18n + smoke test E2E manuel + handoff Phase 3

---

## Phase 3: Mentor Flow (Évaluation + Boucle V1→V2 + Scoring)

**Quand** : 2026-05-11 (J3)
**Goal:** un Mentor peut évaluer une Submission selon la grille, donner un feedback, choisir un verdict ; le Player voit le feedback et peut soumettre V2.
**Depends on:** Phase 2
**UI hint** : oui

**Requirements couverts** : EVAL-01, EVAL-02, EVAL-03, SUBMIT-03, SCORE-01, SCORE-02

**Success Criteria:**
1. Sur `/mentor`, Mentor voit la liste des Players avec score Projet courant, nb livrables soumis / total, filtre « livrables en attente de revue »
2. Sur `/mentor/submission/[id]`, Mentor remplit la grille de scoring (un input par critère de la rubric), un feedback texte, et choisit verdict « Valider V1 » / « Demander V2 » / « Rejeter »
3. La soumission de l'évaluation crée une Evaluation row, met à jour le statut Submission, et recalcule le Score Projet du Player en serveur
4. Si verdict = « Demander V2 », le Player voit le feedback sur `/journey` (statut « feedback reçu ») et peut soumettre une Submission V2 ; le score final retenu = score V2
5. Mentor ne peut évaluer 2× la même Submission (contrainte unique ou check applicatif renvoyant erreur visible)

**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md — Page /mentor liste Players + filtre en attente
- [x] 03-02-PLAN.md — /mentor/submission/[id] form + evaluateSubmission action + score recompute
- [x] 03-03-PLAN.md — /journey feedback display + V2 submission flow
- [x] 03-04-PLAN.md — Polish i18n + smoke test E2E + handoff Phase 4

---

## Phase 4: GameMaster + Bulk Import + Branding + Page accueil

**Quand** : 2026-05-12 (J4)
**Goal:** GameMaster peut tout piloter (dashboard, import CSV, export, détail Player) ; l'app a une identité visuelle EIC professionnelle ; page d'accueil avec partenaires.
**Depends on:** Phase 3
**UI hint** : oui

**Requirements couverts** : ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ONBOARD-01, BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05

**Success Criteria:**
1. Sur `/admin`, GameMaster voit le tableau cohorte (Player, Niveau, Score Projet, Statut, Prochain livrable) + compteurs globaux
2. Sur `/admin/players/import`, GameMaster uploade un CSV ; l'app crée les Players, PlayerMembers, et envoie magic links Supabase ; ré-upload est idempotent
3. Sur `/admin/players/[id]`, GameMaster voit le détail Player (membres, submissions, evaluations, scores)
4. Sur `/admin/export/players.csv`, GameMaster télécharge la liste Players + scores en CSV
5. App a une identité visuelle EIC cohérente (logo header, palette, typographie) ; page `/login` montre bandeau partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF) ; aucune mention `atlas-soil` ou seed démo apparente

---

## Phase 5: Pitch Jury + Results + Smoke Test E2E + Déploiement Vercel prod

**Quand** : 2026-05-13 (J5 matin)
**Goal:** page jury fonctionnelle pour le jour 2, classement publié à 15h, app déployée en prod sur Vercel, smoke test E2E réussi avec données seed pilote, magic links envoyés à des testeurs internes pour répétition.
**Depends on:** Phase 4
**UI hint** : oui

**Requirements couverts** : JURY-01, JURY-02, JURY-03, JURY-04, JURY-05, DATA-02 *(RLS test exhaustif)*, DEPLOY-01, DEPLOY-02, DEPLOY-03

**Success Criteria:**
1. Sur `/jury`, Mentor saisit pour chaque Player les 5 notes pitch (×20 chacune) ; resoumission update la PitchScore existante (contrainte unique juror×player)
2. `/results` affiche le classement (moyenne PitchScore + Score Projet pondéré) ; pour les rôles non-GameMaster, page « Résultats à venir » jusqu'à `events.results_published_at` ; bouton GameMaster « Publier » set le timestamp
3. App déployée sur Vercel (`entrepreneur-game.vercel.app` ou domaine custom EIC) avec env vars Supabase prod configurées
4. Smoke test E2E manuel passant : import CSV admin → magic link reçu → login Player → onboarding → submit → login Mentor → évaluation → V2 → soumission jury → publication résultats — sur l'URL prod
5. Test RLS exhaustif : 2 comptes Player factices ne voient pas leurs données mutuelles ; Mentor voit tous ; GameMaster voit tout
6. Magic links envoyés à 6-15 testeurs internes (Omar + collègues UEMF) pour répétition la veille du pilote

---

## Phases SHOULD (si J5 fini en avance)

### Phase 6 — Notifications & Engagement (S1, SCORE-03)

**Quand** : 2026-05-13 (J5 après-midi) si buffer
**Goal** : badges in-page de notifs non-lues + Score Engagement calculé serveur affiché sur `/admin`
**Depends on** : Phase 5
**Requirements couverts** : NOTIF-01, SCORE-03

### Phase 7 — Multi-event readiness + Resources (S3, S4)

**Quand** : 2026-05-13 si buffer
**Goal** : schema multi-event prêt (event_id partout, levels 0-7 référencés en table), page Resources statique avec gabarits
**Depends on** : Phase 5
**Requirements couverts** : EVENT-05, RESOURCE-01

---

## Hors-roadmap pilote (Project B — post-pilote)

Voir `PROJECT.md` § Out of Scope. Brainstorming Project B après le 14 mai en s'appuyant sur les retours du pilote (`/gsd-new-milestone`).

---

## Coverage check

Tous les MUST (M1-M12) sont mappés à au moins une phase :

| MUST | Phase principale |
|---|---|
| M1 (Auth) | Phase 1 |
| M2 (Bulk import) | Phase 4 |
| M3 (Onboarding) | Phase 2 |
| M4 (Event seed) | Phase 1 (schema) + Phase 2 (seed data) |
| M5 (Journey) | Phase 2 |
| M6 (Submit V1/V2) | Phase 2 (V1) + Phase 3 (V2 boucle) |
| M7 (Mentor évaluation) | Phase 3 |
| M8 (V1→V2) | Phase 3 |
| M9 (GameMaster) | Phase 4 |
| M10 (Pitch + Results) | Phase 5 |
| M11 (Branding) | Phase 4 |
| M12 (Persistence + RLS) | Phase 1 (schema) + Phase 2 (anti-leak) + Phase 5 (RLS test exhaustif) + Phase 1/3 (server actions non silencieuses) |

✓ Tous les v1 requirements couverts par les phases 1-5.

---

*Last updated: 2026-05-08 after Phase 2 plan creation*
