// Phase 14 / Plan 02 - Active-event accessor.
// Reads the single active event via events.is_active = true (TENANT-03).
// Dual-mode (DATA-03): returns the demo event constant when hasSupabaseEnv()
// is false or the Supabase client is null. Never throws; never redirects.
//
// Pre-migration window (Plan 04 not yet applied to PROD):
//   is_active column does not exist -> Supabase query returns an error ->
//   both accessors return null. External callers must tolerate null gracefully
//   during this window (documented in 14-02-SUMMARY.md).
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type { Event } from "@/lib/types";

// Demo active event -- mirrors the demo cohort used in lib/seed/missions.ts.
// id matches demoMissions[*].eventId so the demo journey renders correctly.
const DEMO_EVENT: Event = {
  id: "00000000-0000-0000-0000-0000000000e0",
  slug: "demo-event",
  name: "Demo Event",
  startsAt: "2026-01-01T00:00:00Z",
  endsAt: "2026-12-31T23:59:59Z",
  resultsPublishedAt: null,
  isActive: true,
  organizationId: undefined,
};

type EventRow = {
  id: string;
  slug: string;
  name: string;
  starts_at: string;
  ends_at: string;
  results_published_at: string | null;
  is_active: boolean | null;
  organization_id: string | null;
};

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    resultsPublishedAt: row.results_published_at,
    isActive: row.is_active ?? false,
    organizationId: row.organization_id ?? undefined,
  };
}

// ============================================================================
// Server-side accessors
// ============================================================================

/**
 * Returns the active Event row, or null if none is active.
 * - Demo mode: returns DEMO_EVENT.
 * - Pre-migration window: is_active column absent -> Supabase error -> null.
 *   Plan 03 callers must handle null (fall back to starts_at ordering or skip).
 */
export async function getActiveEvent(): Promise<Event | null> {
  if (!hasSupabaseEnv()) return DEMO_EVENT;

  const supabase = await createClient();
  if (!supabase) return DEMO_EVENT;

  const { data, error } = await supabase
    .from("events")
    .select("id, slug, name, starts_at, ends_at, results_published_at, is_active, organization_id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) return null;
  if (!data) return null;
  return mapEvent(data as EventRow);
}

/**
 * Convenience helper: returns just the active event id, or null.
 * Used by callers that only need the event id for queries.
 */
export async function getActiveEventId(): Promise<string | null> {
  if (!hasSupabaseEnv()) return DEMO_EVENT.id;

  const supabase = await createClient();
  if (!supabase) return DEMO_EVENT.id;

  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { id: string }).id;
}
