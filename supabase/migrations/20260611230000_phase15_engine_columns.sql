-- ============================================================================
-- Phase 15-01 : Engine columns — data-driven behaviour per deliverable_template
-- ============================================================================
-- Adds 5 data-driven behaviour columns to deliverable_templates so the GM
-- editor (phase 15) can configure composer_kind, template_url, auto_validate,
-- soft_recommends_before, and validation_rules without writing SQL.
-- ADDITIVE ONLY: ADD COLUMN IF NOT EXISTS; idempotent CHECK via DROP-then-ADD.
-- Apply after 20260611220000_events_org_scope_enforce.sql.
-- Tag de securite : v0.4-pre-phase15
-- PROD apply: deferred to batched operator checkpoint (with 20260611220000).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Five new behaviour columns on deliverable_templates
-- ----------------------------------------------------------------------------

ALTER TABLE public.deliverable_templates
  ADD COLUMN IF NOT EXISTS composer_kind    text    NOT NULL DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS template_url     text,
  ADD COLUMN IF NOT EXISTS auto_validate    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS soft_recommends_before uuid
    REFERENCES public.deliverable_templates(id),
  ADD COLUMN IF NOT EXISTS validation_rules jsonb   NOT NULL DEFAULT '[]'::jsonb;

-- ----------------------------------------------------------------------------
-- 2. CHECK constraint: validation_rules severity MUST be 'warn' only
--    (R2 CARDINAL + VALID-01 structural — mirrored by z.literal("warn") in TS)
--    Drop-then-add pattern for idempotency.
-- ----------------------------------------------------------------------------

ALTER TABLE public.deliverable_templates
  DROP CONSTRAINT IF EXISTS validation_rules_severity_warn_only;

ALTER TABLE public.deliverable_templates
  ADD CONSTRAINT validation_rules_severity_warn_only
  CHECK (
    validation_rules = '[]'::jsonb
    OR NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(validation_rules) AS r
      WHERE (r->>'severity') <> 'warn'
    )
  );

-- ----------------------------------------------------------------------------
-- 3. CHECK constraint: composer_kind must be one of the known kinds
--    (T-15-02: elevation prevention, mirrors z.enum in TS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.deliverable_templates
  DROP CONSTRAINT IF EXISTS composer_kind_valid_values;

ALTER TABLE public.deliverable_templates
  ADD CONSTRAINT composer_kind_valid_values
  CHECK (composer_kind IN ('simple', 'moscow', 'multi_url'));

-- ----------------------------------------------------------------------------
-- 4. Backfill the 13 Digi-Hackathon deliverable templates
--    Scoped to templates whose mission belongs to the Digi event by slug.
--    composer_kind: 'moscow' for moscow-v1, 'multi_url' for fiches-entretien-v1,
--                   'simple' for all others.
--    auto_validate: true only for fiches-entretien-v1.
--    template_url: real OneDrive URLs from lib/template-links.ts.
-- ----------------------------------------------------------------------------

UPDATE public.deliverable_templates dt
SET
  composer_kind = CASE dt.slug
    WHEN 'moscow-v1'            THEN 'moscow'
    WHEN 'fiches-entretien-v1'  THEN 'multi_url'
    ELSE                             'simple'
  END,
  auto_validate = (dt.slug = 'fiches-entretien-v1'),
  template_url = CASE dt.slug
    WHEN 'persona-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQB1eg6xKSGJSr-BUiGGF_NVAWi6lL0aYM33Z3uNqbqAr30?e=UDn6lY'
    WHEN 'design-thinking-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQB1eg6xKSGJSr-BUiGGF_NVAWi6lL0aYM33Z3uNqbqAr30?e=UDn6lY'
    WHEN 'prep-questions-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQCE6O776P8MSLeIFRNcEzVcAYIwCB9DG2mbU0A1kPr4YO0?e=Nz1CJ8'
    WHEN 'fiches-entretien-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQCD7LdcvseSSJGeIC9gyEcMAc4QGSX3wyaSRG3wzp4-sks?e=eXkgYw'
    WHEN 'bmc-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQDfctMur7k_TYk9sq9o87-uAcJtPWXpOmkQhnTBd5-wyWo?e=z1XYOb'
    WHEN 'marche-technique-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBQd5pSBYaOTqyM5alG1DxHAVNwwskD7qRfn-ZeGX3DZ84?e=Vq2n4i'
    WHEN 'moscow-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQC2pqIzOVJ9SJSuv5NPeU-8AbsKFDQ8OCxeaNZ8jdq_XM8?e=Tvkxfc'
    WHEN 'tam-sam-som-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBQd5pSBYaOTqyM5alG1DxHAVNwwskD7qRfn-ZeGX3DZ84?e=Vq2n4i'
    WHEN 'positionnement-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBQd5pSBYaOTqyM5alG1DxHAVNwwskD7qRfn-ZeGX3DZ84?e=Vq2n4i'
    WHEN 'comparaison-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBQd5pSBYaOTqyM5alG1DxHAVNwwskD7qRfn-ZeGX3DZ84?e=Vq2n4i'
    WHEN 'commercialisation-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQDaSjUNjt14Q5BHtY9GxDA4AZSVZn_ysdyRktKE5db7OLw?e=Zt0LlL'
    WHEN 'strategie-100-users-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQDaSjUNjt14Q5BHtY9GxDA4AZSVZn_ysdyRktKE5db7OLw?e=Zt0LlL'
    WHEN 'unit-economics-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQCXH2YCGuJyRYHeEY9kXmSWAV7Op6uCqChZombAia10tOU?e=TwAcN2'
    WHEN 'techniques-pitch-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQBH5shqL33xQZFWAnihHCNuAevzdQ_P45AQXROmWmLupzg?e=HQgpnw'
    WHEN 'pitch-deck-v1'
      THEN 'https://universiteeurome-my.sharepoint.com/:b:/g/personal/o_ameur_ueuromed_org/IQCVXFKynh32TKSSB3ht3oLfAZdoPdu3_8xt1Zvs2B8IMvg?e=D5mM5n'
    ELSE NULL
  END
WHERE dt.mission_id IN (
  SELECT m.id
  FROM public.missions m
  JOIN public.events e ON e.id = m.event_id
  WHERE e.slug = 'hack-days-fes-meknes-mai-2026'
);

-- ----------------------------------------------------------------------------
-- 5. CHECK constraint: auto_validate may only be true for multi_url templates
--    (CR-02: prevents auto-eval logic from applying a hardcoded fiche rubric
--    to templates with a different rubric structure.)
-- ----------------------------------------------------------------------------

ALTER TABLE public.deliverable_templates
  DROP CONSTRAINT IF EXISTS auto_validate_multi_url_only;

ALTER TABLE public.deliverable_templates
  ADD CONSTRAINT auto_validate_multi_url_only
  CHECK (NOT auto_validate OR composer_kind = 'multi_url');

-- ----------------------------------------------------------------------------
-- 6. Generalize fn_auto_eval_fiches_entretien to use auto_validate column
--    instead of the 'fiches-entretien-v1' slug literal (ENGINE-05).
--    G01 UUID 59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334 retained as canonical
--    SECURITY DEFINER system evaluator.
--    CR-02 guard: only fires for composer_kind='multi_url' templates.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_auto_eval_fiches_entretien()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auto         boolean;
  v_max_score    numeric;
  v_composer     text;
BEGIN
  -- Only fire on validated submissions.
  IF NEW.status <> 'validated' THEN
    RETURN NEW;
  END IF;

  -- Look up auto_validate flag, max_score, and composer_kind from the template.
  -- Uses the new auto_validate column instead of the slug literal (ENGINE-05).
  SELECT auto_validate, max_score, composer_kind
  INTO   v_auto, v_max_score, v_composer
  FROM   public.deliverable_templates
  WHERE  id = NEW.deliverable_template_id;

  -- If auto_validate is false (or template not found), skip.
  IF NOT COALESCE(v_auto, false) THEN
    RETURN NEW;
  END IF;

  -- CR-02: guard — only fire for multi_url composer_kind.
  -- The hardcoded fiche rubric (fiche_1..fiche_10) is only valid for multi_url
  -- templates. Any other composer_kind with auto_validate=true is blocked by
  -- the CHECK constraint above, but we guard defensively here too.
  IF COALESCE(v_composer, '') <> 'multi_url' THEN
    RETURN NEW;
  END IF;

  -- Skip if an evaluation already exists for this submission (idempotency).
  IF EXISTS (SELECT 1 FROM public.evaluations WHERE submission_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.evaluations (
    submission_id,
    evaluator_id,
    scores,
    total_score,
    feedback,
    verdict
  ) VALUES (
    NEW.id,
    '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334'::uuid,
    jsonb_build_object(
      'fiche_1', 25, 'fiche_2', 25, 'fiche_3', 25, 'fiche_4', 25, 'fiche_5', 25,
      'fiche_6', 25, 'fiche_7', 25, 'fiche_8', 25, 'fiche_9', 25, 'fiche_10', 25
    ),
    COALESCE(v_max_score, 250),
    'Auto-valide (phase15-01 generalisation auto_validate) : livrable auto_validate=true soumis. Note fixe 25 par critere.',
    'validate_v1'::verdict
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_auto_eval_fiches_entretien() IS
  'Phase15-01 CR-02 fix 2026-06-11: guards on composer_kind=multi_url before inserting fiche rubric. Uses auto_validate column (ENGINE-05). G01 evaluator UUID 59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334 unchanged.';

-- ----------------------------------------------------------------------------
-- 7. Trigger binding (IN-02): ensure trg_auto_eval_fiches_entretien exists
--    on fresh Supabase bootstraps (previously only in a planning SQL file).
-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_auto_eval_fiches_entretien ON public.submissions;
CREATE TRIGGER trg_auto_eval_fiches_entretien
  AFTER INSERT OR UPDATE OF status ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_eval_fiches_entretien();

-- ----------------------------------------------------------------------------
-- 8. WR-03: partial unique index — one active event per org (replaces the
--    previously-applied global uniq_events_single_active index).
--    The old global index is dropped first (if it exists) so both a fresh
--    bootstrap and an incremental apply reach the same final state.
-- ----------------------------------------------------------------------------

DROP INDEX IF EXISTS public.uniq_events_single_active;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_events_single_active_per_org
  ON public.events(organization_id)
  WHERE is_active = true;

COMMIT;

-- ── Rollback (manual — reserved for emergency only) ──────────────────────────
-- Step 5: restore prior trigger body (check slug = 'fiches-entretien-v1')
--         via .planning/quick/260519-smoke-prod-j1/fix_h1_auto_eval_trigger.sql
-- Step 4: (backfill is non-destructive UPDATE — no data to revert)
-- Step 3: ALTER TABLE public.deliverable_templates
--           DROP CONSTRAINT IF EXISTS composer_kind_valid_values;
-- Step 2: ALTER TABLE public.deliverable_templates
--           DROP CONSTRAINT IF EXISTS validation_rules_severity_warn_only;
-- Step 1: ALTER TABLE public.deliverable_templates
--           DROP COLUMN IF EXISTS validation_rules,
--           DROP COLUMN IF EXISTS soft_recommends_before,
--           DROP COLUMN IF EXISTS auto_validate,
--           DROP COLUMN IF EXISTS template_url,
--           DROP COLUMN IF EXISTS composer_kind;
-- Note: PROD apply was deferred to operator checkpoint — ensure rollback is
-- applied in reverse on any live Supabase instance before removing from codebase.
-- ─────────────────────────────────────────────────────────────────────────────
