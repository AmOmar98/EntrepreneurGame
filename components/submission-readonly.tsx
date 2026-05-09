// Phase 2 / Plan 03 - Readonly view of an existing submission.
// Server component. Renders the locked banner + the proof content as submitted.
import type { Submission } from "@/lib/types";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const STATUS_LABEL: Record<Submission["status"], string> = {
  draft: t.journey_status_draft,
  submitted_v1: t.journey_status_submitted_v1,
  feedback_received: t.journey_status_feedback_received,
  submitted_v2: t.journey_status_submitted_v2,
  validated: t.journey_status_validated,
  rejected: t.journey_status_rejected,
};

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SubmissionReadonly({ submission }: { submission: Submission }) {
  const locked = submission.status === "submitted_v1";
  return (
    <section
      aria-label={t.submission_readonly_title}
      style={{
        marginTop: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {locked ? (
        <div
          role="status"
          style={{
            background: "#dbeafe",
            color: "#1d4ed8",
            border: "1px solid #93c5fd",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {t.submission_locked_banner}
        </div>
      ) : null}

      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 16,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
          {t.submission_readonly_title} V{submission.version}
        </h2>
        <dl
          style={{
            margin: 0,
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "6px 12px",
            fontSize: 13,
          }}
        >
          <dt style={{ color: "#64748b" }}>{t.submission_readonly_status}</dt>
          <dd style={{ margin: 0, color: "#0f172a" }}>{STATUS_LABEL[submission.status]}</dd>
          <dt style={{ color: "#64748b" }}>{t.submission_readonly_submitted_at}</dt>
          <dd style={{ margin: 0, color: "#0f172a" }}>{formatDateFr(submission.submittedAt)}</dd>
          <dt style={{ color: "#64748b" }}>{t.submission_readonly_kind}</dt>
          <dd style={{ margin: 0, color: "#0f172a" }}>
            {submission.kind === "proof_url"
              ? t.submission_kind_proof_url
              : t.submission_kind_proof_text}
          </dd>
        </dl>

        {submission.kind === "proof_url" && submission.proofUrl ? (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#64748b" }}>
              {t.submission_readonly_proof_url}
            </p>
            <a
              href={submission.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 14,
                color: "#1d4ed8",
                textDecoration: "underline",
                wordBreak: "break-all",
              }}
            >
              {submission.proofUrl}
            </a>
          </div>
        ) : null}

        {submission.kind === "proof_text" && submission.proofText ? (
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#64748b" }}>
              {t.submission_readonly_proof_text}
            </p>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "inherit",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#0f172a",
              }}
            >
              {submission.proofText}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
