"use client";
// Phase 9 / GMR-04 — Jury pitch theater 5-criteria grid /5.
//
// Reuses savePitchScoreFlow (Phase 5) under the hood: the existing schema
// stores c1..c5 each on a 0..20 scale. To preserve backward compatibility,
// the theater UI exposes a /5 grid and multiplies each value by 4 before
// submitting (1-to-1 mapping: 1/5 -> 4/20, 5/5 -> 20/20).
import { useActionState, useState } from "react";
import { savePitchScoreFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import type { PitchScore, Player } from "@/lib/types";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

type CriterionKey = "c1" | "c2" | "c3" | "c4" | "c5";

type Props = {
  player: Player;
  eventId: string;
  existing: PitchScore | null;
  jurorVotedCount: number;
};

const CRITERIA: { key: CriterionKey; label: string }[] = [
  { key: "c1", label: t.jury_c1_label },
  { key: "c2", label: t.jury_c2_label },
  { key: "c3", label: t.jury_c3_label },
  { key: "c4", label: t.jury_c4_label },
  { key: "c5", label: t.jury_c5_label },
];

const SCALE = [1, 2, 3, 4, 5];

function toFiveScale(value: number): number {
  // Map 0..20 -> 0..5 by integer division (5*4=20). 0 stays 0.
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value / 4)));
}

export function JuryPitchGrid({
  player,
  eventId,
  existing,
  jurorVotedCount,
}: Props) {
  const [state, formAction, pending] = useActionState(
    savePitchScoreFlow,
    initialState,
  );
  const [scores, setScores] = useState<Record<CriterionKey, number>>({
    c1: toFiveScale(existing?.c1 ?? 0),
    c2: toFiveScale(existing?.c2 ?? 0),
    c3: toFiveScale(existing?.c3 ?? 0),
    c4: toFiveScale(existing?.c4 ?? 0),
    c5: toFiveScale(existing?.c5 ?? 0),
  });
  const [comment, setComment] = useState<string>("");

  function setScore(key: CriterionKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form action={formAction} className="eic-jury-grid">
      <div className="eic-jury-grid__header">
        <h2 className="eic-jury-grid__title">{t.jury_pitch_grid_title}</h2>
        <p
          aria-live="polite"
          className="eic-jury-grid__voted"
        >
          {t.jury_pitch_jurors_voted.replace(
            "{n}",
            String(Math.max(0, Math.min(5, jurorVotedCount))),
          )}
        </p>
      </div>

      <input name="playerId" type="hidden" value={player.id} />
      <input name="eventId" type="hidden" value={eventId} />
      {CRITERIA.map((c) => (
        <input
          key={`${c.key}-hidden`}
          name={c.key}
          type="hidden"
          value={scores[c.key] * 4}
        />
      ))}

      <div className="eic-jury-grid__rows">
        {CRITERIA.map((c) => (
          <fieldset className="eic-jury-grid__row" key={c.key}>
            <legend className="eic-jury-grid__row-label">{c.label}</legend>
            <div className="eic-jury-grid__scale" role="radiogroup">
              {SCALE.map((v) => {
                const checked = scores[c.key] === v;
                return (
                  <label
                    className={
                      checked
                        ? "eic-jury-grid__cell eic-jury-grid__cell--checked"
                        : "eic-jury-grid__cell"
                    }
                    key={v}
                  >
                    <input
                      checked={checked}
                      name={`${c.key}-radio`}
                      onChange={() => setScore(c.key, v)}
                      type="radio"
                      value={v}
                    />
                    <span>{v}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <label className="eic-jury-grid__comment">
        <span>{t.jury_pitch_grid_comment_label}</span>
        <textarea
          maxLength={1000}
          name="comment"
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.jury_pitch_grid_comment_placeholder}
          rows={2}
          value={comment}
        />
      </label>

      <div className="eic-jury-grid__actions">
        <button
          className="eic-button eic-button--success eic-button--lg"
          disabled={pending}
          type="submit"
        >
          {pending ? t.jury_saving : t.jury_save}
        </button>
        {state.message ? (
          <p
            className={
              state.ok
                ? "eic-jury-grid__msg eic-jury-grid__msg--ok"
                : "eic-jury-grid__msg eic-jury-grid__msg--err"
            }
            role="status"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
