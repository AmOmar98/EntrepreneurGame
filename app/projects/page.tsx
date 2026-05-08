import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { startups } from "@/lib/data";

export default function ProjectsPage() {
  return (
    <AppShell role="eic_admin">
      <PageHeader
        eyebrow="Projects"
        title="Every startup, checkpoint, XP count, and next action in scan range."
        description="A compact operating view for mentor standups and weekly staff reviews."
        actions={
          <a className="button primary" href="/api/export/cohort.csv">
            <Download aria-hidden="true" size={17} />
            Export
          </a>
        }
      />
      <section className="grid project-grid">
        {startups.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>
    </AppShell>
  );
}
