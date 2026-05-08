import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { checkpointLabel, journeyPhases } from "@/lib/data";

export default function JourneyPage() {
  return (
    <AppShell role="founder">
      <PageHeader
        eyebrow="Program workflow"
        title="From entering the program to post-bootcamp follow-up."
        description="A shared operating map for founders, coaches, and EIC staff. Every phase ends with a concrete proof or decision."
      />

      <section className="journey-board">
        {journeyPhases.map((phase, index) => (
          <article className="journey-phase" key={phase.id}>
            <div className="phase-index">
              <Badge tone={phase.checkpoint ? "blue" : "green"}>{index + 1}</Badge>
              <h2>{phase.label}</h2>
              <p className="muted">{phase.audience}</p>
              {phase.checkpoint ? <Badge tone="green">{checkpointLabel(phase.checkpoint)}</Badge> : null}
            </div>
            <div className="stack">
              <div>
                <h3>{phase.goal}</h3>
                <p className="muted">Output: {phase.output}</p>
              </div>
              <div className="phase-actions">
                <div className="role-action">
                  <strong>Founder</strong>
                  <p className="muted">{phase.founderAction}</p>
                </div>
                <div className="role-action">
                  <strong>Coach</strong>
                  <p className="muted">{phase.coachAction}</p>
                </div>
                <div className="role-action">
                  <strong>EIC</strong>
                  <p className="muted">{phase.eicAction}</p>
                </div>
              </div>
              <div className="mission-meta">
                <CheckCircle2 aria-hidden="true" color="var(--green)" size={18} />
                <span className="muted">Next phase starts only when this phase has a proof, decision, or owner.</span>
                {index < journeyPhases.length - 1 ? <ArrowRight aria-hidden="true" color="var(--muted)" size={18} /> : null}
              </div>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
