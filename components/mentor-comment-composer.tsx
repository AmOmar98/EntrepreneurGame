// Phase 8 / Plan 08 - Mentor comment composer (MNT-03).
// Client component: textarea + tag select + submit button wired to
// addEvaluationCommentFlow. Used both by Mentor (on /mentor/submission/[id])
// and Player (on /journey/deliverable/[id] revision panel) — the `audience`
// prop drives which tag options are shown and which hint copy is rendered.
"use client";

import { useActionState, useEffect, useRef } from "react";
import { addEvaluationCommentFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

export type MentorCommentComposerProps = {
  /** Submission the comment is tied to. */
  submissionId: string;
  /** Renders different hint copy + default tag depending on who's posting. */
  audience: "mentor" | "player";
};

export function MentorCommentComposer({
  submissionId,
  audience,
}: MentorCommentComposerProps) {
  const [state, formAction, pending] = useActionState(
    addEvaluationCommentFlow,
    initialState,
  );
  const formRef = useRef<HTMLFormElement | null>(null);

  // Reset the textarea after a successful publish (server revalidates the
  // page, so the new comment is already rendered above).
  useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset();
    }
  }, [state.ok]);

  const hint =
    audience === "mentor"
      ? t.mentor_comment_composer_hint
      : t.mentor_comment_composer_role_player_hint;

  return (
    <form
      action={formAction}
      aria-label="Ajouter un commentaire"
      className="eic-mentor-composer"
      ref={formRef}
    >
      <input name="submissionId" type="hidden" value={submissionId} />
      <label className="sr-only" htmlFor={`comment-body-${submissionId}`}>
        {t.mentor_comment_composer_placeholder}
      </label>
      <textarea
        className="eic-mentor-composer__textarea"
        id={`comment-body-${submissionId}`}
        maxLength={2000}
        name="body"
        placeholder={t.mentor_comment_composer_placeholder}
        required
        rows={2}
      />
      <div className="eic-mentor-composer__row">
        <span className="eic-mentor-composer__hint">{hint}</span>
        <label
          className="sr-only"
          htmlFor={`comment-tag-${submissionId}`}
        >
          {t.mentor_comment_composer_tag_label}
        </label>
        <select
          aria-label={t.mentor_comment_composer_tag_label}
          className="eic-mentor-composer__select"
          defaultValue={audience === "mentor" ? "remarque" : "remarque"}
          id={`comment-tag-${submissionId}`}
          name="tag"
        >
          <option value="remarque">{t.mentor_comment_tag_remark}</option>
          <option value="a_corriger">{t.mentor_comment_tag_fix}</option>
        </select>
        <button
          className="eic-mentor-composer__submit"
          disabled={pending}
          type="submit"
        >
          {pending
            ? t.mentor_comment_composer_submitting
            : t.mentor_comment_composer_submit}
        </button>
      </div>
      {state.message && !state.ok ? (
        <p className="eic-mentor-composer__error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
