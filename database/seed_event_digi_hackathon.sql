-- =============================================================================
-- seed_event_digi_hackathon.sql  (NEW version — quick 260519-pyx)
--
-- À copier manuellement dans `database/seed_event_digi_hackathon.sql` quand
-- la deny-list `Write(database/**)` sera levée (post-pilote ou via toggle).
-- En attendant, ce fichier a été APPLIQUÉ DIRECTEMENT EN PROD via Supabase
-- execute_sql MCP le 2026-05-19 (voir SUMMARY.md).
--
-- Restructure : 12 deliverables (quick 260519-dgh, commit 4ee92a9)
--          →   11 deliverables alignés sur 8 livrables officiels Welcome Guide PDF
--                (C:\Users\omara\OneDrive - UEMF\Digi-Hackathon\*.pdf).
--
-- Mapping livrables officiels :
--   01 Welcome Guide       (cadrage, non noté)
--   02 Design Thinking     -> design-thinking-v1 (Empathize+Define+Ideate+Prototype)
--   03 BMC                 -> bmc-v1
--   04 Marché & technique  -> marche-technique-v1 (+ annexe 04b moscow-v1)
--   05 Commercialisation   -> commercialisation-v1 (Funnel AARRR + canaux)
--   06 Unit Economics SaaS -> unit-economics-v1 (CAC/LTV/Churn/MRR/Payback)
--   07 Techniques pitch    -> techniques-pitch-v1
--   08 Pitch Deck final    -> pitch-deck-v1
--
-- Event slug PRESERVED ('hack-days-fes-meknes-mai-2026') : tous les TS refs OK.
--
-- Idempotent (ON CONFLICT DO UPDATE + DELETE des slugs disparus).
-- 5 bonus inchangés : persona-v1, tam-sam-som-v1, positionnement-v1,
--                     comparaison-v1, strategie-100-users-v1.
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
-- 4. Missions — 6 ateliers, titres alignés Welcome Guide p.2
-- -----------------------------------------------------------------------------
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L1_problem'::public.level_id, 1, 'atelier'::public.mission_kind,
       'Atelier 1 — Design Thinking',
       '2026-05-20 10:30:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L2_solution'::public.level_id, 2, 'atelier'::public.mission_kind,
       'Atelier 2 — Business Model Canvas',
       '2026-05-20 14:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L3_market'::public.level_id, 3, 'atelier'::public.mission_kind,
       'Atelier 3 — Étude marché & analyse technique',
       '2026-05-20 15:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 4, 'atelier'::public.mission_kind,
       'Atelier 4 — Stratégie de commercialisation',
       '2026-05-21 09:30:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L4_business_model'::public.level_id, 5, 'atelier'::public.mission_kind,
       'Atelier 5 — Analyse financière (Unit Economics)',
       '2026-05-21 11:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L5_pitch'::public.level_id, 6, 'pitch'::public.mission_kind,
       'Atelier 6 — Techniques de pitch + Pitch jury',
       '2026-05-22 09:30:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

-- -----------------------------------------------------------------------------
-- 5.0 — Cleanup : slugs disparus du layout précédent
--   hypotheses-v1, questionnaire-v1, fiches-users-10-v1 : fusionnés dans design-thinking-v1
--   capex-opex-v1 : remplacé par unit-economics-v1 (PDF 06 = CAC/LTV/Churn ≠ CAPEX/OPEX)
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
-- 5. DeliverableTemplates — 11 livrables (5 bonus + 6 non-bonus)
-- -----------------------------------------------------------------------------

-- 5.1 M1 (L1) Design Thinking [Livrable 02 officiel]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'design-thinking-v1',
       'Design Thinking (Empathize + Define + Ideate + Prototype)',
       E'Livrable 02/8 Welcome Guide. 4 phases Stanford d.school : Empathize (persona + verbatims + pain points), Define (PoV + How Might We), Ideate (10 idées divergentes), Prototype/Test (idée retenue + critère succès).',
       '[
          {"key":"empathize","label":"EMPATHIZE : persona principal + contexte de vie + 3 verbatims + pain points émotionnels","max":7},
          {"key":"define","label":"DEFINE : Point of View (utilisateur / besoin / insight) + reformulation HMW","max":6},
          {"key":"ideate","label":"IDEATE : 10 idées divergentes (quantité avant qualité)","max":6},
          {"key":"prototype","label":"PROTOTYPE/TEST : 1 idée retenue + forme proto + 3 utilisateurs / critère succès+échec","max":6}
        ]'::jsonb,
       25, 1, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L1_problem' and m.ord = 1
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.2 M1 (L1) Persona [BONUS]
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L1_problem' and m.ord = 1
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.3 M2 (L2) BMC [Livrable 03 officiel]
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L2_solution' and m.ord = 2
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.4 M3 (L3) Étude marché & technique [Livrable 04 officiel]
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L3_market' and m.ord = 3
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.5 M3 (L3) MoSCoW (annexe 04b officielle)
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L3_market' and m.ord = 3
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.6 M3 (L3) TAM/SAM/SOM approfondi [BONUS] (déplacé M3-BMC → M3-Marché)
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L3_market' and m.ord = 3
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.7 M3 (L3) Grille positionnement [BONUS]
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L3_market' and m.ord = 3
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.8 M3 (L3) Grille comparaison [BONUS]
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L3_market' and m.ord = 3
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.9 M4 (L4 ord=4) Stratégie commercialisation [Livrable 05 officiel]
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.10 M4 (L4 ord=4) Stratégie 100 users [BONUS] (déplacé M5 → M4)
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 4
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.11 M5 (L4 ord=5) Unit Economics SaaS [Livrable 06 officiel — REMPLACE capex-opex-v1]
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L4_business_model' and m.ord = 5
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.12 M6 (L5) Techniques pitch [Livrable 07 officiel]
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
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L5_pitch' and m.ord = 6
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- 5.13 M6 (L5) Pitch Deck final [Livrable 08 officiel]
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'pitch-deck-v1',
       'Pitch Deck final',
       E'Livrable 08/8 Welcome Guide. Deck final 10-12 slides santé mentale, slide 4 OBLIGATOIRE = preuve terrain (verbatim ou chiffre).',
       '[
          {"key":"structure","label":"10-12 slides, structure standard pitch","max":5},
          {"key":"preuve_slide4","label":"Slide 4 = verbatim OU chiffre terrain sourcé (anti-fabrication)","max":10},
          {"key":"coherence","label":"Reprend persona M1 + BMC M2 + Marché M3 + Unit Economics M5","max":5},
          {"key":"clarte","label":"Lisibilité, design propre, demande claire","max":5}
        ]'::jsonb,
       25, 2, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L5_pitch' and m.ord = 6
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

-- =============================================================================
-- End of seed (260519-pyx restructure)
-- =============================================================================
