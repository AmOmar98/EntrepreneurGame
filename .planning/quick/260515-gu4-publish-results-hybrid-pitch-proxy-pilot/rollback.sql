-- ============================================================================
-- Quick 260515-gu4 : ROLLBACK
-- ============================================================================
-- Use to fully revert the backfill of 2026-05-15 if the smoke test fails or
-- if the Top 3 needs recalibration. Idempotent.
-- ============================================================================

BEGIN;

-- 1. Unpublish results (revert events.results_published_at to NULL)
UPDATE events
SET results_published_at = NULL,
    updated_at = now()
WHERE id = 'f9a386aa-a547-4d0d-91d0-0bb16a29364e';

-- 2. Delete the 44 backfilled pitch_scores rows (scoped by event + 4 juror_ids)
DELETE FROM pitch_scores
WHERE event_id = 'f9a386aa-a547-4d0d-91d0-0bb16a29364e'
  AND juror_id IN (
    '379a3b8c-435e-4d97-85cd-2f803a66f4a8',  -- EIC Jury 1
    '9f9e8df9-f847-4828-87fb-141e10eceb59',  -- EIC Jury 2
    '42c30e95-800d-427f-97e5-37a51b7dced1',  -- EIC Jury 3
    '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334'   -- Omar Ameur (GM coordinator)
  );

COMMIT;
