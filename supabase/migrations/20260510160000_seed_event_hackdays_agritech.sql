-- =============================================================================
-- seed_event_hackdays.sql
-- Phase 2 / Plan 04 — Event seed for Hack-Days Fes-Meknes Mai 2026 (EVENT-01).
-- Refondu B4 RETRO 2026-05-10 — AgreenTech 2026 (T3-IMPROVEMENTS section A/B).
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
--   4. 6 Missions AgreenTech 2026 alignees sur le programme 13-14 mai 2026 (TZ Maroc UTC+1).
--   5. 9 DeliverableTemplates with rubric JSONB (5 criteres AgriTech, sum=25).
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
-- 4. Missions — 6 ateliers/pitch sur 13-14 mai 2026 (AgreenTech 2026)
--    Mapping ateliers -> niveaux (refondu B4 RETRO 2026-05-10) :
--      M1 (L1, 13/05 09:00) Atelier Hypothese VP & Cible AgriTech
--      M2 (L2, 13/05 11:00) Atelier Solution AgriTech & Verbatims terrain
--      M3 (L3, 13/05 14:00) Atelier MoSCoW Prototype Pilote 1 saison
--      M4 (L4, 13/05 16:00) Atelier ROI/ha & Modele de portage
--      M5 (L4, 14/05 09:00) Atelier Plan acquisition agriculteurs
--      M6 (L5, 14/05 14:00) Atelier Pitch final AgriTech & resultats
-- -----------------------------------------------------------------------------
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L1_problem'::public.level_id, 1, 'atelier'::public.mission_kind,
       'Atelier 1 — Hypothese VP & Cible AgriTech',
       '2026-05-13 09:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L2_solution'::public.level_id, 2, 'atelier'::public.mission_kind,
       'Atelier 2 — Solution AgriTech & Verbatims terrain',
       '2026-05-13 11:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L3_market'::public.level_id, 3, 'atelier'::public.mission_kind,
       'Atelier 3 — MoSCoW Prototype Pilote 1 saison',
       '2026-05-13 14:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 4, 'atelier'::public.mission_kind,
       'Atelier 4 — ROI/ha & Modele de portage',
       '2026-05-13 16:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 5, 'atelier'::public.mission_kind,
       'Atelier 5 — Plan acquisition agriculteurs',
       '2026-05-14 09:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L5_pitch'::public.level_id, 6, 'pitch'::public.mission_kind,
       'Atelier 6 — Pitch final AgriTech & resultats',
       '2026-05-14 14:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

-- -----------------------------------------------------------------------------
-- 5. DeliverableTemplates — 9 livrables (rubric 5 criteres x 5 = 25 AgreenTech 2026)
--    Rubric uniforme appliquee aux 9 livrables (5 criteres x 5 pts):
--      - innovation   : Innovation / pertinence probleme AgriTech
--      - feasibility  : Faisabilite technique et agronomique
--      - business     : Modele economique (ROI agriculteur, viabilite)
--      - evidence     : Preuves terrain (verbatims, donnees, sources) [signal anti-fabrication]
--      - quality      : Qualite d'execution et clarte
--    Slugs preserves (Option 1 idempotency) — ON CONFLICT (mission_id, slug) DO UPDATE.
-- -----------------------------------------------------------------------------

-- 5.1 — Mission 1 (L1) : Persona AgriTech
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'personae-v1',
       'Persona AgriTech',
       'Decrire 1 persona agriculteur cible (filiere, zone, taille, revenu, canaux d''info, douleur observee terrain).',
       '[
          {"key":"innovation","label":"Innovation / pertinence probleme AgriTech","max":5},
          {"key":"feasibility","label":"Faisabilite technique et agronomique","max":5},
          {"key":"business","label":"Modele economique (ROI agriculteur, viabilite)","max":5},
          {"key":"evidence","label":"Preuves terrain (verbatims, donnees, sources)","max":5},
          {"key":"quality","label":"Qualite d''execution et clarte","max":5}
        ]'::jsonb,
       25, 1
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

-- 5.2 — Mission 1 (L1) : Hypothese VP cible
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'probleme-v1',
       'Hypothese VP cible',
       'Formuler l''hypothese VP au format Lean : Pour {cible}, qui {besoin}, notre offre {offre} contrairement a {differenciation}.',
       '[
          {"key":"innovation","label":"Innovation / pertinence probleme AgriTech","max":5},
          {"key":"feasibility","label":"Faisabilite technique et agronomique","max":5},
          {"key":"business","label":"Modele economique (ROI agriculteur, viabilite)","max":5},
          {"key":"evidence","label":"Preuves terrain (verbatims, donnees, sources)","max":5},
          {"key":"quality","label":"Qualite d''execution et clarte","max":5}
        ]'::jsonb,
       25, 2
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

-- 5.3 — Mission 2 (L2) : Solution & MoSCoW v1
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'esquisse-solution-v1',
       'Solution & MoSCoW v1',
       'Decrire la solution AgriTech (PoC, fonctionnement, technos cles) + ebauche MoSCoW Must/Should/Could/Won''t.',
       '[
          {"key":"innovation","label":"Innovation / pertinence probleme AgriTech","max":5},
          {"key":"feasibility","label":"Faisabilite technique et agronomique","max":5},
          {"key":"business","label":"Modele economique (ROI agriculteur, viabilite)","max":5},
          {"key":"evidence","label":"Preuves terrain (verbatims, donnees, sources)","max":5},
          {"key":"quality","label":"Qualite d''execution et clarte","max":5}
        ]'::jsonb,
       25, 1
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

-- 5.4 — Mission 2 (L2) : 3 verbatims terrain agriculteurs
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'fiche-produit-plan-dev-v1',
       '3 verbatims terrain agriculteurs',
       '3 citations textuelles d''agriculteurs (nom, age, exploitation, contexte, citation entre guillemets, date, canal — tel/presentiel/WhatsApp).',
       '[
          {"key":"innovation","label":"Innovation / pertinence probleme AgriTech","max":5},
          {"key":"feasibility","label":"Faisabilite technique et agronomique","max":5},
          {"key":"business","label":"Modele economique (ROI agriculteur, viabilite)","max":5},
          {"key":"evidence","label":"Preuves terrain (verbatims, donnees, sources)","max":5},
          {"key":"quality","label":"Qualite d''execution et clarte","max":5}
        ]'::jsonb,
       25, 2
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

-- 5.5 — Mission 3 (L3) : MoSCoW prototype agricole
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'etude-marche-v1',
       'MoSCoW prototype agricole',
       'Prioriser MUST/SHOULD/COULD/WON''T pour le prototype pilote 1 saison. Chaque MUST/SHOULD leve une contrainte terrain (energie, maintenance, litteratie, connectivite, cout/ha, climat, ONSSA/ORMVA).',
       '[
          {"key":"innovation","label":"Innovation / pertinence probleme AgriTech","max":5},
          {"key":"feasibility","label":"Faisabilite technique et agronomique","max":5},
          {"key":"business","label":"Modele economique (ROI agriculteur, viabilite)","max":5},
          {"key":"evidence","label":"Preuves terrain (verbatims, donnees, sources)","max":5},
          {"key":"quality","label":"Qualite d''execution et clarte","max":5}
        ]'::jsonb,
       25, 1
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

-- 5.6 — Mission 4 (L4) : ROI/ha + modele portage
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'bmc-v1',
       'ROI/ha + modele portage',
       'Calculer ROI/ha agriculteur + choisir modele de portage (achat direct, leasing cooperative, service a l''hectare, abonnement).',
       '[
          {"key":"innovation","label":"Innovation / pertinence probleme AgriTech","max":5},
          {"key":"feasibility","label":"Faisabilite technique et agronomique","max":5},
          {"key":"business","label":"Modele economique (ROI agriculteur, viabilite)","max":5},
          {"key":"evidence","label":"Preuves terrain (verbatims, donnees, sources)","max":5},
          {"key":"quality","label":"Qualite d''execution et clarte","max":5}
        ]'::jsonb,
       25, 1
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

-- 5.7 — Mission 4 (L4) : Couts agronomiques CAPEX/OPEX/ha
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'couts-previsions-v1',
       'Couts agronomiques CAPEX/OPEX/ha',
       'Estimer CAPEX/ha installation initiale + OPEX/ha annuel + coherence avec persona (revenu x 30% max OPEX).',
       '[
          {"key":"innovation","label":"Innovation / pertinence probleme AgriTech","max":5},
          {"key":"feasibility","label":"Faisabilite technique et agronomique","max":5},
          {"key":"business","label":"Modele economique (ROI agriculteur, viabilite)","max":5},
          {"key":"evidence","label":"Preuves terrain (verbatims, donnees, sources)","max":5},
          {"key":"quality","label":"Qualite d''execution et clarte","max":5}
        ]'::jsonb,
       25, 2
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

-- 5.8 — Mission 5 (L4) : Plan acquisition AgriTech
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'strategie-commerciale-v1',
       'Plan acquisition AgriTech',
       'Identifier 3-5 organisations relais (ORMVA, COPAG, cooperative, ONCA), cycle de decision, canal (digital/physique/mixte), action concrete semaine 1 post-bootcamp.',
       '[
          {"key":"innovation","label":"Innovation / pertinence probleme AgriTech","max":5},
          {"key":"feasibility","label":"Faisabilite technique et agronomique","max":5},
          {"key":"business","label":"Modele economique (ROI agriculteur, viabilite)","max":5},
          {"key":"evidence","label":"Preuves terrain (verbatims, donnees, sources)","max":5},
          {"key":"quality","label":"Qualite d''execution et clarte","max":5}
        ]'::jsonb,
       25, 1
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

-- 5.9 — Mission 6 (L5) : Pitch deck AgriTech
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord)
select m.id,
       'pitch-deck-v1',
       'Pitch deck AgriTech',
       'Deck pitch 10-12 slides AgriTech : probleme filiere, solution, marche agricole Maroc, ROI/ha, equipe, demande. Slide 4 = preuve terrain (verbatim L2 OU chiffre L4).',
       '[
          {"key":"innovation","label":"Innovation / pertinence probleme AgriTech","max":5},
          {"key":"feasibility","label":"Faisabilite technique et agronomique","max":5},
          {"key":"business","label":"Modele economique (ROI agriculteur, viabilite)","max":5},
          {"key":"evidence","label":"Preuves terrain (verbatims, donnees, sources)","max":5},
          {"key":"quality","label":"Qualite d''execution et clarte","max":5}
        ]'::jsonb,
       25, 1
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
