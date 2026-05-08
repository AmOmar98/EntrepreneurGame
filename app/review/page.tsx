import { ExternalLink, Mail } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import {
  bonusEvents,
  bonusRules,
  checkpointLabel,
  deliverables,
  getStartup,
  mailtoUrl,
  reviewReminderBody,
} from "@/lib/data";

export default function ReviewPage() {
  const deliverableQueue = deliverables.filter((item) => item.status !== "accepted");
  const bonusQueue = bonusEvents.filter((item) => item.status !== "accepted");

  return (
    <AppShell role="reviewer">
      <PageHeader
        eyebrow="Review queue"
        title="Validate proof before XP becomes real."
        description="Deliverables and bonus claims stay pending until a coach or EIC admin accepts them."
        actions={
          <a className="button primary" href="/api/export/review-queue.csv">
            Queue CSV
          </a>
        }
      />
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Startup</th>
                <th>Checkpoint</th>
                <th>Status</th>
                <th>XP</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {deliverableQueue.map((item) => {
                const startup = getStartup(item.projectId);
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <br />
                      <span className="muted">Deliverable link</span>
                    </td>
                    <td>{startup?.name}</td>
                    <td>{checkpointLabel(item.checkpoint)}</td>
                    <td><Badge>{item.status}</Badge></td>
                    <td>{item.baseXp} + {item.pendingXp} pending</td>
                    <td>
                      <div className="toolbar">
                        <a className="button" href={item.docUrl} target="_blank" rel="noreferrer">
                          <ExternalLink aria-hidden="true" size={17} />
                          Doc
                        </a>
                        <a
                          className="button"
                          href={mailtoUrl({
                            to: startup?.coach.email ?? "eic@uemf.ma",
                            subject: `Validation reminder: ${startup?.name ?? "startup"}`,
                            body: reviewReminderBody(startup?.name ?? "startup", startup?.coach.fullName ?? "coach"),
                          })}
                        >
                          <Mail aria-hidden="true" size={17} />
                          Mail
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bonusQueue.map((bonus) => {
                const startup = getStartup(bonus.projectId);
                return (
                  <tr key={bonus.id}>
                    <td>
                      <strong>{bonus.title}</strong>
                      <br />
                      <span className="muted">{bonusRules[bonus.type].label}</span>
                    </td>
                    <td>{startup?.name}</td>
                    <td>{checkpointLabel(bonus.checkpoint)}</td>
                    <td><Badge>{bonus.status}</Badge></td>
                    <td>{bonus.claimedXp} claimed</td>
                    <td>
                      <a className="button" href={bonus.proofUrl} target="_blank" rel="noreferrer">
                        <ExternalLink aria-hidden="true" size={17} />
                        Proof
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
