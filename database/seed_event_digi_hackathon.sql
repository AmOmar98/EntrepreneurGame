-- =============================================================================
-- seed_event_digi_hackathon.sql
-- Quick 260519-dgh — Event seed for Digi-Hackathon 4eme edition (Mai 2026).
-- Replaces AgreenTech content; event slug PRESERVED ('hack-days-fes-meknes-mai-2026')
-- so existing TS references and stable IDs continue to resolve.
--
-- Apply order (cf database/README.md):
--   schema.sql -> triggers.sql -> rls.sql -> seed_event_digi_hackathon.sql
--
-- Idempotent: every INSERT uses ON CONFLICT (DO NOTHING / DO UPDATE).
-- Re-running this file MUST NOT produce errors and MUST NOT duplicate rows.
--
-- Scope :
--   1. Levels reference data (L0..L7).
--   2. 1 Event   : 'hack-days-fes-meknes-mai-2026' (renamed Digi-Hackathon).
--   3. 1 Cohort  : 'cohorte-digi-mai-2026'.
--   4. 6 Missions Digi-Hackathon 4eme edition (TZ Maroc UTC+1).
--   5. 12 DeliverableTemplates (max_score=25 uniforme, scoring 0.20/0.80 preserve).
--
-- Theme : santé mentale ados/jeunes (Digi-Hackathon 4eme edition).
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
-- 2. Event — Digi-Hackathon 4eme edition (slug PRESERVED)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3. Cohort — cohorte-digi-mai-2026
-- -----------------------------------------------------------------------------
insert into public.cohorts (event_id, slug, name)
select e.id, 'cohorte-digi-mai-2026', 'Cohorte Digi Mai 2026'
from public.events e
where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, slug) do update
  set name = excluded.name;

-- -----------------------------------------------------------------------------
-- 4. Missions — 6 ateliers/pitch sur 20-22 mai 2026 (Digi-Hackathon 4eme edition)
--    Mapping ateliers -> niveaux :
--      M1 (L1, 20/05 10:30) Atelier 1 — Design Thinking (Hypotheses & Persona)
--      M2 (L2, 20/05 11:00) Atelier 2 — Enquete utilisateurs (Questionnaire + 10 fiches)
--      M3 (L3, 20/05 14:00) Atelier 3 — Business Model Canvas + TAM/SAM/SOM
--      M4 (L4, 20/05 15:00) Atelier 4 — Etude marche (MOSCOW + Concurrents)
--      M5 (L4, 21/05 09:30) Atelier 5 — Strategie & Analyse financiere
--      M6 (L5, 22/05 09:30) Atelier 6 — Pitch final & presentation jury
--    NB: M4 et M5 partagent level_id=L4_business_model — distingues par ord (4 vs 5).
-- -----------------------------------------------------------------------------
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L1_problem'::public.level_id, 1, 'atelier'::public.mission_kind,
       'Atelier 1 — Design Thinking (Hypothèses & Persona)',
       '2026-05-20 10:30:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L2_solution'::public.level_id, 2, 'atelier'::public.mission_kind,
       'Atelier 2 — Enquête utilisateurs (Questionnaire + 10 fiches)',
       '2026-05-20 11:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L3_market'::public.level_id, 3, 'atelier'::public.mission_kind,
       'Atelier 3 — Business Model Canvas + TAM/SAM/SOM',
       '2026-05-20 14:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 4, 'atelier'::public.mission_kind,
       'Atelier 4 — Étude marché (MOSCOW + Concurrents)',
       '2026-05-20 15:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 5, 'atelier'::public.mission_kind,
       'Atelier 5 — Stratégie & Analyse financière',
       '2026-05-21 09:30:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L5_pitch'::public.level_id, 6, 'pitch'::public.mission_kind,
       'Atelier 6 — Pitch final & présentation jury',
       '2026-05-22 09:30:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind,
      title = excluded.title,
      scheduled_at = excluded.scheduled_at;

-- -----------------------------------------------------------------------------
-- 5. DeliverableTemplates — 12 livrables Digi-Hackathon 4eme edition
--    max_score=25 uniforme. Rubric adaptee par livrable.
--    Bonus (is_bonus=true) : persona-v1, tam-sam-som-v1, positionnement-v1,
--                            comparaison-v1, strategie-100-users-v1 (5 bonus).
--    Non-bonus (7) : hypotheses-v1, questionnaire-v1, fiches-users-10-v1,
--                    bmc-v1, moscow-v1, capex-opex-v1, pitch-deck-v1.
-- -----------------------------------------------------------------------------

-- 5.1 — Mission 1 (L1) : Hypotheses & pitch 2min
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'hypotheses-v1',
       'Hypothèses & pitch 2min',
       E'Soumettre hypothèses initiales (problème + cible + solution pressentie) + confirmer pitch 2min réalisé en J1 matin.',
       '[
          {"key":"completion","label":"Hypothèses soumises + pitch 2min réalisé (0=à refaire, 25=complet)","max":25}
        ]'::jsonb,
       25, 1, false
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.2 — Mission 1 (L1) : Persona ado/jeune [BONUS]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'persona-v1',
       'Persona ado/jeune',
       E'1 fiche persona = 1 adolescent/jeune réel cible santé mentale, tableau Attribut/Valeur/Source, >=2 sources triangulées.',
       '[
          {"key":"precision","label":"Précision cible (tranche d''âge + contexte + zone)","max":5},
          {"key":"pain_terrain","label":"Douleur santé mentale observée (citation/observation, pas supposée)","max":5},
          {"key":"concretude","label":"Chiffres concrets (heures écran, fréquentation services, canaux info)","max":5},
          {"key":"evidence","label":"Triangulation sources (>=2 distinctes en colonne Source)","max":5},
          {"key":"quality","label":"Qualité fiche (lisibilité, structuration tableau)","max":5}
        ]'::jsonb,
       25, 2, true
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.3 — Mission 2 (L2) : Fiche questionnaire utilisateur
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'questionnaire-v1',
       'Fiche questionnaire utilisateur',
       E'Questionnaire structuré 8-12 questions ouvertes ados, ciblé santé mentale, prêt à diffuser.',
       '[
          {"key":"structure","label":"8-12 questions ouvertes, progression logique","max":10},
          {"key":"pertinence","label":"Questions ciblent les hypothèses M1 (validation/réfutation)","max":10},
          {"key":"ethique","label":"Formulation respectueuse / consentement / anonymat mentionné","max":5}
        ]'::jsonb,
       25, 1, false
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.4 — Mission 2 (L2) : 10 fiches utilisateurs partagées
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'fiches-users-10-v1',
       '10 fiches utilisateurs partagées',
       E'10 entretiens menés, réponses tabulées + verbatims clés extraits.',
       '[
          {"key":"completion","label":"10 fiches complétées (1 par utilisateur réel)","max":15},
          {"key":"verbatims","label":">=3 verbatims forts extraits/cités","max":5},
          {"key":"synthese","label":"Synthèse patterns observés (1 paragraphe)","max":5}
        ]'::jsonb,
       25, 2, false
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.5 — Mission 3 (L3) : Business Model Canvas
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'bmc-v1',
       'Business Model Canvas',
       E'BMC 9 blocs santé mentale, lié au persona M1 + verbatims M2.',
       '[
          {"key":"completion","label":"Complétion 9 blocs (>=2 phrases chacun, pas de bloc vide)","max":15},
          {"key":"coherence","label":"Cohérence avec persona M1, verbatims M2, hypothèses M1","max":10}
        ]'::jsonb,
       25, 1, false
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.6 — Mission 3 (L3) : TAM/SAM/SOM [BONUS]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'tam-sam-som-v1',
       'TAM/SAM/SOM',
       E'3 niveaux marché (TAM ados Maroc, SAM zone accessible, SOM capture an 1) avec hypothèses sourcées.',
       '[
          {"key":"calcul_explicite","label":"3 niveaux estimés, chaque chiffre = source/hypothèse explicite","max":15},
          {"key":"realisme_som","label":"SOM cohérent avec stratégie 100 users (taux adoption crédible)","max":5},
          {"key":"coherence_persona","label":"SAM cohérent avec persona M1","max":5}
        ]'::jsonb,
       25, 2, true
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.7 — Mission 4 (L4) : MoSCoW
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'moscow-v1',
       'MoSCoW',
       E'MUST/SHOULD/COULD/WONT pour le MVP digital mental health, format Kanban link.',
       '[
          {"key":"completion","label":"4 colonnes, >=2 MUST, >=1 WONT, cartes avec feature+pourquoi","max":15},
          {"key":"pertinence","label":"MUST lèvent vraies contraintes (RGPD, mineurs, confidentialité) ; WONT = vrai arbitrage","max":10}
        ]'::jsonb,
       25, 1, false
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.8 — Mission 4 (L4) : Grille positionnement concurrents [BONUS]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'positionnement-v1',
       'Grille positionnement concurrents',
       E'Carte 2D positionnement vs 3-5 concurrents (apps santé mentale ados : Headspace, Calm, services publics MA).',
       '[
          {"key":"competitors","label":"3-5 concurrents identifiés, fiche par concurrent","max":10},
          {"key":"axes","label":"2 axes pertinents, votre solution placée + justifiée","max":10},
          {"key":"differenciation","label":"Lien clair avec hypothèses M1 (angle ressort)","max":5}
        ]'::jsonb,
       25, 2, true
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.9 — Mission 4 (L4) : Grille comparaison alternatives [BONUS]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'comparaison-v1',
       'Grille comparaison alternatives',
       E'Tableau comparatif features × concurrents + alternatives non-digitales (CMPP, ligne d''écoute).',
       '[
          {"key":"matrice","label":"Tableau features × 3-5 concurrents + 1-2 alternatives non-digitales","max":15},
          {"key":"insight","label":"Au moins 1 insight stratégique extrait (gap, opportunité)","max":10}
        ]'::jsonb,
       25, 3, true
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.10 — Mission 5 (L4) : Analyse financière CAPEX/OPEX
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'capex-opex-v1',
       'Analyse financière CAPEX/OPEX',
       E'CAPEX initial (dev app/contenu) + OPEX an 1 (hosting, modération, marketing), avec sources.',
       '[
          {"key":"capex_detail","label":"CAPEX détaillé par poste, total, durée amortissement","max":10},
          {"key":"opex_detail","label":"OPEX détaillé par poste, total annuel","max":10},
          {"key":"sources","label":"Devis ou benchmarks cités par ligne (anti-fabrication)","max":5}
        ]'::jsonb,
       25, 1, false
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.11 — Mission 5 (L4) : Stratégie 100 premiers users [BONUS]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'strategie-100-users-v1',
       'Stratégie 100 premiers users',
       E'Plan acquisition 100 premiers ados/jeunes : canaux, partenariats (écoles, CMPP, influenceurs), actions S1.',
       '[
          {"key":"canaux","label":"3-5 canaux identifiés, fiche par canal (cible, coût, ROI estimé)","max":10},
          {"key":"mix","label":">=1 canal non-digital + diversité (institutionnels + terrain + influenceurs)","max":5},
          {"key":"action_concrete","label":"Action S1 post-hackathon activable dès 23/05","max":10}
        ]'::jsonb,
       25, 2, true
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- 5.12 — Mission 6 (L5) : Pitch Deck final
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'pitch-deck-v1',
       'Pitch Deck final',
       E'Deck final 10-12 slides santé mentale, slide 4 OBLIGATOIRE = preuve terrain (verbatim ou chiffre).',
       '[
          {"key":"structure","label":"10-12 slides, structure standard pitch","max":5},
          {"key":"preuve_slide4","label":"Slide 4 = verbatim OU chiffre terrain sourcé (anti-fabrication)","max":10},
          {"key":"coherence","label":"Reprend persona M1 + hypothèses M1 + BMC M3 + analyse M5","max":5},
          {"key":"clarte","label":"Lisibilité, design propre, demande claire","max":5}
        ]'::jsonb,
       25, 1, false
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
      ord = excluded.ord,
      is_bonus = excluded.is_bonus;

-- =============================================================================
-- End of seed_event_digi_hackathon.sql
-- =============================================================================
