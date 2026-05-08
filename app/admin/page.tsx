import { Download, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import {
  checkpointLabel,
  checkpoints,
  xpSummary,
} from "@/lib/data";
import { getCohortWorkflow } from "@/lib/workflow-data";

export default async function AdminPage() {
  const workflow = await getCohortWorkflow();
  const { startups, deliverables, bonuses: bonusEvents } = workflow;
  const totalConfirmed = startups.reduce((sum, startup) => sum + xpSummary(startup.id).confirmedXp, 0);
  const totalPending = startups.reduce((sum, startup) => sum + xpSummary(startup.id).pendingXp, 0);
  const acceptedBonuses = bonusEvents.filter((bonus) => bonus.status === "accepted");
  const pendingReview =
    deliverables.filter((item) => item.status === "submitted").length +
    bonusEvents.filter((bonus) => bonus.status === "submitted").length;

  return (
    <AppShell role="eic_admin">
      <PageHeader
        eyebrow="EIC admin"
        title="Cohort analytics for checkpoint-driven startup progress."
        description="Operational overview across maturity, XP, validations, sales signals, and blockers."
        actions={
          <>
            <a className="button primary" href="/api/export/kpi-snapshot.csv">
              <Download aria-hidden="true" size={17} />
              KPI CSV
            </a>
            <a className="button" href="/admin/startups">Manage startups</a>
          </>
        }
      />

      <section className="grid metrics">
        <div className="metric">
          <span>Confirmed XP</span>
          <strong>{totalConfirmed}</strong>
          <small>Accepted deliverables and counted bonus XP.</small>
        </div>
        <div className="metric">
          <span>Pending XP</span>
          <strong>{totalPending}</strong>
          <small>Momentum XP waiting for validation.</small>
        </div>
        <div className="metric">
          <span>Accepted bonuses</span>
          <strong>{acceptedBonuses.length}</strong>
          <small>Sales, demos, interviews, waitlist, retention.</small>
        </div>
        <div className="metric">
          <span>Validation queue</span>
          <strong>{pendingReview}</strong>
          <small>Deliverables and bonus claims.</small>
        </div>
      </section>

      <div className="content-grid" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Checkpoint distribution</h2>
              <p className="muted">Where each startup is currently focused.</p>
            </div>
            <TrendingUp aria-hidden="true" color="var(--green)" size={20} />
          </div>
          <div className="panel-body stack">
            {checkpoints.map((checkpoint) => {
              const count = startups.filter((startup) => startup.checkpointFocus === checkpoint.id).length;
              const pct = Math.round((count / startups.length) * 100);
              return (
                <article className="mission-card" key={checkpoint.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <h3>{checkpoint.label}</h3>
                    <Badge tone="blue">{count} startups</Badge>
                  </div>
                  <p className="muted">{checkpoint.description}</p>
                  <div className="progress" aria-label={`${pct}% of cohort`}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="stack">
          <section className="panel">
            <div className="panel-header">
              <h2>Maturity overview</h2>
            </div>
            <div className="panel-body">
              <ul className="small-list">
                {["ideation", "pre_incubation", "incubation"].map((phase) => (
                  <li key={phase}>
                    <span>{phase.replace("_", " ")}</span>
                    <Badge tone="green">{startups.filter((startup) => startup.maturityPhase === phase).length}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>Startup health</h2>
            </div>
            <div className="panel-body">
              <ul className="small-list">
                {startups.map((startup) => (
                  <li key={startup.id}>
                    <span>
                      <strong>{startup.name}</strong>
                      <br />
                      <span className="muted">{checkpointLabel(startup.checkpointFocus)} · {startup.stage}</span>
                    </span>
                    <Badge tone={startup.healthStatus === "strong" ? "green" : "gold"}>{startup.healthStatus}</Badge>
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
