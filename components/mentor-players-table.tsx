import Link from "next/link";
import { dictionaries } from "@/lib/i18n";
import type { MentorPlayerOverview } from "@/lib/mentor";

const t = dictionaries.fr;

function truncate(value: string | null, max: number): string {
  if (!value) return "";
  if (value.length <= max) return value;
  return value.slice(0, Math.max(0, max - 1)) + "...";
}

export function MentorPlayersTable({ rows }: { rows: MentorPlayerOverview[] }) {
  if (rows.length === 0) {
    return (
      <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>{t.mentor_empty}</p>
    );
  }

  return (
    <div className="eic-mentor-players-table" style={{ marginTop: 16 }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          color: "#0f172a",
        }}
      >
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
            <th scope="col" style={{ padding: "8px 12px", fontWeight: 600 }}>
              {t.mentor_col_team}
            </th>
            <th scope="col" style={{ padding: "8px 12px", fontWeight: 600 }}>
              {t.mentor_col_idea}
            </th>
            <th scope="col" style={{ padding: "8px 12px", fontWeight: 600 }}>
              {t.mentor_col_level}
            </th>
            <th scope="col" style={{ padding: "8px 12px", fontWeight: 600 }}>
              {t.mentor_col_score}
            </th>
            <th scope="col" style={{ padding: "8px 12px", fontWeight: 600 }}>
              {t.mentor_col_submitted}
            </th>
            <th scope="col" style={{ padding: "8px 12px", fontWeight: 600 }}>
              {t.mentor_col_pending}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pendingCount = row.pendingSubmissionIds.length;
            const firstPending = row.pendingSubmissionIds[0];
            return (
              <tr
                key={row.player.id}
                style={{ borderBottom: "1px solid #f1f5f9", verticalAlign: "top" }}
              >
                <td style={{ padding: "10px 12px", fontWeight: 500 }}>{row.player.name}</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>
                  {truncate(row.player.idea, 60) || "-"}
                </td>
                <td style={{ padding: "10px 12px" }}>{row.levelLabel}</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>
                  {Math.round(row.player.scoreProject)} pts
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {row.submittedCount}/{row.totalDeliverables}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {pendingCount > 0 && firstPending ? (
                    <Link
                      href={`/mentor/submission/${firstPending}`}
                      style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "4px 12px",
                        borderRadius: 8,
                        background: "#fef3c7",
                        color: "#92400e",
                        textDecoration: "none",
                        gap: 1,
                      }}
                      aria-label={`${t.mentor_review_action} (${pendingCount})`}
                    >
                      <span style={{ fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.2 }}>{pendingCount}</span>
                      <span style={{ fontSize: 11, fontWeight: 400, color: "#b45309" }}>{t.mentor_review_action}</span>
                    </Link>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
