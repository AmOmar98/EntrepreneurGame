// Provision the AgreenTech 2026 cohort (11 porteurs + 2 mentors) on Supabase prod.
// Reads cohorte-agreentech-creds.csv at repo root.
// Idempotent — re-run safe. Uses Supabase admin API + service role key.
//
// Usage:
//   node scripts/provision-agreentech-cohort.cjs
//
// Or via npm script:
//   npm run provision:cohort
//
// Prerequisites:
//   - .env.local must define NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//   - database/seed_event_hackdays.sql must already be applied (cohorte-mai-2026 must exist)
//
// Effect (per row in CSV):
//   * auth.users created (or password updated if existing) with email_confirm: true
//   * public.profiles upserted with app_role from CSV
//   * For app_role=player only:
//       - public.players row created (slug=p01..p11, name=holder_name, idea=idea_seed)
//       - public.player_members row linking auth user to player as team_role=owner
//   * For app_role=mentor: only auth.user + profile (no team membership)
//
// Output: JSON to stdout with user_ids + player_ids for downstream agent dispatch.

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(REPO_ROOT, "cohorte-agreentech-creds.csv");
const ENV_PATH = path.join(REPO_ROOT, ".env.local");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`Missing .env.local at ${ENV_PATH}`);
  }
  return fs.readFileSync(ENV_PATH, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) acc[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
      return acc;
    }, {});
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === "\"") inQuotes = !inQuotes;
      else if (c === "," && !inQuotes) {
        cells.push(cur);
        cur = "";
      } else cur += c;
    }
    cells.push(cur);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (cells[i] || "").trim()]));
  });
}

async function findUserByEmail(supabase, email) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function findOrCreateUser(supabase, row) {
  const existing = await findUserByEmail(supabase, row.email);
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: row.password,
      email_confirm: true,
    });
    if (error) throw new Error(`updateUser ${row.email}: ${error.message}`);
    return { user: existing, created: false };
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: row.email,
    password: row.password,
    email_confirm: true,
    user_metadata: {
      full_name: row.holder_name,
      project_code: row.project_code,
      city: row.city,
      source: "agreentech-2026-bulk-provision",
    },
  });
  if (error) throw new Error(`createUser ${row.email}: ${error.message}`);
  return { user: data.user, created: true };
}

async function upsertProfile(supabase, user, row) {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        app_role: row.app_role,
        full_name: row.holder_name,
        email: row.email,
      },
      { onConflict: "user_id" }
    );
  if (error) throw new Error(`upsertProfile ${row.email}: ${error.message}`);
}

async function ensurePlayerTeam(supabase, user, row, cohortId) {
  const slug = row.project_code.toLowerCase();
  const { data: existing } = await supabase
    .from("players")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  let playerId;
  if (existing) {
    playerId = existing.id;
    await supabase
      .from("players")
      .update({ name: row.holder_name, idea: row.idea_seed })
      .eq("id", playerId);
  } else {
    const { data, error } = await supabase
      .from("players")
      .insert({
        cohort_id: cohortId,
        slug,
        name: row.holder_name,
        idea: row.idea_seed,
        current_level: "L0_diagnostic",
        status: "active",
      })
      .select("id")
      .single();
    if (error) throw new Error(`insert player ${slug}: ${error.message}`);
    playerId = data.id;
  }

  const { data: link } = await supabase
    .from("player_members")
    .select("id")
    .eq("player_id", playerId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!link) {
    const { error } = await supabase
      .from("player_members")
      .insert({
        player_id: playerId,
        user_id: user.id,
        role: "player",
        team_role: "owner",
      });
    if (error) throw new Error(`link player_members ${slug}: ${error.message}`);
  }
  return playerId;
}

async function resolveCohortId(supabase) {
  const { data, error } = await supabase
    .from("cohorts")
    .select("id")
    .eq("slug", "cohorte-mai-2026")
    .maybeSingle();
  if (error) throw new Error(`cohort lookup: ${error.message}`);
  if (!data) throw new Error("cohorte-mai-2026 not found — apply database/seed_event_hackdays.sql first");
  return data.id;
}

(async () => {
  const env = loadEnv();
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const csv = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csv);
  const cohortId = await resolveCohortId(supabase);

  const results = [];
  for (const row of rows) {
    const { user, created } = await findOrCreateUser(supabase, row);
    await upsertProfile(supabase, user, row);
    let playerId = null;
    if (row.app_role === "player") {
      playerId = await ensurePlayerTeam(supabase, user, row, cohortId);
    }
    results.push({
      project_code: row.project_code,
      app_role: row.app_role,
      email: row.email,
      password: row.password,
      user_id: user.id,
      player_id: playerId,
      created,
    });
  }

  console.log(JSON.stringify({ cohort_id: cohortId, members: results }, null, 2));
})().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
