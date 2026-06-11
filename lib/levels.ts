// Phase 14 / Plan 02 - Levels data layer.
// Reads public.levels_v2 (text-PK table introduced by migration 20260611120200).
// Dual-mode (DATA-03): returns DEMO_LEVELS when hasSupabaseEnv() is false or
// the Supabase client is null. Never throws; never redirects.
import { createClient } from "@/utils/supabase/server";
import { demoLevels } from "@/lib/seed/levels";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type { Level, LevelId } from "@/lib/types";

// Re-export for callers that only need the demo constant (e.g. tests, Storybook).
export const DEMO_LEVELS: Level[] = demoLevels;

// ============================================================================
// Server-side accessors
// ============================================================================

/**
 * Returns all levels ordered by ord ASC.
 * - Demo mode (no Supabase env): returns DEMO_LEVELS.
 * - Supabase mode: reads public.levels_v2. Falls back to DEMO_LEVELS on any
 *   error (e.g. migration not yet applied to PROD -- Plan 04 window).
 */
export async function getLevels(): Promise<Level[]> {
  if (!hasSupabaseEnv()) return DEMO_LEVELS;

  const supabase = await createClient();
  if (!supabase) return DEMO_LEVELS;

  const { data, error } = await supabase
    .from("levels_v2")
    .select("id, ord, label, description")
    .order("ord", { ascending: true });

  if (error || !data) return DEMO_LEVELS;
  return data as Level[];
}

/**
 * Convenience helper: returns a Map keyed by LevelId for O(1) lookup.
 * Callers that replaced levelLabel() / levelOrd() use this instead:
 *   const map = await getLevelsMap();
 *   const label = map.get(player.currentLevel)?.label ?? player.currentLevel;
 *   const ord   = map.get(player.currentLevel)?.ord   ?? 0;
 */
export async function getLevelsMap(): Promise<Map<LevelId, Level>> {
  const levels = await getLevels();
  return new Map(levels.map((l) => [l.id, l]));
}
