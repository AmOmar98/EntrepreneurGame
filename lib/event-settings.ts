// Phase 16 (SETTINGS-01/02): Per-event configurable scoring settings.
// Dual-mode accessor (DATA-03): returns DEFAULT_EVENT_SETTINGS in demo mode
// (no Supabase env) or when pre-migration (table absent). Never throws.
//
// DEFAULT_EVENT_SETTINGS values mirror the current hardcoded constants exactly:
//   xpFirstSubmission 100 — lib/journey.ts:348 earnedXp += 100
//   xpValidateV1       50 — lib/journey.ts:352 earnedXp += 50
//   xpValidateV2      100 — lib/journey.ts:353 earnedXp += 100
//   engSubmitted      100 — lib/score.ts:72 SUBMITTED_POINTS
//   engReviewed        25 — lib/score.ts:73 REVIEWED_POINTS
//   engValidated       50 — lib/score.ts:74 VALIDATED_POINTS
//   pitchWeight       0.8 — lib/results.ts:33 DEFAULT_PITCH_WEIGHT
//   bonusMultiplierCap 3.0 — lib/types.ts:260 BONUS_MULTIPLIER_CAP
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";

// ============================================================================
// Types
// ============================================================================

export type EventSettings = {
  /** XP awarded on first submission of any deliverable. lib/journey.ts:348 */
  xpFirstSubmission: number;
  /** XP awarded when a deliverable reaches verdict validate_v1. lib/journey.ts:352 */
  xpValidateV1: number;
  /** XP awarded when a deliverable reaches verdict validate_v2. lib/journey.ts:353 */
  xpValidateV2: number;
  /** Engagement points for the "submitted" milestone (+per template). lib/score.ts:72 */
  engSubmitted: number;
  /** Engagement points for the "reviewed" milestone (+per template). lib/score.ts:73 */
  engReviewed: number;
  /** Engagement points for the "validated" milestone (+per template). lib/score.ts:74 */
  engValidated: number;
  /** Pitch weight for combined ranking (0.0–1.0). lib/results.ts:33 */
  pitchWeight: number;
  /** Bonus multiplier cap (≥1.0). lib/types.ts BONUS_MULTIPLIER_CAP */
  bonusMultiplierCap: number;
};

// ============================================================================
// Defaults — mirror current hardcoded values exactly (zero behavior change)
// ============================================================================

export const DEFAULT_EVENT_SETTINGS: EventSettings = {
  xpFirstSubmission: 100,  // lib/journey.ts:348 earnedXp += 100
  xpValidateV1: 50,        // lib/journey.ts:352 earnedXp += 50
  xpValidateV2: 100,       // lib/journey.ts:353 earnedXp += 100
  engSubmitted: 100,       // lib/score.ts:72 SUBMITTED_POINTS
  engReviewed: 25,         // lib/score.ts:73 REVIEWED_POINTS
  engValidated: 50,        // lib/score.ts:74 VALIDATED_POINTS
  pitchWeight: 0.8,        // lib/results.ts:33 DEFAULT_PITCH_WEIGHT
  bonusMultiplierCap: 3.0, // lib/types.ts:260 BONUS_MULTIPLIER_CAP
};

// ============================================================================
// DB row type (snake_case)
// ============================================================================

type EventSettingsRow = {
  event_id: string;
  xp_first_submission: number | string | null;
  xp_validate_v1: number | string | null;
  xp_validate_v2: number | string | null;
  eng_submitted: number | string | null;
  eng_reviewed: number | string | null;
  eng_validated: number | string | null;
  pitch_weight: number | string | null;
  bonus_multiplier_cap: number | string | null;
};

function mapSettings(row: EventSettingsRow): Partial<EventSettings> {
  const num = (v: number | string | null | undefined, fallback: number): number => {
    if (v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };
  return {
    xpFirstSubmission: num(row.xp_first_submission, DEFAULT_EVENT_SETTINGS.xpFirstSubmission),
    xpValidateV1: num(row.xp_validate_v1, DEFAULT_EVENT_SETTINGS.xpValidateV1),
    xpValidateV2: num(row.xp_validate_v2, DEFAULT_EVENT_SETTINGS.xpValidateV2),
    engSubmitted: num(row.eng_submitted, DEFAULT_EVENT_SETTINGS.engSubmitted),
    engReviewed: num(row.eng_reviewed, DEFAULT_EVENT_SETTINGS.engReviewed),
    engValidated: num(row.eng_validated, DEFAULT_EVENT_SETTINGS.engValidated),
    pitchWeight: num(row.pitch_weight, DEFAULT_EVENT_SETTINGS.pitchWeight),
    bonusMultiplierCap: num(row.bonus_multiplier_cap, DEFAULT_EVENT_SETTINGS.bonusMultiplierCap),
  };
}

// ============================================================================
// Server-side accessor
// ============================================================================

/**
 * Returns the event_settings row for the given event, merged over
 * DEFAULT_EVENT_SETTINGS. Unknown / missing columns fall back to defaults
 * (pre-migration tolerance).
 *
 * - Demo mode (!hasSupabaseEnv()): returns DEFAULT_EVENT_SETTINGS unchanged.
 * - Pre-migration (table absent): Supabase error -> DEFAULT_EVENT_SETTINGS.
 * - eventId null: returns DEFAULT_EVENT_SETTINGS (caller convenience).
 * - Never throws.
 */
export async function getEventSettings(eventId: string | null): Promise<EventSettings> {
  if (!eventId || !hasSupabaseEnv()) return DEFAULT_EVENT_SETTINGS;

  const supabase = await createClient();
  if (!supabase) return DEFAULT_EVENT_SETTINGS;

  const { data, error } = await supabase
    .from("event_settings")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !data) return DEFAULT_EVENT_SETTINGS;

  return { ...DEFAULT_EVENT_SETTINGS, ...mapSettings(data as EventSettingsRow) };
}
