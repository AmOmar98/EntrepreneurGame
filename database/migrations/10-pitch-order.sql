-- =============================================================================
-- Migration 10 — pitch order randomization (Phase 10 / 0.10 — C3)
--
-- Adds:
--   1. events.pitch_order_json jsonb : {playerId: slot}
--   2. events.pitch_order_published_at timestamptz : gates Player visibility
--
-- Spec (T3-IMPROVEMENTS.md C3, plan 10-01-PLAN.md ligne 133-137) :
--   - Ordre tire au sort sur les 11 equipes AgreenTech 2026
--   - Equipes "ancres" (top preselection) placees en milieu (slot 4-8)
--   - Jamais slot 1 ni slot 11
--   - Annonce aux equipes : "ordre tire au sort"
--
-- Cardinal rules (R1) preserved : pitch_order_json contient des slots ordinaux
-- et NE doit jamais reveler "anchor" / "preselection" cote Player.
-- pitch_order_published_at gate l'affichage cote Player.
--
-- Apply: Supabase Studio SQL editor OR `supabase db push` after pulling latest schema.
-- =============================================================================

alter table public.events
  add column if not exists pitch_order_json jsonb,
  add column if not exists pitch_order_published_at timestamptz;

comment on column public.events.pitch_order_json is
  'JSON map {playerId -> slot} pour ordre pitch tire au sort. NULL avant tirage GameMaster.';
comment on column public.events.pitch_order_published_at is
  'Gate R1 : tant que NULL, slot invisible cote Player. Set par GameMaster apres tirage.';
