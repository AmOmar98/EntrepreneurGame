-- =============================================================================
-- seed_event_digi_hackathon.NEW2.sql — quick 260519-l1l
-- L1/L2 restructure : Persona promu + Design Thinking bonus + nouvelle M2
-- Préparation+Entretiens + cascade ord M2..M7 (option B Omar 2026-05-19).
--
-- Pré-conditions vérifiées 2026-05-19 :
--   - 0 submission sur les 13 slugs concernés → flip is_bonus + reorder safe
--   - PK missions = (event_id, level_id, ord) → utilise offset temporaire +100
--   - PK deliverable_templates = (mission_id, slug) → reassignment via UPDATE mission_id
--
-- Idempotent : ON CONFLICT DO UPDATE partout. Re-applicable sans dégâts.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Étape 1 : offset temporaire +100 sur missions existantes pour éviter conflits
-- -----------------------------------------------------------------------------
update public.missions
set ord = ord + 100
where event_id = (select id from public.events where slug = 'hack-days-fes-meknes-mai-2026');

-- -----------------------------------------------------------------------------
-- Étape 2 : repositionner missions existantes vers leurs nouveaux ords
--    M1 L1 ord 101 → ord 1 (titre: "Atelier 1 — Persona + Design Thinking (bonus)")
--    M2 L2 ord 102 → ord 3 (BMC, sera la nouvelle M3)
--    M3 L3 ord 103 → ord 4 (Marché)
--    M4 L4 ord 104 → ord 5 (Commercialisation)
--    M5 L4 ord 105 → ord 6 (Unit Economics)
--    M6 L5 ord 106 → ord 7 (Pitch)
-- -----------------------------------------------------------------------------
update public.missions
set ord = 1,
    title = 'Atelier 1 — Persona + Design Thinking (bonus)'
where event_id = (select id from public.events where slug = 'hack-days-fes-meknes-mai-2026')
  and level_id = 'L1_problem' and ord = 101;

-- M2 (ex-BMC L2 ord=2) → glisse en M3 L3 ord=3. NOTE : level_id change L2_solution → L3_market.
-- Le PK est (event_id, level_id, ord) → l'UPDATE level_id + ord est atomique.
update public.missions
set ord = 3,
    level_id = 'L3_market',
    title = 'Atelier 3 — Business Model Canvas'
where event_id = (select id from public.events where slug = 'hack-days-fes-meknes-mai-2026')
  and level_id = 'L2_solution' and ord = 102;

-- M3 (ex-Marché L3 ord=3) → M4 L3 ord=4. NOTE : level_id change L3_market → L3_market (inchangé),
-- mais on déplace ord à 4 pour libérer ord=3 pour BMC. **Conflit potentiel** : M3 et nouveau-M3-BMC
-- pourraient se cogner sur L3_market ord=3. Donc on déplace d'abord M3 vers L4_business_model ord=4.
update public.missions
set ord = 4,
    level_id = 'L4_business_model',
    title = 'Atelier 4 — Étude marché & analyse technique'
where event_id = (select id from public.events where slug = 'hack-days-fes-meknes-mai-2026')
  and level_id = 'L3_market' and ord = 103;

update public.missions
set ord = 5,
    title = 'Atelier 5 — Stratégie de commercialisation'
where event_id = (select id from public.events where slug = 'hack-days-fes-meknes-mai-2026')
  and level_id = 'L4_business_model' and ord = 104;

update public.missions
set ord = 6,
    level_id = 'L5_pitch',
    title = 'Atelier 6 — Analyse financière (Unit Economics)'
where event_id = (select id from public.events where slug = 'hack-days-fes-meknes-mai-2026')
  and level_id = 'L4_business_model' and ord = 105;

update public.missions
set ord = 7,
    title = 'Atelier 7 — Techniques de pitch + Pitch jury'
where event_id = (select id from public.events where slug = 'hack-days-fes-meknes-mai-2026')
  and level_id = 'L5_pitch' and ord = 106;

-- -----------------------------------------------------------------------------
-- Étape 3 : insérer la nouvelle M2 L2 ord=2 (Préparation entretiens + Fiches)
-- -----------------------------------------------------------------------------
insert into public.missions (event_id, level_id, ord, kind, title, scheduled_at)
select e.id, 'L2_solution'::public.level_id, 2, 'atelier'::public.mission_kind,
       'Atelier 2 — Préparation entretiens + Fiches',
       '2026-05-20 13:00:00+01'::timestamptz
from public.events e where e.slug = 'hack-days-fes-meknes-mai-2026'
on conflict (event_id, level_id, ord) do update
  set kind = excluded.kind, title = excluded.title, scheduled_at = excluded.scheduled_at;

-- -----------------------------------------------------------------------------
-- Étape 4 : flip persona-v1 / design-thinking-v1 (Q1 — Persona main, DT bonus)
-- -----------------------------------------------------------------------------
update public.deliverable_templates
set is_bonus = false, ord = 1,
    title = 'Persona ado/jeune (livrable principal)',
    description = E'Livrable principal M1 (Q1 promotion 2026-05-19). 1 fiche persona = 1 adolescent/jeune réel cible santé mentale, tableau Attribut/Valeur/Source, >=2 sources triangulées.'
where slug = 'persona-v1';

update public.deliverable_templates
set is_bonus = true, ord = 2,
    title = 'Design Thinking (bonus — Empathize+Define+Ideate+Prototype)',
    description = E'Bonus M1 (Q1 demotion 2026-05-19). Livrable 02/8 Welcome Guide. 4 phases Stanford d.school : Empathize (persona + verbatims + pain points), Define (PoV + How Might We), Ideate (10 idées divergentes), Prototype/Test (idée retenue + critère succès).'
where slug = 'design-thinking-v1';

-- -----------------------------------------------------------------------------
-- Étape 5 : insérer 2 nouveaux deliverables sur M2 L2 ord=2
--   5.1 prep-questions-v1 (ord=1, is_bonus=false, max_score=25)
--   5.2 fiches-entretien-v1 (ord=2, is_bonus=false, max_score=250, hard-blocked sur 5.1)
-- -----------------------------------------------------------------------------
insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'prep-questions-v1',
       'Préparation questions entretiens (02a)',
       E'Livrable 02a/8 Welcome Guide. Guide de questions ouvertes pour entretiens terrain ados/jeunes : 6-10 questions thématisées (contexte de vie / pain points santé mentale / canaux d''aide actuels / acceptation d''une solution digitale). DOIT être validé par votre mentor AVANT de saisir les 10 fiches d''entretien (02b).',
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

insert into public.deliverable_templates (mission_id, slug, title, description, rubric, max_score, ord, is_bonus)
select m.id,
       'fiches-entretien-v1',
       '10 fiches d''entretien terrain (02b)',
       E'Livrable 02b/8 Welcome Guide. 10 entretiens terrain ados/jeunes réalisés, chacun documenté par 1 URL (note Notion / Google Doc / fichier markdown partagé). Auto-validation à la soumission complète (les 10 URLs HTTPS requises). HARD BLOCK pédagogique : nécessite que 02a Préparation questions soit validée par votre mentor d''abord.',
       '[
          {"key":"fiche_1","label":"Fiche entretien 1 (URL preuve)","max":25},
          {"key":"fiche_2","label":"Fiche entretien 2 (URL preuve)","max":25},
          {"key":"fiche_3","label":"Fiche entretien 3 (URL preuve)","max":25},
          {"key":"fiche_4","label":"Fiche entretien 4 (URL preuve)","max":25},
          {"key":"fiche_5","label":"Fiche entretien 5 (URL preuve)","max":25},
          {"key":"fiche_6","label":"Fiche entretien 6 (URL preuve)","max":25},
          {"key":"fiche_7","label":"Fiche entretien 7 (URL preuve)","max":25},
          {"key":"fiche_8","label":"Fiche entretien 8 (URL preuve)","max":25},
          {"key":"fiche_9","label":"Fiche entretien 9 (URL preuve)","max":25},
          {"key":"fiche_10","label":"Fiche entretien 10 (URL preuve)","max":25}
        ]'::jsonb,
       250, 2, false
from public.missions m
join public.events e on e.id = m.event_id
where e.slug = 'hack-days-fes-meknes-mai-2026' and m.level_id = 'L2_solution' and m.ord = 2
on conflict (mission_id, slug) do update
  set title = excluded.title, description = excluded.description, rubric = excluded.rubric,
      max_score = excluded.max_score, ord = excluded.ord, is_bonus = excluded.is_bonus;

commit;

-- =============================================================================
-- Post-apply verification queries (à exécuter manuellement)
-- =============================================================================
-- SELECT m.level_id::text, m.ord, m.title, dt.slug, dt.ord, dt.is_bonus, dt.max_score
-- FROM public.missions m
-- JOIN public.events e ON e.id = m.event_id
-- LEFT JOIN public.deliverable_templates dt ON dt.mission_id = m.id
-- WHERE e.slug = 'hack-days-fes-meknes-mai-2026'
-- ORDER BY m.ord, dt.ord;
-- Expect 15 deliverables (13 existing + 2 new), 7 missions ord 1..7.
