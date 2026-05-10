// Phase 10 / Section 10 — Pitch prep H-2 helper.
// Purely server-side. Aggregates target pitch time + slot (gated by
// events.pitch_order_published_at) for the current Player.
//
// R1 contract : slot revealed only when published. Otherwise null.

import type { PitchOrder } from "@/lib/pitch-order";
import { getPlayerSlot, isPitchOrderPublished } from "@/lib/pitch-order";

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
