-- Entrepreneur Game - Phase 1 schema
-- Apply order: schema.sql -> triggers.sql -> rls.sql
-- Operator note (D-01): on a fresh Supabase project, run once before this file:
--   drop schema public cascade;
--   create schema public;
--   grant usage on schema public to anon, authenticated, service_role;
-- See database/README.md.

create extension if not exists "pgcrypto";

-- ============================================================================
-- Enums (mirror lib/types.ts)
-- ============================================================================

create type public.app_role as enum ('player', 'mentor', 'game_master');

create type public.player_status as enum ('active', 'eliminated', 'completed');

create type public.team_role as enum ('owner', 'co_founder', 'contributor');

create type public.level_id as enum (
  'L0_diagnostic',
  'L1_problem',
  'L2_solution',
  'L3_market',
  'L4_business_model',
  'L5_pitch',
  'L6_traction',
  'L7_alumni'
);

create type public.mission_kind as enum (
  'atelier',
  'session',
  'presentation',
  'pitch',
  'admin'
);

create type public.submission_kind as enum ('proof_url', 'proof_text');

create type public.submission_status as enum (
  'draft',
  'submitted_v1',
  'feedback_received',
  'submitted_v2',
  'validated',
  'rejected'
);

create type public.verdict as enum (
  'validate_v1',
  'request_v2',
  'validate_v2',
  'reject'
);

-- ============================================================================
-- Tables (in dependency order)
-- ============================================================================

-- events: a Hack-Days instance (multi-event ready S3)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  results_published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.events is 'A Hack-Days / pilot event instance (S3 multi-event ready).';

-- levels: 0..7 enum-keyed reference table
create table public.levels (
  id public.level_id primary key,
  ord smallint not null,
  label text not null,
  description text not null
);
comment on table public.levels is 'Reference table for the 8 levels (L0..L7).';

-- missions: unit of work for a given event
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  level_id public.level_id not null references public.levels(id) on delete restrict,
  ord smallint not null,
  kind public.mission_kind not null,
  title text not null,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, level_id, ord)
);
comment on table public.missions is 'A unit of work (atelier, session, pitch, ...) for an event.';

-- deliverable_templates: a deliverable expected from a mission
create table public.deliverable_templates (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  rubric jsonb not null default '[]'::jsonb,
  max_score int not null default 100,
  ord smallint not null default 0,
  is_bonus boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, slug)
);
comment on table public.deliverable_templates is 'Template for an expected deliverable from a mission (with rubric).';
comment on column public.deliverable_templates.is_bonus is 'Visual "Bonus" badge for the Player UI (label only — does NOT affect scoring or gating). Polish v3 2026-05-12.';

-- cohorts: a cohort scoped to an event
create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, slug)
);
comment on table public.cohorts is 'A cohort of players within an event.';

-- profiles: app_role per auth user
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_role public.app_role not null default 'player',
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Per-user app role (player / mentor / game_master).';

-- players: 1 row per team (renamed from startups)
create table public.players (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete restrict,
  slug text not null unique,
  name text not null,
  idea text,
  current_level public.level_id not null default 'L0_diagnostic',
  status public.player_status not null default 'active',
  score_project numeric(6,2) not null default 0,
  score_engagement numeric(6,2) not null default 0,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.players is 'A team / player participating in the pilot.';

-- player_members: a user belongs to a player (team)
create table public.player_members (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'player',
  team_role public.team_role not null default 'contributor',
  joined_at timestamptz not null default now(),
  unique (player_id, user_id)
);
comment on table public.player_members is 'Membership of an auth user inside a player team.';

-- submissions: V1/V2 per (player, deliverable_template)
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  deliverable_template_id uuid not null references public.deliverable_templates(id) on delete restrict,
  version smallint not null check (version in (1, 2)),
  kind public.submission_kind not null,
  proof_url text,
  proof_text text,
  status public.submission_status not null default 'submitted_v1',
  submitted_by uuid not null references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  unique (player_id, deliverable_template_id, version),
  check (
    (kind = 'proof_url' and proof_url is not null and proof_text is null)
    or (kind = 'proof_text' and proof_text is not null and proof_url is null)
  )
);
comment on table public.submissions is 'Proof-of-work submission for a deliverable, versioned V1/V2.';

-- evaluations: 1 per (mentor, submission)
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  evaluator_id uuid not null references auth.users(id) on delete restrict,
  scores jsonb not null default '{}'::jsonb,
  total_score numeric(6,2) not null default 0,
  feedback text not null default '',
  verdict public.verdict not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, evaluator_id)
);
comment on table public.evaluations is 'Mentor evaluation for a submission (rubric scores + feedback + verdict).';

-- pitch_scores: jury scoring day 2 (5 criteria x 20 each = 100)
create table public.pitch_scores (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  player_id uuid not null references public.players(id) on delete cascade,
  juror_id uuid not null references auth.users(id) on delete restrict,
  c1 smallint not null check (c1 between 0 and 20),
  c2 smallint not null check (c2 between 0 and 20),
  c3 smallint not null check (c3 between 0 and 20),
  c4 smallint not null check (c4 between 0 and 20),
  c5 smallint not null check (c5 between 0 and 20),
  total_score smallint generated always as (c1 + c2 + c3 + c4 + c5) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, player_id, juror_id)
);
comment on table public.pitch_scores is 'Jury pitch scores day 2 (5 criteria x 20 each).';

-- ============================================================================
-- Indexes (hot FKs)
-- ============================================================================

create index on public.missions (event_id, level_id);
create index on public.deliverable_templates (mission_id);
create index on public.cohorts (event_id);
create index on public.players (cohort_id);
create index on public.player_members (player_id);
create index on public.player_members (user_id);
create index on public.submissions (player_id);
create index on public.submissions (deliverable_template_id);
create index on public.evaluations (submission_id);
create index on public.evaluations (evaluator_id);
create index on public.pitch_scores (event_id, player_id);
create index on public.pitch_scores (juror_id);

-- ============================================================================
-- Phase 14 (v0.4 Scale Foundation) — multi-tenant + niveaux data-driven
-- Mirror of supabase/migrations/20260611120000/120100/120200 (DDL only,
-- backfills live in the migrations). Applied to PROD 2026-06-11.
-- ============================================================================

create table if not exists public.organizations (
  id         uuid        primary key default gen_random_uuid(),
  slug       text        not null unique,
  name       text        not null,
  created_at timestamptz not null default now()
);

comment on table public.organizations is 'Top-level tenant: an organization (e.g. EIC/UEMF) that owns multiple events.';

grant select on public.organizations to authenticated;
grant insert, update on public.organizations to authenticated;

alter table public.organizations enable row level security;

alter table public.events
  add column if not exists organization_id uuid references public.organizations(id);

create index if not exists idx_events_organization
  on public.events(organization_id);

alter table public.events
  add column if not exists is_active boolean not null default false;

comment on column public.events.is_active is 'Exactly one event should be true at a time. Replaces the order by starts_at desc limit 1 convention (TENANT-03).';

create unique index if not exists uniq_events_single_active
  on public.events ((is_active))
  where is_active;

create index if not exists idx_events_is_active
  on public.events(is_active)
  where is_active;

create table if not exists public.levels_v2 (
  id text primary key,
  ord smallint not null,
  label text not null,
  description text not null default ''
);

comment on table public.levels_v2 is 'Data-driven levels table (text PK). Parallel to the enum-keyed public.levels; the TS data layer reads this table. Level IDs (L0_diagnostic..L7_alumni) are identical. Physical enum removal deferred post-July 2026.';

grant select on public.levels_v2 to authenticated;
grant insert, update on public.levels_v2 to authenticated;

alter table public.levels_v2 enable row level security;

alter table public.missions
  add column if not exists level_id_text text references public.levels_v2(id);

alter table public.players
  add column if not exists current_level_text text references public.levels_v2(id);

create index if not exists idx_missions_level_text
  on public.missions(level_id_text);

create index if not exists idx_players_current_level_text
  on public.players(current_level_text);

-- ============================================================================
-- Phase 15-16 (v0.4) — mission engine columns + jury paramétrable + settings
-- Mirror DDL of supabase/migrations/20260611230000/240000/240100 (applied to
-- PROD 2026-06-12). Backfills live in the migrations.
-- ============================================================================

alter table public.deliverable_templates
  add column if not exists composer_kind text not null default 'simple'
    check (composer_kind in ('simple','moscow','multi_url')),
  add column if not exists template_url text,
  add column if not exists auto_validate boolean not null default false,
  add column if not exists soft_recommends_before uuid references public.deliverable_templates(id),
  add column if not exists validation_rules jsonb not null default '[]'::jsonb;

-- R2 structurel : warn-only (jsonb_path_exists — function, CHECK-compatible)
-- + auto_validate réservé aux composer multi_url (review CR-02).
-- Voir 20260611230000 pour les définitions exactes des contraintes
-- validation_rules_severity_warn_only et auto_validate_multi_url_only.

create table if not exists public.pitch_criteria (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  key text not null,
  label text not null,
  max smallint not null check (max between 1 and 100),
  ord smallint not null default 0,
  unique (event_id, key)
);

alter table public.pitch_criteria enable row level security;
grant select on public.pitch_criteria to authenticated;
grant insert, update, delete on public.pitch_criteria to authenticated;

alter table public.pitch_scores
  add column if not exists scores jsonb
    check (scores is null or jsonb_typeof(scores) = 'object');

create table if not exists public.event_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  xp_first_submission integer not null default 100,
  xp_validate_v1 integer not null default 50,
  xp_validate_v2 integer not null default 100,
  eng_submitted integer not null default 100,
  eng_reviewed integer not null default 25,
  eng_validated integer not null default 50,
  pitch_weight numeric not null default 0.8 check (pitch_weight between 0 and 1),
  bonus_multiplier_cap numeric not null default 3.0 check (bonus_multiplier_cap >= 1.0),
  updated_at timestamptz not null default now()
);

alter table public.event_settings enable row level security;
grant select on public.event_settings to authenticated;
grant insert, update on public.event_settings to authenticated;
