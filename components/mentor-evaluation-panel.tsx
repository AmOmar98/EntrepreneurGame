// Phase 8 / Plan 08 - Mentor evaluation panel (MNT-04 + MNT-05).
// Refactored evaluation form. Three sections:
//   1. Rubric scoring (per-criterion numeric inputs, total readout)
//   2. Free-form feedback textarea (visible to the Player)
//   3. Verdict selector (validate_v1 / request_v2 / reject for V1 ;
//      validate_v2 / reject for V2)
// When verdict=request_v2 is selected, an "Action attendue" required input
// is revealed (MNT-04). On successful submit, the form locks and the
// MentorConfirmationBanner is rendered (MNT-05).
"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateSubmission, type WorkflowState } from "@/app/actions";
import {
  MentorConfirmationBanner,
  parseEvaluationToastPayload,
} from "@/components/mentor-confirmation-banner";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

type Verdict = "validate_v1" | "request_v2" | "validate_v2" | "reject";

export type MentorEvaluationPanelProps = {
  submissionId: string;
  version: 1 | 2;
  rubric: { key: string; label: string; max: number }[];
};

export function MentorEvaluationPanel({
  submissionId,
  version,
  rubric,
}: MentorEvaluationPanelProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    evaluateSubmission,
    initialState,
  );
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(rubric.map((c) => [c.key, 0])),
  );
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [expectedAction, setExpectedAction] = useState("");

  const total = useMemo(
    () => Object.values(scores).reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0),
    [scores],
  );
  const scoresJson = useMemo(() => JSON.stringify(scores), [scores]);

  const toastPayload = state.ok ? parseEvaluationToastPayload(state.message) : null;
  const locked = state.ok;

  useEffect(() => {
    if (state.ok) {
      // Refresh server data so the readonly summary appears below if the user
      // navigates back to this page.
      router.refresh();
    }
  }, [state.ok, router]);

  const updateScore = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  // MNT-02: segmented 0..max radio buttons with keyboard 0-5 shortcut
  // when the criterion row is focused.
  const handleSegmentKey = (e: React.KeyboardEvent, key: string, max: number) => {
    const n = Number(e.key);
    if (!Number.isNaN(n) && n >= 0 && n <= max) {
      updateScore(key, n);
    }
  };

  const verdictOptions: { value: Verdict; label: string; tone: "success" | "warning" | "danger" }[] =
    version === 1
      ? [
          { value: "validate_v1", label: t.evaluation_verdict_validate_v1, tone: "success" },
          { value: "request_v2", label: t.evaluation_verdict_request_v2, tone: "warning" },
          { value: "reject", label: t.evaluation_verdict_reject, tone: "danger" },
        ]
      : [
          { value: "validate_v2", label: t.evaluation_verdict_validate_v2, tone: "success" },
          { value: "reject", label: t.evaluation_verdict_reject, tone: "danger" },
        ];

  const expectedActionRequired = verdict === "request_v2";
  const expectedActionInvalid =
    expectedActionRequired && expectedAction.trim().length === 0;
  const submitDisabled = pending || locked || verdict === null || expectedActionInvalid;

  return (
    <form
      action={formAction}
      aria-label="Évaluation de la soumission"
      className={`eic-mentor-eval${locked ? " eic-mentor-eval__locked" : ""}`}
    >
      <input name="submissionId" type="hidden" value={submissionId} />
      <input name="scoresJson" type="hidden" value={scoresJson} />
      {verdict ? <input name="verdict" type="hidden" value={verdict} /> : null}

      <h2 className="eic-mentor-eval__title">{t.evaluation_title}</h2>

      <fieldset
        disabled={locked}
        style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}
      >
        {/* MNT-02: segmented rubric (0..max radio buttons per criterion) */}
        <div>
          <p className="eic-mentor-eval__legend">{t.evaluation_scores_legend}</p>
          <div className="eic-mentor-eval__rubric">
            {rubric.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "#5e5849" }}>—</p>
            ) : (
              rubric.map((c) => {
                const current = scores[c.key] ?? 0;
                const steps = Array.from({ length: c.max + 1 }, (_, i) => i);
                return (
                  <div
                    className="eic-mentor-eval__rubric-row"
                    key={c.key}
                    onKeyDown={(e) => handleSegmentKey(e, c.key, c.max)}
                  >
                    <span className="eic-mentor-eval__rubric-label">
                      <strong>{c.label}</strong>
                      <span className="eic-mentor-eval__rubric-max">(/{c.max})</span>
                    </span>
                    <fieldset
                      role="radiogroup"
                      aria-label={`${c.label} (max ${c.max})`}
                      style={{ border: "none", padding: 0, margin: 0, display: "flex", gap: 4, flexWrap: "wrap" }}
                    >
                      {steps.map((n) => {
                        const isActive = current === n;
                        return (
                          <label
                            key={n}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              border: isActive ? "2px solid #1e40af" : "1px solid #e2e8f0",
                              background: isActive ? "#1e40af" : "#f8fafc",
                              color: isActive ? "#fff" : "#334155",
                              fontWeight: isActive ? 700 : 400,
                              fontSize: 13,
                              cursor: locked ? "default" : "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="radio"
                              name={`rubric-${c.key}`}
                              value={n}
                              checked={isActive}
                              onChange={() => updateScore(c.key, n)}
                              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                              tabIndex={isActive ? 0 : -1}
                              aria-label={`${n}`}
                            />
                            {n}
                          </label>
                        );
                      })}
                    </fieldset>
                  </div>
                );
              })
            )}
            <p className="eic-mentor-eval__total">
              {t.evaluation_total_score}: {total}
            </p>
          </div>
        </div>

        <div>
          <label
            className="eic-mentor-eval__legend"
            htmlFor="mentor-eval-feedback"
            style={{ display: "block" }}
          >
            {t.evaluation_feedback_label}
          </label>
          <textarea
            className="eic-mentor-eval__textarea"
            id="mentor-eval-feedback"
            maxLength={4000}
            name="feedback"
            placeholder={t.evaluation_feedback_placeholder}
            rows={5}
          />
        </div>

        {expectedActionRequired ? (
          <div
            aria-labelledby="expected-action-label"
            className="eic-mentor-eval__expected"
          >
            <label
              className="eic-mentor-eval__expected-label"
              htmlFor="mentor-eval-expected-action"
              id="expected-action-label"
            >
              {t.mentor_action_expected_label}
              <span aria-hidden="true" className="eic-mentor-eval__expected-required">
                *
              </span>
            </label>
            <input
              aria-required="true"
              className="eic-mentor-eval__expected-input"
              id="mentor-eval-expected-action"
              maxLength={500}
              name="expectedAction"
              onChange={(e) => setExpectedAction(e.target.value)}
              placeholder={t.mentor_action_expected_placeholder}
              required
              type="text"
              value={expectedAction}
            />
            <p className="eic-mentor-eval__expected-hint">
              {t.mentor_action_expected_hint}
            </p>
            {expectedActionInvalid ? (
              <p
                className="eic-mentor-eval__expected-hint"
                role="alert"
                style={{ color: "#b91c1c" }}
              >
                {t.mentor_action_expected_required}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* MNT-03: sticky footer — verdict selector + submit button */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "#fff",
            borderTop: "1px solid #e2e8f0",
            padding: "12px 0 4px",
            marginTop: 4,
            zIndex: 10,
          }}
        >
          <div>
            <p className="eic-mentor-eval__legend" style={{ marginBottom: 8 }}>{t.evaluation_verdict_legend}</p>
            <div className="eic-mentor-eval__verdict-group" role="radiogroup">
              {verdictOptions.map((opt) => {
                const active = verdict === opt.value;
                return (
                  <button
                    aria-checked={active}
                    aria-label={opt.label}
                    className={`eic-mentor-eval__verdict-btn${active ? ` is-active--${opt.tone}` : ""}`}
                    key={opt.value}
                    onClick={() => setVerdict(opt.value)}
                    role="radio"
                    type="button"
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="eic-mentor-eval__submit"
            disabled={submitDisabled}
            style={{ marginTop: 10 }}
            type="submit"
          >
            {pending
              ? t.evaluation_submitting
              : locked
                ? t.mentor_evaluation_locked
                : t.evaluation_submit}
          </button>
        </div>
      </fieldset>

      {state.message && !state.ok ? (
        <p className="eic-mentor-eval__error" role="alert">
          {state.message}
        </p>
      ) : null}
      {toastPayload ? <MentorConfirmationBanner payload={toastPayload} /> : null}
    </form>
  );
}
