// Phase 7 / Plan 07-03 - Submission ticket displayed after a Player submits
// V1. Replaces the legacy <SubmissionReadonly> on the deliverable detail
// page when status === 'submitted_v1'.
//
// Visual: cream background + sunburst rays + gigantic "+XP" gradient + a
// rotated ticket card with a "SOUMIS" stamp rotated -12deg. Sentence
// soumise displays the proof URL or proof text submitted by the player.
//
// Wireframe direction provided in plan 07-04 (player-extras.jsx pattern,
// adapted to the EIC tokens). Rotation + sunburst are CSS-only, with
// prefers-reduced-motion guards on the gradient/pulse animations.
//
// PLR-06: ticket SOUMIS post-V1.
import Link from "next/link";
import { dictionaries } from "@/lib/i18n";
import type { Submission } from "@/lib/types";

const t = dictionaries.fr;

export type SubmissionTicketProps = {
  submission: Submission;
  // Title of the deliverable, surfaced on the ticket header.
  deliverableTitle: string;
  // XP reward for the deliverable; displayed in the gigantic +XP block.
  rewardXp: number;
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

function getProofPreview(submission: Submission): string {
  if (submission.kind === "proof_url" && submission.proofUrl) {
    return submission.proofUrl;
  }
  if (submission.kind === "proof_text" && submission.proofText) {
    const trimmed = submission.proofText.trim();
    return trimmed.length > 240 ? `${trimmed.slice(0, 237)}...` : trimmed;
  }
  return "";
}

export function SubmissionTicket({
  submission,
  deliverableTitle,
  rewardXp,
}: SubmissionTicketProps) {
  const proof = getProofPreview(submission);
  const isUrl = submission.kind === "proof_url";
  // quick-260519-uuy / Task 2 — descriptive aria-label for screen readers
  // (NVDA / VoiceOver). The base label stays in i18n; we append title,
  // version, and submission date for context. Decorative stamp + rays
  // remain aria-hidden.
  const ariaLabel = `${t.submission_ticket_aria} : ${deliverableTitle} - V${submission.version} - ${formatDateFr(submission.submittedAt)}`;

  return (
    <section
      aria-label={ariaLabel}
      className="eic-submission-ticket"
    >
      <div aria-hidden="true" className="eic-submission-ticket__rays" />

      <p className="eic-submission-ticket__xp" aria-label={`+${rewardXp} XP`}>
        +{rewardXp} XP
      </p>
      <p className="eic-submission-ticket__lead">
        {t.submission_ticket_lead}
      </p>

      <article className="eic-submission-ticket__card">
        <span aria-hidden="true" className="eic-submission-ticket__stamp">
          {t.submission_ticket_stamp}
        </span>
        <header className="eic-submission-ticket__header">
          <span className="eic-submission-ticket__kicker">
            {t.submission_ticket_kicker} V{submission.version}
          </span>
          <span className="eic-submission-ticket__date">
            {formatDateFr(submission.submittedAt)}
          </span>
        </header>
        <h2 className="eic-submission-ticket__title">{deliverableTitle}</h2>
        {proof ? (
          <div className="eic-submission-ticket__proof">
            <p className="eic-submission-ticket__proof-label">
              {isUrl
                ? t.submission_ticket_proof_url
                : t.submission_ticket_proof_text}
            </p>
            {isUrl ? (
              <a
                className="eic-submission-ticket__proof-link"
                href={proof}
                rel="noopener noreferrer"
                target="_blank"
              >
                {proof}
              </a>
            ) : (
              <p className="eic-submission-ticket__proof-quote">{proof}</p>
            )}
          </div>
        ) : null}
        <p className="eic-submission-ticket__hint">
          {t.submission_ticket_hint}
        </p>
      </article>

      <div className="eic-submission-ticket__cta">
        <Link className="eic-button eic-button--primary eic-button--lg" href="/journey">
          {t.submission_ticket_cta_back}
        </Link>
      </div>
    </section>
  );
}
