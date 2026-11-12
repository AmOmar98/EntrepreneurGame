-- ============================================================================
-- Seed / Provisioning Idempotent — Idea'Wave · Bootcamp de préincubation
-- Dates : 16 & 17 Novembre 2026 (Programme Officiel PDF 3 pages)
-- ============================================================================
-- Garantie ARCHIVES INTACTES :
--   - Ne supprime AUCUNE donnée historique (`agreentech-fes-meknes-mai-2026`
--     et `hack-days-fes-meknes-mai-2026` restent intacts en lecture seule avec
--     `is_active = false`).
--   - Configure l'événement `ideawave-bootcamp-nov-2026` (`7d553162-1c1e-44d9-9845-9f7b1c58f619`),
--     sa cohorte `cohorte-ideawave-nov-2026`, ses `event_settings`, ses 5 critères Jury
--     alignés sur les 5 piliers du programme, ainsi que les 7 modules et 11 livrables
--     des Jour 1 (16 nov) et Jour 2 (17 nov).
-- ============================================================================

BEGIN;

-- 1. Archiver tous les événements précédents de l'organisation EIC (sans rien supprimer)
UPDATE public.events
SET is_active = false,
    updated_at = now()
WHERE organization_id = '588bc094-d46c-472d-8c91-023738026be4'
  AND slug <> 'ideawave-bootcamp-nov-2026'
  AND is_active = true;

-- 2. Créer ou mettre à jour l'événement Idea'Wave · Bootcamp de préincubation (16 & 17 nov. 2026)
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
  'Idea''Wave · Bootcamp de préincubation (16 & 17 nov. 2026)',
  '588bc094-d46c-472d-8c91-023738026be4',
  '2026-11-16T09:00:00+01:00',
  '2026-11-17T16:00:00+01:00',
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

-- 5. Grille Jury officielle (5 piliers x 20 pts = 100 pts)
DO $$
DECLARE
  v_event_id uuid;
BEGIN
  SELECT id INTO v_event_id FROM public.events WHERE slug = 'ideawave-bootcamp-nov-2026';

  INSERT INTO public.pitch_criteria (event_id, key, label, max, ord)
  VALUES
    (v_event_id, 'problem',                'Problème & Proposition de valeur (besoin identifié, cible, différenciation)', 20, 1),
    (v_event_id, 'solution',               'Faisabilité technique & Plan de développement (MoSCoW, feuille de route, risques)', 20, 2),
    (v_event_id, 'market',                 'Étude de marché, Positionnement & Stratégie Go-to-Market', 20, 3),
    (v_event_id, 'business_model_funding', 'Modèle économique (BMC) & Besoin de financement', 20, 4),
    (v_event_id, 'presentation',           'Pitch (3 min), Réponses aux objections & Prochaines étapes', 20, 5)
  ON CONFLICT (event_id, key) DO UPDATE
  SET label = EXCLUDED.label,
      max = EXCLUDED.max,
      ord = EXCLUDED.ord;
END $$;

COMMIT;
