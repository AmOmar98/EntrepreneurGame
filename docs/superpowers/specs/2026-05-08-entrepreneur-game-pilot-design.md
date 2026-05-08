# Entrepreneur Game — Pilot 13-14 mai 2026

**Date** : 2026-05-08
**Auteur** : Omar Ameur (omar.ameur98@gmail.com) avec Claude Code
**Statut** : Spec validée pour Project A — Pilot-ready
**Échéance** : 13-14 mai 2026 (5-6 jours de dev solo)

---

## 1. Contexte et vision

L'**Entrepreneur Game** est le dispositif d'accompagnement entrepreneurial gamifié de l'EIC/UEMF, défini dans `entrepreneur_game_brief.md`. Il transforme le parcours d'incubation en niveaux progressifs (0-7), missions concrètes, livrables évaluables, scores et badges, en gardant le projet réel des participants au centre.

Le pilote des **13-14 mai 2026** est la **première instanciation en production** du Game, sous le format court « Bootcamp 2 jours » (Section 18.1 du brief), pour un Hack-Days Fès-Meknès organisé par l'EIC, Tamwilcom, Bank of Africa Academy, Innov Invest et Bluespace.

### Décisions structurantes prises pendant le brainstorming

1. **Le pilote est un format court du Game complet**, pas un produit séparé — l'app sera le squelette de la plateforme communauté EIC.
2. **Décomposition en 2 projets** : Project A (ce spec, 5 jours) délivre le strict nécessaire pour 13-14 mai ; Project B (post-pilote, 4-8 sem.) capitalise sur les retours pour livrer le Game complet.
3. **Refonte du data model existant** : on remplace les enums `Stage L0→L5` / `Checkpoint` / `BonusType` du code actuel (`lib/data.ts`) par les primitives du brief (`Level`, `Mission`, `Submission`, `Score multi-dim`).
4. **Hosting** : Vercel (déploiement Next.js natif).
5. **Solo dev avec Claude Code en pair** ; Omar anime aussi le workshop le 13.

### Hors scope explicite

- Score Entrepreneur (Hard/Soft/Mindset multi-axes), badges automatiques, classements multiples (V2)
- Rôle Expert et Comité programme distincts (V2 — fusionnés dans Mentor/GameMaster)
- Bonus events, Malus, prestige XP (supprimés du code)
- Exports avancés (committee dossier, EML), mailto drafts (supprimés)
- Tests automatisés, CI, observabilité, rate limiting (V2)
- Multi-cohort actif (schema prévoit `event_id` mais une seule instance pilote)
- Suivi long terme post-Hack-Days en features (data model l'autorise, pas livré)
- Niveau 3 « Proposition de valeur » non couvert par les ateliers du programme PDF Tamwilcom — à clarifier avec l'organisation, mais hors scope dev de cette spec

---

## 2. Glossaire / vocabulaire

Aligné sur le brief `entrepreneur_game_brief.md`. **Tout le code et l'UI utilisent ce vocabulaire** ; les enums et tables actuels qui ne correspondent pas seront renommés ou supprimés.

| Terme | Définition | Remplace dans code actuel |
|---|---|---|
| **Player** | Équipe ou joueur individuel inscrit à un événement, porteur d'un projet réel | `Startup` |
| **PlayerMember** | Membre d'une équipe Player avec rôle (founder / co-founder / member) | `project_members` |
| **Mentor** | Évalue les livrables, donne du feedback, accompagne la progression | rôle `mentor` (gardé) / `coach` (renommé) |
| **GameMaster** | Pilote opérationnel : gère règles, deadlines, équité, classements | `eic_admin` |
| **Level** | Niveau pédagogique 0-7 (référence statique du brief) | partiel `Stage` |
| **Mission** | Activité d'un niveau, produit un ou plusieurs livrables | nouveau |
| **DeliverableTemplate** | Livrable attendu d'une mission, avec grille de scoring (4-5 critères) | partiel `Deliverable` |
| **Submission** | Rendu d'une équipe Player sur un DeliverableTemplate (V1 → feedback → V2 optionnel) | partiel `Deliverable` |
| **Score** | Multi-dim : `score_project` + `score_engagement` (les autres axes du brief reportés V2) | `total_xp` / `pending_xp` |
| **Event / Program** | Instance configurée du Game (le pilote = `Hack-Days Fès-Meknès Mai 2026`) | nouveau |
| **PitchScore** | Note attribuée par un membre du jury à un Player lors du pitch final (jour 2) | nouveau |
| **Cohort** | Ensemble de Players inscrits à un Event | partiel `cohort_id` |

### Mapping ateliers PDF → Niveaux du brief

| Atelier programme Tamwilcom | Niveau brief | Livrables identifiés dans le PDF |
|---|---|---|
| 1 — Design Thinking | Niveau 1 (Idée & Problème) | *(PDF dit BMC, mais BMC = Niveau 5 — voir note)* |
| 2 — Étude marché et positionnement | Niveau 2 (Client & Marché) | Étude de marché, Fiche Personae |
| 3 — Faisabilité technique & risques | Niveau 4 (Solution & Prototype, light) | *Aucun livrable explicite dans le PDF* |
| 4 — Faisabilité financière | Niveau 5 (Business Model) | *Aucun livrable explicite* |
| 5 — Stratégie commerciale (GTM) | Niveau 5 (Business Model & GTM) | *Aucun livrable explicite* |
| 6 — Transformer l'innovation en valeur | Niveau 5 | Fiche Produit + Plan Dév, Coûts & prévisions ventes, Stratégie prix/ventes/canaux |
| Jour 2 — Pitch final | Niveau 6+7 | Pitch deck, pitch oral 5 min |

**Note sur incohérences PDF/brief** : le PDF mentionne Business Model Canvas comme livrable de l'atelier 1 (Design Thinking) alors que dans le brief le BMC est Niveau 5. Cette incohérence est notée comme question à clarifier avec Tamwilcom/EIC ; côté implémentation pilote on suit le PDF (BMC livrable atelier 1) et on note comme tech debt à reprendre.

---

## 3. Périmètre fonctionnel — MUST / SHOULD / COULD

### MUST — Garanti pour le 13 mai 8h30

**M1. Auth Supabase réelle**
Login email/password, session persistante via SSR cookies. Déjà implémenté (`utils/supabase/server.ts`, `middleware.ts`) — vérification + correction des bugs `signIn`/redirect.

**M2. Création comptes en bulk par GameMaster**
Page admin `/admin/players/import` : upload CSV (colonnes : team_name, project_name, project_pitch, leader_email, member_emails). Génère utilisateurs Supabase Auth, envoie magic links via Supabase Auth. Crée Player + PlayerMembers. Idempotent (ré-upload OK).

**M3. Onboarding Player (Niveau 0)**
Après login, si profil incomplet → page `/onboarding` :
- Confirmer nom de l'équipe + nom du projet
- Idée courte (textarea max 500 caractères)
- Diagnostic initial : 5 questions Likert 1-5 (sera défini dans le seed)
- Liste des membres présents (cases à cocher pré-remplies)

→ Marque le Player `onboarded_at = now()`. Score initial calculé (Engagement = présence onboarding).

**M4. Event configuré et missions actives**
Seed Postgres au déploiement : 1 row `events` (Hack-Days Fès-Meknès Mai 2026), 6 rows `missions` (atelier 1-6), N rows `deliverable_templates` (un par livrable PDF, ~9). Chaque DeliverableTemplate a une grille `scoring_rubric` (JSONB) avec 4-5 critères pondérés (modèle Section 14 du brief).

**M5. Vue Player « ma progression »** (`/journey`)
- Header : nom équipe, niveau actuel (déduit du dernier livrable validé), score Projet temps réel
- Timeline ateliers du jour avec statut (à venir / en cours / passé)
- Liste DeliverableTemplates du jour : chaque ligne = nom + statut (à rendre / brouillon / soumis V1 / feedback reçu / V2 soumis / validé) + bouton action

**M6. Soumission d'un livrable** (`/journey/deliverable/[id]`)
Formulaire :
- Champ `proof_url` (https://, Google Doc/Drive/Notion etc.) **OU** `proof_text` (markdown court ≤ 4000 chars), au moins l'un des deux
- Upload non géré (V2)
- Bouton « Soumettre V1 » → crée `Submission` avec status=`submitted_v1`. Player ne peut plus modifier sauf si Mentor demande V2

**M7. Vue Mentor** (`/mentor`)
Liste de tous les Players de la cohorte avec :
- Nom équipe + projet
- Score Projet courant + nombre de livrables soumis / total
- Filtre : « livrables en attente de revue »
- Action « Évaluer » → ouvre `/mentor/submission/[id]` :
  - Affiche contenu submission (lien ou texte)
  - Formulaire scoring selon grille du DeliverableTemplate (sliders ou inputs numériques par critère)
  - Champ feedback texte
  - 3 boutons : « Valider V1 » / « Demander V2 » / « Rejeter »
  - Crée `Evaluation` row, met à jour Submission status, met à jour `Score`

**M8. Boucle V1 → V2**
Si Mentor clique « Demander V2 », Player reçoit (in-page badge) + Submission devient `revision_requested`. Player peut soumettre V2. Score final = score V2 (pas la moyenne — règle simple pour le pilote).

**M9. Vue GameMaster** (`/admin`)
Dashboard cohorte (modèle Section 20 du brief) :
- Tableau : Player | Niveau | Score Projet | Statut (en avance / à l'heure / retard) | Prochain livrable
- Lien vers détail Player
- Compteur global : livrables soumis / total, en attente revue, validés
- Colonne « Score Engagement » ajoutée si S2 livré ; sinon masquée

**M10. Pitch Jury jour 2** (`/jury`)
Une page simple accessible aux Mentors (qui jouent le rôle de Jury) :
- Liste des Players
- Pour chaque Player, formulaire 5 critères (Niveau 6 brief : clarté / structure deck / crédibilité / roadmap / oral) sur 20 points chacun
- Soumission crée `PitchScore` (un par juré × player)
- Page `/results` : classement final calculé = moyenne PitchScore par Player + Score Projet × pondération configurable. **Affichage public** réservé GameMaster jusqu'à 15h00, puis publié. Implémentation simple : flag `results_published_at` sur Event, GameMaster clique « Publier » à 15h.

**M11. Branding EIC**
- Header avec logo EIC
- Page accueil/login avec bandeau partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF)
- Palette alignée sur l'identité visuelle EIC (assets à fournir — voir §7 décision 6)
- Typographie cohérente, pas d'éléments « démo » apparents (pas de mention `atlas-soil` etc.)
- Pas de design system complet — polish tactique sur 5 écrans clés (login, onboarding, journey, mentor, admin)

**M12. Persistence Supabase + RLS minimal correct**
- Schema appliqué sur projet Supabase prod
- RLS : Player voit ses propres données + données publiques (livrables = templates) ; Mentor voit tous les Players de l'event ; GameMaster voit tout
- Pas de leak du seed demo en mode prod : `lib/workflow-data.ts` ne tombe plus sur seed quand `hasSupabaseEnv()` est true et que la DB est vide → retourne tableaux vides
- Pas d'écriture silencieuse : toutes les server actions retournent `WorkflowState`, plus de `return;` qui swallow

### SHOULD — Tenté jour 4-5

**S1. Notifications in-page** : badge sur header quand Mentor évalue un livrable (compte non-lus)
**S2. Score Engagement calculé** : présence onboarding = +10, livrable rendu V1 = +10, prise en compte feedback (V2 soumis) = +5, livrable rendu dans temps imparti de l'atelier = +5. Calculé serveur, pas saisie manuelle pilote.
**S3. Schema multi-event** : tables ont `event_id NOT NULL`, Levels 0-7 tous référencés en table même si non utilisés au pilote
**S4. Page « Ressources »** : liste statique de gabarits (BMC vide, Personae template, etc.) avec liens externes

### COULD — Stub / supprimé / V2

- C1. Score Entrepreneur multi-axes (Hard/Soft/Mindset) — V2
- C2. Badges automatiques + page badges — V2
- C3. Classements multiples (général / progression / impact / engagement) — V2 ; pilote = 1 seul classement (Score Projet × pondération + Pitch)
- C4. Rôle Expert et Comité programme distincts — V2
- C5. Mailto draft à la soumission — supprimé (remplacé par S1 notif)
- C6. Exports CSV avancés (committee, EML, kpi-snapshot) — supprimés ; on garde 1 seul export `/admin/export/players.csv` pour GameMaster
- C7. Pages `/committee`, `/admin/game`, `/admin/startups` — supprimées (404 ou redirect)
- C8. `BonusEvent` / `bonusRules` / `prestige_xp` — supprimés du code
- C9. Tests automatisés, CI, observabilité, rate limiting — V2
- C10. Audit log — table existe, écriture non livrée pilote
- C11. Multi-cohort actif — V2 (schema prévoit, single cohort hardcodé pilote)
- C12. Mobile-first deep — pilote responsive minimal (laptop+tablette correctement, smartphone fonctionnel sans optimisation)

---

## 4. Architecture

### 4.1 Stack

Inchangé par rapport au code actuel — on conserve ce qui marche :

- Next.js 15 App Router, React 19, TypeScript
- Tailwind via `globals.css`
- Supabase (Auth + Postgres + RLS), `@supabase/ssr` côté Next
- Zod pour validation server actions
- `lucide-react` pour icônes (avec dépendance pinned correctement — voir M12)
- Vercel pour le déploiement
- `clsx` pour class composition

### 4.2 Modèle de données (cible)

```text
events (1 row pilote)
├── cohorts (1 row pilote, FK event_id)
│   └── players (~10 rows, FK cohort_id, FK event_id)
│       ├── player_members (FK player_id, FK auth.users)
│       └── submissions (FK player_id, FK deliverable_template_id)
│           ├── status: draft | submitted_v1 | revision_requested | submitted_v2 | validated | rejected
│           ├── proof_url, proof_text (au moins 1)
│           ├── version: 1 | 2
│           └── evaluations (FK submission_id, FK mentor user_id)
│               ├── scoring_breakdown JSONB (par critère de la rubric)
│               ├── total_score numeric
│               ├── feedback_text
│               └── verdict: validated | revision | rejected
├── missions (6-7 rows, FK event_id, FK level_id)
│   └── deliverable_templates (1+ par mission)
│       ├── scoring_rubric JSONB (critères + poids)
│       └── due_at TIMESTAMPTZ
├── pitch_scores (jour 2, FK player_id, FK juror user_id)
│   └── 5 critères sur 20 points chacun
└── results_published_at TIMESTAMPTZ (sur events)

levels (table ref statique, 8 rows : Niveau 0 à 7)

scores (vue matérialisée ou calculée live)
├── score_project (somme pondérée des evaluations validées)
└── score_engagement (somme S2)
```

**Suppressions par rapport au schema actuel** (`database/schema.sql`) :
- enum `bonus_type`, table `bonus_events`, table `bonus_rules` *(si présente)*
- enum `checkpoint_band`, enum `maturity_phase`, colonnes correspondantes
- enum `project_stage` (remplacé par `level_id` FK)
- `committee_dossiers`, `committee_members`, `committee_invitations` *(si présent)*
- `xp_ledger` (remplacé par calcul live à partir de `evaluations` + `engagement_events`)
- Colonnes `total_xp`, `pending_xp`, `prestige_xp` sur projects/players

**Renommages** :
- `projects` → `players`
- `project_members` → `player_members`
- `cohorts` (gardé)

### 4.3 Couches (héritées du code actuel mais simplifiées)

**Routing & Auth** : `middleware.ts` → `utils/supabase/middleware.ts`. Inchangé. Vérifier que `signIn` redirige correctement après auth, fix bugs identifiés dans `.planning/codebase/CONCERNS.md`.

**Page Layer** (server components) : routes principales :
- `/` → cockpit selon rôle (redirect vers `/journey` ou `/mentor` ou `/admin`)
- `/login`
- `/onboarding`
- `/journey` (Player)
- `/journey/deliverable/[id]` (soumission)
- `/mentor` (liste)
- `/mentor/submission/[id]` (évaluation)
- `/jury` (jour 2)
- `/results` (jour 2 après publication)
- `/admin` (dashboard GameMaster)
- `/admin/players/import` (CSV bulk)
- `/admin/players/[id]` (détail Player)
- `/admin/export/players.csv` (route handler)

**UI Shell** : `components/app-shell.tsx` simplifié — nav par rôle (Player / Mentor / GameMaster). Suppression des entrées `/committee`, `/admin/game`, `/admin/startups`.

**Server Actions** : `app/actions.ts` réécrit autour des nouvelles primitives :
- `signIn`, `signOut` (gardés, fix bugs)
- `completeOnboarding`
- `submitDeliverable` (V1 ou V2 selon état)
- `evaluateSubmission` (Mentor : valide / demande V2 / rejette)
- `submitPitchScore`
- `publishResults` (GameMaster)
- `importPlayersFromCsv`
- `createPlayer`, `updatePlayer`, `assignMentorToPlayer`

Toutes retournent `WorkflowState = { ok, message, data? }`. Plus de `return;` silencieux. Plus de variantes `Flow` séparées.

**Domain Library** : `lib/data.ts` (1285 lignes actuelles) **éclaté** en :
- `lib/types.ts` — pure types et enums
- `lib/seed/*.ts` — données seed (events, missions, deliverable_templates) pour démo locale
- `lib/score.ts` — calculs Score Projet + Engagement
- `lib/icons.ts` — lucide re-exports (pour ne pas dragger les icônes dans server bundles type-only)
- `lib/i18n.ts` (gardé, FR principalement)

**Supabase Adapters** : `utils/supabase/server.ts` + `utils/supabase/middleware.ts`. Inchangés sauf fix bugs.

**Export route handler** : 1 seul, `/admin/export/players.csv`. Lit Supabase si dispo sinon seed (pour dev).

### 4.4 Data flow type — soumettre un livrable

```text
Player sur /journey/deliverable/[id]
  ↓ submit form (FormData : proof_url, proof_text)
Server action submitDeliverable
  ↓ Zod validation (au moins un champ rempli, https://)
  ↓ Vérification Player owner (auth.getUser + check player_members)
  ↓ Vérification deliverable_template appartient à event actif
  ↓ Insert submissions (version=1 ou 2, status=submitted_v1/v2)
  ↓ Recalcul Score Engagement (+10 V1, +5 V2)
  ↓ revalidatePath /journey, /mentor
  ↓ return { ok: true, message: "Livrable soumis" }
Client redirect ou refresh
```

### 4.5 Error handling

**Stratégie** : visible côté Player et Mentor, jamais silencieux.

- Toute server action retourne `WorkflowState`. Si Zod fail → `{ ok: false, message }` avec message FR.
- Erreurs Supabase remontent dans message (sans exposer SQL details, juste catégorie : « Permission refusée », « Donnée invalide », « Erreur réseau »).
- Auth manquante → middleware redirect `/login?redirect=<path>`.
- Player tente d'évaluer (mauvais rôle) → 403 page personnalisée.
- Submission introuvable → 404 page.
- Erreurs côté composant client → ErrorBoundary qui affiche un message sobre avec bouton « Recharger ».
- Console côté serveur loggue les détails (`console.error`) pour debug pendant le pilote ; pas de Sentry au pilote.

### 4.6 Tests

**Pilot** : pas de tests automatisés.

**Plan de validation manuelle avant le 13 mai** (jour 5) :
1. Smoke test des 5 flows critiques avec un jeu de données seed (10 Players factices) sur l'environnement Vercel preview
2. Test rôle par rôle : Player soumet, Mentor évalue, GameMaster voit le dashboard
3. Test cas limites : double-soumission, V2 sans V1, Mentor évalue 2× le même livrable
4. Test responsive : laptop, tablette
5. Test charge léger : 5 sessions simultanées (Omar + 2-3 testeurs amis)

V2 introduira Vitest + Playwright + pgTAP RLS.

---

## 5. Plan de bataille — découpage 5 jours

| Jour | Focus | Livrable de fin de journée |
|---|---|---|
| **J1 (08/05 soir → 09/05)** | Foundation — schema, types, suppression code obsolète | Migration Postgres appliquée localement, types TS regénérés, code mort supprimé, login marche |
| **J2 (10/05)** | Player flow — onboarding + soumission + journey | Player peut se logger, faire onboarding, soumettre un livrable V1 |
| **J3 (11/05)** | Mentor flow — évaluation + boucle V1→V2 + scoring | Mentor évalue, Player voit feedback, peut soumettre V2 |
| **J4 (12/05)** | GameMaster — dashboard + bulk import + branding + page accueil | GameMaster voit dashboard, importe CSV, app a identité visuelle EIC |
| **J5 (13/05 matin)** | Pitch + Jury + Results + smoke test E2E + déploiement Vercel prod | URL prod live, données seed prêtes, magic links envoyés à 6-15 Players test internes pour répétition |

**Buffer de sécurité** : si J3 dérape, le « Pitch Jury » jour 2 peut être stub minimal (formulaire papier scanné ; saisie manuelle GameMaster) plutôt que workflow complet.

**Fallback total catastrophe** : si à J4 soir l'app n'est pas crédible, on bascule en mode hybride — onboarding + landing page de l'app, livrables remontés via Google Forms (S/F1 du brief Section 19), saisie GameMaster a posteriori dans l'app.

---

## 6. Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Refactor schema casse la migration Supabase prod | Perte d'environnement deploy | Travailler sur projet Supabase fresh, pas l'existant. Garder l'ancien comme rollback. |
| RLS mal configurée (user voit données d'autres Players) | Confiance pilote détruite, GDPR | Test exhaustif RLS avec 2 comptes Player factices avant 13 mai. Document policies dans `database/rls.sql`. |
| Lucide-react `^1.14.0` est un mauvais pin (CONCERNS.md) | Build cassé, supply-chain risk | Vérifier version résolue, repinner `lucide-react@latest` exact. À J1. |
| Magic link Supabase n'arrive pas (spam, config) | Players bloqués 13 matin | Test envoi magic link à 5 emails (Gmail, Outlook, UEMF) à J4. Plan B : password initial communiqué main propre. |
| Solo dev malade ou imprévu | Pilote retardé | Aucune mitigation tech ; communication précoce avec EIC pour décaler. |
| Ateliers 3-5 sans livrables explicites dans PDF | Pas de soumission durant 3 ateliers de J1 | Avant 13 mai, demander à Tamwilcom/EIC le détail des livrables ateliers 3-5. À défaut, créer livrables placeholder type « notes atelier » très light. |
| Niveau 3 « Proposition de valeur » manquant du programme | Incohérence brief vs réalité | Noter dans la spec et le compte-rendu post-pilote ; mentionner à EIC pour V2. |
| Première utilisation Vercel + Supabase prod en parallèle | Erreurs de config, certs DNS | Setup Vercel + Supabase prod à J1, pas à J5. Domaine custom optionnel — sous-domaine vercel.app suffit pour pilote. |
| Wifi salle de l'événement instable | App inutilisable | Vérifier infra salle. Player flow doit fonctionner sans rechargement constant (server components + caching). Cas extrême : mode hors-ligne dégradé V2. |

---

## 7. Décisions à confirmer avant implémentation

Ces points doivent être tranchés (par Omar, ou avec Tamwilcom/EIC) avant ou très tôt dans J1 :

1. **Liste exacte des livrables ateliers 3, 4, 5** — pour seeder les `deliverable_templates`
2. **Grilles de scoring par livrable** — utiliser celles du brief (Section 5 par niveau) ou simplifier (4 critères standards Section 14) ?
3. **Pondération Score Projet vs Pitch dans le classement final** — ex. 60/40, 50/50 ?
4. **Domaine de déploiement** — `entrepreneur-game.vercel.app` ou domaine custom EIC ?
5. **Email d'envoi magic link** — domaine SMTP par défaut Supabase ou config SMTP UEMF ?
6. **Assets de marque** — Omar fournit logos EIC/UEMF/partenaires en SVG/PNG haute déf
7. **Rôles Mentor vs Jury** — pour le pilote, les Mentors qui ont évalué les livrables jour 1 sont-ils les mêmes que les jurés du pitch jour 2 ? Probablement oui, donc 1 seul rôle Mentor avec accès jury jour 2.

---

## 8. Critères de réussite du pilote

### Techniques
- Aucune perte de données pendant les 13-14 mai
- Aucun bug bloquant rencontré pendant les 2 jours de l'événement
- ≤ 3 incidents mineurs (workaround possible)
- Tous les Players parviennent à soumettre au moins 1 livrable V1
- Tous les Mentors parviennent à évaluer au moins 1 livrable
- Le classement jury est calculé et publié à 15h00 jour 2

### Produit / pédago
- Les Players comprennent le flow sans tutoriel (>80% sans aide)
- Les feedbacks récoltés permettent de prioriser le V2
- Au moins une équipe utilise la boucle V1→V2 (preuve que l'amélioration pédagogique fonctionne)

### Stratégique
- L'app paraît crédible aux partenaires (Tamwilcom, BoA, Innov Invest)
- L'EIC valide le concept Entrepreneur Game pour étendre à d'autres cohortes/écoles

---

## 9. Liens vers les sources

- Brief produit : `entrepreneur_game_brief.md` (fourni par Omar, 2026-05-08)
- Programme événement : `Programme Hack'Days 16&17 Avril 2026.pdf` (Tamwilcom, modifiable, dates pilote = 13-14 mai)
- Codebase actuelle : `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`
- Instructions projet : `CLAUDE.md`

---

*Spec figée le 2026-05-08 après brainstorming structuré (skill superpowers:brainstorming). Pas de démarrage d'implémentation avant approbation Omar et passage par writing-plans.*
