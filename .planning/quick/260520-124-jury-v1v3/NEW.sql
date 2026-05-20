-- quick-260520-124 V4 session mode — add optional comment columns to pitch_scores.
-- Backward-compat : nullable, pas de default. Existing rows restent valides.
-- RLS héritée des policies courantes (juror voit ses propres rows, GM voit tout
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
