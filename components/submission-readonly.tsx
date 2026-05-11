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
      className="eic-submission-readonly"
    >
      {locked ? (
        <div role="status" className="eic-submission-readonly__locked-banner">
          {t.submission_locked_banner}
        </div>
      ) : null}

      <div className="eic-submission-readonly__card">
        <h2 className="eic-submission-readonly__title">
          {t.submission_readonly_title} V{submission.version}
        </h2>
        <dl className="eic-submission-readonly__dl">
          <dt className="eic-submission-readonly__dt">{t.submission_readonly_status}</dt>
          <dd className="eic-submission-readonly__dd">{STATUS_LABEL[submission.status]}</dd>
          <dt className="eic-submission-readonly__dt">{t.submission_readonly_submitted_at}</dt>
          <dd className="eic-submission-readonly__dd">{formatDateFr(submission.submittedAt)}</dd>
          <dt className="eic-submission-readonly__dt">{t.submission_readonly_kind}</dt>
          <dd className="eic-submission-readonly__dd">
            {submission.kind === "proof_url"
              ? t.submission_kind_proof_url
              : t.submission_kind_proof_text}
          </dd>
        </dl>

        {submission.kind === "proof_url" && submission.proofUrl ? (
          <div>
            <p className="eic-submission-readonly__proof-label">
              {t.submission_readonly_proof_url}
            </p>
            <a
              href={submission.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="eic-submission-readonly__proof-link"
            >
              {submission.proofUrl}
            </a>
          </div>
        ) : null}

        {submission.kind === "proof_text" && submission.proofText ? (
          <div>
            <p className="eic-submission-readonly__proof-label">
              {t.submission_readonly_proof_text}
            </p>
            <pre className="eic-submission-readonly__pre">
              {submission.proofText}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
