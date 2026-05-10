// Phase 7 / Plan 07-04 - Revision V2 panel (PLR-07).
// Replaces the legacy <SubmissionFeedbackCard> + <SubmissionForm V2> pair
// when a V1 submission has verdict=request_v2. Shows:
//   - mentor message (avatar + tag + text)
//   - checklist "passe / manque" parsed from feedback_text (best-effort)
//   - pedagogical green banner ("V1 conservee, pas de perte d'XP")
//   - submission form V2 (reuse <SubmissionForm version=2>)
//   - collapsible "Voir la V1 originale"
//
// Feedback parsing convention (pilot-grade): each line starting with
//   "✓ "  or "* "    -> passes
//   "⚠ "  or "! "    -> missing
//   "- "  / plain    -> ignored / treated as a free-form note
// Free-form messages without markers fall back to a single block displayed
// as the mentor's quote.
//
// TODO Phase 8: replace this heuristic by a structured `feedback_items`
// table (or rubric-driven check items) once Mentor flow supports it.
"use client";

import { useState } from "react";
import { SubmissionForm } from "@/components/submission-form";
import { dictionaries } from "@/lib/i18n";
import type { RubricCriterion, Submission, Verdict } from "@/lib/types";

const t = dictionaries.fr;

type Evaluation = {
  scores: Record<string, number>;
  totalScore: number;
  feedback: string;
  verdict: Verdict;
};

export type RevisionPanelProps = {
  deliverableTemplateId: string;
  deliverableTitle: string;
  evaluation: Evaluation;
  rubric: RubricCriterion[];
  rewardXp: number;
  // Latest V1 submission, surfaced in the collapsible block.
  previousSubmission: Submission | null;
};

type ChecklistItem = { kind: "pass" | "miss"; text: string };

// Pure helper: parse a feedback string into checklist items.
function parseChecklist(feedback: string): {
  items: ChecklistItem[];
  freeText: string;
} {
  const items: ChecklistItem[] = [];
  const freeLines: string[] = [];
  for (const rawLine of feedback.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    if (line.startsWith("✓") || line.startsWith("* ")) {
      items.push({ kind: "pass", text: line.replace(/^✓\s*|^\*\s*/, "") });
    } else if (line.startsWith("⚠") || line.startsWith("! ") || /^manque\b/i.test(line)) {
      items.push({ kind: "miss", text: line.replace(/^⚠\s*|^!\s*|^manque[:\s]*/i, "") });
    } else {
      freeLines.push(line);
    }
  }
  return { items, freeText: freeLines.join(" ").trim() };
}

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

export function RevisionPanel({
  deliverableTemplateId,
  deliverableTitle,
  evaluation,
  rewardXp,
  previousSubmission,
}: RevisionPanelProps) {
  const [showV1, setShowV1] = useState(false);
  const { items: checklist, freeText } = parseChecklist(evaluation.feedback);
  const passes = checklist.filter((c) => c.kind === "pass");
  const misses = checklist.filter((c) => c.kind === "miss");

  // Display fallback: if the parser found no markers, show the entire
  // feedback as the mentor's quote (no checklist).
  const mentorQuote =
    checklist.length === 0
      ? evaluation.feedback.trim() || t.revision_no_feedback
      : freeText || t.revision_no_feedback;

  return (
    <section aria-labelledby="revision-title" className="eic-revision">
      <p className="eic-revision__kicker">{t.revision_kicker}</p>
      <h1 className="eic-revision__title" id="revision-title">
        {t.revision_title_prefix}{" "}
        <em className="eic-revision__title-em">{t.revision_title_em}</em>
      </h1>
      <p className="eic-revision__lead">{t.revision_lead}</p>

      <div
        aria-label={t.revision_mentor_section_aria}
        className="eic-glass eic-revision__mentor"
      >
        <span aria-hidden="true" className="eic-revision__mentor-avatar">
          M
        </span>
        <div className="eic-revision__mentor-body">
          <p className="eic-revision__mentor-quote">{mentorQuote}</p>
        </div>
      </div>

      {checklist.length > 0 ? (
        <div className="eic-revision__checklists">
          {passes.length > 0 ? (
            <div className="eic-revision__checklist eic-revision__checklist--pass">
              <p className="eic-revision__checklist-kicker">{t.revision_checklist_pass}</p>
              <ul>
                {passes.map((c, i) => (
                  <li key={`p${i}`}>
                    <span aria-hidden="true" className="eic-revision__bullet is-pass">
                      ✓
                    </span>
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {misses.length > 0 ? (
            <div className="eic-revision__checklist eic-revision__checklist--miss">
              <p className="eic-revision__checklist-kicker">{t.revision_checklist_missing}</p>
              <ul>
                {misses.map((c, i) => (
                  <li key={`m${i}`}>
                    <span aria-hidden="true" className="eic-revision__bullet is-miss">
                      !
                    </span>
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="eic-revision__banner" role="note">
        <span aria-hidden="true" className="eic-revision__banner-icon">
          ↺
        </span>
        <p className="eic-revision__banner-text">
          <strong>{t.revision_pedagogical_banner_strong}</strong>{" "}
          {t.revision_pedagogical_banner_body}
        </p>
        <span className="eic-revision__banner-xp">{rewardXp} XP</span>
      </div>

      <div className="eic-revision__form">
        <p className="eic-revision__kicker">{t.revision_form_kicker}</p>
        <SubmissionForm deliverableTemplateId={deliverableTemplateId} version={2} />
      </div>

      {previousSubmission ? (
        <div className="eic-revision__v1">
          <button
            aria-expanded={showV1}
            className="eic-revision__v1-toggle"
            onClick={() => setShowV1((v) => !v)}
            type="button"
          >
            {showV1 ? t.revision_v1_toggle_hide : t.revision_v1_toggle_show}
          </button>
          {showV1 ? (
            <div className="eic-revision__v1-body">
              <p className="eic-revision__v1-meta">
                <strong>{deliverableTitle}</strong> · V{previousSubmission.version} ·{" "}
                {formatDateFr(previousSubmission.submittedAt)}
              </p>
              {previousSubmission.kind === "proof_url" && previousSubmission.proofUrl ? (
                <a
                  className="eic-revision__v1-link"
                  href={previousSubmission.proofUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {previousSubmission.proofUrl}
                </a>
              ) : null}
              {previousSubmission.kind === "proof_text" && previousSubmission.proofText ? (
                <pre className="eic-revision__v1-text">{previousSubmission.proofText}</pre>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
