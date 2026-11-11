// scripts/perf-seed-500.mjs
// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/perf-seed-500.mjs <count> [--cleanup]
//
// DEFAULT TARGET: a DISPOSABLE Supabase project.
//   Running on PROD off-event is an operator decision — run --cleanup afterward.
//   See docs/OBSERVABILITY.md "Perf (QUAL-06)" for the full runbook.
//
// Arguments:
//   <count>    Number of synthetic users to create (e.g. 500). Required unless --cleanup.
//   --cleanup  Delete all synthetic rows (by perf-seed marker). No <count> needed.
//
// Env required:
//   NEXT_PUBLIC_SUPABASE_URL     Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY    Service-role key (bypasses RLS; needed to create auth.users)
//
// Synthetic marker:
//   org slug   = 'perf-seed-org'
//   event slug = 'perf-seed-event'
//   email      = 'perf-seed-player-NNNN@perf-seed.invalid'
//   player slug= 'perf-seed-player-NNNN'

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
  );
  console.error(
    "Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/perf-seed-500.mjs <count>"
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const isCleanup = args.includes("--cleanup");

if (!isCleanup) {
  const countArg = args[0];
  if (!countArg || isNaN(Number(countArg)) || Number(countArg) < 1) {
    console.error(
      "Usage: node scripts/perf-seed-500.mjs <count> [--cleanup]"
    );
    console.error("  <count> must be a positive integer (e.g. 500)");
    process.exit(2);
  }
}

const TARGET_COUNT = isCleanup ? 0 : Number(args[0]);

// Fixed UUIDs for the seed container (deterministic, easy to identify)
const ORG_ID = "00000000-perf-0000-0000-seed000000000";
const EVENT_ID = "00000000-perf-0001-0000-seed000000000";
const COHORT_ID = "00000000-perf-0002-0000-seed000000000";
const MISSION_ID = "00000000-perf-0003-0000-seed000000000";
const TEMPLATE_ID = "00000000-perf-0004-0000-seed000000000";

function padded(i) {
  return String(i).padStart(4, "0");
}

function playerId(i) {
  return `00000000-${padded(i)}-perf-0000-seed000000000`;
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================================
// CLEANUP path
// ============================================================================
async function runCleanup() {
  console.log("[perf-seed] Starting cleanup (deleting all perf-seed rows)...");

  // 1. submissions keyed by deliverable_template_id
  const { error: subErr } = await sb
    .from("submissions")
    .delete()
    .eq("deliverable_template_id", TEMPLATE_ID);
  if (subErr) console.warn("[perf-seed] submissions delete:", subErr.message);
  else console.log("[perf-seed] submissions: deleted");

  // 2. player_members for perf-seed players
  const { data: players } = await sb
    .from("players")
    .select("id")
    .like("slug", "perf-seed-player-%");
  const playerIds = (players ?? []).map((p) => p.id);
  if (playerIds.length > 0) {
    const { error: pmErr } = await sb
      .from("player_members")
      .delete()
      .in("player_id", playerIds);
    if (pmErr) console.warn("[perf-seed] player_members delete:", pmErr.message);
    else console.log(`[perf-seed] player_members: deleted (${playerIds.length} teams)`);
  }

  // 3. profiles by email domain
  const { error: profErr } = await sb
    .from("profiles")
    .delete()
    .like("email", "%@perf-seed.invalid");
  if (profErr) console.warn("[perf-seed] profiles delete:", profErr.message);
  else console.log("[perf-seed] profiles: deleted");

  // 4. auth.users by email domain — requires service role admin API
  let authDeleted = 0;
  let authPage = 1;
  while (true) {
    const { data: usersPage, error: listErr } = await sb.auth.admin.listUsers({
      page: authPage,
      perPage: 1000,
    });
    if (listErr || !usersPage?.users?.length) break;
    const perfUsers = usersPage.users.filter((u) =>
      u.email?.endsWith("@perf-seed.invalid")
    );
    for (const u of perfUsers) {
      const { error: delErr } = await sb.auth.admin.deleteUser(u.id);
      if (delErr) console.warn(`[perf-seed] auth.users delete ${u.email}:`, delErr.message);
      else authDeleted++;
    }
    if (usersPage.users.length < 1000) break;
    authPage++;
  }
  console.log(`[perf-seed] auth.users: deleted ${authDeleted}`);

  // 5. players
  const { error: plErr } = await sb
    .from("players")
    .delete()
    .like("slug", "perf-seed-player-%");
  if (plErr) console.warn("[perf-seed] players delete:", plErr.message);
  else console.log("[perf-seed] players: deleted");

  // 6. deliverable_templates
  const { error: dtErr } = await sb
    .from("deliverable_templates")
    .delete()
    .eq("id", TEMPLATE_ID);
  if (dtErr) console.warn("[perf-seed] deliverable_templates delete:", dtErr.message);
  else console.log("[perf-seed] deliverable_templates: deleted");

  // 7. missions
  const { error: mErr } = await sb
    .from("missions")
    .delete()
    .eq("id", MISSION_ID);
  if (mErr) console.warn("[perf-seed] missions delete:", mErr.message);
  else console.log("[perf-seed] missions: deleted");

  // 8. cohort
  const { error: cErr } = await sb
    .from("cohorts")
    .delete()
    .eq("id", COHORT_ID);
  if (cErr) console.warn("[perf-seed] cohorts delete:", cErr.message);
  else console.log("[perf-seed] cohorts: deleted");

  // 9. event
  const { error: evErr } = await sb
    .from("events")
    .delete()
    .eq("id", EVENT_ID);
  if (evErr) console.warn("[perf-seed] events delete:", evErr.message);
  else console.log("[perf-seed] events: deleted");

  // 10. organization
  const { error: orgErr } = await sb
    .from("organizations")
    .delete()
    .eq("id", ORG_ID);
  if (orgErr) console.warn("[perf-seed] organizations delete:", orgErr.message);
  else console.log("[perf-seed] organizations: deleted");

  console.log("[perf-seed] Cleanup complete.");
}

// ============================================================================
// SEED path
// ============================================================================
async function runSeed(count) {
  console.log(`[perf-seed] Seeding ${count} synthetic users on ${url} ...`);
  console.log("[perf-seed] Target: DISPOSABLE project (default). Verify before running on PROD.");

  // 1. Organization
  const { error: orgErr } = await sb.from("organizations").upsert(
    { id: ORG_ID, slug: "perf-seed-org", name: "Perf Seed Organization" },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (orgErr) console.warn("[perf-seed] org upsert:", orgErr.message);

  // 2. Event (is_active=false to never shadow live event)
  const { error: evErr } = await sb.from("events").upsert(
    {
      id: EVENT_ID,
      slug: "perf-seed-event",
      name: "Perf Seed Event",
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      organization_id: ORG_ID,
      is_active: false,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (evErr) console.warn("[perf-seed] event upsert:", evErr.message);

  // 3. Cohort
  const { error: cohErr } = await sb.from("cohorts").upsert(
    { id: COHORT_ID, event_id: EVENT_ID, slug: "perf-seed-cohort", name: "Perf Seed Cohort" },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (cohErr) console.warn("[perf-seed] cohort upsert:", cohErr.message);

  // 4. Mission
  const { error: mErr } = await sb.from("missions").upsert(
    {
      id: MISSION_ID,
      event_id: EVENT_ID,
      level_id: "L1_problem",
      ord: 1,
      kind: "atelier",
      title: "Perf Seed Mission",
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (mErr) console.warn("[perf-seed] mission upsert:", mErr.message);

  // 5. DeliverableTemplate
  const { error: dtErr } = await sb.from("deliverable_templates").upsert(
    {
      id: TEMPLATE_ID,
      mission_id: MISSION_ID,
      slug: "perf-seed-deliverable",
      title: "Perf Seed Deliverable",
      description: "Synthetic deliverable for load testing",
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (dtErr) console.warn("[perf-seed] deliverable_template upsert:", dtErr.message);

  // 6. Batch-create auth.users + players + player_members
  const BATCH = 20;
  let created = 0;
  let skipped = 0;

  for (let start = 1; start <= count; start += BATCH) {
    const end = Math.min(start + BATCH - 1, count);
    const batchPromises = [];

    for (let i = start; i <= end; i++) {
      const email = `perf-seed-player-${padded(i)}@perf-seed.invalid`;
      const pwd = `perf-seed-${padded(i)}-password`;
      batchPromises.push(
        (async () => {
          // Create auth user (service role)
          const { data: authData, error: authErr } = await sb.auth.admin.createUser({
            email,
            password: pwd,
            email_confirm: true,
          });
          if (authErr) {
            if (authErr.message?.includes("already registered") || authErr.message?.includes("already exists")) {
              skipped++;
              return;
            }
            console.warn(`[perf-seed] auth user ${email}:`, authErr.message);
            return;
          }
          const userId = authData.user?.id;
          if (!userId) return;

          // Profile
          await sb.from("profiles").upsert(
            {
              user_id: userId,
              app_role: "player",
              full_name: `Perf Player ${i}`,
              email,
            },
            { onConflict: "user_id", ignoreDuplicates: true }
          );

          // Player (team)
          const pid = playerId(i);
          await sb.from("players").upsert(
            {
              id: pid,
              cohort_id: COHORT_ID,
              slug: `perf-seed-player-${padded(i)}`,
              name: `Perf Player ${i}`,
              current_level: "L1_problem",
            },
            { onConflict: "id", ignoreDuplicates: true }
          );

          // Membership
          await sb.from("player_members").upsert(
            {
              player_id: pid,
              user_id: userId,
              role: "player",
              team_role: "owner",
            },
            { onConflict: "player_id,user_id", ignoreDuplicates: true }
          );

          // Submission V1
          await sb.from("submissions").upsert(
            {
              player_id: pid,
              deliverable_template_id: TEMPLATE_ID,
              version: 1,
              kind: "proof_url",
              proof_url: `https://example.com/perf-seed-proof-${padded(i)}`,
              status: "submitted_v1",
              submitted_by: userId,
            },
            { onConflict: "player_id,deliverable_template_id,version", ignoreDuplicates: true }
          );

          created++;
        })()
      );
    }

    await Promise.all(batchPromises);
    process.stdout.write(
      `\r[perf-seed] Progress: ${Math.min(end, count)}/${count} (created=${created} skipped=${skipped})`
    );
  }

  console.log();
  const summary = [
    {
      target_count: count,
      created,
      skipped,
      org_id: ORG_ID,
      event_slug: "perf-seed-event",
      email_domain: "@perf-seed.invalid",
      cleanup_cmd: "node scripts/perf-seed-500.mjs --cleanup",
    },
  ];
  console.table(summary);
  console.log("[perf-seed] Done. Run --cleanup when finished with the perf test.");
}

// ============================================================================
// Entrypoint
// ============================================================================
if (isCleanup) {
  await runCleanup();
} else {
  await runSeed(TARGET_COUNT);
}
