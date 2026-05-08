import { Download, FileDown, Mail } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { committeeBody, committees, getStartup, mailtoUrl } from "@/lib/data";

export default function CommitteePage() {
  const committee = committees[0];

  return (
    <AppShell role="committee_member">
      <PageHeader
        eyebrow="Committee"
        title="Prepare a go/no-go session without SMTP or SaaS side channels."
        description="CSV and EML exports are generated server-side; staff sends from their own client."
        actions={
          <>
            <a className="button primary" href={`/api/export/committee/${committee.id}`}>
              <Download aria-hidden="true" size={17} />
              CSV
            </a>
            <a className="button" href={`/api/export/eml/${committee.id}`}>
              <FileDown aria-hidden="true" size={17} />
              EML
            </a>
            <a
              className="button"
              href={mailtoUrl({
                to: committee.members.map((member) => member.email),
                subject: `Convocation comite ${committee.cohort}`,
                body: committeeBody(committee.id),
              })}
            >
              <Mail aria-hidden="true" size={17} />
              Mailto
            </a>
          </>
        }
      />
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>{committee.cohort}</h2>
              <p className="muted">
                {new Date(committee.scheduledAt).toLocaleString("fr-FR")} at {committee.location}
              </p>
            </div>
            <Badge>{committee.status}</Badge>
          </div>
          <div className="panel-body stack">
            {committee.dossiers.map((dossier) => {
              const project = getStartup(dossier.projectId);
              return (
                <article className="mission-card" key={dossier.projectId}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <h3>{project?.name ?? dossier.projectId}</h3>
                    <Badge tone="gold">{dossier.decision}</Badge>
                  </div>
                  <p className="muted">{dossier.notes}</p>
                  <div className="mission-meta">
                    <Badge tone="green">{project?.totalXp ?? 0} XP</Badge>
                    <Badge tone="blue">{project?.stage.replace("_", " ")}</Badge>
                    <Badge tone="green">{project?.team.length ?? 0} members</Badge>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Members</h2>
          </div>
          <div className="panel-body">
            <ul className="small-list">
              {committee.members.map((member) => (
                <li key={member.email}>
                  <span>
                    <strong>{member.name}</strong>
                    <br />
                    <span className="muted">{member.email}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
