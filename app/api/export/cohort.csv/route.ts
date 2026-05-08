import { csvResponse, toCsv } from "@/lib/csv";
import { checkpointLabel, startups, xpSummary } from "@/lib/data";

export function GET() {
  const rows = startups.map((project) => {
    const xp = xpSummary(project.id);
    return ({
    project_id: project.id,
    name: project.name,
    cohort: project.cohort,
    stage: project.stage,
    checkpoint_focus: checkpointLabel(project.checkpointFocus),
    maturity_phase: project.maturityPhase,
    confirmed_xp: xp.confirmedXp,
    pending_xp: xp.pendingXp,
    prestige_xp: xp.prestigeXp,
    members_count: project.team.length,
    last_activity: project.lastActivity,
    status: project.status,
    health_status: project.healthStatus,
  });
  });

  return csvResponse("cohort.csv", toCsv(rows));
}
