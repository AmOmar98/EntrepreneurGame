# Requirements — Entrepreneur Game (Pilot 13-14 mai 2026)

**Source** : `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md` §3
**Cadrage** : Project A (5 jours solo dev). MUST = non-négociable, SHOULD = tenté J4-J5, COULD = V2.

---

## v1 Requirements (Pilot Project A)

### AUTH — Authentification & sessions

- [ ] **AUTH-01** : Player/Mentor/GameMaster peut se connecter avec email + mot de passe initial via Supabase Auth, et obtenir une session persistante (cookies SSR)
- [ ] **AUTH-02** : Visiteur non authentifié sur route protégée est redirigé vers `/login?redirect=<path>` par le middleware
- [ ] **AUTH-03** : Player peut se déconnecter depuis n'importe quelle page et revenir à `/login`
- [ ] **AUTH-04** : Le rôle (`player` / `mentor` / `gamemaster`) est attaché à l'utilisateur côté DB et fait foi pour le routing et les RLS

### ONBOARD — Onboarding & création comptes

- [ ] **ONBOARD-01** : GameMaster peut uploader un CSV (colonnes : team_name, project_name, project_pitch, leader_email, member_emails) sur `/admin/players/import` ; pour chaque équipe, l'app crée le Player, les PlayerMembers, et envoie un magic link Supabase aux emails fournis. L'opération est idempotente (ré-upload OK).
- [x] **ONBOARD-02** : Au premier login, si le profil Player n'a pas `onboarded_at`, il est redirigé vers `/onboarding`
- [x] **ONBOARD-03** : Sur `/onboarding`, Player confirme nom équipe + nom projet + idée courte (textarea ≤ 500 chars) + diagnostic initial 5 questions Likert 1-5 + cases à cocher membres présents ; soumission marque `onboarded_at = now()` et accorde Score Engagement +10

### EVENT — Événement et configuration

- [x] **EVENT-01** : Au déploiement, un Event seed « Hack-Days Fès-Meknès Mai 2026 » est créé avec 6 Missions correspondant aux ateliers du programme PDF Tamwilcom et ~9 DeliverableTemplates (Business Model Canvas, Étude de marché, Fiche Personae, Fiche Produit + Plan Dév, Coûts & prévisions ventes, Stratégie prix/ventes/canaux, + livrables ateliers 3-4-5 à confirmer)
- [x] **EVENT-02** : Chaque DeliverableTemplate a une `scoring_rubric` JSONB (4-5 critères pondérés selon brief Section 14) et un `due_at` aligné sur la timeline du programme
- [ ] **EVENT-03** : Les 8 Levels (Niveau 0 à 7 du brief) sont seedés en table de référence statique au déploiement
- [ ] **EVENT-04** : Toutes les tables liées (players, missions, submissions, pitch_scores) ont une colonne `event_id NOT NULL` ; pour le pilote, hardcodée à l'event seed (multi-event = SHOULD/V2)

### JOURNEY — Parcours Player

- [ ] **JOURNEY-01** : Sur `/journey`, Player voit en header le nom de son équipe, son niveau actuel (déduit du dernier livrable validé), et son Score Projet en temps réel
- [ ] **JOURNEY-02** : Sur `/journey`, Player voit la timeline des ateliers du jour avec statut (à venir / en cours / passé)
- [ ] **JOURNEY-03** : Sur `/journey`, Player voit la liste des DeliverableTemplates du jour, chacun avec son statut (à rendre / brouillon / soumis V1 / feedback reçu / V2 soumis / validé) et un bouton d'action (Soumettre / Voir feedback / Re-soumettre)

### SUBMIT — Soumission de livrables

- [ ] **SUBMIT-01** : Sur `/journey/deliverable/[id]`, Player peut soumettre une `Submission` avec au moins un de `proof_url` (https://) ou `proof_text` (markdown ≤ 4000 chars) ; validation Zod côté server action
- [ ] **SUBMIT-02** : Une Submission V1 (status=`submitted_v1`) ne peut plus être modifiée par le Player tant que le Mentor n'a pas demandé V2
- [ ] **SUBMIT-03** : Si le Mentor demande V2 (verdict=`revision`), le Player peut soumettre une nouvelle Submission V2 (version=2, status=`submitted_v2`) ; le score final retenu est celui de V2
- [ ] **SUBMIT-04** : Le Player ne peut pas soumettre de livrable d'un autre Player (vérification owner via `player_members` + `auth.getUser()`) — RLS + check applicatif

### EVAL — Évaluation Mentor

- [ ] **EVAL-01** : Sur `/mentor`, Mentor voit la liste de tous les Players de la cohorte avec score Projet courant, nb livrables soumis / total, filtre « livrables en attente »
- [ ] **EVAL-02** : Sur `/mentor/submission/[id]`, Mentor voit le contenu de la Submission (lien et/ou texte), un formulaire de scoring selon la `scoring_rubric` du DeliverableTemplate (un input numérique par critère), un champ feedback texte, et 3 boutons : « Valider V1 » / « Demander V2 » / « Rejeter »
- [ ] **EVAL-03** : Soumettre une évaluation crée une `Evaluation` row avec `scoring_breakdown` (JSONB), `total_score`, `feedback_text`, `verdict` ; met à jour le statut de la Submission et recalcule le Score Projet du Player

### SCORE — Calcul de scores

- [ ] **SCORE-01** : Le Score Projet d'un Player est la somme des `total_score` des Evaluations validées sur ses Submissions, calculé serveur (jamais saisi côté client)
- [ ] **SCORE-02** : Le Score Projet est consultable temps réel par le Player sur `/journey`, par le Mentor sur `/mentor`, et par le GameMaster sur `/admin`

### JURY — Pitch jury jour 2

- [ ] **JURY-01** : Sur `/jury` (accès Mentor), pour chaque Player de la cohorte, le Mentor-Juré peut saisir 5 notes (clarté pitch / structure deck / crédibilité / qualité roadmap / qualité oral), chacune sur 20 points
- [ ] **JURY-02** : Une soumission jury crée une `PitchScore` row (juror_id × player_id, contrainte unique) ; resoumission = update
- [ ] **JURY-03** : Le classement final est calculé : pour chaque Player, moyenne des PitchScore + Score Projet pondéré (pondération configurable, par défaut 50/50)
- [ ] **JURY-04** : Sur `/results`, GameMaster voit le classement complet ; les autres rôles voient une page « Résultats à venir » jusqu'à `events.results_published_at`
- [ ] **JURY-05** : GameMaster peut publier les résultats via un bouton « Publier » qui set `events.results_published_at = now()` ; à partir de ce moment, `/results` est accessible à tous

### ADMIN — Vue GameMaster

- [ ] **ADMIN-01** : Sur `/admin`, GameMaster voit un tableau de tous les Players avec colonnes : nom équipe / projet, Niveau actuel, Score Projet, Statut (en avance / à l'heure / retard), Prochain livrable
- [ ] **ADMIN-02** : Sur `/admin`, GameMaster voit des compteurs globaux : livrables soumis / total, en attente revue, validés
- [ ] **ADMIN-03** : Sur `/admin/players/[id]`, GameMaster voit le détail d'un Player : membres, toutes les Submissions, toutes les Evaluations, scores
- [ ] **ADMIN-04** : Sur `/admin/export/players.csv`, GameMaster télécharge la liste des Players avec leurs scores au format CSV

### BRAND — Branding et polish UI

- [ ] **BRAND-01** : Header avec logo EIC sur toutes les pages authentifiées
- [ ] **BRAND-02** : Page `/login` (et page accueil non-auth si exposée) affiche le bandeau partenaires : Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF
- [ ] **BRAND-03** : Palette et typographie alignées sur l'identité visuelle EIC (assets fournis par Omar — voir spec §7 décision 6)
- [ ] **BRAND-04** : Polish tactique sur 5 écrans clés (login, onboarding, journey, mentor, admin) — cohérence visuelle, espacements, états vides explicites, états de chargement
- [ ] **BRAND-05** : Aucune mention de seed apparente (suppression de `atlas-soil` et autres références démo en prod)

### DATA — Persistence & sécurité

- [ ] **DATA-01** : Schema Postgres appliqué sur le projet Supabase prod (création/migration). Comprend les tables : events, levels, missions, deliverable_templates, cohorts, players, player_members, submissions, evaluations, pitch_scores, et leurs FK + index sur les FK chaudes
- [ ] **DATA-02** : RLS policies en place : Player ne voit que ses propres Submissions/Evaluations + données publiques (DeliverableTemplates, Missions, Levels, Event public info) ; Mentor voit tous les Players de l'event ; GameMaster voit tout. Test exhaustif RLS avec 2 comptes Player factices avant 13 mai.
- [x] **DATA-03** : `lib/workflow-data.ts` ne tombe plus sur le seed quand `hasSupabaseEnv()` est true et que la DB est vide → retourne tableaux vides (suppression du leak)
- [x] **DATA-04** : Toutes les server actions retournent un `WorkflowState = { ok, message, data? }` ; aucune `return;` silencieuse, aucune erreur Supabase swallow
- [ ] **DATA-05** : Lucide-react repinné à une version résolue correctement (corrige le `^1.14.0` suspect identifié dans `.planning/codebase/CONCERNS.md`)
- [ ] **DATA-06** : Code mort supprimé : `BonusEvent`, `bonusRules`, `prestige_xp`, enums `Stage`/`Checkpoint`/`MaturityPhase`/`BonusType`, pages `/committee`, `/admin/game`, `/admin/startups`, mailto drafts, exports `committee.csv`/`eml`/`kpi-snapshot`. `lib/data.ts` éclaté en `lib/types.ts` + `lib/seed/*.ts` + `lib/score.ts` + `lib/icons.ts`.

### DEPLOY — Déploiement

- [ ] **DEPLOY-01** : App déployée sur Vercel sur un domaine accessible (`entrepreneur-game.vercel.app` ou domaine custom EIC selon décision §7)
- [ ] **DEPLOY-02** : Variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurées sur Vercel pointant vers le projet Supabase prod
- [ ] **DEPLOY-03** : Smoke test E2E manuel passant : signup admin → import CSV → login Player → onboarding → submit livrable → login Mentor → évaluation → V2 → publication résultats. Effectué en J5 sur l'URL prod.

---

## v1.5 Requirements (SHOULD — tentés J4-J5)

- [ ] **NOTIF-01** : Badge in-page sur header avec compte de notifications non-lues (déclenché quand Mentor évalue un livrable du Player)
- [ ] **SCORE-03** : Score Engagement calculé serveur (présence onboarding +10, livrable rendu V1 +10, V2 soumis +5, livrable rendu dans temps imparti de l'atelier +5). Affiché sur `/admin` quand activé.
- [ ] **EVENT-05** : Schema multi-event prêt (event_id partout, levels 0-7 tous référencés)
- [ ] **RESOURCE-01** : Page `/resources` statique avec liens vers gabarits BMC, Personae template, etc.

---

## v2 / Out of Scope (Project B post-pilote)

- Score Entrepreneur multi-axes (Hard Skills / Soft Skills / Mindset) — V2
- Badges automatiques + page badges + déblocage par condition — V2
- Classements multiples (général / progression / impact / engagement / collaboration) — V2
- Rôle Expert distinct + Comité programme — V2
- Bonus events / Malus / prestige XP réintroduits proprement si besoin — V2
- Mailto drafts — supprimés
- Exports avancés (committee dossier, EML, kpi-snapshot) — supprimés
- Pages `/committee`, `/admin/game`, `/admin/startups` — supprimées
- Tests automatisés (Vitest + Playwright + pgTAP RLS), CI GitHub Actions, Sentry/observabilité — V2
- Audit log écriture — V2 (table existe)
- Multi-cohort actif, multi-event actif — V2 (schema autorise)
- Mobile-first deep + accessibilité avancée — V2
- Rate limiting server actions — V2
- Archivage proofs (URL rot mitigation) — V2
- Suivi long terme post-Hack-Days en features dédiées (mentoring continu, livrables additionnels) — V2

---

## Traceability (rempli par roadmap)

| REQ-ID | Phase | Status |
|---|---|---|
| AUTH-01..04 | (à mapper) | pending |
| ONBOARD-01..03 | (à mapper) | pending |
| EVENT-01..04 | (à mapper) | pending |
| JOURNEY-01..03 | (à mapper) | pending |
| SUBMIT-01..04 | (à mapper) | pending |
| EVAL-01..03 | (à mapper) | pending |
| SCORE-01..02 | (à mapper) | pending |
| JURY-01..05 | (à mapper) | pending |
| ADMIN-01..04 | (à mapper) | pending |
| BRAND-01..05 | (à mapper) | pending |
| DATA-01..06 | (à mapper) | pending |
| DEPLOY-01..03 | (à mapper) | pending |
| NOTIF-01, SCORE-03, EVENT-05, RESOURCE-01 | (SHOULD) | pending |

---

*Source spec : `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md`*
*Source brief : `entrepreneur_game_brief.md` (Section 18.1 Format court Bootcamp 2-3 jours)*
*Source programme : `Programme Hack'Days 16&17 Avril 2026.pdf` (Tamwilcom, dates pilote = 13-14 mai 2026)*
