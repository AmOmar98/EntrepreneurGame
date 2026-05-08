create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists pg_stat_statements;

create type app_role as enum (
  'founder', 'builder', 'researcher', 'mentor',
  'reviewer', 'committee_member', 'eic_admin'
);

create type submission_status as enum (
  'draft', 'submitted', 'in_review', 'needs_changes',
  'validated', 'rejected'
);

create type project_stage as enum (
  'L0_diagnostic', 'L1_problem', 'L2_solution',
  'L3_traction', 'L4_committee', 'L5_alumni'
);

create type checkpoint_band as enum ('make_it', 'sell_it', 'look_after_it');
create type maturity_phase as enum ('ideation', 'pre_incubation', 'incubation');
create type deliverable_status as enum ('draft', 'submitted', 'reviewed', 'needs_changes', 'accepted');
create type bonus_status as enum ('submitted', 'needs_changes', 'accepted', 'rejected');
create type bonus_type as enum (
  'prospect_interviews', 'waitlist', 'demo_ready', 'first_sale',
  'additional_sales', 'pilot_commitment', 'retention_followup'
);
create type xp_state as enum ('pending', 'confirmed', 'prestige');
create type founder_kyc_status as enum ('missing', 'partial', 'complete', 'verified');
create type project_holder_type as enum ('student', 'researcher', 'alumni', 'external');
create type bootcamp_day as enum ('day_1', 'day_2', 'day_3');
create type bootcamp_deliverable_kind as enum ('session', 'atelier', 'presentation', 'pitch', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  language text default 'fr' check (language in ('fr','en','ar')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role app_role not null,
  primary key (user_id, role)
);

create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  cohort text not null,
  summary text default '',
  sector text default '',
  maturity_phase maturity_phase not null default 'ideation',
  checkpoint_focus checkpoint_band not null default 'make_it',
  stage project_stage not null default 'L0_diagnostic',
  total_xp int not null default 0,
  status text not null default 'active' check (status in ('active','paused','dropped','graduated')),
  health_status text not null default 'watch' check (health_status in ('strong','watch','blocked')),
  next_action text default '',
  coach_notes text default '',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_committee_ready boolean generated always as (
    stage = 'L3_traction' and total_xp >= 600
  ) stored
);

create table public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role_in_project text not null check (role_in_project in ('owner','co_founder','contributor')),
  added_at timestamptz default now(),
  primary key (project_id, user_id)
);

create table public.founder_kyc (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar_url text,
  phone text not null,
  cin_or_passport text not null,
  school_or_org text not null,
  role_title text not null,
  status founder_kyc_status not null default 'partial',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.project_holder_kyc (
  project_id uuid primary key references public.projects(id) on delete cascade,
  logo_url text not null check (logo_url ~ '^https://'),
  legal_name text not null,
  project_holder_type project_holder_type not null default 'student',
  idea_one_liner text not null,
  problem_statement text not null,
  target_customer text not null,
  status founder_kyc_status not null default 'partial',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.bootcamp_deliverables (
  id text primary key,
  day bootcamp_day not null,
  start_time text not null,
  end_time text not null,
  duration text not null,
  title text not null,
  objective text not null,
  expected_output text not null,
  checkpoint checkpoint_band not null,
  stage project_stage not null,
  kind bootcamp_deliverable_kind not null,
  xp int not null default 0 check (xp between 0 and 500),
  is_active boolean not null default true,
  is_required boolean not null default true,
  game_master_note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.missions (
  id text primary key,
  level project_stage not null,
  title text not null,
  description text not null,
  xp int not null,
  rubric jsonb not null,
  evidence_required jsonb not null,
  estimated_hours numeric,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.submissions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  mission_id text not null references public.missions(id),
  submitted_by uuid not null references auth.users(id),
  status submission_status not null default 'draft',
  payload jsonb not null default '{}'::jsonb,
  score numeric,
  reviewer_notes text,
  reviewed_by uuid references auth.users(id),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id, mission_id)
);

create table public.evidence (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes <= 52428800),
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz default now()
);

create table public.coach_assignments (
  project_id uuid references public.projects(id) on delete cascade,
  coach_id uuid references auth.users(id) on delete cascade,
  assigned_at timestamptz default now(),
  primary key (project_id, coach_id)
);

create table public.deliverables (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null,
  doc_url text not null check (doc_url ~ '^https://'),
  status deliverable_status not null default 'submitted',
  checkpoint checkpoint_band not null,
  stage project_stage not null,
  pending_xp int not null default 10,
  base_xp int not null check (base_xp between 25 and 150),
  submitted_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  updated_at timestamptz default now(),
  review_notes text,
  mailto_opened_at timestamptz
);

create table public.bonus_events (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  bonus_type bonus_type not null,
  title text not null,
  proof_url text not null check (proof_url ~ '^https://'),
  quantity int not null default 1 check (quantity > 0),
  claimed_xp int not null,
  awarded_xp int not null default 0,
  counts_toward_stage int not null default 0,
  prestige_xp int not null default 0,
  status bonus_status not null default 'submitted',
  checkpoint checkpoint_band not null default 'sell_it',
  stage project_stage not null,
  submitted_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  updated_at timestamptz default now(),
  review_notes text,
  mailto_opened_at timestamptz
);

create table public.xp_ledger (
  id bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete set null,
  source_type text not null default 'submission',
  source_id text,
  xp_state xp_state not null default 'confirmed',
  checkpoint checkpoint_band,
  counts_toward_stage boolean not null default true,
  delta int not null,
  reason text not null,
  created_at timestamptz default now()
);

create table public.startup_activity (
  id bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  actor uuid references auth.users(id),
  action text not null,
  checkpoint checkpoint_band,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table public.committees (
  id uuid primary key default uuid_generate_v4(),
  cohort text not null,
  scheduled_at timestamptz not null,
  location text,
  status text default 'planned' check (status in ('planned','in_progress','done','cancelled')),
  created_at timestamptz default now()
);

create table public.committee_dossiers (
  committee_id uuid references public.committees(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  decision text check (decision in ('go','no_go','conditional','deferred')),
  decision_notes text,
  decided_at timestamptz,
  primary key (committee_id, project_id)
);

create table public.audit_log (
  id bigserial primary key,
  actor uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  diff jsonb,
  occurred_at timestamptz default now()
);
