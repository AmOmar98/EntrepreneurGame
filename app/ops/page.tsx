import { CheckCircle2, Circle, Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { opsChecklist, risks } from "@/lib/data";

export default function OpsPage() {
  return (
    <AppShell role="eic_admin">
      <PageHeader
        eyebrow="Ops runbook"
        title="Pilot launch checklist and technical risk register."
        description="The operational layer from the artifact, condensed into the staff-facing app."
        actions={
          <a className="button primary" href="/api/export/kpi-snapshot.csv">
            <Download aria-hidden="true" size={17} />
            KPI CSV
          </a>
        }
      />
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <h2>Pilot checklist</h2>
          </div>
          <div className="panel-body">
            <ul className="small-list">
              {opsChecklist.map((item) => {
                const Icon = item.done ? CheckCircle2 : Circle;
                return (
                  <li key={item.date}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon aria-hidden="true" color={item.done ? "var(--green)" : "var(--muted)"} size={19} />
                      <span>
                        <strong>{item.date}: {item.title}</strong>
                        <br />
                        <span className="muted">{item.owner}</span>
                      </span>
                    </span>
                    <Badge tone={item.done ? "green" : "gold"}>{item.done ? "done" : "open"}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Risk register</h2>
          </div>
          <div className="panel-body">
            <ul className="small-list">
              {risks.map((risk) => (
                <li key={risk.id}>
                  <span>
                    <strong>{risk.id} {risk.label}</strong>
                    <br />
                    <span className="muted">{risk.mitigation}</span>
                  </span>
                  <Badge tone={risk.level === "Critical" || risk.level === "High" ? "red" : "gold"}>
                    {risk.level}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
