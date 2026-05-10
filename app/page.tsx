import { redirect } from "next/navigation";
import { getCurrentUser, redirectForRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase-status";

// Phase 11 / C1 — Public landing is the new entry point for unauthenticated
// visitors. Authenticated users are routed by role/onboarding state.
// In demo mode (no Supabase env), the user object is null so we always
// render the landing — preserves dual-mode invariant.
export default async function RootPage() {
  const user = hasSupabaseEnv() ? await getCurrentUser() : null;
  if (!user) redirect("/landing");
  await redirectForRole();
}
