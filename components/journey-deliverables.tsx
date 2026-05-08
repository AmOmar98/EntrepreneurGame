// Phase 2 / Plan 02 - Deliverable list with status badges + action links.
// Each row links to /journey/deliverable/[id] (Plan 03 will implement the page).
import Link from "next/link";
import { dictionaries } from "@/lib/i18n";
import type { DeliverableStatus, JourneyDeliverable } from "@/lib/journey";

const t = dictionaries.fr;

const STATUS_LABEL: Record<DeliverableStatus, string> = {
  a_rendre: t.journey_status_a_rendre,
  draft: t.journey_status_draft,
  submitted_v1: t.journey_status_submitted_v1,
  feedback_received: t.journey_status_feedback_received,
  submitted_v2: t.journey_status_submitted_v2,
  validated: t.journey_status_validated,
  rejected: t.journey_status_rejected,
};

const STATUS_STYLE: Record<DeliverableStatus, { bg: string; fg: string }> = {
  a_rendre: { bg: "#fef3c7", fg: "#92400e" },
  draft: { bg: "#e2e8f0", fg: "#475569" },
  submitted_v1: { bg: "#dbeafe", fg: "#1d4ed8" },
  feedback_received: { bg: "#fae8ff", fg: "#86198f" },
  submitted_v2: { bg: "#dbeafe", fg: "#1d4ed8" },
  validated: { bg: "#dcfce7", fg: "#15803d" },
  rejected: { bg: "#fee2e2", fg: "#b91c1c" },
};

function actionLabel(status: DeliverableStatus): string {
  switch (status) {
    case "a_rendre":
    case "draft":
      return t.journey_action_submit;
    case "submitted_v1":
      return t.journey_action_view_v1;
    case "feedback_received":
      return t.journey_action_resubmit_v2;
    case "submitted_v2":
      return t.journey_action_view_v1;
    case "validated":
    case "rejected":
      return t.journey_action_view_result;
  }
}

export function JourneyDeliverables({ deliverables }: { deliverables: JourneyDeliverable[] }) {
  return (
    <section aria-label={t.journey_today_deliverables}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 12px", color: "#0f172a" }}>
        {t.journey_today_deliverables}
      </h2>
      {deliverables.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{t.journey_no_deliverables}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {deliverables.map(({ template, status }) => {
            const palette = STATUS_STYLE[status];
            return (
              <li
                key={template.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 16,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{template.title}</h3>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: palette.bg,
                      color: palette.fg,
                      letterSpacing: 0.4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </div>
                {template.description ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>{template.description}</p>
                ) : null}
                <div>
                  <Link
                    href={`/journey/deliverable/${template.id}`}
                    style={{
                      display: "inline-block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#1d4ed8",
                      textDecoration: "none",
                      padding: "6px 12px",
                      border: "1px solid #1d4ed8",
                      borderRadius: 6,
                    }}
                  >
                    {actionLabel(status)}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
