-- quick-260520-124 V4 session mode — add optional comment columns to pitch_scores.
-- Backward-compat : nullable, pas de default. Existing rows restent valides.
-- RLS heritee des policies courantes (juror voit ses propres rows, GM voit tout
-- en mode closed/published).
--
-- Apply via Supabase MCP `apply_migration` ou `execute_sql`.

ALTER TABLE pitch_scores
  ADD COLUMN IF NOT EXISTS comment_c1 text,
  ADD COLUMN IF NOT EXISTS comment_c2 text,
  ADD COLUMN IF NOT EXISTS comment_c3 text,
  ADD COLUMN IF NOT EXISTS comment_c4 text,
  ADD COLUMN IF NOT EXISTS comment_c5 text,
  ADD COLUMN IF NOT EXISTS comment_global text;

-- ============================================================================
-- quick-260520-124 extension (Task 1, 2026-05-20) — is_draft + verdict columns.
-- Backward-compat : is_draft default true (new rows = brouillon par defaut),
-- existing rows backfilled a false (votes deja injectes = "valides").
-- verdict nullable + CHECK constraint (4 valeurs ou NULL).
-- ============================================================================

ALTER TABLE pitch_scores
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS verdict text;

ALTER TABLE pitch_scores DROP CONSTRAINT IF EXISTS pitch_scores_verdict_check;
ALTER TABLE pitch_scores ADD CONSTRAINT pitch_scores_verdict_check
  CHECK (verdict IS NULL OR verdict IN ('not_convinced', 'needs_work', 'convinced', 'favorite'));

-- Backfill : tout vote existant est considere "valide" (pas brouillon).
UPDATE pitch_scores SET is_draft = false WHERE is_draft IS NULL OR is_draft = true;
