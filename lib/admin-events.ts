// Phase 15 / ENGINE-03 + ENGINE-04 — Admin events data layer.
// Lists all events with org name + mission count for the GM /admin/events page.
import { createClient } from "@/utils/supabase/server";

export type AdminEventRow = {
  id: string;
  slug: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  organizationId: string | null;
  organizationName: string | null;
  missionCount: number;
};

type EventRow = {
  id: string;
  slug: string;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean | null;
  organization_id: string | null;
};

type OrgRow = {
  id: string;
  name: string;
};

type MissionCountRow = {
  event_id: string;
};

export async function getAdminEvents(): Promise<AdminEventRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: eventRows, error: evtErr } = await supabase
    .from("events")
    .select("id, slug, name, starts_at, ends_at, is_active, organization_id")
    .order("starts_at", { ascending: false });
  if (evtErr || !eventRows) return [];

  // Fetch orgs referenced by these events.
  const orgIds = Array.from(
    new Set(
      (eventRows as EventRow[])
        .map((e) => e.organization_id)
        .filter((id): id is string => id !== null),
    ),
  );
  const orgsById = new Map<string, string>();
  if (orgIds.length > 0) {
    const { data: orgData } = await supabase
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);
    for (const org of (orgData ?? []) as OrgRow[]) {
      orgsById.set(org.id, org.name);
    }
  }

  // Count missions per event.
  const eventIdList = (eventRows as EventRow[]).map((e) => e.id);
  const missionCountMap = new Map<string, number>();
  if (eventIdList.length > 0) {
    const { data: missionRows } = await supabase
      .from("missions")
      .select("event_id")
      .in("event_id", eventIdList);
    for (const m of (missionRows ?? []) as MissionCountRow[]) {
      missionCountMap.set(m.event_id, (missionCountMap.get(m.event_id) ?? 0) + 1);
    }
  }

  return (eventRows as EventRow[]).map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    isActive: e.is_active === null ? false : Boolean(e.is_active),
    organizationId: e.organization_id,
    organizationName: e.organization_id ? (orgsById.get(e.organization_id) ?? null) : null,
    missionCount: missionCountMap.get(e.id) ?? 0,
  }));
}
