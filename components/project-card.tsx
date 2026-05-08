import { Badge } from "@/components/badge";
import { type Startup, checkpointLabel, stageProgress, xpSummary } from "@/lib/data";

export function ProjectCard({ project }: { project: Startup }) {
  const progress = stageProgress(project.stage, project.totalXp);
  const xp = xpSummary(project.id);

  return (
    <article className="project-card">
      <header>
        <div className="stack" style={{ gap: 5 }}>
          <h3>{project.name}</h3>
          <span className="muted">{project.team[0]?.fullName ?? "No owner assigned"}</span>
        </div>
        <Badge tone={project.healthStatus === "strong" ? "green" : "gold"}>{project.healthStatus}</Badge>
      </header>
      <div className="stack">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span className="muted">{xp.confirmedXp} XP</span>
          <span className="muted">{progress}% to next gate</span>
        </div>
        <div className="progress" aria-label={`${progress}% progress`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="muted">{project.team.length} members, {checkpointLabel(project.checkpointFocus)} focus</p>
      <Badge tone={project.healthStatus === "strong" ? "green" : "gold"}>{project.nextAction}</Badge>
    </article>
  );
}
