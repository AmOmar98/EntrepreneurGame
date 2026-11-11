// Phase 16 (JURY-06): Per-event pitch evaluation criteria.
// Dual-mode accessor (DATA-03): returns DEMO_PITCH_CRITERIA in demo mode
// (no Supabase env) or when no criteria are defined. Never throws.
//
// DEMO_PITCH_CRITERIA mirrors the 4 legacy criteria from lib/i18n.ts:
//   jury_c1_label "Innovation" (max 20)
//   jury_c2_label "Faisabilite technique" (max 20)
//   jury_c3_label "Modele economique" (max 20)
//   jury_c4_label "Equipe" (max 20)
//
// Note: labels use plain ASCII (no diacritics) per CLAUDE.md i18n convention
// for code-resident strings (safe for mailto/CSV payloads).
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";

// ============================================================================
// Types
// ============================================================================

export type PitchCriterion = {
  id: string;
  eventId: string;
  key: string;
  label: string;
  max: number;
  ord: number;
};

// ============================================================================
// Demo fallback constant — 4 legacy criteria (max 20 each)
// ============================================================================

// Demo event id matches DEMO_EVENT in lib/active-event.ts
const DEMO_EVENT_ID = "00000000-0000-0000-0000-0000000000e0";

export const DEMO_PITCH_CRITERIA: PitchCriterion[] = [
  {
    id: "00000000-0000-0000-0000-000000000pc1",
    eventId: DEMO_EVENT_ID,
    key: "innovation",
    label: "Innovation",
    max: 20,
    ord: 0,
  },
  {
    id: "00000000-0000-0000-0000-000000000pc2",
    eventId: DEMO_EVENT_ID,
    key: "faisabilite",
    label: "Faisabilite technique",
    max: 20,
    ord: 1,
  },
  {
    id: "00000000-0000-0000-0000-000000000pc3",
    eventId: DEMO_EVENT_ID,
    key: "modele",
    label: "Modele economique",
    max: 20,
    ord: 2,
  },
  {
    id: "00000000-0000-0000-0000-000000000pc4",
    eventId: DEMO_EVENT_ID,
    key: "equipe",
    label: "Equipe",
    max: 20,
    ord: 3,
  },
];

// ============================================================================
// DB row type (snake_case)
// ============================================================================

type PitchCriterionRow = {
  id: string;
  event_id: string;
  key: string;
  label: string;
  max: number;
  ord: number;
};

function mapCriterion(row: PitchCriterionRow): PitchCriterion {
  return {
    id: row.id,
    eventId: row.event_id,
    key: row.key,
    label: row.label,
    max: row.max,
    ord: row.ord,
  };
}

// ============================================================================
// Server-side accessor
// ============================================================================

/**
 * Returns the pitch criteria for the given event, ordered by ord.
 * Falls back to DEMO_PITCH_CRITERIA when:
 * - Supabase env is absent (demo mode).
 * - Supabase client is null.
 * - DB query returns an error or empty result (pre-migration tolerance).
 * Never throws.
 */
export async function getPitchCriteria(eventId: string): Promise<PitchCriterion[]> {
  if (!hasSupabaseEnv()) return DEMO_PITCH_CRITERIA;

  const supabase = await createClient();
  if (!supabase) return DEMO_PITCH_CRITERIA;

  const { data, error } = await supabase
    .from("pitch_criteria")
    .select("id, event_id, key, label, max, ord")
    .eq("event_id", eventId)
    .order("ord", { ascending: true });

  if (error) return DEMO_PITCH_CRITERIA;
  if (!data || data.length === 0) return DEMO_PITCH_CRITERIA;

  return (data as PitchCriterionRow[]).map(mapCriterion);
}
