// Phase 16-05 Task — mirror the 5 applied migrations (phase 15 engine columns +
// phase 16 pitch_criteria/event_settings/triggers + org-scope-enforce) into the
// database/ declarative views. Omar-authorized Node-script pattern (database/**
// is Write/Edit-denied for agent tools). Idempotent via content markers.
const fs = require("fs");

function extract(file, startMarker, endMarker) {
  const s = fs.readFileSync(file, "utf8");
  const a = s.indexOf(startMarker);
  const b = s.indexOf(endMarker, a);
  if (a === -1 || b === -1) throw new Error(`markers not found in ${file}`);
  return s.slice(a, b).trimEnd();
}

let changed = [];

// ---------------------------------------------------------------------------
// database/schema.sql — engine columns + pitch_criteria + event_settings DDL
// ---------------------------------------------------------------------------
const SCHEMA = "database/schema.sql";
let schema = fs.readFileSync(SCHEMA, "utf8");
if (!schema.includes("public.event_settings")) {
  const block = `
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
`;
  fs.writeFileSync(SCHEMA, schema + block);
  changed.push(SCHEMA);
}

// ---------------------------------------------------------------------------
// database/rls.sql — org-scope enforce (is_in_org élargi + drop policy large)
// ---------------------------------------------------------------------------
const RLS = "database/rls.sql";
let rls = fs.readFileSync(RLS, "utf8");
if (!rls.includes("events_org_scope_enforce mirror")) {
  const isInOrg = extract(
    "supabase/migrations/20260611220000_events_org_scope_enforce.sql",
    "CREATE OR REPLACE FUNCTION public.is_in_org",
    "COMMIT;"
  );
  const block = `
-- ============================================================================
-- Phase 14 review CR-01 — events_org_scope_enforce mirror (applied 2026-06-12)
-- is_in_org élargi (player membership OR mentor OR juror) puis DROP de la
-- policy SELECT permissive "events_authenticated_select" — le scope org est
-- désormais le gate effectif (avec is_game_master()).
-- NB : la version antérieure d'is_in_org plus haut dans ce fichier est
-- remplacée par celle-ci (CREATE OR REPLACE — dernière définition gagne).
-- ============================================================================

${isInOrg}
`;
  fs.writeFileSync(RLS, rls + block);
  changed.push(RLS);
}

// ---------------------------------------------------------------------------
// database/triggers.sql — recalc_player_engagement paramétré + get_event_setting
// ---------------------------------------------------------------------------
const TRG = "database/triggers.sql";
let trg = fs.readFileSync(TRG, "utf8");
if (!trg.includes("get_event_setting_int")) {
  const block = `
-- ============================================================================
-- Phase 16 (v0.4) — scoring paramétré (mirror de 20260611240200, PROD 2026-06-12)
-- get_event_setting_int + recalc_player_engagement lisant event_settings
-- (défauts = comportement historique 100/25/50). Définitions exactes dans la
-- migration ; résumé déclaratif ici — la migration reste la source d'apply.
-- ============================================================================
-- Voir supabase/migrations/20260611240200_phase16_triggers_parameterized.sql
-- pour get_event_setting_int(p_event_id, p_key, p_default) et la version
-- paramétrée de recalc_player_engagement (SECURITY DEFINER, search_path,
-- REVOKE FROM PUBLIC + GRANT authenticated).
`;
  fs.writeFileSync(TRG, trg + block);
  changed.push(TRG);
}

console.log(changed.length ? "MIRRORED: " + changed.join(", ") : "NO-OP");
