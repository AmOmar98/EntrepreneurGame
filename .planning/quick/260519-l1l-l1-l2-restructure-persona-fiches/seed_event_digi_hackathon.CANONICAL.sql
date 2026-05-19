-- =============================================================================
-- seed_event_digi_hackathon.sql  (canonical — quicks 260519-pyx + 260519-l1l)
--
-- État PROD reflété : 7 missions / 15 deliverables.
-- Source de vérité : PROD `vzzbjxmfkmvqkaqxalhr` event `hack-days-fes-meknes-mai-2026`.
--
-- Historique restructure :
--   * Quick 260519-pyx : 12→13 deliverables alignés Welcome Guide PDFs 02-08.
--   * Quick 260519-l1l : L1/L2 restructure — Persona promu main, Design Thinking
--     rétrogradé bonus, nouvelle M2 "Préparation entretiens + Fiches" insérée,
--     cascade ord M2→M7 (option B Omar 2026-05-19).
--
-- Mapping livrables officiels Welcome Guide PDF :
--   01 Welcome Guide       (cadrage, non noté)
--   02 Design Thinking     -> design-thinking-v1 (BONUS désormais)
--   02a Préparation Qst    -> prep-questions-v1 (mentor-validated)
--   02b Fiche Entretien    -> fiches-entretien-v1 (10 fiches, auto-validated, hard-blocked sur 02a)
--   03 BMC                 -> bmc-v1
--   04 Marché & technique  -> marche-technique-v1 (+ annexe 04b moscow-v1)
--   05 Commercialisation   -> commercialisation-v1
--   06 Unit Economics SaaS -> unit-economics-v1
--   07 Techniques pitch    -> techniques-pitch-v1
--   08 Pitch Deck final    -> pitch-deck-v1
--
-- 5 bonus : design-thinking-v1, persona-v1 (PROMU main M1, plus bonus),
--           tam-sam-som-v1, positionnement-v1, comparaison-v1, strategie-100-users-v1.
--           Note: persona-v1 listé bonus historiquement mais maintenant main M1.
--
-- HARD BLOCK pédagogique exception R3 (Omar 2026-05-19, [[project-l2-prep-entretien-hard-block]]) :
--   `fiches-entretien-v1` reste DOM-disabled + server-rejected tant que `prep-questions-v1`
--   n'a pas de submission `validated`. Isolation par literal slug-pair dans le code, pas en DB.
--
-- Idempotent : ON CONFLICT DO UPDATE partout. DELETE explicite des slugs disparus.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Levels (L0..L7)
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
-- 2. Event
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
-- 3. Cohort
-- -----------------------------------------------------------------------------
insert into public.cohorts (event_id, slug, name)
select e.id, 'cohorte-digi-mai-2026', 'Cohorte Digi Mai 2026'
from public.events e
where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, slug) do update
  set name = excluded.name;

-- -----------------------------------------------------------------------------
-- 4. Missions — 7 ateliers (cascade L1/L2 quick 260519-l1l)
-- -----------------------------------------------------------------------------
-- M1 L1 ord=1 — Persona + Design Thinking (bonus)
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L1_problem'::public.level_id, 1, 'atelier'::public.mission_kind,
       'Atelier 1 — Persona + Design Thinking (bonus)',
       '2026-05-20 10:30:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

-- M2 L2 ord=2 — Préparation entretiens + Fiches (NOUVELLE — quick 260519-l1l)
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L2_solution'::public.level_id, 2, 'atelier'::public.mission_kind,
       'Atelier 2 — Préparation entretiens + Fiches',
       '2026-05-20 13:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

-- M3 L3 ord=3 — Business Model Canvas (ex-M2, glissée)
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L3_market'::public.level_id, 3, 'atelier'::public.mission_kind,
       'Atelier 3 — Business Model Canvas',
       '2026-05-20 14:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

-- M4 L4 ord=4 — Étude marché & analyse technique (ex-M3, glissée)
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 4, 'atelier'::public.mission_kind,
       'Atelier 4 — Étude marché & analyse technique',
       '2026-05-20 14:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

-- M5 L4 ord=5 — Stratégie de commercialisation (ex-M4, glissée)
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 5, 'atelier'::public.mission_kind,
       'Atelier 5 — Stratégie de commercialisation',
       '2026-05-20 15:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

-- M6 L5 ord=6 — Analyse financière (Unit Economics) (ex-M5, glissée)
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L5_pitch'::public.level_id, 6, 'atelier'::public.mission_kind,
       'Atelier 6 — Analyse financière (Unit Economics)',
       '2026-05-21 09:30:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

-- M7 L5 ord=7 — Techniques de pitch + Pitch jury (ex-M6, glissée)
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L5_pitch'::public.level_id, 7, 'pitch'::public.mission_kind,
       'Atelier 7 — Techniques de pitch + Pitch jury',
       '2026-05-22 09:30:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

-- -----------------------------------------------------------------------------
-- 5.0 — Cleanup : slugs disparus du layout précédent
--   Quick 260519-pyx : hypotheses-v1, questionnaire-v1, fiches-users-10-v1, capex-opex-v1
--   FK submissions ON DELETE RESTRICT — OK si 0 submissions (vérifié PROD T-1).
-- -----------------------------------------------------------------------------
delete from public.deliverable_templates
where slug in ('hypotheses-v1', 'questionnaire-v1', 'fiches-users-10-v1', 'capex-opex-v1')
  and mission_id in (
    select m.id from public.missions m
    join public.events e on e.id = m.event_id
    where e.slug = 'hack-days-fes-meknes-mai-2026'
  );

-- -----------------------------------------------------------------------------
-- 5. DeliverableTemplates — 15 livrables
--    (8 non-bonus alignés Welcome Guide 02-08 + 02a + 02b ; 5 bonus + design-thinking)
-- -----------------------------------------------------------------------------

-- 5.1 M1 (L1 ord=1) Persona ado/jeune [LIVRABLE PRINCIPAL — Q1 promotion 260519-l1l]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'persona-v1',
       'Persona ado/jeune (livrable principal)',
       E'Livrable principal M1 (Q1 promotion 2026-05-19). 1 fiche persona = 1 adolescent/jeune réel cible santé mentale, tableau Attribut/Valeur/Source, >=2 sources triangulées.',
       '[
          {"key":"precision","label":"Précision cible (tranche d''âge + contexte + zone)","max":5},
          {"key":"pain_terrain","label":"Douleur santé mentale observée (citation/observation, pas supposée)","max":5},
          {"key":"concretude","label":"Chiffres concrets (heures écran, fréquentation services, canaux info)","max":5},
          {"key":"evidence","label":"Triangulation sources (>=2 distinctes en colonne Source)","max":5},
          {"key":"quality","label":"Qualité fiche (lisibilité, structuration tableau)","max":5}
        ]'::jsonb,
       25, 1, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L1_problem' and m.ord = 1
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.2 M1 (L1 ord=1) Design Thinking [BONUS — Q1 démotion 260519-l1l]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'design-thinking-v1',
       'Design Thinking (bonus — Empathize+Define+Ideate+Prototype)',
       E'Bonus M1 (Q1 demotion 2026-05-19). Livrable 02/8 Welcome Guide. 4 phases Stanford d.school : Empathize (persona + verbatims + pain points), Define (PoV + How Might We), Ideate (10 idées divergentes), Prototype/Test (idée retenue + critère succès).',
       '[
          {"key":"empathize","label":"EMPATHIZE : persona principal + contexte de vie + 3 verbatims + pain points émotionnels","max":7},
          {"key":"define","label":"DEFINE : Point of View (utilisateur / besoin / insight) + reformulation HMW","max":6},
          {"key":"ideate","label":"IDEATE : 10 idées divergentes (quantité avant qualité)","max":6},
          {"key":"prototype","label":"PROTOTYPE/TEST : 1 idée retenue + forme proto + 3 utilisateurs / critère succès+échec","max":6}
        ]'::jsonb,
       25, 2, true
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L1_problem' and m.ord = 1
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.3 M2 (L2 ord=2) Préparation questions entretiens [Livrable 02a — NOUVEAU 260519-l1l]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'prep-questions-v1',
       'Préparation questions entretiens (02a)',
       E'Livrable 02a/8 Welcome Guide. Guide de questions ouvertes pour entretiens terrain ados/jeunes : 6-10 questions thématisées. DOIT être validé par votre mentor AVANT les 10 fiches d''entretien (02b).',
       '[
          {"key":"structure","label":"Structure : 6-10 questions ouvertes regroupées par thème","max":8},
          {"key":"pertinence","label":"Pertinence : questions cohérentes avec persona M1 + tabous santé mentale","max":10},
          {"key":"qualite","label":"Qualité formulation : ouvertes, non-suggestives, neutres","max":7}
        ]'::jsonb,
       25, 1, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L2_solution' and m.ord = 2
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.4 M2 (L2 ord=2) 10 fiches d'entretien terrain [Livrable 02b — NOUVEAU 260519-l1l]
--     HARD BLOCK pédagogique sur prep-questions-v1 validated (cf [[project-l2-prep-entretien-hard-block]])
--     Auto-validation à la soumission complète : trigger insère evaluations row avec scores fixes 25/url.
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'fiches-entretien-v1',
       '10 fiches d''entretien terrain (02b)',
       E'Livrable 02b/8 Welcome Guide. 10 entretiens terrain ados/jeunes réalisés, chacun documenté par 1 URL HTTPS (Notion / Google Doc / markdown). Auto-validation à la soumission complète. HARD BLOCK pédagogique : nécessite que 02a Préparation questions soit validée par votre mentor d''abord.',
       '[
          {"key":"fiche_1","label":"Fiche entretien 1","max":25},
          {"key":"fiche_2","label":"Fiche entretien 2","max":25},
          {"key":"fiche_3","label":"Fiche entretien 3","max":25},
          {"key":"fiche_4","label":"Fiche entretien 4","max":25},
          {"key":"fiche_5","label":"Fiche entretien 5","max":25},
          {"key":"fiche_6","label":"Fiche entretien 6","max":25},
          {"key":"fiche_7","label":"Fiche entretien 7","max":25},
          {"key":"fiche_8","label":"Fiche entretien 8","max":25},
          {"key":"fiche_9","label":"Fiche entretien 9","max":25},
          {"key":"fiche_10","label":"Fiche entretien 10","max":25}
        ]'::jsonb,
       250, 2, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L2_solution' and m.ord = 2
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.5 M3 (L3 ord=3) BMC [Livrable 03 officiel]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'bmc-v1',
       'Business Model Canvas',
       E'Livrable 03/8 Welcome Guide. BMC 9 blocs Strategyzer santé mentale digitale, ordre 1→9 (Segments → Coûts), côté client AVANT côté infrastructure. Spécificité : adresser tôt la question éthique des données sensibles.',
       '[
          {"key":"client_side","label":"Côté client (1.Segments / 2.Proposition valeur / 3.Canaux / 4.Relations / 5.Revenus) complétés >=2 phrases","max":10},
          {"key":"infra_side","label":"Côté infrastructure (6.Ressources / 7.Activités / 8.Partenaires / 9.Coûts) complétés >=2 phrases","max":8},
          {"key":"ethique","label":"Éthique données sensibles adressée explicitement (proposition valeur ou ressources clés)","max":4},
          {"key":"coherence","label":"Cohérence interne BMC ↔ persona M1 ↔ insights Design Thinking","max":3}
        ]'::jsonb,
       25, 1, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L3_market' and m.ord = 3
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.6 M4 (L4 ord=4) Étude marché & technique [Livrable 04 officiel]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'marche-technique-v1',
       'Étude marché & analyse technique',
       E'Livrable 04/8 Welcome Guide. Sizing marché (TAM/SAM/SOM synthèse), stack technique (Front/Back/IA/Data&sec/Intégrations/DevOps), risques tech & mitigations (IA biaisée, faille données, scaling, disponibilité réseau, acceptation clinicien).',
       '[
          {"key":"sizing_synthese","label":"TAM/SAM/SOM synthèse (3 niveaux estimés, justifiés)","max":6},
          {"key":"stack","label":"Stack technique 6 lignes (Front/Back/IA/Data&sec/Intégrations/DevOps) renseignées","max":8},
          {"key":"risques","label":"Risques tech identifiés (>=4) + mitigation pour chacun","max":7},
          {"key":"sante_specifique","label":"Spécificités santé mentale traitées : RGPD/Loi 09-08, HDS, escalade crise","max":4}
        ]'::jsonb,
       25, 1, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.7 M4 (L4 ord=4) MoSCoW (annexe 04b officielle)
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'moscow-v1',
       'MoSCoW prototype + plan 3 versions',
       E'Annexe 04b Welcome Guide. Méthode DSDM Dai Clegg 1994. Étape 1 : brainstorm 12-20 features. Étape 2 : classer en MUST/SHOULD/COULD/WONT. Étape 3 : hypothèses produit & éthique (adoption, tabou, données, escalade crise). Étape 4 : plan 3 versions (V1 MVP / V2 Pilote / V3 Public).',
       '[
          {"key":"brainstorm","label":"Étape 1 : 12-20 features brainstormées","max":5},
          {"key":"classement","label":"Étape 2 : 4 colonnes complétées (MUST<=60% effort, WONT explicite)","max":7},
          {"key":"hypotheses","label":"Étape 3 : 4 hypothèses adressées (adoption, tabou, éthique data, escalade crise)","max":6},
          {"key":"plan_versions","label":"Étape 4 : 3 versions V1/V2/V3 avec hypothèse testée + critère succès","max":7}
        ]'::jsonb,
       25, 2, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.8 M4 (L4 ord=4) TAM/SAM/SOM approfondi [BONUS]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'tam-sam-som-v1',
       'TAM/SAM/SOM approfondi',
       E'Approfondissement du sizing : 3 niveaux marché (TAM ados Maroc, SAM zone accessible, SOM capture an 1) avec hypothèses sourcées et calculs explicites.',
       '[
          {"key":"calcul_explicite","label":"3 niveaux estimés, chaque chiffre = source/hypothèse explicite","max":15},
          {"key":"realisme_som","label":"SOM cohérent avec stratégie 100 users (taux adoption crédible)","max":5},
          {"key":"coherence_persona","label":"SAM cohérent avec persona M1","max":5}
        ]'::jsonb,
       25, 3, true
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.9 M4 (L4 ord=4) Grille positionnement [BONUS]
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
       25, 4, true
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.10 M4 (L4 ord=4) Grille comparaison [BONUS]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'comparaison-v1',
       'Grille comparaison alternatives',
       E'Tableau comparatif features × concurrents + alternatives non-digitales (CMPP, ligne d''écoute).',
       '[
          {"key":"matrice","label":"Tableau features × 3-5 concurrents + 1-2 alternatives non-digitales","max":15},
          {"key":"insight","label":"Au moins 1 insight stratégique extrait (gap, opportunité)","max":10}
        ]'::jsonb,
       25, 5, true
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.11 M5 (L4 ord=5) Stratégie commercialisation [Livrable 05 officiel]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'commercialisation-v1',
       'Stratégie de commercialisation (Funnel AARRR + canaux)',
       E'Livrable 05/8 Welcome Guide. Funnel AARRR (Acquisition / Activation / Rétention / Referral / Revenue) Pirate Metrics McClure + tableau canaux d''acquisition Maroc (App Store ASO, Instagram/TikTok, partenariats facultés, mutuelles, associations).',
       '[
          {"key":"aarrr","label":"Funnel AARRR : 5 étages renseignés avec action concrète chaque","max":10},
          {"key":"canaux","label":"Tableau canaux : >=3 canaux avec Cible / CAC visé / Volume M1","max":8},
          {"key":"mix","label":">=1 canal B2B2C (facultés/mutuelles) + 1 canal organique + 1 canal payant","max":4},
          {"key":"realisme","label":"CAC et volumes M1 cohérents avec Unit Economics M5","max":3}
        ]'::jsonb,
       25, 1, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 5
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.12 M5 (L4 ord=5) Stratégie 100 premiers users [BONUS]
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 5
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.13 M6 (L5 ord=6) Unit Economics SaaS [Livrable 06 officiel]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'unit-economics-v1',
       'Unit Economics SaaS (CAC / LTV / Churn / Payback)',
       E'Livrable 06/8 Welcome Guide. Mesurer la santé économique d''1 utilisateur. 6 métriques : CAC (cible <200 DH), LTV (cible >3x CAC), Churn mensuel (cible <5%), MRR, Payback (cible <12 mois), Conversion freemium->premium (cible 2-5%). Ratio santé LTV/CAC visé entre 3 et 5.',
       '[
          {"key":"cac_ltv","label":"CAC et LTV calculés avec formule + cible + votre valeur","max":7},
          {"key":"churn_payback","label":"Churn mensuel et Payback calculés avec cible","max":6},
          {"key":"mrr_conv","label":"MRR et Conversion freemium->premium chiffrés","max":5},
          {"key":"ratio_sante","label":"Ratio LTV/CAC calculé + interprétation (3-5 = sain)","max":4},
          {"key":"hypotheses_sourcees","label":"Chaque chiffre = hypothèse explicite ou benchmark cité","max":3}
        ]'::jsonb,
       25, 1, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L5_pitch' and m.ord = 6
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.14 M7 (L5 ord=7) Techniques pitch [Livrable 07 officiel]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'techniques-pitch-v1',
       'Techniques de pitch (préparation)',
       E'Livrable 07/8 Welcome Guide. Préparation pitch : structure narrative (problème -> insight -> solution -> preuve -> traction -> demande), storytelling, répétition pitch à blanc jeudi 16h30. Document court (1 page synthèse + script).',
       '[
          {"key":"structure","label":"Structure narrative claire (6 beats min : problème/insight/solution/preuve/traction/demande)","max":10},
          {"key":"storytelling","label":"Un hook émotionnel + un chiffre fort + une preuve terrain","max":8},
          {"key":"prep_blanc","label":"Pitch à blanc J2 16h30 réalisé (confirmation coach)","max":7}
        ]'::jsonb,
       25, 1, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L5_pitch' and m.ord = 7
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.15 M7 (L5 ord=7) Pitch Deck final [Livrable 08 officiel]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'pitch-deck-v1',
       'Pitch Deck final',
       E'Livrable 08/8 Welcome Guide. Deck final 10-12 slides santé mentale, slide 4 OBLIGATOIRE = preuve terrain (verbatim ou chiffre).',
       '[
          {"key":"structure","label":"10-12 slides, structure standard pitch","max":5},
          {"key":"preuve_slide4","label":"Slide 4 = verbatim OU chiffre terrain sourcé (anti-fabrication)","max":10},
          {"key":"coherence","label":"Reprend persona M1 + hypothèses M1 + BMC M3 + analyse M5","max":5},
          {"key":"clarte","label":"Lisibilité, design propre, demande claire","max":5}
        ]'::jsonb,
       25, 2, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L5_pitch' and m.ord = 7
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- =============================================================================
-- End of seed (260519-pyx + 260519-l1l consolidated canonical)
-- =============================================================================
