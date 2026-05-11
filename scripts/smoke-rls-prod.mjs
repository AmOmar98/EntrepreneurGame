// scripts/smoke-rls-prod.mjs
// Usage: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//        SMOKE_EMAIL=p01@... SMOKE_PWD=... node scripts/smoke-rls-prod.mjs
// Verifie qu'un porteur peut login + lire ses player_members + ses submissions
// sans 'permission denied for table' (regression RLS).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.SMOKE_EMAIL;
const pwd = process.env.SMOKE_PWD;
if (!url || !anon || !email || !pwd) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SMOKE_EMAIL, SMOKE_PWD");
  process.exit(2);
}

const sb = createClient(url, anon);
const { error: signErr } = await sb.auth.signInWithPassword({ email, password: pwd });
if (signErr) {
  console.error("[smoke-rls] signIn FAILED:", signErr.message);
  process.exit(1);
}
console.log("[smoke-rls] signIn OK");

const checks = [
  { name: "player_members select self", q: () => sb.from("player_members").select("player_id").limit(1) },
  { name: "profiles select self", q: () => sb.from("profiles").select("user_id, app_role").limit(1) },
  { name: "submissions select own", q: () => sb.from("submissions").select("id, status").limit(5) },
  { name: "announcements select audience", q: () => sb.from("announcements").select("id").limit(5) },
];

let failed = 0;
for (const c of checks) {
  const { data, error } = await c.q();
  if (error) {
    console.error(`[smoke-rls] ${c.name}: FAIL - ${error.message}`);
    failed++;
  } else {
    console.log(`[smoke-rls] ${c.name}: OK (rows=${data?.length ?? 0})`);
  }
}

await sb.auth.signOut();
process.exit(failed === 0 ? 0 : 1);
