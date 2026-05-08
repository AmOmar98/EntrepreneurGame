import { Mail } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { committeeBody, committees, inviteBody, mailtoUrl } from "@/lib/data";

export default function MailtoPage() {
  const committee = committees[0];

  return (
    <AppShell role="founder">
      <PageHeader
        eyebrow="Mailto lab"
        title="Staff-triggered emails with no SMTP server."
        description="Each action opens the default mail client with a short prefilled body."
      />
      <section className="grid project-grid">
        <article className="project-card">
          <h2>Founder invite</h2>
          <p className="muted">For D-3 account loading and onboarding.</p>
          <a
            className="button primary"
            href={mailtoUrl({
              to: "founder@example.com",
              subject: "Invitation EIC Venture Journey",
              body: inviteBody(),
            })}
          >
            <Mail aria-hidden="true" size={17} />
            Open draft
          </a>
        </article>
        <article className="project-card">
          <h2>Committee convocation</h2>
          <p className="muted">Short mailto body; use EML for longer batches.</p>
          <a
            className="button primary"
            href={mailtoUrl({
              to: committee.members.map((member) => member.email),
              subject: `Convocation comite ${committee.cohort}`,
              body: committeeBody(committee.id),
            })}
          >
            <Mail aria-hidden="true" size={17} />
            Open draft
          </a>
        </article>
      </section>
    </AppShell>
  );
}
