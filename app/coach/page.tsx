import { Mail, ShieldCheck } from "lucide-react";
import { reviewBonusEvent, reviewDeliverable } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import {
  bonusRules,
  checkpointLabel,
  getStartup,
  mailtoUrl,
  reviewReminderBody,
  stageTarget,
  xpSummary,
} from "@/lib/data";
import { getCohortWorkflow } from "@/lib/workflow-data";

export default async function CoachPage() {
  const workflow = await getCohortWorkflow();
  const { startups, deliverables, bonuses: bonusEvents } = workflow;
  const pendingDeliverables = deliverables.filter((item) => item.status === "submitted" || item.status === "needs_changes");
  const pendingBonuses = bonusEvents.filter((item) => item.status === "submitted");
  const watchList = startups.filter((startup) => startup.healthStatus !== "strong");

  return (
    <AppShell role="mentor">
      <PageHeader
        eyebrow="Coach overview"
        title="Portfolio follow-up for ideation and pre-incubation teams."
        description="Validate proof, spot weak checkpoints, and nudge founders through mailto."
      />

      <section className="grid metrics">
        <div className="metric">
          <span>Assigned startups</span>
          <strong>{startups.length}</strong>
          <small>Demo portfolio view; Supabase filters by coach assignment.</small>
        </div>
        <div className="metric">
          <span>Deliverables to review</span>
          <strong>{pendingDeliverables.length}</strong>
          <small>Submitted or needs changes.</small>
        </div>
        <div className="metric">
          <span>Bonus claims</span>
          <strong>{pendingBonuses.length}</strong>
          <small>Sales, demo, waitlist, interviews, retention.</small>
        </div>
        <div className="metric">
          <span>Watch list</span>
          <strong>{watchList.length}</strong>
          <small>Health status requires coach attention.</small>
        </div>
      </section>

      <div className="content-grid" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Portfolio</h2>
              <p className="muted">Weak checkpoints and next actions for each startup.</p>
            </div>
          </div>
          <div className="panel-body stack">
            {startups.map((startup) => {
              const xp = xpSummary(startup.id);
              return (
                <article className="mission-card" key={startup.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <h3>{startup.name}</h3>
                      <p className="muted">{startup.sector} · {startup.maturityPhase.replace("_", " ")}</p>
                    </div>
                    <Badge tone={startup.healthStatus === "strong" ? "green" : "gold"}>{startup.healthStatus}</Badge>
                  </div>
                  <div className="progress" aria-label={`${xp.progress}% XP progress`}>
                    <span style={{ width: `${xp.progress}%` }} />
                  </div>
                  <p>{startup.nextAction}</p>
                  <div className="mission-meta">
                    <Badge tone="blue">{checkpointLabel(startup.checkpointFocus)}</Badge>
                    <Badge tone="green">{xp.confirmedXp} XP</Badge>
                    <Badge tone="gold">{xp.pendingXp} pending</Badge>
                    <a
                      className="button"
                      href={mailtoUrl({
                        to: startup.team.map((member) => member.email),
                        subject: `Next action - ${startup.name}`,
                        body: reviewReminderBody(startup.name, startup.coach.fullName),
                      })}
                    >
                      <Mail aria-hidden="true" size={17} />
                      Nudge
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="stack">
          <section className="panel">
            <div className="panel-header">
              <h2>Deliverables</h2>
            </div>
            <div className="panel-body stack">
              {pendingDeliverables.map((item) => {
                const startup = getStartup(item.projectId);
                return (
                  <article className="mission-card" key={item.id}>
                    <h3>{item.title}</h3>
                    <p className="muted">{startup?.name} · {checkpointLabel(item.checkpoint)}</p>
                    <form action={reviewDeliverable} className="stack">
                      <input type="hidden" name="id" value={item.id} />
                      <select className="select" name="status" defaultValue={item.status}>
                        <option value="needs_changes">Needs changes</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="accepted">Accepted</option>
                      </select>
                      <textarea className="textarea" name="reviewNotes" defaultValue={item.reviewNotes ?? ""} />
                      <button className="button primary" type="submit">
                        <ShieldCheck aria-hidden="true" size={17} />
                        Save review
                      </button>
                    </form>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Bonus claims</h2>
            </div>
            <div className="panel-body stack">
              {pendingBonuses.map((bonus) => (
                <article className="mission-card" key={bonus.id}>
                  <h3>{bonus.title}</h3>
                  <p className="muted">{getStartup(bonus.projectId)?.name} · {bonusRules[bonus.type].label}</p>
                  <form action={reviewBonusEvent} className="stack">
                    <input type="hidden" name="id" value={bonus.id} />
                    <input type="hidden" name="awardedXp" value={bonus.claimedXp} />
                    <input type="hidden" name="stageTarget" value={stageTarget(bonus.stage)} />
                    <select className="select" name="status" defaultValue="accepted">
                      <option value="accepted">Accepted</option>
                      <option value="needs_changes">Needs changes</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button className="button primary" type="submit">Validate {bonus.claimedXp} XP</button>
                  </form>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
