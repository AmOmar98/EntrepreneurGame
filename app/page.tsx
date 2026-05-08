import { Download, Mail, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import {
  dashboardMetrics,
  checkpointLabel,
  deliverables,
  mailtoUrl,
  startups,
  reviewReminderBody,
  stages,
  xpSummary,
} from "@/lib/data";

export default function HomePage() {
  const metrics = dashboardMetrics();
  const oldestSubmission = deliverables.find((deliverable) => deliverable.status === "submitted");
  const oldestStartup = oldestSubmission ? startups.find((startup) => startup.id === oldestSubmission.projectId) : null;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Pilot cockpit"
        title="Run the EIC journey through Make it, Sell it, Look after it."
        description="Track startup XP, pending proof, coach validation, sales signals, and retention loops."
        actions={
          <>
            <a className="button primary" href="/api/export/cohort.csv">
              <Download aria-hidden="true" size={17} />
              Cohort CSV
            </a>
            {oldestSubmission ? (
              <a
                className="button"
                href={mailtoUrl({
                  to: "eic@uemf.ma",
                  subject: `Validation reminder: ${oldestStartup?.name ?? "startup"}`,
                  body: reviewReminderBody(oldestStartup?.name ?? "startup", oldestStartup?.coach.fullName ?? "coach"),
                })}
              >
                <Mail aria-hidden="true" size={17} />
                Nudge reviewer
              </a>
            ) : null}
          </>
        }
      />

      <section className="grid metrics" aria-label="Pilot metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div className="metric" key={metric.label}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span>{metric.label}</span>
                <Icon aria-hidden="true" color="var(--green)" size={20} />
              </div>
              <strong>{metric.value}</strong>
              <small>{metric.hint}</small>
            </div>
          );
        })}
      </section>

      <div className="content-grid" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Founder progression</h2>
              <p className="muted">XP gates, checkpoint focus, and validation state for active startups.</p>
            </div>
            <RefreshCw aria-hidden="true" color="var(--muted)" size={20} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Stage</th>
                  <th>XP</th>
                  <th>Status</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {startups.map((project) => {
                  const xp = xpSummary(project.id);
                  return (
                  <tr key={project.id}>
                    <td>
                      <strong>{project.name}</strong>
                      <br />
                      <span className="muted">{project.team[0]?.fullName}</span>
                    </td>
                    <td>{checkpointLabel(project.checkpointFocus)}</td>
                    <td>{xp.confirmedXp} + {xp.pendingXp} pending</td>
                    <td>
                      <Badge tone={project.healthStatus === "strong" ? "green" : "gold"}>{project.healthStatus}</Badge>
                    </td>
                    <td>{project.lastActivity}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="stack">
          <section className="panel">
            <div className="panel-header">
              <h2>Stage gates</h2>
            </div>
            <div className="panel-body">
              <div className="stage-track">
                {stages.map((stage) => (
                  <div className="stage" key={stage.id}>
                    <strong>{stage.label}</strong>
                    <span>{stage.targetXp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>Validation queue</h2>
            </div>
            <div className="panel-body">
              <ul className="small-list">
                {deliverables.filter((item) => item.status !== "accepted").map((item) => (
                  <li key={item.id}>
                    <span>
                      <strong>{item.title}</strong>
                      <br />
                      <span className="muted">{checkpointLabel(item.checkpoint)}</span>
                    </span>
                    <Badge>{item.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
