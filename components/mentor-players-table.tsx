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
    <div style={{ marginTop: 16, overflowX: "auto" }}>
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
                <td style={{ padding: "10px 12px" }}>{row.player.scoreProject.toFixed(2)}</td>
                <td style={{ padding: "10px 12px" }}>
                  {row.submittedCount}/{row.totalDeliverables}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {pendingCount > 0 && firstPending ? (
                    <Link
                      href={`/mentor/submission/${firstPending}`}
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#fef3c7",
                        color: "#92400e",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                      aria-label={`${t.mentor_review_action} (${pendingCount})`}
                    >
                      {pendingCount} - {t.mentor_review_action}
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
