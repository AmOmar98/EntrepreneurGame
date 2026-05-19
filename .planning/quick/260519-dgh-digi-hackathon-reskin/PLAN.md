# Digi-Hackathon 4ème édition — Reskin Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement task-by-task. Steps use checkbox `- [ ]` syntax.

**Goal:** Pivoter la plateforme Entrepreneur Game (v0.2-pilot-ready, post-AgreenTech) vers Digi-Hackathon 4ème édition (20-22 mai 2026, santé mentale jeunes, partenaires Min. Santé MA + UNFPA + AECID + Santé Jeunes + UEMF) **sans toucher au code applicatif ni au schéma DB** — uniquement seed event remplacé + libellés i18n adaptés + auth.users provisionnés.

**Architecture:** Réutilisation 100% du code v0.2. Nouveau fichier `database/seed_event_digi_hackathon.sql` parallèle au seed AgreenTech. Slug event interne `hack-days-fes-meknes-mai-2026` **conservé** (event_id stable pour ne pas casser les 15 fichiers TS qui le référencent). Seul `events.name`, dates, missions, deliverable_templates sont remplacés. i18n FR adapté via dictionary keys nouveaux (pas de find-replace destructif).

**Tech Stack:** Next.js 15 / Supabase prod (cdg1) / Vercel `entrepreneur-game-six.vercel.app` — aucune nouvelle dépendance.

**Timeline:** T-1 (19/05 soir → 20/05 09h00). Exécution séquentielle, 1 commit atomique par Task. Aucune Task >2h.

---

## Contexte critique (ne pas perdre)

### Programme Digi-Hackathon
- **J1 mer 20/05** : pitch initial 2min · Atelier 1 Design Thinking · Enquête ados · Atelier 2 BMC · Atelier 3 Étude marché · Panel 1 Santé mentale
- **J2 jeu 21/05** : Atelier 4 Stratégie · Panel 2 Mobile mental health · Atelier 5 Analyse financière · Atelier 6 Techniques de pitch · Pitch à blanc
- **J3 ven 22/05** : Présentation jury (8 min = 6+2 Q/A) · Cérémonie clôture

### Équipes (10, renumérotées 1-10 par Omar)
| # | Équipe | Lead | Membres |
|---|---|---|---|
| 1 | Simock | DJE BI TRAZIE ENOCK | Emmanuel, Charly tiomo |
| 2 | Graph-Anomal | Fatima Zahra Tliji | Khadija Nachid Idrissi, Fdili Rajae |
| 3 | Shihty+ | KASSAB kenza | Lasri badr, ANDRIAMAHEFASON Fifaliana Tendrisoa |
| 4 | AddictLess | Laaziz abdelaaziz | Douae Bellhadj |
| 5 | NAFAS | AMRI Mohammed Ouassim | Anouar Hanafi, Salah Eddin ABOUSALAMA, Ayoub FADIL |
| 6 | MedNova | maski ghita | Imane Chaouqi, maha marrakchi |
| 7 | HASSANA | Ahlam TARIK | Rabab Agoujim, Mehdi Rtel Bennani |
| 8 | MindBot | El Mehdi Nali | El qorchi Kawtar, HAJ HADDOUCH Yasmine |
| 9 | FokusMind | ZAHIRA BOULANOUAR | AL METALSI IKRAM, SALMA ELMESSAOUDI |
| 10 | Bla Dwa | Jriria Zakariae | ALILECH AYMANE, Salah eddine Regbi |

### Mentors (5 — confirmés Omar 19/05)
| # | Nom | Spécialité | Email | Note |
|---|---|---|---|---|
| M01 | Pr. Abebaw Degu | IA et systèmes numériques | `a.degu@ueuromed.org` ⚠️ pattern à confirmer | **Anglophone** — flag interface anglais si dispo |
| M02 | Pr. Oumaima Moutik | IA et computer vision | `o.moutik@ueuromed.org` | |
| M03 | Pr. Nisrine Lachgar | Systèmes embarqués + IA | `n.lachgar@ueuromed.org` | |
| M04 | Pr. Badr El Kari | Robotique + IA | `b.elkari@ueuromed.org` | |
| M05 | Pr. Hiba Sekkat | Robotique + IA | `h.sekkat@ueuromed.org` | |

Mots de passe : **générés aléatoirement à Task 4** (12 chars alphanum), loggés dans `cohorte-digi-hackathon-creds.csv` (gitignored).

### GameMasters (4 — inchangés)
Conserver les 4 comptes EIC existants du pilote AgreenTech (cf. memory `project_pilot_status.md`). Ne pas wipe ces auth.users.

### Jurys (3 — identifiés J1/J2)
Provisionner J01-J03 (`jury-01..03@digi.uemf.ma`) en Task 4 comme **placeholders inactifs**. Omar les remplit avec vrais emails le 20 ou 21/05 via `/admin/players/import` ou update SQL.

### Mapping 12 livrables Digi → 6 missions
| Mission | Level | Slot programme | Livrable(s) | Bonus ? |
|---|---|---|---|---|
| M1 | L1_problem | J1 10h30 Design Thinking | Hypothèses (slug `hypotheses-v1`) | non |
| M1 | L1_problem | (idem) | Persona (slug `persona-v1`) | **oui** |
| M2 | L2_solution | J1 11h00 Enquête ados | Fiche questionnaire utilisateur (slug `questionnaire-v1`) | non |
| M2 | L2_solution | (idem) | 10 fiches utilisateurs (slug `fiches-users-10-v1`) | non |
| M3 | L3_market | J1 14h00 BMC | BMC (slug `bmc-v1`) | non |
| M3 | L3_market | (idem) | TAM/SAM/SOM (slug `tam-sam-som-v1`) | **oui** |
| M4 | L4_business_model ord=4 | J1 15h00 Étude marché | MOSCOW (slug `moscow-v1`) | non |
| M4 | L4_business_model ord=4 | (idem) | Grille positionnement concurrents (slug `positionnement-v1`) | **oui** |
| M4 | L4_business_model ord=4 | (idem) | Grille comparaison alternatives (slug `comparaison-v1`) | **oui** |
| M5 | L4_business_model ord=5 | J2 09h30+11h | Analyse financière CAPEX/OPEX (slug `capex-opex-v1`) | non |
| M5 | L4_business_model ord=5 | (idem) | Stratégie 100 users (slug `strategie-100-users-v1`) | **oui** |
| M6 | L5_pitch | J3 09h30 Jury | Pitch Deck (slug `pitch-deck-v1`) | non |

**Total** : 7 principaux + 5 bonus = 12 livrables. Cohérent avec le brief.

### Cardinaux à ne pas violer
- **R1** : score visible Player UNIQUEMENT sur détail livrable → pas touché (code identique)
- **R2** : validators warn-only → pas touché (aucun validator modifié)
- **R3** : pas de blocage inter-mission → pas touché
- Pondération 0.20 (livrables) / 0.80 (pitch jury) inchangée

### Risques connus
1. **Slug event conservé** = `name` affiché ("Digi-Hackathon") différent du slug (`hack-days-fes-meknes-mai-2026`). Si Omar trouve ça gênant pour reporting post-event, on renomme en quick post-22/05 — pas avant.
2. **PROD wipe** nécessaire (20 auth.users AgreenTech à dégager). Tag `v0.2-pilot-ready` permet rollback distant si bug.
3. **Idea seeds onboarding L0** : pas de pré-remplissage — équipes saisissent leur idée à 9h. Risque : friction onboarding. Mitigation : projection live au mot de bienvenue 09h30.

---

## File Structure

**Created :**
- `database/seed_event_digi_hackathon.sql` — seed event Digi (calqué sur `seed_event_hackdays.sql`, 12 deliverable_templates)
- `database/wipe_event_agreentech.sql` — script idempotent qui DELETE submissions/evaluations/players AgreenTech + reset auth.users (10 nouveaux + mentors + jury)
- `.planning/quick/260519-dgh-digi-hackathon-reskin/AUDIT.md` — pre-edit audit (R1/R2/R3 grep verify)
- `.planning/quick/260519-dgh-digi-hackathon-reskin/SUMMARY.md` — post-exec summary + SHAs
- `.planning/quick/260519-dgh-digi-hackathon-reskin/deferred-items.md` — items reportés v0.3
- `cohorte-digi-hackathon-creds.csv` (gitignored) — creds 10 équipes + M01-M02 + J01-J03

**Modified :**
- `lib/i18n.ts:1-38` — ajouter clés `digi.title`, `digi.event_name`, `digi.cohort_name` (FR)
- Aucun autre fichier code.

**NOT modified :**
- `database/schema.sql` / `triggers.sql` / `rls.sql` — schéma intact
- `lib/types.ts` — types intacts
- `app/**/*.tsx` — code Player/Mentor/GameMaster intact
- `lib/score.ts` / `lib/results.ts` — scoring intact

---

## Task 0 : Export CSV PROD AgreenTech (AVANT wipe)

**Goal:** Sauvegarder la data pilote AgreenTech 13-14/05 avant le wipe Task 4. Préservation archivistique + partage post-event partenaires.

**Files:**
- Create: `.planning/exports/agreentech-2026-05-13-14/` (dossier d'archive local, gitignored)

- [ ] **Step 0.1 : Export players + submissions + evaluations via Supabase MCP**

Via `mcp__plugin_supabase_supabase__execute_sql` PROD, exporter en JSON (puis convertir CSV) les tables clés :

```sql
-- Export players AgreenTech
select p.*, c.slug as cohort_slug
from public.players p
join public.cohorts c on c.id = p.cohort_id
where c.slug = 'cohorte-mai-2026';

-- Export submissions
select s.*, p.slug as player_slug, dt.slug as template_slug
from public.submissions s
join public.players p on p.id = s.player_id
join public.deliverable_templates dt on dt.id = s.deliverable_template_id;

-- Export evaluations + comments
select e.*, s.id as submission_id
from public.evaluations e
join public.submissions s on s.id = e.submission_id;

select ec.* from public.evaluation_comments ec;

-- Export bonus_events
select * from public.bonus_events;

-- Export profiles mentors/jurys AgreenTech
select * from public.profiles where role in ('mentor', 'reviewer', 'committee_member');
```

Sauvegarder chaque résultat JSON localement dans `.planning/exports/agreentech-2026-05-13-14/<table>.json`.

- [ ] **Step 0.2 : Export CSV via `/admin/export/players.csv` (route existante)**

```bash
# Depuis browser auth GM, télécharger :
# https://entrepreneur-game-six.vercel.app/admin/export/players.csv
# Sauvegarder dans .planning/exports/agreentech-2026-05-13-14/players.csv
```

- [ ] **Step 0.3 : Vérifier intégrité export**

```bash
ls -la .planning/exports/agreentech-2026-05-13-14/
wc -l .planning/exports/agreentech-2026-05-13-14/*.json
```

Expected:
- `players.json` : 11 lignes (11 porteurs P01-P11)
- `submissions.json` : ~27+ lignes (smoke 10/05 + pilote 13-14/05)
- `evaluations.json` : N lignes (notées par mentors)
- `players.csv` : 12 lignes (1 header + 11 porteurs)

- [ ] **Step 0.4 : Confirmer `.gitignore` exclut `.planning/exports/`**

```bash
grep -E "^\.planning/exports" .gitignore || echo ".planning/exports/" >> .gitignore
```

- [ ] **Step 0.5 : Pas de commit code — archive locale uniquement**

Confirmer avec Omar : "Archive AgreenTech sauvegardée dans `.planning/exports/agreentech-2026-05-13-14/`. OK pour wipe Task 4 ?"

**STOP gate** : ne pas continuer Task 1 sans accord explicite Omar sur l'archive (data 13-14/05 perdue côté DB après Task 4.1).

---

## Task 1 : Pre-edit audit (cardinaux R1/R2/R3)

**Files:**
- Create: `.planning/quick/260519-dgh-digi-hackathon-reskin/AUDIT.md`

- [ ] **Step 1.1 : Vérifier que tag `v0.2-pilot-ready` est pushé**

```bash
git tag -l 'v0.2-pilot-ready' && git ls-remote --tags origin | grep v0.2-pilot-ready
```

Expected: deux lignes (locale + remote). Si manquant remote : `git push origin v0.2-pilot-ready` avant de continuer.

- [ ] **Step 1.2 : Créer tag pré-reskin `v0.2.1-pre-digi`**

```bash
git tag -a v0.2.1-pre-digi -m "Snapshot pre-Digi-Hackathon reskin 20/05/2026"
git push origin v0.2.1-pre-digi
```

Expected: tag local + push OK.

- [ ] **Step 1.3 : Grep R1 (score Player-side) baseline**

```bash
grep -rn "score\|rank\|note\|/100\|/140\|points\|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"
```

Expected: aucun match (ou matchs déjà connus baseline). Logger output dans `AUDIT.md`.

- [ ] **Step 1.4 : Confirmer aucun edit code applicatif requis**

```bash
git diff --stat HEAD origin/main  # doit être propre
```

Expected: empty. Si dirty, stash avant Task 2.

- [ ] **Step 1.5 : Écrire `AUDIT.md`**

Contenu minimal :
```markdown
# AUDIT — Digi-Hackathon Reskin
Date: 2026-05-19
Cardinaux R1/R2/R3 : aucun code applicatif modifié dans ce plan → cardinaux préservés par construction.
Tag pré-reskin : v0.2.1-pre-digi (SHA <à remplir>)
Rollback distant : `git push origin --force v0.2.1-pre-digi:main` (avec accord explicite Omar).
```

- [ ] **Step 1.6 : Commit**

```bash
git add .planning/quick/260519-dgh-digi-hackathon-reskin/AUDIT.md
git commit -m "(quick-260519-dgh) audit: snapshot cardinaux + tag v0.2.1-pre-digi"
git push origin main
```

---

## Task 2 : Écrire le seed SQL Digi-Hackathon

**Files:**
- Create: `database/seed_event_digi_hackathon.sql`

- [ ] **Step 2.1 : Bootstrap header + idempotency contract**

Créer `database/seed_event_digi_hackathon.sql` avec header analogue à `seed_event_hackdays.sql:1-21`, en notant :
- Idempotent via ON CONFLICT
- Slug event **conservé** = `hack-days-fes-meknes-mai-2026` (pour event_id stable)
- `events.name` mis à jour = `'Digi-Hackathon 4ème édition'`
- `events.starts_at` = `'2026-05-20 09:00:00+01'` / `ends_at` = `'2026-05-22 13:00:00+01'`
- Cohort slug = `cohorte-digi-mai-2026` (nouveau slug pour distinguer post-event)

- [ ] **Step 2.2 : Section 1 Levels — copie exacte de `seed_event_hackdays.sql:26-38`**

Aucune modification. Levels L0..L7 sont reference data partagée.

- [ ] **Step 2.3 : Section 2 Event — UPDATE name + dates**

```sql
insert into public.events (slug, name, starts_at, ends_at)
values (
  'hack-days-fes-meknes-mai-2026',
  'Digi-Hackathon 4ème édition',
  '2026-05-20 09:00:00+01',
  '2026-05-22 13:00:00+01'
)
on conflict (slug) do update
  set name = excluded.name,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at;
```

- [ ] **Step 2.4 : Section 3 Cohort — nouvelle cohorte**

```sql
insert into public.cohorts (event_id, slug, name)
select e.id, 'cohorte-digi-mai-2026', 'Cohorte Digi-Hackathon Mai 2026'
from public.events e
where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, slug) do update
  set name = excluded.name;
```

- [ ] **Step 2.5 : Section 4 Missions — 6 missions Digi**

Remplacer 6 INSERT missions avec :
| ord | level_id | kind | title | scheduled_at |
|---|---|---|---|---|
| 1 | L1_problem | atelier | `'Atelier 1 — Design Thinking (Hypothèses & Persona)'` | `'2026-05-20 10:30:00+01'` |
| 2 | L2_solution | atelier | `'Atelier 2 — Enquête utilisateurs (Questionnaire + 10 fiches)'` | `'2026-05-20 11:00:00+01'` |
| 3 | L3_market | atelier | `'Atelier 3 — Business Model Canvas + TAM/SAM/SOM'` | `'2026-05-20 14:00:00+01'` |
| 4 | L4_business_model | atelier | `'Atelier 4 — Étude marché (MOSCOW + Concurrents)'` | `'2026-05-20 15:00:00+01'` |
| 5 | L4_business_model | atelier | `'Atelier 5 — Stratégie & Analyse financière'` | `'2026-05-21 09:30:00+01'` |
| 6 | L5_pitch | pitch | `'Atelier 6 — Pitch final & présentation jury'` | `'2026-05-22 09:30:00+01'` |

Chaque INSERT suit exactement le pattern `seed_event_hackdays.sql:75-83` (avec `on conflict (event_id, level_id, ord) do update`).

- [ ] **Step 2.6 : Section 5 DeliverableTemplates — 12 templates Digi**

Pour CHAQUE livrable du mapping, calquer le pattern `seed_event_hackdays.sql:147-182` avec :
- `slug` selon mapping (`hypotheses-v1`, `persona-v1`, `questionnaire-v1`, `fiches-users-10-v1`, `bmc-v1`, `tam-sam-som-v1`, `moscow-v1`, `positionnement-v1`, `comparaison-v1`, `capex-opex-v1`, `strategie-100-users-v1`, `pitch-deck-v1`)
- `title` lisible humain
- `description` adaptée santé mentale jeunes (cf. templates ci-dessous)
- `rubric` adaptée par livrable, `max_score=25` uniforme (préserve scoring 0.20/0.80)
- `ord` séquentiel par mission (M4 = 1/2/3 pour MOSCOW/positionnement/comparaison)
- `is_bonus = true` pour Persona, TAM/SAM/SOM, positionnement, comparaison, stratégie 100 users

**Templates rubric (synthèse — chaque template = ~30 lignes SQL) :**

```sql
-- 5.1 — M1/L1 Hypothèses (principal)
-- slug: hypotheses-v1, ord: 1, is_bonus: false
-- rubric: completion-based 25 points uniques (philosophie polish 12/05 = 1 critère pour livrables narratifs)
[{"key":"completion","label":"Hypothèses soumises + pitch 2min réalisé (0=à refaire, 25=complet)","max":25}]

-- 5.2 — M1/L1 Persona (bonus)
-- slug: persona-v1, ord: 2, is_bonus: true
-- description : 1 fiche persona = 1 adolescent/jeune réel cible santé mentale, tableau Attribut/Valeur/Source, >=2 sources
-- rubric :
[
  {"key":"precision","label":"Précision cible (tranche d'âge + contexte + zone)","max":5},
  {"key":"pain_terrain","label":"Douleur santé mentale observée (citation/observation, pas supposée)","max":5},
  {"key":"concretude","label":"Chiffres concrets (heures écran, fréquentation services, canaux info)","max":5},
  {"key":"evidence","label":"Triangulation sources (>=2 distinctes en colonne Source)","max":5},
  {"key":"quality","label":"Qualité fiche (lisibilité, structuration tableau)","max":5}
]

-- 5.3 — M2/L2 Fiche questionnaire utilisateur (principal)
-- slug: questionnaire-v1, ord: 1, is_bonus: false
-- description : questionnaire structuré 8-12 questions ouvertes ados, ciblé santé mentale, prêt à diffuser
-- rubric :
[
  {"key":"structure","label":"8-12 questions ouvertes, progression logique","max":10},
  {"key":"pertinence","label":"Questions ciblent les hypothèses M1 (validation/réfutation)","max":10},
  {"key":"ethique","label":"Formulation respectueuse / consentement / anonymat mentionné","max":5}
]

-- 5.4 — M2/L2 10 fiches utilisateurs partagées (principal)
-- slug: fiches-users-10-v1, ord: 2, is_bonus: false
-- description : 10 entretiens menés, réponses tabulées + verbatims clés extraits
-- rubric :
[
  {"key":"completion","label":"10 fiches complétées (1 par utilisateur réel)","max":15},
  {"key":"verbatims","label":">=3 verbatims forts extraits/cités","max":5},
  {"key":"synthese","label":"Synthèse patterns observés (1 paragraphe)","max":5}
]

-- 5.5 — M3/L3 BMC (principal)
-- slug: bmc-v1, ord: 1, is_bonus: false
-- description : Business Model Canvas 9 blocs santé mentale, lié au persona M1 + verbatims M2
-- rubric :
[
  {"key":"completion","label":"Complétion 9 blocs (>=2 phrases chacun, pas de bloc vide)","max":15},
  {"key":"coherence","label":"Cohérence avec persona M1, verbatims M2, hypothèses M1","max":10}
]

-- 5.6 — M3/L3 TAM/SAM/SOM (bonus)
-- slug: tam-sam-som-v1, ord: 2, is_bonus: true
-- description : 3 niveaux marché (TAM ados Maroc, SAM zone accessible, SOM capture an 1) avec hypothèses
-- rubric :
[
  {"key":"calcul_explicite","label":"3 niveaux estimés, chaque chiffre = source/hypothèse explicite","max":15},
  {"key":"realisme_som","label":"SOM cohérent avec stratégie 100 users (taux adoption crédible)","max":5},
  {"key":"coherence_persona","label":"SAM cohérent avec persona M1","max":5}
]

-- 5.7 — M4/L4 MOSCOW (principal)
-- slug: moscow-v1, ord: 1, is_bonus: false
-- description : MUST/SHOULD/COULD/WONT pour le MVP digital mental health, format Kanban link
-- rubric :
[
  {"key":"completion","label":"4 colonnes, >=2 MUST, >=1 WONT, cartes avec feature+pourquoi","max":15},
  {"key":"pertinence","label":"MUST lèvent vraies contraintes (RGPD, mineurs, confidentialité) ; WONT = vrai arbitrage","max":10}
]

-- 5.8 — M4/L4 Grille positionnement concurrents (bonus)
-- slug: positionnement-v1, ord: 2, is_bonus: true
-- description : Carte 2D positionnement vs 3-5 concurrents (apps santé mentale ados : Headspace, Calm, services publics MA)
-- rubric :
[
  {"key":"competitors","label":"3-5 concurrents identifiés, fiche par concurrent","max":10},
  {"key":"axes","label":"2 axes pertinents, votre solution placée + justifiée","max":10},
  {"key":"differenciation","label":"Lien clair avec hypothèses M1 (angle ressort)","max":5}
]

-- 5.9 — M4/L4 Grille comparaison alternatives (bonus)
-- slug: comparaison-v1, ord: 3, is_bonus: true
-- description : Tableau comparatif features × concurrents + alternatives non-digitales (CMPP, ligne d'écoute)
-- rubric :
[
  {"key":"matrice","label":"Tableau features × 3-5 concurrents + 1-2 alternatives non-digitales","max":15},
  {"key":"insight","label":"Au moins 1 insight stratégique extrait (gap, opportunité)","max":10}
]

-- 5.10 — M5/L4 Analyse financière CAPEX/OPEX (principal)
-- slug: capex-opex-v1, ord: 1, is_bonus: false
-- description : CAPEX initial (dev app/contenu) + OPEX an 1 (hosting, modération, marketing), avec sources
-- rubric :
[
  {"key":"capex_detail","label":"CAPEX détaillé par poste, total, durée amortissement","max":10},
  {"key":"opex_detail","label":"OPEX détaillé par poste, total annuel","max":10},
  {"key":"sources","label":"Devis ou benchmarks cités par ligne (anti-fabrication)","max":5}
]

-- 5.11 — M5/L4 Stratégie 100 users (bonus)
-- slug: strategie-100-users-v1, ord: 2, is_bonus: true
-- description : Plan acquisition 100 premiers ados/jeunes : canaux, partenariats (écoles, CMPP, influenceurs), actions S1
-- rubric :
[
  {"key":"canaux","label":"3-5 canaux identifiés, fiche par canal (cible, coût, ROI estimé)","max":10},
  {"key":"mix","label":">=1 canal non-digital + diversité (institutionnels + terrain + influenceurs)","max":5},
  {"key":"action_concrete","label":"Action S1 post-hackathon activable dès 23/05","max":10}
]

-- 5.12 — M6/L5 Pitch Deck (principal)
-- slug: pitch-deck-v1, ord: 1, is_bonus: false
-- description : Deck final 10-12 slides santé mentale, slide 4 OBLIGATOIRE = preuve terrain (verbatim ou chiffre)
-- rubric :
[
  {"key":"structure","label":"10-12 slides, structure standard pitch","max":5},
  {"key":"preuve_slide4","label":"Slide 4 = verbatim OU chiffre terrain sourcé (anti-fabrication)","max":10},
  {"key":"coherence","label":"Reprend persona M1 + hypothèses M1 + BMC M3 + analyse M5","max":5},
  {"key":"clarte","label":"Lisibilité, design propre, demande claire","max":5}
]
```

- [ ] **Step 2.7 : Lint SQL local (dry-run)**

```bash
# Vérifier que le SQL parse via psql --dry-run équivalent (lecture seule du fichier)
head -n 30 database/seed_event_digi_hackathon.sql
wc -l database/seed_event_digi_hackathon.sql  # attendu ~600 lignes
```

Expected: header + ~600 lignes. Aucun syntax error visuel.

- [ ] **Step 2.8 : Commit**

```bash
git add database/seed_event_digi_hackathon.sql
git commit -m "(quick-260519-dgh) seed: add Digi-Hackathon 4ème édition event data (12 deliverables, 6 missions)"
git push origin main
```

---

## Task 3 : Adapter i18n FR (clés Digi)

**Files:**
- Modify: `lib/i18n.ts:1-38`

- [ ] **Step 3.1 : Lire `lib/i18n.ts` actuel**

```bash
cat lib/i18n.ts
```

Identifier les clés contenant "AgreenTech" / "AgriTech" / "Hack-Days" / "agriculteur" etc.

- [ ] **Step 3.2 : Stratégie i18n**

Deux options :
1. **Remplacer en place** les valeurs FR des clés existantes pointant vers AgreenTech (find/replace ciblé)
2. **Ajouter clés `digi.*`** et basculer côté code (impact 15 fichiers TS — trop risqué T-1)

**Choisir Option 1.** Remplacer uniquement les valeurs `fr:` qui sont des libellés affichés (titre event, hero, badges). Ne PAS toucher aux clés (les keys restent stables).

- [ ] **Step 3.3 : Effectuer les remplacements**

Remplacer dans `lib/i18n.ts` :
- `"AgreenTech 2026"` → `"Digi-Hackathon 4ème édition"`
- `"Hack-Days Fès-Meknès"` → `"Digi-Hackathon Fès"`
- `"AgriTech"` (en libellé Player-facing) → `"Mental Health"` ou `"Santé mentale digitale"` selon contexte
- `"agriculteur"` / `"agricultrice"` → `"jeune"` / `"adolescent"` (libellés narratifs uniquement)
- Toute mention `"13-14 mai"` → `"20-22 mai"`

Faire ces remplacements **UNIQUEMENT dans `lib/i18n.ts`** — pas dans le reste du code (les chaînes hardcodées hors i18n sont acceptées comme dette technique post-22/05).

- [ ] **Step 3.4 : typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Expected: zero error / zero warning new.

- [ ] **Step 3.5 : Commit**

```bash
git add lib/i18n.ts
git commit -m "(quick-260519-dgh) i18n: rebrand FR strings AgreenTech → Digi-Hackathon"
git push origin main
```

---

## Task 4 : Provisioning auth.users + cohort PROD

**Files:**
- Create: `cohorte-digi-hackathon-creds.csv` (gitignored, root)
- Reference: memory `reference_cohort_csvs.md`

**Pré-requis** : confirmer auprès d'Omar la liste mentors + jury (placeholders M01-M02 + J01-J03 si non fourni).

- [ ] **Step 4.1 : Wipe AgreenTech PROD (via MCP Supabase ou SQL Editor)**

```sql
-- À exécuter via mcp__plugin_supabase_supabase__execute_sql après get_logs baseline
-- ATTENTION : destructif. Confirmer accord Omar.
begin;
delete from public.evaluation_comments where evaluation_id in (
  select id from public.evaluations
);
delete from public.evaluations;
delete from public.submissions;
delete from public.bonus_events;
delete from public.players;
delete from public.profiles where role in ('founder', 'mentor', 'reviewer', 'committee_member');
delete from auth.users where email like '%@agreentech.test' or email like '%@digi.test';
commit;
```

Expected: lignes deleted = N. Si erreur RLS / FK : revert begin, investiguer avant de continuer.

- [ ] **Step 4.2 : Appliquer `seed_event_digi_hackathon.sql`**

Via MCP Supabase ou SQL Editor PROD :

```bash
# Option A — via psql local + connection string PROD
psql "$DATABASE_URL_PROD" -f database/seed_event_digi_hackathon.sql

# Option B — via Supabase MCP execute_sql, chunks de ~50 lignes
```

Expected: `INSERT 0 1` ou `INSERT 0 0` (ON CONFLICT) pour chaque statement. Aucune erreur.

- [ ] **Step 4.3 : Vérifier seed appliqué**

```sql
select slug, name, starts_at, ends_at from public.events where slug = 'hack-days-fes-meknes-mai-2026';
select count(*) from public.missions m join public.events e on e.id=m.event_id where e.slug='hack-days-fes-meknes-mai-2026';
select count(*) from public.deliverable_templates dt join public.missions m on m.id=dt.mission_id join public.events e on e.id=m.event_id where e.slug='hack-days-fes-meknes-mai-2026';
```

Expected: 1 event "Digi-Hackathon 4ème édition" / 6 missions / 12 deliverable_templates.

- [ ] **Step 4.4 : Provisioning auth.users — 10 équipes + mentors + jury**

Pour chaque équipe, créer un compte unique pour le **lead** (autres membres ajoutés via player_members si schema le supporte, sinon shared login).

```
Email pattern : team-<slug>@digi.uemf.ma
Password : aléatoire 12 chars (logged dans CSV)
```

| # | Slug | Email | Display name |
|---|---|---|---|
| 1 | simock | team-simock@digi.uemf.ma | Simock — DJE BI TRAZIE ENOCK |
| 2 | graph-anomal | team-graph-anomal@digi.uemf.ma | Graph-Anomal — Fatima Zahra Tliji |
| 3 | shihty-plus | team-shihty-plus@digi.uemf.ma | Shihty+ — KASSAB kenza |
| 4 | addictless | team-addictless@digi.uemf.ma | AddictLess — Laaziz abdelaaziz |
| 5 | nafas | team-nafas@digi.uemf.ma | NAFAS — AMRI Mohammed Ouassim |
| 6 | mednova | team-mednova@digi.uemf.ma | MedNova — maski ghita |
| 7 | hassana | team-hassana@digi.uemf.ma | HASSANA — Ahlam TARIK |
| 8 | mindbot | team-mindbot@digi.uemf.ma | MindBot — El Mehdi Nali |
| 9 | fokusmind | team-fokusmind@digi.uemf.ma | FokusMind — ZAHIRA BOULANOUAR |
| 10 | bla-dwa | team-bla-dwa@digi.uemf.ma | Bla Dwa — Jriria Zakariae |

**Mentors (5 — emails confirmés Omar 19/05) :**
| # | Email | Nom | Note |
|---|---|---|---|
| M01 | `a.degu@ueuromed.org` ⚠️ | Pr. Abebaw Degu | **Anglophone** + pattern email à confirmer |
| M02 | `o.moutik@ueuromed.org` | Pr. Oumaima Moutik | |
| M03 | `n.lachgar@ueuromed.org` | Pr. Nisrine Lachgar | |
| M04 | `b.elkari@ueuromed.org` | Pr. Badr El Kari | |
| M05 | `h.sekkat@ueuromed.org` | Pr. Hiba Sekkat | |

**Jurys (3) :** placeholders `jury-01..03@digi.uemf.ma` — Omar fournit vrais emails J1 ou J2 → update via SQL ou `/admin/players/import` runtime.

**GameMasters (4) :** ne pas toucher. Conserver auth.users EIC existants du pilote AgreenTech.

Utiliser le script de provisioning existant (cf. `database/seed_bootcamp.sql` ou `app/admin/players/import` UI) — pas réinventer.

- [ ] **Step 4.5 : Insérer rows `players` liées à cohort digi**

```sql
-- Pour chaque équipe, créer player rattaché à cohorte-digi-mai-2026
-- Statut : 'active', current_level: 'L0_diagnostic', onboarded_at: NULL
-- idea : NULL (rempli à 9h par l'équipe via onboarding)
```

10 INSERT players dans `cohorte-digi-mai-2026`.

- [ ] **Step 4.6 : Exporter creds CSV**

Créer `cohorte-digi-hackathon-creds.csv` (gitignored) :
```csv
team_id,team_name,lead_name,email,password,slug
2,Simock,DJE BI TRAZIE ENOCK,team-simock@digi.uemf.ma,<random>,simock
3,Graph-Anomal,...
```

Confirmer dans `.gitignore` que le fichier est exclu (`cohorte-*.csv` pattern déjà couvert d'après memory `reference_cohort_csvs.md`).

- [ ] **Step 4.7 : Pas de commit code — uniquement update memory**

Mettre à jour memory `project_prod_pilot_state.md` avec :
- Date reseed : 2026-05-19
- Event : Digi-Hackathon 4ème édition
- 10 teams provisioned + M/J/GM placeholders
- Slug event interne conservé pour stabilité

---

## Task 5 : Smoke test PROD minimal (2P + 1M + 1GM)

**Files:**
- Reference: memory `feedback_smoke_minimal_2p_1m_1gm.md`
- Aucun fichier créé.

- [ ] **Step 5.1 : Déclencher redeploy Vercel (si i18n ou seed implique rebuild)**

```bash
# Le commit i18n Task 3 doit avoir déjà déclenché Vercel auto-deploy.
# Vérifier dernier deploy :
```

Via `mcp__claude_ai_Vercel__list_deployments` ou dashboard : confirmer dernier deploy `READY` sur `main`.

- [ ] **Step 5.2 : Smoke Player (équipe Simock ou Graph-Anomal)**

Manuel via browser (Chrome) sur `https://entrepreneur-game-six.vercel.app/login` :
1. Login team-simock
2. Onboarding L0 : saisir idea ("App santé mentale ados …")
3. `/journey` : vérifier 6 missions affichées + titres Digi
4. Ouvrir M1 détail livrable : vérifier rubric Persona/Hypothèses correcte
5. Soumettre URL https://docs.google.com/test pour Hypothèses → statut `submitted_v1`

Expected: aucune erreur 500, navigation fluide, libellés Digi visibles, pas de "AgreenTech" résiduel côté Player.

- [ ] **Step 5.3 : Smoke Mentor (M01)**

1. Login mentor-01
2. `/mentor` : voir submission Simock M1 en queue
3. Ouvrir submission, noter rubric 5×5=25, verdict `validate_v1`
4. Vérifier propagation status → `validated_v1` côté Player (via Step 5.2 player re-load)

Expected: workflow MSU end-to-end OK (cf. memory `project_msu_rls_status_propagation_fix.md`).

- [ ] **Step 5.4 : Smoke GameMaster**

1. Login gamemaster
2. `/admin` : voir cohorte Digi avec 10 équipes
3. Export CSV `/admin/export/players.csv` → 10 rows OK
4. Vérifier R1 : score Simock invisible côté Player `/journey` / `/results` (uniquement visible sur détail livrable)

Expected: cardinaux préservés.

- [ ] **Step 5.5 : Console DevTools Chrome — zero error**

Pendant les 3 smoke (P/M/GM), surveiller console JS : aucun error rouge, aucun network 5xx.

- [ ] **Step 5.6 : Documenter résultats smoke dans SUMMARY.md**

Voir Task 6.

---

## Task 6 : Wrap-up + SUMMARY + deferred-items

**Files:**
- Create: `.planning/quick/260519-dgh-digi-hackathon-reskin/SUMMARY.md`
- Create: `.planning/quick/260519-dgh-digi-hackathon-reskin/deferred-items.md`

- [ ] **Step 6.1 : Écrire SUMMARY.md**

```markdown
# SUMMARY — Digi-Hackathon Reskin

Date d'exécution : 2026-05-19
Tag pré-reskin : v0.2.1-pre-digi
Commits atomiques :
- Task 1 audit : <SHA>
- Task 2 seed SQL : <SHA>
- Task 3 i18n : <SHA>
- Task 4 PROD reseed : opérations DB uniquement (pas de commit code)

Smoke PROD résultats :
- Player Simock : <OK/KO + notes>
- Mentor M01 : <OK/KO + notes>
- GameMaster : <OK/KO + notes>
- Cardinaux R1/R2/R3 : <OK/KO>

État final : <READY / NEEDS-FIX>
```

- [ ] **Step 6.2 : Écrire deferred-items.md**

```markdown
# Deferred — Digi-Hackathon Reskin

À traiter post-22/05 :
- [ ] Renommer slug event en `digi-hackathon-mai-2026` (refactor 15 fichiers TS)
- [ ] Confirmer équipes #1 et #11 et provisionner si présentes
- [ ] Cleanup chaînes hardcodées "AgriTech"/"agriculteur" hors lib/i18n.ts (15 fichiers)
- [ ] Migration livrables Digi vers bonus_events table (pattern v0.3 already planned for AgreenTech)
- [ ] Adapter `cdg1` region si event majoritairement remote (low priority)
```

- [ ] **Step 6.3 : Commit final**

```bash
git add .planning/quick/260519-dgh-digi-hackathon-reskin/SUMMARY.md .planning/quick/260519-dgh-digi-hackathon-reskin/deferred-items.md
git commit -m "(quick-260519-dgh) wrap: SUMMARY + deferred items post Digi-Hackathon reskin"
git push origin main
```

- [ ] **Step 6.4 : Push notification à Omar**

Si MCP PushNotification dispo, envoyer "Digi-Hackathon PROD ready — smoke OK". Sinon, message terminal final.

---

## Rollback Procedure (si bloquant en J1)

Si bug critique détecté le 20/05 matin :

```bash
# Option A : Rollback distant via tag v0.2.1-pre-digi
git push origin --force v0.2.1-pre-digi:main  # avec accord Omar uniquement

# Option B : Restaurer seed AgreenTech (PROD)
psql "$DATABASE_URL_PROD" -f database/seed_event_hackdays.sql
# + wipe Digi data
```

**Pré-condition** : tag v0.2.1-pre-digi pushé à Task 1 Step 1.2. Si manquant, rollback impossible distant.

---

## Self-Review notes (auteur du plan)

- **Spec coverage** : 12 livrables Digi → 12 deliverable_templates mappés sur 6 missions ✓ ; programme 3 jours respecté via scheduled_at ✓ ; cardinaux R1/R2/R3 préservés par no-touch code ✓.
- **Placeholders** : Step 4.4 contient placeholders mentors/jury — **à confirmer avec Omar avant exécution Task 4**. Flag explicite dans le plan.
- **Type consistency** : slugs unique par mission, ord séquentiel, is_bonus cohérent avec rubric ✓.
- **Scope** : 6 tasks atomiques, ~6-10h total, T-1 réaliste. Si Omar veut compresser, fusionner Task 1+2 et Task 5+6 → 4 tasks 6h.

**Question critique avant exécution** : Omar confirme-t-il
1. les emails mentors/jury (ou OK placeholders) ?
2. le wipe PROD AgreenTech (data du pilote 13-14/05 sera perdue → exporter d'abord ?) ?
3. les équipes #1 et #11 manquantes ?
