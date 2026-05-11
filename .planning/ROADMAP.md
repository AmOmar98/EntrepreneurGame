# Roadmap — Entrepreneur Game Pilot 13-14 mai 2026

**Project A** — strict nécessaire pour onboarding + workshop avec 6-15 startups réelles.
**Source** : spec `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md` §5.

5 phases, 1 par jour de dev. Chaque phase produit un état déployable et testable.

---

## ✅ **v0.1 Pilot Hack-Days Fès-Meknès** — Phases 1-5 (complete - pilot-ready)

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

**Plans:** 6 plans

Plans:
- [x] 04-01-PLAN.md — /admin cohort dashboard (table + counters)
- [x] 04-02-PLAN.md — /admin/players/import CSV upload + bulk create + magic link invite
- [x] 04-03-PLAN.md — /admin/players/[id] detail page
- [x] 04-04-PLAN.md — /admin/export/players.csv route handler
- [x] 04-05-PLAN.md — Branding (palette, logo, login partner banner, root redirect)
- [x] 04-06-PLAN.md — Polish + smoke test E2E (checkpoint)

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

**Plans:** 5 plans

Plans:
- [x] 05-01-PLAN.md — /jury page + savePitchScoreFlow (5 notes x20, upsert juror x player)
- [x] 05-02-PLAN.md — /results page + lib/results.ts ranking + publishResultsFlow (gate)
- [x] 05-03-PLAN.md — RLS exhaustive test (DATA-02) + magic link invites internal testers
- [x] 05-04-PLAN.md — Vercel deploy config + smoke test E2E template
- [x] 05-05-PLAN.md — Phase closeout (final smoke + summary + docs)

**Phase 5 status** : ✅ Complete (2026-05-08). 9 requirements valides : JURY-01..05, DATA-02, DEPLOY-01..03. Voir `.planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/05-PHASE-SUMMARY.md`.

---

## ✅ **v0.2 EIC Design v2 Refresh** — Phases 6-9 (implementation complete pending human verification)

**Cadrage v0.2** : refonte visuelle + UX selon le bundle Claude Design `.planning/design-v2/`. La fonctionnalité v0.1 reste intacte. Mode qualité sans deadline : chaque phase commit atomique → fallback v0.1 garanti à tout moment via `git reset --hard v0.1-pilot-ready`.

**Pré-requis opérateur** : tag `v0.1-pilot-ready` posé localement sur `8176419`. `git push --tags` recommandé (rollback distant possible si Phase 6 casse le shell partagé).

**Couplages atomiques explicites (DoD-bloquants)** :
- DSY-04 (composants partagés) = DoD-bloquant Phase 6 → Phases 7-9 en dépendent.
- PLR-03 (hero unique) + PLR-04 (drawer) → 1 commit atomique en Phase 7.
- GMR-01 (toggle live) + GMR-02 (radar) → 1 commit atomique en Phase 9 (pulsations calibrées fond sombre).
- GMR-08 (bandeau alert) AVANT GMR-07 (Pixel SVG) en Phase 9 — bandeau seul reste shippable.

**Source de vérité design** : `.planning/design-v2/` (bundle Claude Design exporté 2026-05-08, voir `chats/chat1.md`).

---

## Phase 6: Design System EIC — Tokens + Composants partagés + AppShell + Login branded

**Goal:** la fondation visuelle EIC v2 est en place — tokens CSS, polices self-hosted, composants partagés `<Button>`/`<Pill>`/`<LevelBadge>`/`<ProgressBar>`, AppShell refondu, login branded — sans casser les écrans v0.1 existants.
**Depends on:** Phase 5 (v0.1 pilot-ready préservé) — git tag `v0.1-pilot-ready` posé en pré-requis opérateur
**UI hint** : oui

**Requirements couverts** : DSY-01, DSY-02, DSY-03, DSY-04, DSY-05, DSY-06, DSY-07

**Success Criteria** (what must be TRUE):
1. Player/Mentor/GameMaster qui se connecte voit la palette EIC (bleu `#1B3A5C`, vert `#2E7D32`, ivoire `#F6F1E8`) sur toutes les surfaces principales (login, journey, mentor, admin) — aucun reste de slate/blue v0.1 sur les pages refondues. Les tokens v0.1 legacy (`--brand-*`, `--green`, `--blue`) restent définis en parallèle des `--eic-*` pour ne pas casser les composants v0.1 non touchés.
2. Toutes les pages chargent Baskervville (titres `<h1>`-`<h4>`) + Montserrat (corps) via `next/font/google` (self-hosted, zéro round-trip réseau, zero `@import url(...)` synchrone). LCP `/login` reste sous 2.5s sur 3G simulé.
3. Visiteur sur `/login` voit la page refondue : background ivoire avec aurora doux, logo EIC haut-gauche, bandeau partenaires (Tamwilcom, BoA Academy, Innov Invest, Bluespace, EIC, UEMF), formulaire centré sur card glass — fallback `@supports not (backdrop-filter: blur(1px))` rend la card en blanc 92% opaque sur Android Chrome <90.
4. Développeur peut importer `<Button variant="primary|success|ghost">`, `<Pill tone="blue|green|amber|rose">`, `<LevelBadge state="done|current|locked">`, `<ProgressBar value={0..1}>` depuis `components/ui/` — chaque primitive a un seul responsable de styles (pas d'inline `style={...}` ad hoc dans les pages refondues).
5. AppShell : Player voit topbar légère + tab bar mobile bottom (sidebar dark green retirée chez Player) ; Mentor + GameMaster gardent la sidebar restylée tokens EIC.
6. `npm run typecheck` passe sans erreur, `npm run lint` sans nouveau warning, `npm run build` produit un bundle qui se sert correctement en prod.

**Plans:** 4/4 plans complete

Plans:
- [x] 06-01-PLAN.md — Tokens EIC + next/font/google + glass/aurora utilities (DSY-01, DSY-02, DSY-03)
- [x] 06-02-PLAN.md — 5 primitives partagées Button/Pill/LevelBadge/ProgressBar/EICLogo (DSY-04)
- [x] 06-03-PLAN.md — AppShell variant player/staff + TopbarLite + MobileTabBar + sidebar restyle (DSY-05)
- [x] 06-04-PLAN.md — Login refondu EIC + PartnerBanner typographique + build sanity + SMOKE-PHASE-06.md (DSY-06, DSY-07)

**Phase 6 status** : ✅ Complete (2026-05-10). 7/7 DSY requirements livrés. SMOKE 7/7 passed. Voir `.planning/phases/06-*/06-PHASE-SUMMARY.md`.

---

## Phase 7: Joueur — Barre de charge L0→L7 + Drawer + Onboarding 3 étapes + Ticket SOUMIS

**Goal:** le Player vit le journey refondu — barre verticale L0→L7 (descendante desktop, ascendante mobile), hero unique « Prochaine étape » avec drawer livrables, onboarding 3 étapes éditoriales, ticket SOUMIS avec stamp, écran révision V2 pédagogique.
**Depends on:** Phase 6 (composants partagés DSY-04 + AppShell topbar léger DSY-05)
**UI hint** : oui

**Requirements couverts** : PLR-01, PLR-02, PLR-03, PLR-04, PLR-05, PLR-06, PLR-07, PLR-08

**Success Criteria** (what must be TRUE):
1. Player sur `/journey` desktop (≥1100px) voit la barre verticale L0→L7 **descendante** (top=L7 pitch, bottom=L0 diagnostic) ; sur mobile (<1100px) la barre est **ascendante** (bottom=L0, top=L7 sommet à atteindre). Niveau courant pulsé bleu, niveaux faits verts, niveaux locked grisés/dashed.
2. Player voit au-dessus de la barre un hero unique « Prochaine étape » avec UN seul CTA primaire visible (le prochain livrable à rendre OU « Voir le feedback » si V2 demandée) — jamais de secondary action sur le hero. Hover/clic sur un niveau ouvre un drawer latéral (~400px desktop, full-width mobile) avec les missions/livrables de ce niveau, chaque mission rendue comme card (code `M3.1`, titre FR, statut pill, reward XP, bouton action contextuel). [PLR-03 + PLR-04 = 1 commit atomique]
3. Player en première session (`onboarded_at IS NULL`) traverse 3 étapes éditoriales sur `/onboarding` avec navigation `← Précédent / Suivant →` : (1) bienvenue + chiffres clés Hack-Days, (2) ton équipe avec coéquipiers chargés depuis `player_members`, (3) 3 règles du jeu en numéros éditoriaux. Soumission finale = redirect `/journey`.
4. Player après soumission V1 sur `/journey/deliverable/[id]` voit l'écran SOUMIS éditorial : fond cream avec sunburst rays, gros « +XP » en gradient, ticket avec stamp « SOUMIS » rotated, sentence soumise, CTA primaire « Retour au journey ».
5. Player après verdict `revision` du Mentor voit `/journey/deliverable/[id]` avec : message mentor en haut, checklist « Ce qui passe ✓ / Ce qui manque ⚠ », bandeau vert pédagogique « Votre V1 est conservé. Le V2 affine, il ne remplace pas votre démarche initiale. », CTA « Soumettre un nouveau lien ».
6. Player après V1 (avant verdict) voit dans le drawer la card livrable en état « En revue » avec timestamp + nom mentor assigné (ex: « Sami K. · soumis il y a 8 min ») — évite le silence muet entre V1 et feedback.

**Plans:** 4/4 plans complete

Plans:
- [x] 07-01-PLAN.md — JourneyTrack + DeliverableDrawer + HeroNextStep (PLR-01, PLR-02, PLR-03, PLR-04, PLR-08) [atomic PLR-03+PLR-04]
- [x] 07-02 (inline) — Onboarding 3 étapes éditoriales welcome/team/rules (PLR-05)
- [x] 07-03 (inline) — Submission ticket post-V1 cream + sunburst rays + stamp rotated (PLR-06)
- [x] 07-04 (inline) — Revision V2 panel pédagogique + cleanup unused v0.1 components (PLR-07)

**Phase 7 status** : ✅ Complete (2026-05-10) — implementation. 8/8 PLR requirements livrés en 7 commits atomiques. VERIFICATION status : `human_needed` (visual review attendu). Voir `.planning/phases/07-*/07-VERIFICATION.md`.

---

## Phase 8: Mentor — Vue lien + Historique + Commentaires async tagués + Action attendue

**Goal:** le Mentor évalue une soumission link-based (URL ou texte) avec commentaires async tagués (`remarque`/`à corriger`), historique V1/V2, champ « Action attendue » obligatoire en cas de demande V2, et confirmation post-évaluation explicite — sans aucun chat live ni Realtime.
**Depends on:** Phase 7 (les commentaires Mentor s'affichent côté Player sur l'écran révision PLR-07)
**UI hint** : oui

**Requirements couverts** : MNT-01, MNT-02, MNT-03, MNT-04, MNT-05, MNT-06

**Success Criteria** (what must be TRUE):
1. Mentor sur `/mentor/submission/[id]` voit le lien soumis comme objet central : card avec type détecté (Google Docs / GitHub / Notion / autre selon hostname), URL cliquable, note jointe (texte de la submission), bouton « Ouvrir ↗ » ouvre le lien dans un nouvel onglet.
2. Mentor voit sous la submission courante l'historique des liens (V1 puis V2 si soumise), chacun avec sa date et son lien — file antichrono, pas de threading.
3. Mentor peut ajouter des commentaires tagués (`remarque` neutre / `à corriger` rouge) au niveau du livrable via un composer textarea + select tag ; chaque commentaire est persisté avec auteur+timestamp et visible côté Player sur l'écran révision (PLR-07). Tous les commentaires sont des posts async en liste antichrono — aucun chat live, aucun WebSocket / Supabase Realtime.
4. Mentor avec verdict=`revision` est obligé de remplir un champ « Action attendue » (texte libre court, ex: « refaire le BMC en intégrant le feedback ») persisté dans `evaluations.feedback_text` ou colonne dédiée — la soumission échoue côté server action si le champ est vide en cas de verdict=`revision`.
5. Mentor après soumission d'une évaluation voit un toast/banner de confirmation « Score envoyé · +X XP attribués à [équipe] · Player notifié » qui empêche la double-soumission par incertitude.

**Plans:** Implementation complete (atomic — 6 commits)

Plans:
- [x] DDL migration — `database/migrations/08-mentor-comments.sql` (evaluation_comments table + expected_action column + RLS)
- [x] mentor-link-card + link-type detection helper (MNT-01)
- [x] mentor-submission-history (MNT-02)
- [x] mentor-comments-list + composer + addEvaluationCommentFlow action (MNT-03)
- [x] evaluation refactor with required expected_action on revision verdict (MNT-04)
- [x] confirmation banner with form lock post-submit (MNT-05)
- [x] zero Realtime confirmed via grep (MNT-06)

**Phase 8 status** : ✅ Complete (2026-05-10) — implementation. 6/6 MNT requirements livrés. **Migration SQL à appliquer manuellement par Omar avant test E2E.** VERIFICATION status : `human_needed`. Voir `.planning/phases/08-*/08-VERIFICATION.md`.

---

## Phase 9: GameMaster + Jury + Replay + Pixel — Mode live + Radar + Pitch théâtre + Podium + Mascotte

**Goal:** GameMaster peut basculer `/admin` en mode live (radar pulsant fond sombre + bandeau status alert + mascotte Pixel), animer le pitch jury jour 2 en mode théâtre (timer 5 min + grille /5), publier le replay/podium éditorial, composer des annonces live ciblées, et activer/désactiver des deliverable_templates.
**Depends on:** Phase 8 (Mentor évalue → données alimentent radar XP) + Phase 6 (composants partagés)
**UI hint** : oui

**Requirements couverts** : GMR-01, GMR-02, GMR-03, GMR-04, GMR-05, GMR-06, GMR-07, GMR-08, GMR-09

**Success Criteria** (what must be TRUE):
1. GameMaster sur `/admin` peut basculer un toggle « Mode live » dans le topbar : (mode standard) tableau cohorte v0.1 stylé v0.2 / (mode live) fond sombre, radar de la salle (cercles XP des équipes), fil du jeu textuel en bas. Chaque équipe = cercle SVG dont taille = score Projet courant ; cercle vibre + pulsations rouges (CSS animation pure, pas de re-render React par tick) quand activité dans les 5 dernières minutes, gris/figé quand inactif >5 min. Visibilité par défaut = `gm_only` (Players ne voient PAS le radar). [GMR-01 + GMR-02 = 1 commit atomique]
2. GameMaster clique sur un cercle dans le radar → vue Focus équipe : layout éditorial avec gros « 01 » filigrane (numéro classement), titre Baskervville surdimensionné (équipe + projet italic), citation idée projet, avatars membres, bandeau stats vitales (Score Projet, niveau, livrables soumis, dernière activité), barre activité verticale à droite.
3. GameMaster sur `/admin` voit en topbar un bandeau status simple (texte + icône + CTA) qui détecte 4 états du hack — **serein** (vert, tout flue), **concentré** (bleu, phase de revue), **inquiet** (rouge, ≥3 équipes silencieuses >15 min), **euphorique** (orange, célébration en cours) — avec micro-action contextuelle (ex: « Réveiller les 3 équipes »). Ce bandeau (GMR-08) alimente la mascotte Pixel (GMR-07) qui reflète le même état.
4. GameMaster sur `/jury` jour 2 peut basculer un toggle « Mode pitch » → page théâtre : fond sombre, équipe en cours grand format avec timer 5 min décompte, file de passage ordonnée à droite, grille notation /5 sur 5 critères + textarea commentaire global, indicateur « X/5 jurés ont noté » en bas.
5. GameMaster publie les résultats → tout le monde voit `/results` en mode Replay : fond ivoire, hero verdict éditorial (« L'équipe Atlas remporte le Hack-Days 2026 »), podium 3 marches (or/argent/bronze), strip 5 stats globales, classement complet en tableau, timeline moments forts (manuelle, seedée par GM), bandeau exports (Certificats CSV / Rapport CSV / page publique).
6. GameMaster peut activer/désactiver un `deliverable_template` existant via un toggle on/off sur `/admin/deliverables` (ou intégré au tableau `/admin`) ; un template désactivé n'apparaît plus dans le journey des Players. Schema = ajout colonne `deliverable_templates.is_active boolean default true`, server action `toggleDeliverableActive(id)`, RLS GM-only (commit DDL atomique séparé). [Compromis minimal v0.2 du nouveau requirement « blocs préfaits éditables » — version complète différée v0.3.]
7. Mascotte Pixel SVG (blob doux + oreilles + yeux) floating bottom-right sur `/admin` mode live, 4 humeurs (serein/concentré/inquiet/euphorique) reflet du bandeau status (GMR-08), repliable en pill au clic.
8. GameMaster peut composer des annonces live sur `/admin/announce` (4 types info/urgence/célébration/appel, ciblage toutes/par niveau/équipes choisies/mentors, persistance DB via table `announcements`, lecture côté Player via reload, pas de Realtime).

**Plans:** Implementation complete (split en 2 agents — 12 commits)

Plans (Agent 9A — admin tools + jury théâtre + results replay) :
- [x] DDL migration — `database/migrations/09-gamemaster-live.sql` (deliverable_templates.is_active + announcements table + RLS)
- [x] /admin/deliverables toggle is_active + filter in lib/journey.ts (GMR-06)
- [x] /admin/announce composer 4 kinds × 4 targets + Player strip on /journey (GMR-09)
- [x] /jury pitch theater mode `?theater=1` + timer 5min + passage queue (GMR-04)
- [x] /results replay mode (podium SVG + 5 stats strip + hardcoded timeline moments) (GMR-05)

Plans (Agent 9B — admin live mode + radar + Pixel) :
- [x] team-activity + hack-status + admin-radar lib helpers
- [x] admin status banner 4 states (serein/concentré/inquiet/euphorique) (GMR-08) — committed BEFORE GMR-07 per ROADMAP DoD
- [x] admin live mode toggle `?live=1` + radar SVG + game flow + team focus (GMR-01+GMR-02 atomic + GMR-03)
- [x] Pixel mascot SVG with 4 moods reflecting status (GMR-07)

**Phase 9 status** : ✅ Complete (2026-05-10) — implementation. 9/9 GMR requirements livrés. **Migration SQL `09-gamemaster-live.sql` à appliquer manuellement par Omar avant test E2E.** VERIFICATION status : `human_needed`. Voir `.planning/phases/09-*/09-VERIFICATION.md`.

---

## Phase 10: T-3 Critical Gates + Design v2 Tail Sections

**Quand** : 2026-05-10 → 2026-05-12 (T-3 → T-1, urgent)
**Goal:** boucler v0.2 sur deux fronts en parallèle avant le pilote AgreenTech : (1) résoudre les 5 T-3 Critical Gates B1-B5 documentés dans `CLAUDE.md § T-3 Critical Gates`, (2) implémenter les 5 sections design absentes du bundle Claude Design v2 (10·Pitch prep H-2, 11·Coup de pouce, 12·Profil joueur, 13·États système, 14·Menu & réglages).
**Depends on:** Phase 6 (tokens), Phase 7 (`submission-ticket.tsx`), Phase 8 (migration SQL `08-mentor-comments.sql`), Phase 9 (`pixel-mascot.tsx`, `results-podium.tsx`, `results-replay.tsx`, migration SQL `09-gamemaster-live.sql`)
**UI hint** : oui

**Bloquants couverts** : B1 (R1 percée /results), B2 (pondération 20/80), B3 (migrations SQL prod), B4 (7 missions AgreenTech), B5 (member_emails — hors scope tech)

**Sections design couvertes** : 10·Pitch prep H-2, 11·Coup de pouce, 12·Profil joueur, 13·États système, 14·Menu & réglages

**Success Criteria** (what must be TRUE):
1. `lib/results.ts:30 DEFAULT_PITCH_WEIGHT = 0.8` (et non 0.5) ; commentaire `lib/results.ts:3` reflète 0.20/0.80 ; REQUIREMENTS.md JURY-03 mis à jour pour cohérence.
2. `combined.toFixed(1)` n'est rendu côté Player nulle part — gating par `isGameMaster` sur `components/results-podium.tsx:64-66` et `components/results-replay.tsx:126-134`. Side Player = annonce qualitative (Excellence / Trajectoire / Wildcards).
3. Migrations SQL `08-mentor-comments.sql` + `09-gamemaster-live.sql` appliquées en prod Supabase (vérifiable via `mcp__plugin_supabase_supabase__list_migrations`).
4. 7 missions AgreenTech (L1 hypothèse VP / L2.1 Persona / L2.2 Verbatims / L3 MoSCoW / L4 ROI/ha / L5 Plan acquisition / L6 Pitch + Bonus B) seedées en SQL et seed in-memory, avec rubric AgriTech (Innovation / Faisabilité / Modèle éco / Qualité × 5pts) et `severity: "warn"` sur tous les validators (R2 OK).
5. R1/R2/R3 cardinaux vérifiés : audit grep `+\${.*xp.*}` clean dans pages Player, aucun `disabled` ni `pointer-events: none` sur missions verrouillées de `journey-level-node.tsx`, aucun validator `severity: "error"` ou `blocking: true`.
6. Routes nouvelles créées et navigables : `/journey/help` (Coup de pouce), `/journey/pitch-prep` (Pitch prep H-2), `/settings` (Réglages). `app/player/[slug]/page.tsx` refondu (plus placeholder), gated par publication ranking.
7. États système unifiés via `components/system/Sys{Loading,Empty,Error,Offline}.tsx`, branchés sur `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`.
8. `components/pixel-mascot.tsx` étendu avec moods `loading` + `error` ; tokens mood vars dans `eic-tokens.css` ; classe `.eic-toast` dans `app/globals.css`.
9. `npm run typecheck` + `npm run lint` + `npm run build` clean.

**Plans:** 1 plan (à exploser en sous-plans après validation operator)

Plans:
- [ ] 10-01-PLAN.md — T-3 Critical Gates + Design v2 Tail Sections (8 sous-phases : T-3 Gates → Design system → Section 13 → 11 → 10 → 12 → 14 → Smoke E2E) — *patched 2026-05-10 via quick `260510-l3a`*

**Phase 10 status** : 📥 Imported via `/gsd-import --from C:\Users\omara\.claude\plans\glimmering-sauteeing-wilkinson.md` (2026-05-10). En attente exécution. Spawn `eic-pedagogical-advisor` AVANT toute édition des zones sensibles (cf. CONTEXT.md `<decisions>`).

---

## Phase 11: Design Audit Refinements (13 items, 4 waves)

**Quand** : 2026-05-10 → 2026-05-12 23h00 (T-1, avant cutoff merge `main` pré-pilote AgreenTech)
**Goal:** combler les 13 écarts identifiés entre le bundle design Anthropic v2 (`.planning/design-v2/`) et l'implémentation actuelle, sans casser R1/R2/R3 ni le freeze pré-pilote. Source : `.planning/ui-reviews/AUDIT-DESIGN-V2-VS-IMPL-2026-05-10.md`.
**Depends on:** Phase 6 (tokens), Phase 7 (journey-track + submission-ticket), Phase 9 (admin-radar), Phase 10 (system frames)
**UI hint** : oui

**Refinements couverts** : 13 items en 4 waves (A=CSS-only, B=animation/scroll, C=logic/UX advisor-required, D=cardinal-comment)

**Success Criteria** :
1. Wave A (4 items A1-A4) : shimmer cap, mount animation, node stagger, topbar pills. Diff visuel matches `player-screens.jsx:118-191`. Aucune régression aria-tree.
2. Wave B (5 items B1-B5) : smooth-scroll hero, mobile scroll-snap, IntersectionObserver `/results`, GM radar dashed lines, hero compact mobile. Reduced-motion guards sur tous les nouveaux keyframes.
3. Wave C (3 items C1-C3) : public landing 3 doors, dual-mode demo guard fix `/journey`, locked-level click softening R3. Spawn `eic-pedagogical-advisor` AVANT chaque item ; verdict `OK`/`WARN` requis pour proceed, `BLOCK` → defer.
4. Wave D (1 item D1) : commentaire protectif R1 sur `journey-client.tsx:122` totalXp display.
5. `npm run typecheck && npm run lint && npm run build` clean après chaque commit atomique (13 commits attendus).
6. Smoke E2E régression : demo mode (`/landing` → `/login` → `/journey` seed → `/results`) + prod-like (full Player journey + submit deliverable + ticket render) + mobile 390px + grep R1 audit clean.
7. 3 sous-agents reviewers (`eic-pedagogical-advisor` + `gsd-ui-checker` + `codex:rescue`) ont rendu un verdict avant toute édition. Tout `BLOCK` documenté dans `deferred-items.md`.

**Plans:** 1 plan orchestrator (4 waves)

Plans:
- [ ] 11-01-PLAN.md — Design Audit Refinements 13 items (Wave A CSS / Wave B animation / Wave C logic-advisor / Wave D cardinal comment)

**Phase 11 status** : 📥 Created 2026-05-10. PLAN.md prêt, en attente review parallèle 3 sous-agents (`eic-pedagogical-advisor` + `gsd-ui-checker` + `codex:rescue`) puis green-light operator. **NB risque T-1** : exécution avant cutoff 12/05 23h, surveiller advisor verdicts strictement.

**Patch 2026-05-10** (quick [`260510-l3a`](./quick/260510-l3a-patch-phase-10-plan-roadmap-post-quick-s/)) :
- Sub-tâches `10.0.2` (B1 percée R1 /results) et `10.0.7` (R3 tooltip ambre journey) marquées ✅ **DONE** post-quicks `260510-kpw` (commits `c740d48` + `16aa0f7`) et `260510-j2j` (commits `8f46892` + `25f830e` + `4733406` + `d49ad1b`).
- Path `eic-tokens.css` corrigé en `app/globals.css` (le fichier séparé n'existe pas — tokens dans `globals.css`).
- Phase 1.3 (Pixel `loading`/`error`) précisée : A5 a déjà livré `pixel-mascot-player.tsx` + `use-pixel-trigger.ts` via quick `260510-jm8`. Phase 10 = extension moods uniquement.
- Sub-tâche `10.0.3` (régénération 7 missions AgreenTech) absorbe A2/B3/B4 data-side de `T3-IMPROVEMENTS.md` (validators warn-only mots noirs L1 + ROI cohérence L4↔L2.1, extra_fields `hypothese_invalider`/`hypothese_revisee`, helper `cite_from_M2.2` slide 4 L6). UI side B4 (`Slide4Editor`) reportée en sous-task séparée.
- **Nouvelle sub-tâche `10.0.10`** : C3 ordre randomisé pitch + équipes ancres milieu (couplé 10.0.3, même seed event).
- **Hors scope Phase 10** : B5 (Excellence/Trajectoire scoring), C1 (notation différée jury), C2 (décomposition 5×/20 + σ), C4 (lettre retour PDF signée) — partent en `/gsd-quick` séparés ou v0.3.

---

## Phases SHOULD (si J5 fini en avance) — héritées v0.1

### Phase 6 — Notifications & Engagement (S1, SCORE-03) [renumérotée mentalement → différée]

**Quand** : post-pilote
**Goal** : badges in-page de notifs non-lues + Score Engagement calculé serveur affiché sur `/admin`
**Requirements couverts** : NOTIF-01, SCORE-03

### Phase 7 — Multi-event readiness + Resources (S3, S4) [renumérotée mentalement → différée]

**Quand** : post-pilote
**Goal** : schema multi-event prêt (event_id partout, levels 0-7 référencés en table), page Resources statique avec gabarits
**Requirements couverts** : EVENT-05, RESOURCE-01

*(Note : ces deux Phases SHOULD historiques portaient les numéros 6 et 7 dans la planification v0.1 ; v0.2 réutilise les numéros 6-9 pour le design refresh. Si l'un de ces SHOULD doit reprendre, il sera renuméroté Phase 10+ post-pilote.)*

---

## Hors-roadmap pilote (Project B — post-pilote)

Voir `PROJECT.md` § Out of Scope. Brainstorming Project B après le 14 mai en s'appuyant sur les retours du pilote (`/gsd-new-milestone`).

---

## Coverage check

### v0.1 (Phases 1-5) — pilot-ready

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

### v0.2 (Phases 6-9) — EIC Design v2 Refresh

| Catégorie | REQ-IDs | Phase |
|---|---|---|
| DSY (Design System) | DSY-01, DSY-02, DSY-03, DSY-04, DSY-05, DSY-06, DSY-07 (7 REQ) | Phase 6 |
| PLR (Joueur) | PLR-01, PLR-02, PLR-03, PLR-04, PLR-05, PLR-06, PLR-07, PLR-08 (8 REQ) | Phase 7 |
| MNT (Mentor) | MNT-01, MNT-02, MNT-03, MNT-04, MNT-05, MNT-06 (6 REQ) | Phase 8 |
| GMR (GameMaster + Jury + Replay + Pixel) | GMR-01, GMR-02, GMR-03, GMR-04, GMR-05, GMR-06, GMR-07, GMR-08, GMR-09 (9 REQ) | Phase 9 |

✓ **30/30 v0.2 requirements mappés** — coverage 100%, aucun orphan, aucun duplicate.

✓ **30/30 v0.2 requirements implémentés** (2026-05-10) — Phase 6 (DSY×7) + Phase 7 (PLR×8) + Phase 8 (MNT×6) + Phase 9 (GMR×9). 33 commits feat/db/docs/chore. Build typecheck/lint/build clean. VERIFICATIONs Phase 7+8+9 status `human_needed` — visual review + apply migrations SQL + smoke E2E à faire par Omar.

## Phase 12: T-3 Scope Expansion — MoSCoW Kanban + Bonus Events Recreate

**Quand** : 2026-05-10 → 2026-05-12 23h00 (T-3 → T-1, freeze T-3 explicitement override par owner)
**Goal:** livrer 3 capacités produit majeures avant go-live AgreenTech 13/05 : (1) recréer le mécanisme `bonus_events` retiré en v0.2 avec 3 types initiaux (`bonus_verbatims_terrain`, `bonus_dev_plan`, `bonus_prototype_draft`) + multiplier `next_deliverable`/`rest_of_event` cap 3.00x ; (2) MoSCoW Kanban web natif (DnD `@dnd-kit/core`) remplaçant ex-livrable #4, persisté en table `moscow_cards`, exporté CSV GM-only ; (3) polish des 9 livrables AgreenTech (sections 5.1-5.9 seed). Verbatims terrain migrent du livrable obligatoire vers un BONUS optionnel (trade-off pédagogique conscient).
**Depends on:** Phase 10 (T-3 Critical Gates B1-B4 fixés), Phase 11 (Design Audit Refinements en attente exécution)
**UI hint** : oui

**Cardinaux R1/R2/R3 préservés** : multiplier_factor numeric jamais rendu Player (R1), validators warn-only + actions safeParse (R2), no inter-mission blocking (R3). Spawn `eic-pedagogical-advisor` AVANT chaque édition zone sensible.

**Source** : `.planning/quick/260510-t3x-scope-expansion-moscow-kanban-bonus-events/BRIEF.md` (decisions live session 2026-05-10).

**Success Criteria:**
1. Wave 0 (Plan 01) : commit live edits T-3-polish atomique (sections seed 5.1/5.2/5.3 + journey hero subtitle + CLAUDE.md sections T-3 Gates / Pre-edit guards / Freeze) — **AVANT toute autre édition**.
2. Wave 1 (Plans 02-03) : migrations Supabase `bonus_events` + `moscow_cards` (schema, enums, RLS pilote-grade, triggers `updated_at`, idempotence). Mirror `database/*.sql`.
3. Wave 2 (Plans 05-07) : `lib/types.ts` étendu (BonusType, BonusStatus, MultiplierScope, BonusEvent, MoscowBucket, MoscowCard, BONUS_DEFAULTS, BONUS_MULTIPLIER_CAP=3.00) + 7 server actions Flow (`claimBonusEvent`, `reviewBonusEvent`, `createMoscowCard`, `updateMoscowCard`, `deleteMoscowCard`, `reorderMoscowCards`, `submitMoscowDeliverable`) + `applyBonusMultiplier` pure fn dans `lib/score.ts` (signature `sumPlayerScoreProject` inchangée).
4. Wave 3 (Plans 08-10) : composants UI (`bonus-claim-form.tsx`, `bonus-status-badge.tsx` qualitatif strict R1, `moscow-card.tsx`, `moscow-kanban.tsx` DnD `@dnd-kit/core@^6.1.0` + `@dnd-kit/sortable@^8.0.0` + `@dnd-kit/utilities@^3.2.2`) + routes (`/journey/bonus/[type]`, `/mentor/bonus/[id]`, `/journey/deliverable/[id]/moscow-snapshot`) + helpers `lib/bonus.ts` + `lib/moscow.ts`.
5. Wave 4 (Plans 11-12) : route handler CSV export `/api/export/moscow/[deliverableId].csv` (GM-only `is_game_master()`, `dynamic='force-dynamic'`, demo mode bypass) + smoke E2E full parcours (Player onboarding → 9 livrables incl MoSCoW Kanban → bonus claim → pitch ; Mentor evaluate ; GM announce + export ; RLS ; audit grep R1).
6. Audit grep R1 clean côté Player : aucun `multiplier_factor`, `score`, `/100`, `toFixed`, `points`, `number` rendu sur surfaces Player.
7. `npm run typecheck && npm run lint && npm run build` clean après chaque commit atomique.

**Plans:** 12/12 plans complete

Plans:
- [x] 12-01-PLAN.md — Wave 0 : commit T-3-polish live edits (seed sections 5.1-5.9 + journey hero + CLAUDE.md)
- [x] 12-02-PLAN.md — Wave 1 : migration `bonus_events` schema + RLS + trigger
- [x] 12-03-PLAN.md — Wave 1 : migration `moscow_cards` schema + RLS + trigger
- [x] 12-05-PLAN.md — Wave 2 : `lib/types.ts` BonusType/BonusEvent/MoscowBucket/MoscowCard + BONUS_DEFAULTS + cap
- [x] 12-06-PLAN.md — Wave 2 : server actions Flow (claim/review bonus + CRUD moscow + submit deliverable) + i18n keys
- [x] 12-07-PLAN.md — Wave 2 : `applyBonusMultiplier` pure fn dans `lib/score.ts` (cap 3.00x, scopes)
- [x] 12-08-PLAN.md — Wave 3 : `bonus-claim-form.tsx` + `bonus-status-badge.tsx` (R1 strict qualitatif)
- [x] 12-09-PLAN.md — Wave 3 : `moscow-card.tsx` + `moscow-kanban.tsx` DnD `@dnd-kit/*` PIN strict
- [x] 12-10-PLAN.md — Wave 3 : routes `/journey/bonus/[type]`, `/mentor/bonus/[id]`, `/journey/deliverable/[id]/moscow-snapshot` + helpers `lib/bonus.ts` + `lib/moscow.ts`
- [x] 12-11-PLAN.md — Wave 4 : route handler `/api/export/moscow/[deliverableId].csv` GM-only
- [x] 12-12-PLAN.md — Wave 4 : smoke E2E full parcours + audit R1/R2/R3

**Phase 12 status** : 📥 Created 2026-05-10. CONTEXT.md + 11 PLAN files importés depuis quick `260510-t3x-scope-expansion-moscow-kanban-bonus-events` via `/gsd-plan-phase 12 --auto`. **Risque T-1** : exécution serrée 10/05 → 12/05 23h, freeze T-3 override assumé par owner — fallback non identifié si bug bloquant 12/05 soir.

**Risques acceptés** : (a) cassure freeze T-3 ; (b) délai go-live 13/05 si bug ; (c) smoke régression compressé 0.5j ; (d) triple casquette Omar burnout ; (e) verbatims migrés en BONUS affaiblit pédagogie B4-retro ; (f) zéro comm partenaires sur scope expansion.

---

## Phase 13: Smoke Completion + Phase 11 Gates Closeout + Bug Annexes

**Quand** : 2026-05-10 → 2026-05-12 23h00 (T-3 → T-1, avant cutoff merge `main` pré-pilote AgreenTech)
**Goal:** combler les 3 trous critiques du smoke PROD T-3 (mentor eval E2E, jury+publication, 8 porteurs missing), boucler les 4 gates opérateur Phase 11 (visual review prod, reduced-motion, mobile 390px, GM radar), corriger les bugs annexes identifiés smoke (logout `type=submit`, Pouls "Diagnostic 0/1" SQL). Pré-requis go-live AgreenTech 13/05 8h30.
**Depends on:** Phase 11 (refinements design shippés `327ef86`), Phase 12 (n'impacte pas flux mentor direct)
**UI hint** : non (testing + bugfix uniquement)

**Source** : `.planning/quick/260510-smk-smoke-prod-option-c-3porteurs-27-livr/260510-smk-SUMMARY.md` (rapport smoke 27/27 livrables P01/P02/P04) + `.planning/seeds/SEED-002-smoke-e2e-mentor-jury-completion.md` (trigger dormant) + `.planning/phases/11-design-audit-refinements/SUMMARY.md` (Phase 11 gates 4 pendants).

**Cardinaux R1/R2/R3 préservés** : tout fix code passe par `eic-pedagogical-advisor` si zone Player-facing. Bouton logout `type=submit` = hors zone sensible (advisor non requis).

**Success Criteria** (what must be TRUE):

1. **R2 mentor warn-only validé E2E** : M01 (`m.mentor1@ueuromed.org`) login PROD, ouvre ≥2 submissions parmi les 27 disponibles (P01/P02/P04), soumet rubric 5×5=25 + verdict `validate_v1` ET `request_v2`, propagation côté Player vérifiée (feedback visible sur `/journey/deliverable/[id]`). Aucun validator `severity: "error"` bloquant déclenché.
2. **Flux jury E2E validé** : G01 ouvre `/jury` PROD, soumet ≥1 `pitch_score` test sur P01, vérifie persistance + agrégation côté `/results`. Publication test via SQL `events.results_published_at = now()`, vérifier que `/results` côté Player affiche annonce qualitative EIC-validated (R1 OK), côté GM scores + ranking visibles.
3. **8 porteurs manquants couverts** (option A swarm parallèle si Claude Code redémarré OU option B Option C étendue 2-3 villes-clés) : P03 (Fès argan) + P05 (El Hajeb compostage) + P09 (Agadir aquaponie) minimum. P06/P08/P10/P11 nice-to-have. Validation : titres UI AgreenTech v2 affichés pour chaque idée seed.
4. **Phase 11 G1 — Visual review prod terminé** : screenshot `05-admin-radar.png` capturé + rapport `.planning/phases/11-design-audit-refinements/G1-VISUAL-PROD.md` écrit avec verdict PASS/WARN/BLOCK par route (`/landing`, `/journey`, `/results`, `/admin?live=1`).
5. **Phase 11 G2 — Reduced-motion** : Playwright `emulate prefers-reduced-motion:reduce` sur 5 routes, vérifier que `.eic-track__fill` mount, node stagger, hero scroll, IO reveal sont neutralisés. Rapport `G2-REDUCED-MOTION.md`.
6. **Phase 11 G3 — Mobile 390px** : Playwright resize 390×844 sur `/journey` (scroll-snap proximity B2 + hero compact B5) + `/results` + `/landing`. Screenshots + scroll vertical. Rapport `G3-MOBILE-390.md`.
7. **Phase 11 G4 — GM radar dashed lines** : `/admin?live=1` avec ≥2 teams actives, vérifier SVG dashed lines entre cercles. Couplable avec G1 screenshot 05.
8. **Bug fix logout `type=submit`** : `components/app-shell.tsx` (StaffShell + AppShell) bouton "Se déconnecter" → `type="button"` ou hors `<form>`. Pas de régression flux signOut. Commit atomique ~2 min, hors zone sensible.
9. **SQL diagnostic Pouls "Diagnostic 0/1"** : query `select level, slug, title from public.deliverable_templates order by level, slug` + `count(*) filter (where level = 'L0_diagnostic')` exécutée. Verdict : mapping seed correct OU correction appliquée + commit.
10. `npm run typecheck && npm run lint && npm run build` clean après chaque commit atomique.

**Plans:** 4 waves (sériel : tests d'abord, bugfix après)

Plans:
- [ ] 13-01-PLAN.md — Wave A : SEED-002 Option C Mentor smoke E2E (M01 batch 27 submissions, rubric 5×5, validate_v1 + request_v2) + propagation Player check
- [ ] 13-02-PLAN.md — Wave A : SEED-002 Jury smoke (G01 `/jury` pitch_score + publication results SQL + `/results` Player/GM check)
- [ ] 13-03-PLAN.md — Wave A : SEED-002 porteurs missing (P03 Fès argan + P05 El Hajeb compostage + P09 Agadir aquaponie minimum) via subagent porteur-projet-agreentech
- [ ] 13-04-PLAN.md — Wave B : Phase 11 G1-finish (admin radar screenshot 05 + rapport markdown) + G4 fusion (couplé G1 screenshot 05)
- [ ] 13-05-PLAN.md — Wave B : Phase 11 G2 reduced-motion check Playwright + rapport
- [ ] 13-06-PLAN.md — Wave B : Phase 11 G3 mobile 390px smoke Playwright + rapport
- [ ] 13-07-PLAN.md — Wave C : Fix logout `type=submit` `components/app-shell.tsx` (StaffShell + AppShell) commit atomique
- [ ] 13-08-PLAN.md — Wave C : SQL diagnostic Pouls "Diagnostic 0/1" `deliverable_templates` L0_diagnostic + fix si nécessaire
- [ ] 13-09-PLAN.md — Wave D : Smoke régression final demo mode (`/landing` → `/login` → `/journey` seed → `/results`) + audit grep R1 clean

**Priorités** :
- 🔴 **CRITIQUE J1 14h** : plans 13-01 (mentor) + 13-02 (jury) — sans ces deux, le pilote partenaires démarre aveugle
- 🟠 **J2** : plan 13-03 (porteurs missing) — couverture diversité idées AgreenTech
- 🟡 **Polish** : plans 13-04/05/06 (Phase 11 gates) — design refinements validation
- 🟢 **Quick wins** : plans 13-07/08 — bugs annexes 5 min chacun
- 🔒 **Pré-cutoff** : plan 13-09 — smoke régression final avant 12/05 23h00

**Phase 13 status** : 📥 Created 2026-05-10 (ce commit). En attente exécution. **Pré-requis swarm parallèle plan 13-03** : redémarrage Claude Code pour activer `.mcp.json --isolated` (cf. mémoire `feedback_playwright_mcp_swarm_restart.md`).

**Risques acceptés** : (a) si Claude Code non redémarré, plan 13-03 reste sériel (~35 min P05+P09) au lieu de parallèle ; (b) reset PROD 12/05 23h00 nettoie pollution résiduelle 2 agents tués smoke 10/05 — plans 13-01/02 doivent s'exécuter AVANT reset OU être réexécutés après reset avec porteurs re-provisionnés ; (c) G1-G4 sont gates manuels-visuels, verdict subjectif tolerable (PASS/WARN/BLOCK).

---

## Phase 14: Scoring d'engagement livrables (paliers 100/25/50)

**Quand** : **pré-pilote AgreenTech — délock owner 2026-05-11**, exécution autorisée avant cutoff `2026-05-12 23h00`. (Auparavant tagged post-pilote v0.3 ; décision owner 2026-05-11 = exécuter maintenant, risque T-2/T-1 assumé avec mitigations CONTEXT §Q4.)
**Goal:** ajouter une couche de scoring d'engagement aux livrables, indépendante de la note rubric qualité (qui reste intacte). Trois paliers cumulatifs par livrable : **+100 soumis**, **+25 reviewed mentor**, **+50 validé**. Total max 175 pts d'engagement par livrable validé (en plus de la note qualité 0..25).
**Depends on:** Phase 13 (smoke régression final clean) — Phase 14 démarre dès Phase 13 closed, AVANT pilote.
**UI hint** : oui (badges paliers côté Player + colonne admin GameMaster) — design à drafter en discuss.

**Source** : conversation live owner ↔ Claude Code 2026-05-10 post-rétro T-3. CONTEXT initial : `.planning/phases/14-scoring-engagement-livrables/14-CONTEXT.md`.

**Cardinaux R1/R2/R3 à protéger** : zone hautement sensible (touche `lib/score.ts`, triggers DB, surface Player). Spawn `eic-pedagogical-advisor` **obligatoire** avant tout edit. Visibilité Player des paliers à arbitrer en discuss (Option A/B/C documentées dans CONTEXT).

**Questions ouvertes à trancher en discuss** (cf CONTEXT §3) :
- Q1 — Visibilité Player des paliers (R1)
- Q2 — Entre-t-il dans `combined` ranking 80/20 ? (défaut recommandé : hors ranking, alimente `players.score_engagement`)
- Q3 — Stockage (probable : colonne `players.score_engagement` existante + nouveau trigger DB)
- ~~Q4 — Timing~~ **TRANCHÉ 2026-05-11 : pré-pilote, exécution avant cutoff `2026-05-12 23h00`** (risque assumé, mitigations a-f CONTEXT §Q4)
- Q5 — Réversibilité si livrable validé puis re-évalué `reject`

**Success Criteria** (draft, à enrichir en discuss) :
1. Chaque livrable porte 3 paliers d'engagement indépendants de la note rubric.
2. Trigger DB recalcule `players.score_engagement` à chaque insert/update sur `submissions` + `evaluations`.
3. Surface Player montre l'avancement des paliers **sans révéler le rang ni le total comparé** (R1 préservé).
4. Pondération `combined` `0.8 × pitch + 0.2 × project` reste lockée (sauf décision Q2 explicite).
5. `npm run typecheck && npm run lint && npm run build` clean + audit grep R1 clean côté Player-facing.

**Plans:** à drafter via `/gsd-plan-phase 14` une fois discuss terminé. Aucun PLAN.md écrit à date.

**Phase 14 status** : 📥 Created 2026-05-10 · 🔓 **Délockée pré-pilote 2026-05-11**. CONTEXT initial drafté + Q4 tranchée. À enchaîner immédiatement après Phase 13 closed via `/gsd-discuss-phase 14 --auto` → `/gsd-plan-phase 14` → `/gsd-execute-phase 14`, AVANT cutoff `2026-05-12 23h00`.

**Risques acceptés (owner 2026-05-11)** : (a) régression scoring T-2/T-1 — mitigée par commits atomiques + typecheck/lint/build clean avant chaque commit + tag `v0.2.2-pre-ralph-13` rollback distant ; (b) visibilité Player mal cadrée (Q1) → audit grep R1 obligatoire post-edit + spawn `eic-pedagogical-advisor` avant tout edit Player-facing.

---

*Last updated: 2026-05-11 — **Phase 14 délockée pré-pilote** (décision owner 2026-05-11, Q4 tranchée). Exécution autorisée avant cutoff `2026-05-12 23h00`. Enchaînement : Phase 13 (9 plans, 4 waves) → Phase 14 (discuss → plan → execute). Phase 12 (T-3 Scope Expansion: MoSCoW Kanban + Bonus Events Recreate) imported via `/gsd-plan-phase 12 --auto`. v0.2 EIC Design v2 Refresh complete (Phases 6+7+8+9). v0.1 pilot-ready (Phases 1-5) préservé via tag `v0.1-pilot-ready`. Source design v0.2 : `.planning/design-v2/`. Pending operator gates : Phase 13 plans 13-01..13-09 + Phase 14 discuss/plan/execute, tous pré-pilote.*
