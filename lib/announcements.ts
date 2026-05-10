// Phase 9 / GMR-09 — Announcements data layer.
// Server-side queries for /admin/announce (history) and /journey (Player strip).
// Dual-mode (DATA-03): demo mode (no Supabase env) returns empty arrays.
import { createClient } from "@/utils/supabase/server";
import type { AppRole, LevelId } from "@/lib/types";

// ============================================================================
// Public types
// ============================================================================

export type AnnouncementKind = "info" | "urgence" | "celebration" | "appel";
export type AnnouncementTargetKind = "all" | "level" | "teams" | "mentors";

export type Announcement = {
  id: string;
  eventId: string;
  kind: AnnouncementKind;
  targetKind: AnnouncementTargetKind;
  targetIds: string[];
  title: string | null;
  body: string;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
};

// ============================================================================
// Row mapper
// ============================================================================

type AnnouncementRow = {
  id: string;
  event_id: string;
  kind: AnnouncementKind;
  target_kind: AnnouncementTargetKind;
  target_ids: string[] | null;
  title: string | null;
  body: string;
  created_by_user_id: string | null;
  created_at: string;
};

function mapAnnouncement(
  row: AnnouncementRow,
  authorName: string | null = null,
): Announcement {
  return {
    id: row.id,
    eventId: row.event_id,
    kind: row.kind,
    targetKind: row.target_kind,
    targetIds: Array.isArray(row.target_ids) ? row.target_ids : [],
    title: row.title,
    body: row.body,
    createdByUserId: row.created_by_user_id,
    createdByName: authorName,
    createdAt: row.created_at,
  };
}

// ============================================================================
// Server-side accessors
// ============================================================================

/**
 * Fetch the most recent announcements for the current event (latest by
 * starts_at). Capped at `limit` rows (default 25).
 */
export async function getRecentAnnouncements(limit = 25): Promise<Announcement[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventErr || !eventRow) return [];
  const eventId = (eventRow as { id: string }).id;

  const { data: rows, error } = await supabase
    .from("announcements")
    .select(
      "id, event_id, kind, target_kind, target_ids, title, body, created_by_user_id, created_at",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !rows) return [];

  // Best-effort author name resolution (single-shot, deduplicated).
  const authorIds = Array.from(
    new Set(
      (rows as AnnouncementRow[])
        .map((r) => r.created_by_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const namesById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", authorIds);
    for (const p of (profiles ?? []) as {
      user_id: string;
      full_name: string | null;
      email: string | null;
    }[]) {
      namesById.set(p.user_id, p.full_name || p.email || "GameMaster");
    }
  }

  return (rows as AnnouncementRow[]).map((row) =>
    mapAnnouncement(row, row.created_by_user_id ? namesById.get(row.created_by_user_id) ?? null : null),
  );
}

/**
 * Filter announcements that are visible to a given audience.
 * Pure helper — used both server (Player journey) and client side.
 */
export function filterAnnouncementsForAudience(
  announcements: Announcement[],
  audience: {
    role: AppRole | null;
    playerId: string | null;
    levelId: LevelId | null;
  },
): Announcement[] {
  return announcements.filter((a) => {
    switch (a.targetKind) {
      case "all":
        return true;
      case "mentors":
        return audience.role === "mentor" || audience.role === "game_master";
      case "level":
        return audience.levelId !== null && a.targetIds.includes(audience.levelId);
      case "teams":
        return audience.playerId !== null && a.targetIds.includes(audience.playerId);
      default:
        return false;
    }
  });
}

/**
 * Fetch the announcements visible to the connected Player (used by /journey).
 * Returns up to `limit` rows, already filtered.
 */
export async function getAnnouncementsForPlayer(
  userId: string,
  limit = 5,
): Promise<Announcement[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  // Resolve player + level.
  const { data: membership } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", userId)
    .maybeSingle();
  const playerId = (membership as { player_id?: string } | null)?.player_id ?? null;

  let levelId: LevelId | null = null;
  if (playerId) {
    const { data: playerRow } = await supabase
      .from("players")
      .select("current_level")
      .eq("id", playerId)
      .maybeSingle();
    levelId = (playerRow as { current_level?: LevelId } | null)?.current_level ?? null;
  }

  const all = await getRecentAnnouncements(limit * 4);
  const visible = filterAnnouncementsForAudience(all, {
    role: "player",
    playerId,
    levelId,
  });
  return visible.slice(0, limit);
}
