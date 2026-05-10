// Phase 9 / GMR-06 — Admin deliverable templates data layer.
// Lists all deliverable_templates joined with their mission + level,
// for the GameMaster /admin/deliverables page (toggle is_active).
import { createClient } from "@/utils/supabase/server";
import type { LevelId } from "@/lib/types";
import { levelLabel } from "@/lib/journey";

export type AdminDeliverableRow = {
  id: string;
  slug: string;
  title: string;
  maxScore: number;
  isActive: boolean;
  ord: number;
  missionTitle: string;
  levelId: LevelId;
  levelLabel: string;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  max_score: number;
  is_active: boolean | null;
  ord: number;
  mission_id: string;
};

type MissionRow = {
  id: string;
  title: string;
  level_id: LevelId;
};

export async function getAdminDeliverables(): Promise<AdminDeliverableRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: tplRows, error: tplErr } = await supabase
    .from("deliverable_templates")
    .select("id, slug, title, max_score, is_active, ord, mission_id")
    .order("ord", { ascending: true });
  if (tplErr || !tplRows) return [];

  const missionIds = Array.from(
    new Set((tplRows as Row[]).map((r) => r.mission_id)),
  );
  const missionsById = new Map<string, MissionRow>();
  if (missionIds.length > 0) {
    const { data: missionRows } = await supabase
      .from("missions")
      .select("id, title, level_id")
      .in("id", missionIds);
    for (const m of (missionRows ?? []) as MissionRow[]) {
      missionsById.set(m.id, m);
    }
  }

  const rows: AdminDeliverableRow[] = (tplRows as Row[]).map((r) => {
    const mission = missionsById.get(r.mission_id);
    const level = (mission?.level_id ?? "L0_diagnostic") as LevelId;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      maxScore: r.max_score,
      isActive: r.is_active === null ? true : Boolean(r.is_active),
      ord: r.ord,
      missionTitle: mission?.title ?? "",
      levelId: level,
      levelLabel: levelLabel(level),
    };
  });

  // Sort by level then ord — reading order for the GM.
  rows.sort((a, b) => {
    if (a.levelId === b.levelId) return a.ord - b.ord;
    return a.levelId.localeCompare(b.levelId);
  });
  return rows;
}
