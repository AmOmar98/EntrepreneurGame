// One-shot script to create 3 test accounts for smoke-tester agent.
// Run via: node smoketest/scripts/create-test-accounts.cjs
//
// Creates (idempotent — re-run safe):
//   - Player  : claude-smoke-player@smoke.entrepreneurgame.local
//   - Mentor  : claude-smoke-mentor@smoke.entrepreneurgame.local
//   - Master  : claude-smoke-master@smoke.entrepreneurgame.local
//
// Plus 1 test team "Smoke Test Team" linked to cohorte-mai-2026, with the Player
// auth user attached via player_members.
//
// Outputs the credentials to stdout — caller is expected to redirect to a
// gitignored file (smoketest/TEST-ACCOUNTS.local.md).

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Read env from .env.local (codebase convention)
const envPath = path.resolve(__dirname, "../../.env.local");
const env = fs.readFileSync(envPath, "utf8")
  .split(/\r?\n/)
  .reduce((acc, line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) acc[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
    return acc;
  }, {});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Generate stable but non-trivial passwords (16 chars alpha-num)
function genPassword(label) {
  // Deterministic but specific to label so we can re-run the script
  // and recover the same password (idempotent).
  const seed = `smoke-${label}-2026-05-10-entrepreneurgame`;
  // Simple stable hash → base36 (not cryptographic, just unique-enough for test)
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const base = Math.abs(h).toString(36).padStart(8, "0");
  return `Smoke!${label[0].toUpperCase()}${base}2026`;
}

const ACCOUNTS = [
  {
    label: "player",
    email: "claude-smoke-player@smoke.entrepreneurgame.local",
    full_name: "Claude Smoke Player",
    app_role: "player",
  },
  {
    label: "mentor",
    email: "claude-smoke-mentor@smoke.entrepreneurgame.local",
    full_name: "Claude Smoke Mentor",
    app_role: "mentor",
  },
  {
    label: "master",
    email: "claude-smoke-master@smoke.entrepreneurgame.local",
    full_name: "Claude Smoke Master",
    app_role: "game_master",
  },
];

const PLAYER_TEAM = {
  slug: "smoke-test-team",
  name: "Smoke Test Team",
  idea: "Smoke testing automation — synthetic team for E2E validation",
};

async function findOrCreateUser(account) {
  // Try to find existing user by email (admin.listUsers paginates, scan)
  let page = 1;
  let found = null;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    found = data.users.find((u) => u.email === account.email);
    if (found) break;
    if (data.users.length < 200) break;
    page += 1;
  }
  const password = genPassword(account.label);
  if (found) {
    // Update password to the deterministic value (idempotency)
    await supabase.auth.admin.updateUserById(found.id, { password, email_confirm: true });
    return { user: found, password, created: false };
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: account.full_name, source: "smoke-tester-260510" },
  });
  if (error) throw new Error(`createUser ${account.email}: ${error.message}`);
  return { user: data.user, password, created: true };
}

async function upsertProfile(user, account) {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        app_role: account.app_role,
        full_name: account.full_name,
        email: account.email,
      },
      { onConflict: "user_id" }
    );
  if (error) throw new Error(`upsert profile ${account.email}: ${error.message}`);
}

async function ensurePlayerTeam(playerUserId) {
  // Resolve cohort_id for cohorte-mai-2026
  const { data: cohort, error: cohortErr } = await supabase
    .from("cohorts")
    .select("id")
    .eq("slug", "cohorte-mai-2026")
    .maybeSingle();
  if (cohortErr) throw new Error(`cohort lookup: ${cohortErr.message}`);
  if (!cohort) throw new Error("cohort cohorte-mai-2026 not found — apply seed_event_hackdays.sql first");

  // Upsert player team
  const { data: existing } = await supabase
    .from("players")
    .select("id, slug")
    .eq("slug", PLAYER_TEAM.slug)
    .maybeSingle();
  let playerId;
  if (existing) {
    playerId = existing.id;
  } else {
    const { data, error } = await supabase
      .from("players")
      .insert({
        cohort_id: cohort.id,
        slug: PLAYER_TEAM.slug,
        name: PLAYER_TEAM.name,
        idea: PLAYER_TEAM.idea,
        current_level: "L0_diagnostic",
        status: "active",
      })
      .select("id")
      .single();
    if (error) throw new Error(`insert player team: ${error.message}`);
    playerId = data.id;
  }

  // Link Player auth user via player_members (idempotent — UPSERT)
  const { data: existingLink } = await supabase
    .from("player_members")
    .select("id")
    .eq("player_id", playerId)
    .eq("user_id", playerUserId)
    .maybeSingle();
  if (!existingLink) {
    const { error } = await supabase
      .from("player_members")
      .insert({
        player_id: playerId,
        user_id: playerUserId,
        role: "player",
        team_role: "contributor",
      });
    if (error) throw new Error(`link player_members: ${error.message}`);
  }
  return playerId;
}

(async () => {
  const results = [];
  for (const account of ACCOUNTS) {
    const { user, password, created } = await findOrCreateUser(account);
    await upsertProfile(user, account);
    results.push({ ...account, user_id: user.id, password, created });
  }

  // Link the Player to a team
  const playerResult = results.find((r) => r.label === "player");
  const teamId = await ensurePlayerTeam(playerResult.user_id);

  // Output as JSON for easy parsing by caller
  console.log(JSON.stringify({
    accounts: results.map((r) => ({
      label: r.label,
      email: r.email,
      password: r.password,
      app_role: r.app_role,
      user_id: r.user_id,
      created: r.created,
    })),
    team: { slug: PLAYER_TEAM.slug, name: PLAYER_TEAM.name, id: teamId },
  }, null, 2));
})().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
