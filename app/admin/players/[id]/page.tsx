// Phase 4 / Plan 03 - GameMaster Player detail page.
// Server component rendering meta + members + submissions + evaluations for a
// single Player. Reachable from /admin via deep link.
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { getPlayerDetail } from "@/lib/admin-player-detail";
import type {
  PlayerDetail,
  PlayerDetailMember,
  PlayerDetailSubmission,
} from "@/lib/admin-player-detail";
import type { PlayerStatus, SubmissionStatus, Verdict } from "@/lib/types";

const t = dictionaries.fr;

const SHELL_MAIN_STYLE: React.CSSProperties = { padding: 24, maxWidth: 1100 };

function BackLink() {
  return (
    <p style={{ margin: "0 0 16px" }}>
      <Link href="/admin" style={{ fontSize: 13, color: "#1d4ed8", textDecoration: "none" }}>
        {"← "}
        {t.admin_detail_back}
      </Link>
    </p>
  );
}

function statusLabel(status: PlayerStatus | SubmissionStatus): string {
  switch (status) {
    case "active":
      return "Actif";
    case "eliminated":
      return "Elimine";
    case "completed":
      return "Termine";
    case "draft":
      return t.journey_status_draft;
    case "submitted_v1":
      return t.journey_status_submitted_v1;
    case "feedback_received":
      return t.journey_status_feedback_received;
    case "submitted_v2":
      return t.journey_status_submitted_v2;
    case "validated":
      return t.journey_status_validated;
    case "rejected":
      return t.journey_status_rejected;
    default:
      return String(status);
  }
}

function verdictLabel(v: Verdict): string {
  switch (v) {
    case "validate_v1":
      return t.feedback_verdict_validate_v1;
    case "validate_v2":
      return t.feedback_verdict_validate_v2;
    case "request_v2":
      return t.feedback_verdict_request_v2;
    case "reject":
      return t.feedback_verdict_reject;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR");
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const detail = await getPlayerDetail(id);

  if (!detail) {
    return (
      <AppShell role={role ?? "game_master"} variant="staff">
        <main style={SHELL_MAIN_STYLE}>
          <BackLink />
          <p style={{ color: "#64748b", fontSize: 14 }}>{t.admin_detail_not_found}</p>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell role={role ?? "game_master"} variant="staff">
      <main style={SHELL_MAIN_STYLE}>
        <BackLink />
        <HeaderCard detail={detail} />
        <MembersSection members={detail.members} />
        <SubmissionsSection submissions={detail.submissions} />
      </main>
    </AppShell>
  );
}

// ----------------------------------------------------------------------------
// Sections
// ----------------------------------------------------------------------------

function HeaderCard({ detail }: { detail: PlayerDetail }) {
  const { player, levelLabel } = detail;
  return (
    <section
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 16,
        background: "#fff",
        marginBottom: 20,
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: "#0f172a" }}>
        {player.name}
      </h1>
      <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>
        <span style={{ marginRight: 12 }}>
          <strong style={{ color: "#475569" }}>{t.admin_detail_slug}:</strong> {player.slug}
        </span>
        <span style={{ marginRight: 12 }}>
          <strong style={{ color: "#475569" }}>{t.admin_detail_status}:</strong>{" "}
          <PlayerStatusBadge status={player.status} />
        </span>
        <span>
          <strong style={{ color: "#475569" }}>{t.admin_detail_level}:</strong> {levelLabel}
        </span>
      </p>

      {player.idea ? (
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
            {t.admin_detail_idea}
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "#0f172a", whiteSpace: "pre-wrap" }}>
            {player.idea}
          </p>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <ScoreTile
          label={t.admin_detail_score_project}
          value={Number(player.scoreProject).toFixed(1)}
        />
        <ScoreTile
          label={t.admin_detail_score_engagement}
          value={Number(player.scoreEngagement).toFixed(1)}
        />
        <ScoreTile
          label={t.admin_detail_onboarded_at}
          value={player.onboardedAt ? formatDate(player.onboardedAt) : t.admin_detail_not_onboarded}
        />
      </div>
    </section>
  );
}

function MembersSection({ members }: { members: PlayerDetailMember[] }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}>
        {t.admin_detail_members_title}
      </h2>
      {members.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>{t.admin_detail_no_members}</p>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                <th style={th}>{t.admin_detail_member_email}</th>
                <th style={th}>{t.admin_detail_member_full_name}</th>
                <th style={th}>{t.admin_detail_member_role}</th>
                <th style={th}>{t.admin_detail_member_joined}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((row) => (
                <tr key={row.member.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>{row.email ?? "-"}</td>
                  <td style={td}>{row.fullName ?? "-"}</td>
                  <td style={td}>{row.member.teamRole}</td>
                  <td style={td}>{formatDate(row.member.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SubmissionsSection({ submissions }: { submissions: PlayerDetailSubmission[] }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}>
        {t.admin_detail_submissions_title}
      </h2>
      {submissions.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>{t.admin_detail_no_submission}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {submissions.map((row) => (
            <SubmissionCard key={row.submission.id} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function SubmissionCard({ row }: { row: PlayerDetailSubmission }) {
  const { submission, templateTitle, evaluations } = row;
  return (
    <article
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 14,
        background: "#fff",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px", color: "#0f172a" }}>
            {templateTitle || "(template inconnu)"}
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>
            <span style={{ marginRight: 10 }}>
              <strong>{t.admin_detail_submission_version}:</strong> V{submission.version}
            </span>
            <span style={{ marginRight: 10 }}>
              <strong>{t.admin_detail_submission_kind}:</strong> {submission.kind}
            </span>
            <span>
              <strong>{t.admin_detail_submission_at}:</strong> {formatDate(submission.submittedAt)}
            </span>
          </p>
        </div>
        <SubmissionStatusBadge status={submission.status} />
      </header>

      {submission.kind === "proof_url" && submission.proofUrl ? (
        <p style={{ margin: "0 0 8px", fontSize: 13 }}>
          <a
            href={submission.proofUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#1d4ed8" }}
          >
            {t.admin_detail_submission_proof_url}
          </a>{" "}
          <span style={{ color: "#64748b" }}>({submission.proofUrl})</span>
        </p>
      ) : null}

      {submission.kind === "proof_text" && submission.proofText ? (
        <div style={{ marginBottom: 8 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#475569", fontWeight: 600 }}>
            {t.admin_detail_submission_proof_text}
          </p>
          <pre
            style={{
              margin: 0,
              padding: 10,
              background: "#f1f5f9",
              borderRadius: 6,
              fontSize: 13,
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              color: "#0f172a",
            }}
          >
            {submission.proofText.length > 200
              ? `${submission.proofText.slice(0, 200)}...`
              : submission.proofText}
          </pre>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: "1px dashed #e2e8f0",
        }}
      >
        <p style={{ margin: "0 0 6px", fontSize: 12, color: "#475569", fontWeight: 600 }}>
          {t.admin_detail_evaluations_title}
        </p>
        {evaluations.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
            {t.admin_detail_no_evaluation}
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {evaluations.map((ev) => (
              <li
                key={ev.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: 10,
                  background: "#f8fafc",
                }}
              >
                <p style={{ margin: "0 0 4px", fontSize: 13 }}>
                  <strong>{t.admin_detail_eval_verdict}:</strong> {verdictLabel(ev.verdict)}
                  {"  "}
                  <strong style={{ marginLeft: 12 }}>{t.admin_detail_eval_total}:</strong>{" "}
                  {Number(ev.totalScore).toFixed(1)}
                </p>
                {ev.feedback ? (
                  <div>
                    <p
                      style={{
                        margin: "0 0 2px",
                        fontSize: 12,
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      {t.admin_detail_eval_feedback}
                    </p>
                    <pre
                      style={{
                        margin: 0,
                        padding: 8,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        fontSize: 12,
                        whiteSpace: "pre-wrap",
                        fontFamily: "inherit",
                        color: "#0f172a",
                      }}
                    >
                      {ev.feedback}
                    </pre>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

// ----------------------------------------------------------------------------
// Small UI atoms
// ----------------------------------------------------------------------------

function ScoreTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "10px 12px",
        background: "#f8fafc",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function PlayerStatusBadge({ status }: { status: PlayerStatus }) {
  const map: Record<PlayerStatus, { bg: string; fg: string }> = {
    active: { bg: "#dcfce7", fg: "#166534" },
    eliminated: { bg: "#fee2e2", fg: "#991b1b" },
    completed: { bg: "#e0e7ff", fg: "#3730a3" },
  };
  const s = map[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const map: Record<SubmissionStatus, { bg: string; fg: string }> = {
    draft: { bg: "#f1f5f9", fg: "#475569" },
    submitted_v1: { bg: "#e0e7ff", fg: "#3730a3" },
    feedback_received: { bg: "#fef3c7", fg: "#92400e" },
    submitted_v2: { bg: "#e0e7ff", fg: "#3730a3" },
    validated: { bg: "#dcfce7", fg: "#166534" },
    rejected: { bg: "#fee2e2", fg: "#991b1b" },
  };
  const s = map[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

const th: React.CSSProperties = {
  padding: "10px 12px",
  fontWeight: 600,
  color: "#475569",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  color: "#0f172a",
};
