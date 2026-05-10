// T3X-EXPANSION wave 3 / plan 12-10 — Data fetcher for bonus_events.
// Server-only helper. Returns [] in demo mode (no Supabase env).
// R1 preserved : caller decides what to display (qualitative badge Player-facing,
// multiplier values reserved for Mentor / GM contexts only).
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { createClient } from "@/utils/supabase/server";
import type { BonusEvent, BonusStatus, BonusType, MultiplierScope } from "@/lib/types";

type BonusEventRow = {
  id: string;
  project_id: string;
  type: BonusType;
  title: string;
  description: string;
  doc_url: string | null;
  status: BonusStatus;
  multiplier_factor: number | string;
  multiplier_scope: MultiplierScope;
  multiplier_consumed_at: string | null;
  claimed_at: string;
  claimed_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: BonusEventRow): BonusEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    title: row.title,
    description: row.description,
    docUrl: row.doc_url,
    status: row.status,
    multiplierFactor:
      typeof row.multiplier_factor === "string"
        ? Number(row.multiplier_factor)
        : row.multiplier_factor,
    multiplierScope: row.multiplier_scope,
    multiplierConsumedAt: row.multiplier_consumed_at,
    claimedAt: row.claimed_at,
    claimedBy: row.claimed_by,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    feedback: row.feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all bonus_events for a player, ordered by claimed_at DESC.
 * Returns [] in demo mode or on error.
 */
export async function getBonusEventsForPlayer(playerId: string): Promise<BonusEvent[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bonus_events")
    .select("*")
    .eq("project_id", playerId)
    .order("claimed_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r) => mapRow(r as BonusEventRow));
}

/**
 * Fetch a single bonus_event by id (Mentor/GM review page).
 * RLS bonus_events_select gates : Mentor + GM see all rows.
 */
export async function getBonusEventById(id: string): Promise<BonusEvent | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("bonus_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as BonusEventRow);
}
