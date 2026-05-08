import Image from "next/image";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { OnboardingKycForm } from "@/components/onboarding-kyc-form";
import { PageHeader } from "@/components/page-header";
import { getStartup } from "@/lib/data";
import { getOnboardingWorkflow } from "@/lib/workflow-data";

export default async function OnboardingPage() {
  const startup = getStartup("atlas-soil")!;
  const owner = startup.team[0];
  const { founder, project, source } = await getOnboardingWorkflow(startup.id, owner.userId);

  return (
    <AppShell role="founder">
      <PageHeader
        eyebrow="Pre-bootcamp onboarding"
        title="Create the simplest useful founder and project holder profile."
        description="Before the bootcamp starts, founders add identity basics, role, logo, project one-liner, problem, and target customer. EIC verifies it, then the game board opens."
      />

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Founder and project KYC</h2>
              <p className="muted">Keep it light: enough to identify the project holders and prepare coaches.</p>
            </div>
            <Badge tone={project?.status === "verified" ? "green" : "gold"}>{project?.status ?? "missing"}</Badge>
          </div>
          <div className="panel-body">
            {source === "demo" ? (
              <p className="muted">Demo KYC data is active. Supabase saves are used when the project is connected to real IDs.</p>
            ) : null}
            <OnboardingKycForm startup={startup} founder={founder} project={project} />
          </div>
        </section>

        <aside className="stack">
          <section className="panel">
            <div className="panel-header">
              <h2>Profile preview</h2>
            </div>
            <div className="panel-body stack">
              {project?.logoUrl ? (
                <Image src={project.logoUrl} alt={`${startup.name} logo`} width={86} height={86} />
              ) : null}
              <h3>{project?.legalName ?? startup.name}</h3>
              <p className="muted">{project?.ideaOneLiner ?? startup.summary}</p>
              <div className="mission-meta">
                <Badge tone="blue">{project?.projectHolderType ?? "student"}</Badge>
                <Badge tone={founder?.status === "verified" ? "green" : "gold"}>{founder?.status ?? "missing"}</Badge>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>Unlock checklist</h2>
              <ShieldCheck aria-hidden="true" color="var(--green)" size={20} />
            </div>
            <div className="panel-body">
              <ul className="small-list">
                {[
                  "Founder phone and identity reference",
                  "Founder role in project",
                  "Project logo",
                  "One-line idea",
                  "Problem and target customer",
                ].map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <CheckCircle2 aria-hidden="true" color="var(--green)" size={18} />
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
