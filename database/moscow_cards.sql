-- =============================================================================
-- moscow_cards.sql
-- T3X-EXPANSION wave 1 / plan 03 — Mirror local de la migration Supabase
-- supabase/migrations/20260510170100_moscow_cards.sql.
--
-- Apply via : psql $SUPABASE_DB_URL -f database/moscow_cards.sql
-- Equivalent a `supabase migration up` qui applique la migration mirror.
--
-- Le contenu DDL post-header doit rester byte-identique au fichier
-- supabase/migrations/ (seul l'en-tete diffère — drift = regenerer + ressync).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum moscow_bucket (mirror lib/types.ts MoscowBucket — Plan 05)
-- -----------------------------------------------------------------------------

do $$ begin
  create type public.moscow_bucket as enum (
    'must',
    'should',
    'could',
    'wont'
  );
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Table public.moscow_cards
-- -----------------------------------------------------------------------------

create table if not exists public.moscow_cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.players(id) on delete cascade,
  deliverable_template_id uuid not null references public.deliverable_templates(id) on delete cascade,
  bucket public.moscow_bucket not null,
  ord smallint not null default 0,
  feature text not null check (length(trim(feature)) >= 1 and length(feature) <= 200),
  pourquoi text not null default '' check (length(pourquoi) <= 500),
  contrainte text not null default '' check (length(contrainte) <= 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.moscow_cards is
  'Cartes Kanban MoSCoW pour le livrable #4. R3 : pas de blocage cross-mission, R2 : recommandations rubric warn-only (>=2 MUST, >=1 WONT) cote application, pas SQL.';

comment on column public.moscow_cards.bucket is
  'Colonne Kanban : must / should / could / wont. Mute via DnD client + reorderMoscowCardsFlow (plan 06).';

comment on column public.moscow_cards.ord is
  'Ordre dans la colonne bucket (0..N). Reorder via DnD persiste via UPDATE ord. Pas d''unique (project, deliverable, bucket, ord) car le swap-pair update est non-atomic en RLS.';

comment on column public.moscow_cards.contrainte is
  'Contrainte terrain levee (energie / maintenance / litteratie / connectivite / cout-ha / climat / ONSSA-ORMVA). Recommande pour MUST et SHOULD (rubric, warn-only).';

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------

create index if not exists moscow_cards_project_idx on public.moscow_cards (project_id);
create index if not exists moscow_cards_deliverable_idx on public.moscow_cards (deliverable_template_id);
create index if not exists moscow_cards_kanban_view_idx
  on public.moscow_cards (project_id, deliverable_template_id, bucket, ord);

-- -----------------------------------------------------------------------------
-- 4. Trigger updated_at (reuse public.set_updated_at)
-- -----------------------------------------------------------------------------

drop trigger if exists trg_moscow_cards_updated_at on public.moscow_cards;
create trigger trg_moscow_cards_updated_at
  before update on public.moscow_cards
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. RLS — Player CRUD ses propres cartes, Mentor lecture, GM full
-- -----------------------------------------------------------------------------

alter table public.moscow_cards enable row level security;

drop policy if exists "moscow_cards_select" on public.moscow_cards;
create policy "moscow_cards_select" on public.moscow_cards
  for select to authenticated
  using (public.is_my_player(project_id) or public.is_mentor());

drop policy if exists "moscow_cards_player_insert" on public.moscow_cards;
create policy "moscow_cards_player_insert" on public.moscow_cards
  for insert to authenticated
  with check (
    (public.is_my_player(project_id) and created_by = auth.uid())
    or public.is_game_master()
  );

drop policy if exists "moscow_cards_player_update" on public.moscow_cards;
create policy "moscow_cards_player_update" on public.moscow_cards
  for update to authenticated
  using (public.is_my_player(project_id) or public.is_game_master())
  with check (public.is_my_player(project_id) or public.is_game_master());

drop policy if exists "moscow_cards_player_delete" on public.moscow_cards;
create policy "moscow_cards_player_delete" on public.moscow_cards
  for delete to authenticated
  using (public.is_my_player(project_id) or public.is_game_master());

-- Grants explicites
grant select, insert, update, delete on public.moscow_cards to authenticated;
grant select, insert, update, delete on public.moscow_cards to service_role;

-- =============================================================================
-- End of 20260510170100_moscow_cards.sql
-- =============================================================================
