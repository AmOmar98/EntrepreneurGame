// quick-260519-jpr Wave 3 - Provision 4 jurors for the Digi-Hackathon event.
//
// Creates J01..J04 (Tamwilcom, Bank of Africa, Innov Invest, Bluespace) as
// app_role='mentor' auth.users + profiles + jurors row on the latest event.
// Idempotent: skips any J0X already present in cohorte-digi-hackathon-creds.csv
// AND tolerates "already registered" errors by looking up the existing user.
//
// Usage:
//   node scripts/create-digi-hackathon-jurors.cjs
//
// Prerequisites:
//   - .env.local must define NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//   - An event row must exist (script picks the latest by starts_at)
//
// Output side-effects:
//   - public.profiles upsert (app_role='mentor', display_name=jury label)
//   - public.jurors upsert (event_id, user_id) — ON CONFLICT DO NOTHING
//   - cohorte-digi-hackathon-creds.csv: appends one line per new juror in
//     format `J0X,jury-XXX,Nom Jury,TBD,JURY,jury-j0X@digi.uemf.ma,XXXXXXXXXXXX`
//
// NOTE: Wave 3 Agent #6 only CREATES this script — it is launched by the
// orchestrator after Wave 3 commit lands.

const { createClient } = require("@supabase/supabase-js");
const { randomBytes } = require("crypto");
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(REPO_ROOT, "cohorte-digi-hackathon-creds.csv");
const ENV_PATH = path.join(REPO_ROOT, ".env.local");

const JURORS = [
  { teamId: "J01", slug: "jury-tamwilcom", name: "Tamwilcom", email: "jury-j01@digi.uemf.ma" },
  { teamId: "J02", slug: "jury-boa", name: "Bank of Africa Academy", email: "jury-j02@digi.uemf.ma" },
  { teamId: "J03", slug: "jury-innov", name: "Innov Invest", email: "jury-j03@digi.uemf.ma" },
  { teamId: "J04", slug: "jury-bluespace", name: "Bluespace", email: "jury-j04@digi.uemf.ma" },
];

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(`[fatal] Missing .env.local at ${ENV_PATH}`);
    process.exit(1);
  }
  return fs
    .readFileSync(ENV_PATH, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) acc[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
      return acc;
    }, {});
}

function generatePassword() {
  // 12-char alphanum (strip +/= which are problematic in CSVs / shells).
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

function readExistingTeamIds() {
  if (!fs.existsSync(CSV_PATH)) return new Set();
  const lines = fs.readFileSync(CSV_PATH, "utf8").split(/\r?\n/);
  const ids = new Set();
  for (const line of lines) {
    const firstCell = line.split(",")[0]?.trim();
    if (firstCell && /^J\d{2}$/.test(firstCell)) {
      ids.add(firstCell);
    }
  }
  return ids;
}

async function findUserByEmail(supabase, email) {
  let page = 1;
  // Bound loop to avoid runaway on large auth.users tables.
  while (page <= 50) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const found = (data.users || []).find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (!data.users || data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

async function getLatestEventId(supabase) {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, starts_at")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`events query failed: ${error.message}`);
  if (!data) throw new Error("No event found in public.events");
  return data;
}

function appendCsvLine(juror, password) {
  // Format: team_id,team_slug,team_name,lead_name,project_code,email,password
  const line = `${juror.teamId},${juror.slug},${juror.name},TBD,JURY,${juror.email},${password}\n`;
  fs.appendFileSync(CSV_PATH, line, "utf8");
}

async function provisionJuror(supabase, eventId, juror) {
  const password = generatePassword();

  // 1. Create auth user (or recover existing).
  let userId = null;
  const created = await supabase.auth.admin.createUser({
    email: juror.email,
    password,
    email_confirm: true,
  });
  if (created.error) {
    const msg = (created.error.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exist")) {
      const existing = await findUserByEmail(supabase, juror.email);
      if (!existing) {
        throw new Error(`createUser said duplicate but listUsers cannot find ${juror.email}`);
      }
      userId = existing.id;
      console.log(`  [${juror.teamId}] auth.user already exists (id=${userId}) — keeping current password`);
    } else {
      throw new Error(`createUser failed for ${juror.email}: ${created.error.message}`);
    }
  } else {
    userId = created.data.user.id;
    console.log(`  [${juror.teamId}] auth.user created (id=${userId})`);
  }

  // 2. Upsert profile (mentor role + display_name).
  const profileUpsert = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, app_role: "mentor", display_name: juror.name },
      { onConflict: "user_id" },
    );
  if (profileUpsert.error) {
    throw new Error(`profile upsert failed for ${juror.email}: ${profileUpsert.error.message}`);
  }

  // 3. Upsert juror row on event.
  const jurorUpsert = await supabase
    .from("jurors")
    .upsert(
      { event_id: eventId, user_id: userId },
      { onConflict: "event_id,user_id", ignoreDuplicates: true },
    );
  if (jurorUpsert.error) {
    throw new Error(`juror upsert failed for ${juror.email}: ${jurorUpsert.error.message}`);
  }

  // 4. Append CSV line (only if the user was actually created — otherwise we
  // do not know the original password and writing a stale value would mislead).
  if (created.error) {
    console.log(`  [${juror.teamId}] CSV NOT appended (existing auth.user — password unknown)`);
  } else {
    appendCsvLine(juror, password);
    console.log(`  [${juror.teamId}] CSV appended (password=${password})`);
  }

  return { teamId: juror.teamId, userId, email: juror.email };
}

(async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === "replace-me") {
    console.error("[fatal] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const event = await getLatestEventId(supabase);
  console.log(`[event] using event ${event.id} (${event.name})`);

  const existingIds = readExistingTeamIds();
  console.log(`[csv] existing juror team_ids in CSV: ${[...existingIds].join(",") || "(none)"}`);

  const summary = [];
  for (const juror of JURORS) {
    if (existingIds.has(juror.teamId)) {
      console.log(`[${juror.teamId}] skipped — already in CSV`);
      continue;
    }
    try {
      const out = await provisionJuror(supabase, event.id, juror);
      summary.push(out);
    } catch (err) {
      console.error(`[${juror.teamId}] FAILED: ${err.message}`);
    }
  }

  console.log("\n[summary]");
  for (const s of summary) {
    console.log(`  ${s.teamId} ${s.email} -> ${s.userId}`);
  }
  console.log(`\nDone. ${summary.length}/${JURORS.length} jurors provisioned this run.`);
})().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
