-- =============================================================================
-- 20260512020000_deliverable_is_bonus.sql
-- Polish v3 mockups (2026-05-12) — Add is_bonus column + swap M1 ord.
--
-- Pédagogie M1 (L1_problem) refondue :
--   - probleme-v1 (Hypothèse VP cible Lean + pitch 1min) devient ord=1 (livrable principal).
--   - personae-v1 (Persona AgriTech fiche tableau sourcée) devient ord=2 + is_bonus=true.
--
-- R1/R2/R3 : is_bonus est PUREMENT VISUEL.
--   - N'EST PAS lu par recalc_player_score (database/triggers.sql:56-83) — scoring intact.
--   - N'EST PAS lu par sumPlayerScoreProject (lib/score.ts:19-33) — scoring intact.
--   - NE DOIT PAS être lu pour gate/disable un autre livrable (audit grep clean 2026-05-12).
--
-- Idempotent : ADD COLUMN IF NOT EXISTS + UPDATE ciblé par slug.
-- =============================================================================

alter table public.deliverable_templates
  add column if not exists is_bonus boolean not null default false;

comment on column public.deliverable_templates.is_bonus is
  'Visual badge "Bonus" côté Player (label uniquement, n''affecte ni le scoring ni le gating). Polish v3 2026-05-12.';

-- M1 (L1_problem) — swap ord + flag personae-v1 as bonus.
update public.deliverable_templates
   set ord = 1
 where slug = 'probleme-v1';

update public.deliverable_templates
   set ord = 2,
       is_bonus = true
 where slug = 'personae-v1';
