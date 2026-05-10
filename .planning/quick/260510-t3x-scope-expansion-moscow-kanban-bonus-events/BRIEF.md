# T-3 Scope Expansion — MoSCoW Kanban + Bonus Events Recreate

**Date** : 2026-05-10 (T-3, samedi)
**Status** : SCOPE EXPANSION — freeze T-3 explicitement override par owner (Omar)
**Cible go-live** : 2026-05-13 08h30 (mer) — risque de delai assume
**Source** : decision live session 2026-05-10 — passe en revue livrables -> reframe pedagogique

> Ce brief sert de SEED pour `/gsd-plan-phase` lance dans une session separee.
> Le PLAN.md detaille sera produit par cette commande. Ici on capture INTENTION + SCOPE + RISQUES.

---

## 1. Pourquoi (motivation owner)

Lors de la passe en revue des 9 livrables AgreenTech (2026-05-10 matin), Omar a reframe trois decisions pedagogiques majeures :

1. **#3 (M2 L2 ord 1)** : `esquisse-solution-v1` devient **Business Model Canvas (9 blocs)** au lieu de "Solution & MoSCoW v1". Notion de **sous-livrables** (1 par bloc BMC) avec progression et **multiplicateur vitesse X1/X2/X3** envisages comme feature future.

2. **#4 (M2 L2 ord 2)** : `fiche-produit-plan-dev-v1` "3 verbatims terrain" devient **MoSCoW with Kanban mode on web + export CSV**. Verbatims migrent vers un livrable BONUS optionnel.

3. **Bonus livrables** introduits : (a) Development plan, (b) Prototype draft (drawing/wireframe/Figma/picture/system).

Le mecanisme `bonus_events` (XP cap, claim flow, mailto) avait ete **retire en v0.2** (cf CLAUDE.md "bonus XP rules removed during v0.2"). Il faut donc le **recreer** pour heberger les bonus livrables.

## 2. Scope items detaille

### 2.A — bonus_events recreate (CRITIQUE)

**Schema** (nouvelle migration Supabase) :
- Table `bonus_events` (id, project_id, type, title, description, doc_url, status, claimed_at, reviewed_by, reviewed_at, created_at, updated_at)
- Enum `bonus_type` (dev_plan, prototype_draft, verbatims_terrain, ...)
- Enum `bonus_status` (draft, submitted, validated, rejected)
- RLS policies : Player voit ses bonus, Mentor voit ceux du project assigned, GM voit tous
- Trigger `updated_at`

**Server actions** (`app/actions.ts`) :
- `claimBonusEventFlow` (Player submit URL preuve)
- `reviewBonusEventFlow` (Mentor validate Y/N + score)
- `bonusSchema` Zod inputs

**UI** :
- `app/journey/bonus/[type]/page.tsx` : Player claim form
- `app/mentor/bonus/[id]/page.tsx` : Mentor review
- Component `bonus-claim-form.tsx` (link-based proof, mailto draft)
- Surface bonus disponibles dans `/journey` rail

**Effort estime** : 12-16h

### 2.B — MoSCoW Kanban web natif (#4)

**UI** :
- Component `moscow-kanban.tsx` : 4 colonnes (Must / Should / Could / Won't)
- DnD library : `@dnd-kit/core` (deja dans certains projets Next.js, sinon `react-beautiful-dnd` legacy)
- Carte = (feature, pourquoi, contrainte_terrain)
- Persist DB : table `moscow_cards` (id, project_id, deliverable_id, bucket, ord, feature, pourquoi, contrainte, created_at, updated_at)

**Schema** :
- Migration nouvelle table `moscow_cards` + RLS + trigger updated_at
- Enum `moscow_bucket` (must, should, could, wont)

**Server actions** :
- `createMoscowCard`, `updateMoscowCard`, `deleteMoscowCard`, `reorderMoscowCards`
- `submitMoscowDeliverable` (snapshot URL ou auto-generate JSON)

**Effort estime** : 16-20h

### 2.C — CSV Export MoSCoW (#4)

**Route handler** : `app/api/export/moscow/[deliverableId].csv/route.ts`
- GM-only (auth gate via `is_staff()`)
- Format : feature, bucket, pourquoi, contrainte, created_at
- Re-utilise `lib/csv.ts` : `csvResponse(filename, toCsv(rows))`

**Effort estime** : 3-4h

### 2.D — Bonus livrables seed (3 entrees)

3 nouvelles entrees dans `deliverable_templates` (ou table `bonus_events` selon design final) :
1. `bonus-verbatims-terrain` — 3 verbatims, ex-#4 du seed actuel
2. `bonus-dev-plan` — Development plan
3. `bonus-prototype-draft` — Prototype draft (visuel)

Chaque entree :
- Description claire (champs attendus, format, anti-fabrication)
- Rubric adaptee (probablement 2-3 criteres)
- max_score = 25 (uniforme)
- Marquage "BONUS" dans le titre/desc

**Effort estime** : 1h SQL

### 2.E — SQL polish des 9 livrables (vague 1)

3 deja appliques en session live (NON commites) :
- ✓ #1 Persona AgriTech (rubric : precision, pain_terrain, concretude, evidence, quality)
- ✓ #2 Hypothese VP cible (completion-based unique, full points si pitch 1min realise)
- ✓ #3 BMC 9 blocs (rubric hybride : completion 15 + coherence 10)

Restent #5-#9 a polir. **Note importante** : si #4 devient MoSCoW Kanban, alors #5 actuel (`etude-marche-v1` MoSCoW prototype agricole) est en doublon — DECISION REQUISE :
- Option a : #5 devient autre (analyse concurrentielle / segmentation / contraintes ONSSA-ORMVA)
- Option b : #5 supprime, total 8 livrables (+3 bonus)

**Effort estime** : 3-4h

### 2.F — Smoke regression complet

Apres tout merge : run smoke E2E full parcours
- Player flow : onboarding -> 9 livrables (incl. MoSCoW Kanban) -> bonus claim -> pitch
- Mentor flow : evaluate deliverable + bonus
- GM flow : announce, export CSV
- Auth : login/logout/role gating
- RLS : Player ne voit pas autres Players, ne voit pas bonus_events autres projects

**Effort estime** : 4-6h

---

## 3. Calendrier propose (J-3 a J0)

```
sam 10/05 (J-3)  : 2.A bonus_events schema + RLS + migrations Supabase tested
                   2.E vague 1 finir polish #5-#9 SQL
dim 11/05 (J-2)  : 2.A server actions + UI components
                   2.B MoSCoW Kanban scaffolding (DnD wiring)
lun 12/05 (J-1)  : 2.B MoSCoW Kanban persist + integration deliverable submission
                   2.C CSV export
                   2.D bonus livrables seed
mar 13/05 (J0)   : 2.F smoke regression FULL
                   bug fixes blocking only
                   cutoff go/no-go 23h59
mer 13/05 08h30  : GO-LIVE Hack-Days AgriTech
```

**Total estime** : 39-51h dev + 4-6h smoke = **43-57h sur 5 jours**.
Compatible uniquement si Omar full-time + zero blocker majeur.

## 4. Risques accepte par owner

- ⚠️ **Cassure freeze T-3** (CLAUDE.md ligne "Freeze feat() jusqu'au 14/05 soir") consciemment override
- ⚠️ **Risque de delai go-live 13/05** : si bug bloquant en prod le 12/05 soir, fallback non identifie
- ⚠️ **Smoke regression compresse** : nominalement 1-2j, comprime a 0.5j
- ⚠️ **Triple casquette Omar** maintenue (dev + setup pilote + animation 13/05) — burnout risk
- ⚠️ **Verbatims migration** : pilier anti-fabrication B4 retro recale en bonus, peut affaiblir la pedagogie
- ⚠️ **Partenaires Tamwilcom / BoA / Innov Invest / Bluespace** : aucune comm prevue sur scope expansion

## 5. Pre-requis avant `/gsd-plan-phase`

- [ ] Decision finale sur **#5** (autre contenu OU suppression)
- [ ] Decision DnD library : `@dnd-kit/core` (recommande Next 15) vs autre
- [ ] Decision bonus_events vs deliverable_templates flag-based (option simple T-3 vs option propre v0.3)
- [ ] Confirmer : `member_emails` cohorte AgreenTech complete (B5 — bloquant magic links)
- [ ] Verifier capacite Supabase (RLS test runs OK ?)

## 6. Files modifies (estimation)

```
database/schema.sql                                    (+ 30 lignes)
database/triggers.sql                                  (+ 15 lignes)
database/rls.sql                                       (+ 40 lignes)
database/seed_event_hackdays.sql                       (modif 5 livrables + 3 bonus)
supabase/migrations/<new>-bonus-events-recreate.sql    (new ~ 100 lignes)
supabase/migrations/<new>-moscow-kanban.sql            (new ~  50 lignes)
supabase/migrations/<existing>-seed-event-hackdays-... (sync avec database/)
lib/types.ts                                           (+ BonusType, MoscowBucket, MoscowCard)
app/actions.ts                                         (+ 4 actions)
app/journey/bonus/[type]/page.tsx                      (new)
app/mentor/bonus/[id]/page.tsx                         (new)
app/api/export/moscow/[id].csv/route.ts                (new)
components/bonus-claim-form.tsx                        (new)
components/moscow-kanban.tsx                           (new)
components/moscow-card.tsx                             (new)
lib/i18n.ts                                            (+ ~20 keys)
package.json                                           (+ @dnd-kit/core)
```

## 7. Verification post-implementation

R1 (score invisible Player), R2 (validators warn-only), R3 (no inter-mission blocking) doivent rester respectes.

Spawn `eic-pedagogical-advisor` (`.claude/agents/eic-pedagogical-advisor.md`) avant chaque edit en zone sensible :
- `app/journey/`, `app/mission/`, `app/jury/`, `app/results/`
- `components/results-*`, `components/submission-*`, `components/moscow-*` (nouveau)
- `lib/score.ts`, `lib/results.ts`, `lib/seed/`, `database/`, `lib/types.ts`

---

**Status edits live deja appliques (NON commites)** :
- `app/journey/page.tsx` ligne 85 (subtitle hero = 1er paragraphe)
- `database/seed_event_hackdays.sql` blocs 5.1, 5.2, 5.3 refondus
- `supabase/migrations/20260510160000_seed_event_hackdays_agritech.sql` blocs 5.1, 5.2, 5.3 mirror

A commit avant tout autre edit (cf section 8 instructions plan-phase).

## 8. Instructions pour la session `/gsd-plan-phase`

```
1. Lire ce BRIEF.md
2. Lire CLAUDE.md sections "T-3 Critical Gates" + "Pre-edit guards" + "Freeze feat()"
3. Lire RETROSPECTIVE-T3-2026-05-10.md
4. Verifier git status + commit edits live en attente (cf section 7) en commit T-3-polish atomique
5. Lancer /gsd-add-phase ou /gsd-plan-phase nomme "T3-EXPANSION-MOSCOW-BONUS"
6. Decomposer en sous-plans (waves) selon section 2 (A,B,C,D,F)
7. Spawn eic-pedagogical-advisor pour valider R1/R2/R3 sur chaque wave
8. /gsd-execute-phase pour lancer
```
