// Help Requests query layer (quick-260512-24v).
// Dual-mode: returns empty/zero in demo mode, hits Supabase otherwise.
// R1 NA / R2 NA / R3 OK -- purely additive, never gates progression.

import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type { HelpRequest, HelpRequestStatus } from "@/lib/types";

// quick-260512-24v deferred #3 + #5: extend HelpRequest with optional
// fields without touching the locked lib/types.ts (pilot bypass deny list).
export type HelpRequestExtended = HelpRequest & {
  missionContext: string | null;
  assignedMentorId: string | null;
};

type RawHelpRequest = {
  id: string;
  player_id: string;
  requested_by: string;
  message: string;
  status: HelpRequestStatus;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  updated_at: string;
  mission_context: string | null;
  assigned_mentor_id: string | null;
};

function mapRow(row: RawHelpRequest): HelpRequestExtended {
  return {
    id: row.id,
    playerId: row.player_id,
    requestedBy: row.requested_by,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    acknowledgedAt: row.acknowledged_at,
    acknowledgedBy: row.acknowledged_by,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    updatedAt: row.updated_at,
    missionContext: row.mission_context,
    assignedMentorId: row.assigned_mentor_id,
  };
}

export async function listHelpRequests(opts?: {
  onlyUnresolved?: boolean;
}): Promise<HelpRequestExtended[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  if (!supabase) return [];
  let q = supabase
    .from("help_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (opts?.onlyUnresolved) {
    q = q.in("status", ["open", "acknowledged"]);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as RawHelpRequest[]).map(mapRow);
}

export async function countUnreadHelpRequests(): Promise<number> {
  if (!hasSupabaseEnv()) return 0;
  const supabase = await createClient();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("help_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");
  if (error) return 0;
  return count ?? 0;
}

export async function getPlayerIdForCurrentUser(): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as { player_id: string } | null)?.player_id ?? null;
}
