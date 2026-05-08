import { csvResponse, toCsv } from "@/lib/csv";
import { bonusEvents, bonusRules, deliverables, getStartup } from "@/lib/data";

export function GET() {
  const deliverableRows = deliverables
    .filter((item) => item.status !== "accepted")
    .map((item) => ({
      item_id: item.id,
      item_type: "deliverable",
      project_name: getStartup(item.projectId)?.name ?? item.projectId,
      title: item.title,
      submitted_at: item.submittedAt,
      status: item.status,
      xp: item.baseXp,
      assigned_reviewer_email: getStartup(item.projectId)?.coach.email ?? "eic@uemf.ma",
    }));
  const bonusRows = bonusEvents
    .filter((item) => item.status !== "accepted")
    .map((item) => ({
      item_id: item.id,
      item_type: "bonus",
      project_name: getStartup(item.projectId)?.name ?? item.projectId,
      title: `${item.title} (${bonusRules[item.type].label})`,
      submitted_at: item.submittedAt,
      status: item.status,
      xp: item.claimedXp,
      assigned_reviewer_email: getStartup(item.projectId)?.coach.email ?? "eic@uemf.ma",
    }));

  return csvResponse("review-queue.csv", toCsv([...deliverableRows, ...bonusRows]));
}
