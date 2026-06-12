// Phase 14 Task 14-05-3 — mirror the 4 applied migrations into the database/
// declarative views (MANIFEST rule 4). database/** is Write/Edit-denied for
// agent tools; this script is the Omar-authorized Node-script pattern
// (authorization 2026-06-11, see 13-01 / 14-05 SUMMARYs). Idempotent: skips
// if the markers are already present. DDL only — no data backfills (those
// live in supabase/migrations/2026061112*.sql).
const fs = require("fs");

const SCHEMA = "database/schema.sql";
const RLS = "database/rls.sql";

const schemaAdd = `
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
`;

function extractRlsBlock() {
  // Slice the org-scope migration between the function definition and COMMIT —
  // that whole block is declarative (function + grants + policies).
  const mig = fs.readFileSync(
    "supabase/migrations/20260611120300_rls_org_scope.sql",
    "utf8"
  );
  const start = mig.indexOf("CREATE OR REPLACE FUNCTION public.is_in_org");
  const end = mig.indexOf("COMMIT;");
  if (start === -1 || end === -1) throw new Error("rls_org_scope markers not found");
  return mig.slice(start, end).trimEnd();
}

const rlsAdd = `
-- ============================================================================
-- Phase 14 (v0.4) — RLS org-scope (mirror of 20260611120300_rls_org_scope.sql)
-- ============================================================================

${extractRlsBlock()}
`;

let changed = [];

let schema = fs.readFileSync(SCHEMA, "utf8");
if (!schema.includes("public.organizations")) {
  fs.writeFileSync(SCHEMA, schema + schemaAdd);
  changed.push(SCHEMA);
} else {
  console.log("schema.sql already mirrored — skip");
}

let rls = fs.readFileSync(RLS, "utf8");
if (!rls.includes("is_in_org")) {
  fs.writeFileSync(RLS, rls + rlsAdd);
  changed.push(RLS);
} else {
  console.log("rls.sql already mirrored — skip");
}

console.log(changed.length ? "MIRRORED: " + changed.join(", ") : "NO-OP");
