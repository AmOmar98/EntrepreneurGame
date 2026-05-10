// Quick 260510-k1f / B1 - Cohort Pulse aggregator (anonymised, dual-mode).
// Computes the per-level submission count for the connected Player's cohort.
// Strict R1 (score invisible cote Player): the public return type carries
// only {levelId, count, total}. Never returns Player names, slugs, ids, scores,
// ranks or any per-team row. Server-side aggregation only.
//
// Dual-mode contract (DATA-03):
//   - hasSupabaseEnv() === false : aggregate over seedPlayers() (demo).
//   - hasSupabaseEnv() === true  : aggregate over the connected Player's cohort
//     via missions/deliverable_templates/submissions tables.
//
// Audit greps (verified at task close):
//   grep -nE "name|slug|score|rank|percentile" lib/cohort-pulse.ts
//     -> only inside this header / R1 guard comments below.
//   grep -nE "select.*name|select.*slug" lib/cohort-pulse.ts
//     -> empty (we only ever select id / cohort_id / mission_id / level_id /
//     deliverable_template_id / status / player_id).
import { createClient } from "@/utils/supabase/server";
import { levelOrd } from "@/lib/journey";
import { seedPlayers } from "@/lib/seed";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type { LevelId, SubmissionStatus } from "@/lib/types";

// Pilot scope: 6 visible levels. L6_traction / L7_alumni are post-bootcamp
// (not part of the Hack-Days 2 jours), so the cohort pulse omits them.
const PULSE_LEVELS: LevelId[] = [
  "L0_diagnostic",
  "L1_problem",
  "L2_solution",
  "L3_market",
  "L4_business_model",
  "L5_pitch",
];

// Submission states considered "submitted" for the cohort pulse. We include
// every status >= submitted_v1 (i.e. not draft) so the pulse reflects what
// the cohort actually pushed, regardless of mentor verdict.
const SUBMITTED_STATUSES: SubmissionStatus[] = [
  "submitted_v1",
  "feedback_received",
  "submitted_v2",
  "validated",
];

// Public return shape - R1 anti-leak: NEVER add Player-identifying fields
// to this type. count + total are aggregates; levelId is a fixed enum.
export type CohortPulseEntry = {
  levelId: LevelId;
  count: number;
  total: number;
};

// Build entries with all-zero counts. Used as the safe fallback whenever
// Supabase is silent / errors / cohort cannot be resolved (no leak, no throw).
function emptyEntries(total: number): CohortPulseEntry[] {
  return PULSE_LEVELS.map((levelId) => ({ levelId, count: 0, total }));
}

// Demo-mode aggregation: a Player at level X is treated as having submitted
// every level strictly < X. Deterministic and plausible against seedPlayers.
function getCohortPulseDemo(): CohortPulseEntry[] {
  const players = seedPlayers();
  const total = players.length;
  return PULSE_LEVELS.map((levelId) => {
    const ord = levelOrd(levelId);
    const count = players.filter((p) => levelOrd(p.currentLevel) > ord).length;
    return { levelId, count, total };
  });
}

export async function getCohortPulse(
  userId: string | null,
): Promise<CohortPulseEntry[]> {
  // Demo mode (no Supabase env) -> aggregate over seed.
  if (!hasSupabaseEnv()) {
    return getCohortPulseDemo();
  }

  const supabase = await createClient();
  if (!supabase || !userId) {
    return emptyEntries(0);
  }

  // Resolve the Player's cohort. We only ever select the cohort_id - never
  // name / slug / scores. R1: the helper must never see those columns.
  const { data: membership, error: memberErr } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (memberErr || !membership) return emptyEntries(0);

  const { data: playerCohortRow, error: playerErr } = await supabase
    .from("players")
    .select("cohort_id")
    .eq("id", (membership as { player_id: string }).player_id)
    .maybeSingle();
  if (playerErr || !playerCohortRow) return emptyEntries(0);
  const cohortId = (playerCohortRow as { cohort_id: string }).cohort_id;
  if (!cohortId) return emptyEntries(0);

  // Total: active Players in the cohort. Only "id" column requested - count
  // is derived from the row count, no other fields read.
  const { count: totalCount, error: totalErr } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("cohort_id", cohortId)
    .eq("status", "active");
  if (totalErr) return emptyEntries(0);
  const total = totalCount ?? 0;
  if (total === 0) return emptyEntries(0);

  // Step A : map deliverable_template_id -> levelId via missions.level_id.
  // Three queries (no inner-join syntax) to stay portable across PostgREST
  // versions and RLS configs. We only read mission_id + level_id from the
  // missions table - no titles, no slugs.
  const { data: missionRows, error: missionErr } = await supabase
    .from("missions")
    .select("id, level_id")
    .in("level_id", PULSE_LEVELS);
  if (missionErr) return emptyEntries(total);

  const missionLevelById = new Map<string, LevelId>();
  for (const row of (missionRows ?? []) as { id: string; level_id: LevelId }[]) {
    missionLevelById.set(row.id, row.level_id);
  }
  if (missionLevelById.size === 0) return emptyEntries(total);

  const missionIds = Array.from(missionLevelById.keys());

  const { data: tplRows, error: tplErr } = await supabase
    .from("deliverable_templates")
    .select("id, mission_id")
    .in("mission_id", missionIds);
  if (tplErr) return emptyEntries(total);

  const templateLevelById = new Map<string, LevelId>();
  for (const row of (tplRows ?? []) as { id: string; mission_id: string }[]) {
    const lvl = missionLevelById.get(row.mission_id);
    if (lvl) templateLevelById.set(row.id, lvl);
  }
  if (templateLevelById.size === 0) return emptyEntries(total);

  // Step B : list cohort Player ids (id only, no other column read).
  const { data: cohortPlayerRows, error: cohortPlayersErr } = await supabase
    .from("players")
    .select("id")
    .eq("cohort_id", cohortId);
  if (cohortPlayersErr) return emptyEntries(total);
  const cohortPlayerIds = new Set<string>(
    ((cohortPlayerRows ?? []) as { id: string }[]).map((r) => r.id),
  );
  if (cohortPlayerIds.size === 0) return emptyEntries(total);

  // Step C : list submissions for those templates with submitted_* status.
  // We read player_id + deliverable_template_id only - never proof_url,
  // proof_text, scores, evaluations, or any Player-identifying join.
  const templateIds = Array.from(templateLevelById.keys());
  const { data: subRows, error: subErr } = await supabase
    .from("submissions")
    .select("player_id, deliverable_template_id")
    .in("deliverable_template_id", templateIds)
    .in("status", SUBMITTED_STATUSES);
  if (subErr) return emptyEntries(total);

  // Aggregate : per level, set of distinct cohort Player ids who submitted
  // at least one deliverable of that level. We discard any submission whose
  // player_id is not in the cohort (defensive, RLS should already filter).
  const distinctByLevel = new Map<LevelId, Set<string>>();
  for (const lvl of PULSE_LEVELS) distinctByLevel.set(lvl, new Set<string>());

  for (const row of (subRows ?? []) as {
    player_id: string;
    deliverable_template_id: string;
  }[]) {
    if (!cohortPlayerIds.has(row.player_id)) continue;
    const lvl = templateLevelById.get(row.deliverable_template_id);
    if (!lvl) continue;
    distinctByLevel.get(lvl)?.add(row.player_id);
  }

  return PULSE_LEVELS.map((levelId) => ({
    levelId,
    count: distinctByLevel.get(levelId)?.size ?? 0,
    total,
  }));
}
