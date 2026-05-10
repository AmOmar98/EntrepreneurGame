-- =============================================================================
-- 20260510170000_bonus_events_recreate.sql
-- T3X-EXPANSION wave 1 / plan 02 — Recreate bonus_events (retire en v0.2).
-- Decision D-02 : architecture dediee (NOT flag-based on deliverable_templates).
-- Mecanisme D-03 : multiplier sur scores futurs (1.0x..3.0x), scope next_deliverable
-- ou rest_of_event. R1 preserve : multiplier_factor numerique cote DB, JAMAIS
-- expose Player en chiffre (UI presente "Boost actif" qualitatif — cf plan 08).
--
-- Apply order : schema.sql -> triggers.sql -> rls.sql -> ... -> CETTE migration.
-- Idempotent : DO block enums + IF NOT EXISTS table + DROP+CREATE policies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums (mirror lib/types.ts BonusType / BonusStatus / MultiplierScope — Plan 05)
-- -----------------------------------------------------------------------------

do $$ begin
  create type public.bonus_type as enum (
    'bonus_verbatims_terrain',
    'bonus_dev_plan',
    'bonus_prototype_draft'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.bonus_status as enum (
    'draft',
    'submitted',
    'validated',
    'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.multiplier_scope as enum (
    'next_deliverable',
    'rest_of_event'
  );
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Table public.bonus_events
--    project_id -> public.players(id) (cf. schema.sql, players = teams)
--    Pas de unique sur (project_id, type) intentionnellement : un Player peut
--    re-claim apres rejet. L'unicite "active claim" est geree dans lib/score.ts
--    en filtrant status='validated' + max(claimed_at).
-- -----------------------------------------------------------------------------

create table if not exists public.bonus_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.players(id) on delete cascade,
  type public.bonus_type not null,
  title text not null,
  description text not null default '',
  doc_url text,
  status public.bonus_status not null default 'submitted',
  multiplier_factor numeric(3,2) not null default 1.50,
  multiplier_scope public.multiplier_scope not null default 'next_deliverable',
  multiplier_consumed_at timestamptz,
  claimed_at timestamptz not null default now(),
  claimed_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  feedback text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (multiplier_factor >= 1.00 and multiplier_factor <= 3.00),
  check (
    (status in ('draft','submitted') and reviewed_by is null and reviewed_at is null)
    or (status in ('validated','rejected') and reviewed_by is not null and reviewed_at is not null)
  )
);

comment on table public.bonus_events is
  'Bonus claim D-02/D-03 : Player soumet preuve URL, Mentor valide, multiplier applique aux scores futurs. R1 preserve.';

comment on column public.bonus_events.multiplier_factor is
  'Coefficient multiplicateur applique aux scores futurs si status=validated. Cap 3.0x. JAMAIS expose Player en chiffre (R1).';

comment on column public.bonus_events.multiplier_scope is
  'next_deliverable = consomme au 1er score post-claim. rest_of_event = persiste jusqu evenement.ends_at.';

comment on column public.bonus_events.multiplier_consumed_at is
  'Si scope=next_deliverable, timestamp ou le multiplier a ete applique a une submission validated.';

-- -----------------------------------------------------------------------------
-- 3. Indexes (hot FKs + filtre par status validated dans lib/score.ts)
-- -----------------------------------------------------------------------------

create index if not exists bonus_events_project_idx on public.bonus_events (project_id);
create index if not exists bonus_events_status_idx on public.bonus_events (status);
create index if not exists bonus_events_validated_active_idx
  on public.bonus_events (project_id, claimed_at)
  where status = 'validated' and multiplier_consumed_at is null;

-- -----------------------------------------------------------------------------
-- 4. Trigger updated_at (reuse public.set_updated_at de database/triggers.sql)
-- -----------------------------------------------------------------------------

drop trigger if exists trg_bonus_events_updated_at on public.bonus_events;
create trigger trg_bonus_events_updated_at
  before update on public.bonus_events
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. RLS — Player voit ses bonus, Mentor/GM voient tous, Player insert ses bonus
-- -----------------------------------------------------------------------------

alter table public.bonus_events enable row level security;

drop policy if exists "bonus_events_select" on public.bonus_events;
create policy "bonus_events_select" on public.bonus_events
  for select to authenticated
  using (public.is_my_player(project_id) or public.is_mentor());

drop policy if exists "bonus_events_player_insert" on public.bonus_events;
create policy "bonus_events_player_insert" on public.bonus_events
  for insert to authenticated
  with check (
    (public.is_my_player(project_id)
     and claimed_by = auth.uid()
     and status = 'submitted'
     and reviewed_by is null
     and reviewed_at is null)
    or public.is_game_master()
  );

drop policy if exists "bonus_events_mentor_update" on public.bonus_events;
create policy "bonus_events_mentor_update" on public.bonus_events
  for update to authenticated
  using (public.is_mentor() or public.is_game_master())
  with check (public.is_mentor() or public.is_game_master());

drop policy if exists "bonus_events_gm_delete" on public.bonus_events;
create policy "bonus_events_gm_delete" on public.bonus_events
  for delete to authenticated
  using (public.is_game_master());

-- Grants explicites (cf rls.sql ligne 263-285)
grant select, insert, update, delete on public.bonus_events to authenticated;
grant select, insert, update, delete on public.bonus_events to service_role;

-- -----------------------------------------------------------------------------
-- 6. Seed : reference data des 3 types bonus avec multiplier_factor par defaut
--    Note : c'est une reference table-less (les types vivent en enum). Le seed
--    ici DOCUMENTE les multipliers de reference dans un commentaire SQL.
--    Les multiplier_factor par claim sont copies depuis ce mapping cote
--    server action claimBonusEventFlow (Plan 06) — pas dans le DDL.
--
--    Mapping de reference (D-03) :
--      bonus_verbatims_terrain  -> multiplier_factor 1.50, scope next_deliverable
--      bonus_dev_plan           -> multiplier_factor 1.50, scope next_deliverable
--      bonus_prototype_draft    -> multiplier_factor 2.00, scope next_deliverable
-- -----------------------------------------------------------------------------

-- (pas d'INSERT seed ici — les types vivent en enum, les claims naissent
--  via app/actions.ts:claimBonusEventFlow Plan 06.)

-- =============================================================================
-- End of 20260510170000_bonus_events_recreate.sql
-- =============================================================================
