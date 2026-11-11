-- ============================================================================
-- Seed / Provisioning Idempotent — Bootcamp Idea'Wave (16 & 17 Novembre 2026)
-- ============================================================================
-- Garantie ARCHIVES INTACTES :
--   - Ne supprime AUCUNE donnée historique (`agreentech-fes-meknes-mai-2026`
--     et `hack-days-fes-meknes-mai-2026` restent intacts en lecture seule avec
--     `is_active = false`).
--   - Crée ou met à jour l'événement `ideawave-bootcamp-nov-2026` (EIC),
--     sa cohorte `cohorte-ideawave-nov-2026`, ses `event_settings`, ses
--     `pitch_criteria`, ainsi que le planning de travail J1 (16 nov) / J2 (17 nov)
--     et les templates de livrables EIC pré-configurés.
-- ============================================================================

BEGIN;

-- 1. Archiver tous les événements précédents de l'organisation EIC (sans rien supprimer)
UPDATE public.events
SET is_active = false,
    updated_at = now()
WHERE organization_id = '588bc094-d46c-472d-8c91-023738026be4'
  AND slug <> 'ideawave-bootcamp-nov-2026'
  AND is_active = true;

-- 2. Créer ou mettre à jour l'événement Bootcamp Idea'Wave (16 & 17 Novembre 2026)
INSERT INTO public.events (
  slug,
  name,
  organization_id,
  starts_at,
  ends_at,
  is_active,
  pitch_mode_state
)
VALUES (
  'ideawave-bootcamp-nov-2026',
  'Bootcamp Idea''Wave — 16 & 17 Novembre 2026',
  '588bc094-d46c-472d-8c91-023738026be4',
  '2026-11-16T08:30:00+01:00',
  '2026-11-17T18:00:00+01:00',
  true,
  'off'
)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    organization_id = EXCLUDED.organization_id,
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    is_active = true,
    updated_at = now();

-- 3. Paramètres de scoring (event_settings)
INSERT INTO public.event_settings (
  event_id,
  xp_first_submission,
  xp_validate_v1,
  xp_validate_v2,
  eng_submitted,
  eng_reviewed,
  eng_validated,
  pitch_weight,
  bonus_multiplier_cap
)
SELECT
  id,
  100,
  50,
  100,
  100,
  25,
  50,
  0.800,
  3.0
FROM public.events
WHERE slug = 'ideawave-bootcamp-nov-2026'
ON CONFLICT (event_id) DO NOTHING;

-- 4. Cohorte principale du Bootcamp Idea'Wave
INSERT INTO public.cohorts (
  event_id,
  slug,
  name
)
SELECT
  id,
  'cohorte-ideawave-nov-2026',
  'Cohorte Idea''Wave Novembre 2026'
FROM public.events
WHERE slug = 'ideawave-bootcamp-nov-2026'
ON CONFLICT (event_id, slug) DO UPDATE
SET name = EXCLUDED.name,
    updated_at = now();

-- 5. Grille Jury par défaut (4 critères x 20 pts, normalisée sur /100)
DO $$
DECLARE
  v_event_id uuid;
BEGIN
  SELECT id INTO v_event_id FROM public.events WHERE slug = 'ideawave-bootcamp-nov-2026';

  INSERT INTO public.pitch_criteria (event_id, key, label, max, ord)
  VALUES
    (v_event_id, 'problem',      'Pertinence & validation du problème', 20, 1),
    (v_event_id, 'solution',     'Clarté & faisabilité de la solution', 20, 2),
    (v_event_id, 'market',       'Marché, modèle économique & go-to-market', 20, 3),
    (v_event_id, 'presentation', 'Qualité du pitch & posture d''équipe', 20, 4)
  ON CONFLICT (event_id, key) DO NOTHING;
END $$;

-- 6. Planning de travail J1 (16 nov 2026) & J2 (17 nov 2026) + Livrables EIC
-- Clônage initial depuis la structure pédagogique EIC validée (modifiable à chaud
-- dans /admin/events/[id]/missions ou via scripts/provision-ideawave-bootcamp.mjs).
DO $$
DECLARE
  v_src_event_id uuid;
  v_dst_event_id uuid;
  r_mission RECORD;
  v_new_mission_id uuid;
  v_scheduled timestamptz;
BEGIN
  SELECT id INTO v_src_event_id FROM public.events WHERE slug = 'hack-days-fes-meknes-mai-2026';
  SELECT id INTO v_dst_event_id FROM public.events WHERE slug = 'ideawave-bootcamp-nov-2026';

  IF v_dst_event_id IS NOT NULL AND v_src_event_id IS NOT NULL THEN
    FOR r_mission IN
      SELECT * FROM public.missions WHERE event_id = v_src_event_id ORDER BY ord ASC
    LOOP
      -- Répartition horaire sur les 2 jours du Bootcamp Idea'Wave (16 & 17 nov 2026, UTC+1) :
      -- J1 (16 nov) : Ateliers 1 à 4 (Problème, Entretiens, BMC, Marché/MoSCoW)
      -- J2 (17 nov) : Ateliers 5 à 7 (Commercialisation, Unit Economics, Pitch final)
      v_scheduled := CASE r_mission.ord
        WHEN 1 THEN '2026-11-16T09:30:00+01:00'::timestamptz
        WHEN 2 THEN '2026-11-16T11:30:00+01:00'::timestamptz
        WHEN 3 THEN '2026-11-16T14:30:00+01:00'::timestamptz
        WHEN 4 THEN '2026-11-16T16:30:00+01:00'::timestamptz
        WHEN 5 THEN '2026-11-17T09:00:00+01:00'::timestamptz
        WHEN 6 THEN '2026-11-17T11:00:00+01:00'::timestamptz
        ELSE        '2026-11-17T14:30:00+01:00'::timestamptz
      END;

      INSERT INTO public.missions (
        event_id,
        level_id,
        level_id_text,
        ord,
        kind,
        title,
        scheduled_at
      )
      VALUES (
        v_dst_event_id,
        r_mission.level_id,
        r_mission.level_id_text,
        r_mission.ord,
        r_mission.kind,
        r_mission.title,
        v_scheduled
      )
      ON CONFLICT (event_id, level_id, ord) DO UPDATE
      SET scheduled_at = EXCLUDED.scheduled_at,
          updated_at = now()
      RETURNING id INTO v_new_mission_id;

      -- Copier les deliverable_templates rattachés à cette mission (en conservant les slugs canoniques)
      INSERT INTO public.deliverable_templates (
        mission_id,
        slug,
        title,
        description,
        rubric,
        max_score,
        ord,
        is_active,
        is_bonus,
        composer_kind,
        template_url,
        auto_validate,
        validation_rules
      )
      SELECT
        v_new_mission_id,
        dt.slug,
        dt.title,
        dt.description,
        dt.rubric,
        dt.max_score,
        dt.ord,
        COALESCE(dt.is_active, true),
        COALESCE(dt.is_bonus, false),
        COALESCE(dt.composer_kind, 'simple'),
        dt.template_url,
        COALESCE(dt.auto_validate, false),
        COALESCE(dt.validation_rules, '[]'::jsonb)
      FROM public.deliverable_templates dt
      WHERE dt.mission_id = r_mission.id
      ON CONFLICT (mission_id, slug) DO NOTHING;
    END LOOP;
  END IF;
END $$;

COMMIT;
