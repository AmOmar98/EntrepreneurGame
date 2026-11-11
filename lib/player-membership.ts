// EVT-01 — Active-event-aware player membership resolution.
// Prevents PostgREST `.maybeSingle()` failures and stale-cohort selection when
// an authenticated user participates in more than one event across editions
// (e.g. Digi-Hackathon alumni joining Idea'Wave Bootcamp).
import type { SupabaseClient } from "@supabase/supabase-js";

export type MembershipCandidate = {
  player_id: string;
  joined_at?: string | null;
};

export type PlayerCohortCandidate = {
  id: string;
  cohort_id: string;
};

/**
 * Pure selector: given a user's memberships (ordered newest first), the player->cohort
 * rows, and the set of cohort IDs belonging to the currently active event,
 * returns the player_id for the active event if present, otherwise falls back
 * to the first (most recent) membership.
 */
export function pickActivePlayerIdFromMemberships(
  memberships: MembershipCandidate[],
  players: PlayerCohortCandidate[],
  activeEventCohortIds: Iterable<string>,
): string | null {
  if (!memberships || memberships.length === 0) return null;
  if (memberships.length === 1) return memberships[0].player_id;

  const activeCohorts = new Set(activeEventCohortIds);
  if (activeCohorts.size > 0) {
    const cohortByPlayerId = new Map<string, string>();
    for (const p of players) {
      cohortByPlayerId.set(p.id, p.cohort_id);
    }
    for (const m of memberships) {
      const cohortId = cohortByPlayerId.get(m.player_id);
      if (cohortId && activeCohorts.has(cohortId)) {
        return m.player_id;
      }
    }
  }

  return memberships[0].player_id;
}

/**
 * Resolves the active-event `player_id` for `userId`.
 * - Single-membership users incur 1 query.
 * - Multi-membership users (alumni across editions) resolve to the player
 *   attached to the `events.is_active = true` cohort, falling back to the most
 *   recently joined membership.
 */
export async function resolveActivePlayerIdForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ playerId: string | null; error: { message: string } | null }> {
  const { data: rows, error } = await supabase
    .from("player_members")
    .select("player_id, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) {
    return { playerId: null, error: { message: error.message } };
  }

  const memberships = (rows ?? []) as MembershipCandidate[];
  if (memberships.length === 0) {
    return { playerId: null, error: null };
  }
  if (memberships.length === 1) {
    return { playerId: memberships[0].player_id, error: null };
  }

  const playerIds = memberships.map((m) => m.player_id);
  const [{ data: activeEvent }, { data: playerRows }] = await Promise.all([
    supabase
      .from("events")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("players")
      .select("id, cohort_id")
      .in("id", playerIds),
  ]);

  let activeCohortIds: string[] = [];
  const activeEventId = (activeEvent as { id?: string } | null)?.id;
  if (activeEventId) {
    const { data: cohortRows } = await supabase
      .from("cohorts")
      .select("id")
      .eq("event_id", activeEventId);
    activeCohortIds = ((cohortRows ?? []) as { id: string }[]).map((c) => c.id);
  }

  const chosen = pickActivePlayerIdFromMemberships(
    memberships,
    (playerRows ?? []) as PlayerCohortCandidate[],
    activeCohortIds,
  );
  return { playerId: chosen, error: null };
}
