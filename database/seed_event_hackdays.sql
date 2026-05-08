-- =============================================================================
-- seed_event_hackdays.sql
-- Phase 2 / Plan 04 — Event seed for Hack-Days Fes-Meknes Mai 2026 (EVENT-01).
--
-- Apply order (cf database/README.md):
--   schema.sql -> triggers.sql -> rls.sql -> seed_event_hackdays.sql
--
-- Idempotent: every INSERT uses ON CONFLICT (DO NOTHING / DO UPDATE).
-- Re-running this file MUST NOT produce errors and MUST NOT duplicate rows.
--
-- Scope (DATA-03 / EVENT-01 / EVENT-02):
--   1. Levels reference data (L0..L7).
--   2. 1 Event   : 'hack-days-fes-meknes-mai-2026'.
--   3. 1 Cohort  : 'cohorte-mai-2026'.
--   4. 6 Missions aligned on the 13-14 mai 2026 program (timezone Maroc UTC+1).
--   5. 9 DeliverableTemplates with rubric JSONB (4-5 weighted criteria, sum=100).
--
-- This file is the ONLY seed allowed in production. seed_bootcamp.sql is legacy
-- demo and MUST NOT be applied on Supabase prod (BRAND-05 / DATA-03).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Levels (L0..L7) — reference table
-- -----------------------------------------------------------------------------
insert into public.levels (id, ord, label, description) values
  ('L0_diagnostic',     0, 'L0 Diagnostic',      'Onboarding et diagnostic initial du porteur.'),
  ('L1_problem',        1, 'L1 Probleme',        'Identifier le probleme et les personae cibles.'),
  ('L2_solution',       2, 'L2 Solution',        'Esquisser la solution et la fiche produit.'),
  ('L3_market',         3, 'L3 Marche',          'Etudier le marche et la concurrence.'),
  ('L4_business_model', 4, 'L4 Business Model',  'Construire le business model et les previsions.'),
  ('L5_pitch',          5, 'L5 Pitch',           'Preparer et delivrer le pitch.'),
  ('L6_traction',       6, 'L6 Traction',        'Acquerir les premiers utilisateurs / clients.'),
  ('L7_alumni',         7, 'L7 Alumni',          'Diplomation et accompagnement post-pilote.')
on conflict (id) do update
  set ord = excluded.ord,
      label = excluded.label,
      description = excluded.description;

-- -----------------------------------------------------------------------------
-- 2. Event — Hack-Days Fes-Meknes Mai 2026
-- -----------------------------------------------------------------------------
insert into public.events (slug, name, starts_at, ends_at)
values (
  'hack-days-fes-meknes-mai-2026',
  'Hack-Days Fes-Meknes Mai 2026',
  '2026-05-13 08:30:00+01',
  '2026-05-14 17:00:00+01'
)
on conflict (slug) do update
  set name = excluded.name,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at;

-- -----------------------------------------------------------------------------
-- 3. Cohort — cohorte-mai-2026
-- -----------------------------------------------------------------------------
insert into public.cohorts (event_id, slug, name)
select e.id, 'cohorte-mai-2026', 'Cohorte Mai 2026'
from public.events e
where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, slug) do update
  set name = excluded.name;

-- -----------------------------------------------------------------------------
-- 4. Missions — 6 ateliers/pitch sur 13-14 mai 2026
--    Mapping ateliers -> niveaux (cf 02-04-PLAN.md) :
--      M1 (L1, 13/05 09:00) Atelier Probleme
--      M2 (L2, 13/05 11:00) Atelier Solution
--      M3 (L3, 13/05 14:00) Atelier Marche
--      M4 (L4, 13/05 16:00) Atelier Business Model
--      M5 (L4, 14/05 09:00) Atelier Strategie commerciale
--      M6 (L5, 14/05 14:00) Pitch final + resultats
-- -----------------------------------------------------------------------------
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L1_problem'::public.level_id, 1, 'atelier'::public.mission_kind,
       'Atelier 1 — Probleme & Personae',
       '2026-05-13 09:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L2_solution'::public.level_id, 2, 'atelier'::public.mission_kind,
       'Atelier 2 — Solution & Fiche Produit',
       '2026-05-13 11:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L3_market'::public.level_id, 3, 'atelier'::public.mission_kind,
       'Atelier 3 — Etude de marche',
       '2026-05-13 14:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 4, 'atelier'::public.mission_kind,
       'Atelier 4 — Business Model & Couts',
       '2026-05-13 16:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 5, 'atelier'::public.mission_kind,
       'Atelier 5 — Strategie commerciale (prix, canaux)',
       '2026-05-14 09:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L5_pitch'::public.level_id, 6, 'pitch'::public.mission_kind,
       'Atelier 6 — Pitch final & resultats',
       '2026-05-14 14:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

-- -----------------------------------------------------------------------------
-- 5. DeliverableTemplates — 9 livrables (rubric 4 criteres x 25 = 100)
-- -----------------------------------------------------------------------------

-- 5.1 — Mission 1 (L1) : Personae
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'personae-v1',
       'Fiche Personae',
       'Decrire 1 a 2 personae cibles (profil, contexte, jobs-to-be-done, douleurs, gains attendus).',
       '[
          {"key":"clarity","label":"Clarte de la description","max":25},
          {"key":"specificity","label":"Specificite (segment precis)","max":25},
          {"key":"evidence","label":"Preuves / interviews","max":25},
          {"key":"actionable","label":"Actionnable (utilisable pour design)","max":25}
        ]'::jsonb,
       100, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L1_problem'
  and m.ord = 1
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.2 — Mission 1 (L1) : Enonce du probleme
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'probleme-v1',
       'Enonce du probleme',
       'Formuler le probleme central a resoudre, son contexte et son impact.',
       '[
          {"key":"clarity","label":"Clarte de l''enonce","max":25},
          {"key":"impact","label":"Impact (qui souffre, combien)","max":25},
          {"key":"evidence","label":"Preuves terrain","max":25},
          {"key":"scope","label":"Perimetre delimite","max":25}
        ]'::jsonb,
       100, 2
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L1_problem'
  and m.ord = 1
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.3 — Mission 2 (L2) : Esquisse de solution
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'esquisse-solution-v1',
       'Esquisse de solution',
       'Decrire la solution proposee, sa proposition de valeur et son fonctionnement de haut niveau.',
       '[
          {"key":"fit","label":"Adequation probleme/solution","max":25},
          {"key":"feasibility","label":"Faisabilite technique","max":25},
          {"key":"differentiation","label":"Differenciation","max":25},
          {"key":"clarity","label":"Clarte de l''explication","max":25}
        ]'::jsonb,
       100, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L2_solution'
  and m.ord = 2
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.4 — Mission 2 (L2) : Fiche Produit + Plan de Dev
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'fiche-produit-plan-dev-v1',
       'Fiche Produit & Plan de developpement',
       'Specifier les fonctionnalites cles du produit V1 et le plan de developpement (jalons, dependances).',
       '[
          {"key":"completeness","label":"Completude des fonctionnalites cles","max":25},
          {"key":"prioritization","label":"Priorisation MVP","max":25},
          {"key":"plan","label":"Plan de dev realiste","max":25},
          {"key":"risks","label":"Identification des risques","max":25}
        ]'::jsonb,
       100, 2
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L2_solution'
  and m.ord = 2
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.5 — Mission 3 (L3) : Etude de marche
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'etude-marche-v1',
       'Etude de marche',
       'Quantifier le marche (TAM/SAM/SOM), cartographier la concurrence et identifier les tendances cles.',
       '[
          {"key":"sizing","label":"Taille du marche (TAM/SAM/SOM)","max":25},
          {"key":"competition","label":"Cartographie concurrentielle","max":25},
          {"key":"trends","label":"Tendances et signaux","max":25},
          {"key":"sources","label":"Qualite des sources","max":25}
        ]'::jsonb,
       100, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L3_market'
  and m.ord = 3
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.6 — Mission 4 (L4) : Business Model Canvas
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'bmc-v1',
       'Business Model Canvas',
       'Renseigner les 9 blocs du Business Model Canvas (clients, valeur, canaux, revenus, couts, ressources...).',
       '[
          {"key":"completeness","label":"Completude des 9 blocs","max":25},
          {"key":"coherence","label":"Coherence inter-blocs","max":25},
          {"key":"viability","label":"Viabilite economique","max":25},
          {"key":"clarity","label":"Clarte du canvas","max":25}
        ]'::jsonb,
       100, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L4_business_model'
  and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.7 — Mission 4 (L4) : Couts & previsions de ventes
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'couts-previsions-v1',
       'Couts & previsions de ventes',
       'Estimer les couts (fixes, variables) et construire des previsions de ventes a 12 mois avec hypotheses.',
       '[
          {"key":"costs","label":"Estimation des couts","max":25},
          {"key":"forecast","label":"Previsions de ventes","max":25},
          {"key":"hypotheses","label":"Hypotheses explicitees","max":25},
          {"key":"sensitivity","label":"Sensibilite / scenarios","max":25}
        ]'::jsonb,
       100, 2
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L4_business_model'
  and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.8 — Mission 5 (L4) : Strategie prix / ventes / canaux
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'strategie-commerciale-v1',
       'Strategie prix, ventes & canaux',
       'Definir la strategie de prix, le tunnel de vente et les canaux d''acquisition prioritaires.',
       '[
          {"key":"pricing","label":"Strategie de prix justifiee","max":25},
          {"key":"channels","label":"Canaux d''acquisition","max":25},
          {"key":"funnel","label":"Tunnel de conversion","max":25},
          {"key":"metrics","label":"Metriques cles (CAC, LTV)","max":25}
        ]'::jsonb,
       100, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L4_business_model'
  and m.ord = 5
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- 5.9 — Mission 6 (L5) : Pitch deck V1
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'pitch-deck-v1',
       'Pitch deck V1',
       'Deck de pitch (10-12 slides) couvrant probleme, solution, marche, business model, equipe, demande.',
       '[
          {"key":"narrative","label":"Narrative et fil conducteur","max":25},
          {"key":"completeness","label":"Completude des sections cles","max":25},
          {"key":"design","label":"Design et lisibilite","max":25},
          {"key":"impact","label":"Impact et call to action","max":25}
        ]'::jsonb,
       100, 1
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026'
  and m.level_id = 'L5_pitch'
  and m.ord = 6
on conflict (mission_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      rubric = excluded.rubric,
      max_score = excluded.max_score,
      ord = excluded.ord;

-- =============================================================================
-- End of seed_event_hackdays.sql
-- =============================================================================
