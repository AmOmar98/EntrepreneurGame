// Phase 15 / Plan 04 — Levels editor data accessor (LEVELS-04).
// Thin wrapper over getLevels() for the /admin/levels editor page.
// Dual-mode: returns [] in demo mode (admin editor is disabled without Supabase).
import { getLevels } from "@/lib/levels";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type { Level } from "@/lib/types";

/**
 * Returns all levels ordered by ord ASC for the GM editor page.
 * Returns an empty array in demo mode (no Supabase env).
 */
export async function getAdminLevels(): Promise<Level[]> {
  if (!hasSupabaseEnv()) return [];
  return getLevels();
}
