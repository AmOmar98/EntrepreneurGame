// Phase 2 / Plan 03 - Readonly view of an existing submission.
// Server component. Renders the locked banner + the proof content as submitted.
import { DeliverableScoreBlock } from "@/components/deliverable-score-block";
import type { RubricCriterion, Submission, Verdict } from "@/lib/types";
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

export type SubmissionReadonlyProps = {
  submission: Submission;
  // R1 revised — optional Player-visible score block. Provided only on the
  // deliverable detail page when an evaluation row exists for this submission.
  // quick-260519-uuy : also includes mentor `feedback` (text) and
  // `expectedAction` rendered in a dedicated card below the score block.
  // `verdict` is included for type symmetry with the page-level query but is
  // intentionally NOT rendered (R1 preserved — no rank/score leak).
  evaluation?: {
    totalScore: number;
    scores: Record<string, number>;
    feedback: string;
    expectedAction: string | null;
    verdict: Verdict;
  } | null;
  maxScore?: number;
  rubric?: RubricCriterion[];
};

export function SubmissionReadonly({
  submission,
  evaluation,
  maxScore,
  rubric,
}: SubmissionReadonlyProps) {
  const locked = submission.status === "submitted_v1";
  const showScore =
    evaluation != null && typeof maxScore === "number" && Array.isArray(rubric);
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

        {showScore && evaluation && rubric ? (
          <DeliverableScoreBlock
            maxScore={maxScore as number}
            rubric={rubric}
            scores={evaluation.scores}
            totalScore={evaluation.totalScore}
          />
        ) : null}

        {/* quick-260519-uuy / Task 1 — Render mentor text feedback (and
            optional expected action) on the deliverable detail page for
            statuses validated / rejected / submitted_v2. The
            `feedback_received` status keeps using RevisionPanel (different
            branch in app/journey/deliverable/[id]/page.tsx) so no double
            render occurs. R1 preserved : text only, no score/rank/percentile. */}
        {evaluation?.feedback && evaluation.feedback.trim().length > 0 ? (
          <section
            aria-label={t.mentor_feedback_card_title}
            className="eic-submission-readonly__mentor-feedback"
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 8,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 14,
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              {t.mentor_feedback_card_title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#0f172a",
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
              }}
            >
              {evaluation.feedback}
            </p>
            {evaluation.expectedAction &&
            evaluation.expectedAction.trim().length > 0 ? (
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 12,
                  color: "#475569",
                }}
              >
                <strong>{t.mentor_feedback_expected_action_label}</strong> :{" "}
                {evaluation.expectedAction}
              </p>
            ) : null}
          </section>
        ) : null}

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
