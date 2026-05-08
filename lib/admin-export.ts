// Phase 4 / Plan 04 - Server-side accessor for /admin/export/players.csv (ADMIN-04).
// Returns one row per Player in the current event with scores, submission counts and
// member emails. Dual-mode safe: returns [] when Supabase is not configured.
// Never throws - errors are logged and the function returns [] so the export route
// can still emit a header-only CSV.
import { createClient } from "@/utils/supabase/server";
import type { LevelId, PlayerStatus, TeamRole } from "@/lib/types";

export type PlayerExportRow = {
  team_slug: string;
  team_name: string;
  current_level: string;
  status: string;
  score_project: number;
  score_engagement: number;
  submissions_count: number;
  validated_count: number;
  leader_email: string;
  member_emails: string; // ';'-joined non-leader emails
};

type PlayerRow = {
  id: string;
  cohort_id: string;
  slug: string;
  name: string;
  current_level: LevelId;
  status: PlayerStatus;
  score_project: number | string;
  score_engagement: number | string;
};

type SubmissionRow = {
  player_id: string;
  status: string;
};

type MemberRow = {
  player_id: string;
  user_id: string;
  team_role: TeamRole;
};

type ProfileRow = {
  user_id: string;
  email: string | null;
};

function num(v: number | string): number {
  return typeof v === "string" ? Number(v) : v;
}

export async function getPlayersExportRows(): Promise<PlayerExportRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  try {
    // 1. Resolve current event.
    const { data: eventRow, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (eventErr) {
      console.error("[admin-export] events query failed", eventErr);
      return [];
    }
    if (!eventRow) return [];
    const eventId = (eventRow as { id: string }).id;

    // 2. Cohorts of this event.
    const { data: cohortRows, error: cohortErr } = await supabase
      .from("cohorts")
      .select("id")
      .eq("event_id", eventId);
    if (cohortErr) {
      console.error("[admin-export] cohorts query failed", cohortErr);
      return [];
    }
    const cohortIds = (cohortRows ?? []).map((r) => (r as { id: string }).id);
    if (cohortIds.length === 0) return [];

    // 3. Players in those cohorts.
    const { data: playerRows, error: playerErr } = await supabase
      .from("players")
      .select(
        "id, cohort_id, slug, name, current_level, status, score_project, score_engagement",
      )
      .in("cohort_id", cohortIds);
    if (playerErr) {
      console.error("[admin-export] players query failed", playerErr);
      return [];
    }
    const players = ((playerRows ?? []) as PlayerRow[]);
    if (players.length === 0) return [];
    const playerIds = players.map((p) => p.id);

    // 4. Submissions aggregate counts.
    const { data: subRows, error: subErr } = await supabase
      .from("submissions")
      .select("player_id, status")
      .in("player_id", playerIds);
    if (subErr) {
      console.error("[admin-export] submissions query failed", subErr);
      return [];
    }
    const submissions = (subRows ?? []) as SubmissionRow[];
    const submissionsByPlayer = new Map<string, number>();
    const validatedByPlayer = new Map<string, number>();
    for (const s of submissions) {
      submissionsByPlayer.set(s.player_id, (submissionsByPlayer.get(s.player_id) ?? 0) + 1);
      if (s.status === "validated") {
        validatedByPlayer.set(s.player_id, (validatedByPlayer.get(s.player_id) ?? 0) + 1);
      }
    }

    // 5. Player members for those players.
    const { data: memberRows, error: memberErr } = await supabase
      .from("player_members")
      .select("player_id, user_id, team_role")
      .in("player_id", playerIds);
    if (memberErr) {
      console.error("[admin-export] player_members query failed", memberErr);
      return [];
    }
    const members = (memberRows ?? []) as MemberRow[];

    // 6. Profiles for those user_ids -> email map.
    const userIds = Array.from(new Set(members.map((m) => m.user_id)));
    const emailByUserId = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profileRows, error: profileErr } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);
      if (profileErr) {
        console.error("[admin-export] profiles query failed", profileErr);
        return [];
      }
      for (const p of (profileRows ?? []) as ProfileRow[]) {
        if (p.email) emailByUserId.set(p.user_id, p.email);
      }
    }

    // 7. Bucket members per player; pick leader (team_role='owner', fallback first).
    const membersByPlayer = new Map<string, MemberRow[]>();
    for (const m of members) {
      const arr = membersByPlayer.get(m.player_id) ?? [];
      arr.push(m);
      membersByPlayer.set(m.player_id, arr);
    }

    const rows: PlayerExportRow[] = players.map((p) => {
      const playerMembers = membersByPlayer.get(p.id) ?? [];
      const owner = playerMembers.find((m) => m.team_role === "owner") ?? playerMembers[0];
      const leaderEmail = owner ? emailByUserId.get(owner.user_id) ?? "" : "";
      const memberEmails = playerMembers
        .filter((m) => m.user_id !== owner?.user_id)
        .map((m) => emailByUserId.get(m.user_id) ?? "")
        .filter((e) => e.length > 0)
        .join(";");

      return {
        team_slug: p.slug,
        team_name: p.name,
        current_level: p.current_level,
        status: p.status,
        score_project: num(p.score_project),
        score_engagement: num(p.score_engagement),
        submissions_count: submissionsByPlayer.get(p.id) ?? 0,
        validated_count: validatedByPlayer.get(p.id) ?? 0,
        leader_email: leaderEmail,
        member_emails: memberEmails,
      };
    });

    // 8. Sort by score_project DESC, then name ASC.
    rows.sort((a, b) => {
      if (b.score_project !== a.score_project) return b.score_project - a.score_project;
      return a.team_name.localeCompare(b.team_name);
    });

    return rows;
  } catch (e) {
    console.error("[admin-export] unexpected error", e);
    return [];
  }
}
