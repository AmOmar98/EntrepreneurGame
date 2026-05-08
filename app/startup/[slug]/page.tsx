import { notFound } from "next/navigation";
import { ExternalLink, Mail, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { ProofWorkflow } from "@/components/proof-workflow";
import {
  bonusRules,
  checkpointLabel,
  checkpointSummaryFrom,
  deliverableMailBody,
  mailtoUrl,
  xpSummaryFrom,
} from "@/lib/data";
import { getActiveBootcampDeliverables, getStartupWorkflow } from "@/lib/workflow-data";

export default async function StartupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workflow = await getStartupWorkflow(slug);
  const startup = workflow.startup;
  if (!startup) notFound();

  const startupDeliverables = workflow.deliverables;
  const startupBonuses = workflow.bonuses;
  const latestActivity = workflow.activity;
  const xp = xpSummaryFrom(startup, startupDeliverables, startupBonuses);
  const checkpoints = checkpointSummaryFrom(startupDeliverables, startupBonuses);
  const { quests: activeQuests, source: questSource } = await getActiveBootcampDeliverables();
  const defaultMail = mailtoUrl({
    to: [startup.coach.email, "eic@uemf.ma"],
    subject: `Preuve a valider - ${startup.name}`,
    body: deliverableMailBody({
      startup,
      title: "Nouvelle preuve",
      checkpoint: startup.checkpointFocus,
      docUrl: "https://",
      message: "Merci de valider cette preuve dans le dashboard.",
    }),
  });

  return (
    <AppShell role="founder">
      <PageHeader
        eyebrow="Startup interface"
        title={`${startup.name}: make it, sell it, look after it.`}
        description={startup.summary}
        actions={
          <>
            <a className="button" href={defaultMail}>
              <Mail aria-hidden="true" size={17} />
              Mail coach
            </a>
            <a className="button primary" href="#submit-deliverable">
              <Send aria-hidden="true" size={17} />
              Submit proof
            </a>
          </>
        }
      />

      <section className="grid metrics">
        <div className="metric">
          <span>Confirmed XP</span>
          <strong>{xp.confirmedXp}</strong>
          <small>{xp.toNextGate} XP to next technical gate</small>
        </div>
        <div className="metric">
          <span>Pending XP</span>
          <strong>{xp.pendingXp}</strong>
          <small>Visible momentum before coach validation</small>
        </div>
        <div className="metric">
          <span>Prestige XP</span>
          <strong>{xp.prestigeXp}</strong>
          <small>Accepted bonus beyond stage cap</small>
        </div>
        <div className="metric">
          <span>Bonus cap</span>
          <strong>{xp.bonusCapUsed}%</strong>
          <small>{xp.bonusXp} / {xp.bonusCap} XP counted for stage</small>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-header">
          <div>
            <h2>Checkpoint journey</h2>
            <p className="muted">Founder-facing progress for ideation, pre-incubation, and incubation.</p>
          </div>
          <Badge tone="blue">{startup.stage.replace("_", " ")}</Badge>
        </div>
        <div className="panel-body checkpoint-grid">
          {checkpoints.map((checkpoint) => {
            const Icon = checkpoint.icon;
            return (
              <article className={`checkpoint-card ${startup.checkpointFocus === checkpoint.id ? "active" : ""}`} key={checkpoint.id}>
                <header>
                  <Icon aria-hidden="true" size={22} />
                  <div>
                    <h3>{checkpoint.label}</h3>
                    <p className="muted">{checkpoint.description}</p>
                  </div>
                </header>
                <div className="progress" aria-label={`${checkpoint.completion}% checkpoint progress`}>
                  <span style={{ width: `${checkpoint.completion}%` }} />
                </div>
                <div className="mission-meta">
                  <Badge tone="green">{checkpoint.xp} XP</Badge>
                  <Badge tone="gold">{checkpoint.pending} pending</Badge>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-header">
          <div>
            <h2>Bootcamp quest board</h2>
            <p className="muted">Active deliverables chosen by coaches/admins. Complete quests with proof links.</p>
          </div>
          <Badge tone="green">{activeQuests.length} active quests</Badge>
        </div>
        <div className="panel-body quest-grid">
          {questSource === "demo" ? (
            <p className="muted">Demo quest board shown until Supabase bootcamp quests are seeded.</p>
          ) : null}
          {activeQuests.map((quest) => (
            <article className="quest-card" key={quest.id}>
              <div className="quest-time">
                <strong>{quest.start}</strong>
                <span>{quest.day.replace("_", " ")}</span>
              </div>
              <div className="stack">
                <div>
                  <h3>{quest.title}</h3>
                  <p className="muted">{quest.objective}</p>
                </div>
                <div className="mission-meta">
                  <Badge tone="blue">{checkpointLabel(quest.checkpoint)}</Badge>
                  <Badge tone="green">{quest.xp} XP</Badge>
                  <Badge tone={quest.isRequired ? "gold" : "blue"}>{quest.isRequired ? "required" : "optional"}</Badge>
                </div>
                <p><strong>Deliverable:</strong> {quest.expectedOutput}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="content-grid" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Deliverables</h2>
              <p className="muted">Doc links are saved, then sent by mailto to the coach plus EIC.</p>
            </div>
          </div>
          <div className="panel-body stack">
            {startupDeliverables.map((item) => (
              <article className="mission-card" key={item.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <h3>{item.title}</h3>
                    <p className="muted">{item.description}</p>
                  </div>
                  <Badge>{item.status}</Badge>
                </div>
                <div className="mission-meta">
                  <Badge tone="blue">{checkpointLabel(item.checkpoint)}</Badge>
                  <Badge tone="green">{item.baseXp} XP</Badge>
                  <Badge tone="gold">{item.pendingXp} pending</Badge>
                  <a className="button" href={item.docUrl} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden="true" size={17} />
                    Open doc
                  </a>
                </div>
                {item.reviewNotes ? <p className="muted">{item.reviewNotes}</p> : null}
              </article>
            ))}
          </div>
        </section>

        <aside className="stack">
          <section className="panel">
            <div className="panel-header">
              <h2>Team and coach</h2>
            </div>
            <div className="panel-body">
              <ul className="small-list">
                {startup.team.map((member) => (
                  <li key={member.userId}>
                    <span>
                      <strong>{member.fullName}</strong>
                      <br />
                      <span className="muted">{member.roleInProject} · {member.email}</span>
                    </span>
                  </li>
                ))}
                <li>
                  <span>
                    <strong>{startup.coach.fullName}</strong>
                    <br />
                    <span className="muted">coach · {startup.coach.email}</span>
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Next action</h2>
            </div>
            <div className="panel-body stack">
              <Badge tone={startup.healthStatus === "strong" ? "green" : "gold"}>{startup.healthStatus}</Badge>
              <p>{startup.nextAction}</p>
              <p className="muted">{startup.coachNotes}</p>
            </div>
          </section>
        </aside>
      </div>

      <ProofWorkflow startup={startup} />

      <div className="two-col" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>Bonus history</h2>
          </div>
          <div className="panel-body stack">
            {startupBonuses.map((bonus) => (
              <article className="mission-card" key={bonus.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <h3>{bonus.title}</h3>
                  <Badge>{bonus.status}</Badge>
                </div>
                <p className="muted">{bonusRules[bonus.type].description}</p>
                <div className="mission-meta">
                  <Badge tone="blue">{checkpointLabel(bonus.checkpoint)}</Badge>
                  <Badge tone="green">{bonus.awardedXp || bonus.claimedXp} XP</Badge>
                  <Badge tone="gold">{bonus.prestigeXp} prestige</Badge>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Activity</h2>
          </div>
          <div className="panel-body stack">
            {latestActivity.map((item) => (
              <article className="timeline-item" key={item.id}>
                <h3>{item.action}</h3>
                <p className="muted">{item.actor} · {new Date(item.createdAt).toLocaleString("fr-FR")}</p>
                <p>{item.metadata}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
