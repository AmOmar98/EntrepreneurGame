-- =============================================================================
-- Migration — pitch order columns (polish/design-v2-match V10)
--
-- Mirrors database/migrations/10-pitch-order.sql in idempotent form so that
-- `supabase db push` applies the same columns to the PROD Supabase instance
-- if not already present.
--
-- Adds to public.events:
--   1. pitch_order_json jsonb  : {playerId: slot} — GameMaster-set ordinal
--   2. pitch_order_published_at timestamptz : R1 gate for Player visibility
--
-- Idempotent via IF NOT EXISTS. No impact on auth.users (additive ALTER only).
-- =============================================================================

alter table public.events
  add column if not exists pitch_order_json jsonb,
  add column if not exists pitch_order_published_at timestamptz;

comment on column public.events.pitch_order_json is
  'JSON map {playerId -> slot} pour ordre pitch (manuel GameMaster ou tire au sort). NULL avant tirage.';
comment on column public.events.pitch_order_published_at is
  'Gate R1 : tant que NULL, slot invisible cote Player. Set par GameMaster apres edit.';
