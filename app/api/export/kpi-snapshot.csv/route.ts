import { csvResponse, toCsv } from "@/lib/csv";
import { bonusEvents, deliverables, startups, xpSummary } from "@/lib/data";

export function GET() {
  const accepted = deliverables.filter((item) => item.status === "accepted");
  const pending = deliverables.filter((item) => item.status === "submitted").length + bonusEvents.filter((item) => item.status === "submitted").length;
  const confirmedXp = startups.reduce((sum, project) => sum + xpSummary(project.id).confirmedXp, 0);
  const rows = [
    {
      metric: "active_startups",
      value: startups.filter((project) => project.status === "active").length,
      period_start: "2026-04-01",
      period_end: "2026-05-04",
    },
    {
      metric: "confirmed_xp",
      value: confirmedXp,
      period_start: "2026-04-01",
      period_end: "2026-05-04",
    },
    {
      metric: "deliverable_acceptance_rate",
      value: `${Math.round((accepted.length / deliverables.length) * 100)}%`,
      period_start: "2026-04-01",
      period_end: "2026-05-04",
    },
    {
      metric: "pending_validations",
      value: pending,
      period_start: "2026-04-01",
      period_end: "2026-05-04",
    },
  ];

  return csvResponse("kpi-snapshot.csv", toCsv(rows));
}
