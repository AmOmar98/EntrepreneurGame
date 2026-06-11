// Phase 15 / Plan 03 — Admin missions data layer (ENGINE-01 / ENGINE-02).
// Lists missions for an event with their deliverable_templates,
// for the GameMaster /admin/events/[id]/missions page.
import { createClient } from "@/utils/supabase/server";
import { getLevelsMap } from "@/lib/levels";
import type { LevelId, ComposerKind } from "@/lib/types";

// ============================================================================
// Types
// ============================================================================

export type AdminTemplateRow = {
  id: string;
  slug: string;
  title: string;
  ord: number;
  isActive: boolean;
  isBonus: boolean;
  composerKind: ComposerKind;
};

export type AdminMissionRow = {
  id: string;
  title: string;
  levelId: LevelId;
  levelLabel: string;
  kind: string;
  scheduledAt: string | null;
  ord: number;
  isActive: boolean;
  templates: AdminTemplateRow[];
};

// ============================================================================
// Raw DB shapes
// ============================================================================

type MissionDbRow = {
  id: string;
  title: string;
  level_id: LevelId;
  kind: string;
  scheduled_at: string | null;
  ord: number;
  is_active: boolean | null;
};

type TemplateDbRow = {
  id: string;
  slug: string;
  title: string;
  ord: number;
  is_active: boolean | null;
  is_bonus: boolean | null;
  composer_kind: string | null;
  mission_id: string;
};

// ============================================================================
// Accessor
// ============================================================================

/**
 * Returns all missions for a given event, ordered by ord ASC.
 * Each mission includes its deliverable_templates (id, title, ord, isActive, isBonus, composerKind).
 * Dual-mode: returns [] when Supabase env is absent (demo mode).
 */
export async function getEventMissions(eventId: string): Promise<AdminMissionRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const levelsMap = await getLevelsMap();

  // Fetch missions for this event
  const { data: missionRows, error: missionsErr } = await supabase
    .from("missions")
    .select("id, title, level_id, kind, scheduled_at, ord, is_active")
    .eq("event_id", eventId)
    .order("ord", { ascending: true });

  if (missionsErr || !missionRows) return [];

  const missions = missionRows as MissionDbRow[];
  if (missions.length === 0) return [];

  const missionIds = missions.map((m) => m.id);

  // Fetch templates for all missions in one query
  const { data: templateRows, error: templatesErr } = await supabase
    .from("deliverable_templates")
    .select("id, slug, title, ord, is_active, is_bonus, composer_kind, mission_id")
    .in("mission_id", missionIds)
    .order("ord", { ascending: true });

  if (templatesErr) return [];

  const templates = (templateRows ?? []) as TemplateDbRow[];

  // Group templates by mission_id
  const templatesByMission = new Map<string, AdminTemplateRow[]>();
  for (const tpl of templates) {
    const rows = templatesByMission.get(tpl.mission_id) ?? [];
    rows.push({
      id: tpl.id,
      slug: tpl.slug,
      title: tpl.title,
      ord: tpl.ord,
      isActive: tpl.is_active === null ? true : Boolean(tpl.is_active),
      isBonus: tpl.is_bonus === null ? false : Boolean(tpl.is_bonus),
      composerKind: (tpl.composer_kind ?? "simple") as ComposerKind,
    });
    templatesByMission.set(tpl.mission_id, rows);
  }

  return missions.map((m) => ({
    id: m.id,
    title: m.title,
    levelId: m.level_id,
    levelLabel: levelsMap.get(m.level_id)?.label ?? m.level_id,
    kind: m.kind,
    scheduledAt: m.scheduled_at,
    ord: m.ord,
    isActive: m.is_active === null ? true : Boolean(m.is_active),
    templates: templatesByMission.get(m.id) ?? [],
  }));
}
