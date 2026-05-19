// quick-260519-jpr - Jurors CRUD helpers (Wave 2 Agent #3).
// Wraps Supabase queries on public.jurors. Email-based add requires a
// service-role client because auth.users is not exposed via RLS — same
// pattern as lib/results.ts buildServiceClient (post-publish ranking
// bypass). Page-level role gate (GM only) is enforced upstream by the
// server actions in app/actions.ts; RLS jurors_gm_all is the DB safety net.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import type { Juror } from "@/lib/types";

// ============================================================================
// Row mapper
// ============================================================================

type JurorRow = {
  event_id: string;
  user_id: string;
  invited_at: string;
  invited_by: string | null;
};

function mapJuror(row: JurorRow): Juror {
  return {
    eventId: row.event_id,
    userId: row.user_id,
    invitedAt: row.invited_at,
    invitedBy: row.invited_by,
  };
}

// ============================================================================
// Service-role client (lookup auth.users by email — RLS blocks anon/auth)
// ============================================================================

type ServiceClient = ReturnType<typeof createServiceClient>;

function buildServiceClient(): ServiceClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === "replace-me") return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================================================
// Accessors
// ============================================================================

export async function getJurorsForEvent(eventId: string): Promise<Juror[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("jurors")
    .select("event_id, user_id, invited_at, invited_by")
    .eq("event_id", eventId)
    .order("invited_at", { ascending: true });
  if (error) {
    console.error("[jurors] list query failed", error);
    return [];
  }
  return ((data ?? []) as JurorRow[]).map(mapJuror);
}

export async function isCurrentUserJuror(eventId: string | null): Promise<boolean> {
  if (!eventId) return false;
  const supabase = await createClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("jurors")
    .select("user_id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[jurors] isCurrentUserJuror query failed", error);
    return false;
  }
  return !!data;
}

// ============================================================================
// Mutations (called by GM-gated server actions in app/actions.ts)
// ============================================================================

export async function addJurorByEmail(
  eventId: string,
  email: string,
): Promise<{ ok: boolean; message: string; userId?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configuré." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  // 1. Resolve user_id by email via service-role (auth.users is not RLS-exposed).
  const service = buildServiceClient();
  if (!service) {
    return { ok: false, message: "Service role indisponible — lookup email impossible." };
  }

  // listUsers supports filtering by email since supabase-js v2.
  const lookup = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (lookup.error) {
    return { ok: false, message: lookup.error.message };
  }
  const normalized = email.trim().toLowerCase();
  const match = (lookup.data?.users ?? []).find(
    (u) => (u.email ?? "").toLowerCase() === normalized,
  );
  if (!match) {
    return { ok: false, message: "Email inconnu en base." };
  }

  // 2. Insert (ON CONFLICT DO NOTHING — table PK is (event_id, user_id)).
  const { error: insertErr } = await supabase
    .from("jurors")
    .upsert(
      {
        event_id: eventId,
        user_id: match.id,
        invited_by: user.id,
      },
      { onConflict: "event_id,user_id", ignoreDuplicates: true },
    );
  if (insertErr) {
    return { ok: false, message: insertErr.message };
  }
  return { ok: true, message: "Juror invité.", userId: match.id };
}

export async function removeJuror(
  eventId: string,
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configuré." };

  const { error } = await supabase
    .from("jurors")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: "Juror retiré." };
}
