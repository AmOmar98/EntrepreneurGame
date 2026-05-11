// Phase 10 / Section 10 — Pitch prep H-2 helper.
// Purely server-side. Aggregates target pitch time + slot (gated by
// events.pitch_order_published_at) for the current Player.
//
// R1 contract : slot revealed only when published. Otherwise null.

import type { PitchOrder } from "@/lib/pitch-order";
import { getPlayerSlot, isPitchOrderPublished } from "@/lib/pitch-order";
import { createClient } from "@/utils/supabase/server";

export type PitchPrepData = {
  // ISO string when this player should be ready (start of their slot).
  // Null if slot not published yet.
  readyAt: string | null;
  // Ordinal position 1..N. Null until published.
  position: number | null;
  // Total number of teams pitching (used for rendering "X / Y" if needed).
  totalTeams: number;
  // Whether the GameMaster has published the pitch order.
  published: boolean;
};

export type GetPitchPrepInput = {
  playerId: string;
  pitchOrderJson: PitchOrder | null | undefined;
  pitchOrderPublishedAt: string | Date | null | undefined;
  // Pitch session start (ISO string) — anchor used to compute readyAt.
  // Default to AgreenTech 2026 day 2 14:00 Casablanca.
  pitchStartAt?: string;
  // Average minutes per slot (default 15).
  slotMinutes?: number;
};

const DEFAULT_PITCH_START_AT = "2026-05-14T14:00:00+01:00";
const DEFAULT_SLOT_MINUTES = 15;

export function getPitchPrep({
  playerId,
  pitchOrderJson,
  pitchOrderPublishedAt,
  pitchStartAt = DEFAULT_PITCH_START_AT,
  slotMinutes = DEFAULT_SLOT_MINUTES,
}: GetPitchPrepInput): PitchPrepData {
  const totalTeams = pitchOrderJson ? Object.keys(pitchOrderJson).length : 0;
  const published = isPitchOrderPublished(pitchOrderPublishedAt);

  if (!published || !pitchOrderJson) {
    return { readyAt: null, position: null, totalTeams, published };
  }

  const position = getPlayerSlot(pitchOrderJson, playerId);
  if (position == null) {
    return { readyAt: null, position: null, totalTeams, published };
  }

  const startMs = new Date(pitchStartAt).getTime();
  const readyMs = startMs + (position - 1) * slotMinutes * 60_000;
  return {
    readyAt: new Date(readyMs).toISOString(),
    position,
    totalTeams,
    published,
  };
}

// Server-side fetch wrapper : resolves player_id from auth user via
// player_members, fetches the latest event row, and delegates to
// getPitchPrep. Returns demo-mode placeholder shape when Supabase is
// unavailable (preserves dual-mode contract per CLAUDE.md guard #3).
export async function getPitchPrepForUser(userId: string): Promise<PitchPrepData> {
  const empty: PitchPrepData = {
    readyAt: null,
    position: null,
    totalTeams: 0,
    published: false,
  };

  const supabase = await createClient();
  if (!supabase) return empty;

  // 1. Map auth user -> player_id (Player belongs to at most one team for pilot).
  const { data: memberRow } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  const playerId = (memberRow as { player_id?: string } | null)?.player_id ?? null;
  if (!playerId) return empty;

  // 2. Latest event row (single pilot event for AgreenTech 2026).
  const { data: eventRow } = await supabase
    .from("events")
    .select("pitch_order_json, pitch_order_published_at")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const event = (eventRow ?? null) as {
    pitch_order_json: PitchOrder | null;
    pitch_order_published_at: string | null;
  } | null;

  return getPitchPrep({
    playerId,
    pitchOrderJson: event?.pitch_order_json ?? null,
    pitchOrderPublishedAt: event?.pitch_order_published_at ?? null,
  });
}
