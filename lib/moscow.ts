// T3X-EXPANSION wave 3 / plan 12-10 — Data fetcher for moscow_cards.
// Server-only helper. Returns [] in demo mode or on error.
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { createClient } from "@/utils/supabase/server";
import type { MoscowBucket, MoscowCard } from "@/lib/types";

type MoscowCardRow = {
  id: string;
  project_id: string;
  deliverable_template_id: string;
  bucket: MoscowBucket;
  ord: number;
  feature: string;
  pourquoi: string;
  contrainte: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: MoscowCardRow): MoscowCard {
  return {
    id: row.id,
    projectId: row.project_id,
    deliverableTemplateId: row.deliverable_template_id,
    bucket: row.bucket,
    ord: row.ord,
    feature: row.feature,
    pourquoi: row.pourquoi,
    contrainte: row.contrainte,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all moscow_cards for (player, deliverable_template), ordered by (bucket, ord).
 * Returns [] in demo mode or on error.
 */
export async function getMoscowCardsForPlayerDeliverable(
  playerId: string,
  deliverableTemplateId: string,
): Promise<MoscowCard[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("moscow_cards")
    .select("*")
    .eq("project_id", playerId)
    .eq("deliverable_template_id", deliverableTemplateId)
    .order("bucket", { ascending: true })
    .order("ord", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r) => mapRow(r as MoscowCardRow));
}
