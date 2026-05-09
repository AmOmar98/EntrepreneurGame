# Requirements — Entrepreneur Game

**Sources** :
- v0.1 (Pilot) : `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md` §3
- v0.2 (Design v2 Refresh) : `.planning/design-v2/` (bundle Claude Design 2026-05-08, voir `chats/chat1.md`)

**Cadrage** : Project A v0.1 livré 2026-05-08 (pilot-ready). v0.2 EIC Design v2 Refresh en cours, mode qualité sans deadline. MUST = non-négociable, SHOULD = bonus, COULD = V2.

---

## v1 Requirements (Pilot Project A — v0.1, livré 2026-05-08)

### AUTH — Authentification & sessions

- [x] **AUTH-01** : Player/Mentor/GameMaster peut se connecter avec email + mot de passe initial via Supabase Auth, et obtenir une session persistante (cookies SSR) _(Phase 1)_
- [x] **AUTH-02** : Visiteur non authentifié sur route protégée est redirigé vers `/login?redirect=<path>` par le middleware
- [x] **AUTH-03** : Player peut se déconnecter depuis n'importe quelle page et revenir à `/login` _(Phase 1)_
- [x] **AUTH-04** : Le rôle (`player` / `mentor` / `gamemaster`) est attaché à l'utilisateur côté DB et fait foi pour le routing et les RLS _(Phase 1)_

### ONBOARD — Onboarding & création comptes

- [x] **ONBOARD-01** : GameMaster peut uploader un CSV (colonnes : team_name, project_name, project_pitch, leader_email, member_emails) sur `/admin/players/import` ; pour chaque équipe, l'app crée le Player, les PlayerMembers, et envoie un magic link Supabase aux emails fournis. L'opération est idempotente (ré-upload OK).
- [x] **ONBOARD-02** : Au premier login, si le profil Player n'a pas `onboarded_at`, il est redirigé vers `/onboarding`
- [x] **ONBOARD-03** : Sur `/onboarding`, Player confirme nom équipe + nom projet + idée courte (textarea ≤ 500 chars) + diagnostic initial 5 questions Likert 1-5 + cases à cocher membres présents ; soumission marque `onboarded_at = now()` et accorde Score Engagement +10

### EVENT — Événement et configuration

- [x] **EVENT-01** : Au déploiement, un Event seed « Hack-Days Fès-Meknès Mai 2026 » est créé avec 6 Missions correspondant aux ateliers du programme PDF Tamwilcom et ~9 DeliverableTemplates (Business Model Canvas, Étude de marché, Fiche Personae, Fiche Produit + Plan Dév, Coûts & prévisions ventes, Stratégie prix/ventes/canaux, + livrables ateliers 3-4-5 à confirmer)
- [x] **EVENT-02** : Chaque DeliverableTemplate a une `scoring_rubric` JSONB (4-5 critères pondérés selon brief Section 14) et un `due_at` aligné sur la timeline du programme
- [x] **EVENT-03** : Les 8 Levels (Niveau 0 à 7 du brief) sont seedés en table de référence statique au déploiement _(Phase 1, schema-side)_
- [x] **EVENT-04** : Toutes les tables liées (players, missions, submissions, pitch_scores) ont une colonne `event_id NOT NULL` ; pour le pilote, hardcodée à l'event seed (multi-event = SHOULD/V2) _(Phase 1)_

### JOURNEY — Parcours Player

- [x] **JOURNEY-01** : Sur `/journey`, Player voit en header le nom de son équipe, son niveau actuel (déduit du dernier livrable validé), et son Score Projet en temps réel
- [x] **JOURNEY-02** : Sur `/journey`, Player voit la timeline des ateliers du jour avec statut (à venir / en cours / passé)
- [x] **JOURNEY-03** : Sur `/journey`, Player voit la liste des DeliverableTemplates du jour, chacun avec son statut (à rendre / brouillon / soumis V1 / feedback reçu / V2 soumis / validé) et un bouton d'action (Soumettre / Voir feedback / Re-soumettre)

### SUBMIT — Soumission de livrables

- [x] **SUBMIT-01** : Sur `/journey/deliverable/[id]`, Player peut soumettre une `Submission` avec au moins un de `proof_url` (https://) ou `proof_text` (markdown ≤ 4000 chars) ; validation Zod côté server action
- [x] **SUBMIT-02** : Une Submission V1 (status=`submitted_v1`) ne peut plus être modifiée par le Player tant que le Mentor n'a pas demandé V2
- [x] **SUBMIT-03** : Si le Mentor demande V2 (verdict=`revision`), le Player peut soumettre une nouvelle Submission V2 (version=2, status=`submitted_v2`) ; le score final retenu est celui de V2
- [x] **SUBMIT-04** : Le Player ne peut pas soumettre de livrable d'un autre Player (vérification owner via `player_members` + `auth.getUser()`) — RLS + check applicatif

### EVAL — Évaluation Mentor

- [x] **EVAL-01** : Sur `/mentor`, Mentor voit la liste de tous les Players de la cohorte avec score Projet courant, nb livrables soumis / total, filtre « livrables en attente »
- [x] **EVAL-02** : Sur `/mentor/submission/[id]`, Mentor voit le contenu de la Submission (lien et/ou texte), un formulaire de scoring selon la `scoring_rubric` du DeliverableTemplate (un input numérique par critère), un champ feedback texte, et 3 boutons : « Valider V1 » / « Demander V2 » / « Rejeter »
- [x] **EVAL-03** : Soumettre une évaluation crée une `Evaluation` row avec `scoring_breakdown` (JSONB), `total_score`, `feedback_text`, `verdict` ; met à jour le statut de la Submission et recalcule le Score Projet du Player

### SCORE — Calcul de scores

- [x] **SCORE-01** : Le Score Projet d'un Player est la somme des `total_score` des Evaluations validées sur ses Submissions, calculé serveur (jamais saisi côté client)
- [x] **SCORE-02** : Le Score Projet est consultable temps réel par le Player sur `/journey`, par le Mentor sur `/mentor`, et par le GameMaster sur `/admin`

### JURY — Pitch jury jour 2

- [x] **JURY-01** : Sur `/jury` (accès Mentor), pour chaque Player de la cohorte, le Mentor-Juré peut saisir 5 notes (clarté pitch / structure deck / crédibilité / qualité roadmap / qualité oral), chacune sur 20 points
- [x] **JURY-02** : Une soumission jury crée une `PitchScore` row (juror_id × player_id, contrainte unique) ; resoumission = update
- [x] **JURY-03** : Le classement final est calculé : pour chaque Player, moyenne des PitchScore + Score Projet pondéré (pondération configurable, par défaut 50/50)
- [x] **JURY-04** : Sur `/results`, GameMaster voit le classement complet ; les autres rôles voient une page « Résultats à venir » jusqu'à `events.results_published_at`
- [x] **JURY-05** : GameMaster peut publier les résultats via un bouton « Publier » qui set `events.results_published_at = now()` ; à partir de ce moment, `/results` est accessible à tous

### ADMIN — Vue GameMaster

- [x] **ADMIN-01** : Sur `/admin`, GameMaster voit un tableau de tous les Players avec colonnes : nom équipe / projet, Niveau actuel, Score Projet, Statut (en avance / à l'heure / retard), Prochain livrable
- [x] **ADMIN-02** : Sur `/admin`, GameMaster voit des compteurs globaux : livrables soumis / total, en attente revue, validés
- [x] **ADMIN-03** : Sur `/admin/players/[id]`, GameMaster voit le détail d'un Player : membres, toutes les Submissions, toutes les Evaluations, scores
- [x] **ADMIN-04** : Sur `/admin/export/players.csv`, GameMaster télécharge la liste des Players avec leurs scores au format CSV

### BRAND — Branding et polish UI

- [x] **BRAND-01** : Header avec logo EIC sur toutes les pages authentifiées
- [x] **BRAND-02** : Page `/login` (et page accueil non-auth si exposée) affiche le bandeau partenaires : Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF
- [x] **BRAND-03** : Palette et typographie alignées sur l'identité visuelle EIC (assets fournis par Omar — voir spec §7 décision 6)
- [x] **BRAND-04** : Polish tactique sur 5 écrans clés (login, onboarding, journey, mentor, admin) — cohérence visuelle, espacements, états vides explicites, états de chargement
- [x] **BRAND-05** : Aucune mention de seed apparente (suppression de `atlas-soil` et autres références démo en prod)

### DATA — Persistence & sécurité

- [x] **DATA-01** : Schema Postgres appliqué sur le projet Supabase prod (création/migration). Comprend les tables : events, levels, missions, deliverable_templates, cohorts, players, player_members, submissions, evaluations, pitch_scores, et leurs FK + index sur les FK chaudes _(SQL livre Phase 1, apply prod = operator UAT)_
- [x] **DATA-02** : RLS policies en place : Player ne voit que ses propres Submissions/Evaluations + données publiques (DeliverableTemplates, Missions, Levels, Event public info) ; Mentor voit tous les Players de l'event ; GameMaster voit tout. Test exhaustif RLS avec 2 comptes Player factices avant 13 mai.
- [x] **DATA-03** : `lib/workflow-data.ts` ne tombe plus sur le seed quand `hasSupabaseEnv()` est true et que la DB est vide → retourne tableaux vides (suppression du leak)
- [x] **DATA-04** : Toutes les server actions retournent un `WorkflowState = { ok, message, data? }` ; aucune `return;` silencieuse, aucune erreur Supabase swallow
- [x] **DATA-05** : Lucide-react repinné à une version résolue correctement (corrige le `^1.14.0` suspect identifié dans `.planning/codebase/CONCERNS.md`) _(Phase 1 plan 06)_
- [x] **DATA-06** : Code mort supprimé : `BonusEvent`, `bonusRules`, `prestige_xp`, enums `Stage`/`Checkpoint`/`MaturityPhase`/`BonusType`, pages `/committee`, `/admin/game`, `/admin/startups`, mailto drafts, exports `committee.csv`/`eml`/`kpi-snapshot`. `lib/data.ts` éclaté en `lib/types.ts` + `lib/seed/*.ts` + `lib/score.ts` + `lib/icons.ts`. _(Phase 1)_

### DEPLOY — Déploiement

- [x] **DEPLOY-01** : App déployée sur Vercel sur un domaine accessible (`entrepreneur-game.vercel.app` ou domaine custom EIC selon décision §7)
- [x] **DEPLOY-02** : Variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurées sur Vercel pointant vers le projet Supabase prod
- [x] **DEPLOY-03** : Smoke test E2E manuel passant : signup admin → import CSV → login Player → onboarding → submit livrable → login Mentor → évaluation → V2 → publication résultats. Effectué en J5 sur l'URL prod.

---

## v0.2 Requirements (EIC Design v2 Refresh)

**Cadrage** : refonte visuelle + UX de l'app v0.1 selon le bundle Claude Design `.planning/design-v2/`. La fonctionnalité v0.1 reste fonctionnelle. Changements = visuels, structurels (composants partagés), UX (drawer, hero unique, mascotte). DDL minimal autorisé si commit atomique séparé (ex: `submission_comments`, `deliverable_templates.is_active`) ; refus de toute migration destructive ou changement de RLS gates. Pas de deadline : qualité avant timing.

**Pré-requis opérateur (avant Phase 6)** : tag `v0.1-pilot-ready` posé localement sur `8176419`. `git push --tags` recommandé pour rollback distant possible.

**Couplages atomiques explicites** :
- PLR-03 (hero unique) + PLR-04 (drawer) → 1 commit ; livrer le drawer sans le hero = retour comportement v0.1.
- GMR-01 (toggle mode live) + GMR-02 (radar) → 1 commit ; les pulsations rouges sont calibrées fond sombre.
- DSY-04 (composants partagés) = DoD-bloquant Phase 6 ; sans `<Button>`/`<Pill>`/`<LevelBadge>` extraits, Phases 7-9 dupliqueront les styles.

**Source de vérité fichiers** :
- `eic-tokens.css` — palette EIC + polices + radii + shadows + transitions
- `wf-base.css` + `wireframe-style.css` — primitives wireframe (boutons, pills, cards, glass, levels)
- `player-screens.jsx` + `player-flows.jsx` + `player-extras.jsx` — refonte joueur
- `mission-workspace.jsx` — détail livrable + commentaires async + révision V2
- `gm-screens.jsx` + `gm-flows.jsx` — GameMaster + mode live
- `jury-screens.jsx` — pitch jury théâtre + replay/podium
- `pixel-mascot.jsx` — mascotte Pixel 4 humeurs
- `admin-screens.jsx` — variantes UX admin (héritage)

### DSY — Design System EIC

- [x] **DSY-01** : Player/Mentor/GameMaster voit l'app stylée avec la palette EIC (bleu `#1B3A5C`, vert `#2E7D32`, ivoire `#F6F1E8`) sur toutes les surfaces principales ; aucun reste de palette v0.1 (`--brand-*` slate/blue) sur les pages refondues
- [x] **DSY-02** : Toutes les pages chargent les polices Baskervville (titres) + Montserrat (corps) via **`next/font/google`** (self-hosted Next.js, zéro round-trip réseau) avec fallback système ; titres `<h1>`-`<h4>` rendus en Baskervville, corps en Montserrat. Pas de `@import url(...)` synchrone (impact LCP).
- [x] **DSY-03** : Cards et panneaux principaux (header journey, login form, drawer livrables, focus team) ont l'effet glass (`backdrop-filter: blur+saturate`) sur fond aurora doux ; fallback `@supports not (backdrop-filter: blur(1px))` → background opaque blanc 92% pour navigateurs anciens (Android Chrome <90)
- [x] **DSY-04** : Composants partagés exportés depuis `components/ui/` : `<Button variant="primary|success|ghost">`, `<Pill tone="blue|green|amber|rose">`, `<LevelBadge state="done|current|locked">`, `<ProgressBar value={0..1}>` ; chaque composant a un seul responsable de styles (pas d'inline `style={...}` ad hoc)
- [x] **DSY-05** : `AppShell` refactor : sidebar dark green retirée chez Player (remplacée par topbar légère + tab bar mobile bottom selon design `TopbarLite`), conservée et restylée chez Mentor/GameMaster avec tokens EIC. **Tokens v0.1 legacy (`--brand-*`, `--green`, `--blue`) conservés en parallèle** des tokens `--eic-*` pour éviter régressions sur composants v0.1 (cf. décision Phase 04)
- [x] **DSY-06** : Page `/login` refondue : background ivoire avec aurora, logo EIC haut-gauche (lockup `EICLogo`), bandeau partenaires (Tamwilcom, BoA Academy, Innov Invest, Bluespace, EIC, UEMF), formulaire centré sur card glass
- [x] **DSY-07** : `npm run typecheck` passe sans erreur après refonte ; `npm run lint` passe sans nouveau warning ; `npm run build` produit un bundle qui se sert correctement en prod

### PLR — Joueur (Journey + Onboarding + Submission)

- [ ] **PLR-01** : Sur `/journey` desktop (≥1100px), Player voit la barre de charge verticale L0→L7 **descendante** (top=L7 pitch, bottom=L0 diagnostic) avec son niveau courant pulsé en bleu, niveaux faits en vert, niveaux locked grisés/dashed
- [ ] **PLR-02** : Sur `/journey` mobile (<1100px), la même barre est **ascendante** (bottom=L0, top=L7 = sommet à atteindre)
- [ ] **PLR-03** : Au-dessus de la barre, Player voit un hero unique « Prochaine étape » avec UN seul CTA primaire visible à la fois (le prochain livrable à rendre OU « Voir le feedback » si V2 demandée) ; pas de secondary action sur le hero
- [ ] **PLR-04** : Hover ou clic sur un niveau de la barre ouvre un drawer latéral (right-side, ~400px desktop, full-width mobile) avec les missions/livrables de ce niveau ; chaque mission rendue comme une card (code `M3.1`, titre FR, statut pill, reward XP, bouton action contextuel)
- [ ] **PLR-05** : Sur `/onboarding`, Player traverse 3 étapes éditoriales avec navigation `← Précédent / Suivant →` : (1) bienvenue + chiffres clés Hack-Days, (2) ton équipe avec coéquipiers chargés depuis `player_members`, (3) 3 règles du jeu en numéros éditoriaux ; soumission finale = redirect `/journey`
- [ ] **PLR-06** : Après soumission V1 sur `/journey/deliverable/[id]`, Player voit l'écran SOUMIS éditorial : fond cream avec sunburst rays, gros « +XP » en gradient, ticket avec stamp « SOUMIS » rotated, sentence de la soumission, CTA primaire « Retour au journey » → redirect `/journey`
- [ ] **PLR-07** : Quand Mentor demande V2 (verdict=`revision`), `/journey/deliverable/[id]` affiche : message mentor en haut, checklist « Ce qui passe ✓ / Ce qui manque ⚠ » (parsée du feedback ou listée par mentor), bandeau vert avec formulation pédagogique **« Votre V1 est conservé. Le V2 affine, il ne remplace pas votre démarche initiale. »** (pas de framing « aucune perte d'XP » qui dévalue V1), CTA primaire « Soumettre un nouveau lien » qui ouvre le composer
- [ ] **PLR-08** : Sur `/journey` après soumission V1 (avant verdict mentor), la card livrable dans le drawer affiche un état « En revue » avec timestamp de soumission + nom mentor assigné (ex: « Sami K. · soumis il y a 8 min ») ; évite le silence muet entre V1 et feedback

### MNT — Mentor (Évaluation async sur lien)

- [ ] **MNT-01** : Sur `/mentor/submission/[id]`, Mentor voit le lien soumis comme objet central : card avec type détecté (Google Docs / GitHub / Notion / autre — détecté par hostname), URL cliquable, note jointe (texte de la submission), bouton « Ouvrir ↗ » qui open le lien dans un nouvel onglet
- [ ] **MNT-02** : Sous la submission courante, Mentor voit l'historique des liens : V1 (si demande V2 a été faite) puis V2 (si soumise), chacune avec sa date et son lien
- [ ] **MNT-03** : Mentor peut ajouter des commentaires async tagués (`remarque` neutre / `à corriger` rouge) au niveau du livrable via un composer textarea + select tag ; chaque commentaire est persisté avec auteur+timestamp et visible côté Player sur l'écran révision (PLR-07)
- [ ] **MNT-04** : Quand Mentor saisit verdict=`revision`, un champ « Action attendue » (texte libre court, ex: « refaire le BMC en intégrant le feedback ») est obligatoire avec le verdict, persisté dans `evaluations.feedback_text` ou colonne dédiée
- [ ] **MNT-05** : Aucun chat instantané : tous les commentaires sont des posts async en liste antichrono ; pas de threading ni de réactions ; pas de WebSocket / Supabase Realtime nécessaire pour cette milestone
- [ ] **MNT-06** : Après soumission d'une évaluation, Mentor voit un toast/banner de confirmation « Score envoyé · +X XP attribués à [équipe] · Player notifié » ; évite double-soumission par incertitude

### GMR — GameMaster + Jury + Replay + Pixel

- [ ] **GMR-01** : Sur `/admin`, GameMaster a un toggle « Mode live » dans le topbar qui bascule la vue : (mode standard) tableau cohorte v0.1 stylé v0.2 / (mode live) fond sombre, radar de la salle (cercles XP des équipes), fil du jeu textuel en bas, mascotte Pixel floating bottom-right
- [ ] **GMR-02** : En mode live, chaque équipe est un cercle SVG dont **taille = score Projet courant** (rayon proportionnel) ; cercle **vibre + pulsations rouges** (CSS animation pure, pas de re-render React par tick) quand activité dans les 5 dernières minutes (submission ou évaluation reçue), **gris/figé** quand inactif >5 min. **Visibilité par défaut = GameMaster + Mentors uniquement** (les Players ne voient PAS le radar) — risque pédagogique de démoralisation des équipes en queue avant le pitch J2. Flag `live_radar_visibility = 'gm_only' | 'public'` côté event, défaut `gm_only`.
- [ ] **GMR-03** : Clic sur un cercle dans le radar ouvre la vue Focus équipe : layout éditorial avec gros « 01 » filigrane (numéro de classement), titre Baskervville surdimensionné (nom équipe + projet en italic), citation/idée projet, avatars membres, bandeau stats vitales (Score Projet, niveau, livrables soumis, dernière activité), barre verticale d'activité à droite
- [ ] **GMR-04** : GameMaster peut composer une annonce live depuis `/admin/announce` : 4 types (info bleu / urgence rouge / célébration vert / appel à action ambre), ciblage (toutes équipes / par niveau / équipes choisies / mentors), aperçu temps réel sur mockup phone côté éditeur, action « Diffuser maintenant » ou « Programmer ». Diffusion = persistance en DB (table `announcements`), lecture côté Player via reload (pas de Realtime nécessaire pour cette milestone, polling acceptable).
- [ ] **GMR-05** : Sur `/jury`, GameMaster a un toggle « Mode pitch » qui bascule la page en mode théâtre : fond sombre, équipe en cours grand format avec timer 5 min décompte, file de passage ordonnée à droite, grille de notation /5 sur 5 critères + textarea commentaire global, indicateur « X/5 jurés ont noté » en bas
- [ ] **GMR-06** : Sur `/results` quand `events.results_published_at IS NOT NULL`, page Replay : fond ivoire, hero verdict éditorial (« L'équipe Atlas remporte le Hack-Days 2026 »), podium 3 marches (or/argent/bronze), strip de 5 stats globales (équipes, livrables, XP cumulés, etc.), classement complet en tableau, timeline des moments forts (manuelle, seedée par GM), bandeau exports : « Certificats joueurs » (CSV) / « Rapport global » (CSV) / page publique
- [ ] **GMR-07** : Mascotte Pixel (SVG inline abstrait : blob doux + oreilles + yeux) floating bottom-right de `/admin` en mode live : affiche 4 humeurs selon état du hack — **serein** (vert, tout flue), **concentré** (bleu, phase de revue), **inquiet** (rouge, ≥3 équipes silencieuses >15 min), **euphorique** (orange, célébration en cours) — avec micro-action contextuelle (ex: « Réveiller les 3 équipes »). Forme repliée en pill discrète au clic.
- [ ] **GMR-08** : Logique de détection des 4 états (serein/concentré/inquiet/euphorique) implémentée comme **bandeau status simple dans le topbar `/admin`** (texte + icône + CTA), à coupler avec GMR-07 (la mascotte reflète l'état détecté par le bandeau). Permet à l'animateur de capter les signaux d'animation pédagogique (ex: « 3 équipes silencieuses depuis 18 min »).
- [ ] **GMR-09** : GameMaster peut activer/désactiver un `deliverable_template` existant via un toggle on/off sur `/admin/deliverables` (ou intégré au tableau `/admin`) ; un template désactivé n'apparaît plus dans le journey des Players. Schema = ajout colonne `deliverable_templates.is_active boolean default true`, server action `toggleDeliverableActive(id)`, RLS GM-only. **Compromis minimal du nouveau requirement « blocs préfaits éditables » — la version complète (CRUD blocs, drag, presets) est différée v0.3 post-pilote.**

---

## v1.5 Requirements (SHOULD — bonus)

- [ ] **NOTIF-01** : Badge in-page sur header avec compte de notifications non-lues (déclenché quand Mentor évalue un livrable du Player)
- [ ] **SCORE-03** : Score Engagement calculé serveur (présence onboarding +10, livrable rendu V1 +10, V2 soumis +5, livrable rendu dans temps imparti de l'atelier +5). Affiché sur `/admin` quand activé.
- [ ] **EVENT-05** : Schema multi-event prêt (event_id partout, levels 0-7 tous référencés)
- [ ] **RESOURCE-01** : Page `/resources` statique avec liens vers gabarits BMC, Personae template, etc.

---

## v2 / Out of Scope (Project B post-pilote)

**Hérité v0.1 :**

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

**Différé v0.2 → v0.3 (post-pilote) :**

- Animations complexes (level-up modals, confetti, transitions cross-page) — pour v0.2 = pulses CSS simples uniquement
- Skeleton loaders sur tous les écrans — pour v0.2 = pas de loader, fallback texte simple
- Empty state illustrations — pour v0.2 = texte simple
- Dark mode toggle utilisateur — tokens dark existent dans `eic-tokens.css` mais pas exposé en UI v0.2
- Switcher de langue FR/EN exposé — l'i18n existe (`lib/i18n.ts`) mais pas de switcher UI
- Annonces live qui pulsent en realtime chez les Players — v0.2 = persistance + reload/polling simple, pas de Supabase Realtime
- Live news ticker bottom bar (game line) — différé v0.3
- Page dédiée « Vie de Pixel » — v0.2 = floating only sur /admin
- Mode swift/hard mode bottom bar — différé v0.3
- Vue mentor « miroir » (sa file d'équipes à relire) — V2 (Phase 8 garde la liste v0.1 stylée v0.2)
- Détection avancée de type de lien (preview thumbnail, OG tags) — v0.2 = juste hostname / icône
- Système de tags commentaires extensible (custom tags par GM) — v0.2 = `remarque` / `à corriger` hardcodés
- Drag-to-reorder file de passage jury — v0.2 = ordre fixé seedé
- **« Blocs livrables préfaits éditables » version complète** (CRUD UI, presets réutilisables BMC/Persona/etc., drag reorder, JSONB editor de `scoring_rubric`) → différé v0.3. v0.2 livre juste GMR-09 (toggle on/off d'un template existant). Justification : un bootcamp fonctionne sur un programme figé annoncé en amont aux partenaires ; modifier dynamiquement les livrables casse le contrat pédagogique. Multi-event flexible = chantier v0.3 naturel.

---

## Traceability (rempli par roadmap)

| REQ-ID | Phase | Status |
|---|---|---|
| AUTH-01 | 1 | validated (operator UAT) |
| AUTH-02 | 1 | validated |
| AUTH-03 | 1 | validated (operator UAT) |
| AUTH-04 | 1 | validated (operator UAT) |
| ONBOARD-01 | 4 | validated |
| ONBOARD-02 | 2 | validated |
| ONBOARD-03 | 2 | validated |
| EVENT-01 | 1+2 | validated |
| EVENT-02 | 1+2 | validated |
| EVENT-03 | 1 | validated (operator UAT) |
| EVENT-04 | 1 | validated (operator UAT) |
| JOURNEY-01..03 | 2 | validated |
| SUBMIT-01..04 | 2+3 | validated |
| EVAL-01..03 | 3 | validated |
| SCORE-01..02 | 3 | validated |
| JURY-01 | 5 | validated |
| JURY-02 | 5 | validated |
| JURY-03 | 5 | validated |
| JURY-04 | 5 | validated |
| JURY-05 | 5 | validated |
| ADMIN-01..04 | 4 | validated |
| BRAND-01..05 | 4 | validated |
| DATA-01 | 1 | validated (operator UAT) |
| DATA-02 | 5 | validated (suite SQL livree, operator run requis) |
| DATA-03 | 2 | validated |
| DATA-04 | 1+3 | validated |
| DATA-05 | 1 | validated (operator UAT) |
| DATA-06 | 1 | validated (operator UAT) |
| DEPLOY-01 | 5 | validated (config livree, operator deploy requis) |
| DEPLOY-02 | 5 | validated (config livree, operator env vars requis) |
| DEPLOY-03 | 5 | validated (checklist livree, operator UAT requis) |
| NOTIF-01, SCORE-03, EVENT-05, RESOURCE-01 | (SHOULD) | pending (post-pilote ou si buffer) |
| **v0.2 — EIC Design v2 Refresh** | | |
| DSY-01..07 | 6 | mapped (ROADMAP.md Phase 6) |
| PLR-01..08 | 7 | mapped (ROADMAP.md Phase 7) |
| MNT-01..06 | 8 | mapped (ROADMAP.md Phase 8) |
| GMR-01..09 | 9 | mapped — Phase 9 commit atomique GMR-01+GMR-02, et GMR-07+GMR-08 couplés |

---

*Source spec v0.1 : `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md`*
*Source design v0.2 : `.planning/design-v2/` (bundle Claude Design exporté 2026-05-08, voir `chats/chat1.md`)*
*Source brief : `entrepreneur_game_brief.md` (Section 18.1 Format court Bootcamp 2-3 jours)*
*Source programme : `Programme Hack'Days 16&17 Avril 2026.pdf` (Tamwilcom, dates pilote = 13-14 mai 2026)*
