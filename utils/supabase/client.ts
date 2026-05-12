// quick-260512-24v deferred #2: browser-side Supabase client for Realtime
// subscriptions (HelpInboxBellLive). Mirrors utils/supabase/server.ts but
// targets the browser environment. Returns null in demo mode (no env vars).

import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseEnv } from "@/lib/supabase-status";

export function createClient() {
  if (!hasSupabaseEnv()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
