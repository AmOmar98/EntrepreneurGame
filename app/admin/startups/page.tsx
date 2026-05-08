import { Plus, Save, UserPlus } from "lucide-react";
import {
  assignCoach,
  assignProjectMember,
  createStartup,
  updateStartupStatus,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { checkpoints, profiles, stages, startups } from "@/lib/data";

export default function AdminStartupsPage() {
  const founders = profiles.filter((profile) => profile.role === "founder");
  const coaches = profiles.filter((profile) => profile.role !== "founder");

  return (
    <AppShell role="eic_admin">
      <PageHeader
        eyebrow="Startup admin"
        title="Create startups, assign teams, and keep maturity status clean."
        description="Admin-created startups reduce onboarding mistakes and keep pilot permissions simple."
      />

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Startup records</h2>
              <p className="muted">Update stage, maturity, checkpoint focus, health, and next action.</p>
            </div>
          </div>
          <div className="panel-body stack">
            {startups.map((startup) => (
              <article className="mission-card" key={startup.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <h3>{startup.name}</h3>
                    <p className="muted">{startup.sector} · {startup.cohort}</p>
                  </div>
                  <Badge tone={startup.healthStatus === "strong" ? "green" : "gold"}>{startup.healthStatus}</Badge>
                </div>
                <form action={updateStartupStatus} className="stack">
                  <input type="hidden" name="projectId" value={startup.id} />
                  <div className="admin-form-grid">
                    <label className="form-row">
                      Stage
                      <select className="select" name="stage" defaultValue={startup.stage}>
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.id}>{stage.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="form-row">
                      Maturity
                      <select className="select" name="maturityPhase" defaultValue={startup.maturityPhase}>
                        <option value="ideation">Ideation</option>
                        <option value="pre_incubation">Pre-incubation</option>
                        <option value="incubation">Incubation</option>
                      </select>
                    </label>
                    <label className="form-row">
                      Checkpoint
                      <select className="select" name="checkpointFocus" defaultValue={startup.checkpointFocus}>
                        {checkpoints.map((checkpoint) => (
                          <option key={checkpoint.id} value={checkpoint.id}>{checkpoint.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="form-row">
                      Health
                      <select className="select" name="healthStatus" defaultValue={startup.healthStatus}>
                        <option value="strong">Strong</option>
                        <option value="watch">Watch</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </label>
                    <label className="form-row">
                      Status
                      <select className="select" name="status" defaultValue={startup.status}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="dropped">Dropped</option>
                        <option value="graduated">Graduated</option>
                      </select>
                    </label>
                    <label className="form-row wide">
                      Next action
                      <input className="input" name="nextAction" defaultValue={startup.nextAction} />
                    </label>
                  </div>
                  <button className="button primary" type="submit">
                    <Save aria-hidden="true" size={17} />
                    Save status
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>

        <aside className="stack">
          <section className="panel">
            <div className="panel-header">
              <h2>Create startup</h2>
              <Plus aria-hidden="true" color="var(--green)" size={20} />
            </div>
            <form action={createStartup} className="panel-body stack">
              <label className="form-row">
                Name
                <input className="input" name="name" required />
              </label>
              <label className="form-row">
                Slug
                <input className="input" name="slug" required placeholder="startup-name" />
              </label>
              <label className="form-row">
                Sector
                <input className="input" name="sector" required />
              </label>
              <label className="form-row">
                Summary
                <textarea className="textarea" name="summary" required />
              </label>
              <label className="form-row">
                Next action
                <input className="input" name="nextAction" required />
              </label>
              <input type="hidden" name="cohort" value="pilot-2026-S1" />
              <input type="hidden" name="maturityPhase" value="ideation" />
              <input type="hidden" name="checkpointFocus" value="make_it" />
              <input type="hidden" name="stage" value="L0_diagnostic" />
              <button className="button primary" type="submit">Create</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Assign member</h2>
              <UserPlus aria-hidden="true" color="var(--green)" size={20} />
            </div>
            <form action={assignProjectMember} className="panel-body stack">
              <label className="form-row">
                Startup
                <select className="select" name="projectId">
                  {startups.map((startup) => (
                    <option key={startup.id} value={startup.id}>{startup.name}</option>
                  ))}
                </select>
              </label>
              <label className="form-row">
                Founder
                <select className="select" name="userId">
                  {founders.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.fullName}</option>
                  ))}
                </select>
              </label>
              <label className="form-row">
                Role
                <select className="select" name="roleInProject">
                  <option value="owner">Owner</option>
                  <option value="co_founder">Co-founder</option>
                  <option value="contributor">Contributor</option>
                </select>
              </label>
              <button className="button primary" type="submit">Assign founder</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Assign coach</h2>
            </div>
            <form action={assignCoach} className="panel-body stack">
              <label className="form-row">
                Startup
                <select className="select" name="projectId">
                  {startups.map((startup) => (
                    <option key={startup.id} value={startup.id}>{startup.name}</option>
                  ))}
                </select>
              </label>
              <label className="form-row">
                Coach
                <select className="select" name="coachId">
                  {coaches.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.fullName}</option>
                  ))}
                </select>
              </label>
              <button className="button primary" type="submit">Assign coach</button>
            </form>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
